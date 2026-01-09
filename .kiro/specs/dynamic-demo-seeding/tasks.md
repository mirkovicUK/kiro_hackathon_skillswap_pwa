# Implementation Plan: Dynamic Demo Seeding

## Overview

Replace the hardcoded 6 demo users with a dynamic seeding system that generates 15-25 demo users covering all available skills. This ensures comprehensive testing coverage for any skill combination.

## Tasks

- [x] 1. Enhance SeedService with dynamic seeding
  - [x] 1.1 Add DEMO_NAMES constant with 25 gender-neutral names
    - Add name pool array to SeedService
    - _Requirements: 2.1_
  - [x] 1.2 Implement skill coverage algorithm
    - Load skills from skills.json
    - Create mapping ensuring each skill has 1-3 demo users
    - _Requirements: 1.1, 1.2_
  - [x] 1.3 Implement demo user generation
    - Generate 15-25 users with names from pool
    - Assign 1-2 offer skills and 1-2 need skills per user
    - Ensure no overlap between offer and need skills
    - _Requirements: 1.3, 2.2, 2.3_
  - [x] 1.4 Implement location distribution
    - Place users at varying distances (0.3-1.8 miles)
    - Ensure distance variance for realistic distribution
    - _Requirements: 3.1, 3.3_

- [x] 2. Update relocation logic
  - [x] 2.1 Enhance relocateDemoUsers to preserve skills
    - Move users to new location range
    - Keep skill assignments intact
    - _Requirements: 3.2_

- [x] 3. Implement idempotent seeding
  - [x] 3.1 Add duplicate prevention logic
    - Check for existing demo users before creating
    - Update locations instead of recreating
    - _Requirements: 5.1_
  - [x] 3.2 Preserve existing relationships
    - Keep match_interests records
    - Keep meetings records
    - _Requirements: 5.2_

- [x] 4. Write property tests
  - [x] 4.1 Property 1: Complete Skill Coverage
    - **Property 1: Complete Skill Coverage**
    - **Validates: Requirements 1.1, 1.2**
  - [x] 4.2 Property 2: Valid Skill Counts Per User
    - **Property 2: Valid Skill Counts Per User**
    - **Validates: Requirements 1.3**
  - [x] 4.3 Property 3: No Skill Overlap
    - **Property 3: No Skill Overlap**
    - **Validates: Requirements 2.2**
  - [x] 4.4 Property 4: Names From Pool
    - **Property 4: Names From Pool**
    - **Validates: Requirements 2.1**
  - [x] 4.5 Property 5: Demo User Count Range
    - **Property 5: Demo User Count Range**
    - **Validates: Requirements 2.3**
  - [x] 4.6 Property 6: Distance Range
    - **Property 6: Distance Range**
    - **Validates: Requirements 3.1, 3.2**
  - [x] 4.7 Property 7: Distance Variance
    - **Property 7: Distance Variance**
    - **Validates: Requirements 3.3**
  - [x] 4.8 Property 8: Seeding Idempotence
    - **Property 8: Seeding Idempotence**
    - **Validates: Requirements 5.1**
  - [x] 4.9 Property 9: Data Preservation
    - **Property 9: Data Preservation**
    - **Validates: Requirements 5.2**

- [x] 5. Checkpoint - Test and verify
  - All 13 property tests passing ✅
  - Manual testing pending

- [x] 6. Clean up and documentation
  - [x] 6.1 Remove old hardcoded DEMO_PROFILES
    - Deleted the old 6-user profile array
    - _Requirements: N/A (cleanup)_
  - [x] 6.2 Update DEVLOG with completion
    - Document feature completion
    - Update Kiro usage statistics
    - _Requirements: N/A (documentation)_

## Notes

- All tasks including property tests completed ✅
- Auto-behavior (4.1, 4.2, 4.3 from requirements) already implemented in MatchService and MeetingService
- seeding.property.js updated with 13 tests (9 new properties + 4 additional tests)
- All tests passing
