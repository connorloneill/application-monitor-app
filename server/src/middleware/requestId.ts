import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

// Attaches a unique request ID to every incoming request.
// Included in all log entries and error responses for traceability.
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) ?? uuidv4()
  res.setHeader('x-request-id', id)
  next()
}
