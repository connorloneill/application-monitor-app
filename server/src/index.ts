import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { config } from './config'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { requestId } from './middleware/requestId'
import routes from './routes'

const app = express()

// ── Security ────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: config.clientUrl, credentials: true }))

// ── Body parsing ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))

// ── Request tracing ─────────────────────────────────────────────────────
app.use(requestId)

// ── Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes)

// ── Error handling (must be last) ────────────────────────────────────────
app.use(errorHandler)

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`, {
    env: config.nodeEnv,
    port: config.port,
  })
})

export default app
