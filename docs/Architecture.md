# SkillSwap — Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React PWA)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │  Auth   │ │ Profile │ │Discover │ │ Matches │ │Meeting ││
│  │  Pages  │ │  Page   │ │  Page   │ │  Page   │ │  Page  ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └───┬────┘│
│       └───────────┴───────────┼───────────┴──────────┘     │
│                               │                             │
│                    React Context (Auth State)               │
│                               │                             │
│                    Fetch API + 2s Polling                   │
└───────────────────────────────┼─────────────────────────────┘
                                │ HTTP/JSON
┌───────────────────────────────┼─────────────────────────────┐
│                    Server (Express.js)                       │
│                               │                             │
│  ┌────────────────────────────┴────────────────────────┐   │
│  │                    API Routes                        │   │
│  │  /api/auth    /api/users    /api/matches   /api/meetings│
│  └────────────────────────────┬────────────────────────┘   │
│                               │                             │
│  ┌────────────────────────────┴────────────────────────┐   │
│  │                  Service Layer                       │   │
│  │  AuthService  MatchService  MeetingService          │   │
│  │  GeoService   SeedService                           │   │
│  └────────────────────────────┬────────────────────────┘   │
│                               │                             │
│                    ┌──────────┴──────────┐                  │
│                    │   SQLite Database   │                  │
│                    │  (database.sqlite)  │                  │
│                    └─────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React 18 + Vite | Fast HMR, modern tooling |
| Styling | Tailwind CSS | Utility-first, rapid development |
| Backend | Express.js | Simple, flexible, well-documented |
| Database | SQLite | Zero-config, single file, portable |
| Auth | JWT + bcrypt | Stateless sessions, secure passwords |
| Testing | Vitest + fast-check | Property-based testing |

## Frontend Architecture

### Component Structure
```
client/src/
├── pages/           # Route-level components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Profile.jsx
│   ├── Discover.jsx
│   ├── Matches.jsx
│   └── Meeting.jsx
├── components/      # Reusable UI
│   ├── Layout.jsx
│   ├── MatchCard.jsx
│   └── SkillSelector.jsx
└── context/
    └── AuthContext.jsx
```

### State Management
- **AuthContext**: Global auth state (user, token)
- **Local State**: Page-specific data via useState
- **Polling**: 2-second intervals for real-time updates

### Real-Time Updates
Instead of WebSockets (complexity), we use polling:
```javascript
useEffect(() => {
  const interval = setInterval(() => fetchData(), 2000)
  return () => clearInterval(interval)
}, [])
```

## Backend Architecture

### Service Layer Pattern
Routes handle HTTP, services handle business logic:

```
Route → Service → Database
  ↓        ↓         ↓
HTTP    Logic     SQL
```

### Key Services

| Service | Responsibility |
|---------|---------------|
| `AuthService` | Registration, login, JWT, password reset |
| `MatchService` | Complementary matching, interest tracking |
| `MeetingService` | Proposals, acceptance, confirmation |
| `GeoService` | Haversine distance, coordinate validation |
| `SeedService` | Demo user generation, per-user seeding |

### Matching Algorithm
```
1. Find users within 2-mile radius (Haversine formula)
2. Filter for complementary skills:
   - They OFFER what I NEED
   - They NEED what I OFFER
3. Sort by distance (nearest first)
4. Track interest status (pending/mutual)
```

## Database Schema

### Core Tables
- `users` — Accounts (real + demo)
- `user_skills` — Offer/need skills per user
- `match_interests` — Interest records (directional)
- `meetings` — Coffee meeting proposals/confirmations
- `app_meta` — Key-value metadata

### Per-User Demo Seeding
Each real user gets their own demo users via `owner_user_id`:
```sql
-- User 1's demo users
SELECT * FROM users WHERE owner_user_id = 1

-- User 2's demo users stay separate
SELECT * FROM users WHERE owner_user_id = 2
```

## Authentication Flow

```
Register → Hash password (bcrypt) → Store user → Generate JWT
Login → Verify password → Generate JWT → Return token
Request → Verify JWT → Extract userId → Process request
```

JWT payload: `{ userId, iat, exp }` (24h expiry)

## Testing Strategy

### Property-Based Testing
Using fast-check to verify correctness properties:

```javascript
fc.assert(
  fc.property(fc.emailAddress(), fc.string(), (email, password) => {
    // Property: register then login should succeed
    const user = register(email, password)
    const result = login(email, password)
    return result.userId === user.userId
  }),
  { numRuns: 100 }
)
```

### Test Coverage
- **23 correctness properties** across 3 specs
- **54 total tests** (properties + additional)
- Property tests validate requirements traceability

## Security Measures

| Concern | Solution |
|---------|----------|
| Password Storage | bcrypt (10 rounds) |
| Session Management | JWT (24h expiry) |
| SQL Injection | Parameterized queries |
| XSS | React's default escaping |
| CORS | Vite proxy in development |

## Performance Considerations

- **Polling**: 2-second intervals (acceptable for MVP)
- **Database**: SQLite handles <100 users easily
- **Indexes**: On location, skills, interests
- **No Caching**: Not needed for hackathon scale

## Deployment

### Development
```bash
npm install
npm run dev  # Starts client (5173) + server (3001)
```

### Environment
```
DEMO_MODE=true      # Enable demo seeding
JWT_SECRET=xxx      # Token signing key
PORT=3001           # Server port
```

### Database
- Auto-created on first run
- Auto-migrates schema changes
- Delete `database.sqlite` for fresh start
