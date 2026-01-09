# Design Document: Front Page & Site-Wide Improvements

## Overview

This design covers the transformation of SkillSwap from a functional app into a polished product with a professional public-facing presence. The implementation adds a compelling front page, consistent header/footer across all pages, legal pages (Privacy, Terms, Contact, Cookies), and cookie consent functionality—all while preserving existing authenticated functionality.

The architecture prioritizes:
- **Visual distinction** - Avoiding typical AI-generated landing page patterns
- **Brand consistency** - Using the established color palette throughout
- **PWA compatibility** - Maintaining service worker and offline capabilities
- **Responsive design** - Mobile-first approach with desktop enhancements
- **Minimal disruption** - Existing functionality remains unchanged

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Client (React PWA)                               │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Shared Components                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │    │
│  │  │ PublicHeader │  │    Footer    │  │   CookieConsent      │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      Public Pages                                │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ │    │
│  │  │FrontPage │ │ Privacy  │ │  Terms   │ │ Contact  │ │Cookies│ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   Auth Pages (Existing)                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐   │    │
│  │  │  Login   │ │ Register │ │ForgotPassword│ │ResetPassword │   │    │
│  │  └──────────┘ └──────────┘ └──────────────┘ └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │              Dashboard (Existing - Protected)                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │ Discover │ │ Matches  │ │ Profile  │ │ Meeting  │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Route Structure

```
/                    → FrontPage (public) OR redirect to /discover (authenticated)
/login               → Login (existing)
/register            → Register (existing)
/forgot-password     → ForgotPassword (existing)
/reset-password      → ResetPassword (existing)
/privacy             → Privacy Policy (public)
/terms               → Terms of Service (public)
/contact             → Contact (public)
/cookies             → Cookie Policy (public)
/discover            → Discover (protected - dashboard)
/matches             → Matches (protected)
/profile             → Profile (protected)
/meeting/:matchId    → Meeting (protected)
```

## Components and Interfaces

### New Shared Components

#### PublicHeader

A header component for public pages (different from the authenticated Layout header).

```jsx
interface PublicHeaderProps {
  showLoginButton?: boolean;  // Default true
}

// Features:
// - Logo + "SkillSwap" text (links to "/")
// - "Login" button on right (when not authenticated)
// - Responsive: hamburger menu on mobile for legal links
// - Uses dark brand color (#1A1A2E) background
```

#### Footer

A consistent footer for all pages.

```jsx
interface FooterProps {
  // No props needed - self-contained
}

// Features:
// - Links: Privacy Policy, Terms of Service, Contact, Cookie Policy
// - Copyright notice with dynamic year
// - Responsive: stacked on mobile, inline on desktop
// - Uses dark brand color background
```

#### CookieConsent

A banner component for cookie consent.

```jsx
interface CookieConsentProps {
  // No props needed - manages own state via localStorage
}

// Features:
// - Appears at bottom of screen on first visit
// - "Accept" and "Decline" buttons
// - Link to Cookie Policy
// - Stores preference in localStorage ('cookieConsent')
// - Non-intrusive but visible design
```

#### PublicLayout

A layout wrapper for public pages (FrontPage, legal pages).

```jsx
interface PublicLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;  // Default true
}

// Features:
// - Includes PublicHeader
// - Includes Footer (optional)
// - Includes CookieConsent
// - Handles authenticated user redirect for FrontPage
```

### New Page Components

#### FrontPage

The main landing page - the face of SkillSwap.

```jsx
// Sections:
// 1. Hero Section
//    - Compelling headline emphasizing human connection
//    - Subheadline about skill exchange
//    - "Get Started" CTA button (→ /register)
//    - "Sign In" secondary link (→ /login)
//    - Background: gradient or subtle pattern using brand colors

// 2. How It Works Section
//    - 4 steps with icons:
//      1. Create Profile - Add your skills
//      2. Find Neighbors - Discover matches nearby
//      3. Meet for Coffee - The mandatory social step
//      4. Exchange Skills - Help each other grow
//    - Visual: numbered cards or timeline

// 3. The Coffee Meeting Section (Unique Differentiator)
//    - Emphasize this is NOT optional
//    - Explain the triple-solve: verification, safety, connection
//    - Quote or testimonial-style callout
//    - Visual: coffee cup icon or illustration

// 4. Features/Benefits Section
//    - 3-4 key benefits with icons:
//      - Local Community (within 2 miles)
//      - Mutual Matching (both must agree)
//      - Verified Connections (meet in person)
//      - Free Forever (no hidden costs)

// 5. Final CTA Section
//    - "Ready to meet your neighbors?"
//    - Large "Get Started" button
```

#### Privacy Page

```jsx
// Sections:
// - Introduction
// - Information We Collect
// - How We Use Your Information
// - Data Storage and Security
// - Your Rights
// - Contact Us
// - Last Updated date
```

#### Terms Page

```jsx
// Sections:
// - Acceptance of Terms
// - Description of Service
// - User Responsibilities
// - Prohibited Activities
// - Limitation of Liability
// - Modifications to Terms
// - Contact Information
// - Last Updated date
```

#### Contact Page

```jsx
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Features:
// - Form with validation
// - Success message on submit (client-side only for MVP)
// - No backend endpoint needed (display success message)
```

#### Cookies Page

```jsx
// Sections:
// - What Are Cookies
// - Types of Cookies We Use
// - How to Manage Cookies
// - Changes to This Policy
// - Contact Us
```

## Data Models

### Cookie Consent Storage

```typescript
// localStorage key: 'skillswap_cookie_consent'
interface CookieConsentData {
  accepted: boolean;
  timestamp: string;  // ISO date string
}
```

### Contact Form (Client-Side Only)

```typescript
interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  submitted: boolean;
  errors: {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };
}
```

## Visual Design Specifications

### Front Page Design Philosophy

To avoid typical AI-generated landing page patterns, the design will:

1. **Asymmetric layouts** - Not everything centered, use offset grids
2. **Bold typography hierarchy** - Large headlines, varied weights
3. **Subtle animations** - Micro-interactions on scroll, not flashy
4. **Authentic imagery approach** - Icons and illustrations, not stock photos
5. **Whitespace as design element** - Generous spacing, not cramped
6. **Brand color accents** - Primary blue for CTAs, warm peach for highlights

### Color Usage

```
Hero Section:
- Background: Gradient from dark (#1A1A2E) to primary-dark (#2A4BC7)
- Text: White
- CTA Button: Accent (#E8C9A0) with dark text

How It Works:
- Background: Light (#F5F5F5)
- Cards: White with subtle shadow
- Icons: Primary (#3B5FE8)
- Numbers: Secondary (#9B7FD4)

Coffee Meeting Section:
- Background: Accent-light (#F0DCC0)
- Text: Dark (#1A1A2E)
- Highlight: Primary (#3B5FE8)

Features Section:
- Background: White
- Icons: Primary (#3B5FE8)
- Text: Dark (#1A1A2E)

Final CTA:
- Background: Primary (#3B5FE8)
- Text: White
- Button: White with primary text
```

### Responsive Breakpoints

```
Mobile: < 640px (sm)
Tablet: 640px - 1024px (md)
Desktop: > 1024px (lg)
```

### Typography Scale

```
Hero Headline: text-4xl md:text-5xl lg:text-6xl font-bold
Hero Subheadline: text-lg md:text-xl text-gray-300
Section Titles: text-2xl md:text-3xl font-bold
Body Text: text-base md:text-lg
Small Text: text-sm
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Layout Consistency Across Pages

*For any* page in the application (public or authenticated), the page SHALL render with a header containing the SkillSwap logo and name, and a footer containing links to Privacy, Terms, Contact, and Cookies pages.

**Validates: Requirements 2.1, 3.1, 3.2**

### Property 2: Cookie Consent Round-Trip

*For any* user interaction with the cookie consent banner (Accept or Decline), the preference SHALL be stored in localStorage, the banner SHALL be hidden, and on subsequent page loads the banner SHALL NOT be displayed.

**Validates: Requirements 8.3, 8.4, 8.5, 8.6**

### Property 3: Contact Form Validation

*For any* contact form submission with invalid data (empty required fields, invalid email format), the system SHALL display appropriate validation error messages and NOT show the success message.

**Validates: Requirements 6.4**

## Error Handling

### Client-Side Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| Form validation | Display inline field errors with specific messages |
| Navigation errors | Fallback to front page |
| localStorage unavailable | Gracefully degrade (show consent banner each time) |

### Form Validation Rules

**Contact Form:**
- Name: Required, minimum 2 characters
- Email: Required, valid email format
- Subject: Required, minimum 5 characters
- Message: Required, minimum 10 characters

### Graceful Degradation

- If localStorage is unavailable, cookie consent banner shows on every visit
- If JavaScript fails to load, static content remains visible
- If images fail to load, alt text provides context

## Testing Strategy

### Dual Testing Approach

This feature uses both unit tests and property-based tests:

- **Unit tests**: Verify specific UI elements, routing, and form behavior
- **Property tests**: Verify universal properties across all pages

### Testing Framework

- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **Property Testing**: fast-check

### Property-Based Test Configuration

```javascript
// Each property test runs minimum 100 iterations
fc.assert(
  fc.property(
    fc.constantFrom('/privacy', '/terms', '/contact', '/cookies', '/'),
    (route) => {
      // Property assertion for layout consistency
    }
  ),
  { numRuns: 100 }
);
```

### Test Organization

```
tests/
├── properties/
│   └── front-page.property.js    # Properties 1-3
└── unit/
    ├── FrontPage.test.js         # Front page component tests
    ├── CookieConsent.test.js     # Cookie consent tests
    └── Contact.test.js           # Contact form tests
```

### Test Tagging Convention

Each property test must be tagged with its design document reference:

```javascript
// Feature: front-page-site-wide, Property 1: Layout Consistency Across Pages
// Validates: Requirements 2.1, 3.1, 3.2
test.prop('layout consistency', [...generators], (inputs) => {
  // test implementation
});
```

### Coverage Goals

- **Property tests**: Cover all 3 correctness properties
- **Unit tests**: Cover all new components and pages
- **Integration tests**: Verify navigation flows work correctly

### Running Tests

```bash
npm test                          # Run all tests
npm test -- --run front-page      # Front page tests only
```

## Implementation Notes

### File Structure

```
client/src/
├── components/
│   ├── PublicHeader.jsx          # New: Header for public pages
│   ├── Footer.jsx                # New: Site-wide footer
│   ├── CookieConsent.jsx         # New: Cookie consent banner
│   ├── PublicLayout.jsx          # New: Layout wrapper for public pages
│   └── Layout.jsx                # Existing: Updated to include footer
├── pages/
│   ├── FrontPage.jsx             # New: Landing page
│   ├── Privacy.jsx               # New: Privacy policy
│   ├── Terms.jsx                 # New: Terms of service
│   ├── Contact.jsx               # New: Contact form
│   ├── Cookies.jsx               # New: Cookie policy
│   └── ... (existing pages)
└── App.jsx                       # Updated: New routes
```

### Route Updates in App.jsx

```jsx
// New public routes (no auth required)
<Route path="/" element={<ConditionalHome />} />
<Route path="/privacy" element={<PublicLayout><Privacy /></PublicLayout>} />
<Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />
<Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
<Route path="/cookies" element={<PublicLayout><Cookies /></PublicLayout>} />

// ConditionalHome component:
// - If authenticated → redirect to /discover
// - If not authenticated → render FrontPage
```

### Preserving Existing Functionality

The implementation must:
1. Keep all existing routes functional
2. Keep existing Layout.jsx for authenticated pages (add footer)
3. Keep existing auth flow unchanged
4. Keep existing dashboard functionality unchanged
5. Keep PWA service worker and manifest working
