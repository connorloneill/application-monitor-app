import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProblemReports } from '../services/problemReportApi'
import type { ProblemReport, ReportSeverity, ReportStatus } from '../types'

function severityColor(severity: ReportSeverity) {
  const map: Record<ReportSeverity, string> = {
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  }
  return map[severity]
}

function statusColor(status?: ReportStatus) {
  const s = status ?? 'new'
  const map: Record<ReportStatus, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    reviewed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return map[s]
}

export default function ProblemReportsPage() {
  const [reports, setReports] = useState<ProblemReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    getProblemReports()
      .then((res) => setReports(res.data.data))
      .catch((err) => setError(err.message ?? 'Failed to load reports'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.app_name.toLowerCase().includes(search.toLowerCase()) ||
      r.user_name.toLowerCase().includes(search.toLowerCase())
    const matchesSeverity = severityFilter === 'all' || r.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || (r.status ?? 'new') === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Problem Reports
      </h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] max-w-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"
        />
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
        >
          <option value="all">All severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {reports.length === 0
            ? 'No problem reports yet.'
            : 'No reports match your filters.'}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((report) => (
            <Link
              key={report.report_id}
              to={`/reports/${report.report_id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-brand-accent dark:hover:border-brand-secondary hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {report.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {report.app_name} &middot; {report.user_name} &middot;{' '}
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColor(report.severity)}`}>
                    {report.severity}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(report.status)}`}>
                    {report.status ?? 'new'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {report.page_url}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
