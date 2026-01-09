# Requirements Document

## Introduction

This feature adds password reset functionality to SkillSwap. For the hackathon demo (no email service), we implement a simplified flow where users can reset their password by verifying their email exists in the system, then setting a new password directly.

## Glossary

- **Auth_Service**: The backend service handling authentication operations
- **Password_Hash**: Bcrypt-hashed password stored in database (never stored in plain text)
- **Reset_Flow**: The process of verifying identity and setting a new password

## Requirements

### Requirement 1: Password Reset Request

**User Story:** As a user who forgot my password, I want to request a password reset, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user clicks "Forgot Password" on the login page, THE System SHALL display a password reset form
2. WHEN a user enters their email address, THE Auth_Service SHALL verify the email exists in the database
3. IF the email does not exist, THEN THE Auth_Service SHALL return an error message "Email not found"
4. IF the email exists, THEN THE Auth_Service SHALL allow the user to proceed to set a new password

### Requirement 2: New Password Setting

**User Story:** As a user resetting my password, I want to set a new password, so that I can log in with updated credentials.

#### Acceptance Criteria

1. WHEN a user's email is verified, THE System SHALL display a new password form
2. WHEN a user enters a new password, THE Auth_Service SHALL validate minimum length (8 characters)
3. WHEN a user confirms the new password, THE Auth_Service SHALL verify both entries match
4. IF passwords do not match, THEN THE System SHALL display "Passwords do not match" error
5. IF password is too short, THEN THE System SHALL display "Password must be at least 8 characters" error

### Requirement 3: Password Update

**User Story:** As a user completing password reset, I want my new password saved securely, so that I can log in immediately.

#### Acceptance Criteria

1. WHEN a valid new password is submitted, THE Auth_Service SHALL hash the password using bcrypt
2. WHEN the password is hashed, THE Auth_Service SHALL update the user's password_hash in the database
3. WHEN the password is updated, THE System SHALL display a success message
4. WHEN the password is updated, THE System SHALL redirect the user to the login page

### Requirement 4: Security Considerations

**User Story:** As a system administrator, I want password reset to be secure, so that accounts are protected.

#### Acceptance Criteria

1. THE Auth_Service SHALL NOT reveal whether an email exists to prevent enumeration attacks (for production - relaxed for demo)
2. THE Auth_Service SHALL rate-limit password reset attempts to prevent abuse
3. THE System SHALL log password reset events for audit purposes
