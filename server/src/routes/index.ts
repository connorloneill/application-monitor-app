import { Router } from 'express'
import healthRouter from './health'
import authRouter from './auth'
import problemReportsRouter from './problemReports'
import devToolsRouter from './devTools'

const router = Router()

router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/problem-reports', problemReportsRouter)
router.use('/dev-tools', devToolsRouter)

export default router
