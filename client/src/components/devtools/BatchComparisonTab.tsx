import { useState, useEffect } from 'react'
import {
  runBatchComparison,
  getBatchResults,
  submitRating,
  BatchResult,
} from '../../services/devToolsApi'

const MODELS = [
  { id: 'anthropic.claude-sonnet-4-6', label: 'Claude Sonnet 4' },
  { id: 'anthropic.claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  { id: 'anthropic.claude-opus-4-6', label: 'Claude Opus 4' },
]

const FEATURES = [
  { id: 'broad_scan', label: 'Broad Scan' },
  { id: 'deep_analysis', label: 'Deep Analysis' },
  { id: 'quick_diagnosis', label: 'Quick Diagnosis' },
]

export default function BatchComparisonTab() {
  const [issueId, setIssueId] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [feature, setFeature] = useState('quick_diagnosis')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<BatchResult[]>([])
  const [loading, setLoading] = useState(false)

  // Load existing results
  useEffect(() => {
    if (!issueId) return
    const load = async () => {
      setLoading(true)
      try {
        const data = await getBatchResults(issueId)
        setResults(data)
      } catch {
        // empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [issueId])

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]
    )
  }

  const handleRun = async () => {
    if (!issueId || selectedModels.length === 0) return
    setRunning(true)
    try {
      await runBatchComparison(issueId, selectedModels, feature)
      // Refresh results
      const data = await getBatchResults(issueId)
      setResults(data)
    } catch {
      // handle error
    } finally {
      setRunning(false)
    }
  }

  const handleRate = async (resultId: string, rating: number) => {
    try {
      await submitRating(resultId, rating)
    } catch {
      // handle error
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Run Batch Comparison
        </h2>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Issue ID
          </label>
          <input
            type="text"
            value={issueId}
            onChange={(e) => setIssueId(e.target.value)}
            placeholder="Enter an issue ID to compare..."
            className="w-full text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Feature
          </label>
          <select
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
            className="text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-md px-3 py-2 text-gray-900 dark:text-gray-100"
          >
            {FEATURES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Models to Compare
          </label>
          <div className="flex flex-wrap gap-2">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleModel(m.id)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  selectedModels.includes(m.id)
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={running || !issueId || selectedModels.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-accent rounded-md transition-colors"
        >
          {running ? 'Running...' : 'Run Comparison'}
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading results...</p>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Comparison Results
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((result) => (
              <ResultCard key={result.id} result={result} onRate={handleRate} />
            ))}
          </div>
        </div>
      ) : issueId ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No comparison results for this issue yet.
        </p>
      ) : null}
    </div>
  )
}

function ResultCard({
  result,
  onRate,
}: {
  result: BatchResult
  onRate: (resultId: string, rating: number) => void
}) {
  const [userRating, setUserRating] = useState(0)
  const modelLabel =
    MODELS.find((m) => m.id === result.modelId)?.label ?? result.modelId

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {modelLabel}
          </span>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            {result.feature}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {result.tokenUsage.promptTokens + result.tokenUsage.completionTokens} tokens
          &middot; {result.latencyMs}ms
        </div>
      </div>

      {result.output.rootCause && (
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Root Cause</p>
          <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">
            {result.output.rootCause}
          </p>
        </div>
      )}

      {result.output.suggestedFix && (
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Suggested Fix</p>
          <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">
            {result.output.suggestedFix}
          </p>
        </div>
      )}

      {result.output.summary && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Summary</p>
          <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">
            {result.output.summary}
          </p>
        </div>
      )}

      {/* Star Rating */}
      <div className="flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Rate:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => {
              setUserRating(star)
              onRate(result.id, star)
            }}
            className={`text-lg transition-colors ${
              star <= userRating
                ? 'text-amber-400'
                : 'text-gray-300 dark:text-gray-600 hover:text-amber-300'
            }`}
          >
            &#9733;
          </button>
        ))}
      </div>
    </div>
  )
}
