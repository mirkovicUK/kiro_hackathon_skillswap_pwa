/**
 * ChatService - Handles chat messaging between matched users
 * Chat is only available after mutual interest is confirmed
 */

import { db } from '../db.js'
import { MatchService } from './MatchService.js'

export class ChatService {
  /**
   * Generate a consistent match ID from two user IDs
   * @param {number} userId1 
   * @param {number} userId2 
   * @returns {string} Match ID in format "smallerId-largerId"
   */
  static getMatchId(userId1, userId2) {
    const [user1, user2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1]
    return `${user1}-${user2}`
  }

  /**
   * Parse a match ID to get user IDs
   * @param {string} matchId 
   * @returns {{ user1Id: number, user2Id: number }}
   */
  static parseMatchId(matchId) {
    const [user1Id, user2Id] = matchId.split('-').map(Number)
    return { user1Id, user2Id }
  }

  /**
   * Check if a user is part of a match
   * @param {number} userId 
   * @param {string} matchId 
   * @returns {boolean}
   */
  static isUserInMatch(userId, matchId) {
    const { user1Id, user2Id } = this.parseMatchId(matchId)
    return userId === user1Id || userId === user2Id
  }

  /**
   * Get the other user ID in a match
   * @param {number} userId 
   * @param {string} matchId 
   * @returns {number}
   */
  static getOtherUserId(userId, matchId) {
    const { user1Id, user2Id } = this.parseMatchId(matchId)
    return userId === user1Id ? user2Id : user1Id
  }

  /**
   * Check if chat is enabled for a match (requires mutual interest)
   * @param {string} matchId 
   * @returns {boolean}
   */
  static isChatEnabled(matchId) {
    const { user1Id, user2Id } = this.parseMatchId(matchId)
    return MatchService.hasMutualInterest(user1Id, user2Id)
  }

  /**
   * Get or create a chat session for a match
   * @param {string} matchId 
   * @returns {Object} Chat session
   */
  static getOrCreateSession(matchId) {
    const { user1Id, user2Id } = this.parseMatchId(matchId)
    
    let session = db.prepare(
      'SELECT * FROM chat_sessions WHERE match_id = ?'
    ).get(matchId)

    if (!session) {
      db.prepare(`
        INSERT INTO chat_sessions (match_id, user1_id, user2_id)
        VALUES (?, ?, ?)
      `).run(matchId, user1Id, user2Id)

      session = db.prepare(
        'SELECT * FROM chat_sessions WHERE match_id = ?'
      ).get(matchId)
    }

    return session
  }

  /**
   * Send a message in a chat
   * @param {number} fromUserId - Sender user ID
   * @param {string} matchId - Match ID
   * @param {string} content - Message content
   * @param {boolean} isFromDemo - Whether this is from a demo user
   * @returns {Object} Created message
   */
  static sendMessage(fromUserId, matchId, content, isFromDemo = false) {
    // Validate user is part of match
    if (!this.isUserInMatch(fromUserId, matchId)) {
      const error = new Error('User is not part of this match')
      error.code = 'FORBIDDEN'
      throw error
    }

    // Check mutual interest (chat access control)
    if (!this.isChatEnabled(matchId)) {
      const error = new Error('Chat is not enabled - mutual interest required')
      error.code = 'CHAT_NOT_ENABLED'
      throw error
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      const error = new Error('Message content cannot be empty')
      error.code = 'INVALID_CONTENT'
      throw error
    }

    if (content.length > 500) {
      const error = new Error('Message content exceeds 500 character limit')
      error.code = 'CONTENT_TOO_LONG'
      throw error
    }

    // Sanitize content (basic XSS prevention)
    const sanitizedContent = this.sanitizeContent(content)

    const toUserId = this.getOtherUserId(fromUserId, matchId)

    // Ensure session exists
    this.getOrCreateSession(matchId)

    // Insert message
    const result = db.prepare(`
      INSERT INTO messages (match_id, from_user_id, to_user_id, content, is_from_demo)
      VALUES (?, ?, ?, ?, ?)
    `).run(matchId, fromUserId, toUserId, sanitizedContent, isFromDemo ? 1 : 0)

    // Update session
    const { user1Id, user2Id } = this.parseMatchId(matchId)
    const unreadColumn = toUserId === user1Id ? 'user1_unread_count' : 'user2_unread_count'
    
    db.prepare(`
      UPDATE chat_sessions 
      SET last_message_at = CURRENT_TIMESTAMP,
          ${unreadColumn} = ${unreadColumn} + 1
      WHERE match_id = ?
    `).run(matchId)

    // Return created message
    return db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid)
  }

  /**
   * Sanitize message content to prevent XSS
   * Only escape HTML tags, not quotes (React handles quote escaping)
   * @param {string} content 
   * @returns {string}
   */
  static sanitizeContent(content) {
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  /**
   * Get messages for a match with pagination
   * @param {string} matchId 
   * @param {number} limit - Max messages to return (default 50)
   * @param {number} offset - Offset for pagination (default 0)
   * @returns {Array} Messages in chronological order
   */
  static getMessages(matchId, limit = 50, offset = 0) {
    return db.prepare(`
      SELECT m.*, u.name as from_user_name
      FROM messages m
      JOIN users u ON m.from_user_id = u.id
      WHERE m.match_id = ?
      ORDER BY m.created_at ASC
      LIMIT ? OFFSET ?
    `).all(matchId, limit, offset)
  }

  /**
   * Get messages newer than a specific timestamp
   * @param {string} matchId 
   * @param {string} sinceTimestamp - ISO timestamp
   * @returns {Array} New messages
   */
  static getMessagesSince(matchId, sinceTimestamp) {
    return db.prepare(`
      SELECT m.*, u.name as from_user_name
      FROM messages m
      JOIN users u ON m.from_user_id = u.id
      WHERE m.match_id = ? AND m.created_at > ?
      ORDER BY m.created_at ASC
    `).all(matchId, sinceTimestamp)
  }

  /**
   * Mark messages as read for a user in a match
   * @param {string} matchId 
   * @param {number} userId - User who is reading
   */
  static markMessagesAsRead(matchId, userId) {
    // Mark all messages TO this user as read
    db.prepare(`
      UPDATE messages 
      SET is_read = 1 
      WHERE match_id = ? AND to_user_id = ? AND is_read = 0
    `).run(matchId, userId)

    // Reset unread counter for this user
    const { user1Id } = this.parseMatchId(matchId)
    const unreadColumn = userId === user1Id ? 'user1_unread_count' : 'user2_unread_count'
    
    db.prepare(`
      UPDATE chat_sessions 
      SET ${unreadColumn} = 0
      WHERE match_id = ?
    `).run(matchId)
  }

  /**
   * Get unread count for a user in a match
   * @param {string} matchId 
   * @param {number} userId 
   * @returns {number}
   */
  static getUnreadCount(matchId, userId) {
    const session = db.prepare(
      'SELECT * FROM chat_sessions WHERE match_id = ?'
    ).get(matchId)

    if (!session) return 0

    const { user1Id } = this.parseMatchId(matchId)
    return userId === user1Id ? session.user1_unread_count : session.user2_unread_count
  }

  /**
   * Get all unread counts for a user across all their chats
   * @param {number} userId 
   * @returns {Object} Map of matchId to unread count
   */
  static getAllUnreadCounts(userId) {
    const sessions = db.prepare(`
      SELECT match_id, user1_id, user1_unread_count, user2_unread_count
      FROM chat_sessions
      WHERE user1_id = ? OR user2_id = ?
    `).all(userId, userId)

    const counts = {}
    for (const session of sessions) {
      const count = session.user1_id === userId 
        ? session.user1_unread_count 
        : session.user2_unread_count
      if (count > 0) {
        counts[session.match_id] = count
      }
    }
    return counts
  }

  /**
   * Get total unread count for a user
   * @param {number} userId 
   * @returns {number}
   */
  static getTotalUnreadCount(userId) {
    const counts = this.getAllUnreadCounts(userId)
    return Object.values(counts).reduce((sum, count) => sum + count, 0)
  }

  /**
   * Get conversation stage for demo response selection
   * @param {string} matchId 
   * @returns {string} Conversation stage
   */
  static getConversationStage(matchId) {
    const session = db.prepare(
      'SELECT conversation_stage FROM chat_sessions WHERE match_id = ?'
    ).get(matchId)
    return session?.conversation_stage || 'greeting'
  }

  /**
   * Update conversation stage based on message count
   * @param {string} matchId 
   */
  static updateConversationStage(matchId) {
    const messageCount = db.prepare(
      'SELECT COUNT(*) as count FROM messages WHERE match_id = ?'
    ).get(matchId).count

    let stage = 'greeting'
    if (messageCount >= 11) {
      stage = 'busy_response'
    } else if (messageCount >= 7) {
      stage = 'meeting_coordination'
    } else if (messageCount >= 3) {
      stage = 'skill_discussion'
    }

    db.prepare(
      'UPDATE chat_sessions SET conversation_stage = ? WHERE match_id = ?'
    ).run(stage, matchId)

    return stage
  }

  /**
   * Get message count for a match
   * @param {string} matchId 
   * @returns {number}
   */
  static getMessageCount(matchId) {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM messages WHERE match_id = ?'
    ).get(matchId)
    return result?.count || 0
  }
}
