# Implementation Plan: Front Page & Site-Wide Improvements

## Overview

This implementation transforms SkillSwap from a functional app into a polished product with a professional public-facing presence. The approach prioritizes preserving existing functionality while adding new components incrementally.

## Tasks

- [ ] 1. Create shared layout components
  - [ ] 1.1 Create Footer component
    - Create `client/src/components/Footer.jsx`
    - Include links to Privacy, Terms, Contact, Cookies
    - Include copyright notice with dynamic year
    - Use dark brand color background
    - Make responsive (stacked mobile, inline desktop)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 1.2 Create PublicHeader component
    - Create `client/src/components/PublicHeader.jsx`
    - Include SkillSwap logo (clickable → "/")
    - Include app name "SkillSwap" (clickable → "/")
    - Show "Login" button when not authenticated
    - Use dark brand color (#1A1A2E) background
    - Make responsive for mobile/desktop
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

  - [ ] 1.3 Create CookieConsent component
    - Create `client/src/components/CookieConsent.jsx`
    - Display banner at bottom of screen
    - Include message about cookies and link to Cookie Policy
    - "Accept" and "Decline" buttons
    - Store preference in localStorage ('skillswap_cookie_consent')
    - Hide banner after consent given
    - Check localStorage on mount, don't show if already consented
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 1.4 Create PublicLayout component
    - Create `client/src/components/PublicLayout.jsx`
    - Wrap children with PublicHeader and Footer
    - Include CookieConsent component
    - _Requirements: 2.1, 3.1_

- [ ] 2. Checkpoint - Verify shared components render correctly
  - Ensure all shared components render without errors
  - Ask the user if questions arise

- [ ] 3. Create legal pages
  - [ ] 3.1 Create Privacy Policy page
    - Create `client/src/pages/Privacy.jsx`
    - Include sections: data collection, usage, storage, rights, contact
    - Use PublicLayout wrapper
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 3.2 Create Terms of Service page
    - Create `client/src/pages/Terms.jsx`
    - Include sections: acceptance, responsibilities, prohibited, liability, modifications
    - Use PublicLayout wrapper
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 3.3 Create Cookie Policy page
    - Create `client/src/pages/Cookies.jsx`
    - Include sections: what cookies are, types used, how to manage, contact
    - Use PublicLayout wrapper
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 3.4 Create Contact page with form
    - Create `client/src/pages/Contact.jsx`
    - Include form with: name, email, subject, message fields
    - Add client-side validation
    - Show success message on valid submission
    - Show validation errors on invalid submission
    - Use PublicLayout wrapper
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 4. Checkpoint - Verify legal pages render correctly
  - Ensure all legal pages render without errors
  - Verify header and footer appear on each page
  - Ask the user if questions arise

- [ ] 5. Create Front Page
  - [ ] 5.1 Create FrontPage component structure
    - Create `client/src/pages/FrontPage.jsx`
    - Set up section structure: Hero, How It Works, Coffee Meeting, Features, Final CTA
    - Use PublicLayout wrapper
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 5.2 Implement Hero section
    - Add compelling headline about human connection
    - Add subheadline about skill exchange
    - Add "Get Started" CTA button (→ /register)
    - Add "Sign In" link (→ /login)
    - Use gradient background (dark to primary-dark)
    - _Requirements: 1.2, 1.9_

  - [ ] 5.3 Implement How It Works section
    - Add 4 steps with icons: Create Profile, Find Neighbors, Meet for Coffee, Exchange Skills
    - Use numbered cards or timeline visual
    - Light background (#F5F5F5)
    - _Requirements: 1.3_

  - [ ] 5.4 Implement Coffee Meeting section
    - Emphasize mandatory nature of coffee meeting
    - Explain triple-solve: verification, safety, connection
    - Add quote or testimonial-style callout
    - Use accent-light background (#F0DCC0)
    - _Requirements: 1.5_

  - [ ] 5.5 Implement Features section
    - Add 3-4 key benefits with icons
    - Local Community, Mutual Matching, Verified Connections, Free Forever
    - White background
    - _Requirements: 1.4_

  - [ ] 5.6 Implement Final CTA section
    - Add "Ready to meet your neighbors?" headline
    - Add large "Get Started" button
    - Primary background with white text
    - _Requirements: 1.9_

- [ ] 6. Checkpoint - Verify Front Page renders correctly
  - Ensure all sections render without errors
  - Verify responsive design on mobile/tablet/desktop
  - Ask the user if questions arise

- [ ] 7. Update routing and navigation
  - [ ] 7.1 Update App.jsx with new routes
    - Add routes for /privacy, /terms, /contact, /cookies
    - Create ConditionalHome component for "/" route
    - ConditionalHome: authenticated → redirect to /discover, else → FrontPage
    - Keep all existing routes functional
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_

  - [ ] 7.2 Update existing Layout.jsx
    - Add Footer component to authenticated layout
    - Update header logo/name click to navigate to /discover for authenticated users
    - _Requirements: 2.5, 3.1, 10.4_

  - [ ] 7.3 Update auth pages to use PublicLayout
    - Update Login.jsx to use PublicLayout (or just add Footer)
    - Update Register.jsx to use PublicLayout (or just add Footer)
    - Update ForgotPassword.jsx to use PublicLayout (or just add Footer)
    - Update ResetPassword.jsx to use PublicLayout (or just add Footer)
    - _Requirements: 2.1, 3.1_

- [ ] 8. Checkpoint - Verify navigation flows
  - Test "/" route for authenticated and unauthenticated users
  - Test all legal page routes
  - Test "Get Started" and "Sign In" buttons
  - Verify existing auth flow still works
  - Verify existing dashboard still works
  - Ask the user if questions arise

- [ ] 9. Write property tests
  - [ ] 9.1 Write property test for layout consistency
    - **Property 1: Layout Consistency Across Pages**
    - **Validates: Requirements 2.1, 3.1, 3.2**
    - Test that all pages render with header and footer

  - [ ] 9.2 Write property test for cookie consent round-trip
    - **Property 2: Cookie Consent Round-Trip**
    - **Validates: Requirements 8.3, 8.4, 8.5, 8.6**
    - Test accept/decline stores preference and hides banner

  - [ ] 9.3 Write property test for contact form validation
    - **Property 3: Contact Form Validation**
    - **Validates: Requirements 6.4**
    - Test invalid inputs show errors

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Run all existing tests to verify no regressions
  - Run new property tests
  - Verify PWA functionality still works
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- All existing functionality must be preserved throughout implementation
