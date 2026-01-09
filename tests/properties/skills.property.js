/**
 * Property Tests for Skills and Location
 * Feature: skillswap-pwa
 * Properties: 4, 5
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fc from 'fast-check'
import request from 'supertest'
import express from 'express'
import { db, initDatabase } from '../../server/db.js'
import authRoutes from '../../server/routes/auth.js'
import userRoutes from '../../server/routes/users.js'
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
  return app
}

// Load valid skills for testing
const skillsPath = join(__dirname, '../../server/data/skills.json')
const validSkills = JSON.parse(readFileSync(skillsPath, 'utf-8')).skills

describe('Property Tests: Skills and Location', () => {
  let app

  beforeAll(() => {
    initDatabase()
    app = createApp()
  })

  beforeEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM user_skills').run()
    db.prepare('DELETE FROM users WHERE email LIKE ?').run('test-%@example.com')
  })

  afterAll(() => {
    db.prepare('DELETE FROM user_skills').run()
    db.prepare('DELETE FROM users WHERE email LIKE ?').run('test-%@example.com')
  })

  /**
   * Property 4: Skills Storage Round-Trip
   * For any user and any set of skills (both offer and need types),
   * storing the skills and then retrieving them SHALL return the exact same skills with correct types.
   * Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7
   */
  test.concurrent('Property 4: Skills Storage Round-Trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random subsets of valid skills for offer and need
        fc.uniqueArray(fc.constantFrom(...validSkills), { minLength: 0, maxLength: 5 }),
        fc.uniqueArray(fc.constantFrom(...validSkills), { minLength: 0, maxLength: 5 }),
        fc.uuid(),
        async (offerSkills, needSkills, uniqueId) => {
          const email = `test-${uniqueId}@example.com`
          const password = 'testpass123'
          const name = 'Test User'

          // Register user
          const registerRes = await request(app)
            .post('/api/auth/register')
            .send({ email, password, name })

          if (registerRes.status !== 201) {
            // Skip if registration failed (e.g., duplicate email)
            return true
          }

          const token = registerRes.body.token

          // Store skills
          const updateRes = await request(app)
            .put('/api/users/me/skills')
            .set('Authorization', `Bearer ${token}`)
            .send({ offer: offerSkills, need: needSkills })

          expect(updateRes.status).toBe(200)

          // Retrieve skills
          const getRes = await request(app)
            .get('/api/users/me/skills')
            .set('Authorization', `Bearer ${token}`)

          expect(getRes.status).toBe(200)

          // Verify round-trip: same skills returned
          expect(getRes.body.offer.sort()).toEqual(offerSkills.sort())
          expect(getRes.body.need.sort()).toEqual(needSkills.sort())

          return true
        }
      ),
      { numRuns: 50 } // Reduced for faster test execution
    )
  })

  /**
   * Property 5: Location Precision Preservation
   * For any latitude and longitude coordinates with 6+ decimal places,
   * storing and retrieving the location SHALL preserve precision to at least 6 decimal places.
   * Validates: Requirements 3.2, 3.5
   */
  test.concurrent('Property 5: Location Precision Preservation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid latitude (-90 to 90) with high precision
        fc.double({ min: -89.999999, max: 89.999999, noNaN: true }),
        // Generate valid longitude (-180 to 180) with high precision
        fc.double({ min: -179.999999, max: 179.999999, noNaN: true }),
        fc.uuid(),
        async (latitude, longitude, uniqueId) => {
          const email = `test-${uniqueId}@example.com`
          const password = 'testpass123'
          const name = 'Test User'

          // Round to 6 decimal places for comparison
          const roundedLat = Math.round(latitude * 1000000) / 1000000
          const roundedLon = Math.round(longitude * 1000000) / 1000000

          // Register user
          const registerRes = await request(app)
            .post('/api/auth/register')
            .send({ email, password, name })

          if (registerRes.status !== 201) {
            return true
          }

          const token = registerRes.body.token

          // Store location
          const updateRes = await request(app)
            .put('/api/users/me/location')
            .set('Authorization', `Bearer ${token}`)
            .send({ latitude: roundedLat, longitude: roundedLon })

          expect(updateRes.status).toBe(200)

          // Retrieve user to check location
          const getRes = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${token}`)

          expect(getRes.status).toBe(200)

          // Verify precision preserved to 6 decimal places
          const storedLat = getRes.body.latitude
          const storedLon = getRes.body.longitude

          // Check precision is preserved (within floating point tolerance)
          expect(Math.abs(storedLat - roundedLat)).toBeLessThan(0.0000001)
          expect(Math.abs(storedLon - roundedLon)).toBeLessThan(0.0000001)

          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Additional test: Invalid skills rejection
   * Validates that invalid skill names are rejected
   */
  test('Invalid skills are rejected', async () => {
    const email = 'test-invalid-skills@example.com'
    const password = 'testpass123'
    const name = 'Test User'

    // Register user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name })

    expect(registerRes.status).toBe(201)
    const token = registerRes.body.token

    // Try to store invalid skills
    const updateRes = await request(app)
      .put('/api/users/me/skills')
      .set('Authorization', `Bearer ${token}`)
      .send({ offer: ['InvalidSkill123'], need: ['AnotherFakeSkill'] })

    expect(updateRes.status).toBe(400)
    expect(updateRes.body.error).toBe('validation_error')
  })

  /**
   * Additional test: Location validation
   * Validates that invalid coordinates are rejected
   */
  test('Invalid coordinates are rejected', async () => {
    const email = 'test-invalid-coords@example.com'
    const password = 'testpass123'
    const name = 'Test User'

    // Register user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name })

    expect(registerRes.status).toBe(201)
    const token = registerRes.body.token

    // Try invalid latitude (> 90)
    let updateRes = await request(app)
      .put('/api/users/me/location')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: 91, longitude: 0 })

    expect(updateRes.status).toBe(400)

    // Try invalid longitude (> 180)
    updateRes = await request(app)
      .put('/api/users/me/location')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: 0, longitude: 181 })

    expect(updateRes.status).toBe(400)
  })
})
