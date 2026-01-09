# Requirements Document

## Introduction

This feature enhances the demo user seeding system to provide comprehensive skill coverage. Instead of 6 hardcoded demo users with fixed skills, the system will dynamically generate demo users that cover all available skills, ensuring judges and testers can find matches regardless of which skills they select.

## Glossary

- **Demo_User**: A system-generated fake user marked with `is_demo_user=1` for testing purposes
- **Skill**: A service that can be offered or needed, from the predefined list in `skills.json`
- **Seed_Service**: The backend service responsible for creating and managing demo users
- **Complementary_Match**: When User A offers what User B needs AND User B offers what User A needs

## Requirements

### Requirement 1: Comprehensive Skill Coverage

**User Story:** As a judge testing the app, I want demo users to cover all available skills, so that I can test the matching system with any skill combination.

#### Acceptance Criteria

1. WHEN demo users are seeded, THE Seed_Service SHALL ensure every skill in `skills.json` is offered by at least one demo user
2. WHEN demo users are seeded, THE Seed_Service SHALL create 1-3 demo users for each skill (randomized for variety)
3. WHEN a demo user is created, THE Seed_Service SHALL assign 1-2 skills they offer and 1-2 different skills they need

### Requirement 2: Realistic Demo User Profiles

**User Story:** As a judge testing the app, I want demo users to have realistic-looking profiles, so that the demo feels authentic.

#### Acceptance Criteria

1. WHEN a demo user is created, THE Seed_Service SHALL generate a realistic name from a predefined name pool
2. WHEN a demo user is created, THE Seed_Service SHALL ensure offered skills and needed skills do not overlap
3. THE Seed_Service SHALL generate between 15-25 demo users total to provide variety without overwhelming the UI

### Requirement 3: Location-Based Demo Users

**User Story:** As a judge testing the app, I want demo users to appear near my location, so that I can test the location-based matching.

#### Acceptance Criteria

1. WHEN demo users are seeded, THE Seed_Service SHALL place all demo users within 0.3-1.8 miles of the real user's location
2. WHEN a real user updates their location, THE Seed_Service SHALL relocate all demo users around the new location
3. THE Seed_Service SHALL distribute demo users at varying distances for realistic discovery results

### Requirement 4: Demo User Auto-Behavior

**User Story:** As a single tester, I want demo users to automatically respond to my actions, so that I can test the complete flow alone.

#### Acceptance Criteria

1. WHEN a real user expresses interest in a demo user, THE Match_Service SHALL automatically create reciprocal interest (mutual match)
2. WHEN a real user proposes a meeting with a demo user, THE Meeting_Service SHALL automatically accept the meeting
3. WHEN a real user confirms a meeting happened, THE Meeting_Service SHALL automatically confirm on behalf of the demo user

### Requirement 5: Idempotent Seeding

**User Story:** As a developer, I want seeding to be safe to run multiple times, so that the system remains stable.

#### Acceptance Criteria

1. WHEN seeding is triggered and demo users already exist, THE Seed_Service SHALL update existing demo users rather than create duplicates
2. WHEN seeding is triggered, THE Seed_Service SHALL preserve any existing match interests and meetings with demo users
3. THE Seed_Service SHALL only seed when `DEMO_MODE=true` environment variable is set
