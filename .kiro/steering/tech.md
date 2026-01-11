# Technical Architecture

## Technology Stack

**Frontend:**
- React 18 with Vite (fast builds, HMR)
- Tailwind CSS (utility-first styling)
- PWA manifest + Service Worker

**Backend:**
- Node.js with Express.js
- SQLite (zero-config database, single file)
- JWT for session tokens
- bcrypt for password hashing

**Testing:**
- Vitest (test runner, Vite-native)
- fast-check (property-based testing)
- Supertest (API endpoint testing)

**Development:**
- Single package.json monorepo
- Concurrently for running client + server
- ESLint + Prettier for code quality

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (React PWA)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │  Auth   │ │ Profile │ │Discover │ │ Matches │ │Meeting ││
│  │  Pages  │ │  Page   │ │  Page   │ │  Page   │ │  Page  ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘│
│                           │                                 │
│                    Fetch API (JSON)                         │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                      Server (Express.js)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    API Routes                         │  │
│  │  /api/auth  /api/users  /api/matches  /api/meetings  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Service Layer                        │  │
│  │  AuthService  MatchService  MeetingService           │  │
│  │  GeoService   SeedService                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                    ┌─────────────┐                          │
│                    │   SQLite    │                          │
│                    │(database.sqlite)│                      │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Development Environment

**Prerequisites:**
- Node.js 18+ 
- npm 9+

**Setup:**
```bash
git clone <repo>
cd skillswap
npm install
npm run dev
```

**Environment Variables:**
```
DEMO_MODE=true          # Enable demo data seeding
JWT_SECRET=dev-secret   # Token signing (auto-generated in dev)
PORT=3001               # Server port (default: 3001)
```

**Available Scripts:**
```bash
npm run dev       # Start client + server concurrently
npm run server    # Server only
npm run client    # Client only
npm test          # Run all tests
npm run test:props # Property tests only
```

## Code Standards

**JavaScript/React:**
- ES6+ syntax, async/await for promises
- Functional components with hooks
- Named exports preferred over default exports
- Destructuring for props and state

**Naming Conventions:**
- Files: `camelCase.js` for utilities, `PascalCase.jsx` for components
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- CSS classes: Tailwind utilities (no custom CSS unless necessary)

**API Design:**
- RESTful endpoints
- JSON request/response bodies
- Consistent error format: `{ error: "code", message: "description" }`
- HTTP status codes: 200 (success), 400 (validation), 401 (auth), 404 (not found), 500 (server)

## Testing Strategy

**Dual Approach:**
- **Unit tests**: Specific examples, edge cases, error conditions
- **Property tests**: Universal properties across random inputs (50-100 iterations)

**Property-Based Testing:**
- Library: fast-check
- 45 correctness properties defined across 5 specs:
  - Core MVP: 18 properties (implemented)
  - Dynamic Demo Seeding: 9 properties (implemented)
  - Password Reset: 5 properties (implemented)
  - Front Page & Site-Wide: 3 properties (implemented)
  - Chat Messaging: 10 properties (spec complete)
- Each property tagged with requirement reference
- Minimum 50-100 iterations per property

**Test Organization:**
```
tests/
└── properties/             # Property-based tests
    ├── auth.property.js        # Properties 1-3
    ├── skills.property.js      # Properties 4-5
    ├── geo.property.js         # Property 8
    ├── matching.property.js    # Properties 6, 7, 9, 10
    ├── interest.property.js    # Properties 11-12
    ├── meeting.property.js     # Properties 13-16
    ├── seeding.property.js     # Properties 17-18
    ├── password-reset.property.js  # Properties 19-23
    └── front-page.property.js  # Properties 24-26
```

**Coverage Goals:**
- All 45 correctness properties implemented and passing (35 done, 10 pending)
- Complete user flow tested via property tests
- Demo mode enables single-user testing (auto-confirm features)

## Deployment Process

**For Hackathon (Local Only):**
- No deployment required
- Judges run locally with `npm run dev`
- SQLite database auto-created on first run

**Future Production (Not in Scope):**
- Would require PostgreSQL migration
- HTTPS for geolocation in production browsers
- Environment-based configuration

## Performance Requirements

**Response Times:**
- API endpoints: < 200ms
- Page loads: < 1s (after initial load)
- Match calculation: < 500ms for 100 users

**Scalability (MVP Scope):**
- Designed for local testing with < 100 users
- SQLite sufficient for hackathon demo
- No caching layer needed for MVP

## Security Considerations

**Authentication:**
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for session management
- Tokens expire after 24 hours

**Data Protection:**
- Location stored only with user consent
- No PII shared between users until meeting confirmed
- Demo users clearly marked in database

**Input Validation:**
- All inputs validated server-side
- SQL injection prevented via parameterized queries
- XSS prevented via React's default escaping

**Development Security:**
- No external API keys required
- No sensitive data in repository
- Environment variables for secrets
