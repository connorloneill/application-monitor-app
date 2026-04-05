// ── Auth ────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// ── API ─────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// ── Problem Reports ─────────────────────────────────────────────────────

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
