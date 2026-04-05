import { Router, Response, NextFunction } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import * as applicationService from '../services/applicationService'
import * as issueService from '../services/issueService'
import type { Severity } from '../models'

const router = Router()

// GET /api/dashboard/stats
router.get('/stats', requireAuth, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const applications = await applicationService.getAll()

    const issuesBySeverity: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    for (const app of applications) {
      const issues = await issueService.getByApplicationId(app.id)
      for (const issue of issues) {
        if (issue.status !== 'resolved' && issue.status !== 'dismissed') {
          issuesBySeverity[issue.severity]++
        }
      }
    }

    res.json({
      applicationCount: applications.length,
      issuesBySeverity,
    })
  } catch (err) {
    next(err)
  }
})

export default router
