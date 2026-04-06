import { useState, useEffect } from 'react'
import { getUsageSummary, getRecentCalls, UsageSummary, RecentCall } from '../../services/devToolsApi'

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: 0 },
]

export default function AiUsageTab() {
  const [range, setRange] = useState(7)
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const from = range > 0
          ? new Date(Date.now() - range * 86400000).toISOString()
          : undefined
        const [s, r] = await Promise.all([
          getUsageSummary(from),
          getRecentCalls(50),
        ])
        setSummary(s)
        setRecentCalls(r)
      } catch {
        // silently handle — empty state shown
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [range])

  if (loading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading usage data...</p>
  }

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => setRange(r.days)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              range === r.days
                ? 'bg-brand-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total Calls" value={summary.totalCalls.toLocaleString()} />
          <SummaryCard label="Total Tokens" value={summary.totalTokens.toLocaleString()} />
          <SummaryCard
            label="Input Tokens"
            value={summary.totalPromptTokens.toLocaleString()}
          />
          <SummaryCard
            label="Est. Cost"
            value={`$${summary.estimatedCost.toFixed(4)}`}
          />
        </div>
      )}

      {/* By Feature */}
      {summary && summary.byFeature.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            By Feature
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-2 pr-4">Feature</th>
                  <th className="pb-2 pr-4">Calls</th>
                  <th className="pb-2 pr-4">Input</th>
                  <th className="pb-2 pr-4">Output</th>
                  <th className="pb-2 pr-4">Total</th>
                  <th className="pb-2">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {summary.byFeature.map((f) => (
                  <tr key={f.feature} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4 font-medium">{f.feature}</td>
                    <td className="py-2 pr-4">{f.calls}</td>
                    <td className="py-2 pr-4">{f.promptTokens.toLocaleString()}</td>
                    <td className="py-2 pr-4">{f.completionTokens.toLocaleString()}</td>
                    <td className="py-2 pr-4">{f.totalTokens.toLocaleString()}</td>
                    <td className="py-2">{f.avgLatencyMs.toFixed(0)}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* By Model */}
      {summary && summary.byModel.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            By Model
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-2 pr-4">Model</th>
                  <th className="pb-2 pr-4">Calls</th>
                  <th className="pb-2 pr-4">Input</th>
                  <th className="pb-2 pr-4">Output</th>
                  <th className="pb-2 pr-4">Total</th>
                  <th className="pb-2">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {summary.byModel.map((m) => (
                  <tr key={m.modelId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4 font-medium">{m.modelId}</td>
                    <td className="py-2 pr-4">{m.calls}</td>
                    <td className="py-2 pr-4">{m.promptTokens.toLocaleString()}</td>
                    <td className="py-2 pr-4">{m.completionTokens.toLocaleString()}</td>
                    <td className="py-2 pr-4">{m.totalTokens.toLocaleString()}</td>
                    <td className="py-2">${m.estimatedCost.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Daily */}
      {summary && summary.daily.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Daily Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Calls</th>
                  <th className="pb-2 pr-4">Tokens</th>
                  <th className="pb-2">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {summary.daily.map((d) => (
                  <tr key={d.date} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4 font-medium">{d.date}</td>
                    <td className="py-2 pr-4">{d.calls}</td>
                    <td className="py-2 pr-4">{d.totalTokens.toLocaleString()}</td>
                    <td className="py-2">${d.estimatedCost.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Recent Calls */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Recent AI Calls
        </h3>
        {recentCalls.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">No recent calls recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">Feature</th>
                  <th className="pb-2 pr-4">Model</th>
                  <th className="pb-2 pr-4">Tokens</th>
                  <th className="pb-2 pr-4">Latency</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {recentCalls.map((call) => (
                  <tr key={call.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4">{new Date(call.timestamp).toLocaleString()}</td>
                    <td className="py-2 pr-4">{call.feature}</td>
                    <td className="py-2 pr-4">{call.modelId}</td>
                    <td className="py-2 pr-4">{call.totalTokens.toLocaleString()}</td>
                    <td className="py-2 pr-4">{call.latencyMs}ms</td>
                    <td className="py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs ${
                          call.status === 'success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {call.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
    </div>
  )
}
