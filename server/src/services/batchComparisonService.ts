import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { docClient, tableName } from './aws/dynamodb'
import { invokeModel } from './aws/bedrock'
import * as issueService from './issueService'
import { getPrompt } from '../prompts/registry'
import { logger } from '../utils/logger'
import type { BatchResult, BatchRating, RatingSummaryItem } from '../models/batchComparison'

const log = logger.child({ module: 'batchComparisonService' })
const RESULTS_TABLE = tableName('batch_results')
const RATINGS_TABLE = tableName('batch_ratings')

function buildIssueContext(issue: {
  title: string
  description: string
  errorMessage?: string
  stackTrace?: string
}): string {
  let context = `## Issue Report\n\n**Title:** ${issue.title}\n**Description:** ${issue.description}`
  if (issue.errorMessage) {
    context += `\n\n**Error Message:**\n\`\`\`\n${issue.errorMessage}\n\`\`\``
  }
  if (issue.stackTrace) {
    context += `\n\n**Stack Trace:**\n\`\`\`\n${issue.stackTrace}\n\`\`\``
  }
  return context
}

export async function runComparison(
  issueId: string,
  models: string[],
  feature: string
): Promise<{ batchId: string; resultCount: number }> {
  const batchId = randomUUID()
  const issue = await issueService.getById(issueId)
  const issueContext = buildIssueContext(issue)

  // Determine prompt based on feature
  const promptName = feature === 'quick_diagnosis' ? 'quick_diagnosis_system' : 'diagnosis_system'
  const systemPrompt = getPrompt(promptName)

  // Run each model in parallel (respecting rate limits via Promise.allSettled)
  const results = await Promise.allSettled(
    models.map(async (modelId) => {
      const response = await invokeModel({
        systemPrompt,
        messages: [{ role: 'user', content: issueContext }],
        feature: `batch_${feature}`,
        modelOverride: modelId,
        requestId: batchId,
      })

      let output: BatchResult['output']
      try {
        const cleaned = response.content
          .replace(/^```(?:json)?\s*\n?/m, '')
          .replace(/\n?```\s*$/m, '')
        output = JSON.parse(cleaned)
      } catch {
        output = { summary: response.content }
      }

      const result: BatchResult = {
        id: randomUUID(),
        issueId,
        modelId,
        feature,
        output,
        tokenUsage: {
          promptTokens: response.promptTokens,
          completionTokens: response.completionTokens,
        },
        latencyMs: response.latencyMs,
        createdAt: new Date().toISOString(),
      }

      await docClient.send(new PutCommand({ TableName: RESULTS_TABLE, Item: result }))
      return result
    })
  )

  const successCount = results.filter((r) => r.status === 'fulfilled').length
  log.info('Batch comparison completed', { batchId, issueId, models, successCount })

  return { batchId, resultCount: successCount }
}

export async function getResults(issueId?: string): Promise<BatchResult[]> {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: RESULTS_TABLE }))
    let items = (result.Items ?? []) as BatchResult[]
    if (issueId) items = items.filter((r) => r.issueId === issueId)
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } catch {
    return []
  }
}

export async function submitRating(data: {
  batchResultId: string
  rating: number
  notes?: string
  ratedBy: string
}): Promise<BatchRating> {
  // Look up the batch result to get modelId and feature
  const results = await getResults()
  const batchResult = results.find((r) => r.id === data.batchResultId)

  const rating: BatchRating = {
    id: randomUUID(),
    batchResultId: data.batchResultId,
    modelId: batchResult?.modelId ?? 'unknown',
    feature: batchResult?.feature ?? 'unknown',
    rating: data.rating,
    notes: data.notes,
    ratedBy: data.ratedBy,
    createdAt: new Date().toISOString(),
  }

  await docClient.send(new PutCommand({ TableName: RATINGS_TABLE, Item: rating }))
  return rating
}

export async function getRatingSummary(
  groupBy: 'model' | 'feature' = 'model'
): Promise<RatingSummaryItem[]> {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: RATINGS_TABLE }))
    const ratings = (result.Items ?? []) as BatchRating[]

    const groups = new Map<string, { sum: number; count: number; distribution: Record<number, number> }>()

    for (const r of ratings) {
      const key = groupBy === 'model' ? r.modelId : r.feature
      const group = groups.get(key) ?? { sum: 0, count: 0, distribution: {} }
      group.sum += r.rating
      group.count++
      group.distribution[r.rating] = (group.distribution[r.rating] ?? 0) + 1
      groups.set(key, group)
    }

    return Array.from(groups.entries()).map(([key, g]) => ({
      groupKey: key,
      avgRating: g.count > 0 ? g.sum / g.count : 0,
      totalRatings: g.count,
      distribution: g.distribution,
    }))
  } catch {
    return []
  }
}
