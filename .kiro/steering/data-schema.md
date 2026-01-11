# Database Schema - SkillSwap PWA

This document defines the SQLite database schema for SkillSwap.

---

## Overview

SkillSwap uses SQLite for zero-configuration deployment. The database file (`database.sqlite`) is auto-created on first run.

**Key Design Decisions:**
- Per-user demo seeding via `owner_user_id` column
- Soft foreign keys with ON DELETE CASCADE
- Indexes on frequently queried columns
- Consistent user ID ordering in meetings (user1_id < user2_id)

---

## Tables

### users

Stores all user accounts (real users and demo users).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user ID |
| `email` | TEXT | UNIQUE NOT NULL | User email (login identifier) |
| `password_hash` | TEXT | NOT NULL | bcrypt hashed password |
| `name` | TEXT | NOT NULL | Display name |
| `latitude` | REAL | NULL | User's latitude (-90 to 90) |
| `longitude` | REAL | NULL | User's longitude (-180 to 180) |
| `is_demo_user` | INTEGER | DEFAULT 0 | 1 = demo user, 0 = real user |
| `owner_user_id` | INTEGER | NULL | For demo users: ID of the real user who owns them |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |

**Indexes:**
- `idx_users_location` on `(latitude, longitude)` - Geo queries
- `idx_users_owner` on `(owner_user_id)` - Per-user demo filtering

**Notes:**
- `owner_user_id` enables per-user demo seeding (each real user gets their own demo users)
- Real users have `owner_user_id = NULL`
- Demo users have `owner_user_id = <real_user_id>` of their owner

---

### user_skills

Stores skills that users offer or need.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique skill record ID |
| `user_id` | INTEGER | NOT NULL, FK → users(id) | User who has this skill |
| `skill_name` | TEXT | NOT NULL | Skill name (from skills.json) |
| `type` | TEXT | NOT NULL, CHECK('offer','need') | 'offer' = user has skill, 'need' = user wants skill |

**Constraints:**
- `UNIQUE(user_id, skill_name, type)` - Prevent duplicate skill entries
- `FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE`

**Indexes:**
- `idx_user_skills_user` on `(user_id)` - User skill lookups
- `idx_user_skills_type` on `(type)` - Filter by offer/need

**Valid Skills** (from `server/data/skills.json`):
```
Plumbing, Electrical Work, Carpentry, Painting, Lawn Care,
Web Design, Graphic Design, Photography, Video Editing,
Spanish Lessons, French Lessons, Music Lessons, Cooking Classes,
Fitness Training, Yoga Instruction, Tax Preparation, Resume Writing,
Pet Sitting, House Cleaning, Car Maintenance
```

---

### match_interests

Records when a user expresses interest in another user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique interest record ID |
| `from_user_id` | INTEGER | NOT NULL, FK → users(id) | User expressing interest |
| `to_user_id` | INTEGER | NOT NULL, FK → users(id) | User being interested in |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | When interest was expressed |

**Constraints:**
- `UNIQUE(from_user_id, to_user_id)` - One interest record per direction
- `FOREIGN KEY(from_user_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY(to_user_id) REFERENCES users(id) ON DELETE CASCADE`

**Indexes:**
- `idx_match_interests_users` on `(from_user_id, to_user_id)` - Interest lookups

**Mutual Interest Detection:**
```sql
-- Check if mutual interest exists between user A and B
SELECT COUNT(*) = 2 FROM match_interests 
WHERE (from_user_id = A AND to_user_id = B)
   OR (from_user_id = B AND to_user_id = A)
```

---

### meetings

Stores coffee meeting proposals and confirmations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique meeting ID |
| `user1_id` | INTEGER | NOT NULL, FK → users(id) | First user (lower ID) |
| `user2_id` | INTEGER | NOT NULL, FK → users(id) | Second user (higher ID) |
| `location` | TEXT | NULL | Meeting location (e.g., "Blue Bottle Coffee") |
| `proposed_date` | TEXT | NULL | Proposed date (YYYY-MM-DD) |
| `proposed_time` | TEXT | NULL | Proposed time (HH:MM) |
| `proposed_by` | INTEGER | NOT NULL, FK → users(id) | User who proposed the meeting |
| `status` | TEXT | DEFAULT 'proposed', CHECK | 'proposed', 'scheduled', 'completed' |
| `user1_confirmed` | INTEGER | DEFAULT 0 | 1 = user1 confirmed meeting happened |
| `user2_confirmed` | INTEGER | DEFAULT 0 | 1 = user2 confirmed meeting happened |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | When meeting was proposed |

**Status Values:**
- `proposed` - Meeting proposed, waiting for acceptance
- `scheduled` - Both users agreed on time/place
- `completed` - Both users confirmed meeting happened (skill swap unlocked)

**User ID Ordering:**
- `user1_id` is always the lower ID
- `user2_id` is always the higher ID
- This ensures consistent meeting lookup regardless of who proposes

**Skill Swap Unlock Logic:**
```sql
-- Skill swap is unlocked when both confirm
SELECT * FROM meetings 
WHERE status = 'completed' 
  AND user1_confirmed = 1 
  AND user2_confirmed = 1
```

---

### app_meta

Key-value store for application metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | TEXT | PRIMARY KEY | Metadata key |
| `value` | TEXT | NULL | Metadata value |

**Current Keys:**
| Key | Value | Description |
|-----|-------|-------------|
| `demo_seeded` | `"true"` | Global demo seeding completed (legacy) |
| `demo_seeded_for_{userId}` | `"true"` | Per-user demo seeding completed |

---

### messages

Stores chat messages between matched users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique message ID |
| `match_id` | TEXT | NOT NULL | Match identifier (format: `{lowerId}-{higherId}`) |
| `from_user_id` | INTEGER | NOT NULL, FK → users(id) | User who sent the message |
| `to_user_id` | INTEGER | NOT NULL, FK → users(id) | User who receives the message |
| `content` | TEXT | NOT NULL | Message content (max 500 chars) |
| `is_read` | INTEGER | DEFAULT 0 | 1 = message has been read |
| `is_from_demo` | INTEGER | DEFAULT 0 | 1 = message from demo user |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | When message was sent |

**Constraints:**
- `FOREIGN KEY(from_user_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY(to_user_id) REFERENCES users(id) ON DELETE CASCADE`

**Indexes:**
- `idx_messages_match` on `(match_id, created_at)` - Message history queries
- `idx_messages_unread` on `(to_user_id, is_read)` - Unread count queries

**Notes:**
- Chat is only enabled after mutual interest is confirmed
- Messages persist through the entire meeting flow
- Demo users auto-respond with staged conversation patterns

---

### chat_sessions

Tracks chat session state and unread counts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `match_id` | TEXT | PRIMARY KEY | Match identifier (format: `{lowerId}-{higherId}`) |
| `user1_id` | INTEGER | NOT NULL, FK → users(id) | First user (lower ID) |
| `user2_id` | INTEGER | NOT NULL, FK → users(id) | Second user (higher ID) |
| `last_message_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp of last message |
| `user1_unread_count` | INTEGER | DEFAULT 0 | Unread messages for user1 |
| `user2_unread_count` | INTEGER | DEFAULT 0 | Unread messages for user2 |
| `conversation_stage` | TEXT | DEFAULT 'greeting' | Demo conversation stage |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | When session was created |

**Constraints:**
- `FOREIGN KEY(user1_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY(user2_id) REFERENCES users(id) ON DELETE CASCADE`

**Conversation Stages** (for demo user responses):
- `greeting` - Initial messages (0-2 messages)
- `skill_discussion` - Discussing skills (3-6 messages)
- `meeting_coordination` - Planning meeting (7-10 messages)
- `busy_response` - Winding down (11+ messages)

---

### push_subscriptions

Stores push notification subscriptions for PWA.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique subscription ID |
| `user_id` | INTEGER | NOT NULL, FK → users(id) | User who subscribed |
| `endpoint` | TEXT | NOT NULL | Push service endpoint URL |
| `p256dh_key` | TEXT | NOT NULL | Public key for encryption |
| `auth_key` | TEXT | NOT NULL | Auth secret for encryption |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | When subscription was created |

**Constraints:**
- `UNIQUE(user_id, endpoint)` - One subscription per endpoint per user
- `FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE`

**Indexes:**
- `idx_push_subscriptions_user` on `(user_id)` - User subscription lookups

---

## Relationships

```
users (1) ──────< user_skills (N)
  │                    
  │ owner_user_id      
  ├──────────────< users (demo users)
  │
  │ from_user_id / to_user_id
  ├──────────────< match_interests (N)
  │
  │ user1_id / user2_id / proposed_by
  ├──────────────< meetings (N)
  │
  │ from_user_id / to_user_id
  ├──────────────< messages (N)
  │
  │ user1_id / user2_id
  ├──────────────< chat_sessions (N)
  │
  │ user_id
  └──────────────< push_subscriptions (N)
```

```
users (1) ──────< user_skills (N)
  │                    
  │ owner_user_id      
  ├──────────────< users (demo users)
  │
  │ from_user_id / to_user_id
  ├──────────────< match_interests (N)
  │
  │ user1_id / user2_id / proposed_by
  └──────────────< meetings (N)
```

---

## Per-User Demo Seeding

**Problem Solved:**
When multiple real users exist, each needs their own demo users. If User 1 changes location, only their demo users should relocate—not User 2's.

**Implementation:**
1. Real users have `owner_user_id = NULL`
2. Demo users have `owner_user_id = <real_user_id>`
3. `MatchService.findMatches()` filters by owner:
   ```sql
   WHERE (is_demo_user = 0 OR owner_user_id = ?)
   ```
4. `SeedService.relocateDemoUsersForUser()` only moves demos for specific owner

**Example:**
```
User 1 (London) → owns Demo Users 1-25 (around London)
User 2 (NYC)    → owns Demo Users 26-50 (around NYC)

User 1 moves to Paris:
- Demo Users 1-25 relocate to Paris
- Demo Users 26-50 stay in NYC
```

---

## Migrations

The database auto-migrates on startup via `server/db.js`:

1. **Initial Schema**: Creates all tables if not exist
2. **owner_user_id Migration**: Adds column if missing (for existing databases)

```javascript
// Migration check in db.js
const columns = db.prepare("PRAGMA table_info(users)").all()
const hasOwnerColumn = columns.some(col => col.name === 'owner_user_id')
if (!hasOwnerColumn) {
  db.exec(`ALTER TABLE users ADD COLUMN owner_user_id INTEGER`)
}
```

---

## Common Queries

### Find Complementary Matches
```sql
SELECT u.*, 
       GROUP_CONCAT(CASE WHEN us.type = 'offer' THEN us.skill_name END) as offers,
       GROUP_CONCAT(CASE WHEN us.type = 'need' THEN us.skill_name END) as needs
FROM users u
JOIN user_skills us ON u.id = us.user_id
WHERE u.id != ? 
  AND u.latitude IS NOT NULL
  AND (u.is_demo_user = 0 OR u.owner_user_id = ?)
GROUP BY u.id
HAVING 
  -- They offer what I need
  EXISTS (SELECT 1 FROM user_skills WHERE user_id = u.id AND type = 'offer' 
          AND skill_name IN (SELECT skill_name FROM user_skills WHERE user_id = ? AND type = 'need'))
  AND
  -- They need what I offer
  EXISTS (SELECT 1 FROM user_skills WHERE user_id = u.id AND type = 'need'
          AND skill_name IN (SELECT skill_name FROM user_skills WHERE user_id = ? AND type = 'offer'))
```

### Check Mutual Interest
```sql
SELECT COUNT(*) = 2 as is_mutual
FROM match_interests
WHERE (from_user_id = ? AND to_user_id = ?)
   OR (from_user_id = ? AND to_user_id = ?)
```

### Get Meeting for Match
```sql
SELECT * FROM meetings
WHERE (user1_id = ? AND user2_id = ?)
   OR (user1_id = ? AND user2_id = ?)
ORDER BY created_at DESC
LIMIT 1
```

### Get Chat Messages for Match
```sql
SELECT * FROM messages
WHERE match_id = ?
ORDER BY created_at ASC
LIMIT ? OFFSET ?
```

### Get Unread Count for User
```sql
SELECT COUNT(*) as unread_count
FROM messages
WHERE to_user_id = ? AND is_read = 0
```

### Mark Messages as Read
```sql
UPDATE messages
SET is_read = 1
WHERE match_id = ? AND to_user_id = ? AND is_read = 0
```

---

## Test Database

Tests use a separate database file: `test-database.sqlite`

Configured in `vitest.config.js` via environment variable or test setup.
