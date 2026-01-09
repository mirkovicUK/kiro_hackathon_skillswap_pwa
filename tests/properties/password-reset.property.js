/**
 * Property Tests for Password Reset
 * Feature: password-reset
 * Properties: 1-5
 */

import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import fc from 'fast-check'
import request from 'supertest'
import express from 'express'
import { db, initDatabase } from '../../server/db.js'
import authRoutes from '../../server/routes/auth.js'

describe('Property Tests: Password Reset', () => {
  let app

  beforeAll(() => {
    initDatabase()
    app = express()
    app.use(express.json())
    app.use('/api/auth', authRoutes)
  })

  beforeEach(() => {
    // Clean up test users before each test
    db.prepare("DELETE FROM users WHERE email LIKE 'pwreset-%'").run()
  })

  afterAll(() => {
    // Final cleanup
    db.prepare("DELETE FROM users WHERE email LIKE 'pwreset-%'").run()
  })

  /**
   * Property 1: Email Verification Accuracy
   * 
   * *For any* email address, the verify-email endpoint SHALL return
   * `exists: true` if and only if a user with that email exists in the database.
   *
   * GIVEN: An email address
   * WHEN: Calling verify-email endpoint
   * THEN: Returns exists: true only if email is in database
   *
   * Validates: Requirements 1.2, 1.3, 1.4
   */
  test('Property 1: Email Verification Accuracy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (uniqueId, email, password, name) => {
          const testEmail = `pwreset-${uniqueId}@test.com`
          
          // First verify non-existent email returns 404
          const notFoundRes = await request(app)
            .post('/api/auth/verify-email')
            .send({ email: testEmail })
          
          expect(notFoundRes.status).toBe(404)
          expect(notFoundRes.body.exists).toBeUndefined()
          
          // Register the user
          const registerRes = await request(app)
            .post('/api/auth/register')
            .send({ email: testEmail, password, name })
          
          if (registerRes.status !== 201) return true
          
          // Now verify existing email returns 200 with exists: true
          const foundRes = await request(app)
            .post('/api/auth/verify-email')
            .send({ email: testEmail })
          
          expect(foundRes.status).toBe(200)
          expect(foundRes.body.exists).toBe(true)
          expect(foundRes.body.userId).toBeDefined()
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 2: Password Length Validation
   * 
   * *For any* password string, the reset-password endpoint SHALL reject
   * passwords with fewer than 8 characters and accept passwords with 8 or more characters.
   *
   * GIVEN: A registered user and a password of varying length
   * WHEN: Attempting to reset password
   * THEN: Rejects if < 8 chars, accepts if >= 8 chars
   *
   * Validates: Requirements 2.2, 2.5
   */
  test('Property 2: Password Length Validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 1, max: 20 }),
        async (uniqueId, passwordLength) => {
          const testEmail = `pwreset-${uniqueId}@test.com`
          const originalPassword = 'original123'
          const newPassword = 'x'.repeat(passwordLength)
          
          // Register user first
          const registerRes = await request(app)
            .post('/api/auth/register')
            .send({ email: testEmail, password: originalPassword, name: 'Test User' })
          
          if (registerRes.status !== 201) return true
          
          // Attempt password reset
          const resetRes = await request(app)
            .post('/api/auth/reset-password')
            .send({ 
              email: testEmail, 
              newPassword, 
              confirmPassword: newPassword 
            })
          
          if (passwordLength < 8) {
            // Should reject short passwords
            expect(resetRes.status).toBe(400)
            expect(resetRes.body.error).toBe('validation_error')
            expect(resetRes.body.message).toContain('8 characters')
          } else {
            // Should accept valid length passwords
            expect(resetRes.status).toBe(200)
            expect(resetRes.body.success).toBe(true)
          }
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 3: Password Confirmation Matching
   * 
   * *For any* two password strings submitted as newPassword and confirmPassword,
   * the reset-password endpoint SHALL reject the request if they do not match exactly.
   *
   * GIVEN: A registered user and two password strings
   * WHEN: Attempting to reset password
   * THEN: Rejects if passwords don't match, accepts if they match
   *
   * Validates: Requirements 2.3, 2.4
   */
  test('Property 3: Password Confirmation Matching', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 8, maxLength: 50 }),
        fc.string({ minLength: 8, maxLength: 50 }),
        async (uniqueId, password1, password2) => {
          const testEmail = `pwreset-${uniqueId}@test.com`
          const originalPassword = 'original123'
          
          // Register user first
          const registerRes = await request(app)
            .post('/api/auth/register')
            .send({ email: testEmail, password: originalPassword, name: 'Test User' })
          
          if (registerRes.status !== 201) return true
          
          // Attempt password reset with potentially mismatched passwords
          const resetRes = await request(app)
            .post('/api/auth/reset-password')
            .send({ 
              email: testEmail, 
              newPassword: password1, 
              confirmPassword: password2 
            })
          
          if (password1 !== password2) {
            // Should reject mismatched passwords
            expect(resetRes.status).toBe(400)
            expect(resetRes.body.error).toBe('validation_error')
            expect(resetRes.body.message).toContain('do not match')
          } else {
            // Should accept matching passwords
            expect(resetRes.status).toBe(200)
            expect(resetRes.body.success).toBe(true)
          }
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 4: Password Reset Round-Trip
   * 
   * *For any* valid email and new password (≥8 chars), after calling reset-password,
   * logging in with the new password SHALL succeed, and logging in with the old password SHALL fail.
   *
   * GIVEN: A registered user with known password
   * WHEN: Password is reset to a new value
   * THEN: New password works, old password fails
   *
   * Validates: Requirements 3.1, 3.2
   */
  test('Property 4: Password Reset Round-Trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 8, maxLength: 50 }),
        fc.string({ minLength: 8, maxLength: 50 }),
        async (uniqueId, oldPassword, newPassword) => {
          // Skip if passwords are the same (can't test old vs new)
          if (oldPassword === newPassword) return true
          
          const testEmail = `pwreset-${uniqueId}@test.com`
          
          // Register user with old password
          const registerRes = await request(app)
            .post('/api/auth/register')
            .send({ email: testEmail, password: oldPassword, name: 'Test User' })
          
          if (registerRes.status !== 201) return true
          
          // Verify old password works before reset
          const loginBeforeRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testEmail, password: oldPassword })
          
          expect(loginBeforeRes.status).toBe(200)
          
          // Reset password
          const resetRes = await request(app)
            .post('/api/auth/reset-password')
            .send({ 
              email: testEmail, 
              newPassword, 
              confirmPassword: newPassword 
            })
          
          expect(resetRes.status).toBe(200)
          
          // Verify new password works
          const loginNewRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testEmail, password: newPassword })
          
          expect(loginNewRes.status).toBe(200)
          expect(loginNewRes.body.token).toBeDefined()
          
          // Verify old password no longer works
          const loginOldRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testEmail, password: oldPassword })
          
          expect(loginOldRes.status).toBe(401)
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 5: Password Hash Security
   * 
   * *For any* password reset operation, the stored password_hash SHALL be a valid
   * bcrypt hash (starting with "$2a$" or "$2b$") and SHALL NOT equal the plain text password.
   *
   * GIVEN: A registered user
   * WHEN: Password is reset
   * THEN: Stored hash is bcrypt format and not plaintext
   *
   * Validates: Requirements 3.1
   */
  test('Property 5: Password Hash Security', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 8, maxLength: 50 }),
        async (uniqueId, newPassword) => {
          const testEmail = `pwreset-${uniqueId}@test.com`
          const originalPassword = 'original123'
          
          // Register user
          const registerRes = await request(app)
            .post('/api/auth/register')
            .send({ email: testEmail, password: originalPassword, name: 'Test User' })
          
          if (registerRes.status !== 201) return true
          
          // Reset password
          const resetRes = await request(app)
            .post('/api/auth/reset-password')
            .send({ 
              email: testEmail, 
              newPassword, 
              confirmPassword: newPassword 
            })
          
          expect(resetRes.status).toBe(200)
          
          // Check the stored hash directly in database
          const user = db.prepare('SELECT password_hash FROM users WHERE email = ?').get(testEmail)
          
          expect(user).toBeDefined()
          expect(user.password_hash).toBeDefined()
          
          // Verify it's a bcrypt hash (starts with $2a$ or $2b$)
          const isBcryptHash = user.password_hash.startsWith('$2a$') || 
                              user.password_hash.startsWith('$2b$')
          expect(isBcryptHash).toBe(true)
          
          // Verify hash is not the plaintext password
          expect(user.password_hash).not.toBe(newPassword)
          
          // Verify hash has expected bcrypt length (~60 chars)
          expect(user.password_hash.length).toBeGreaterThan(50)
          
          return true
        }
      ),
      { numRuns: 50 }
    )
  })
})
