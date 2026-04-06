import { useState } from 'react'
import { useDevTools, FeatureFlags } from '../../contexts/DevToolsContext'
import { resetAllData } from '../../services/devToolsApi'

const FLAG_LABELS: Record<keyof FeatureFlags, { label: string; description: string }> = {
  enableQuickDiagnosis: {
    label: 'Quick Diagnosis',
    description: 'Enable single-pass quick diagnosis mode',
  },
  enableBatchComparison: {
    label: 'Batch Comparison',
    description: 'Enable batch model comparison in Dev Tools',
  },
  enableDevChat: {
    label: 'Developer Chat',
    description: 'Show the developer chat drawer',
  },
  showAiCostEstimates: {
    label: 'AI Cost Estimates',
    description: 'Display estimated costs in AI Usage dashboard',
  },
  verboseLogging: {
    label: 'Verbose Logging',
    description: 'Increase server log level for debugging',
  },
}

export default function GeneralTab() {
  const { flags, setFlag } = useDevTools()
  const [resetting, setResetting] = useState(false)
  const [resetResult, setResetResult] = useState<string | null>(null)

  const handleReset = async () => {
    if (!window.confirm('This will delete ALL application data. Are you sure?')) return
    setResetting(true)
    setResetResult(null)
    try {
      const result = await resetAllData()
      setResetResult(`${result.message} (${result.deleted} items deleted)`)
    } catch (err) {
      setResetResult(`Reset failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Feature Flags */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Feature Flags
        </h2>
        <div className="space-y-3">
          {(Object.keys(FLAG_LABELS) as (keyof FeatureFlags)[]).map((key) => (
            <label
              key={key}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {FLAG_LABELS[key].label}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {FLAG_LABELS[key].description}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={flags[key]}
                onClick={() => setFlag(key, !flags[key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  flags[key] ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    flags[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </section>

      {/* Data Reset */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data Management
        </h2>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
            Reset All Data
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400 mb-3">
            Deletes all problem reports, issues, diagnoses, applications, and AI usage data.
            This action cannot be undone.
          </p>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-md transition-colors"
          >
            {resetting ? 'Resetting...' : 'Reset All Data'}
          </button>
          {resetResult && (
            <p className="mt-2 text-xs text-red-700 dark:text-red-300">{resetResult}</p>
          )}
        </div>
      </section>
    </div>
  )
}
