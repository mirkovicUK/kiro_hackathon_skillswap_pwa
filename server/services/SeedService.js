/**
 * SeedService - Seeds demo users around a real user's location
 * Each real user gets their OWN set of demo users (Option B)
 * Demo users are linked via owner_user_id column
 */

import { db } from '../db.js'
import { GeoService } from './GeoService.js'
import { AuthService } from './AuthService.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// First names pool (gender-neutral and common names)
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey',
  'Riley', 'Quinn', 'Avery', 'Parker', 'Sage',
  'Sam', 'Jamie', 'Drew', 'Cameron', 'Logan',
  'Emma', 'Liam', 'Olivia', 'Noah', 'Sophia',
  'James', 'Mia', 'Lucas', 'Ava', 'Ethan',
  'Isabella', 'Mason', 'Charlotte', 'Oliver', 'Amelia'
]

// Surnames pool
const SURNAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
  'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson',
  'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Clark', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Green'
]

/**
 * Generate a random full name from first + last name pools
 * @returns {string}
 */
function generateRandomName() {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)]
  return `${firstName} ${surname}`
}

export class SeedService {
  /**
   * Load skills from skills.json
   * @returns {string[]} Array of skill names
   */
  static loadSkills() {
    try {
      const skillsPath = join(__dirname, '../data/skills.json')
      const data = JSON.parse(readFileSync(skillsPath, 'utf-8'))
      return data.skills || []
    } catch (err) {
      console.error('Failed to load skills.json:', err.message)
      return []
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {any[]} array 
   * @returns {any[]}
   */
  static shuffle(array) {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  /**
   * Generate skill assignments ensuring COMPLETE coverage
   * Every skill must be offered by at least 1 user and at most 3 users
   * @param {string[]} skills - All available skills
   * @returns {{ userSkills: Map<number, { offer: Set<string>, need: Set<string> }>, userCount: number }}
   */
  static generateSkillAssignments(skills) {
    const userSkills = new Map()
    let currentUserId = 0
    
    // Track which skills have been assigned as offers
    const skillOfferCount = new Map()
    skills.forEach(s => skillOfferCount.set(s, 0))
    
    const shuffledSkills = this.shuffle([...skills])
    
    // Phase 1: Ensure every skill is offered at least once
    // Create users that each offer 2 skills and need 2 different skills
    for (let i = 0; i < shuffledSkills.length; i += 2) {
      const skillA = shuffledSkills[i]
      const skillB = shuffledSkills[i + 1] || shuffledSkills[0] // Wrap around for odd count
      
      // Find 2 skills to need (different from what we offer)
      const availableNeeds = shuffledSkills.filter(s => s !== skillA && s !== skillB)
      const needA = availableNeeds[Math.floor(Math.random() * availableNeeds.length)]
      const remainingNeeds = availableNeeds.filter(s => s !== needA)
      const needB = remainingNeeds[Math.floor(Math.random() * remainingNeeds.length)] || needA
      
      userSkills.set(currentUserId++, { 
        offer: new Set([skillA, skillB]), 
        need: new Set([needA, needB]) 
      })
      
      skillOfferCount.set(skillA, skillOfferCount.get(skillA) + 1)
      skillOfferCount.set(skillB, skillOfferCount.get(skillB) + 1)
    }
    
    // Phase 2: Verify all skills are covered, add more users if needed
    const uncoveredSkills = skills.filter(s => skillOfferCount.get(s) === 0)
    for (const skill of uncoveredSkills) {
      // Find a skill to need that's different
      const needSkill = skills.find(s => s !== skill) || skills[0]
      userSkills.set(currentUserId++, {
        offer: new Set([skill]),
        need: new Set([needSkill])
      })
      skillOfferCount.set(skill, 1)
    }
    
    // Ensure we have at least 15 users
    while (userSkills.size < 15) {
      const randomOffer = shuffledSkills[Math.floor(Math.random() * shuffledSkills.length)]
      const availableNeeds = shuffledSkills.filter(s => s !== randomOffer)
      const randomNeed = availableNeeds[Math.floor(Math.random() * availableNeeds.length)]
      
      // Only add if skill isn't already offered 3 times
      if (skillOfferCount.get(randomOffer) < 3) {
        userSkills.set(currentUserId++, {
          offer: new Set([randomOffer]),
          need: new Set([randomNeed])
        })
        skillOfferCount.set(randomOffer, skillOfferCount.get(randomOffer) + 1)
      }
    }
    
    // Trim to max 25 users while preserving skill coverage
    if (userSkills.size > 25) {
      // Sort entries by how many times their skills are covered (remove duplicates first)
      const entries = [...userSkills.entries()].sort((a, b) => {
        const aMinCoverage = Math.min(...[...a[1].offer].map(s => skillOfferCount.get(s)))
        const bMinCoverage = Math.min(...[...b[1].offer].map(s => skillOfferCount.get(s)))
        return bMinCoverage - aMinCoverage // Remove users with most-covered skills first
      })
      
      userSkills.clear()
      skillOfferCount.forEach((_, key) => skillOfferCount.set(key, 0))
      
      for (let i = 0; i < Math.min(25, entries.length); i++) {
        userSkills.set(i, entries[i][1])
        for (const skill of entries[i][1].offer) {
          skillOfferCount.set(skill, skillOfferCount.get(skill) + 1)
        }
      }
    }
    
    return { userSkills, userCount: userSkills.size }
  }

  /**
   * Check if a specific user needs demo seeding
   * @param {number} ownerUserId - The real user's ID
   * @returns {boolean}
   */
  static shouldSeedForUser(ownerUserId) {
    if (process.env.DEMO_MODE !== 'true') {
      return false
    }

    // Check if this user already has demo users
    const demoCount = db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE is_demo_user = 1 AND owner_user_id = ?'
    ).get(ownerUserId)

    return demoCount.count === 0
  }

  /**
   * Seed demo users for a specific real user
   * Each real user gets their own set of demo users
   * @param {number} ownerUserId - The real user's ID
   * @param {number} latitude - Real user's latitude
   * @param {number} longitude - Real user's longitude
   */
  static async seedDemoUsersForUser(ownerUserId, latitude, longitude) {
    if (!this.shouldSeedForUser(ownerUserId)) {
      console.log(`Demo seeding skipped for user ${ownerUserId} (already seeded or DEMO_MODE not enabled)`)
      return
    }

    console.log(`🌱 Seeding demo users for user ${ownerUserId} around (${latitude}, ${longitude})...`)

    const skills = this.loadSkills()
    if (skills.length === 0) {
      console.error('No skills found, cannot seed demo users')
      return
    }

    const { userSkills, userCount } = this.generateSkillAssignments(skills)
    console.log(`  📊 Generated ${userCount} demo users covering ${skills.length} skills`)

    for (const [userId, skillSet] of userSkills) {
      // Generate a random full name for each demo user
      const name = generateRandomName()

      const location = GeoService.generateNearbyPoint(latitude, longitude, 0.3, 1.8)
      const email = `demo-${ownerUserId}-${userId + 1}@skillswap.local`
      const password = 'demopass123'

      try {
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
        
        if (existing) {
          db.prepare(
            'UPDATE users SET latitude = ?, longitude = ? WHERE id = ?'
          ).run(location.latitude, location.longitude, existing.id)
          continue
        }

        const passwordHash = await AuthService.hashPassword(password)
        
        const result = db.prepare(`
          INSERT INTO users (email, password_hash, name, latitude, longitude, is_demo_user, owner_user_id)
          VALUES (?, ?, ?, ?, ?, 1, ?)
        `).run(email, passwordHash, name, location.latitude, location.longitude, ownerUserId)

        const newUserId = result.lastInsertRowid

        const insertSkill = db.prepare(
          'INSERT INTO user_skills (user_id, skill_name, type) VALUES (?, ?, ?)'
        )

        for (const skill of skillSet.offer) {
          insertSkill.run(newUserId, skill, 'offer')
        }

        for (const skill of skillSet.need) {
          insertSkill.run(newUserId, skill, 'need')
        }

        console.log(`  ✓ Created ${name} (offers: ${[...skillSet.offer].join(', ')})`)
      } catch (err) {
        console.error(`  ✗ Failed to create demo user:`, err.message)
      }
    }

    console.log(`🌱 Demo seeding complete for user ${ownerUserId}!`)
  }

  /**
   * Legacy method - seeds demo users (for backward compatibility)
   * Now delegates to seedDemoUsersForUser with owner_user_id = NULL (shared)
   */
  static async seedDemoUsers(latitude, longitude) {
    // For backward compatibility, seed shared demo users
    // This is called when no specific owner is known
    if (process.env.DEMO_MODE !== 'true') {
      return
    }
    
    // Check if any shared demo users exist
    const sharedDemoCount = db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE is_demo_user = 1 AND owner_user_id IS NULL'
    ).get()
    
    if (sharedDemoCount.count > 0) {
      console.log('Shared demo users already exist, skipping')
      return
    }
    
    console.log('Creating shared demo users (legacy mode)...')
    // Create with NULL owner for backward compatibility
    await this.seedDemoUsersForUser(null, latitude, longitude)
  }

  /**
   * Reset demo data for a specific user
   * @param {number} ownerUserId - The real user's ID (or null for all)
   */
  static resetDemoDataForUser(ownerUserId) {
    let demoUsers
    if (ownerUserId === null) {
      demoUsers = db.prepare('SELECT id FROM users WHERE is_demo_user = 1').all()
    } else {
      demoUsers = db.prepare('SELECT id FROM users WHERE is_demo_user = 1 AND owner_user_id = ?').all(ownerUserId)
    }
    
    for (const user of demoUsers) {
      db.prepare('DELETE FROM meetings WHERE user1_id = ? OR user2_id = ?').run(user.id, user.id)
      db.prepare('DELETE FROM match_interests WHERE from_user_id = ? OR to_user_id = ?').run(user.id, user.id)
      db.prepare('DELETE FROM user_skills WHERE user_id = ?').run(user.id)
    }
    
    if (ownerUserId === null) {
      db.prepare('DELETE FROM users WHERE is_demo_user = 1').run()
    } else {
      db.prepare('DELETE FROM users WHERE is_demo_user = 1 AND owner_user_id = ?').run(ownerUserId)
    }
    
    console.log(`Demo data reset for user ${ownerUserId || 'ALL'}`)
  }

  /**
   * Legacy reset method
   */
  static resetDemoData() {
    this.resetDemoDataForUser(null)
    db.prepare("DELETE FROM app_meta WHERE key = 'demo_seeded'").run()
  }

  /**
   * Get demo user count for a specific owner
   * @param {number} ownerUserId - The real user's ID (or null for all)
   * @returns {number}
   */
  static getDemoUserCount(ownerUserId = null) {
    if (ownerUserId === null) {
      const result = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_demo_user = 1').get()
      return result.count
    }
    const result = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_demo_user = 1 AND owner_user_id = ?').get(ownerUserId)
    return result.count
  }

  /**
   * Relocate demo users for a specific owner around a new location
   * @param {number} ownerUserId - The real user's ID
   * @param {number} latitude - New center latitude
   * @param {number} longitude - New center longitude
   */
  static relocateDemoUsersForUser(ownerUserId, latitude, longitude) {
    if (process.env.DEMO_MODE !== 'true') {
      return
    }

    const demoUsers = db.prepare(
      'SELECT id, name FROM users WHERE is_demo_user = 1 AND owner_user_id = ?'
    ).all(ownerUserId)
    
    if (demoUsers.length === 0) {
      return
    }

    console.log(`📍 Relocating ${demoUsers.length} demo users for user ${ownerUserId}...`)

    for (const user of demoUsers) {
      const location = GeoService.generateNearbyPoint(latitude, longitude, 0.3, 1.8)
      db.prepare(
        'UPDATE users SET latitude = ?, longitude = ? WHERE id = ?'
      ).run(location.latitude, location.longitude, user.id)
    }

    console.log('📍 Demo users relocated!')
  }

  /**
   * Legacy relocate method (relocates ALL demo users - not recommended)
   */
  static relocateDemoUsers(latitude, longitude) {
    console.log('⚠️ Legacy relocateDemoUsers called - consider using relocateDemoUsersForUser')
    if (process.env.DEMO_MODE !== 'true') {
      return
    }

    const demoUsers = db.prepare('SELECT id, name FROM users WHERE is_demo_user = 1').all()
    
    if (demoUsers.length === 0) {
      return
    }

    for (const user of demoUsers) {
      const location = GeoService.generateNearbyPoint(latitude, longitude, 0.3, 1.8)
      db.prepare(
        'UPDATE users SET latitude = ?, longitude = ? WHERE id = ?'
      ).run(location.latitude, location.longitude, user.id)
    }
  }

  /**
   * Get the name pool (for testing)
   * Returns array of first names for backward compatibility with tests
   * @returns {string[]}
   */
  static getNamePool() {
    return [...FIRST_NAMES]
  }

  /**
   * Get both name pools (first names and surnames)
   * @returns {{ firstNames: string[], surnames: string[] }}
   */
  static getNamePools() {
    return { firstNames: [...FIRST_NAMES], surnames: [...SURNAMES] }
  }

  /**
   * Ensure complementary demo users exist for a real user's skills
   * Creates demo users who offer what the real user needs AND need what the real user offers
   * @param {number} userId - Real user's ID
   * @param {string[]} userOffers - Skills the real user offers
   * @param {string[]} userNeeds - Skills the real user needs
   * @param {number} latitude - Real user's latitude
   * @param {number} longitude - Real user's longitude
   */
  static async ensureComplementaryMatches(userId, userOffers, userNeeds, latitude, longitude) {
    if (process.env.DEMO_MODE !== 'true') {
      return
    }

    if (userOffers.length === 0 || userNeeds.length === 0) {
      return
    }

    console.log(`🔗 Ensuring complementary matches for user ${userId}`)
    console.log(`   User offers: ${userOffers.join(', ')}`)
    console.log(`   User needs: ${userNeeds.join(', ')}`)

    // For each skill the user needs, check if there's a demo user who:
    // 1. Offers that skill
    // 2. Needs at least one skill the user offers
    // 3. Belongs to this user (owner_user_id = userId)
    for (const neededSkill of userNeeds) {
      // Find demo users (owned by this user) who offer this skill
      const demoOfferers = db.prepare(`
        SELECT DISTINCT u.id, u.name 
        FROM users u
        JOIN user_skills us ON u.id = us.user_id
        WHERE u.is_demo_user = 1 
        AND u.owner_user_id = ?
        AND us.skill_name = ? 
        AND us.type = 'offer'
      `).all(userId, neededSkill)

      // Check if any of them need what the user offers
      let hasComplementaryMatch = false
      for (const demo of demoOfferers) {
        const demoNeeds = db.prepare(`
          SELECT skill_name FROM user_skills 
          WHERE user_id = ? AND type = 'need'
        `).all(demo.id).map(s => s.skill_name)

        if (userOffers.some(offer => demoNeeds.includes(offer))) {
          hasComplementaryMatch = true
          console.log(`   ✅ Found match: ${demo.name} offers ${neededSkill}, needs ${demoNeeds.filter(n => userOffers.includes(n)).join(', ')}`)
          break
        }
      }

      if (!hasComplementaryMatch) {
        console.log(`   ⚠️ No complementary match for ${neededSkill}, creating one...`)
        const neededFromUser = userOffers[Math.floor(Math.random() * userOffers.length)]
        await this.createComplementaryDemoUser(userId, neededSkill, neededFromUser, latitude, longitude)
      }
    }
  }

  /**
   * Create a single demo user with specific offer/need skills for a specific owner
   * @param {number} ownerUserId - The real user who owns this demo user
   * @param {string} offerSkill - Skill this demo user offers
   * @param {string} needSkill - Skill this demo user needs
   * @param {number} latitude - Center latitude
   * @param {number} longitude - Center longitude
   */
  static async createComplementaryDemoUser(ownerUserId, offerSkill, needSkill, latitude, longitude) {
    // Find next available demo email for this owner
    let demoNum = 1
    while (db.prepare('SELECT id FROM users WHERE email = ?').get(`demo-${ownerUserId}-comp-${demoNum}@skillswap.local`)) {
      demoNum++
    }

    const email = `demo-${ownerUserId}-comp-${demoNum}@skillswap.local`
    const name = generateRandomName()
    const location = GeoService.generateNearbyPoint(latitude, longitude, 0.3, 1.5)
    const passwordHash = await AuthService.hashPassword('demopass123')

    const result = db.prepare(`
      INSERT INTO users (email, password_hash, name, latitude, longitude, is_demo_user, owner_user_id)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(email, passwordHash, name, location.latitude, location.longitude, ownerUserId)

    const newUserId = result.lastInsertRowid

    db.prepare('INSERT INTO user_skills (user_id, skill_name, type) VALUES (?, ?, ?)').run(newUserId, offerSkill, 'offer')
    db.prepare('INSERT INTO user_skills (user_id, skill_name, type) VALUES (?, ?, ?)').run(newUserId, needSkill, 'need')

    console.log(`   ✓ Created ${name} (offers: ${offerSkill}, needs: ${needSkill}) for user ${ownerUserId}`)
  }
}
