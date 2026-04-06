import { logger } from './logger'
import * as aiUsageService from '../services/aiUsageService'

// Observability hooks for AI/LLM calls.
// Wire these into your Bedrock/LangChain calls to get end-to-end tracing.
// For production, swap the logger.debug calls for OpenTelemetry spans
// or LangSmith/Langfuse callbacks.

export interface LLMCallEvent {
  modelId: string
  feature?: string
  promptTokens?: number
  completionTokens?: number
  latencyMs?: number
  requestId?: string
  error?: string
}

const obs = logger.child({ module: 'observability' })

export function onLLMStart(event: Pick<LLMCallEvent, 'modelId' | 'requestId' | 'feature'>) {
  obs.debug('LLM call started', event)
}

export function onLLMEnd(event: LLMCallEvent) {
  obs.info('LLM call completed', {
    ...event,
    totalTokens: (event.promptTokens ?? 0) + (event.completionTokens ?? 0),
  })

  // Persist usage record (fire-and-forget)
  if (event.feature) {
    aiUsageService.recordUsage({
      feature: event.feature,
      modelId: event.modelId,
      promptTokens: event.promptTokens ?? 0,
      completionTokens: event.completionTokens ?? 0,
      latencyMs: event.latencyMs ?? 0,
      status: 'success',
      requestId: event.requestId,
    })
  }
}

export function onLLMError(event: LLMCallEvent) {
  obs.error('LLM call failed', event)

  // Persist error record (fire-and-forget)
  if (event.feature) {
    aiUsageService.recordUsage({
      feature: event.feature,
      modelId: event.modelId,
      promptTokens: event.promptTokens ?? 0,
      completionTokens: event.completionTokens ?? 0,
      latencyMs: event.latencyMs ?? 0,
      status: 'error',
      requestId: event.requestId,
      errorMessage: event.error,
    })
  }
}
