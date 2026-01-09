# SkillSwap PWA - Testing Methodology

---

## ⚠️ CRITICAL: TEST FAILURE TRIAGE (HIGHEST PRIORITY)

**TESTS ARE MEANT FOR CATCHING BUGS. IF A TEST FAILS, DO NOT JUST ADJUST THE TEST TO MAKE IT PASS.**

### The Golden Rule

When a test fails, follow this triage process:

1. **Is the test correct according to requirements?**
   - **YES** → The code has a bug. **FIX THE CODE.**
   - **NO** → The test is wrong. Fix the test.

2. **NEVER assume the code is correct just because it exists.**

3. **A failing test is a signal** - it's doing its job by catching potential bugs.

### Forbidden Actions

❌ **NEVER** change a test just to make it pass without understanding WHY it failed  
❌ **NEVER** assume the implementation is correct and the test is wrong  
❌ **NEVER** weaken test assertions to avoid failures  
❌ **NEVER** delete or skip tests because they're "inconvenient"  

### Required Actions

✅ **ALWAYS** read the test and understand what behavior it's verifying  
✅ **ALWAYS** check the requirements/spec to determine expected behavior  
✅ **ALWAYS** investigate the code when a test fails - the bug is likely there  
✅ **ALWAYS** ask: "Is this test catching a real bug in my code?"  

### Example: Correct Triage

```
Test: Property 12 - Mutual Interest Unlocks Meeting
Assertion: meeting scheduling should be enabled when both users express interest
Actual: meeting scheduling is disabled

WRONG APPROACH: "The test must be wrong, let me change the expected value"

RIGHT APPROACH: "The test expects mutual interest to unlock meetings (per requirements).
                The code isn't doing that. The CODE has a bug. Fix the code."
```

### Why This Matters

Tests exist to verify correctness. If you change tests to match buggy code:
- Bugs ship to production
- The test suite becomes worthless
- Future developers inherit broken behavior

**When in doubt: THE TEST IS PROBABLY RIGHT. THE CODE IS PROBABLY WRONG.**

---

## Testing Stack

| Layer | Framework | Property Testing |
|-------|-----------|------------------|
| Backend (Express.js) | Vitest + Supertest | fast-check |
| Frontend (React) | Vitest + React Testing Library | fast-check |
| Database | SQLite (in-memory for tests) | - |

---

## Test Naming Convention

| Type | Pattern | Location | Example |
|------|---------|----------|---------|
| Unit test | `*.test.js` | `tests/unit/` | `auth.test.js` |
| Property test | `*.property.js` | `tests/properties/` | `auth.property.js` |
| Integration | `*.integration.js` | `tests/integration/` | `flow.integration.js` |

---

## Vitest Configuration

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,property,integration}.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'client/']
    }
  }
})
```

---

## Property-Based Testing with fast-check

### Configuration

```javascript
import fc from 'fast-check'

// Each property test runs minimum 100 iterations (50 for slower tests)
fc.assert(
  fc.property(
    fc.emailAddress(),
    fc.string({ minLength: 8 }),
    (email, password) => {
      // Property assertion
    }
  ),
  { numRuns: 100 }
)
```

### 18 Correctness Properties

Reference: `.kiro/specs/skillswap-pwa/design.md`

| Property | File | Validates |
|----------|------|-----------|
| 1. Auth Round-Trip | `auth.property.js` | Req 1.1, 1.3 |
| 2. Duplicate Email Rejection | `auth.property.js` | Req 1.2 |
| 3. Invalid Credentials Rejection | `auth.property.js` | Req 1.4 |
| 4. Skills Storage Round-Trip | `skills.property.js` | Req 2.3-2.7 |
| 5. Location Precision | `skills.property.js` | Req 3.2, 3.5 |
| 6. Complementary Skills Matching | `matching.property.js` | Req 4.1 |
| 7. Distance Filtering | `matching.property.js` | Req 4.2 |
| 8. Haversine Accuracy | `geo.property.js` | Req 4.3 |
| 9. Match Sorting | `matching.property.js` | Req 4.4 |
| 10. Match Response Completeness | `matching.property.js` | Req 4.5 |
| 11. Single Interest = Pending | `interest.property.js` | Req 5.3, 5.6 |
| 12. Mutual Interest Unlocks Meeting | `interest.property.js` | Req 5.4, 6.1 |
| 13. Meeting Proposal Round-Trip | `meeting.property.js` | Req 6.2, 6.3 |
| 14. Meeting Acceptance Flow | `meeting.property.js` | Req 6.4-6.6 |
| 15. Meeting Confirmation Requires Both | `meeting.property.js` | Req 7.2, 7.3, 7.5 |
| 16. Verification Unlocks Swap | `meeting.property.js` | Req 7.4 |
| 17. Demo Seeding Distance | `seeding.property.js` | Req 8.2 |
| 18. Demo Users Create Matches | `seeding.property.js` | Req 8.3, 8.5 |

---

## Test File Structure

```
tests/
├── properties/           # Property-based tests (18 properties)
│   ├── auth.property.js      # Properties 1-3
│   ├── skills.property.js    # Properties 4-5
│   ├── geo.property.js       # Property 8
│   ├── matching.property.js  # Properties 6, 7, 9, 10
│   ├── interest.property.js  # Properties 11-12
│   ├── meeting.property.js   # Properties 13-16
│   └── seeding.property.js   # Properties 17-18
├── unit/                 # Unit tests for services
│   ├── auth.test.js
│   ├── geo.test.js
│   ├── matching.test.js
│   └── meeting.test.js
└── integration/          # Full flow tests
    └── flow.integration.js
```

---

## MANDATORY: 3-Phase Testing Approach

### Overview

We use a 3-phase "Double-Loop TDD" methodology that separates requirements validation from implementation coverage.

```
Phase 1: TDD Tests      → Requirements only (black-box)
Phase 2: Write Code     → Requirements only (clear test context)
Phase 3: Coverage Tests → Code + requirements (white-box)
```

---

## Phase 1: TDD Tests (Requirements-First)

### What You See
- Requirements document only (`.kiro/specs/skillswap-pwa/requirements.md`)
- Design document properties (`.kiro/specs/skillswap-pwa/design.md`)
- **NO implementation code**

### What You Write
- Tests based purely on WHAT the system should do
- Black-box tests against expected behavior
- Property-based tests for correctness invariants

### Key Rules
1. **DO NOT** look at implementation code
2. **DO** use GIVEN/WHEN/THEN format
3. **DO** reference specific requirements
4. **DO** write property tests for invariants
5. Tests WILL FAIL initially (no code exists yet)

---

## Phase 2: Write Implementation Code

### What You See
- Requirements document only
- **NO Phase 1 tests** (clear from context)

### What You Do
- Implement based purely on requirements
- Natural design emerges from problem understanding
- Don't "shape" code to pass specific tests

### Key Rules
1. **CLEAR Phase 1 tests from context/memory**
2. Implement from requirements specification
3. Run Phase 1 tests after implementation
4. All Phase 1 tests should PASS

### If Phase 1 Tests Fail

**STOP. DO NOT MODIFY THE TEST.**

**Triage Process:**
1. Re-read the requirement the test is validating
2. Determine what behavior is CORRECT according to requirements
3. If the test matches requirements → **FIX THE CODE**
4. If the test misinterprets requirements → Fix the test (rare)

**The code is guilty until proven innocent. Tests catch bugs - that's their job.**

---

## Phase 3: Coverage Tests (Implementation-Aware)

### What You See
- Requirements document
- Implementation code
- Phase 1 tests

### What You Write
- Edge case tests
- Error path tests
- Implementation-specific behavior tests
- Integration tests

### Key Rules
1. **DO** test internal functions
2. **DO** test error paths
3. **DO** test edge cases discovered in code
4. **DO NOT** duplicate Phase 1 tests
5. **DO** add regression tests for bugs found

---

## Test Examples

### Property Test Example (fast-check)

```javascript
/**
 * Property Tests for Authentication
 * Feature: skillswap-pwa
 * Properties: 1, 2, 3
 */

import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import fc from 'fast-check'
import request from 'supertest'
import express from 'express'
import { db, initDatabase } from '../../server/db.js'
import authRoutes from '../../server/routes/auth.js'

describe('Property Tests: Authentication', () => {
  let app

  beforeAll(() => {
    initDatabase()
    app = express()
    app.use(express.json())
    app.use('/api/auth', authRoutes)
  })

  /**
   * Property 1: Authentication Round-Trip
   * 
   * *For any* valid email and password combination, registering a user
   * and then logging in with the same credentials SHALL successfully
   * authenticate and return a valid session token.
   *
   * GIVEN: A valid email and password (min 8 chars)
   * WHEN: User registers then logs in with same credentials
   * THEN: Login succeeds with valid token
   *
   * Validates: Requirements 1.1, 1.3
   */
  test('Property 1: Authentication Round-Trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.uuid(),
        async (email, password, name, uniqueId) => {
          const uniqueEmail = `${uniqueId}-${email}`

          // Register
          const registerRes = await request(app)
            .post('/api/auth/register')
            .send({ email: uniqueEmail, password, name })

          if (registerRes.status !== 201) return true

          // Login with same credentials
          const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: uniqueEmail, password })

          expect(loginRes.status).toBe(200)
          expect(loginRes.body.token).toBeDefined()
          expect(typeof loginRes.body.token).toBe('string')

          return true
        }
      ),
      { numRuns: 50 }
    )
  })
})
```

### Unit Test Example

```javascript
/**
 * Unit Tests for GeoService
 * Covers: Edge cases and error paths
 */

import { describe, test, expect } from 'vitest'
import { GeoService } from '../../server/services/GeoService.js'

describe('GeoService - Unit Tests', () => {
  /**
   * Test edge case: Antipodal points (opposite sides of Earth)
   * Covers: Maximum distance calculation
   */
  test('calculates maximum distance for antipodal points', () => {
    // North Pole to South Pole
    const distance = GeoService.calculateDistance(90, 0, -90, 0)
    
    // Should be approximately half Earth's circumference (~12,450 miles)
    expect(distance).toBeGreaterThan(12400)
    expect(distance).toBeLessThan(12500)
  })

  /**
   * Test error handling: Invalid coordinates
   * Covers: Validation error path
   */
  test('validates coordinate bounds', () => {
    expect(GeoService.isValidCoordinates(91, 0)).toBe(false)
    expect(GeoService.isValidCoordinates(0, 181)).toBe(false)
    expect(GeoService.isValidCoordinates(NaN, 0)).toBe(false)
  })
})
```

### Integration Test Example

```javascript
/**
 * Integration Tests: Complete User Flow
 * Covers: Register → Profile → Discover → Match → Meet → Confirm
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createTestApp, cleanupTestDb } from '../helpers.js'

describe('Integration: Complete User Flow', () => {
  let app

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await cleanupTestDb()
  })

  /**
   * Full flow test: Two users match and schedule meeting
   * 
   * GIVEN: Two users with complementary skills in same area
   * WHEN: Both express interest and schedule meeting
   * THEN: Meeting is created and both can confirm
   */
  test('two users can match and schedule coffee meeting', async () => {
    // 1. Register User A (offers Plumbing, needs Web Design)
    const userA = await registerUser(app, {
      email: 'alex@test.com',
      skills: { offer: ['Plumbing'], need: ['Web Design'] },
      location: { lat: 40.7128, lon: -74.0060 }
    })

    // 2. Register User B (offers Web Design, needs Plumbing)
    const userB = await registerUser(app, {
      email: 'maria@test.com', 
      skills: { offer: ['Web Design'], need: ['Plumbing'] },
      location: { lat: 40.7150, lon: -74.0080 }
    })

    // 3. User A discovers User B
    const matches = await request(app)
      .get('/api/matches/discover')
      .set('Authorization', `Bearer ${userA.token}`)

    expect(matches.body.matches).toContainEqual(
      expect.objectContaining({ userId: userB.userId })
    )

    // 4. Both express interest
    await request(app)
      .post(`/api/matches/${userB.userId}/interest`)
      .set('Authorization', `Bearer ${userA.token}`)

    const mutualRes = await request(app)
      .post(`/api/matches/${userA.userId}/interest`)
      .set('Authorization', `Bearer ${userB.token}`)

    expect(mutualRes.body.status).toBe('mutual')

    // 5. User A proposes meeting
    const meetingRes = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        matchId: mutualRes.body.matchId,
        location: 'Blue Bottle Coffee',
        proposedDate: '2026-01-15',
        proposedTime: '14:00'
      })

    expect(meetingRes.status).toBe(201)
  })
})
```

---

## Test Docstring Format

### Property Tests (Requirements)

```javascript
/**
 * Property X: [Property Name]
 * 
 * *For any* [input conditions], [system behavior]
 * SHALL [expected outcome].
 *
 * GIVEN: [Initial state/preconditions]
 * WHEN: [Action taken]
 * THEN: [Expected outcome]
 *
 * Validates: Requirements X.Y
 */
```

### Unit Tests (Implementation)

```javascript
/**
 * Test [specific function/behavior].
 * Covers: [edge case / error path / implementation detail]
 */
```

---

## When to Apply Each Phase

| Scenario | Phase 1 | Phase 2 | Phase 3 |
|----------|---------|---------|---------|
| New feature | ✅ | ✅ | ✅ |
| Bug fix | ❌ | ✅ | ✅ (regression test) |
| Refactor | ❌ | ✅ | ✅ (verify behavior) |
| Simple CRUD | Optional | ✅ | ✅ |
| Critical logic (matching, auth) | ✅ Required | ✅ | ✅ |

---

## Workflow Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run property tests only
npm run test:props

# Run specific test file
npm test -- --run tests/properties/auth.property.js

# Run with coverage
npm test -- --coverage

# Run tests matching pattern
npm test -- --run -t "Property 1"
```

---

## Mocking External Services

### Mocking Database (for isolated tests)

```javascript
import { vi, beforeEach } from 'vitest'
import { db } from '../../server/db.js'

beforeEach(() => {
  // Clean test data between runs
  db.prepare('DELETE FROM users WHERE email LIKE ?').run('test-%@example.com')
  db.prepare('DELETE FROM user_skills WHERE user_id NOT IN (SELECT id FROM users)').run()
})
```

### Mocking Geolocation (frontend)

```javascript
// Mock browser geolocation API
const mockGeolocation = {
  getCurrentPosition: vi.fn((success) => {
    success({
      coords: { latitude: 40.7128, longitude: -74.0060 }
    })
  })
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation
})
```

---

## Coverage Goals

- **Property tests**: All 18 correctness properties implemented
- **Unit tests**: All service methods and edge cases
- **Integration tests**: Complete user flow (register → match → meet → swap)
- **Target**: 80%+ line coverage on server code

---

## Enforcement

This testing methodology is **MANDATORY** for:
- All new features
- All property tests (18 required)
- All unit tests
- All integration tests

Exceptions require explicit justification in the commit message.
