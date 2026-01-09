# Requirements Document

## Introduction

This spec covers the creation of a professional public-facing front page for SkillSwap, along with site-wide improvements including a consistent header across all pages, a professional footer with legal pages, and cookie consent functionality. The goal is to transform SkillSwap from a functional app into a polished product that makes a strong first impression and builds trust with potential users.

The front page is the face of SkillSwap—it must be innovative, visually distinctive (not typical AI-generated design), and compelling enough to make visitors want to try the product. The current login page becomes the login route, and authenticated functionality becomes the user dashboard.

## Glossary

- **Front_Page**: The public landing page at "/" that introduces SkillSwap to visitors
- **Header**: A consistent navigation bar across all pages with logo, app name, and login link
- **Footer**: A consistent footer across all pages with links to legal pages
- **Cookie_Consent**: A banner/modal asking users to accept cookies on first visit
- **Legal_Pages**: Privacy Policy, Terms of Service, Contact, and Cookie Policy pages
- **User_Dashboard**: The authenticated area (Discover, Matches, Profile, Meeting pages)
- **Public_Pages**: Pages accessible without authentication (Front Page, Login, Register, Legal Pages)

## Requirements

### Requirement 1: Public Front Page

**User Story:** As a visitor, I want to see an innovative and professional landing page, so that I understand what SkillSwap offers and feel compelled to sign up.

#### Acceptance Criteria

1. WHEN a visitor navigates to the root URL ("/"), THE System SHALL display the public front page (not redirect to login)
2. THE Front_Page SHALL include a hero section with a compelling headline, subheadline, and call-to-action button
3. THE Front_Page SHALL include a "How It Works" section explaining the skill swap process in 3-4 steps
4. THE Front_Page SHALL include a features/benefits section highlighting key value propositions
5. THE Front_Page SHALL include a section emphasizing the mandatory coffee meeting as the unique differentiator
6. THE Front_Page SHALL use the brand color palette (primary, secondary, accent colors) consistently
7. THE Front_Page SHALL be visually distinctive and innovative, avoiding typical AI-generated landing page patterns
8. THE Front_Page SHALL be fully responsive across mobile, tablet, and desktop screen sizes
9. THE Front_Page SHALL include prominent "Get Started" and "Sign In" call-to-action buttons

### Requirement 2: Site-Wide Header

**User Story:** As a user, I want a consistent header across all pages, so that I can easily navigate and identify the app.

#### Acceptance Criteria

1. THE Header SHALL be displayed on all pages (public and authenticated)
2. THE Header SHALL include the SkillSwap logo (clickable, navigates to front page)
3. THE Header SHALL include the app name "SkillSwap" (clickable, navigates to front page)
4. WHEN a user is not authenticated, THE Header SHALL display a "Login" link on the right side
5. WHEN a user is authenticated, THE Header SHALL display the user's name and a "Logout" button
6. THE Header SHALL be responsive, adapting layout for mobile and desktop views
7. THE Header SHALL use the dark brand color (#1A1A2E) as background

### Requirement 3: Site-Wide Footer

**User Story:** As a user, I want a professional footer with legal links, so that I can access important information and trust the platform.

#### Acceptance Criteria

1. THE Footer SHALL be displayed on all pages (public and authenticated)
2. THE Footer SHALL include links to: Privacy Policy, Terms of Service, Contact, and Cookie Policy pages
3. THE Footer SHALL include a copyright notice with the current year
4. THE Footer SHALL be responsive, adapting layout for mobile and desktop views
5. THE Footer SHALL use appropriate brand colors and maintain visual consistency

### Requirement 4: Privacy Policy Page

**User Story:** As a user, I want to read the privacy policy, so that I understand how my data is handled.

#### Acceptance Criteria

1. WHEN a user navigates to "/privacy", THE System SHALL display the Privacy Policy page
2. THE Privacy_Policy page SHALL include sections covering: data collection, data usage, data storage, user rights, and contact information
3. THE Privacy_Policy page SHALL be accessible without authentication
4. THE Privacy_Policy page SHALL use the site-wide header and footer

### Requirement 5: Terms of Service Page

**User Story:** As a user, I want to read the terms of service, so that I understand the rules of using the platform.

#### Acceptance Criteria

1. WHEN a user navigates to "/terms", THE System SHALL display the Terms of Service page
2. THE Terms_of_Service page SHALL include sections covering: acceptance of terms, user responsibilities, prohibited activities, limitation of liability, and modifications
3. THE Terms_of_Service page SHALL be accessible without authentication
4. THE Terms_of_Service page SHALL use the site-wide header and footer

### Requirement 6: Contact Page

**User Story:** As a user, I want to contact the SkillSwap team, so that I can ask questions or report issues.

#### Acceptance Criteria

1. WHEN a user navigates to "/contact", THE System SHALL display the Contact page
2. THE Contact page SHALL include a contact form with fields: name, email, subject, and message
3. WHEN a user submits the contact form with valid data, THE System SHALL display a success message
4. IF a user submits the contact form with invalid data, THEN THE System SHALL display validation errors
5. THE Contact page SHALL be accessible without authentication
6. THE Contact page SHALL use the site-wide header and footer

### Requirement 7: Cookie Policy Page

**User Story:** As a user, I want to read the cookie policy, so that I understand how cookies are used.

#### Acceptance Criteria

1. WHEN a user navigates to "/cookies", THE System SHALL display the Cookie Policy page
2. THE Cookie_Policy page SHALL include sections covering: what cookies are, types of cookies used, how to manage cookies, and contact information
3. THE Cookie_Policy page SHALL be accessible without authentication
4. THE Cookie_Policy page SHALL use the site-wide header and footer

### Requirement 8: Cookie Consent Banner

**User Story:** As a visitor, I want to be informed about cookie usage, so that I can make an informed decision about my privacy.

#### Acceptance Criteria

1. WHEN a visitor loads any page for the first time, THE System SHALL display a cookie consent banner
2. THE Cookie_Consent banner SHALL include a brief message about cookie usage and links to the Cookie Policy
3. WHEN a visitor clicks "Accept", THE System SHALL store the consent preference and hide the banner
4. WHEN a visitor clicks "Decline", THE System SHALL store the preference and hide the banner
5. THE System SHALL remember the consent preference using localStorage
6. IF consent has already been given or declined, THEN THE System SHALL NOT display the banner on subsequent visits
7. THE Cookie_Consent banner SHALL be non-intrusive but visible, positioned at the bottom of the screen

### Requirement 9: Responsive Design and PWA Compatibility

**User Story:** As a user, I want the new pages to work well on all devices and maintain PWA functionality, so that I have a consistent experience.

#### Acceptance Criteria

1. THE Front_Page and all new pages SHALL be fully responsive (mobile, tablet, desktop)
2. THE new pages SHALL maintain PWA compatibility (service worker, manifest)
3. THE new pages SHALL follow the existing Tailwind CSS patterns and brand colors
4. THE new pages SHALL load quickly and not significantly impact performance
5. THE new pages SHALL be accessible (proper heading hierarchy, alt text, keyboard navigation)

### Requirement 10: Navigation Flow Updates

**User Story:** As a user, I want clear navigation between public and authenticated areas, so that I can easily find what I need.

#### Acceptance Criteria

1. WHEN an unauthenticated user clicks "Get Started" on the front page, THE System SHALL navigate to the registration page
2. WHEN an unauthenticated user clicks "Sign In" on the front page or header, THE System SHALL navigate to the login page
3. WHEN an authenticated user navigates to the root URL ("/"), THE System SHALL redirect to the dashboard ("/discover")
4. WHEN an authenticated user clicks the logo or app name in the header, THE System SHALL navigate to the dashboard
5. THE existing authenticated routes (profile, discover, matches, meeting) SHALL continue to function as before
6. THE existing authentication flow (login, register, forgot password, reset password) SHALL continue to function as before
