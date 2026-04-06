import { Router, Response, NextFunction } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import * as diagnosisService from '../services/diagnosisService'

const router = Router()

// GET /api/diagnoses/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const diagnosis = await diagnosisService.getById(req.params.id as string)
    res.json(diagnosis)
  } catch (err) {
    next(err)
  }
})

export default router
