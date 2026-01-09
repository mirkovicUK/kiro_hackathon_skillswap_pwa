import { AuthService } from '../services/AuthService.js'

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'unauthorized', 
      message: 'No token provided' 
    })
  }

  const token = authHeader.split(' ')[1]
  const decoded = AuthService.verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ 
      error: 'unauthorized', 
      message: 'Invalid or expired token' 
    })
  }

  // Attach user ID to request
  req.userId = decoded.userId
  next()
}

/**
 * Optional auth middleware
 * Attaches user if token present, but doesn't require it
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const decoded = AuthService.verifyToken(token)
    if (decoded) {
      req.userId = decoded.userId
    }
  }

  next()
}
