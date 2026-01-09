import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { MeetingService } from '../services/MeetingService.js'

const router = Router()

/**
 * POST /api/meetings
 * Propose a coffee meeting
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    const { matchId, location, proposedDate, proposedTime } = req.body

    if (!matchId || !location || !proposedDate || !proposedTime) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'matchId, location, proposedDate, and proposedTime are required'
      })
    }

    const result = MeetingService.proposeMeeting(
      req.userId,
      matchId,
      location,
      proposedDate,
      proposedTime
    )

    res.status(201).json(result)
  } catch (err) {
    if (err.code === 'FORBIDDEN') {
      return res.status(403).json({ error: 'forbidden', message: err.message })
    }
    console.error('Propose meeting error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to propose meeting' })
  }
})

/**
 * GET /api/meetings/:matchId
 * Get meeting details for a match
 */
router.get('/:matchId', authMiddleware, (req, res) => {
  try {
    const meeting = MeetingService.getMeeting(req.userId, req.params.matchId)

    if (!meeting) {
      return res.json({ meeting: null })
    }

    res.json({ meeting })
  } catch (err) {
    if (err.code === 'FORBIDDEN') {
      return res.status(403).json({ error: 'forbidden', message: err.message })
    }
    console.error('Get meeting error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to get meeting' })
  }
})

/**
 * PUT /api/meetings/:meetingId/accept
 * Accept a meeting proposal
 */
router.put('/:meetingId/accept', authMiddleware, (req, res) => {
  try {
    const meetingId = parseInt(req.params.meetingId, 10)
    if (isNaN(meetingId)) {
      return res.status(400).json({ error: 'validation_error', message: 'Invalid meeting ID' })
    }

    const result = MeetingService.acceptMeeting(req.userId, meetingId)
    res.json(result)
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'not_found', message: err.message })
    }
    if (err.code === 'FORBIDDEN') {
      return res.status(403).json({ error: 'forbidden', message: err.message })
    }
    if (err.code === 'VALIDATION') {
      return res.status(400).json({ error: 'validation_error', message: err.message })
    }
    console.error('Accept meeting error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to accept meeting' })
  }
})

/**
 * PUT /api/meetings/:meetingId/confirm
 * Confirm meeting happened
 */
router.put('/:meetingId/confirm', authMiddleware, (req, res) => {
  try {
    const meetingId = parseInt(req.params.meetingId, 10)
    if (isNaN(meetingId)) {
      return res.status(400).json({ error: 'validation_error', message: 'Invalid meeting ID' })
    }

    const result = MeetingService.confirmMeeting(req.userId, meetingId)
    res.json(result)
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'not_found', message: err.message })
    }
    if (err.code === 'FORBIDDEN') {
      return res.status(403).json({ error: 'forbidden', message: err.message })
    }
    if (err.code === 'VALIDATION') {
      return res.status(400).json({ error: 'validation_error', message: err.message })
    }
    console.error('Confirm meeting error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to confirm meeting' })
  }
})

export default router
