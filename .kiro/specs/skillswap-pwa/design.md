# Design Document: SkillSwap PWA

## Overview

SkillSwap is a Progressive Web App that facilitates skill exchanges between neighbors by requiring an in-person coffee meeting before any transaction. The app uses a React frontend with Vite, Express.js backend, and SQLite database—all runnable with a single command and zero external dependencies.

The architecture prioritizes:
- **Zero-friction setup** for hackathon judges
- **Mutual consent** at every step of the matching flow
- **Location-based discovery** without external APIs
- **PWA capabilities** for mobile-first experience

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (React PWA)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │  Auth   │ │ Profile │ │Discover │ │ Matches │ │Meeting ││
│  │  Pages  │ │  Page   │ │  Page   │ │  Page   │ │  Page  ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └───┬────┘│
│       └───────────┴───────────┴───────────┴──────────┘     │
│                           │                                 │
│                    Fetch API Calls                          │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP/JSON
┌───────────────────────────┼─────────────────────────────────┐
│                      Server (Express.js)                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │  User   │ │  Match  │ │ Meeting │           │
│  │ Routes  │ │ Routes  │ │ Routes  │ │ Routes  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       └───────────┴───────────┴───────────┘                 │
│                           │                                 │
│                    Service Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ AuthService │ │MatchService │ │ GeoService  │           │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘           │
│         └───────────────┴───────────────┘                   │
│                           │                                 │
│                    Database Layer                           │
│                    ┌─────────────┐                          │
│                    │   SQLite    │                          │
│                    │ (db.sqlite) │                          │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### Pages

**AuthPages (Login.jsx, Register.jsx)**
- Handle user authentication forms
- Capture geolocation on registration
- Redirect to profile setup after registration

**ProfilePage (Profile.jsx)**
- Display/edit user profile
- Skill selection interface (offer/need)
- Uses predefined skills list from server

**DiscoverPage (Discover.jsx)**
- Display nearby matches
- Show match cards with skill overlap
- "I'm Interested" confirmation button

**MatchesPage (Matches.jsx)**
- List of confirmed mutual matches
- Status indicators (waiting, confirmed, meeting scheduled)
- Navigation to meeting scheduling

**MeetingPage (Meeting.jsx)**
- Meeting proposal form (location, date, time)
- Accept/modify meeting details
- Post-meeting confirmation buttons

#### Shared Components

```jsx
// SkillSelector - Multi-select for skills
interface SkillSelectorProps {
  skills: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  type: 'offer' | 'need';
}

// MatchCard - Display a potential match
interface MatchCardProps {
  match: {
    userId: number;
    name: string;
    distance: number;
    theyOffer: string[];
    theyNeed: string[];
  };
  onInterested: () => void;
  status: 'new' | 'pending' | 'mutual';
}

// MeetingProposal - Schedule meeting form
interface MeetingProposalProps {
  matchId: number;
  onPropose: (location: string, date: string, time: string) => void;
}
```

### Backend API Endpoints

#### Authentication Routes (`/api/auth`)

```
POST /api/auth/register
  Body: { email, password, name }
  Response: { userId, token }
  
POST /api/auth/login
  Body: { email, password }
  Response: { userId, token }

POST /api/auth/logout
  Response: { success: true }
```

#### User Routes (`/api/users`)

```
GET /api/users/me
  Response: { id, email, name, latitude, longitude, skills }

PUT /api/users/me
  Body: { name?, latitude?, longitude? }
  Response: { updated user }

PUT /api/users/me/location
  Body: { latitude, longitude }
  Response: { success: true }
  Side effect: Triggers demo seeding if first user in demo mode

GET /api/users/me/skills
  Response: { offer: string[], need: string[] }

PUT /api/users/me/skills
  Body: { offer: string[], need: string[] }
  Response: { success: true }

GET /api/skills
  Response: { skills: string[] }  // Predefined list
```

#### Match Routes (`/api/matches`)

```
GET /api/matches/discover
  Response: { matches: MatchCard[] }
  // Returns users with complementary skills within 2 miles

POST /api/matches/:userId/interest
  Response: { matchId, status: 'pending' | 'mutual' }
  // Records interest, checks if mutual

GET /api/matches
  Response: { matches: Match[] }
  // All matches where user has expressed interest

DELETE /api/matches/:matchId
  Response: { success: true }
  // Decline/remove match
```

#### Meeting Routes (`/api/meetings`)

```
POST /api/meetings
  Body: { matchId, location, proposedDate, proposedTime }
  Response: { meetingId, status: 'proposed' }

GET /api/meetings/:matchId
  Response: { meeting details or null }

PUT /api/meetings/:meetingId/accept
  Response: { status: 'scheduled' }

PUT /api/meetings/:meetingId/confirm
  Response: { status, bothConfirmed: boolean }
  // Mark that this user confirms meeting happened
```

### Service Layer

#### AuthService

```javascript
class AuthService {
  async register(email, password, name): Promise<{ userId, token }>
  async login(email, password): Promise<{ userId, token }>
  async validateToken(token): Promise<{ userId } | null>
  hashPassword(password): string
  verifyPassword(password, hash): boolean
}
```

#### MatchService

```javascript
class MatchService {
  async findMatches(userId): Promise<Match[]>
  // 1. Get user's skills and location
  // 2. Find users where: theyOffer ∩ iNeed ≠ ∅ AND theyNeed ∩ iOffer ≠ ∅
  // 3. Filter by distance <= 2 miles
  // 4. Sort by distance ascending
  
  async expressInterest(userId, targetId): Promise<MatchStatus>
  // 1. Create/update match record
  // 2. Check if target has also expressed interest
  // 3. Return 'mutual' if both interested, 'pending' otherwise
  
  async getMutualMatches(userId): Promise<Match[]>
  // Return matches where both parties confirmed interest
}
```

#### GeoService

```javascript
class GeoService {
  calculateDistance(lat1, lon1, lat2, lon2): number
  // Haversine formula, returns miles
  
  isWithinRadius(lat1, lon1, lat2, lon2, radiusMiles): boolean
  
  generateNearbyPoint(centerLat, centerLon, minMiles, maxMiles): {lat, lon}
  // For demo data seeding
}
```

#### SeedService

```javascript
class SeedService {
  async seedDemoUsers(aroundLat, aroundLon): Promise<void>
  // Create 5-8 fake users with:
  // - Random positions 0.5-1.5 miles from center
  // - Complementary skills ensuring matches exist
  
  shouldSeed(): boolean
  // Check DEMO_MODE env and if seeding already done
}
```

## Data Models

### Database Schema (SQLite)

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  is_demo_user BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User skills (offer or need)
CREATE TABLE user_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  skill_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('offer', 'need')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, skill_name, type)
);

-- Match interest records
CREATE TABLE match_interests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(from_user_id, to_user_id)
);

-- Coffee meetings
CREATE TABLE meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user1_id INTEGER NOT NULL,
  user2_id INTEGER NOT NULL,
  location TEXT,
  proposed_date DATE,
  proposed_time TEXT,
  proposed_by INTEGER NOT NULL,
  status TEXT DEFAULT 'proposed' CHECK(status IN ('proposed', 'scheduled', 'completed')),
  user1_confirmed BOOLEAN DEFAULT 0,
  user2_confirmed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user1_id) REFERENCES users(id),
  FOREIGN KEY(user2_id) REFERENCES users(id),
  FOREIGN KEY(proposed_by) REFERENCES users(id)
);

-- App metadata (for tracking seeding, etc.)
CREATE TABLE app_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Indexes for performance
CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_type ON user_skills(type);
CREATE INDEX idx_match_interests_users ON match_interests(from_user_id, to_user_id);
CREATE INDEX idx_users_location ON users(latitude, longitude);
```

### TypeScript Interfaces

```typescript
interface User {
  id: number;
  email: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  isDemoUser: boolean;
  createdAt: Date;
}

interface UserSkill {
  id: number;
  userId: number;
  skillName: string;
  type: 'offer' | 'need';
}

interface MatchInterest {
  id: number;
  fromUserId: number;
  toUserId: number;
  createdAt: Date;
}

interface Meeting {
  id: number;
  user1Id: number;
  user2Id: number;
  location: string | null;
  proposedDate: string | null;
  proposedTime: string | null;
  proposedBy: number;
  status: 'proposed' | 'scheduled' | 'completed';
  user1Confirmed: boolean;
  user2Confirmed: boolean;
  createdAt: Date;
}

// Computed types for API responses
interface DiscoverMatch {
  userId: number;
  name: string;
  distance: number;
  theyOffer: string[];  // Skills they offer that I need
  theyNeed: string[];   // Skills they need that I offer
  myInterest: boolean;  // Have I expressed interest?
  theirInterest: boolean; // Have they expressed interest?
}

interface MutualMatch {
  matchId: number;
  otherUser: {
    id: number;
    name: string;
    distance: number;
  };
  skillsExchange: {
    iGive: string[];
    iGet: string[];
  };
  meetingStatus: 'none' | 'proposed' | 'scheduled' | 'completed';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication Round-Trip

*For any* valid email and password combination, registering a user and then logging in with the same credentials SHALL successfully authenticate and return a valid session token.

**Validates: Requirements 1.1, 1.3**

### Property 2: Duplicate Email Rejection

*For any* registered email address, attempting to register a new account with the same email SHALL be rejected with an appropriate error.

**Validates: Requirements 1.2**

### Property 3: Invalid Credentials Rejection

*For any* email/password combination where either the email doesn't exist or the password doesn't match, login attempts SHALL be rejected.

**Validates: Requirements 1.4**

### Property 4: Skills Storage Round-Trip

*For any* user and any set of skills (both offer and need types), storing the skills and then retrieving them SHALL return the exact same skills with correct types.

**Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7**

### Property 5: Location Precision Preservation

*For any* latitude and longitude coordinates with 6+ decimal places, storing and retrieving the location SHALL preserve precision to at least 6 decimal places.

**Validates: Requirements 3.2, 3.5**

### Property 6: Complementary Skills Matching

*For any* two users where User A offers at least one skill that User B needs AND User B offers at least one skill that User A needs, the matching algorithm SHALL identify them as a match (assuming they are within distance).

**Validates: Requirements 4.1**

### Property 7: Distance Filtering

*For any* two users, if their calculated distance exceeds 2 miles, they SHALL NOT appear in each other's match results, regardless of skill compatibility.

**Validates: Requirements 4.2**

### Property 8: Haversine Distance Accuracy

*For any* two coordinate pairs with known distances, the Haversine calculation SHALL return a distance accurate to within 1% of the actual great-circle distance.

**Validates: Requirements 4.3**

### Property 9: Match Sorting by Distance

*For any* user with multiple matches, the matches SHALL be returned sorted by distance in ascending order (nearest first).

**Validates: Requirements 4.4**

### Property 10: Match Response Completeness

*For any* match returned by the discovery endpoint, the response SHALL include: user name, distance, skills they offer that the requester needs, and skills they need that the requester offers.

**Validates: Requirements 4.5**

### Property 11: Single Interest Returns Pending

*For any* match where only one user has expressed interest, the match status SHALL be "pending" and meeting scheduling SHALL be disabled.

**Validates: Requirements 5.3, 5.6**

### Property 12: Mutual Interest Unlocks Meeting

*For any* match where both users have expressed interest, the match status SHALL be "mutual" and meeting scheduling SHALL be enabled.

**Validates: Requirements 5.4, 6.1**

### Property 13: Meeting Proposal Round-Trip

*For any* meeting proposal with location, date, and time, storing the proposal and retrieving it SHALL return all fields accurately.

**Validates: Requirements 6.2, 6.3**

### Property 14: Meeting Acceptance Flow

*For any* proposed meeting, when the other user accepts, the meeting status SHALL change to "scheduled" and both users SHALL be able to view the meeting details.

**Validates: Requirements 6.4, 6.5, 6.6**

### Property 15: Meeting Confirmation Requires Both

*For any* scheduled meeting, the status SHALL only change to "completed" when BOTH users have independently confirmed the meeting happened.

**Validates: Requirements 7.2, 7.3, 7.5**

### Property 16: Verification Unlocks Skill Swap

*For any* meeting marked as "completed" (both users confirmed), the match SHALL be marked as verified and skill swap functionality SHALL be unlocked.

**Validates: Requirements 7.4**

### Property 17: Demo Seeding Distance Range

*For any* demo user seeded around a real user's location, the demo user's coordinates SHALL place them within 0.5 to 1.5 miles of the real user.

**Validates: Requirements 8.2**

### Property 18: Demo Users Create Valid Matches

*For any* real user in demo mode, at least one seeded demo user SHALL have complementary skills that create a valid match.

**Validates: Requirements 8.3, 8.5**



## Error Handling

### Client-Side Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| Network failure | Display "Connection lost" toast, retry with exponential backoff |
| Geolocation denied | Show modal explaining location is required, offer retry |
| Geolocation unavailable | Display error, suggest manual location entry (future feature) |
| Session expired | Redirect to login with "Session expired" message |
| Validation errors | Display inline field errors with specific messages |

### Server-Side Errors

| Error Type | HTTP Status | Response Format |
|------------|-------------|-----------------|
| Validation error | 400 | `{ error: "validation_error", message: "...", fields: {...} }` |
| Authentication failed | 401 | `{ error: "unauthorized", message: "Invalid credentials" }` |
| Resource not found | 404 | `{ error: "not_found", message: "..." }` |
| Duplicate resource | 409 | `{ error: "conflict", message: "Email already registered" }` |
| Server error | 500 | `{ error: "server_error", message: "Something went wrong" }` |

### Database Errors

- **Connection failure**: Log error, return 500 to client
- **Constraint violation**: Map to appropriate 4xx error
- **Query timeout**: Retry once, then return 500

### Graceful Degradation

- If demo seeding fails, continue without demo users (log warning)
- If distance calculation fails for a user, exclude from matches (don't crash)
- If meeting notification fails, meeting is still created (notification is best-effort)

## Testing Strategy

### Dual Testing Approach

This project uses both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across randomly generated inputs

### Testing Framework

- **Test Runner**: Vitest (fast, Vite-native)
- **Property Testing**: fast-check (JavaScript property-based testing library)
- **API Testing**: Supertest for HTTP endpoint testing

### Property-Based Test Configuration

```javascript
// Each property test runs minimum 100 iterations
fc.assert(
  fc.property(
    fc.emailAddress(),
    fc.string({ minLength: 8 }),
    (email, password) => {
      // Property assertion
    }
  ),
  { numRuns: 100 }
);
```

### Test Organization

```
tests/
├── unit/
│   ├── auth.test.js        # Auth service unit tests
│   ├── geo.test.js         # Haversine calculation tests
│   ├── matching.test.js    # Match algorithm unit tests
│   └── meeting.test.js     # Meeting flow unit tests
├── properties/
│   ├── auth.property.js    # Properties 1-3
│   ├── skills.property.js  # Property 4
│   ├── geo.property.js     # Properties 5, 8
│   ├── matching.property.js # Properties 6, 7, 9, 10
│   ├── interest.property.js # Properties 11, 12
│   ├── meeting.property.js  # Properties 13-16
│   └── seeding.property.js  # Properties 17, 18
└── integration/
    └── flow.test.js        # Full user flow integration tests
```

### Test Tagging Convention

Each property test must be tagged with its design document reference:

```javascript
// Feature: skillswap-pwa, Property 6: Complementary Skills Matching
// Validates: Requirements 4.1
test.prop('complementary skills create match', [...generators], (inputs) => {
  // test implementation
});
```

### Coverage Goals

- **Unit tests**: Cover all service methods and edge cases
- **Property tests**: Cover all 18 correctness properties
- **Integration tests**: Cover complete user flows (register → match → meet → swap)

### Running Tests

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:props    # Property tests only
npm run test:coverage # With coverage report
```
