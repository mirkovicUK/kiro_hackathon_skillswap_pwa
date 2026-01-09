# Requirements Document

## Introduction

SkillSwap is a Progressive Web App (PWA) that connects neighbors within a ~2 mile radius for skill exchanges. The core innovation is a **mandatory social coffee meeting** before any skill swap can occur. This counter-intuitive "slow down" approach solves three problems simultaneously: user verification, safety, and urban loneliness. The skill swap is the excuse; human connection is the product.

## Glossary

- **User**: A registered person who can offer and request skills
- **Skill**: A tradeable service or knowledge (e.g., "Plumbing", "Web Design", "Spanish Lessons")
- **Match**: Two users with complementary skills (User A offers what User B needs, and vice versa) within geographic proximity
- **Coffee_Meeting**: A mandatory in-person meeting at a public location before skill exchange is unlocked
- **Skill_Swap**: The actual exchange of services, only available after a confirmed coffee meeting
- **Nearby_Radius**: Geographic filter of approximately 2 miles from user's location
- **Mutual_Confirmation**: Both parties must independently confirm an action for it to proceed

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a new user, I want to create an account and sign in, so that I can access the skill swap platform and maintain my profile.

#### Acceptance Criteria

1. WHEN a user submits registration with email and password, THE System SHALL create a new account and store credentials securely
2. WHEN a user attempts to register with an existing email, THE System SHALL reject the registration and display an error message
3. WHEN a user submits valid login credentials, THE System SHALL authenticate the user and create a session
4. WHEN a user submits invalid login credentials, THE System SHALL reject the login and display an error message
5. WHEN a user is authenticated, THE System SHALL maintain the session until explicit logout or timeout
6. IF a registration or login request fails validation, THEN THE System SHALL display specific error messages indicating the issue

### Requirement 2: User Profile and Skills Management

**User Story:** As a user, I want to create and manage my profile with skills I offer and skills I need, so that the system can find appropriate matches for me.

#### Acceptance Criteria

1. WHEN a user creates a profile, THE System SHALL require a display name
2. WHEN a user accesses the skills selection, THE System SHALL display a predefined list of available skills
3. WHEN a user selects skills they offer, THE System SHALL store these as "offer" type skills linked to the user
4. WHEN a user selects skills they need, THE System SHALL store these as "need" type skills linked to the user
5. WHEN a user updates their profile or skills, THE System SHALL persist the changes immediately
6. THE System SHALL allow a user to have multiple skills in both offer and need categories
7. WHEN a user views their profile, THE System SHALL display all their offered and needed skills

### Requirement 3: Geolocation Capture and Storage

**User Story:** As a user, I want the app to know my location, so that I can be matched with neighbors within walking distance.

#### Acceptance Criteria

1. WHEN a user completes registration, THE System SHALL request browser geolocation permission
2. WHEN a user grants location permission, THE System SHALL capture and store latitude and longitude coordinates
3. WHEN a user denies location permission, THE System SHALL inform the user that location is required for matching
4. IF geolocation capture fails, THEN THE System SHALL display an error and allow retry
5. THE System SHALL store location coordinates with sufficient precision for distance calculations (minimum 6 decimal places)
6. WHEN a user's location is updated, THE System SHALL recalculate potential matches

### Requirement 4: Skill Matching Algorithm

**User Story:** As a user, I want to discover neighbors who have skills I need and need skills I offer, so that we can arrange a mutually beneficial exchange.

#### Acceptance Criteria

1. THE System SHALL identify a match when User A offers a skill that User B needs AND User B offers a skill that User A needs
2. THE System SHALL filter matches to only include users within the Nearby_Radius (approximately 2 miles)
3. WHEN calculating distance, THE System SHALL use the Haversine formula on stored coordinates
4. WHEN a user views the discovery page, THE System SHALL display all valid matches sorted by distance (nearest first)
5. THE System SHALL display match information including: user name, skills they offer that you need, skills they need that you offer, and approximate distance
6. WHEN a new user registers with location, THE System SHALL check for matches with existing users
7. WHEN a user updates their skills, THE System SHALL recalculate their matches

### Requirement 5: Mutual Match Confirmation

**User Story:** As a user, I want both parties to confirm interest before proceeding, so that coffee meetings only happen when there's mutual enthusiasm.

#### Acceptance Criteria

1. WHEN a match is identified, THE System SHALL notify both users of the potential match
2. WHEN a user views a match, THE System SHALL display a "I'm Interested" confirmation button
3. WHEN only one user confirms interest, THE System SHALL show "Waiting for other party" status
4. WHEN both users confirm interest, THE System SHALL unlock the coffee meeting scheduling feature
5. WHEN a user declines a match, THE System SHALL remove the match from both users' views
6. THE System SHALL not allow coffee meeting scheduling until both parties have confirmed interest

### Requirement 6: Coffee Meeting Scheduling

**User Story:** As a matched user, I want to propose and agree on a coffee meeting time and place, so that we can meet in person before exchanging skills.

#### Acceptance Criteria

1. WHEN both users have confirmed interest, THE System SHALL enable meeting proposal functionality
2. WHEN a user proposes a meeting, THE System SHALL capture: suggested location (text), suggested date, and suggested time
3. WHEN a meeting is proposed, THE System SHALL notify the other user of the proposal
4. WHEN viewing a proposal, THE System SHALL allow the other user to accept or suggest changes
5. WHEN both users agree on meeting details, THE System SHALL mark the meeting as "scheduled"
6. THE System SHALL display scheduled meeting details to both users

### Requirement 7: Meeting Confirmation and Skill Swap Unlock

**User Story:** As a user who attended a coffee meeting, I want to confirm the meeting happened, so that we can proceed with our skill exchange.

#### Acceptance Criteria

1. WHEN a meeting is scheduled, THE System SHALL display a "Confirm Meeting Happened" button to both users
2. WHEN one user confirms the meeting, THE System SHALL show "Waiting for other confirmation" status
3. WHEN both users confirm the meeting happened, THE System SHALL mark the match as "verified"
4. WHEN a match is verified, THE System SHALL unlock skill swap functionality (display contact exchange option)
5. THE System SHALL track confirmation status independently for each user
6. WHEN a match is verified, THE System SHALL display a success message emphasizing the community connection made

### Requirement 8: Demo Data Seeding for Testing

**User Story:** As a judge/tester, I want to see the app populated with nearby users when I register, so that I can test the full matching and meeting flow.

#### Acceptance Criteria

1. WHEN the first user registers in demo mode, THE System SHALL seed the database with 5-8 fake user profiles
2. WHEN seeding fake users, THE System SHALL place them at random positions within 0.5-1.5 miles of the registering user's location
3. WHEN seeding fake users, THE System SHALL assign complementary skills to ensure matches are possible
4. THE System SHALL make demo mode configurable via environment variable
5. WHEN a real user registers, THE System SHALL be able to match with both seeded users and other real users

### Requirement 9: Progressive Web App Functionality

**User Story:** As a user, I want to install the app on my device and have it work reliably, so that I can access it like a native app.

#### Acceptance Criteria

1. THE System SHALL include a valid PWA manifest with app name, icons, and theme colors
2. THE System SHALL register a service worker for offline capability
3. WHEN a user visits the app, THE System SHALL prompt for "Add to Home Screen" on supported browsers
4. THE System SHALL cache essential assets for faster subsequent loads
5. THE System SHALL display appropriately on mobile and desktop screen sizes

### Requirement 10: Local Development and Easy Setup

**User Story:** As a hackathon judge, I want to clone the repo and run the app with minimal setup, so that I can evaluate the submission easily.

#### Acceptance Criteria

1. THE System SHALL run with a single `npm install` followed by `npm run dev` command
2. THE System SHALL use SQLite database requiring no external database setup
3. THE System SHALL not require any external API keys for core functionality
4. THE System SHALL include clear README instructions for local setup
5. WHEN the app starts, THE System SHALL automatically create the database schema if it doesn't exist
6. THE System SHALL work on localhost without HTTPS requirement for geolocation (development mode)
