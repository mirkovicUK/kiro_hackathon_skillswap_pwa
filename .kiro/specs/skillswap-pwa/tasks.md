# Implementation Plan: SkillSwap PWA

## Overview

This implementation plan breaks down the SkillSwap PWA into discrete, incremental tasks over 8 working days. Each task builds on previous work, ensuring a working product at each checkpoint. The stack is React + Vite (frontend), Express.js (backend), and SQLite (database) - all runnable with `npm install && npm run dev`.

## Tasks

- [x] 1. Project Setup and Foundation
  - [x] 1.1 Initialize monorepo structure with Vite + Express
    - Create package.json with concurrent dev script
    - Set up Vite for React frontend in `/client`
    - Set up Express server in `/server`
    - Configure Tailwind CSS
    - _Requirements: 10.1, 10.2_

  - [x] 1.2 Set up SQLite database and schema
    - Create database initialization script
    - Implement all tables (users, user_skills, match_interests, meetings, app_meta)
    - Add auto-migration on server start
    - _Requirements: 10.2, 10.5_

  - [x] 1.3 Create skills data file
    - Create `/server/data/skills.json` with 30 predefined skills
    - Create endpoint `GET /api/skills` to serve the list
    - _Requirements: 2.2_

- [x] 2. Authentication System
  - [x] 2.1 Implement AuthService and auth routes
    - Create password hashing with bcrypt
    - Implement `POST /api/auth/register` endpoint
    - Implement `POST /api/auth/login` endpoint
    - Implement session token generation (JWT or simple token)
    - Create auth middleware for protected routes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Write property tests for authentication
    - **Property 1: Authentication Round-Trip**
    - **Property 2: Duplicate Email Rejection**
    - **Property 3: Invalid Credentials Rejection**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [x] 2.3 Create auth UI components
    - Build Login page with form
    - Build Register page with form
    - Add error display for validation failures
    - Implement auth context for session management
    - _Requirements: 1.1, 1.3, 1.6_

- [x] 3. Checkpoint - Auth System Complete
  - Ensure registration and login work end-to-end
  - Verify protected routes require authentication
  - Ask user if questions arise

- [x] 4. User Profile and Skills Management
  - [x] 4.1 Implement user profile endpoints
    - Create `GET /api/users/me` endpoint
    - Create `PUT /api/users/me` endpoint
    - Create `PUT /api/users/me/location` endpoint
    - Create `GET /api/users/me/skills` endpoint
    - Create `PUT /api/users/me/skills` endpoint
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 3.2_

  - [x] 4.2 Write property tests for skills and location
    - **Property 4: Skills Storage Round-Trip**
    - **Property 5: Location Precision Preservation**
    - **Validates: Requirements 2.3, 2.4, 2.5, 3.2, 3.5**

  - [x] 4.3 Create profile UI components
    - Build Profile page with name editing
    - Build SkillSelector component (multi-select)
    - Implement offer/need skill selection
    - Add geolocation capture on profile setup
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_

- [x] 5. Geolocation Service
  - [x] 5.1 Implement GeoService with Haversine formula
    - Create `calculateDistance(lat1, lon1, lat2, lon2)` function
    - Create `isWithinRadius(lat1, lon1, lat2, lon2, miles)` function
    - Create `generateNearbyPoint(lat, lon, minMiles, maxMiles)` for seeding
    - _Requirements: 4.2, 4.3_

  - [x] 5.2 Write property tests for geo calculations
    - **Property 8: Haversine Distance Accuracy**
    - Test against known coordinate pairs with verified distances
    - **Validates: Requirements 4.3**

- [x] 6. Checkpoint - Profile System Complete
  - Ensure users can set name, skills, and location
  - Verify location is captured and stored correctly
  - Ask user if questions arise

- [x] 7. Matching Algorithm
  - [x] 7.1 Implement MatchService
    - Create `findMatches(userId)` - find complementary skills within radius
    - Create `expressInterest(userId, targetId)` - record interest
    - Create `getMutualMatches(userId)` - get matches where both interested
    - Create `declineMatch(userId, targetId)` - remove match
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 5.3, 5.4, 5.5_

  - [x] 7.2 Write property tests for matching
    - **Property 6: Complementary Skills Matching**
    - **Property 7: Distance Filtering**
    - **Property 9: Match Sorting by Distance**
    - **Property 10: Match Response Completeness**
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.5**

  - [x] 7.3 Implement match API routes
    - Create `GET /api/matches/discover` endpoint
    - Create `POST /api/matches/:userId/interest` endpoint
    - Create `GET /api/matches` endpoint (mutual matches)
    - Create `DELETE /api/matches/:matchId` endpoint
    - _Requirements: 4.4, 5.3, 5.4, 5.5_

  - [x] 7.4 Create discovery UI
    - Build Discover page showing nearby matches
    - Build MatchCard component with skill overlap display
    - Add "I'm Interested" button with status feedback
    - Show distance for each match
    - _Requirements: 4.4, 4.5, 5.2, 5.3_

- [x] 8. Mutual Interest System
  - [x] 8.1 Implement interest confirmation flow
    - Track interest from both sides in match_interests table
    - Return appropriate status (pending/mutual) on interest expression
    - Update match status when both confirm
    - _Requirements: 5.3, 5.4, 5.6_

  - [x] 8.2 Write property tests for interest flow
    - **Property 11: Single Interest Returns Pending**
    - **Property 12: Mutual Interest Unlocks Meeting**
    - **Validates: Requirements 5.3, 5.4, 5.6**

  - [x] 8.3 Create matches list UI
    - Build Matches page showing confirmed mutual matches
    - Display status indicators (waiting, mutual, meeting scheduled)
    - Add navigation to meeting scheduling
    - _Requirements: 5.3, 5.4_

- [x] 9. Checkpoint - Matching System Complete
  - Ensure users can discover matches based on skills and location
  - Verify mutual interest flow works correctly
  - Test that meeting scheduling is blocked until mutual interest
  - Ask user if questions arise

- [x] 10. Coffee Meeting System
  - [x] 10.1 Implement meeting endpoints
    - Create `POST /api/meetings` - propose meeting
    - Create `GET /api/meetings/:matchId` - get meeting details
    - Create `PUT /api/meetings/:meetingId/accept` - accept proposal
    - Create `PUT /api/meetings/:meetingId/confirm` - confirm meeting happened
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3_

  - [x] 10.2 Write property tests for meetings
    - **Property 13: Meeting Proposal Round-Trip**
    - **Property 14: Meeting Acceptance Flow**
    - **Property 15: Meeting Confirmation Requires Both**
    - **Property 16: Verification Unlocks Skill Swap**
    - **Validates: Requirements 6.2, 6.4, 6.5, 7.2, 7.3, 7.4**

  - [x] 10.3 Create meeting UI
    - Build Meeting page with proposal form (location, date, time)
    - Add accept/modify meeting flow
    - Add "Confirm Meeting Happened" buttons for both users
    - Show skill swap unlock message on completion
    - _Requirements: 6.2, 6.4, 7.1, 7.6_

- [x] 11. Checkpoint - Core Flow Complete
  - Test complete flow: register → profile → discover → match → meet → confirm
  - Verify skill swap unlocks after both confirm meeting
  - Ask user if questions arise

- [x] 12. Demo Data Seeding
  - [x] 12.1 Implement SeedService
    - Create demo user profiles with varied skills
    - Generate locations within 0.5-1.5 miles of real user
    - Ensure complementary skills for guaranteed matches
    - Check DEMO_MODE environment variable
    - Trigger seeding on first real user registration
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 12.2 Write property tests for seeding
    - **Property 17: Demo Seeding Distance Range**
    - **Property 18: Demo Users Create Valid Matches**
    - **Validates: Requirements 8.2, 8.3, 8.5**

- [x] 13. PWA Configuration
  - [x] 13.1 Set up PWA manifest and service worker
    - Create manifest.json with app name, icons, theme
    - Register service worker for offline caching
    - Add install prompt handling
    - Configure asset caching strategy
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 13.2 Ensure responsive design
    - Test and fix mobile layout issues
    - Verify touch interactions work correctly
    - Test on various screen sizes
    - _Requirements: 9.5_

- [ ] 14. Documentation and Polish
  - [ ] 14.1 Create comprehensive README
    - Project description and value proposition
    - Prerequisites and setup instructions
    - Architecture overview
    - Testing instructions for judges
    - Troubleshooting section
    - _Requirements: 10.4_

  - [ ] 14.2 Complete DEVLOG.md
    - Document development timeline
    - Record technical decisions and rationale
    - Note challenges and solutions
    - Track Kiro CLI usage

  - [ ] 14.3 Update steering documents
    - Fill in product.md with SkillSwap details
    - Complete tech.md with stack information
    - Update structure.md with final project layout

- [ ] 15. Final Checkpoint - Submission Ready
  - Run full test suite and ensure all pass
  - Test complete judge flow (clone → install → run → test)
  - Verify demo seeding works for new users
  - Record demo video
  - Run `@code-review-hackathon` for final evaluation

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each checkpoint ensures incremental progress with working functionality
- Property tests validate universal correctness properties from the design document
- Unit tests (not listed separately) should be written alongside implementation
- DEVLOG should be updated continuously, not just at the end
