# Design Document: Dynamic Demo Seeding

## Overview

This feature replaces the hardcoded 6 demo users with a dynamic seeding system that generates 15-25 demo users covering all available skills. This ensures judges can test the matching system with any skill combination they choose.

## Architecture

The existing `SeedService` will be enhanced with new seeding logic:

```
┌─────────────────────────────────────────────────────────┐
│                    SeedService                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  seedDemoUsers(latitude, longitude)              │   │
│  │  - Load skills from skills.json                  │   │
│  │  - Generate 15-25 demo users                     │   │
│  │  - Ensure all skills covered (1-3 users each)    │   │
│  │  - Place within 0.3-1.8 miles of real user       │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  relocateDemoUsers(latitude, longitude)          │   │
│  │  - Move all demo users to new location           │   │
│  │  - Preserve skill assignments                    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### SeedService (Enhanced)

```javascript
class SeedService {
  // Name pool for realistic demo users
  static DEMO_NAMES = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey',
    'Riley', 'Quinn', 'Avery', 'Parker', 'Sage',
    'River', 'Phoenix', 'Dakota', 'Skyler', 'Reese',
    'Cameron', 'Drew', 'Jamie', 'Kendall', 'Logan',
    'Peyton', 'Rowan', 'Finley', 'Emerson', 'Blake'
  ]

  // Seed demo users with comprehensive skill coverage
  static async seedDemoUsers(latitude, longitude) {
    // 1. Load all skills
    // 2. Create skill-to-users mapping (1-3 users per skill)
    // 3. Generate 15-25 demo users
    // 4. Assign skills ensuring full coverage
    // 5. Place at varying distances (0.3-1.8 miles)
  }

  // Relocate existing demo users
  static relocateDemoUsers(latitude, longitude) {
    // Move all demo users to new location
    // Preserve their skills and relationships
  }

  // Reset demo data for testing
  static resetDemoData() {
    // Delete all demo users and related data
  }
}
```

### Seeding Algorithm

```
1. Load all skills from skills.json (40 skills)
2. Shuffle skills randomly
3. For each skill:
   - Randomly decide 1, 2, or 3 demo users will offer it
   - Track which users offer which skills
4. Create demo users:
   - Pick unused name from pool
   - Assign 1-2 offer skills (from tracked assignments)
   - Assign 1-2 need skills (different from offer skills)
   - Generate location 0.3-1.8 miles from real user
5. Ensure total is 15-25 users (adjust if needed)
```

## Data Models

### Demo User Structure

```javascript
{
  email: `demo-${index}@skillswap.local`,
  name: DEMO_NAMES[index],
  password_hash: bcrypt.hash('demopass123'),
  latitude: generatedLat,
  longitude: generatedLon,
  is_demo_user: 1
}
```

### Skill Assignment

```javascript
{
  user_id: demoUserId,
  skill_name: 'Plumbing',
  type: 'offer' | 'need'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Complete Skill Coverage

*For any* seeding operation, every skill in `skills.json` SHALL be offered by at least one demo user, and each skill SHALL be offered by no more than 3 demo users.

**Validates: Requirements 1.1, 1.2**

### Property 2: Valid Skill Counts Per User

*For any* demo user created, they SHALL have between 1-2 skills they offer AND between 1-2 skills they need.

**Validates: Requirements 1.3**

### Property 3: No Skill Overlap

*For any* demo user, the intersection of their offered skills and needed skills SHALL be empty (no user offers and needs the same skill).

**Validates: Requirements 2.2**

### Property 4: Names From Pool

*For any* demo user created, their name SHALL be from the predefined DEMO_NAMES pool.

**Validates: Requirements 2.1**

### Property 5: Demo User Count Range

*For any* seeding operation, the total number of demo users created SHALL be between 15 and 25 inclusive.

**Validates: Requirements 2.3**

### Property 6: Distance Range

*For any* demo user after seeding or relocation, their distance from the real user SHALL be between 0.3 and 1.8 miles.

**Validates: Requirements 3.1, 3.2**

### Property 7: Distance Variance

*For any* set of demo users, the standard deviation of their distances from the real user SHALL be greater than 0.1 miles (ensuring distribution, not clustering).

**Validates: Requirements 3.3**

### Property 8: Seeding Idempotence

*For any* seeding operation run twice in succession, the count of demo users SHALL remain the same (no duplicates created).

**Validates: Requirements 5.1**

### Property 9: Data Preservation

*For any* seeding operation when demo users already exist, existing match interests and meetings involving demo users SHALL be preserved.

**Validates: Requirements 5.2**

## Error Handling

| Error | Handling |
|-------|----------|
| DEMO_MODE not set | Skip seeding silently |
| skills.json not found | Log error, use empty skill list |
| Database error | Log error, continue with partial seeding |
| Name pool exhausted | Reuse names with numeric suffix |

## Testing Strategy

### Property-Based Tests

Using fast-check with minimum 100 iterations:

1. **Skill Coverage Test**: Seed, verify all skills covered 1-3 times
2. **User Skill Count Test**: Seed, verify each user has 1-2 offer and 1-2 need skills
3. **No Overlap Test**: Seed, verify no user has same skill in offer and need
4. **Name Pool Test**: Seed, verify all names from pool
5. **Count Range Test**: Seed, verify 15-25 users created
6. **Distance Range Test**: Seed, verify all users 0.3-1.8 miles away
7. **Distance Variance Test**: Seed, verify distance std dev > 0.1
8. **Idempotence Test**: Seed twice, verify same count
9. **Preservation Test**: Create interests, seed, verify interests exist

### Unit Tests

- Edge case: Empty skills list
- Edge case: Single real user
- Edge case: DEMO_MODE=false
- Integration: Full seeding flow with database
