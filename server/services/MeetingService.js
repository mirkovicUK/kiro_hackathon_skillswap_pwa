/**
 * MeetingService - Handles coffee meeting scheduling and confirmation
 */

import { db } from '../db.js'
import { MatchService } from './MatchService.js'

export class MeetingService {
  /**
   * Parse matchId to get user IDs
   * @param {string} matchId - Format: "userId1-userId2"
   * @returns {{ user1Id: number, user2Id: number }}
   */
  static parseMatchId(matchId) {
    const [user1Id, user2Id] = matchId.split('-').map(Number)
    if (isNaN(user1Id) || isNaN(user2Id)) {
      throw new Error('Invalid match ID format')
    }
    return { user1Id, user2Id }
  }

  /**
   * Propose a coffee meeting
   * @param {number} proposerId - User proposing the meeting
   * @param {string} matchId - Match ID (format: "userId1-userId2")
   * @param {string} location - Meeting location
   * @param {string} proposedDate - Date (YYYY-MM-DD)
   * @param {string} proposedTime - Time (HH:MM)
   * @returns {{ meetingId: number, status: string }}
   */
  static proposeMeeting(proposerId, matchId, location, proposedDate, proposedTime) {
    const { user1Id, user2Id } = this.parseMatchId(matchId)

    // Verify proposer is part of the match
    if (proposerId !== user1Id && proposerId !== user2Id) {
      const error = new Error('You are not part of this match')
      error.code = 'FORBIDDEN'
      throw error
    }

    // Verify mutual interest exists
    if (!MatchService.hasMutualInterest(user1Id, user2Id)) {
      const error = new Error('Mutual interest required to schedule meeting')
      error.code = 'FORBIDDEN'
      throw error
    }

    // Check if meeting already exists
    const existing = db.prepare(
      'SELECT id, status FROM meetings WHERE user1_id = ? AND user2_id = ?'
    ).get(user1Id, user2Id)

    if (existing) {
      // Check if the other user is a demo user (auto-accept)
      const otherUserId = proposerId === user1Id ? user2Id : user1Id
      const otherUser = db.prepare('SELECT is_demo_user FROM users WHERE id = ?').get(otherUserId)
      const newStatus = otherUser?.is_demo_user ? 'scheduled' : 'proposed'

      // Update existing meeting
      db.prepare(`
        UPDATE meetings 
        SET location = ?, proposed_date = ?, proposed_time = ?, 
            proposed_by = ?, status = ?
        WHERE id = ?
      `).run(location, proposedDate, proposedTime, proposerId, newStatus, existing.id)

      return { meetingId: existing.id, status: newStatus }
    }

    // Check if the other user is a demo user (auto-accept)
    const otherUserId = proposerId === user1Id ? user2Id : user1Id
    const otherUser = db.prepare('SELECT is_demo_user FROM users WHERE id = ?').get(otherUserId)
    const initialStatus = otherUser?.is_demo_user ? 'scheduled' : 'proposed'

    // Create new meeting
    const result = db.prepare(`
      INSERT INTO meetings (user1_id, user2_id, location, proposed_date, proposed_time, proposed_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(user1Id, user2Id, location, proposedDate, proposedTime, proposerId, initialStatus)

    return { meetingId: result.lastInsertRowid, status: initialStatus }
  }

  /**
   * Get meeting details for a match
   * @param {number} userId - Current user
   * @param {string} matchId - Match ID
   * @returns {object | null}
   */
  static getMeeting(userId, matchId) {
    const { user1Id, user2Id } = this.parseMatchId(matchId)

    // Verify user is part of the match
    if (userId !== user1Id && userId !== user2Id) {
      const error = new Error('You are not part of this match')
      error.code = 'FORBIDDEN'
      throw error
    }

    const meeting = db.prepare(`
      SELECT m.*, 
             u1.name as user1_name, 
             u2.name as user2_name,
             p.name as proposed_by_name
      FROM meetings m
      JOIN users u1 ON u1.id = m.user1_id
      JOIN users u2 ON u2.id = m.user2_id
      JOIN users p ON p.id = m.proposed_by
      WHERE m.user1_id = ? AND m.user2_id = ?
    `).get(user1Id, user2Id)

    if (!meeting) return null

    const otherUserId = userId === user1Id ? user2Id : user1Id
    const otherUserName = userId === user1Id ? meeting.user2_name : meeting.user1_name
    const userConfirmed = userId === user1Id ? meeting.user1_confirmed : meeting.user2_confirmed
    const otherConfirmed = userId === user1Id ? meeting.user2_confirmed : meeting.user1_confirmed

    return {
      meetingId: meeting.id,
      matchId,
      location: meeting.location,
      proposedDate: meeting.proposed_date,
      proposedTime: meeting.proposed_time,
      proposedBy: meeting.proposed_by,
      proposedByName: meeting.proposed_by_name,
      status: meeting.status,
      otherUser: {
        id: otherUserId,
        name: otherUserName
      },
      userConfirmed: !!userConfirmed,
      otherConfirmed: !!otherConfirmed,
      createdAt: meeting.created_at
    }
  }

  /**
   * Accept a meeting proposal
   * @param {number} userId - User accepting
   * @param {number} meetingId - Meeting ID
   * @returns {{ status: string }}
   */
  static acceptMeeting(userId, meetingId) {
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId)

    if (!meeting) {
      const error = new Error('Meeting not found')
      error.code = 'NOT_FOUND'
      throw error
    }

    // Verify user is part of the meeting
    if (userId !== meeting.user1_id && userId !== meeting.user2_id) {
      const error = new Error('You are not part of this meeting')
      error.code = 'FORBIDDEN'
      throw error
    }

    // Can't accept your own proposal
    if (userId === meeting.proposed_by) {
      const error = new Error('Cannot accept your own proposal')
      error.code = 'VALIDATION'
      throw error
    }

    // Update status to scheduled
    db.prepare("UPDATE meetings SET status = 'scheduled' WHERE id = ?").run(meetingId)

    return { status: 'scheduled' }
  }

  /**
   * Confirm meeting happened
   * @param {number} userId - User confirming
   * @param {number} meetingId - Meeting ID
   * @returns {{ status: string, bothConfirmed: boolean }}
   */
  static confirmMeeting(userId, meetingId) {
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId)

    if (!meeting) {
      const error = new Error('Meeting not found')
      error.code = 'NOT_FOUND'
      throw error
    }

    // Verify user is part of the meeting
    if (userId !== meeting.user1_id && userId !== meeting.user2_id) {
      const error = new Error('You are not part of this meeting')
      error.code = 'FORBIDDEN'
      throw error
    }

    // Meeting must be scheduled first
    if (meeting.status !== 'scheduled' && meeting.status !== 'completed') {
      const error = new Error('Meeting must be scheduled before confirming')
      error.code = 'VALIDATION'
      throw error
    }

    // Update confirmation for this user
    const confirmColumn = userId === meeting.user1_id ? 'user1_confirmed' : 'user2_confirmed'
    db.prepare(`UPDATE meetings SET ${confirmColumn} = 1 WHERE id = ?`).run(meetingId)

    // AUTO-CONFIRM: If the other user is a demo user, auto-confirm for them too
    const otherUserId = userId === meeting.user1_id ? meeting.user2_id : meeting.user1_id
    const otherUser = db.prepare('SELECT is_demo_user FROM users WHERE id = ?').get(otherUserId)
    if (otherUser?.is_demo_user) {
      const otherConfirmColumn = userId === meeting.user1_id ? 'user2_confirmed' : 'user1_confirmed'
      db.prepare(`UPDATE meetings SET ${otherConfirmColumn} = 1 WHERE id = ?`).run(meetingId)
    }

    // Check if both confirmed
    const updated = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId)
    const bothConfirmed = !!(updated.user1_confirmed && updated.user2_confirmed)

    // If both confirmed, mark as completed
    if (bothConfirmed) {
      db.prepare("UPDATE meetings SET status = 'completed' WHERE id = ?").run(meetingId)
    }

    return {
      status: bothConfirmed ? 'completed' : 'scheduled',
      bothConfirmed,
      userConfirmed: true
    }
  }

  /**
   * Check if a match has a completed meeting (skill swap unlocked)
   * @param {string} matchId 
   * @returns {boolean}
   */
  static isSwapUnlocked(matchId) {
    const { user1Id, user2Id } = this.parseMatchId(matchId)
    
    const meeting = db.prepare(`
      SELECT status FROM meetings 
      WHERE user1_id = ? AND user2_id = ? AND status = 'completed'
    `).get(user1Id, user2Id)

    return !!meeting
  }
}
