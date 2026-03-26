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

// ── Add domain types below ───────────────────────────────────────────────
