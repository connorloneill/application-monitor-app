import { useState, useEffect } from 'react'
import { getRatingSummary, RatingSummaryItem } from '../../services/devToolsApi'

export default function RatingSummaryTab() {
  const [groupBy, setGroupBy] = useState<'model' | 'feature'>('model')
  const [data, setData] = useState<RatingSummaryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const result = await getRatingSummary(groupBy)
        setData(result)
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [groupBy])

  const ratingColor = (avg: number) => {
    if (avg >= 4) return 'bg-green-500'
    if (avg >= 3) return 'bg-yellow-500'
    if (avg >= 2) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (loading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading ratings...</p>
  }

  return (
    <div className="space-y-6">
      {/* Group by toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Group by:</span>
        <button
          onClick={() => setGroupBy('model')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            groupBy === 'model'
              ? 'bg-brand-primary text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Model
        </button>
        <button
          onClick={() => setGroupBy('feature')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            groupBy === 'feature'
              ? 'bg-brand-primary text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Feature
        </button>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No ratings recorded yet. Run batch comparisons and rate the results to see summaries here.
        </p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item) => (
              <div
                key={item.groupKey}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {item.groupKey}
                </h4>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {item.avgRating.toFixed(1)}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${
                          star <= Math.round(item.avgRating)
                            ? 'text-amber-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      >
                        &#9733;
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({item.totalRatings} ratings)
                  </span>
                </div>

                {/* Distribution bar */}
                <div className="w-full h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full ${ratingColor(item.avgRating)}`}
                    style={{ width: `${(item.avgRating / 5) * 100}%` }}
                  />
                </div>

                {/* Distribution breakdown */}
                <div className="mt-3 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = item.distribution[star] ?? 0
                    const pct =
                      item.totalRatings > 0
                        ? ((count / item.totalRatings) * 100).toFixed(0)
                        : '0'
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-right text-gray-600 dark:text-gray-400">
                          {star}
                        </span>
                        <span className="text-amber-400">&#9733;</span>
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-500 dark:text-gray-400">
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
