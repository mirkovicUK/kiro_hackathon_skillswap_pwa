/**
 * Property Tests for Meeting System
 * Feature: skillswap-pwa
 * Properties: 13, 14, 15, 16
 */

import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import { db, initDatabase } from '../../server/db.js'
import authRoutes from '../../server/routes/auth.js'
import userRoutes from '../../server/routes/users.js'
import matchRoutes from '../../server/routes/matches.js'
import meetingRoutes from '../../server/routes/meetings.js'

// Create test app
function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/matches', matchRoutes)
  app.use('/api/meetings', meetingRoutes)
  return app
}

// Helper to create a user with skills and location
async function createUserWithProfile(app, email, name, location, offerSkills, needSkills) {
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'testpass123', name })

  if (registerRes.status !== 201) return null

  const token = registerRes.body.token
  const userId = registerRes.body.userId

  await request(app)
    .put('/api/users/me/location')
    .set('Authorization', `Bearer ${token}`)
    .send(location)

  await request(app)
    .put('/api/users/me/skills')
    .set('Authorization', `Bearer ${token}`)
    .send({ offer: offerSkills, need: needSkills })

  return { userId, token, email, name }
}

// Helper to create mutual match
async function createMutualMatch(app, userA, userB) {
  await request(app)
    .post(`/api/matches/${userB.userId}/interest`)
    .set('Authorization', `Bearer ${userA.token}`)

  const res = await request(app)
    .post(`/api/matches/${userA.userId}/interest`)
    .set('Authorization', `Bearer ${userB.token}`)

  return res.body.matchId
}

describe('Property Tests: Meeting System', () => {
  let app

  beforeAll(() => {
    initDatabase()
    app = createApp()
  })

  beforeEach(() => {
    db.prepare('DELETE FROM meetings').run()
    db.prepare('DELETE FROM match_interests').run()
    db.prepare('DELETE FROM user_skills').run()
    db.prepare('DELETE FROM users WHERE email LIKE ?').run('test-%@example.com')
  })

  afterAll(() => {
    db.prepare('DELETE FROM meetings').run()
    db.prepare('DELETE FROM match_interests').run()
    db.prepare('DELETE FROM user_skills').run()
    db.prepare('DELETE FROM users WHERE email LIKE ?').run('test-%@example.com')
  })

  /**
   * Property 13: Meeting Proposal Round-Trip
   * 
   * *For any* meeting proposal with location, date, and time,
   * storing the proposal and retrieving it SHALL return all fields accurately.
   *
   * GIVEN: A mutual match between two users
   * WHEN: One user proposes a meeting
   * THEN: The meeting details can be retrieved accurately
   *
   * Validates: Requirements 6.2, 6.3
   */
  test('Property 13: Meeting Proposal Round-Trip', async () => {
    const userA = await createUserWithProfile(
      app,
      'test-usera-proposal@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-proposal@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 },
      ['Web Design'],
      ['Plumbing']
    )

    const matchId = await createMutualMatch(app, userA, userB)

    // Propose meeting
    const proposalData = {
      matchId,
      location: 'Blue Bottle Coffee, 123 Main St',
      proposedDate: '2026-01-15',
      proposedTime: '14:30'
    }

    const proposeRes = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${userA.token}`)
      .send(proposalData)

    expect(proposeRes.status).toBe(201)
    expect(proposeRes.body.status).toBe('proposed')

    // Retrieve meeting
    const getRes = await request(app)
      .get(`/api/meetings/${matchId}`)
      .set('Authorization', `Bearer ${userA.token}`)

    expect(getRes.status).toBe(200)
    expect(getRes.body.meeting).not.toBeNull()
    expect(getRes.body.meeting.location).toBe(proposalData.location)
    expect(getRes.body.meeting.proposedDate).toBe(proposalData.proposedDate)
    expect(getRes.body.meeting.proposedTime).toBe(proposalData.proposedTime)
    expect(getRes.body.meeting.status).toBe('proposed')
  })

  /**
   * Property 14: Meeting Acceptance Flow
   * 
   * *For any* proposed meeting, when the other user accepts,
   * the meeting status SHALL change to "scheduled" and both users
   * SHALL be able to view the meeting details.
   *
   * GIVEN: A proposed meeting
   * WHEN: The other user accepts
   * THEN: Status changes to "scheduled"
   *
   * Validates: Requirements 6.4, 6.5, 6.6
   */
  test('Property 14: Meeting Acceptance Flow', async () => {
    const userA = await createUserWithProfile(
      app,
      'test-usera-accept@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-accept@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 },
      ['Web Design'],
      ['Plumbing']
    )

    const matchId = await createMutualMatch(app, userA, userB)

    // User A proposes meeting
    const proposeRes = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        matchId,
        location: 'Coffee Shop',
        proposedDate: '2026-01-15',
        proposedTime: '10:00'
      })

    const meetingId = proposeRes.body.meetingId

    // User B accepts
    const acceptRes = await request(app)
      .put(`/api/meetings/${meetingId}/accept`)
      .set('Authorization', `Bearer ${userB.token}`)

    expect(acceptRes.status).toBe(200)
    expect(acceptRes.body.status).toBe('scheduled')

    // Both users can view meeting
    const viewA = await request(app)
      .get(`/api/meetings/${matchId}`)
      .set('Authorization', `Bearer ${userA.token}`)

    const viewB = await request(app)
      .get(`/api/meetings/${matchId}`)
      .set('Authorization', `Bearer ${userB.token}`)

    expect(viewA.body.meeting.status).toBe('scheduled')
    expect(viewB.body.meeting.status).toBe('scheduled')
  })

  /**
   * Property 15: Meeting Confirmation Requires Both
   * 
   * *For any* scheduled meeting, the status SHALL only change to "completed"
   * when BOTH users have independently confirmed the meeting happened.
   *
   * GIVEN: A scheduled meeting
   * WHEN: Only one user confirms
   * THEN: Status remains "scheduled"
   * WHEN: Both users confirm
   * THEN: Status changes to "completed"
   *
   * Validates: Requirements 7.2, 7.3, 7.5
   */
  test('Property 15: Meeting Confirmation Requires Both', async () => {
    const userA = await createUserWithProfile(
      app,
      'test-usera-confirm@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-confirm@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 },
      ['Web Design'],
      ['Plumbing']
    )

    const matchId = await createMutualMatch(app, userA, userB)

    // Propose and accept meeting
    const proposeRes = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        matchId,
        location: 'Coffee Shop',
        proposedDate: '2026-01-15',
        proposedTime: '10:00'
      })

    const meetingId = proposeRes.body.meetingId

    await request(app)
      .put(`/api/meetings/${meetingId}/accept`)
      .set('Authorization', `Bearer ${userB.token}`)

    // User A confirms - should still be scheduled
    const confirmA = await request(app)
      .put(`/api/meetings/${meetingId}/confirm`)
      .set('Authorization', `Bearer ${userA.token}`)

    expect(confirmA.status).toBe(200)
    expect(confirmA.body.status).toBe('scheduled')
    expect(confirmA.body.bothConfirmed).toBe(false)

    // Verify status is still scheduled
    const viewAfterA = await request(app)
      .get(`/api/meetings/${matchId}`)
      .set('Authorization', `Bearer ${userA.token}`)

    expect(viewAfterA.body.meeting.status).toBe('scheduled')
    expect(viewAfterA.body.meeting.userConfirmed).toBe(true)
    expect(viewAfterA.body.meeting.otherConfirmed).toBe(false)

    // User B confirms - should now be completed
    const confirmB = await request(app)
      .put(`/api/meetings/${meetingId}/confirm`)
      .set('Authorization', `Bearer ${userB.token}`)

    expect(confirmB.status).toBe(200)
    expect(confirmB.body.status).toBe('completed')
    expect(confirmB.body.bothConfirmed).toBe(true)

    // Verify status is completed
    const viewAfterB = await request(app)
      .get(`/api/meetings/${matchId}`)
      .set('Authorization', `Bearer ${userA.token}`)

    expect(viewAfterB.body.meeting.status).toBe('completed')
  })

  /**
   * Property 16: Verification Unlocks Skill Swap
   * 
   * *For any* meeting marked as "completed" (both users confirmed),
   * the match SHALL be marked as verified and skill swap functionality
   * SHALL be unlocked.
   *
   * GIVEN: A completed meeting
   * WHEN: Checking match status
   * THEN: Skill swap is unlocked
   *
   * Validates: Requirements 7.4
   */
  test('Property 16: Verification Unlocks Skill Swap', async () => {
    const userA = await createUserWithProfile(
      app,
      'test-usera-unlock@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-unlock@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 },
      ['Web Design'],
      ['Plumbing']
    )

    const matchId = await createMutualMatch(app, userA, userB)

    // Complete the full meeting flow
    const proposeRes = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        matchId,
        location: 'Coffee Shop',
        proposedDate: '2026-01-15',
        proposedTime: '10:00'
      })

    const meetingId = proposeRes.body.meetingId

    await request(app)
      .put(`/api/meetings/${meetingId}/accept`)
      .set('Authorization', `Bearer ${userB.token}`)

    await request(app)
      .put(`/api/meetings/${meetingId}/confirm`)
      .set('Authorization', `Bearer ${userA.token}`)

    await request(app)
      .put(`/api/meetings/${meetingId}/confirm`)
      .set('Authorization', `Bearer ${userB.token}`)

    // Check mutual matches - should show completed status
    const matchesA = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${userA.token}`)

    expect(matchesA.status).toBe(200)
    const match = matchesA.body.matches.find(m => m.matchId === matchId)
    expect(match).toBeDefined()
    expect(match.meetingStatus).toBe('completed')
  })

  /**
   * Additional test: Cannot propose meeting without mutual interest
   */
  test('Cannot propose meeting without mutual interest', async () => {
    const userA = await createUserWithProfile(
      app,
      'test-usera-nomutual@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-nomutual@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 },
      ['Web Design'],
      ['Plumbing']
    )

    // Only one-sided interest
    await request(app)
      .post(`/api/matches/${userB.userId}/interest`)
      .set('Authorization', `Bearer ${userA.token}`)

    // Construct matchId manually
    const matchId = userA.userId < userB.userId 
      ? `${userA.userId}-${userB.userId}` 
      : `${userB.userId}-${userA.userId}`

    // Try to propose meeting
    const proposeRes = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        matchId,
        location: 'Coffee Shop',
        proposedDate: '2026-01-15',
        proposedTime: '10:00'
      })

    expect(proposeRes.status).toBe(403)
  })

  /**
   * Additional test: Cannot accept own proposal
   */
  test('Cannot accept own meeting proposal', async () => {
    const userA = await createUserWithProfile(
      app,
      'test-usera-ownaccept@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-ownaccept@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 },
      ['Web Design'],
      ['Plumbing']
    )

    const matchId = await createMutualMatch(app, userA, userB)

    const proposeRes = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        matchId,
        location: 'Coffee Shop',
        proposedDate: '2026-01-15',
        proposedTime: '10:00'
      })

    const meetingId = proposeRes.body.meetingId

    // User A tries to accept their own proposal
    const acceptRes = await request(app)
      .put(`/api/meetings/${meetingId}/accept`)
      .set('Authorization', `Bearer ${userA.token}`)

    expect(acceptRes.status).toBe(400)
  })
})
