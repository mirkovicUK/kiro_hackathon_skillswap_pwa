import { Router } from 'express'
import { AuthService } from '../services/AuthService.js'

const router = Router()

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    const result = await AuthService.register(email, password, name)

    res.status(201).json({
      userId: result.userId,
      token: result.token,
      user: result.user
    })
  } catch (err) {
    if (err.code === 'EMAIL_EXISTS') {
      return res.status(409).json({ 
        error: 'conflict', 
        message: err.message 
      })
    }
    
    // Validation errors
    if (err.message.includes('required') || err.message.includes('must be')) {
      return res.status(400).json({ 
        error: 'validation_error', 
        message: err.message 
      })
    }

    console.error('Register error:', err)
    res.status(500).json({ 
      error: 'server_error', 
      message: 'Registration failed' 
    })
  }
})

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const result = await AuthService.login(email, password)

    res.json({
      userId: result.userId,
      token: result.token,
      user: result.user
    })
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ 
        error: 'unauthorized', 
        message: err.message 
      })
    }

    // Validation errors
    if (err.message.includes('required')) {
      return res.status(400).json({ 
        error: 'validation_error', 
        message: err.message 
      })
    }

    console.error('Login error:', err)
    res.status(500).json({ 
      error: 'server_error', 
      message: 'Login failed' 
    })
  }
})

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (req, res) => {
  // JWT is stateless, so logout is handled client-side
  // This endpoint exists for API completeness
  res.json({ success: true })
})

/**
 * POST /api/auth/verify-email
 * Verify if an email exists in the system (for password reset)
 */
router.post('/verify-email', (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Email is required'
      })
    }

    const result = AuthService.verifyEmail(email)

    if (!result.exists) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Email not found'
      })
    }

    res.json({
      exists: true,
      userId: result.userId
    })
  } catch (err) {
    console.error('Verify email error:', err)
    res.status(500).json({
      error: 'server_error',
      message: 'Failed to verify email'
    })
  }
})

/**
 * POST /api/auth/reset-password
 * Reset password for a verified user
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body

    if (!email) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Email is required'
      })
    }

    const result = await AuthService.resetPassword(email, newPassword, confirmPassword)

    res.json(result)
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({
        error: 'not_found',
        message: err.message
      })
    }

    if (err.code === 'VALIDATION_ERROR') {
      return res.status(400).json({
        error: 'validation_error',
        message: err.message
      })
    }

    console.error('Reset password error:', err)
    res.status(500).json({
      error: 'server_error',
      message: 'Failed to reset password'
    })
  }
})

export default router
