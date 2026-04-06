import { v4 as uuidv4 } from 'uuid'
import { config } from '../config'
import { getPrompt, getPromptVersion } from '../prompts/registry'
import { invokeModel } from '../services/aws/bedrock'
import * as issueService from '../services/issueService'
import * as applicationService from '../services/applicationService'
import * as diagnosisService from '../services/diagnosisService'
import { getRepoTree, getFileContent } from './tools/codeRetrieval'
import { getLogger } from '../utils/logger'
import type { Diagnosis, DiagnosisLevel, CodeSnippet } from '../models'

const log = getLogger('diagnosisAgent')

interface BroadScanResult {
  summary: string
  rootCause: string
  filesToInvestigate: string[]
}

interface DeepAnalysisResult {
  summary: string
  rootCause: string
  suggestedFix: string
  codeSnippets: CodeSnippet[]
}

interface QuickDiagnosisResult {
  summary: string
  rootCause: string
  suggestedFix: string
  codeSnippets: []
}

function parseJsonResponse<T>(content: string): T {
  // Strip markdown code fences if present
  const cleaned = content.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '')
  return JSON.parse(cleaned) as T
}

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

export async function runDiagnosis(issueId: string, level: DiagnosisLevel = 'deep'): Promise<Diagnosis> {
  const requestId = uuidv4()

  // Load context
  const issue = await issueService.getById(issueId)
  const application = await applicationService.getById(issue.applicationId)

  // Check for existing in-flight diagnosis
  const existing = await diagnosisService.getByIssueId(issueId)
  const inFlight = existing.find(
    (d) => d.status === 'pending' || d.status === 'running'
  )
  if (inFlight) {
    log.info('Returning existing in-flight diagnosis', {
      diagnosisId: inFlight.id,
      issueId,
    })
    return inFlight
  }

  // Create diagnosis record
  const diagnosis = await diagnosisService.create({
    issueId: issue.id,
    applicationId: application.id,
    level,
  })
  await diagnosisService.update(diagnosis.id, { status: 'running' })

  // Update issue status
  await issueService.update(issueId, { status: 'diagnosing' })

  try {
    // Quick diagnosis — single LLM call, no code retrieval
    if (level === 'quick') {
      log.info('Quick diagnosis: analyzing issue context only', { diagnosisId: diagnosis.id })

      const issueContext = buildIssueContext(issue)
      const quickPrompt = getPrompt('quick_diagnosis_system')
      const quickPromptVersion = getPromptVersion('quick_diagnosis_system')

      const quickResponse = await invokeModel({
        systemPrompt: quickPrompt,
        messages: [{ role: 'user', content: issueContext }],
        requestId,
        feature: 'quick_diagnosis',
      })

      let quickResult: QuickDiagnosisResult
      try {
        quickResult = parseJsonResponse<QuickDiagnosisResult>(quickResponse.content)
      } catch {
        log.warn('Failed to parse quick diagnosis response, storing raw', {
          diagnosisId: diagnosis.id,
        })
        quickResult = {
          summary: quickResponse.content,
          rootCause: '',
          suggestedFix: '',
          codeSnippets: [],
        }
      }

      await diagnosisService.update(diagnosis.id, {
        status: 'completed',
        summary: quickResult.summary,
        rootCause: quickResult.rootCause,
        suggestedFix: quickResult.suggestedFix,
        codeSnippets: [],
        modelId: config.bedrock.modelId,
        promptVersion: quickPromptVersion,
        tokenUsage: {
          promptTokens: quickResponse.promptTokens,
          completionTokens: quickResponse.completionTokens,
        },
        latencyMs: quickResponse.latencyMs,
        completedAt: new Date().toISOString(),
      })

      await issueService.update(issueId, { status: 'diagnosed' })

      log.info('Quick diagnosis completed', {
        diagnosisId: diagnosis.id,
        latencyMs: quickResponse.latencyMs,
      })

      return diagnosisService.getById(diagnosis.id)
    }

    // Pass 1: Broad scan — identify candidate files
    log.info('Pass 1: Scanning file tree', { diagnosisId: diagnosis.id, repo: application.repoUrl })

    const fileTree = await getRepoTree(application.repoUrl, application.defaultBranch)
    const fileList = fileTree.map((f) => f.path).join('\n')

    const issueContext = buildIssueContext(issue)
    const broadPrompt = getPrompt('diagnosis_system')
    const broadPromptVersion = getPromptVersion('diagnosis_system')

    const broadResponse = await invokeModel({
      systemPrompt: broadPrompt,
      messages: [
        {
          role: 'user',
          content: `${issueContext}\n\n## Repository File Tree\n\n\`\`\`\n${fileList}\n\`\`\``,
        },
      ],
      requestId,
      feature: 'broad_scan',
    })

    let broadResult: BroadScanResult
    try {
      broadResult = parseJsonResponse<BroadScanResult>(broadResponse.content)
    } catch {
      log.warn('Failed to parse broad scan response, using fallback', {
        diagnosisId: diagnosis.id,
      })
      broadResult = {
        summary: broadResponse.content,
        rootCause: '',
        filesToInvestigate: [],
      }
    }

    const filesToAnalyze = broadResult.filesToInvestigate.slice(
      0,
      config.diagnosis.maxFilesToAnalyze
    )

    if (filesToAnalyze.length === 0) {
      await diagnosisService.update(diagnosis.id, {
        status: 'completed',
        summary: broadResult.summary || 'No candidate files identified for analysis.',
        rootCause: broadResult.rootCause,
        promptVersion: broadPromptVersion,
        tokenUsage: {
          promptTokens: broadResponse.promptTokens,
          completionTokens: broadResponse.completionTokens,
        },
        latencyMs: broadResponse.latencyMs,
        completedAt: new Date().toISOString(),
      })
      await issueService.update(issueId, { status: 'diagnosed' })
      return diagnosisService.getById(diagnosis.id)
    }

    // Pass 2: Deep analysis — retrieve and analyze candidate files
    log.info('Pass 2: Analyzing candidate files', {
      diagnosisId: diagnosis.id,
      fileCount: filesToAnalyze.length,
    })

    const fileContents: string[] = []
    let totalLength = 0

    for (const filePath of filesToAnalyze) {
      if (totalLength >= config.diagnosis.maxContentLength) {
        log.warn('Truncating file retrieval due to content length limit', {
          diagnosisId: diagnosis.id,
          truncatedAt: filePath,
        })
        break
      }

      try {
        const content = await getFileContent(
          application.repoUrl,
          filePath,
          application.defaultBranch
        )
        const numbered = content
          .split('\n')
          .map((line, i) => `${i + 1} | ${line}`)
          .join('\n')
        const section = `### ${filePath}\n\`\`\`\n${numbered}\n\`\`\``
        fileContents.push(section)
        totalLength += content.length
      } catch (err) {
        log.warn('Failed to retrieve file', {
          filePath,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const snippetPrompt = getPrompt('snippet_analysis_system')
    const snippetPromptVersion = getPromptVersion('snippet_analysis_system')

    const deepResponse = await invokeModel({
      systemPrompt: snippetPrompt,
      messages: [
        {
          role: 'user',
          content: `${issueContext}\n\n## Source Files\n\n${fileContents.join('\n\n')}`,
        },
      ],
      requestId,
      feature: 'deep_analysis',
    })

    let deepResult: DeepAnalysisResult
    try {
      deepResult = parseJsonResponse<DeepAnalysisResult>(deepResponse.content)
    } catch {
      log.warn('Failed to parse deep analysis response, storing raw', {
        diagnosisId: diagnosis.id,
      })
      deepResult = {
        summary: deepResponse.content,
        rootCause: broadResult.rootCause || '',
        suggestedFix: '',
        codeSnippets: [],
      }
    }

    // Store results
    const totalPromptTokens =
      broadResponse.promptTokens + deepResponse.promptTokens
    const totalCompletionTokens =
      broadResponse.completionTokens + deepResponse.completionTokens
    const totalLatency = broadResponse.latencyMs + deepResponse.latencyMs

    await diagnosisService.update(diagnosis.id, {
      status: 'completed',
      summary: deepResult.summary,
      rootCause: deepResult.rootCause,
      suggestedFix: deepResult.suggestedFix,
      codeSnippets: deepResult.codeSnippets,
      modelId: config.bedrock.modelId,
      promptVersion: snippetPromptVersion,
      tokenUsage: {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
      },
      latencyMs: totalLatency,
      completedAt: new Date().toISOString(),
    })

    await issueService.update(issueId, { status: 'diagnosed' })

    log.info('Diagnosis completed', {
      diagnosisId: diagnosis.id,
      snippetCount: deepResult.codeSnippets.length,
      totalLatencyMs: totalLatency,
    })

    return diagnosisService.getById(diagnosis.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    log.error('Diagnosis failed', { diagnosisId: diagnosis.id, error: message })

    await diagnosisService.update(diagnosis.id, {
      status: 'failed',
      errorMessage: message,
      completedAt: new Date().toISOString(),
    })

    await issueService.update(issueId, { status: 'open' })

    throw err
  }
}
