import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProblemReport, getScreenshotUrl, updateReportStatus } from '../services/problemReportApi'
import type { ProblemReport, ReportStatus } from '../types'

export default function ProblemReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const [report, setReport] = useState<ProblemReport | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!reportId) return
    Promise.all([
      getProblemReport(reportId),
      getScreenshotUrl(reportId),
    ])
      .then(([reportRes, screenshotRes]) => {
        setReport(reportRes.data)
        setScreenshotUrl(screenshotRes.data.url)
      })
      .catch((err) => setError(err.message ?? 'Failed to load report'))
      .finally(() => setLoading(false))
  }, [reportId])

  const handleStatusChange = async (status: ReportStatus) => {
    if (!reportId) return
    setUpdating(true)
    try {
      const res = await updateReportStatus(reportId, status)
      setReport(res.data)
    } catch (err: any) {
      setError(err.message ?? 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
  }

  if (error || !report) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error ?? 'Report not found'}</p>
        <Link to="/" className="text-brand-secondary hover:underline mt-4 inline-block">
          Back to reports
        </Link>
      </div>
    )
  }

  const currentStatus = report.status ?? 'new'

  return (
    <div>
      <Link to="/" className="text-sm text-brand-secondary dark:text-brand-accent hover:underline mb-4 inline-block">
        &larr; Back to reports
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {report.description}
          </h1>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              report.severity === 'CRITICAL'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : report.severity === 'HIGH'
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                : report.severity === 'MEDIUM'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}
          >
            {report.severity}
          </span>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Application</dt>
            <dd className="text-gray-900 dark:text-gray-100 font-medium">{report.app_name}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Reported by</dt>
            <dd className="text-gray-900 dark:text-gray-100 font-medium">{report.user_name}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Date</dt>
            <dd className="text-gray-900 dark:text-gray-100">
              {new Date(report.created_at).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Page URL</dt>
            <dd className="text-gray-900 dark:text-gray-100 truncate">{report.page_url}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-500 dark:text-gray-400">User Agent</dt>
            <dd className="text-gray-900 dark:text-gray-100 text-xs break-all">
              {report.user_agent}
            </dd>
          </div>
        </dl>

        {/* Status controls */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
          {(['new', 'reviewed', 'resolved'] as ReportStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={updating || currentStatus === s}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                currentStatus === s
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              } disabled:opacity-50`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Screenshot */}
        {screenshotUrl && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Screenshot
            </h2>
            <img
              src={screenshotUrl}
              alt="Problem screenshot"
              className="rounded-lg border border-gray-200 dark:border-gray-700 max-w-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}
