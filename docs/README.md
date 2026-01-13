# SkillSwap ☕

**A neighborhood skill exchange PWA with a twist: mandatory coffee meetings before any swap.**

> The skill swap is the excuse. Human connection is the product.

## The Problem

In fast-paced cities, people:
- Have skills they could trade but don't know their neighbors
- Feel isolated despite living in populated areas
- Want to slow down but need a structured reason

## The Solution

SkillSwap connects neighbors within ~2 miles for skill exchanges, but requires an **in-person coffee meeting** before any transaction. This counter-intuitive "slow down" approach solves three problems simultaneously:

- ✅ **Verification** - Face-to-face meeting confirms identity
- ✅ **Safety** - Public meeting in neutral location  
- ✅ **Loneliness** - Structured social interaction people secretly want

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd skillswap

# Install dependencies
npm install

# Start the app (runs both client and server)
npm run dev
```

Open http://localhost:5173 in your browser.

## Prerequisites

- Node.js 18+
- npm 9+
- A modern browser with geolocation support

**No external API keys or database setup required.**

## Testing the App

### Quick Test (Single User)

1. Register an account and allow location access
2. 15-25 demo users will automatically appear nearby, covering all available skills
3. Express interest in a demo user match
4. Complete the coffee meeting flow (propose → accept → confirm)

### Full Test (Two Users - Recommended)

To test the complete mutual matching flow:

1. Open **two browser windows** (one regular, one incognito)
2. Register two accounts with complementary skills:
   - **User A**: Offers "Plumbing", Needs "Web Design"
   - **User B**: Offers "Web Design", Needs "Plumbing"
3. Both users should appear as matches to each other
4. Both users express interest → status becomes "mutual"
5. Either user proposes a coffee meeting (location, date, time)
6. Other user accepts the meeting
7. After meeting, both users click "Confirm Meeting Happened"
8. Skill swap is now unlocked! 🎉

## Architecture

```
┌─────────────────────────────────────────┐
│           Client (React PWA)            │
│  Vite + React + Tailwind CSS            │
└─────────────────┬───────────────────────┘
                  │ HTTP/JSON
┌─────────────────┴───────────────────────┐
│           Server (Express.js)           │
│  Auth, Matching, Meetings APIs          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│              SQLite Database            │
│  Zero-config, single file               │
└─────────────────────────────────────────┘
```

## Key Features

- **Professional Front Page**: Compelling landing page with hero, how it works, and CTAs
- **Skill Profiles**: List skills you offer and skills you need
- **Location-Based Discovery**: Find matches within ~2 miles (browser geolocation + Haversine formula)
- **Mutual Confirmation**: Both parties must confirm interest before proceeding
- **Chat Messaging**: Real-time chat between matched users (spec complete, implementation pending)
- **Coffee Scheduling**: Propose and agree on meeting time/place
- **Meeting Verification**: Both confirm meeting happened to unlock skill swap
- **Legal Pages**: Privacy Policy, Terms of Service, Cookie Policy, Contact form
- **Cookie Consent**: GDPR-compliant cookie consent banner
- **Password Reset**: Secure account recovery via email
- **PWA**: Installable on mobile devices with offline support

## Project Structure

```
├── client/                 # React PWA frontend
│   ├── src/
│   │   ├── pages/          # Route components
│   │   │   ├── FrontPage.jsx    # Landing page
│   │   │   ├── Privacy.jsx      # Privacy Policy
│   │   │   ├── Terms.jsx        # Terms of Service
│   │   │   ├── Cookies.jsx      # Cookie Policy
│   │   │   ├── Contact.jsx      # Contact form
│   │   │   └── ...              # App pages
│   │   ├── components/     # Reusable UI
│   │   │   ├── PublicHeader.jsx # Site-wide header
│   │   │   ├── Footer.jsx       # Site-wide footer
│   │   │   ├── CookieConsent.jsx # Cookie banner
│   │   │   └── ...
│   │   └── context/        # Auth state
│   └── public/             # PWA manifest, icons
├── server/                 # Express.js backend
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   └── data/               # Skills list
├── tests/                  # Test files
│   └── properties/         # Property-based tests
├── docs/                   # Documentation
│   ├── Architecture.md     # Technical architecture
│   └── Project.md          # Product philosophy
├── .kiro/                  # Kiro configuration
│   ├── specs/              # Feature specifications (4 specs)
│   ├── steering/           # Project knowledge (7 files)
│   └── prompts/            # Custom prompts
├── DEVLOG.md               # Development log
└── package.json            # Monorepo config
```

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | React + Vite | Fast builds, HMR, PWA support |
| Styling | Tailwind CSS | Rapid UI development |
| Backend | Express.js | Simple, familiar, good for MVP |
| Database | SQLite | Zero setup, single file |
| Geolocation | Browser API + Haversine | No external API keys |
| Testing | Vitest + fast-check | Property-based testing |
| Auth | JWT + bcrypt | Secure sessions and passwords |

## Kiro IDE Usage

This project was built using **Kiro IDE** with spec-driven development:

| Feature | Usage |
|---------|-------|
| **Spec Sessions** | 5 complete specs (requirements → design → tasks) |
| **Steering Documents** | 7 files providing persistent AI context |
| **Property Testing** | 45 correctness properties defined (35 tested, 10 pending) |
| **Custom Prompts** | Workflow-specific development commands |

### Specs Created
| Spec | Requirements | Properties | Status |
|------|--------------|------------|--------|
| SkillSwap PWA (Core) | 10 | 18 | ✅ Complete |
| Dynamic Demo Seeding | 5 | 9 | ✅ Complete |
| Password Reset | 4 | 5 | ✅ Complete |
| Front Page & Site-Wide | 10 | 3 | ✅ Complete |
| Chat Messaging | 10 | 10 | 📋 Spec Complete |

## Environment Variables

Create a `.env` file (optional - defaults work for local development):

```env
DEMO_MODE=true          # Seed demo users (default: true)
JWT_SECRET=dev-secret   # Token signing
PORT=3001               # Server port
```

## Available Scripts

```bash
npm run dev       # Start client + server
npm run server    # Server only
npm run client    # Client only
npm test          # Run all tests
npm run build     # Production build
```

## Troubleshooting

**Port conflicts / App not loading correctly?**

If Vite shows "Port 5173 is in use, trying another one..." and the app doesn't work properly on the new port (can't login/signup), you have zombie Node processes. Kill them and restart:

```bash
# Linux/Mac: Kill all Node processes
pkill -f node

# Or kill specific ports
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Windows: Kill Node processes
taskkill /F /IM node.exe

# Then restart
npm run dev
```

Also clear browser data for localhost:
1. Open DevTools (F12) → Application tab
2. Clear "Local Storage" 
3. Unregister Service Workers
4. Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

**Location not working?**
- Ensure you're on localhost (geolocation requires secure context)
- Check browser permissions for location access
- Try refreshing and allowing location again

**No matches appearing?**
- Verify DEMO_MODE=true in environment
- Check that you've added both "offer" and "need" skills
- Demo users (15-25) are seeded on first registration, covering all skills

**Database issues?**
- Delete `database.sqlite` and restart - it auto-recreates

## Innovation Highlights

🔄 **Counter-intuitive approach**: While every app tries to save time, we intentionally slow things down

☕ **Coffee meeting as product**: The meeting isn't a feature - it's the core value proposition

🔐 **Triple-solve**: One requirement (coffee meeting) solves verification, safety, AND loneliness

## License

MIT

---

Built with ☕ and [Kiro](https://kiro.dev) for the Dynamous Hackathon 2026
