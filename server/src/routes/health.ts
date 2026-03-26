import { Router } from 'express'
import { APP_VERSION } from '../constants/versions'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ status: 'ok', version: APP_VERSION, timestamp: new Date().toISOString() })
})

export default router
