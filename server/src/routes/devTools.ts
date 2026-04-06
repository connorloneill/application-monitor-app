import { Router, Response, NextFunction } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import * as devToolsService from '../services/devToolsService'
import * as aiUsageService from '../services/aiUsageService'
import * as batchComparisonService from '../services/batchComparisonService'
import { invokeModelStreaming, BedrockMessage } from '../services/aws/bedrock'
import { getPrompt } from '../prompts/registry'

const router = Router()

// All dev-tools routes require authentication
router.use(requireAuth)

// --- General ---

// POST /api/dev-tools/reset-all
router.post('/reset-all', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await devToolsService.resetAllData()
    aiUsageService.recordEvent({ eventType: 'data_reset', metadata: { deleted: result.deleted } })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// --- AI Usage ---

// GET /api/dev-tools/usage/summary
router.get('/usage/summary', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string }
    const summary = await aiUsageService.getSummary(from, to)
    res.json(summary)
  } catch (err) {
    next(err)
  }
})

// GET /api/dev-tools/usage/recent
router.get('/usage/recent', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? '50', 10)
    const calls = await aiUsageService.getRecent(limit)
    res.json(calls)
  } catch (err) {
    next(err)
  }
})

// GET /api/dev-tools/usage/event-log
router.get('/usage/event-log', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? '100', 10)
    const events = await aiUsageService.getEventLog(limit)
    res.json(events)
  } catch (err) {
    next(err)
  }
})

// --- Developer Chat ---

// POST /api/dev-tools/chat (SSE)
router.post('/chat', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { messages, modelId } = req.body as {
      messages: BedrockMessage[]
      modelId?: string
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const systemPrompt = getPrompt('dev_chat_system')

    const stream = invokeModelStreaming({
      systemPrompt,
      messages,
      feature: 'dev_chat',
      modelOverride: modelId,
      requestId: req.headers['x-request-id'] as string,
    })

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    // If headers already sent, just end the stream
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ text: '\n\n[Error: Stream interrupted]' })}\n\n`)
      res.write('data: [DONE]\n\n')
      res.end()
    } else {
      next(err)
    }
  }
})

// --- Model Overrides ---

// GET /api/dev-tools/models
router.get('/models', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Model overrides are stored client-side in localStorage for now
    res.json({})
  } catch (err) {
    next(err)
  }
})

// PUT /api/dev-tools/models
router.put('/models', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ message: 'Model overrides saved' })
  } catch (err) {
    next(err)
  }
})

// --- Batch Comparison ---

// POST /api/dev-tools/batch/run
router.post('/batch/run', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { issueId, models, feature } = req.body as {
      issueId: string
      models: string[]
      feature: string
    }
    const result = await batchComparisonService.runComparison(issueId, models, feature)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// GET /api/dev-tools/batch/results
router.get('/batch/results', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const issueId = req.query.issueId as string | undefined
    const results = await batchComparisonService.getResults(issueId)
    res.json(results)
  } catch (err) {
    next(err)
  }
})

// POST /api/dev-tools/batch/rate
router.post('/batch/rate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { batchResultId, rating, notes } = req.body as {
      batchResultId: string
      rating: number
      notes?: string
    }
    const result = await batchComparisonService.submitRating({
      batchResultId,
      rating,
      notes,
      ratedBy: req.user?.id ?? 'unknown',
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// GET /api/dev-tools/batch/rating-summary
router.get(
  '/batch/rating-summary',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const groupBy = (req.query.groupBy as 'model' | 'feature') ?? 'model'
      const summary = await batchComparisonService.getRatingSummary(groupBy)
      res.json(summary)
    } catch (err) {
      next(err)
    }
  }
)

export default router
