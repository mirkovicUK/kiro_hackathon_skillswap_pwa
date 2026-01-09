import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, '..', 'database.sqlite')

export const db = new Database(dbPath)

export function initDatabase() {
  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Create tables (without owner_user_id for initial creation)
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      is_demo_user INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- User skills (offer or need)
    CREATE TABLE IF NOT EXISTS user_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      skill_name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('offer', 'need')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, skill_name, type)
    );

    -- Match interest records
    CREATE TABLE IF NOT EXISTS match_interests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(to_user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(from_user_id, to_user_id)
    );

    -- Coffee meetings
    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      location TEXT,
      proposed_date TEXT,
      proposed_time TEXT,
      proposed_by INTEGER NOT NULL,
      status TEXT DEFAULT 'proposed' CHECK(status IN ('proposed', 'scheduled', 'completed')),
      user1_confirmed INTEGER DEFAULT 0,
      user2_confirmed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user1_id) REFERENCES users(id),
      FOREIGN KEY(user2_id) REFERENCES users(id),
      FOREIGN KEY(proposed_by) REFERENCES users(id)
    );

    -- App metadata (for tracking seeding, etc.)
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_skills_type ON user_skills(type);
    CREATE INDEX IF NOT EXISTS idx_match_interests_users ON match_interests(from_user_id, to_user_id);
    CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);
  `)

  // Migration: Add owner_user_id column if it doesn't exist
  const columns = db.prepare("PRAGMA table_info(users)").all()
  const hasOwnerColumn = columns.some(col => col.name === 'owner_user_id')
  
  if (!hasOwnerColumn) {
    db.exec(`ALTER TABLE users ADD COLUMN owner_user_id INTEGER`)
    console.log('✅ Added owner_user_id column to users table')
  }

  // Create index for owner_user_id if it doesn't exist
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_owner ON users(owner_user_id)`)
  } catch (err) {
    // Index might already exist
  }

  console.log('✅ Database initialized')
}
