import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod'
const SALT_ROUNDS = 10

export class AuthService {
  /**
   * Register a new user
   * @param {string} email 
   * @param {string} password 
   * @param {string} name 
   * @returns {{ userId: number, token: string, user: object }}
   */
  static async register(email, password, name) {
    // Validate inputs
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required')
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      const error = new Error('Email already registered')
      error.code = 'EMAIL_EXISTS'
      throw error
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    // Insert user
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
    ).run(email, passwordHash, name)

    const userId = result.lastInsertRowid

    // Generate token
    const token = this.generateToken(userId)

    // Get user data (without password)
    const user = this.getUserById(userId)

    return { userId, token, user }
  }

  /**
   * Login user with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {{ userId: number, token: string, user: object }}
   */
  static async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // Find user
    const user = db.prepare(
      'SELECT id, email, password_hash, name, latitude, longitude FROM users WHERE email = ?'
    ).get(email)

    if (!user) {
      const error = new Error('Invalid email or password')
      error.code = 'INVALID_CREDENTIALS'
      throw error
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      const error = new Error('Invalid email or password')
      error.code = 'INVALID_CREDENTIALS'
      throw error
    }

    // Generate token
    const token = this.generateToken(user.id)

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user

    return { 
      userId: user.id, 
      token, 
      user: userWithoutPassword 
    }
  }

  /**
   * Generate JWT token
   * @param {number} userId 
   * @returns {string}
   */
  static generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' })
  }

  /**
   * Verify JWT token
   * @param {string} token 
   * @returns {{ userId: number } | null}
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return null
    }
  }

  /**
   * Get user by ID (without password)
   * @param {number} userId 
   * @returns {object | null}
   */
  static getUserById(userId) {
    const user = db.prepare(
      'SELECT id, email, name, latitude, longitude, is_demo_user, created_at FROM users WHERE id = ?'
    ).get(userId)
    return user || null
  }

  /**
   * Hash a password
   * @param {string} password 
   * @returns {Promise<string>}
   */
  static async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  /**
   * Verify a password against a hash
   * @param {string} password 
   * @param {string} hash 
   * @returns {Promise<boolean>}
   */
  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash)
  }

  /**
   * Verify if an email exists in the database
   * @param {string} email 
   * @returns {{ exists: boolean, userId: number | null }}
   */
  static verifyEmail(email) {
    if (!email) {
      return { exists: false, userId: null }
    }

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    
    if (user) {
      return { exists: true, userId: user.id }
    }
    
    return { exists: false, userId: null }
  }

  /**
   * Reset password for a user
   * @param {string} email 
   * @param {string} newPassword 
   * @param {string} confirmPassword 
   * @returns {{ success: boolean, message: string }}
   */
  static async resetPassword(email, newPassword, confirmPassword) {
    // Validate email exists
    const { exists, userId } = this.verifyEmail(email)
    if (!exists) {
      const error = new Error('Email not found')
      error.code = 'NOT_FOUND'
      throw error
    }

    // Validate password length
    if (!newPassword || newPassword.length < 8) {
      const error = new Error('Password must be at least 8 characters')
      error.code = 'VALIDATION_ERROR'
      throw error
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      const error = new Error('Passwords do not match')
      error.code = 'VALIDATION_ERROR'
      throw error
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // Update password in database
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId)

    return { success: true, message: 'Password reset successfully' }
  }
}
