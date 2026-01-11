/**
 * NotificationService - Handles push notifications for chat messages
 * Sends notifications when users receive new messages
 */

import { db } from '../db.js'

export class NotificationService {
  /**
   * Get push subscriptions for a user
   * @param {number} userId 
   * @returns {Array} Subscriptions
   */
  static getSubscriptions(userId) {
    return db.prepare(`
      SELECT * FROM push_subscriptions WHERE user_id = ?
    `).all(userId)
  }

  /**
   * Check if user has any push subscriptions
   * @param {number} userId 
   * @returns {boolean}
   */
  static hasSubscription(userId) {
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = ?
    `).get(userId)
    return count?.count > 0
  }

  /**
   * Send push notification for a new message
   * Note: In production, this would use web-push library
   * For demo purposes, we just log the notification
   * @param {number} recipientId - User to notify
   * @param {string} senderName - Name of message sender
   * @param {string} messagePreview - Preview of message content
   * @param {string} matchId - Match ID for deep linking
   */
  static async sendMessageNotification(recipientId, senderName, messagePreview, matchId) {
    const subscriptions = this.getSubscriptions(recipientId)
    
    if (subscriptions.length === 0) {
      console.log(`📭 No push subscriptions for user ${recipientId}`)
      return { sent: false, reason: 'no_subscription' }
    }

    const payload = {
      title: `New message from ${senderName}`,
      body: messagePreview.length > 50 ? messagePreview.substring(0, 47) + '...' : messagePreview,
      matchId,
      url: `/matches`
    }

    // In production, we would use web-push library here
    // For demo, we log the notification
    console.log(`📬 Push notification queued for user ${recipientId}:`, payload)

    // Track notification for testing
    this.lastNotification = {
      recipientId,
      payload,
      timestamp: new Date().toISOString()
    }

    return { sent: true, payload }
  }

  /**
   * Remove invalid subscriptions (e.g., when push fails)
   * @param {number} userId 
   * @param {string} endpoint 
   */
  static removeSubscription(userId, endpoint) {
    db.prepare(`
      DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?
    `).run(userId, endpoint)
  }

  /**
   * Get last notification (for testing)
   * @returns {Object|null}
   */
  static getLastNotification() {
    return this.lastNotification || null
  }

  /**
   * Clear last notification (for testing)
   */
  static clearLastNotification() {
    this.lastNotification = null
  }
}
