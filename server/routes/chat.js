/**
 * Chat Routes - API endpoints for chat messaging
 * All routes require authentication
 */

import express from 'express'
import { ChatService } from '../services/ChatService.js'
import { DemoResponseService } from '../services/DemoResponseService.js'
import { authMiddleware } from '../middleware/auth.js'
import { db } from '../db.js'

const router = express.Router()

// All chat routes require authentication
router.use(authMiddleware)

/**
 * POST /api/chat/push-subscription
 * Register push notification subscription
 */
router.post('/push-subscription', (req, res) => {
  try {
    const userId = req.userId
    const { endpoint, keys } = req.body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        error: 'INVALID_SUBSCRIPTION',
        message: 'Invalid push subscription data'
      })
    }

    // Store or update subscription
    db.prepare(`
      INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key)
      VALUES (?, ?, ?, ?)
    `).run(userId, endpoint, keys.p256dh, keys.auth)

    res.json({ success: true })
  } catch (error) {
    console.error('Push subscription error:', error)
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to register push subscription'
    })
  }
})

/**
 * DELETE /api/chat/push-subscription
 * Unregister push notification subscription
 */
router.delete('/push-subscription', (req, res) => {
  try {
    const userId = req.userId
    
    db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId)

    res.json({ success: true })
  } catch (error) {
    console.error('Push unsubscription error:', error)
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to unregister push subscription'
    })
  }
})

/**
 * POST /api/chat/:matchId/messages
 * Send a message in a chat
 */
router.post('/:matchId/messages', (req, res) => {
  try {
    const { matchId } = req.params
    const { content } = req.body
    const userId = req.userId

    // Validate user is part of match
    if (!ChatService.isUserInMatch(userId, matchId)) {
      return res.status(403).json({ 
        error: 'FORBIDDEN', 
        message: 'You are not part of this match' 
      })
    }

    // Validate content
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ 
        error: 'INVALID_CONTENT', 
        message: 'Message content is required' 
      })
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'EMPTY_CONTENT', 
        message: 'Message cannot be empty' 
      })
    }

    if (content.length > 500) {
      return res.status(400).json({ 
        error: 'CONTENT_TOO_LONG', 
        message: 'Message exceeds 500 character limit' 
      })
    }

    const message = ChatService.sendMessage(userId, matchId, content)
    
    // Update conversation stage after sending
    ChatService.updateConversationStage(matchId)

    // Trigger demo response if the other user is a demo user
    DemoResponseService.handleNewMessage(matchId, userId)

    res.status(201).json(message)
  } catch (error) {
    console.error('Send message error:', error)
    
    if (error.code === 'CHAT_NOT_ENABLED') {
      return res.status(403).json({ 
        error: 'CHAT_NOT_ENABLED', 
        message: 'Chat requires mutual interest' 
      })
    }
    
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ 
        error: 'FORBIDDEN', 
        message: error.message 
      })
    }

    res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Failed to send message' 
    })
  }
})

/**
 * GET /api/chat/:matchId/messages
 * Get message history for a chat
 */
router.get('/:matchId/messages', (req, res) => {
  try {
    const { matchId } = req.params
    const userId = req.userId
    const { limit = 50, offset = 0, since } = req.query

    // Validate user is part of match
    if (!ChatService.isUserInMatch(userId, matchId)) {
      return res.status(403).json({ 
        error: 'FORBIDDEN', 
        message: 'You are not part of this match' 
      })
    }

    // Check if chat is enabled
    if (!ChatService.isChatEnabled(matchId)) {
      return res.status(403).json({ 
        error: 'CHAT_NOT_ENABLED', 
        message: 'Chat requires mutual interest' 
      })
    }

    let messages
    if (since) {
      // Get messages since a specific timestamp (for polling)
      messages = ChatService.getMessagesSince(matchId, since)
    } else {
      // Get paginated messages
      messages = ChatService.getMessages(matchId, parseInt(limit), parseInt(offset))
    }

    res.json({ 
      messages,
      matchId,
      totalCount: ChatService.getMessageCount(matchId)
    })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Failed to get messages' 
    })
  }
})

/**
 * POST /api/chat/:matchId/read
 * Mark messages as read
 */
router.post('/:matchId/read', (req, res) => {
  try {
    const { matchId } = req.params
    const userId = req.userId

    // Validate user is part of match
    if (!ChatService.isUserInMatch(userId, matchId)) {
      return res.status(403).json({ 
        error: 'FORBIDDEN', 
        message: 'You are not part of this match' 
      })
    }

    ChatService.markMessagesAsRead(matchId, userId)

    res.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Failed to mark messages as read' 
    })
  }
})

/**
 * GET /api/chat/unread
 * Get all unread counts for the current user
 */
router.get('/unread', (req, res) => {
  try {
    const userId = req.userId
    const counts = ChatService.getAllUnreadCounts(userId)
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

    res.json({ 
      counts,
      total
    })
  } catch (error) {
    console.error('Get unread counts error:', error)
    res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Failed to get unread counts' 
    })
  }
})

/**
 * GET /api/chat/:matchId/unread
 * Get unread count for a specific match
 */
router.get('/:matchId/unread', (req, res) => {
  try {
    const { matchId } = req.params
    const userId = req.userId

    // Validate user is part of match
    if (!ChatService.isUserInMatch(userId, matchId)) {
      return res.status(403).json({ 
        error: 'FORBIDDEN', 
        message: 'You are not part of this match' 
      })
    }

    const enabled = ChatService.isChatEnabled(matchId)
    const unreadCount = enabled ? ChatService.getUnreadCount(matchId, userId) : 0

    res.json({ 
      matchId,
      unreadCount
    })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Failed to get unread count' 
    })
  }
})

/**
 * GET /api/chat/:matchId/status
 * Get chat status for a match (enabled, unread count, etc.)
 */
router.get('/:matchId/status', (req, res) => {
  try {
    const { matchId } = req.params
    const userId = req.userId

    // Validate user is part of match
    if (!ChatService.isUserInMatch(userId, matchId)) {
      return res.status(403).json({ 
        error: 'FORBIDDEN', 
        message: 'You are not part of this match' 
      })
    }

    const enabled = ChatService.isChatEnabled(matchId)
    const unreadCount = enabled ? ChatService.getUnreadCount(matchId, userId) : 0
    const stage = enabled ? ChatService.getConversationStage(matchId) : null

    res.json({ 
      matchId,
      enabled,
      unreadCount,
      conversationStage: stage
    })
  } catch (error) {
    console.error('Get chat status error:', error)
    res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Failed to get chat status' 
    })
  }
})

export default router
