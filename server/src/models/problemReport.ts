export type ReportStatus = 'new' | 'reviewed' | 'resolved'
export type ReportSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface ProblemReport {
  report_id: string
  app_name: string
  user_id: string
  user_name: string
  severity: ReportSeverity
  description: string
  page_url: string
  user_agent: string
  screenshot_key: string | null
  created_at: string
  status?: ReportStatus
}
