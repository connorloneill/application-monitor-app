import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { AppError } from '../middleware/errorHandler'

const router = Router()

// Replace this with your actual user lookup / Cognito integration
router.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string }
    if (!email || !password) throw new AppError(400, 'Email and password are required')

    // TODO: validate against your user store
    if (password !== 'demo') throw new AppError(401, 'Invalid credentials')

    const user = { id: '1', email, role: 'user' }
    const token = jwt.sign(user, config.jwt.secret, { expiresIn: config.jwt.expiresIn })

    res.json({ token, user })
  } catch (err) {
    next(err)
  }
})

export default router
