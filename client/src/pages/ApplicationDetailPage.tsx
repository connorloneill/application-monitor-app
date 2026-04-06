import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import Breadcrumbs from '../components/Breadcrumbs'
import { getApplication, getIssues } from '../services/applicationApi'
import type { Application, Issue, IssueSeverity, IssueStatus } from '../types'

function severityVariant(severity: IssueSeverity) {
  const map = {
    critical: 'danger' as const,
    high: 'warning' as const,
    medium: 'info' as const,
    low: 'neutral' as const,
  }
  return map[severity]
}

function issueStatusVariant(status: IssueStatus) {
  const map = {
    open: 'danger' as const,
    diagnosing: 'warning' as const,
    diagnosed: 'info' as const,
    resolved: 'success' as const,
    dismissed: 'neutral' as const,
  }
  return map[status]
}

function relativeTime(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (seconds < 60) return rtf.format(-seconds, 'second')
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  const days = Math.floor(hours / 24)
  return rtf.format(-days, 'day')
}

export default function ApplicationDetailPage() {
  const { appId } = useParams<{ appId: string }>()
  const [app, setApp] = useState<Application | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (!appId) return
    Promise.all([getApplication(appId), getIssues(appId)])
      .then(([appData, issuesData]) => {
        setApp(appData)
        setIssues(issuesData.data)
      })
      .catch((err) => setError(err.message ?? 'Failed to load'))
      .finally(() => setLoading(false))
  }, [appId])

  const filtered = issues.filter((issue) => {
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter
    return matchesSeverity && matchesStatus
  })

  // Sort: critical first
  const severityOrder: Record<IssueSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const sorted = [...filtered].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error ?? 'Application not found'}</p>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs
        items={[{ label: 'Applications', to: '/' }, { label: app.name }]}
      />

      {/* App header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {app.name}
          </h1>
          <StatusBadge
            label={app.status}
            variant={app.status === 'active' ? 'success' : app.status === 'inactive' ? 'warning' : 'neutral'}
          />
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-3">{app.description}</p>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {app.language && (
            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {app.language}
            </span>
          )}
          <span>Branch: {app.defaultBranch}</span>
          <a
            href={app.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-secondary dark:text-brand-accent hover:underline"
          >
            Repository
          </a>
        </div>
      </div>

      {/* Issues section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Issues ({issues.length})
        </h2>
        <div className="flex gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="diagnosing">Diagnosing</option>
            <option value="diagnosed">Diagnosed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {issues.length === 0
            ? 'No issues reported for this application.'
            : 'No issues match your filters.'}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-sm text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reported</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((issue) => (
                <tr
                  key={issue.id}
                  className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/applications/${appId}/issues/${issue.id}`}
                      className="text-brand-secondary dark:text-brand-accent hover:underline font-medium"
                    >
                      {issue.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={issue.severity} variant={severityVariant(issue.severity)} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={issue.status} variant={issueStatusVariant(issue.status)} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {relativeTime(issue.reportedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
