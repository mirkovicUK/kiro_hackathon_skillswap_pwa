/**
 * Property Tests for Matching Algorithm
 * Feature: skillswap-pwa
 * Properties: 6, 7, 9, 10
 */

import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import fc from 'fast-check'
import request from 'supertest'
import express from 'express'
import { db, initDatabase } from '../../server/db.js'
import authRoutes from '../../server/routes/auth.js'
import userRoutes from '../../server/routes/users.js'
import matchRoutes from '../../server/routes/matches.js'
import { GeoService } from '../../server/services/GeoService.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Create test app
function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/matches', matchRoutes)
  return app
}

// Load valid skills
const skillsPath = join(__dirname, '../../server/data/skills.json')
const validSkills = JSON.parse(readFileSync(skillsPath, 'utf-8')).skills

// Helper to create a user with skills and location
async function createUserWithProfile(app, email, name, location, offerSkills, needSkills) {
  // Register
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'testpass123', name })

  if (registerRes.status !== 201) {
    console.error('Register failed:', registerRes.status, registerRes.body)
    return null
  }

  const token = registerRes.body.token
  const userId = registerRes.body.userId

  // Set location
  const locRes = await request(app)
    .put('/api/users/me/location')
    .set('Authorization', `Bearer ${token}`)
    .send(location)

  if (locRes.status !== 200) {
    console.error('Location failed:', locRes.status, locRes.body)
  }

  // Set skills
  const skillsRes = await request(app)
    .put('/api/users/me/skills')
    .set('Authorization', `Bearer ${token}`)
    .send({ offer: offerSkills, need: needSkills })

  if (skillsRes.status !== 200) {
    console.error('Skills failed:', skillsRes.status, skillsRes.body)
  }

  return { userId, token, email, name }
}

describe('Property Tests: Matching Algorithm', () => {
  let app

  beforeAll(() => {
    initDatabase()
    app = createApp()
  })

  beforeEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM match_interests').run()
    db.prepare('DELETE FROM user_skills').run()
    db.prepare('DELETE FROM users WHERE email LIKE ?').run('test-%@example.com')
  })

  afterAll(() => {
    db.prepare('DELETE FROM match_interests').run()
    db.prepare('DELETE FROM user_skills').run()
    db.prepare('DELETE FROM users WHERE email LIKE ?').run('test-%@example.com')
  })

  /**
   * Property 6: Complementary Skills Matching
   * 
   * *For any* two users where User A offers at least one skill that User B needs
   * AND User B offers at least one skill that User A needs, the matching algorithm
   * SHALL identify them as a match (assuming they are within distance).
   *
   * GIVEN: Two users with complementary skills within 2 miles
   * WHEN: User A searches for matches
   * THEN: User B appears in the results
   *
   * Validates: Requirements 4.1
   */
  test('Property 6: Complementary Skills Matching', async () => {
    // Create two users with complementary skills
    const userA = await createUserWithProfile(
      app,
      'test-usera-complementary@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing', 'Carpentry'],  // A offers
      ['Web Design', 'Photography'] // A needs
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-complementary@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 }, // ~0.1 miles away
      ['Web Design', 'Graphic Design'], // B offers (includes what A needs)
      ['Plumbing', 'Electrical Work'] // B needs (includes what A offers)
    )

    expect(userA).not.toBeNull()
    expect(userB).not.toBeNull()

    // Verify skills were saved
    const userASkills = db.prepare('SELECT skill_name, type FROM user_skills WHERE user_id = ?').all(userA.userId)
    const userBSkills = db.prepare('SELECT skill_name, type FROM user_skills WHERE user_id = ?').all(userB.userId)
    
    expect(userASkills.length).toBeGreaterThan(0)
    expect(userBSkills.length).toBeGreaterThan(0)

    // User A discovers matches
    const discoverRes = await request(app)
      .get('/api/matches/discover')
      .set('Authorization', `Bearer ${userA.token}`)

    expect(discoverRes.status).toBe(200)
    expect(discoverRes.body.matches).toContainEqual(
      expect.objectContaining({
        userId: userB.userId,
        theyOffer: expect.arrayContaining(['Web Design']),
        theyNeed: expect.arrayContaining(['Plumbing'])
      })
    )
  })

  /**
   * Property 7: Distance Filtering
   * 
   * *For any* two users, if their calculated distance exceeds 2 miles,
   * they SHALL NOT appear in each other's match results, regardless of skill compatibility.
   *
   * GIVEN: Two users with complementary skills but > 2 miles apart
   * WHEN: Either user searches for matches
   * THEN: The other user does NOT appear in results
   *
   * Validates: Requirements 4.2
   */
  test('Property 7: Distance Filtering', async () => {
    // Create two users with complementary skills but far apart
    const userA = await createUserWithProfile(
      app,
      'test-usera-distance@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 }, // NYC
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-distance@example.com',
      'User B',
      { latitude: 40.7580, longitude: -73.9855 }, // ~3.5 miles away (Times Square)
      ['Web Design'],
      ['Plumbing']
    )

    expect(userA).not.toBeNull()
    expect(userB).not.toBeNull()

    // Verify distance is > 2 miles
    const distance = GeoService.calculateDistance(40.7128, -74.0060, 40.7580, -73.9855)
    expect(distance).toBeGreaterThan(2)

    // User A discovers matches - should NOT include User B
    const discoverRes = await request(app)
      .get('/api/matches/discover')
      .set('Authorization', `Bearer ${userA.token}`)

    expect(discoverRes.status).toBe(200)
    const matchUserIds = discoverRes.body.matches.map(m => m.userId)
    expect(matchUserIds).not.toContain(userB.userId)
  })

  /**
   * Property 9: Match Sorting by Distance
   * 
   * *For any* user with multiple matches, the matches SHALL be returned
   * sorted by distance in ascending order (nearest first).
   *
   * GIVEN: A user with multiple potential matches at different distances
   * WHEN: User searches for matches
   * THEN: Results are sorted by distance (nearest first)
   *
   * Validates: Requirements 4.4
   */
  test('Property 9: Match Sorting by Distance', async () => {
    // Create main user
    const mainUser = await createUserWithProfile(
      app,
      'test-main-sorting@example.com',
      'Main User',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing', 'Carpentry', 'Electrical Work'],
      ['Web Design', 'Photography', 'Cooking Classes']
    )

    // Create multiple users at different distances
    const nearUser = await createUserWithProfile(
      app,
      'test-near-sorting@example.com',
      'Near User',
      { latitude: 40.7135, longitude: -74.0065 }, // ~0.05 miles
      ['Web Design'],
      ['Plumbing']
    )

    const midUser = await createUserWithProfile(
      app,
      'test-mid-sorting@example.com',
      'Mid User',
      { latitude: 40.7200, longitude: -74.0100 }, // ~0.5 miles
      ['Photography'],
      ['Carpentry']
    )

    const farUser = await createUserWithProfile(
      app,
      'test-far-sorting@example.com',
      'Far User',
      { latitude: 40.7300, longitude: -74.0200 }, // ~1.5 miles
      ['Cooking Classes'],
      ['Electrical Work']
    )

    expect(mainUser).not.toBeNull()
    expect(nearUser).not.toBeNull()
    expect(midUser).not.toBeNull()
    expect(farUser).not.toBeNull()

    // Discover matches
    const discoverRes = await request(app)
      .get('/api/matches/discover')
      .set('Authorization', `Bearer ${mainUser.token}`)

    expect(discoverRes.status).toBe(200)
    const matches = discoverRes.body.matches

    // Verify sorted by distance
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i].distance).toBeGreaterThanOrEqual(matches[i - 1].distance)
    }
  })

  /**
   * Property 10: Match Response Completeness
   * 
   * *For any* match returned by the discovery endpoint, the response SHALL include:
   * user name, distance, skills they offer that the requester needs,
   * and skills they need that the requester offers.
   *
   * GIVEN: A user with potential matches
   * WHEN: User searches for matches
   * THEN: Each match contains all required fields
   *
   * Validates: Requirements 4.5
   */
  test('Property 10: Match Response Completeness', async () => {
    const userA = await createUserWithProfile(
      app,
      'test-usera-complete@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-complete@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 },
      ['Web Design'],
      ['Plumbing']
    )

    expect(userA).not.toBeNull()
    expect(userB).not.toBeNull()

    const discoverRes = await request(app)
      .get('/api/matches/discover')
      .set('Authorization', `Bearer ${userA.token}`)

    expect(discoverRes.status).toBe(200)
    expect(discoverRes.body.matches.length).toBeGreaterThan(0)

    // Verify each match has required fields
    for (const match of discoverRes.body.matches) {
      expect(match).toHaveProperty('userId')
      expect(match).toHaveProperty('name')
      expect(typeof match.name).toBe('string')
      expect(match).toHaveProperty('distance')
      expect(typeof match.distance).toBe('number')
      expect(match).toHaveProperty('theyOffer')
      expect(Array.isArray(match.theyOffer)).toBe(true)
      expect(match.theyOffer.length).toBeGreaterThan(0)
      expect(match).toHaveProperty('theyNeed')
      expect(Array.isArray(match.theyNeed)).toBe(true)
      expect(match.theyNeed.length).toBeGreaterThan(0)
      expect(match).toHaveProperty('myInterest')
      expect(match).toHaveProperty('theirInterest')
    }
  })

  /**
   * Additional test: No self-matching
   * Users should not appear in their own match results
   */
  test('Users do not match with themselves', async () => {
    const user = await createUserWithProfile(
      app,
      'test-self-match@example.com',
      'Self User',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    expect(user).not.toBeNull()

    const discoverRes = await request(app)
      .get('/api/matches/discover')
      .set('Authorization', `Bearer ${user.token}`)

    expect(discoverRes.status).toBe(200)
    const matchUserIds = discoverRes.body.matches.map(m => m.userId)
    expect(matchUserIds).not.toContain(user.userId)
  })

  /**
   * Additional test: No matches without complementary skills
   * Users with non-overlapping skills should not match
   */
  test('No match without complementary skills', async () => {
    const userA = await createUserWithProfile(
      app,
      'test-usera-nocomplement@example.com',
      'User A',
      { latitude: 40.7128, longitude: -74.0060 },
      ['Plumbing'],
      ['Web Design']
    )

    const userB = await createUserWithProfile(
      app,
      'test-userb-nocomplement@example.com',
      'User B',
      { latitude: 40.7140, longitude: -74.0070 },
      ['Cooking Classes'], // Does NOT offer what A needs
      ['Photography'] // Does NOT need what A offers
    )

    expect(userA).not.toBeNull()
    expect(userB).not.toBeNull()

    const discoverRes = await request(app)
      .get('/api/matches/discover')
      .set('Authorization', `Bearer ${userA.token}`)

    expect(discoverRes.status).toBe(200)
    const matchUserIds = discoverRes.body.matches.map(m => m.userId)
    expect(matchUserIds).not.toContain(userB.userId)
  })
})
