/**
 * Property Tests for Dynamic Demo Data Seeding
 * Feature: dynamic-demo-seeding
 * Properties: 1-9 (Dynamic Seeding) + 17-18 (Original)
 */

import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { db, initDatabase } from '../../server/db.js'
import { SeedService } from '../../server/services/SeedService.js'
import { GeoService } from '../../server/services/GeoService.js'
import { MatchService } from '../../server/services/MatchService.js'
import { AuthService } from '../../server/services/AuthService.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load skills for testing
function loadSkills() {
  const skillsPath = join(__dirname, '../../server/data/skills.json')
  const data = JSON.parse(readFileSync(skillsPath, 'utf-8'))
  return data.skills || []
}

describe('Property Tests: Dynamic Demo Data Seeding', () => {
  const ALL_SKILLS = loadSkills()
  
  beforeAll(() => {
    initDatabase()
    process.env.DEMO_MODE = 'true'
  })

  beforeEach(() => {
    SeedService.resetDemoData()
  })

  afterAll(() => {
    SeedService.resetDemoData()
    delete process.env.DEMO_MODE
  })

  /**
   * Property 1: Complete Skill Coverage
   * 
   * *For any* seeding operation, every skill in skills.json SHALL be 
   * offered by at least one demo user, and each skill SHALL be offered 
   * by no more than 3 demo users.
   *
   * Validates: Requirements 1.1, 1.2
   */
  test('Property 1: Complete Skill Coverage', async () => {
    await SeedService.seedDemoUsers(40.7128, -74.0060)

    // Get all demo user skills
    const demoUsers = db.prepare('SELECT id FROM users WHERE is_demo_user = 1').all()
    const skillCoverage = new Map() // skill -> count of users offering it

    for (const user of demoUsers) {
      const offerSkills = db.prepare(
        "SELECT skill_name FROM user_skills WHERE user_id = ? AND type = 'offer'"
      ).all(user.id)

      for (const { skill_name } of offerSkills) {
        skillCoverage.set(skill_name, (skillCoverage.get(skill_name) || 0) + 1)
      }
    }

    // Every skill should be covered
    for (const skill of ALL_SKILLS) {
      const count = skillCoverage.get(skill) || 0
      expect(count, `Skill "${skill}" should be offered by at least 1 user`).toBeGreaterThanOrEqual(1)
      expect(count, `Skill "${skill}" should be offered by at most 3 users`).toBeLessThanOrEqual(3)
    }
  })

  /**
   * Property 2: Valid Skill Counts Per User
   * 
   * *For any* demo user created, they SHALL have between 1-2 skills 
   * they offer AND between 1-2 skills they need.
   *
   * Validates: Requirements 1.3
   */
  test('Property 2: Valid Skill Counts Per User', async () => {
    await SeedService.seedDemoUsers(40.7128, -74.0060)

    const demoUsers = db.prepare('SELECT id, name FROM users WHERE is_demo_user = 1').all()

    for (const user of demoUsers) {
      const offerSkills = db.prepare(
        "SELECT skill_name FROM user_skills WHERE user_id = ? AND type = 'offer'"
      ).all(user.id)
      const needSkills = db.prepare(
        "SELECT skill_name FROM user_skills WHERE user_id = ? AND type = 'need'"
      ).all(user.id)

      expect(offerSkills.length, `User ${user.name} should offer 1-2 skills`).toBeGreaterThanOrEqual(1)
      expect(offerSkills.length, `User ${user.name} should offer 1-2 skills`).toBeLessThanOrEqual(2)
      expect(needSkills.length, `User ${user.name} should need 1-2 skills`).toBeGreaterThanOrEqual(1)
      expect(needSkills.length, `User ${user.name} should need 1-2 skills`).toBeLessThanOrEqual(2)
    }
  })

  /**
   * Property 3: No Skill Overlap
   * 
   * *For any* demo user, the intersection of their offered skills and 
   * needed skills SHALL be empty.
   *
   * Validates: Requirements 2.2
   */
  test('Property 3: No Skill Overlap', async () => {
    await SeedService.seedDemoUsers(40.7128, -74.0060)

    const demoUsers = db.prepare('SELECT id, name FROM users WHERE is_demo_user = 1').all()

    for (const user of demoUsers) {
      const offerSkills = db.prepare(
        "SELECT skill_name FROM user_skills WHERE user_id = ? AND type = 'offer'"
      ).all(user.id).map(s => s.skill_name)
      const needSkills = db.prepare(
        "SELECT skill_name FROM user_skills WHERE user_id = ? AND type = 'need'"
      ).all(user.id).map(s => s.skill_name)

      const overlap = offerSkills.filter(s => needSkills.includes(s))
      expect(overlap, `User ${user.name} should not offer and need the same skill`).toHaveLength(0)
    }
  })

  /**
   * Property 4: Names From Pool
   * 
   * *For any* demo user created, their name SHALL be from the 
   * predefined DEMO_NAMES pool.
   *
   * Validates: Requirements 2.1
   */
  test('Property 4: Names From Pool', async () => {
    await SeedService.seedDemoUsers(40.7128, -74.0060)

    const namePool = SeedService.getNamePool()
    const demoUsers = db.prepare('SELECT name FROM users WHERE is_demo_user = 1').all()

    for (const user of demoUsers) {
      // Name should be from pool (possibly with numeric suffix)
      const baseName = user.name.split(' ')[0]
      expect(namePool, `Name "${user.name}" should be from pool`).toContain(baseName)
    }
  })

  /**
   * Property 5: Demo User Count Range
   * 
   * *For any* seeding operation, the total number of demo users 
   * created SHALL be between 15 and 25 inclusive.
   *
   * Validates: Requirements 2.3
   */
  test('Property 5: Demo User Count Range', async () => {
    await SeedService.seedDemoUsers(40.7128, -74.0060)

    const count = SeedService.getDemoUserCount()
    expect(count).toBeGreaterThanOrEqual(15)
    expect(count).toBeLessThanOrEqual(25)
  })

  /**
   * Property 6: Distance Range
   * 
   * *For any* demo user after seeding or relocation, their distance 
   * from the real user SHALL be between 0.3 and 1.8 miles.
   *
   * Validates: Requirements 3.1, 3.2
   */
  test('Property 6: Distance Range', async () => {
    const centerLat = 40.7128
    const centerLon = -74.0060

    await SeedService.seedDemoUsers(centerLat, centerLon)

    const demoUsers = db.prepare(
      'SELECT latitude, longitude FROM users WHERE is_demo_user = 1'
    ).all()

    for (const user of demoUsers) {
      const distance = GeoService.calculateDistance(
        centerLat, centerLon,
        user.latitude, user.longitude
      )

      expect(distance).toBeGreaterThanOrEqual(0.29) // Allow small tolerance
      expect(distance).toBeLessThanOrEqual(1.81)
    }
  })

  /**
   * Property 7: Distance Variance
   * 
   * *For any* set of demo users, the standard deviation of their 
   * distances from the real user SHALL be greater than 0.1 miles.
   *
   * Validates: Requirements 3.3
   */
  test('Property 7: Distance Variance', async () => {
    const centerLat = 40.7128
    const centerLon = -74.0060

    await SeedService.seedDemoUsers(centerLat, centerLon)

    const demoUsers = db.prepare(
      'SELECT latitude, longitude FROM users WHERE is_demo_user = 1'
    ).all()

    const distances = demoUsers.map(user => 
      GeoService.calculateDistance(centerLat, centerLon, user.latitude, user.longitude)
    )

    // Calculate standard deviation
    const mean = distances.reduce((a, b) => a + b, 0) / distances.length
    const squaredDiffs = distances.map(d => Math.pow(d - mean, 2))
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / distances.length
    const stdDev = Math.sqrt(variance)

    expect(stdDev).toBeGreaterThan(0.1)
  })

  /**
   * Property 8: Seeding Idempotence
   * 
   * *For any* seeding operation run twice in succession, the count 
   * of demo users SHALL remain the same.
   *
   * Validates: Requirements 5.1
   */
  test('Property 8: Seeding Idempotence', async () => {
    await SeedService.seedDemoUsers(40.7128, -74.0060)
    const countAfterFirst = SeedService.getDemoUserCount()

    // Reset the seeded flag to allow re-seeding
    db.prepare("DELETE FROM app_meta WHERE key = 'demo_seeded'").run()

    await SeedService.seedDemoUsers(40.7128, -74.0060)
    const countAfterSecond = SeedService.getDemoUserCount()

    expect(countAfterSecond).toBe(countAfterFirst)
  })

  /**
   * Property 9: Data Preservation
   * 
   * *For any* seeding operation when demo users already exist, 
   * existing match interests and meetings SHALL be preserved.
   *
   * Validates: Requirements 5.2
   */
  test('Property 9: Data Preservation', async () => {
    // First seeding
    await SeedService.seedDemoUsers(40.7128, -74.0060)

    // Create a real user with unique email
    const uniqueEmail = `test-preserve-${Date.now()}@example.com`
    const passwordHash = await AuthService.hashPassword('testpass123')
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, name, latitude, longitude, is_demo_user)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(uniqueEmail, passwordHash, 'Test User', 40.7128, -74.0060)
    const realUserId = result.lastInsertRowid

    // Get a demo user
    const demoUser = db.prepare('SELECT id FROM users WHERE is_demo_user = 1').get()

    // Create interest between real user and demo user
    db.prepare(
      'INSERT INTO match_interests (from_user_id, to_user_id) VALUES (?, ?)'
    ).run(realUserId, demoUser.id)

    const interestBefore = db.prepare(
      'SELECT COUNT(*) as count FROM match_interests WHERE from_user_id = ? AND to_user_id = ?'
    ).get(realUserId, demoUser.id)

    // Re-seed (reset flag first)
    db.prepare("DELETE FROM app_meta WHERE key = 'demo_seeded'").run()
    await SeedService.seedDemoUsers(40.7128, -74.0060)

    // Interest should still exist
    const interestAfter = db.prepare(
      'SELECT COUNT(*) as count FROM match_interests WHERE from_user_id = ? AND to_user_id = ?'
    ).get(realUserId, demoUser.id)

    expect(interestAfter.count).toBe(interestBefore.count)

    // Clean up
    db.prepare('DELETE FROM match_interests WHERE from_user_id = ?').run(realUserId)
    db.prepare('DELETE FROM users WHERE id = ?').run(realUserId)
  })

  /**
   * Property 17: Demo Seeding Distance Range (Original)
   * Kept for backward compatibility
   */
  test('Property 17: Demo Seeding Distance Range', async () => {
    const centerLat = 40.7128
    const centerLon = -74.0060

    await SeedService.seedDemoUsers(centerLat, centerLon)

    const demoUsers = db.prepare(
      'SELECT latitude, longitude FROM users WHERE is_demo_user = 1'
    ).all()

    expect(demoUsers.length).toBeGreaterThan(0)

    for (const user of demoUsers) {
      const distance = GeoService.calculateDistance(
        centerLat, centerLon,
        user.latitude, user.longitude
      )

      expect(distance).toBeGreaterThanOrEqual(0.29)
      expect(distance).toBeLessThanOrEqual(1.81)
    }
  })

  /**
   * Property 18: Demo Users Create Valid Matches
   * 
   * *For any* real user with skills, at least one seeded demo user
   * SHALL have complementary skills that create a valid match.
   */
  test('Property 18: Demo Users Create Valid Matches', async () => {
    const centerLat = 40.7128
    const centerLon = -74.0060

    // Seed demo users FIRST
    await SeedService.seedDemoUsers(centerLat, centerLon)

    // Get a demo user's skills to create complementary match
    const demoUser = db.prepare(`
      SELECT u.id, u.name 
      FROM users u 
      WHERE u.is_demo_user = 1 
      LIMIT 1
    `).get()

    const demoOffers = db.prepare(
      "SELECT skill_name FROM user_skills WHERE user_id = ? AND type = 'offer'"
    ).all(demoUser.id).map(s => s.skill_name)
    
    const demoNeeds = db.prepare(
      "SELECT skill_name FROM user_skills WHERE user_id = ? AND type = 'need'"
    ).all(demoUser.id).map(s => s.skill_name)

    // Create a real user with complementary skills
    const uniqueEmail = `test-match-${Date.now()}@example.com`
    const passwordHash = await AuthService.hashPassword('testpass123')
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, name, latitude, longitude, is_demo_user)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(uniqueEmail, passwordHash, 'Real User', centerLat, centerLon)

    const realUserId = result.lastInsertRowid

    // Real user offers what demo needs, needs what demo offers
    if (demoNeeds.length > 0) {
      db.prepare('INSERT INTO user_skills (user_id, skill_name, type) VALUES (?, ?, ?)').run(realUserId, demoNeeds[0], 'offer')
    }
    if (demoOffers.length > 0) {
      db.prepare('INSERT INTO user_skills (user_id, skill_name, type) VALUES (?, ?, ?)').run(realUserId, demoOffers[0], 'need')
    }

    // Find matches for real user
    const matches = MatchService.findMatches(realUserId)

    // Should have at least one match (the demo user we designed for)
    expect(matches.length).toBeGreaterThan(0)

    // Clean up
    db.prepare('DELETE FROM user_skills WHERE user_id = ?').run(realUserId)
    db.prepare('DELETE FROM users WHERE id = ?').run(realUserId)
  })

  /**
   * Additional test: Seeding respects DEMO_MODE
   */
  test('Seeding respects DEMO_MODE environment variable', async () => {
    const originalDemoMode = process.env.DEMO_MODE
    process.env.DEMO_MODE = 'false'

    db.prepare("DELETE FROM app_meta WHERE key = 'demo_seeded'").run()

    await SeedService.seedDemoUsers(40.7128, -74.0060)

    const count = SeedService.getDemoUserCount()
    expect(count).toBe(0)

    process.env.DEMO_MODE = originalDemoMode
  })

  /**
   * Additional test: Relocation preserves skills
   */
  test('Relocation preserves skills', async () => {
    await SeedService.seedDemoUsers(40.7128, -74.0060)

    // Get skills before relocation
    const demoUsers = db.prepare('SELECT id FROM users WHERE is_demo_user = 1').all()
    const skillsBefore = new Map()
    for (const user of demoUsers) {
      const skills = db.prepare('SELECT skill_name, type FROM user_skills WHERE user_id = ?').all(user.id)
      skillsBefore.set(user.id, skills)
    }

    // Relocate to new location
    SeedService.relocateDemoUsers(51.5074, -0.1278) // London

    // Get skills after relocation
    for (const user of demoUsers) {
      const skillsAfter = db.prepare('SELECT skill_name, type FROM user_skills WHERE user_id = ?').all(user.id)
      expect(skillsAfter).toEqual(skillsBefore.get(user.id))
    }
  })
})
