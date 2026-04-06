import { useState } from 'react'
import MermaidDiagram from './MermaidDiagram'
import DeveloperChatDrawer from './DeveloperChatDrawer'
import { ARCHITECTURE_DIAGRAM, DYNAMO_TABLES, API_ROUTES, AI_OPERATIONS } from './systemMappingsData'

export default function SystemMappingsTab() {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatQuestion, setChatQuestion] = useState<string | undefined>()

  const handleNodeClick = (nodeId: string) => {
    setChatQuestion(`Explain the "${nodeId}" component in this application's architecture. What does it do, how does it work, and what are its key dependencies?`)
    setChatOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Architecture Diagram */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          System Architecture
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Click any node to ask about it in the Developer Chat.
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <MermaidDiagram definition={ARCHITECTURE_DIAGRAM} onNodeClick={handleNodeClick} />
        </div>
      </section>

      {/* DynamoDB Tables */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          DynamoDB Tables
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                <th className="pb-2 pr-4">Table</th>
                <th className="pb-2 pr-4">Primary Key</th>
                <th className="pb-2">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {DYNAMO_TABLES.map((t) => (
                <tr key={t.name} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4 font-mono font-medium">{t.name}</td>
                  <td className="py-2 pr-4 font-mono">{t.primaryKey}</td>
                  <td className="py-2">{t.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* API Routes */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          API Routes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                <th className="pb-2 pr-4">Path</th>
                <th className="pb-2 pr-4">Methods</th>
                <th className="pb-2">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {API_ROUTES.map((r) => (
                <tr key={r.path} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4 font-mono font-medium">{r.path}</td>
                  <td className="py-2 pr-4">{r.methods}</td>
                  <td className="py-2">{r.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Operations */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          AI Operations
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                <th className="pb-2 pr-4">Operation</th>
                <th className="pb-2 pr-4">Model</th>
                <th className="pb-2 pr-4">Transport</th>
                <th className="pb-2">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {AI_OPERATIONS.map((op) => (
                <tr key={op.name} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4 font-medium">{op.name}</td>
                  <td className="py-2 pr-4 font-mono">{op.model}</td>
                  <td className="py-2 pr-4">{op.transport}</td>
                  <td className="py-2">{op.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Developer Chat Drawer */}
      <DeveloperChatDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        initialQuestion={chatQuestion}
      />
    </div>
  )
}
