# Implementation Plan: Password Reset

## Overview

Add password reset functionality with a two-step flow: verify email exists, then set new password. Simplified for hackathon demo (no email tokens).

## Tasks

- [x] 1. Add AuthService methods
  - [x] 1.1 Implement verifyEmail method
    - Check if email exists in database
    - Return user ID if found, null if not
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 1.2 Implement resetPassword method
    - Validate password length (min 8 chars)
    - Validate passwords match
    - Hash new password with bcrypt
    - Update password_hash in database
    - _Requirements: 2.2, 2.3, 3.1, 3.2_

- [x] 2. Add API endpoints
  - [x] 2.1 POST /api/auth/verify-email
    - Accept email in request body
    - Call AuthService.verifyEmail
    - Return exists status or 404 error
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 2.2 POST /api/auth/reset-password
    - Accept email, newPassword, confirmPassword
    - Validate inputs
    - Call AuthService.resetPassword
    - Return success or validation error
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [x] 3. Create React components
  - [x] 3.1 Create ForgotPassword.jsx page
    - Email input form
    - Verify email button
    - Error/success messages
    - Navigate to reset page on success
    - _Requirements: 1.1, 1.2_
  - [x] 3.2 Create ResetPassword.jsx page
    - New password input
    - Confirm password input
    - Client-side validation
    - Reset button
    - Redirect to login on success
    - _Requirements: 2.1, 3.3, 3.4_
  - [x] 3.3 Add "Forgot Password?" link to Login page
    - Link to ForgotPassword page
    - _Requirements: 1.1_

- [x] 4. Add routes to App.jsx
  - [x] 4.1 Add /forgot-password route
    - Route to ForgotPassword component
    - _Requirements: 1.1_
  - [x] 4.2 Add /reset-password route
    - Route to ResetPassword component
    - Pass email as state/param
    - _Requirements: 2.1_

- [x] 5. Write property tests
  - [x] 5.1 Property 1: Email Verification Accuracy
    - **Property 1: Email Verification Accuracy**
    - **Validates: Requirements 1.2, 1.3, 1.4**
  - [x] 5.2 Property 2: Password Length Validation
    - **Property 2: Password Length Validation**
    - **Validates: Requirements 2.2, 2.5**
  - [x] 5.3 Property 3: Password Confirmation Matching
    - **Property 3: Password Confirmation Matching**
    - **Validates: Requirements 2.3, 2.4**
  - [x] 5.4 Property 4: Password Reset Round-Trip
    - **Property 4: Password Reset Round-Trip**
    - **Validates: Requirements 3.1, 3.2**
  - [x] 5.5 Property 5: Password Hash Security
    - **Property 5: Password Hash Security**
    - **Validates: Requirements 3.1**

- [x] 6. Checkpoint - Test and verify
  - All 5 property tests passing
  - Full reset flow implemented and working

## Notes

- All tasks including property tests are required
- No email service needed - simplified flow for demo
- Password reset uses same bcrypt settings as registration (10 rounds)

## Implementation Summary

**Files Created/Modified:**
- `server/services/AuthService.js` - Added verifyEmail() and resetPassword() methods
- `server/routes/auth.js` - Added POST /api/auth/verify-email and POST /api/auth/reset-password endpoints
- `client/src/pages/ForgotPassword.jsx` - Email verification form
- `client/src/pages/ResetPassword.jsx` - New password form with validation
- `client/src/pages/Login.jsx` - Added "Forgot your password?" link
- `client/src/App.jsx` - Added /forgot-password and /reset-password routes
- `tests/properties/password-reset.property.js` - 5 property tests (all passing)
