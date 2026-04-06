import { useState, useRef, useEffect, useCallback } from 'react'
import { streamDevChat } from '../../services/devToolsApi'

interface DeveloperChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialQuestion?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const MODELS = [
  { id: 'anthropic.claude-sonnet-4-6', label: 'Claude Sonnet 4' },
  { id: 'anthropic.claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
]

export default function DeveloperChatDrawer({
  isOpen,
  onClose,
  initialQuestion,
}: DeveloperChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [modelId, setModelId] = useState(
    () => localStorage.getItem('devtools_chat_model') ?? MODELS[0].id
  )
  const [width, setWidth] = useState(
    () => parseInt(localStorage.getItem('devtools_chat_width') ?? '420', 10)
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const resizingRef = useRef(false)
  const initialQuestionSent = useRef<string | undefined>()

  // Auto-send initial question from node click
  useEffect(() => {
    if (isOpen && initialQuestion && initialQuestion !== initialQuestionSent.current) {
      initialQuestionSent.current = initialQuestion
      setInput('')
      sendMessage(initialQuestion)
    }
  }, [isOpen, initialQuestion])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save model preference
  useEffect(() => {
    localStorage.setItem('devtools_chat_model', modelId)
  }, [modelId])

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return

    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
    setMessages([...newMessages, assistantMsg])

    abortRef.current = new AbortController()
    try {
      await streamDevChat(
        newMessages,
        modelId,
        (chunk) => {
          assistantMsg.content += chunk
          setMessages((prev) => [...prev.slice(0, -1), { ...assistantMsg }])
        },
        abortRef.current.signal
      )
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        assistantMsg.content += '\n\n[Error: Failed to get response]'
        setMessages((prev) => [...prev.slice(0, -1), { ...assistantMsg }])
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const clearChat = () => {
    if (streaming && abortRef.current) abortRef.current.abort()
    setMessages([])
    initialQuestionSent.current = undefined
  }

  // Resize handle
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = true

    const handleMouseMove = (e: MouseEvent) => {
      if (resizingRef.current) {
        const newWidth = Math.max(320, Math.min(800, window.innerWidth - e.clientX))
        setWidth(newWidth)
        localStorage.setItem('devtools_chat_width', String(newWidth))
      }
    }

    const handleMouseUp = () => {
      resizingRef.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  if (!isOpen) return null

  return (
    <div
      className="fixed top-0 right-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col z-50"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-secondary transition-colors"
        onMouseDown={handleResizeStart}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Developer Chat</h3>
        <div className="flex items-center gap-2">
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="text-xs bg-gray-100 dark:bg-gray-700 border-0 rounded px-2 py-1 text-gray-700 dark:text-gray-300"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <button
            onClick={clearChat}
            className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            title="Clear chat"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8">
            Ask questions about the application architecture, code, or system design.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm ${
              msg.role === 'user'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-200'
                : 'bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200'
            } rounded-lg p-3`}
          >
            <p className="text-xs font-medium mb-1 opacity-60">
              {msg.role === 'user' ? 'You' : 'Assistant'}
            </p>
            <div className="whitespace-pre-wrap text-xs">{msg.content}</div>
          </div>
        ))}
        {streaming && (
          <p className="text-xs text-gray-400 animate-pulse">Generating response...</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the architecture..."
            disabled={streaming}
            className="flex-1 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-secondary"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="px-3 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-accent rounded-md transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
