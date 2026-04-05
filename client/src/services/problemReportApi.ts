import api from './api'
import type { ProblemReport } from '../types'

export function getProblemReports() {
  return api.get<{ data: ProblemReport[]; total: number }>('/api/problem-reports')
}

export function getProblemReport(reportId: string) {
  return api.get<ProblemReport>(`/api/problem-reports/${reportId}`)
}

export function getScreenshotUrl(reportId: string) {
  return api.get<{ url: string | null }>(`/api/problem-reports/${reportId}/screenshot`)
}

export function updateReportStatus(reportId: string, status: string) {
  return api.patch<ProblemReport>(`/api/problem-reports/${reportId}/status`, { status })
}
