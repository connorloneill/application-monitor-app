import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import * as issueService from '../services/issueService'
import * as diagnosisService from '../services/diagnosisService'
import { runDiagnosis } from '../agents/diagnosisAgent'
import { getLogger } from '../utils/logger'

const log = getLogger('routes/issues')
const router = Router()

const createSchema = z.object({
  applicationId: z.string().uuid('Must be a valid UUID'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  errorMessage: z.string().optional(),
  stackTrace: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
})

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['open', 'diagnosing', 'diagnosed', 'resolved', 'dismissed']).optional(),
  errorMessage: z.string().optional(),
  stackTrace: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
})

// GET /api/issues/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const issue = await issueService.getById(req.params.id)
    res.json(issue)
  } catch (err) {
    next(err)
  }
})

// POST /api/issues
router.post(
  '/',
  requireAuth,
  validate(createSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const issue = await issueService.create(req.body)
      res.status(201).json(issue)
    } catch (err) {
      next(err)
    }
  }
)

// PUT /api/issues/:id
router.put(
  '/:id',
  requireAuth,
  validate(updateSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const issue = await issueService.update(req.params.id, req.body)
      res.json(issue)
    } catch (err) {
      next(err)
    }
  }
)

// DELETE /api/issues/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await issueService.remove(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// GET /api/issues/:id/diagnoses
router.get('/:id/diagnoses', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const diagnoses = await diagnosisService.getByIssueId(req.params.id)
    res.json({ data: diagnoses, total: diagnoses.length })
  } catch (err) {
    next(err)
  }
})

// POST /api/issues/:id/diagnose — async trigger
const diagnoseSchema = z.object({
  level: z.enum(['quick', 'deep']).optional(),
})

router.post(
  '/:id/diagnose',
  requireAuth,
  validate(diagnoseSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const issue = await issueService.getById(req.params.id)
      const level = req.body.level ?? 'deep'

      // Check for existing in-flight diagnosis
      const existing = await diagnosisService.getByIssueId(req.params.id)
      const inFlight = existing.find((d) => d.status === 'pending' || d.status === 'running')
      if (inFlight) {
        res.status(200).json({ diagnosisId: inFlight.id, status: inFlight.status })
        return
      }

      // Create pending diagnosis and start agent in background
      const diagnosis = await diagnosisService.create({
        issueId: issue.id,
        applicationId: issue.applicationId,
        level,
      })

      // Fire and forget — run agent in background
      runDiagnosis(issue.id, level).catch((err) => {
        log.error('Background diagnosis failed', {
          diagnosisId: diagnosis.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      })

      res.status(202).json({ diagnosisId: diagnosis.id, status: 'pending', level })
    } catch (err) {
      next(err)
    }
  }
)

export default router
