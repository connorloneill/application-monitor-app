import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import Breadcrumbs from '../components/Breadcrumbs'
import { getApplications } from '../services/applicationApi'
import type { Application, ApplicationStatus } from '../types'

function statusVariant(status: ApplicationStatus) {
  const map = {
    active: 'success' as const,
    inactive: 'warning' as const,
    archived: 'neutral' as const,
  }
  return map[status]
}

export default function ApplicationListPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    getApplications()
      .then((res) => setApplications(res.data))
      .catch((err) => setError(err.message ?? 'Failed to load applications'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = applications.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
      <Breadcrumbs items={[{ label: 'Applications' }]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Monitored Applications
        </h1>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search applications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Application cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {applications.length === 0
            ? 'No applications registered yet.'
            : 'No applications match your filters.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app) => (
            <Link
              key={app.id}
              to={`/applications/${app.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-brand-accent dark:hover:border-brand-secondary hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {app.name}
                </h2>
                <StatusBadge label={app.status} variant={statusVariant(app.status)} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {app.description}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                {app.language && (
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {app.language}
                  </span>
                )}
                <span>Branch: {app.defaultBranch}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
