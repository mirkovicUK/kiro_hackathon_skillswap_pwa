import { Router } from 'express'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { authMiddleware } from '../middleware/auth.js'
import { AuthService } from '../services/AuthService.js'
import { SeedService } from '../services/SeedService.js'
import { db } from '../db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const router = Router()

// Get skills list (public)
router.get('/skills', (req, res) => {
  try {
    const skillsPath = join(__dirname, '..', 'data', 'skills.json')
    const skills = JSON.parse(readFileSync(skillsPath, 'utf-8'))
    res.json(skills)
  } catch (err) {
    res.status(500).json({ error: 'server_error', message: 'Failed to load skills' })
  }
})

// Get current user (protected)
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = AuthService.getUserById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: 'User not found' })
    }

    // Get user skills
    const skills = db.prepare(
      'SELECT skill_name, type FROM user_skills WHERE user_id = ?'
    ).all(req.userId)

    const offer = skills.filter(s => s.type === 'offer').map(s => s.skill_name)
    const need = skills.filter(s => s.type === 'need').map(s => s.skill_name)

    res.json({
      ...user,
      skills: { offer, need }
    })
  } catch (err) {
    console.error('Get user error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to get user' })
  }
})

// Update current user profile
router.put('/me', authMiddleware, (req, res) => {
  try {
    const { name, latitude, longitude } = req.body
    const updates = []
    const params = []

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'validation_error', message: 'Name cannot be empty' })
      }
      updates.push('name = ?')
      params.push(name.trim())
    }

    if (latitude !== undefined && longitude !== undefined) {
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'validation_error', message: 'Latitude and longitude must be numbers' })
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: 'validation_error', message: 'Invalid coordinates' })
      }
      updates.push('latitude = ?', 'longitude = ?')
      params.push(latitude, longitude)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'validation_error', message: 'No valid fields to update' })
    }

    params.push(req.userId)
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params)

    const user = AuthService.getUserById(req.userId)
    const skills = db.prepare('SELECT skill_name, type FROM user_skills WHERE user_id = ?').all(req.userId)
    const offer = skills.filter(s => s.type === 'offer').map(s => s.skill_name)
    const need = skills.filter(s => s.type === 'need').map(s => s.skill_name)

    res.json({ ...user, skills: { offer, need } })
  } catch (err) {
    console.error('Update user error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to update user' })
  }
})

// Update user location
router.put('/me/location', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude } = req.body

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'validation_error', message: 'Latitude and longitude are required and must be numbers' })
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'validation_error', message: 'Invalid coordinates' })
    }

    // Get current user info
    const user = db.prepare('SELECT latitude, longitude, is_demo_user FROM users WHERE id = ?').get(req.userId)
    const isFirstLocation = user && user.latitude === null && !user.is_demo_user

    // Update location
    db.prepare('UPDATE users SET latitude = ?, longitude = ? WHERE id = ?').run(latitude, longitude, req.userId)

    // DEMO MODE: Per-user demo seeding
    if (process.env.DEMO_MODE === 'true' && !user.is_demo_user) {
      // Check if this user has their own demo users
      const userDemoCount = SeedService.getDemoUserCount(req.userId)
      
      if (userDemoCount === 0) {
        // First time - seed demo users for THIS user
        console.log(`🌱 Seeding demo users for user ${req.userId} (first location or no demos)`)
        try {
          await SeedService.seedDemoUsersForUser(req.userId, latitude, longitude)
        } catch (seedErr) {
          console.error('Demo seeding error (non-fatal):', seedErr)
        }
      } else {
        // User already has demo users - relocate ONLY their demo users
        console.log(`📍 Relocating demo users for user ${req.userId}`)
        try {
          SeedService.relocateDemoUsersForUser(req.userId, latitude, longitude)
        } catch (relocateErr) {
          console.error('Demo relocation error (non-fatal):', relocateErr)
        }
      }
    }

    res.json({ success: true, latitude, longitude })
  } catch (err) {
    console.error('Update location error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to update location' })
  }
})

// Get user skills
router.get('/me/skills', authMiddleware, (req, res) => {
  try {
    const skills = db.prepare('SELECT skill_name, type FROM user_skills WHERE user_id = ?').all(req.userId)
    const offer = skills.filter(s => s.type === 'offer').map(s => s.skill_name)
    const need = skills.filter(s => s.type === 'need').map(s => s.skill_name)

    res.json({ offer, need })
  } catch (err) {
    console.error('Get skills error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to get skills' })
  }
})

// Update user skills
router.put('/me/skills', authMiddleware, async (req, res) => {
  try {
    const { offer, need } = req.body

    if (!Array.isArray(offer) || !Array.isArray(need)) {
      return res.status(400).json({ error: 'validation_error', message: 'Offer and need must be arrays' })
    }

    // Load valid skills
    const skillsPath = join(__dirname, '..', 'data', 'skills.json')
    const validSkills = JSON.parse(readFileSync(skillsPath, 'utf-8')).skills

    // Validate all skills
    const allSkills = [...offer, ...need]
    const invalidSkills = allSkills.filter(s => !validSkills.includes(s))
    if (invalidSkills.length > 0) {
      return res.status(400).json({ 
        error: 'validation_error', 
        message: `Invalid skills: ${invalidSkills.join(', ')}` 
      })
    }

    // Clear existing skills and insert new ones
    db.prepare('DELETE FROM user_skills WHERE user_id = ?').run(req.userId)

    const insertStmt = db.prepare('INSERT INTO user_skills (user_id, skill_name, type) VALUES (?, ?, ?)')
    
    for (const skill of offer) {
      insertStmt.run(req.userId, skill, 'offer')
    }
    for (const skill of need) {
      insertStmt.run(req.userId, skill, 'need')
    }

    // DEMO MODE: Ensure complementary demo users exist for this user's skills
    const user = db.prepare('SELECT latitude, longitude, is_demo_user FROM users WHERE id = ?').get(req.userId)
    if (process.env.DEMO_MODE === 'true' && !user.is_demo_user && user.latitude && user.longitude) {
      try {
        // Ensure demo users exist that can match with this user
        await SeedService.ensureComplementaryMatches(req.userId, offer, need, user.latitude, user.longitude)
      } catch (seedErr) {
        console.error('Complementary seeding error (non-fatal):', seedErr)
      }
    }

    res.json({ success: true, offer, need })
  } catch (err) {
    console.error('Update skills error:', err)
    res.status(500).json({ error: 'server_error', message: 'Failed to update skills' })
  }
})

export default router
