import StatusBadge from './StatusBadge'
import CodeSnippetViewer from './CodeSnippetViewer'
import type { Diagnosis, DiagnosisStatus } from '../types'

interface DiagnosisPanelProps {
  diagnosis: Diagnosis
}

function statusVariant(status: DiagnosisStatus) {
  const map = {
    pending: 'info' as const,
    running: 'warning' as const,
    completed: 'success' as const,
    failed: 'danger' as const,
  }
  return map[status]
}

export default function DiagnosisPanel({ diagnosis }: DiagnosisPanelProps) {
  if (diagnosis.status === 'pending' || diagnosis.status === 'running') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-brand-secondary border-t-transparent rounded-full" />
          <span className="text-gray-700 dark:text-gray-300">
            AI is analyzing the codebase...
          </span>
          <StatusBadge label={diagnosis.status} variant={statusVariant(diagnosis.status)} />
        </div>
      </div>
    )
  }

  if (diagnosis.status === 'failed') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
        <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">Diagnosis Failed</h3>
        <p className="text-red-600 dark:text-red-300 text-sm">
          {diagnosis.errorMessage || 'An unknown error occurred during analysis.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Diagnosis Summary
          </h3>
          <StatusBadge label="completed" variant="success" />
        </div>
        <p className="text-gray-700 dark:text-gray-300">{diagnosis.summary}</p>
      </div>

      {/* Root Cause */}
      {diagnosis.rootCause && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Root Cause
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{diagnosis.rootCause}</p>
        </div>
      )}

      {/* Code Snippets */}
      {diagnosis.codeSnippets.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Identified Code ({diagnosis.codeSnippets.length} snippet{diagnosis.codeSnippets.length !== 1 ? 's' : ''})
          </h3>
          {diagnosis.codeSnippets.map((snippet, index) => (
            <CodeSnippetViewer key={index} snippet={snippet} />
          ))}
        </div>
      )}

      {/* Suggested Fix */}
      {diagnosis.suggestedFix && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
            Suggested Fix
          </h3>
          <p className="text-green-700 dark:text-green-300">{diagnosis.suggestedFix}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-400 dark:text-gray-500 flex gap-4">
        <span>Model: {diagnosis.modelId}</span>
        <span>Prompt: {diagnosis.promptVersion}</span>
        {diagnosis.latencyMs && <span>Latency: {(diagnosis.latencyMs / 1000).toFixed(1)}s</span>}
        {diagnosis.tokenUsage && (
          <span>
            Tokens: {diagnosis.tokenUsage.promptTokens + diagnosis.tokenUsage.completionTokens}
          </span>
        )}
      </div>
    </div>
  )
}
