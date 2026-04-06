export interface AiUsageRecord {
  id: string
  requestId?: string
  feature: string
  modelId: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCost: number
  latencyMs: number
  status: 'success' | 'error'
  errorMessage?: string
  timestamp: string
}

export interface AiEventLogRecord {
  id: string
  usageId?: string
  eventType: 'llm_start' | 'llm_end' | 'llm_error' | 'data_reset'
  modelId?: string
  metadata?: Record<string, unknown>
  timestamp: string
}

export interface UsageSummary {
  totalCalls: number
  totalTokens: number
  totalPromptTokens: number
  totalCompletionTokens: number
  estimatedCost: number
  byFeature: FeatureUsage[]
  byModel: ModelUsage[]
  daily: DailyUsage[]
}

export interface FeatureUsage {
  feature: string
  calls: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  avgLatencyMs: number
}

export interface ModelUsage {
  modelId: string
  calls: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCost: number
}

export interface DailyUsage {
  date: string
  calls: number
  totalTokens: number
  estimatedCost: number
}
