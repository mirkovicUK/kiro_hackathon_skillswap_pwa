# Design Document: Password Reset

## Overview

This feature adds a simplified password reset flow for the hackathon demo. Users can reset their password by verifying their email exists, then setting a new password directly. No email tokens are used (would require email service).

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React)                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │ Login Page  │───▶│ ForgotPwd   │───▶│ ResetPwd    │ │
│  │ + link      │    │ (email)     │    │ (new pwd)   │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                    Server (Express)                      │
│  POST /api/auth/verify-email  - Check email exists       │
│  POST /api/auth/reset-password - Update password         │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### API Endpoints

#### POST /api/auth/verify-email
Verify that an email exists in the system.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "exists": true,
  "userId": 123
}
```

**Response (404):**
```json
{
  "error": "not_found",
  "message": "Email not found"
}
```

#### POST /api/auth/reset-password
Reset password for a verified user.

**Request:**
```json
{
  "email": "user@example.com",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Response (400):**
```json
{
  "error": "validation_error",
  "message": "Password must be at least 8 characters"
}
```

### AuthService (Enhanced)

```javascript
class AuthService {
  // Existing methods...
  
  // New methods for password reset
  static verifyEmail(email) {
    // Check if email exists in database
    // Return user ID if found, null if not
  }
  
  static async resetPassword(email, newPassword) {
    // Validate password length
    // Hash new password with bcrypt
    // Update user's password_hash in database
  }
}
```

### React Components

#### ForgotPassword.jsx
- Email input form
- "Verify Email" button
- Error/success messages
- Link back to login

#### ResetPassword.jsx
- New password input
- Confirm password input
- "Reset Password" button
- Validation feedback
- Redirect to login on success

## Data Models

No new database tables needed. Uses existing `users` table:

```sql
users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,  -- Updated by reset
  ...
)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.*

### Property 1: Email Verification Accuracy

*For any* email address, the verify-email endpoint SHALL return `exists: true` if and only if a user with that email exists in the database.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Password Length Validation

*For any* password string, the reset-password endpoint SHALL reject passwords with fewer than 8 characters and accept passwords with 8 or more characters.

**Validates: Requirements 2.2, 2.5**

### Property 3: Password Confirmation Matching

*For any* two password strings submitted as newPassword and confirmPassword, the reset-password endpoint SHALL reject the request if they do not match exactly.

**Validates: Requirements 2.3, 2.4**

### Property 4: Password Reset Round-Trip

*For any* valid email and new password (≥8 chars), after calling reset-password, logging in with the new password SHALL succeed, and logging in with the old password SHALL fail.

**Validates: Requirements 3.1, 3.2**

### Property 5: Password Hash Security

*For any* password reset operation, the stored password_hash SHALL be a valid bcrypt hash (starting with "$2a$" or "$2b$") and SHALL NOT equal the plain text password.

**Validates: Requirements 3.1**

## Error Handling

| Error | HTTP Status | Response |
|-------|-------------|----------|
| Email not found | 404 | `{ error: "not_found", message: "Email not found" }` |
| Password too short | 400 | `{ error: "validation_error", message: "Password must be at least 8 characters" }` |
| Passwords don't match | 400 | `{ error: "validation_error", message: "Passwords do not match" }` |
| Server error | 500 | `{ error: "server_error", message: "Failed to reset password" }` |

## Testing Strategy

### Property-Based Tests

Using fast-check with minimum 100 iterations:

1. **Email Verification**: Generate random emails, verify response matches database state
2. **Password Length**: Generate passwords of various lengths, verify validation
3. **Password Matching**: Generate password pairs, verify matching logic
4. **Reset Round-Trip**: Register user, reset password, verify login works with new password
5. **Hash Security**: Reset password, verify stored hash is bcrypt format

### Unit Tests

- Edge case: Empty email
- Edge case: Invalid email format
- Edge case: Empty password
- Edge case: Password exactly 8 characters (boundary)
- Integration: Full reset flow
