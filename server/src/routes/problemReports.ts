import { Router, Response, NextFunction } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import * as problemReportService from '../services/problemReportService'

const router = Router()

// GET /api/problem-reports — all reports
router.get('/', requireAuth, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reports = await problemReportService.getAll()
    res.json({ data: reports, total: reports.length })
  } catch (err) {
    next(err)
  }
})

// GET /api/problem-reports/apps — distinct app names
router.get('/apps', requireAuth, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appNames = await problemReportService.getDistinctAppNames()
    res.json({ data: appNames })
  } catch (err) {
    next(err)
  }
})

// GET /api/problem-reports/app/:appName — reports for a specific app
router.get(
  '/app/:appName',
  requireAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query as { status?: string }
      const reports = await problemReportService.getByAppName(req.params.appName as string, { status })
      res.json({ data: reports, total: reports.length })
    } catch (err) {
      next(err)
    }
  }
)

// GET /api/problem-reports/:reportId — single report
router.get('/:reportId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await problemReportService.getById(req.params.reportId as string)
    res.json(report)
  } catch (err) {
    next(err)
  }
})

// GET /api/problem-reports/:reportId/screenshot — presigned screenshot URL
router.get(
  '/:reportId/screenshot',
  requireAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const report = await problemReportService.getById(req.params.reportId as string)
      if (!report.screenshot_key) {
        res.json({ url: null })
        return
      }
      const url = await problemReportService.getScreenshotUrl(report.screenshot_key)
      res.json({ url })
    } catch (err) {
      next(err)
    }
  }
)

// PATCH /api/problem-reports/:reportId/status — update report status
router.patch(
  '/:reportId/status',
  requireAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body as { status?: string }
      if (!status || !['new', 'reviewed', 'resolved'].includes(status)) {
        res.status(400).json({ message: 'Status must be new, reviewed, or resolved' })
        return
      }
      const updated = await problemReportService.updateStatus(
        req.params.reportId as string,
        status as 'new' | 'reviewed' | 'resolved'
      )
      res.json(updated)
    } catch (err) {
      next(err)
    }
  }
)

export default router
