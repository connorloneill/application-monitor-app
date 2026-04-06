import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime'
import { config } from '../../config'
import { AppError } from '../../middleware/errorHandler'
import { onLLMStart, onLLMEnd, onLLMError } from '../../utils/observability'

const client = new BedrockRuntimeClient({ region: config.aws.region })

export interface BedrockMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BedrockRequest {
  systemPrompt: string
  messages: BedrockMessage[]
  maxTokens?: number
  temperature?: number
  requestId?: string
  feature?: string
  modelOverride?: string
}

export interface BedrockResponse {
  content: string
  promptTokens: number
  completionTokens: number
  latencyMs: number
}

export async function invokeModel(req: BedrockRequest): Promise<BedrockResponse> {
  const modelId = req.modelOverride ?? config.bedrock.modelId
  const requestId = req.requestId

  onLLMStart({ modelId, requestId, feature: req.feature })
  const start = Date.now()

  try {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: req.maxTokens ?? config.bedrock.maxTokens,
      temperature: req.temperature ?? config.bedrock.temperature,
      system: req.systemPrompt,
      messages: req.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    })

    const response = await client.send(command)
    const body = JSON.parse(new TextDecoder().decode(response.body))
    const latencyMs = Date.now() - start

    const content =
      body.content?.[0]?.text ?? ''
    const promptTokens = body.usage?.input_tokens ?? 0
    const completionTokens = body.usage?.output_tokens ?? 0

    onLLMEnd({ modelId, promptTokens, completionTokens, latencyMs, requestId, feature: req.feature })

    return { content, promptTokens, completionTokens, latencyMs }
  } catch (err) {
    const latencyMs = Date.now() - start
    const message = err instanceof Error ? err.message : 'Unknown error'
    onLLMError({ modelId, latencyMs, requestId, error: message, feature: req.feature })
    throw new AppError(502, `AI model invocation failed: ${message}`)
  }
}

export async function* invokeModelStreaming(req: BedrockRequest): AsyncGenerator<string> {
  const modelId = req.modelOverride ?? config.bedrock.modelId
  const requestId = req.requestId

  onLLMStart({ modelId, requestId, feature: req.feature })
  const start = Date.now()

  try {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: req.maxTokens ?? config.bedrock.maxTokens,
      temperature: req.temperature ?? config.bedrock.temperature,
      system: req.systemPrompt,
      messages: req.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }

    const command = new InvokeModelWithResponseStreamCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    })

    const response = await client.send(command)
    let promptTokens = 0
    let completionTokens = 0

    if (response.body) {
      for await (const event of response.body) {
        if (event.chunk?.bytes) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes))

          if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
            yield chunk.delta.text
          }

          if (chunk.type === 'message_delta' && chunk.usage) {
            completionTokens = chunk.usage.output_tokens ?? completionTokens
          }

          if (chunk.type === 'message_start' && chunk.message?.usage) {
            promptTokens = chunk.message.usage.input_tokens ?? 0
          }
        }
      }
    }

    const latencyMs = Date.now() - start
    onLLMEnd({ modelId, promptTokens, completionTokens, latencyMs, requestId, feature: req.feature })
  } catch (err) {
    const latencyMs = Date.now() - start
    const message = err instanceof Error ? err.message : 'Unknown error'
    onLLMError({ modelId, latencyMs, requestId, error: message, feature: req.feature })
    throw new AppError(502, `AI model streaming failed: ${message}`)
  }
}
