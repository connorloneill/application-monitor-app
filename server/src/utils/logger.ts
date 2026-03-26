import winston from 'winston'
import { config } from '../config'

// Structured JSON logger — adapts to any application.
// Usage:
//   import { logger } from '../utils/logger'
//   logger.info('User logged in', { userId, email })
//   logger.error('Payment failed', { orderId, error: err.message })

const { combine, timestamp, json, colorize, simple, errors } = winston.format

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  simple()
)

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
)

export const logger = winston.createLogger({
  level: config.log.level,
  format: config.nodeEnv === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
})

// Child logger factory — scopes logs to a module/service
export function getLogger(module: string) {
  return logger.child({ module })
}
