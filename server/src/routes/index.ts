import { Router } from 'express'
import healthRouter from './health'
import authRouter from './auth'
import problemReportsRouter from './problemReports'

const router = Router()

router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/problem-reports', problemReportsRouter)

export default router
