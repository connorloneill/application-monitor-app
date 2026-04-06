export interface CodeSnippet {
  filePath: string
  startLine: number
  endLine: number
  content: string
  explanation: string
  confidence: number
}

export type DiagnosisStatus = 'pending' | 'running' | 'completed' | 'failed'
export type DiagnosisLevel = 'quick' | 'deep'

export interface Diagnosis {
  id: string
  issueId: string
  applicationId: string
  level: DiagnosisLevel
  status: DiagnosisStatus
  summary: string
  rootCause?: string
  codeSnippets: CodeSnippet[]
  suggestedFix?: string
  modelId: string
  promptVersion: string
  tokenUsage?: {
    promptTokens: number
    completionTokens: number
  }
  latencyMs?: number
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

export interface CreateDiagnosisInput {
  issueId: string
  applicationId: string
  level?: DiagnosisLevel
}
