# Project Structure

## Directory Layout

```
skillswap/
├── client/                     # React PWA frontend
│   ├── public/
│   │   ├── manifest.json       # PWA manifest
│   │   └── coffee.svg          # App icon (scalable SVG)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── SkillSelector.jsx
│   │   │   ├── MatchCard.jsx
│   │   │   └── Layout.jsx
│   │   ├── pages/              # Route-level components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Discover.jsx
│   │   │   ├── Matches.jsx
│   │   │   └── Meeting.jsx
│   │   ├── context/            # React context providers
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx             # Root component with routing
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Tailwind imports
│   └── index.html              # HTML template
│
├── server/                     # Express.js backend
│   ├── routes/                 # API route handlers
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── matches.js
│   │   └── meetings.js
│   ├── services/               # Business logic
│   │   ├── AuthService.js
│   │   ├── MatchService.js
│   │   ├── MeetingService.js
│   │   ├── GeoService.js
│   │   └── SeedService.js
│   ├── middleware/             # Express middleware
│   │   └── auth.js             # JWT verification
│   ├── data/
│   │   └── skills.json         # Predefined skills list
│   ├── db.js                   # SQLite setup and migrations
│   └── index.js                # Server entry point
│
├── tests/                      # Test files
│   └── properties/             # Property-based tests (18 core properties)
│       ├── auth.property.js
│       ├── skills.property.js
│       ├── geo.property.js
│       ├── matching.property.js
│       ├── interest.property.js
│       ├── meeting.property.js
│       └── seeding.property.js
│
├── .kiro/                      # Kiro configuration
│   ├── steering/               # Project knowledge (7 files)
│   │   ├── product.md
│   │   ├── tech.md
│   │   ├── structure.md
│   │   ├── testing.md
│   │   ├── brand-colors.md
│   │   ├── data-schema.md
│   │   └── kiro-cli-reference.md
│   ├── prompts/                # Custom Kiro prompts (13 prompts)
│   ├── agents/                 # Custom agents
│   │   └── skillswap-dev.json
│   ├── hooks/                  # Automation hooks
│   └── specs/                  # Feature specifications (3 specs)
│       ├── skillswap-pwa/      # Core MVP spec (18 properties)
│       ├── dynamic-demo-seeding/ # Enhanced seeding spec (9 properties)
│       └── password-reset/     # Account recovery spec (5 properties)
│
├── package.json                # Monorepo package config
├── vite.config.js              # Vite configuration
├── vitest.config.js            # Vitest test configuration
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── README.md                   # Project documentation
├── DEVLOG.md                   # Development log
├── .env                        # Environment variables (not committed)
├── .env.example                # Environment template (committed)
└── database.sqlite             # SQLite database (auto-created, gitignored)
```

## File Naming Conventions

**JavaScript Files:**
- React components: `PascalCase.jsx` (e.g., `MatchCard.jsx`)
- Utilities/services: `camelCase.js` (e.g., `AuthService.js`)
- Route handlers: `camelCase.js` (e.g., `matches.js`)
- Test files: `*.test.js` or `*.property.js`

**Directories:**
- All lowercase, plural for collections (e.g., `components/`, `routes/`)
- Singular for specific features (e.g., `context/`)

**Assets:**
- Icons: `icon-{size}.png` (e.g., `icon-192.png`)
- Images: `kebab-case.png`

## Module Organization

**Frontend (client/src/):**
- `pages/` - One file per route, handles data fetching and layout
- `components/` - Reusable UI pieces, receive data via props
- `context/` - Global state (auth, user data)
- `hooks/` - Custom hooks for shared logic
- `utils/` - Pure functions, API client

**Backend (server/):**
- `routes/` - HTTP handlers, request/response only
- `services/` - Business logic, database operations
- `middleware/` - Request processing (auth, validation)
- `data/` - Static data files (skills list)

**Separation of Concerns:**
- Routes call services, never access DB directly
- Services contain all business logic
- Components are presentational, pages handle data

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, project metadata |
| `vite.config.js` | Vite bundler configuration |
| `tailwind.config.js` | Tailwind CSS customization |
| `.env` | Environment variables (not committed) |
| `.env.example` | Environment template (committed) |
| `jsconfig.json` | JavaScript/IDE configuration |

## Documentation Structure

```
/
├── README.md           # Main project documentation
│                       # - Setup instructions
│                       # - Architecture overview
│                       # - Testing guide for judges
│
├── DEVLOG.md           # Development timeline
│                       # - Single-day sprint progress
│                       # - Technical decisions
│                       # - Kiro CLI usage stats
│
└── .kiro/
    ├── steering/       # Persistent project knowledge (7 files)
    │   ├── product.md      # Product overview, goals, users
    │   ├── tech.md         # Technology stack, architecture
    │   ├── structure.md    # File organization
    │   ├── testing.md      # Testing methodology
    │   ├── brand-colors.md # Brand colors for Tailwind CSS
    │   ├── data-schema.md  # Database schema and relationships
    │   └── kiro-cli-reference.md  # Kiro feature reference
    ├── prompts/        # Custom prompts (13 prompts)
    ├── agents/         # Custom agents (skillswap-dev)
    └── specs/          # Feature specifications (3 specs, 32 properties)
        ├── skillswap-pwa/          # Core MVP (18 properties)
        ├── dynamic-demo-seeding/   # Enhanced seeding (9 properties)
        └── password-reset/         # Account recovery (5 properties)
```

## Asset Organization

**Logo (root):**
- `SkillSwap_logo.png` - Official app logo (500x500px)

**Icons (client/public/):**
- `SkillSwap_logo.png` - PWA icon (copied from root)
- `coffee.svg` - Legacy icon (deprecated)

**Styles:**
- No separate CSS files
- Tailwind utilities in JSX
- Global styles in `client/src/index.css` (Tailwind imports only)

## Build Artifacts

**Development:**
- No build step required
- Vite serves files directly with HMR

**Production Build:**
```
dist/
├── client/             # Built React app
│   ├── index.html
│   └── assets/
│       ├── index-[hash].js
│       └── index-[hash].css
└── (server runs from source)
```

**Database:**
- `database.sqlite` - Created automatically on first run
- `test-database.sqlite` - Used by Vitest tests only
- Located in project root
- Gitignored (not committed)

## Environment-Specific Files

**Development (.env):**
```
DEMO_MODE=true
JWT_SECRET=dev-secret-change-in-prod
PORT=3001
NODE_ENV=development
```

**Production (.env.production):**
```
DEMO_MODE=false
JWT_SECRET=<secure-random-string>
PORT=3001
NODE_ENV=production
```

**For Hackathon:**
- Only development environment needed
- `.env.example` provided for judges
- `DEMO_MODE=true` enables automatic demo data seeding
