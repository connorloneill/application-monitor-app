import { useDevTools } from '../../contexts/DevToolsContext'

const FEATURES = [
  { id: 'broad_scan', label: 'Broad Scan (Pass 1)' },
  { id: 'deep_analysis', label: 'Deep Analysis (Pass 2)' },
  { id: 'quick_diagnosis', label: 'Quick Diagnosis' },
  { id: 'dev_chat', label: 'Developer Chat' },
]

const MODELS = [
  { id: 'anthropic.claude-sonnet-4-6', label: 'Claude Sonnet 4' },
  { id: 'anthropic.claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  { id: 'anthropic.claude-opus-4-6', label: 'Claude Opus 4' },
]

export default function ModelOverridesTab() {
  const { modelOverrides, setModelOverride, clearModelOverrides } = useDevTools()

  const handlePrimaryClick = (featureId: string, modelId: string) => {
    const current = modelOverrides[featureId]
    const isPrimary = current?.primary === modelId
    setModelOverride(
      featureId,
      isPrimary ? undefined : modelId,
      current?.secondary
    )
  }

  const handleSecondaryClick = (featureId: string, modelId: string) => {
    const current = modelOverrides[featureId]
    // Cannot be both primary and secondary
    if (current?.primary === modelId) return

    const secondary = current?.secondary ?? []
    const isSecondary = secondary.includes(modelId)
    setModelOverride(
      featureId,
      current?.primary,
      isSecondary ? secondary.filter((s) => s !== modelId) : [...secondary, modelId]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Model Overrides
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            <strong>P</strong> = Primary (used for real-time requests).{' '}
            <strong>S</strong> = Secondary (used in batch comparison runs).
          </p>
        </div>
        <button
          onClick={clearModelOverrides}
          className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
        >
          Clear All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left pb-3 pr-4 text-gray-500 dark:text-gray-400 font-medium">
                Feature
              </th>
              {MODELS.map((m) => (
                <th
                  key={m.id}
                  className="pb-3 px-2 text-center text-gray-500 dark:text-gray-400 font-medium"
                >
                  <div className="text-xs">{m.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((feature) => {
              const override = modelOverrides[feature.id]
              return (
                <tr
                  key={feature.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                    {feature.label}
                  </td>
                  {MODELS.map((model) => {
                    const isPrimary = override?.primary === model.id
                    const isSecondary = override?.secondary?.includes(model.id) ?? false
                    return (
                      <td key={model.id} className="py-3 px-2 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handlePrimaryClick(feature.id, model.id)}
                            className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                              isPrimary
                                ? 'bg-brand-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title="Set as Primary"
                          >
                            P
                          </button>
                          <button
                            onClick={() => handleSecondaryClick(feature.id, model.id)}
                            className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                              isSecondary
                                ? 'bg-amber-500 text-white'
                                : isPrimary
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title="Set as Secondary (batch)"
                            disabled={isPrimary}
                          >
                            S
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Current overrides summary */}
      {Object.keys(modelOverrides).length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Active Overrides
          </h3>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            {FEATURES.map((f) => {
              const o = modelOverrides[f.id]
              if (!o?.primary && (!o?.secondary || o.secondary.length === 0)) return null
              return (
                <div key={f.id}>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {f.label}:
                  </span>{' '}
                  {o.primary && (
                    <span>
                      Primary={MODELS.find((m) => m.id === o.primary)?.label ?? o.primary}
                    </span>
                  )}
                  {o.secondary && o.secondary.length > 0 && (
                    <span>
                      {o.primary ? ', ' : ''}Secondary=[
                      {o.secondary
                        .map((s) => MODELS.find((m) => m.id === s)?.label ?? s)
                        .join(', ')}
                      ]
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
