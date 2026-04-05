import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import * as applicationService from '../services/applicationService'
import * as issueService from '../services/issueService'

const router = Router()

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  repoUrl: z.string().url('Must be a valid URL'),
  description: z.string().min(1, 'Description is required'),
  language: z.string().optional(),
  defaultBranch: z.string().optional(),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  repoUrl: z.string().url().optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  language: z.string().optional(),
  defaultBranch: z.string().optional(),
})

// GET /api/applications
router.get('/', requireAuth, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const applications = await applicationService.getAll()
    res.json({ data: applications, total: applications.length })
  } catch (err) {
    next(err)
  }
})

// GET /api/applications/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const application = await applicationService.getById(req.params.id)
    res.json(application)
  } catch (err) {
    next(err)
  }
})

// POST /api/applications
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validate(createSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const application = await applicationService.create(req.body)
      res.status(201).json(application)
    } catch (err) {
      next(err)
    }
  }
)

// PUT /api/applications/:id
router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(updateSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const application = await applicationService.update(req.params.id, req.body)
      res.json(application)
    } catch (err) {
      next(err)
    }
  }
)

// DELETE /api/applications/:id
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await applicationService.remove(req.params.id)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  }
)

// GET /api/applications/:id/issues
router.get('/:id/issues', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { severity, status } = req.query as { severity?: string; status?: string }
    const issues = await issueService.getByApplicationId(req.params.id, { severity, status })
    res.json({ data: issues, total: issues.length })
  } catch (err) {
    next(err)
  }
})

export default router
