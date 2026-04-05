import api from './api'
import type {
  Application,
  Issue,
  Diagnosis,
  PaginatedResponse,
  TriggerDiagnosisResponse,
  DashboardStats,
  ProblemReport,
} from '../types'

// ── Applications ────────────────────────────────────────────────────────

export async function getApplications(): Promise<PaginatedResponse<Application>> {
  const { data } = await api.get('/api/applications')
  return data
}

export async function getApplication(appId: string): Promise<Application> {
  const { data } = await api.get(`/api/applications/${appId}`)
  return data
}

// ── Issues ──────────────────────────────────────────────────────────────

export async function getIssues(
  appId: string,
  params?: { severity?: string; status?: string }
): Promise<PaginatedResponse<Issue>> {
  const { data } = await api.get(`/api/applications/${appId}/issues`, { params })
  return data
}

export async function getIssue(issueId: string): Promise<Issue> {
  const { data } = await api.get(`/api/issues/${issueId}`)
  return data
}

// ── Diagnoses ───────────────────────────────────────────────────────────

export async function getDiagnoses(
  issueId: string
): Promise<PaginatedResponse<Diagnosis>> {
  const { data } = await api.get(`/api/issues/${issueId}/diagnoses`)
  return data
}

export async function triggerDiagnosis(
  issueId: string
): Promise<TriggerDiagnosisResponse> {
  const { data } = await api.post(`/api/issues/${issueId}/diagnose`)
  return data
}

export async function getDiagnosis(diagnosisId: string): Promise<Diagnosis> {
  const { data } = await api.get(`/api/diagnoses/${diagnosisId}`)
  return data
}

// ── Dashboard ───────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/api/dashboard/stats')
  return data
}

// ── Problem Reports (from shared external table) ────────────────────

export async function getProblemReports(): Promise<PaginatedResponse<ProblemReport>> {
  const { data } = await api.get('/api/problem-reports')
  return data
}

export async function getProblemReportApps(): Promise<{ data: string[] }> {
  const { data } = await api.get('/api/problem-reports/apps')
  return data
}

export async function getProblemReportsByApp(
  appName: string,
  params?: { status?: string }
): Promise<PaginatedResponse<ProblemReport>> {
  const { data } = await api.get(`/api/problem-reports/app/${appName}`, { params })
  return data
}

export async function getProblemReport(reportId: string): Promise<ProblemReport> {
  const { data } = await api.get(`/api/problem-reports/${reportId}`)
  return data
}

export async function getProblemReportScreenshot(
  reportId: string
): Promise<{ url: string | null }> {
  const { data } = await api.get(`/api/problem-reports/${reportId}/screenshot`)
  return data
}

export async function updateProblemReportStatus(
  reportId: string,
  status: string
): Promise<ProblemReport> {
  const { data } = await api.patch(`/api/problem-reports/${reportId}/status`, { status })
  return data
}
