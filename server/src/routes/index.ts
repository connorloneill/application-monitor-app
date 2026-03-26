import { Router } from 'express'
import healthRouter from './health'
import authRouter from './auth'

const router = Router()

router.use('/health', healthRouter)
router.use('/auth', authRouter)

// Add domain routers here:
// router.use('/users', usersRouter)
// router.use('/chat', chatRouter)

export default router
