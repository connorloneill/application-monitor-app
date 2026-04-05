import { useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import type { CodeSnippet } from '../types'

interface CodeSnippetViewerProps {
  snippet: CodeSnippet
}

function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    css: 'css',
    html: 'markup',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
  }
  return map[ext] ?? 'typescript'
}

export default function CodeSnippetViewer({ snippet }: CodeSnippetViewerProps) {
  const [copied, setCopied] = useState(false)
  const language = getLanguage(snippet.filePath)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-700 my-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 text-sm">
        <span className="font-mono truncate">{snippet.filePath}</span>
        <div className="flex items-center gap-3">
          {snippet.confidence !== undefined && (
            <span className="text-xs text-gray-400">
              {Math.round(snippet.confidence * 100)}% confidence
            </span>
          )}
          <button
            onClick={handleCopy}
            className="text-xs hover:text-white transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <Highlight theme={themes.nightOwl} code={snippet.content} language={language}>
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              style={{ ...style, margin: 0, padding: '1rem' }}
              className="text-sm leading-relaxed"
            >
              {tokens.map((line, i) => {
                const lineNumber = snippet.startLine + i
                return (
                  <div key={i} {...getLineProps({ line })}>
                    <span className="inline-block w-12 text-right mr-4 text-gray-500 select-none">
                      {lineNumber}
                    </span>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                )
              })}
            </pre>
          )}
        </Highlight>
      </div>

      {/* Explanation */}
      {snippet.explanation && (
        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border-t border-gray-700 text-sm text-amber-800 dark:text-amber-200">
          {snippet.explanation}
        </div>
      )}
    </div>
  )
}
