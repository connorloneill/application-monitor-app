import { logger } from './logger'

// Observability hooks for AI/LLM calls.
// Wire these into your Bedrock/LangChain calls to get end-to-end tracing.
// For production, swap the logger.debug calls for OpenTelemetry spans
// or LangSmith/Langfuse callbacks.

export interface LLMCallEvent {
  modelId: string
  promptTokens?: number
  completionTokens?: number
  latencyMs?: number
  requestId?: string
  error?: string
}

const obs = logger.child({ module: 'observability' })

export function onLLMStart(event: Pick<LLMCallEvent, 'modelId' | 'requestId'>) {
  obs.debug('LLM call started', event)
}

export function onLLMEnd(event: LLMCallEvent) {
  obs.info('LLM call completed', {
    ...event,
    totalTokens: (event.promptTokens ?? 0) + (event.completionTokens ?? 0),
  })
}

export function onLLMError(event: LLMCallEvent) {
  obs.error('LLM call failed', event)
}
