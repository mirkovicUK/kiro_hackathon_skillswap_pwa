# SkillSwap — Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React PWA)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ ┌──────┐│
│  │  Auth   │ │ Profile │ │Discover │ │ Matches │ │Meeting │ │ Chat ││
│  │  Pages  │ │  Page   │ │  Page   │ │  Page   │ │  Page  │ │ Page ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └───┬────┘ └──┬───┘│
│       └───────────┴───────────┼───────────┴──────────┴─────────┘    │
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
│  │  /api/auth    /api/users    /api/matches   /api/meetings  /api/chat│
│  └────────────────────────────┬────────────────────────┘   │
│                               │                             │
│  ┌────────────────────────────┴────────────────────────┐   │
│  │                  Service Layer                       │   │
│  │  AuthService  MatchService  MeetingService  ChatService  │   │
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
├── pages/              # Route-level components
│   ├── FrontPage.jsx       # Public landing page
│   ├── Privacy.jsx         # Privacy Policy
│   ├── Terms.jsx           # Terms of Service
│   ├── Cookies.jsx         # Cookie Policy
│   ├── Contact.jsx         # Contact form
│   ├── Login.jsx           # Authentication
│   ├── Register.jsx
│   ├── ForgotPassword.jsx
│   ├── ResetPassword.jsx
│   ├── Profile.jsx         # User profile
│   ├── Discover.jsx        # Find matches
│   ├── Matches.jsx         # Mutual matches
│   └── Meeting.jsx         # Coffee scheduling
├── components/         # Reusable UI
│   ├── PublicHeader.jsx    # Header for public pages
│   ├── PublicLayout.jsx    # Layout wrapper (header + footer + cookie)
│   ├── Footer.jsx          # Site-wide footer
│   ├── CookieConsent.jsx   # GDPR cookie banner
│   ├── Layout.jsx          # Authenticated layout
│   ├── MatchCard.jsx
│   ├── SkillSelector.jsx
│   └── InstallPrompt.jsx   # PWA install prompt
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
- **45 correctness properties** across 5 specs (35 implemented, 10 pending)
- **59+ total tests** (properties + additional)
- Property tests validate requirements traceability

### Test Files
```
tests/properties/
├── auth.property.js        # Properties 1-3
├── skills.property.js      # Properties 4-5
├── geo.property.js         # Property 8
├── matching.property.js    # Properties 6, 7, 9, 10
├── interest.property.js    # Properties 11-12
├── meeting.property.js     # Properties 13-16
├── seeding.property.js     # Properties 17-18
├── password-reset.property.js  # Properties 19-23
├── front-page.property.js  # Properties 24-26
└── chat.property.js        # Properties 27-36 (pending)
```

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
