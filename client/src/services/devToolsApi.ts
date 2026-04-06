import api from './api'

// --- General ---

export async function resetAllData(): Promise<{ message: string; deleted: number }> {
  const { data } = await api.post('/api/dev-tools/reset-all')
  return data
}

// --- AI Usage ---

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

export interface RecentCall {
  id: string
  timestamp: string
  feature: string
  modelId: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  latencyMs: number
  status: string
  errorMessage?: string
}

export async function getUsageSummary(from?: string, to?: string): Promise<UsageSummary> {
  const params: Record<string, string> = {}
  if (from) params.from = from
  if (to) params.to = to
  const { data } = await api.get('/api/dev-tools/usage/summary', { params })
  return data
}

export async function getRecentCalls(limit = 50): Promise<RecentCall[]> {
  const { data } = await api.get('/api/dev-tools/usage/recent', { params: { limit } })
  return data
}

export async function getEventLog(limit = 100): Promise<unknown[]> {
  const { data } = await api.get('/api/dev-tools/usage/event-log', { params: { limit } })
  return data
}

// --- Developer Chat ---

export async function streamDevChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  modelId: string | undefined,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const token = localStorage.getItem('token')
  const baseUrl = import.meta.env.VITE_API_URL ?? ''
  const res = await fetch(`${baseUrl}/api/dev-tools/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, modelId }),
    signal,
  })

  if (!res.ok) throw new Error(`Chat request failed: ${res.status}`)
  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const payload = line.slice(6)
        if (payload === '[DONE]') return
        try {
          const parsed = JSON.parse(payload)
          if (parsed.text) onChunk(parsed.text)
        } catch {
          // skip malformed chunks
        }
      }
    }
  }
}

// --- Model Overrides ---

export async function getModelOverrides(): Promise<Record<string, unknown>> {
  const { data } = await api.get('/api/dev-tools/models')
  return data
}

export async function saveModelOverrides(overrides: Record<string, unknown>): Promise<void> {
  await api.put('/api/dev-tools/models', overrides)
}

// --- Batch Comparison ---

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
  tokenUsage: { promptTokens: number; completionTokens: number }
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

export async function runBatchComparison(
  issueId: string,
  models: string[],
  feature: string
): Promise<{ batchId: string }> {
  const { data } = await api.post('/api/dev-tools/batch/run', { issueId, models, feature })
  return data
}

export async function getBatchResults(issueId?: string): Promise<BatchResult[]> {
  const params: Record<string, string> = {}
  if (issueId) params.issueId = issueId
  const { data } = await api.get('/api/dev-tools/batch/results', { params })
  return data
}

export async function submitRating(
  batchResultId: string,
  rating: number,
  notes?: string
): Promise<void> {
  await api.post('/api/dev-tools/batch/rate', { batchResultId, rating, notes })
}

export async function getRatingSummary(
  groupBy: 'model' | 'feature' = 'model'
): Promise<RatingSummaryItem[]> {
  const { data } = await api.get('/api/dev-tools/batch/rating-summary', {
    params: { groupBy },
  })
  return data
}
