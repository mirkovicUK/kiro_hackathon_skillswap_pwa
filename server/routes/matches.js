import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { MatchService } from '../services/MatchService.js'

const router = Router()

/**
 * GET /api/matches/discover
 * Find potential matches based on complementary skills and location
 */
router.get('/discover', authMiddleware, (req, res) => {
  try {
    const matches = MatchService.findMatches(req.userId)
    res.json({ matches })
  } catch (err) {
    console.error('Discover matches error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to find matches' })
  }
})

/**
 * POST /api/matches/:userId/interest
 * Express interest in another user
 */
router.post('/:userId/interest', authMiddleware, (req, res) => {
  try {
    const targetId = parseInt(req.params.userId, 10)
    
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'validation_error', message: 'Invalid user ID' })
    }

    const result = MatchService.expressInterest(req.userId, targetId)
    res.json(result)
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'not_found', message: err.message })
    }
    if (err.message.includes('yourself')) {
      return res.status(400).json({ error: 'validation_error', message: err.message })
    }
    console.error('Express interest error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to express interest' })
  }
})

/**
 * GET /api/matches
 * Get all mutual matches (where both users expressed interest)
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const matches = MatchService.getMutualMatches(req.userId)
    res.json({ matches })
  } catch (err) {
    console.error('Get matches error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to get matches' })
  }
})

/**
 * DELETE /api/matches/:userId
 * Decline/remove interest in a user
 */
router.delete('/:userId', authMiddleware, (req, res) => {
  try {
    const targetId = parseInt(req.params.userId, 10)
    
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'validation_error', message: 'Invalid user ID' })
    }

    const result = MatchService.declineMatch(req.userId, targetId)
    res.json(result)
  } catch (err) {
    console.error('Decline match error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to decline match' })
  }
})

export default router
