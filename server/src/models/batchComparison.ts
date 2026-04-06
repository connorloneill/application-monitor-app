export interface BatchResult {
  id: string
  issueId: string
  modelId: string
  feature: string
  output: {
    summary?: string
    rootCause?: string
    suggestedFix?: string
    codeSnippets?: unknown[]
  }
  tokenUsage: {
    promptTokens: number
    completionTokens: number
  }
  latencyMs: number
  createdAt: string
}

export interface BatchRating {
  id: string
  batchResultId: string
  modelId: string
  feature: string
  rating: number
  notes?: string
  ratedBy: string
  createdAt: string
}

export interface RatingSummaryItem {
  groupKey: string
  avgRating: number
  totalRatings: number
  distribution: Record<number, number>
}
