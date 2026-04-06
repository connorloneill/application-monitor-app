import { useEffect, useRef, useState, useCallback } from 'react'
import mermaid from 'mermaid'

interface MermaidDiagramProps {
  definition: string
  onNodeClick?: (nodeId: string) => void
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
})

let renderCounter = 0

export default function MermaidDiagram({ definition, onNodeClick }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  // Expose click handler globally for Mermaid's click directives
  useEffect(() => {
    if (onNodeClick) {
      (window as Record<string, unknown>).__onMermaidNodeClick = onNodeClick
    }
    return () => {
      delete (window as Record<string, unknown>).__onMermaidNodeClick
    }
  }, [onNodeClick])

  useEffect(() => {
    const render = async () => {
      if (!containerRef.current) return

      // Parse diagram to extract node IDs and inject click directives
      const lines = definition.trim().split('\n')
      const nodeIdRegex = /^\s*(\w+)[[("{]/
      const nodeIds: string[] = []
      for (const line of lines) {
        const match = line.match(nodeIdRegex)
        if (match) nodeIds.push(match[1])
      }

      let diagramWithClicks = definition.trim()
      if (onNodeClick) {
        const clickLines = nodeIds.map(
          (id) => `  click ${id} callback "__onMermaidNodeClick"`
        )
        diagramWithClicks += '\n' + clickLines.join('\n')
      }

      const id = `mermaid-${++renderCounter}`
      try {
        const { svg } = await mermaid.render(id, diagramWithClicks)
        containerRef.current.innerHTML = svg
      } catch {
        containerRef.current.innerHTML =
          '<p class="text-red-500 text-sm">Failed to render diagram</p>'
      }
    }
    render()
  }, [definition, onNodeClick])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoom((prev) => Math.max(0.25, Math.min(3, prev - e.deltaY * 0.001)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setDragging(true)
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }, [pan])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragging) {
        setPan({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y,
        })
      }
    },
    [dragging]
  )

  const handleMouseUp = useCallback(() => setDragging(false), [])

  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.15))}
          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.25, z - 0.15))}
          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          -
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Reset
        </button>
      </div>

      {/* Diagram viewport */}
      <div
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ minHeight: 300 }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={containerRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: dragging ? 'none' : 'transform 0.1s ease-out',
          }}
        />
      </div>
    </div>
  )
}
