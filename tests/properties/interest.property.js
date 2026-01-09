/**
 * Property Tests for Interest Flow
 * Feature: skillswap-pwa
 * Properties: 11, 12
 */

import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import { db, initDatabase } from '../../server/db.js'
import authRoutes from '../../server/routes/auth.js'
import userRoutes from '../../server/routes/users.js'
import matchRoutes from '../../server/routes/matches.js'

// Create test app
function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/matches', matchRoutes)
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

describe('Property Tests: Interest Flow', () => {
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
   * Property 11: Single Interest Returns Pending
   * 
   * *For any* match where only one user has expressed interest,
   * the match status SHALL be "pending" and meeting scheduling SHALL be disabled.
   *
   * GIVEN: Two users with complementary skills
   * WHEN: Only one user expresses interest
   * THEN: Status is "pending"
   *
   * Validates: Requirements 5.3, 5.6
   */
  test('Property 11: Single Interest Returns Pending', async () => {
    const userA = await createUserWithProfile(
      app,
      'test-usera-pending@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-pending@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 },
      ['Web Design'],
      ['Plumbing']
    )

    expect(userA).not.toBeNull()
    expect(userB).not.toBeNull()

    // User A expresses interest in User B
    const interestRes = await request(app)
      .post(`/api/matches/${userB.userId}/interest`)
      .set('Authorization', `Bearer ${userA.token}`)

    expect(interestRes.status).toBe(200)
    expect(interestRes.body.status).toBe('pending')

    // Verify User A's discover shows myInterest=true, theirInterest=false
    const discoverRes = await request(app)
      .get('/api/matches/discover')
      .set('Authorization', `Bearer ${userA.token}`)

    const matchB = discoverRes.body.matches.find(m => m.userId === userB.userId)
    expect(matchB).toBeDefined()
    expect(matchB.myInterest).toBe(true)
    expect(matchB.theirInterest).toBe(false)

    // Verify mutual matches is empty (no mutual interest yet)
    const mutualRes = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${userA.token}`)

    expect(mutualRes.status).toBe(200)
    expect(mutualRes.body.matches.length).toBe(0)
  })

  /**
   * Property 12: Mutual Interest Unlocks Meeting
   * 
   * *For any* match where both users have expressed interest,
   * the match status SHALL be "mutual" and meeting scheduling SHALL be enabled.
   *
   * GIVEN: Two users with complementary skills
   * WHEN: Both users express interest
   * THEN: Status is "mutual" and they appear in each other's mutual matches
   *
   * Validates: Requirements 5.4, 6.1
   */
  test('Property 12: Mutual Interest Unlocks Meeting', async () => {
    const userA = await createUserWithProfile(
      app,
      'test-usera-mutual@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-mutual@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 },
      ['Web Design'],
      ['Plumbing']
    )

    expect(userA).not.toBeNull()
    expect(userB).not.toBeNull()

    // User A expresses interest first
    const interestA = await request(app)
      .post(`/api/matches/${userB.userId}/interest`)
      .set('Authorization', `Bearer ${userA.token}`)

    expect(interestA.status).toBe(200)
    expect(interestA.body.status).toBe('pending')

    // User B expresses interest - should become mutual
    const interestB = await request(app)
      .post(`/api/matches/${userA.userId}/interest`)
      .set('Authorization', `Bearer ${userB.token}`)

    expect(interestB.status).toBe(200)
    expect(interestB.body.status).toBe('mutual')

    // Verify User A's discover shows mutual interest
    const discoverA = await request(app)
      .get('/api/matches/discover')
      .set('Authorization', `Bearer ${userA.token}`)

    const matchInDiscoverA = discoverA.body.matches.find(m => m.userId === userB.userId)
    expect(matchInDiscoverA).toBeDefined()
    expect(matchInDiscoverA.myInterest).toBe(true)
    expect(matchInDiscoverA.theirInterest).toBe(true)

    // Verify User A has User B in mutual matches
    const mutualA = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${userA.token}`)

    expect(mutualA.status).toBe(200)
    expect(mutualA.body.matches.length).toBe(1)
    expect(mutualA.body.matches[0].otherUser.id).toBe(userB.userId)

    // Verify User B has User A in mutual matches
    const mutualB = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${userB.token}`)

    expect(mutualB.status).toBe(200)
    expect(mutualB.body.matches.length).toBe(1)
    expect(mutualB.body.matches[0].otherUser.id).toBe(userA.userId)
  })

  /**
   * Additional test: Interest is idempotent
   * Expressing interest multiple times should not create duplicates
   */
  test('Interest expression is idempotent', async () => {
    const userA = await createUserWithProfile(
      app,
      'test-usera-idempotent@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-idempotent@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 },
      ['Web Design'],
      ['Plumbing']
    )

    // Express interest multiple times
    await request(app)
      .post(`/api/matches/${userB.userId}/interest`)
      .set('Authorization', `Bearer ${userA.token}`)

    await request(app)
      .post(`/api/matches/${userB.userId}/interest`)
      .set('Authorization', `Bearer ${userA.token}`)

    await request(app)
      .post(`/api/matches/${userB.userId}/interest`)
      .set('Authorization', `Bearer ${userA.token}`)

    // Should only have one interest record
    const interests = db.prepare(
      'SELECT * FROM match_interests WHERE from_user_id = ? AND to_user_id = ?'
    ).all(userA.userId, userB.userId)

    expect(interests.length).toBe(1)
  })

  /**
   * Additional test: Cannot express interest in yourself
   */
  test('Cannot express interest in yourself', async () => {
    const user = await createUserWithProfile(
      app,
      'test-self-interest@example.com',
      'Self User',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const res = await request(app)
      .post(`/api/matches/${user.userId}/interest`)
      .set('Authorization', `Bearer ${user.token}`)

    expect(res.status).toBe(400)
  })

  /**
   * Additional test: Declining removes interest
   */
  test('Declining match removes interest', async () => {
    const userA = await createUserWithProfile(
      app,
      'test-usera-decline@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-decline@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 },
      ['Web Design'],
      ['Plumbing']
    )

    // Express interest
    await request(app)
      .post(`/api/matches/${userB.userId}/interest`)
      .set('Authorization', `Bearer ${userA.token}`)

    // Decline
    const declineRes = await request(app)
      .delete(`/api/matches/${userB.userId}`)
      .set('Authorization', `Bearer ${userA.token}`)

    expect(declineRes.status).toBe(200)
    expect(declineRes.body.success).toBe(true)

    // Verify interest is removed
    const interest = db.prepare(
      'SELECT * FROM match_interests WHERE from_user_id = ? AND to_user_id = ?'
    ).get(userA.userId, userB.userId)

    expect(interest).toBeUndefined()
  })
})
