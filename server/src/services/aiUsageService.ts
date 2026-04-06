import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { docClient, tableName } from './aws/dynamodb'
import { logger } from '../utils/logger'
import type {
  AiUsageRecord,
  AiEventLogRecord,
  UsageSummary,
  FeatureUsage,
  ModelUsage,
  DailyUsage,
} from '../models/aiUsage'
import { randomUUID } from 'crypto'

const log = logger.child({ module: 'aiUsageService' })
const USAGE_TABLE = tableName('ai_usage')
const EVENT_LOG_TABLE = tableName('ai_event_log')

// Cost per 1M tokens (input/output) — configurable estimates
const COST_PER_1M: Record<string, { input: number; output: number }> = {
  'anthropic.claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'anthropic.claude-haiku-4-5-20251001': { input: 0.8, output: 4.0 },
  'anthropic.claude-opus-4-6': { input: 15.0, output: 75.0 },
}

const DEFAULT_COST = { input: 3.0, output: 15.0 }

function estimateCost(modelId: string, promptTokens: number, completionTokens: number): number {
  const rates = COST_PER_1M[modelId] ?? DEFAULT_COST
  return (promptTokens / 1_000_000) * rates.input + (completionTokens / 1_000_000) * rates.output
}

export async function recordUsage(data: {
  feature: string
  modelId: string
  promptTokens: number
  completionTokens: number
  latencyMs: number
  status: 'success' | 'error'
  requestId?: string
  errorMessage?: string
}): Promise<AiUsageRecord> {
  const record: AiUsageRecord = {
    id: randomUUID(),
    requestId: data.requestId,
    feature: data.feature,
    modelId: data.modelId,
    promptTokens: data.promptTokens,
    completionTokens: data.completionTokens,
    totalTokens: data.promptTokens + data.completionTokens,
    estimatedCost: estimateCost(data.modelId, data.promptTokens, data.completionTokens),
    latencyMs: data.latencyMs,
    status: data.status,
    errorMessage: data.errorMessage,
    timestamp: new Date().toISOString(),
  }

  try {
    await docClient.send(new PutCommand({ TableName: USAGE_TABLE, Item: record }))
  } catch (err) {
    log.error('Failed to record AI usage', { error: (err as Error).message })
  }

  return record
}

export async function recordEvent(data: {
  usageId?: string
  eventType: AiEventLogRecord['eventType']
  modelId?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const record: AiEventLogRecord = {
    id: randomUUID(),
    usageId: data.usageId,
    eventType: data.eventType,
    modelId: data.modelId,
    metadata: data.metadata,
    timestamp: new Date().toISOString(),
  }

  try {
    await docClient.send(new PutCommand({ TableName: EVENT_LOG_TABLE, Item: record }))
  } catch (err) {
    log.error('Failed to record AI event', { error: (err as Error).message })
  }
}

export async function getSummary(from?: string, to?: string): Promise<UsageSummary> {
  const records = await scanUsageRecords(from, to)

  const featureMap = new Map<string, FeatureUsage>()
  const modelMap = new Map<string, ModelUsage>()
  const dailyMap = new Map<string, DailyUsage>()

  let totalCalls = 0
  let totalTokens = 0
  let totalPromptTokens = 0
  let totalCompletionTokens = 0
  let estimatedCost = 0

  for (const r of records) {
    totalCalls++
    totalTokens += r.totalTokens
    totalPromptTokens += r.promptTokens
    totalCompletionTokens += r.completionTokens
    estimatedCost += r.estimatedCost

    // By feature
    const feat = featureMap.get(r.feature) ?? {
      feature: r.feature,
      calls: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      avgLatencyMs: 0,
    }
    feat.calls++
    feat.promptTokens += r.promptTokens
    feat.completionTokens += r.completionTokens
    feat.totalTokens += r.totalTokens
    feat.avgLatencyMs += r.latencyMs
    featureMap.set(r.feature, feat)

    // By model
    const model = modelMap.get(r.modelId) ?? {
      modelId: r.modelId,
      calls: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    }
    model.calls++
    model.promptTokens += r.promptTokens
    model.completionTokens += r.completionTokens
    model.totalTokens += r.totalTokens
    model.estimatedCost += r.estimatedCost
    modelMap.set(r.modelId, model)

    // By day
    const date = r.timestamp.slice(0, 10)
    const day = dailyMap.get(date) ?? { date, calls: 0, totalTokens: 0, estimatedCost: 0 }
    day.calls++
    day.totalTokens += r.totalTokens
    day.estimatedCost += r.estimatedCost
    dailyMap.set(date, day)
  }

  // Compute average latency
  for (const feat of featureMap.values()) {
    if (feat.calls > 0) feat.avgLatencyMs = feat.avgLatencyMs / feat.calls
  }

  return {
    totalCalls,
    totalTokens,
    totalPromptTokens,
    totalCompletionTokens,
    estimatedCost,
    byFeature: Array.from(featureMap.values()),
    byModel: Array.from(modelMap.values()),
    daily: Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date)),
  }
}

export async function getRecent(limit = 50): Promise<AiUsageRecord[]> {
  const records = await scanUsageRecords()
  return records
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit)
}

export async function getEventLog(limit = 100): Promise<AiEventLogRecord[]> {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: EVENT_LOG_TABLE }))
    const items = (result.Items ?? []) as AiEventLogRecord[]
    return items
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit)
  } catch {
    return []
  }
}

async function scanUsageRecords(from?: string, to?: string): Promise<AiUsageRecord[]> {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: USAGE_TABLE }))
    let items = (result.Items ?? []) as AiUsageRecord[]

    if (from) items = items.filter((r) => r.timestamp >= from)
    if (to) items = items.filter((r) => r.timestamp <= to)

    return items
  } catch {
    return []
  }
}
