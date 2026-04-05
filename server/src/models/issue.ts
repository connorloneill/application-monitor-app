export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type IssueStatus = 'open' | 'diagnosing' | 'diagnosed' | 'resolved' | 'dismissed'

export interface Issue {
  id: string
  applicationId: string
  title: string
  description: string
  severity: Severity
  status: IssueStatus
  errorMessage?: string
  stackTrace?: string
  metadata?: Record<string, string>
  reportedAt: string
  updatedAt: string
}

export interface CreateIssueInput {
  applicationId: string
  title: string
  description: string
  severity: Severity
  errorMessage?: string
  stackTrace?: string
  metadata?: Record<string, string>
}

export interface UpdateIssueInput {
  title?: string
  description?: string
  severity?: Severity
  status?: IssueStatus
  errorMessage?: string
  stackTrace?: string
  metadata?: Record<string, string>
}
