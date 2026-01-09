/**
 * MatchService - Handles skill matching and interest management
 * Core matching logic: complementary skills within 2-mile radius
 */

import { db } from '../db.js'
import { GeoService } from './GeoService.js'

const MATCH_RADIUS_MILES = 2

export class MatchService {
  /**
   * Find potential matches for a user
   * Matches are users with complementary skills within radius
   * Only shows demo users that belong to this user (owner_user_id = userId)
   * @param {number} userId 
   * @returns {Array} Array of match objects sorted by distance
   */
  static findMatches(userId) {
    // Get current user's data
    const user = db.prepare(
      'SELECT id, latitude, longitude FROM users WHERE id = ?'
    ).get(userId)

    if (!user || user.latitude === null || user.longitude === null) {
      return []
    }

    // Get user's skills
    const userSkills = db.prepare(
      'SELECT skill_name, type FROM user_skills WHERE user_id = ?'
    ).all(userId)

    const iOffer = userSkills.filter(s => s.type === 'offer').map(s => s.skill_name)
    const iNeed = userSkills.filter(s => s.type === 'need').map(s => s.skill_name)

    if (iOffer.length === 0 || iNeed.length === 0) {
      return []
    }

    // Get all other users with location
    // For demo users, only show those owned by this user (owner_user_id = userId)
    // Also include real users (is_demo_user = 0) and shared demo users (owner_user_id IS NULL)
    const otherUsers = db.prepare(`
      SELECT id, name, latitude, longitude, is_demo_user
      FROM users 
      WHERE id != ? 
      AND latitude IS NOT NULL 
      AND longitude IS NOT NULL
      AND (
        is_demo_user = 0 
        OR owner_user_id = ? 
        OR owner_user_id IS NULL
      )
    `).all(userId, userId)

    const matches = []

    for (const other of otherUsers) {
      // Calculate distance
      const distance = GeoService.calculateDistance(
        user.latitude, user.longitude,
        other.latitude, other.longitude
      )

      // Skip if outside radius
      if (distance > MATCH_RADIUS_MILES) {
        continue
      }

      // Get other user's skills
      const otherSkills = db.prepare(
        'SELECT skill_name, type FROM user_skills WHERE user_id = ?'
      ).all(other.id)

      const theyOffer = otherSkills.filter(s => s.type === 'offer').map(s => s.skill_name)
      const theyNeed = otherSkills.filter(s => s.type === 'need').map(s => s.skill_name)

      // Check for complementary skills
      // They offer something I need AND they need something I offer
      const skillsTheyOfferThatINeed = theyOffer.filter(s => iNeed.includes(s))
      const skillsINeedThatTheyOffer = iOffer.filter(s => theyNeed.includes(s))

      if (skillsTheyOfferThatINeed.length === 0 || skillsINeedThatTheyOffer.length === 0) {
        continue
      }

      // Check interest status
      const myInterest = db.prepare(
        'SELECT id FROM match_interests WHERE from_user_id = ? AND to_user_id = ?'
      ).get(userId, other.id)

      const theirInterest = db.prepare(
        'SELECT id FROM match_interests WHERE from_user_id = ? AND to_user_id = ?'
      ).get(other.id, userId)

      matches.push({
        userId: other.id,
        name: other.name,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        theyOffer: skillsTheyOfferThatINeed,
        theyNeed: skillsINeedThatTheyOffer,
        myInterest: !!myInterest,
        theirInterest: !!theirInterest,
        isDemoUser: !!other.is_demo_user
      })
    }

    // Sort by distance (nearest first)
    matches.sort((a, b) => a.distance - b.distance)

    return matches
  }

  /**
   * Express interest in another user
   * @param {number} userId - Current user
   * @param {number} targetId - User to express interest in
   * @returns {{ matchId: number, status: 'pending' | 'mutual' }}
   */
  static expressInterest(userId, targetId) {
    if (userId === targetId) {
      throw new Error('Cannot express interest in yourself')
    }

    // Check if target user exists and if they're a demo user
    const target = db.prepare('SELECT id, is_demo_user FROM users WHERE id = ?').get(targetId)
    if (!target) {
      const error = new Error('User not found')
      error.code = 'NOT_FOUND'
      throw error
    }

    // Check if already expressed interest
    const existing = db.prepare(
      'SELECT id FROM match_interests WHERE from_user_id = ? AND to_user_id = ?'
    ).get(userId, targetId)

    if (!existing) {
      // Create interest record
      db.prepare(
        'INSERT INTO match_interests (from_user_id, to_user_id) VALUES (?, ?)'
      ).run(userId, targetId)
    }

    // AUTO-CONFIRM: If target is a demo user, automatically express interest back
    if (target.is_demo_user) {
      const demoInterestExists = db.prepare(
        'SELECT id FROM match_interests WHERE from_user_id = ? AND to_user_id = ?'
      ).get(targetId, userId)
      
      if (!demoInterestExists) {
        db.prepare(
          'INSERT INTO match_interests (from_user_id, to_user_id) VALUES (?, ?)'
        ).run(targetId, userId)
      }
    }

    // Check if mutual interest exists
    const theirInterest = db.prepare(
      'SELECT id FROM match_interests WHERE from_user_id = ? AND to_user_id = ?'
    ).get(targetId, userId)

    const status = theirInterest ? 'mutual' : 'pending'

    // Get or create match ID (use smaller ID first for consistency)
    const [user1, user2] = userId < targetId ? [userId, targetId] : [targetId, userId]
    
    return {
      matchId: `${user1}-${user2}`,
      status,
      userId: targetId
    }
  }

  /**
   * Get all mutual matches for a user
   * @param {number} userId 
   * @returns {Array} Array of mutual match objects
   */
  static getMutualMatches(userId) {
    // Find users where both have expressed interest
    const mutualMatches = db.prepare(`
      SELECT 
        u.id, u.name, u.latitude, u.longitude, u.is_demo_user,
        mi1.created_at as my_interest_date
      FROM match_interests mi1
      JOIN match_interests mi2 ON mi1.to_user_id = mi2.from_user_id AND mi1.from_user_id = mi2.to_user_id
      JOIN users u ON u.id = mi1.to_user_id
      WHERE mi1.from_user_id = ?
    `).all(userId)

    const user = db.prepare(
      'SELECT latitude, longitude FROM users WHERE id = ?'
    ).get(userId)

    if (!user) return []

    // Get user's skills for exchange info
    const userSkills = db.prepare(
      'SELECT skill_name, type FROM user_skills WHERE user_id = ?'
    ).all(userId)

    const iOffer = userSkills.filter(s => s.type === 'offer').map(s => s.skill_name)
    const iNeed = userSkills.filter(s => s.type === 'need').map(s => s.skill_name)

    return mutualMatches.map(match => {
      // Calculate distance
      const distance = user.latitude && user.longitude && match.latitude && match.longitude
        ? GeoService.calculateDistance(user.latitude, user.longitude, match.latitude, match.longitude)
        : null

      // Get other user's skills
      const otherSkills = db.prepare(
        'SELECT skill_name, type FROM user_skills WHERE user_id = ?'
      ).all(match.id)

      const theyOffer = otherSkills.filter(s => s.type === 'offer').map(s => s.skill_name)
      const theyNeed = otherSkills.filter(s => s.type === 'need').map(s => s.skill_name)

      // Calculate skill exchange
      const iGive = iOffer.filter(s => theyNeed.includes(s))
      const iGet = theyOffer.filter(s => iNeed.includes(s))

      // Check meeting status
      const [user1, user2] = userId < match.id ? [userId, match.id] : [match.id, userId]
      const meeting = db.prepare(
        'SELECT status FROM meetings WHERE user1_id = ? AND user2_id = ?'
      ).get(user1, user2)

      return {
        matchId: `${user1}-${user2}`,
        otherUser: {
          id: match.id,
          name: match.name,
          distance: distance ? Math.round(distance * 100) / 100 : null,
          isDemoUser: !!match.is_demo_user
        },
        skillsExchange: {
          iGive,
          iGet
        },
        meetingStatus: meeting?.status || 'none',
        matchedAt: match.my_interest_date
      }
    })
  }

  /**
   * Decline/remove a match
   * @param {number} userId 
   * @param {number} targetId 
   * @returns {{ success: boolean }}
   */
  static declineMatch(userId, targetId) {
    // Remove interest from current user
    db.prepare(
      'DELETE FROM match_interests WHERE from_user_id = ? AND to_user_id = ?'
    ).run(userId, targetId)

    return { success: true }
  }

  /**
   * Check if two users have mutual interest
   * @param {number} userId1 
   * @param {number} userId2 
   * @returns {boolean}
   */
  static hasMutualInterest(userId1, userId2) {
    const interest1 = db.prepare(
      'SELECT id FROM match_interests WHERE from_user_id = ? AND to_user_id = ?'
    ).get(userId1, userId2)

    const interest2 = db.prepare(
      'SELECT id FROM match_interests WHERE from_user_id = ? AND to_user_id = ?'
    ).get(userId2, userId1)

    return !!(interest1 && interest2)
  }
}
