import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import Breadcrumbs from '../components/Breadcrumbs'
import DiagnosisPanel from '../components/DiagnosisPanel'
import {
  getIssue,
  getApplication,
  getDiagnoses,
  triggerDiagnosis,
  getDiagnosis,
} from '../services/applicationApi'
import type {
  Issue,
  Application,
  Diagnosis,
  IssueSeverity,
  IssueStatus,
} from '../types'

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

const MAX_POLLS = 60
const POLL_INTERVAL_MS = 3000

export default function IssueDetailPage() {
  const { appId, issueId } = useParams<{ appId: string; issueId: string }>()
  const [app, setApp] = useState<Application | null>(null)
  const [issue, setIssue] = useState<Issue | null>(null)
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [diagnosing, setDiagnosing] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCountRef = useRef(0)

  useEffect(() => {
    if (!appId || !issueId) return
    Promise.all([
      getApplication(appId),
      getIssue(issueId),
      getDiagnoses(issueId),
    ])
      .then(([appData, issueData, diagData]) => {
        setApp(appData)
        setIssue(issueData)
        setDiagnoses(diagData.data)
      })
      .catch((err) => setError(err.message ?? 'Failed to load'))
      .finally(() => setLoading(false))
  }, [appId, issueId])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    pollCountRef.current = 0
    setDiagnosing(false)
  }, [])

  const startPolling = useCallback(
    (diagnosisId: string) => {
      setDiagnosing(true)
      pollCountRef.current = 0

      pollRef.current = setInterval(async () => {
        pollCountRef.current++
        if (pollCountRef.current >= MAX_POLLS) {
          stopPolling()
          return
        }

        try {
          const updated = await getDiagnosis(diagnosisId)
          if (updated.status === 'completed' || updated.status === 'failed') {
            setDiagnoses((prev) => {
              const idx = prev.findIndex((d) => d.id === updated.id)
              if (idx >= 0) {
                const next = [...prev]
                next[idx] = updated
                return next
              }
              return [updated, ...prev]
            })
            stopPolling()
          }
        } catch {
          stopPolling()
        }
      }, POLL_INTERVAL_MS)
    },
    [stopPolling]
  )

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleDiagnose = async () => {
    if (!issueId) return
    try {
      setDiagnosing(true)
      const response = await triggerDiagnosis(issueId)
      const pending: Diagnosis = {
        id: response.diagnosisId,
        issueId: issueId,
        applicationId: appId ?? '',
        status: response.status,
        summary: '',
        codeSnippets: [],
        modelId: '',
        promptVersion: '',
        createdAt: new Date().toISOString(),
      }
      setDiagnoses((prev) => [pending, ...prev])
      startPolling(response.diagnosisId)
    } catch (err) {
      setDiagnosing(false)
      setError(err instanceof Error ? err.message : 'Failed to trigger diagnosis')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (error || !issue || !app) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error ?? 'Issue not found'}</p>
      </div>
    )
  }

  const latestDiagnosis = diagnoses[0] ?? null
  const hasInFlight =
    latestDiagnosis?.status === 'pending' || latestDiagnosis?.status === 'running'

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Applications', to: '/' },
          { label: app.name, to: `/applications/${appId}` },
          { label: issue.title },
        ]}
      />

      {/* Issue header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {issue.title}
          </h1>
          <div className="flex gap-2">
            <StatusBadge label={issue.severity} variant={severityVariant(issue.severity)} />
            <StatusBadge label={issue.status} variant={issueStatusVariant(issue.status)} />
          </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{issue.description}</p>

        {issue.errorMessage && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Error Message
            </h3>
            <pre className="bg-gray-900 text-red-400 p-3 rounded-md text-sm overflow-x-auto">
              {issue.errorMessage}
            </pre>
          </div>
        )}

        {issue.stackTrace && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Stack Trace
            </h3>
            <pre className="bg-gray-900 text-gray-300 p-3 rounded-md text-sm overflow-x-auto max-h-48 overflow-y-auto">
              {issue.stackTrace}
            </pre>
          </div>
        )}

        {issue.metadata && Object.keys(issue.metadata).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Metadata
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(issue.metadata).map(([key, value]) => (
                <span
                  key={key}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                >
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Diagnosis section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          AI Diagnosis
        </h2>
        <button
          onClick={handleDiagnose}
          disabled={diagnosing || hasInFlight}
          className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {diagnosing || hasInFlight ? 'Diagnosing...' : 'Run Diagnosis'}
        </button>
      </div>

      {diagnoses.length === 0 && !diagnosing ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No diagnosis has been run for this issue yet.
          </p>
          <button
            onClick={handleDiagnose}
            className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-brand-primary/90 transition-colors"
          >
            Run Diagnosis
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {diagnoses.map((diagnosis) => (
            <DiagnosisPanel key={diagnosis.id} diagnosis={diagnosis} />
          ))}
        </div>
      )}
    </div>
  )
}
