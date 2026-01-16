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
cd kiro_hackathon_skillswap_pwa

# Install dependencies
npm install
```

### ⚠️ Before Starting - Clear Ports

| Service | Port |
|---------|------|
| Frontend (Vite) | 5173 |
| Backend (Express) | 3001 |

If Vite shows "Port 5173 is in use", kill zombie processes first:

```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Windows
taskkill /F /IM node.exe
```

### Start the App

```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
VITE ready in XXms
➜ Local: http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

## Prerequisites

- Node.js 18+
- npm 9+
- A modern browser with geolocation support

**No external API keys or database setup required.**

## Testing the App

### Quick Test (Single User + Demo Users)

1. Click **"Get Started Free"** on the front page
2. Register with any email/password (min 8 chars)
3. You'll land on the **Profile** page
4. **Set your location** (click "Auto-detect" or enter coordinates manually)
5. **Add skills:**
   - Offer: Pick any skill (e.g., "Plumbing")
   - Need: Pick any skill (e.g., "Web Design")
6. Click **"Save Profile"**
7. Navigate to **Discover** (via sidebar/nav)
8. See 15-25 demo users nearby with complementary skills
9. Click **"I'm Interested"** on a match
10. Demo user auto-responds → Go to **Matches** tab
11. Click **"Schedule Coffee Meeting"** → Propose location/date/time
12. Demo user auto-accepts → Click **"Confirm Meeting Happened"**
13. ✅ Skill swap unlocked!

### Full Test (Two Real Users - Recommended)

To test the complete mutual matching flow:

1. Open **two browser windows** (one regular, one incognito)
2. Register two accounts and complete profiles:
   - **User A**: Offers "Plumbing", Needs "Web Design", set location
   - **User B**: Offers "Web Design", Needs "Plumbing", set same/nearby location
3. Both users go to **Discover** → See each other as matches
4. Both users click **"I'm Interested"** → Check **Matches** tab
5. Status becomes **"Mutual"** - both appear in each other's Matches
6. User A clicks **"Schedule Coffee Meeting"** → Proposes location/date/time
7. User B goes to **Matches** → **"View Meeting Details"** → Clicks **"Accept"**
8. Both users click **"Confirm Meeting Happened"**
9. ✅ Skill swap unlocked! 🎉

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
- **Chat Messaging**: Real-time chat between matched users with demo auto-responses
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
| **Spec Sessions** | 6 complete specs (requirements → design → tasks) |
| **Steering Documents** | 7 files providing persistent AI context |
| **Property Testing** | 45 correctness properties defined and tested |
| **Custom Prompts** | 13 workflow-specific development commands |
| **Demo Video** | Voice script and audio generated with AWS Polly |

### Specs Created
| Spec | Requirements | Properties | Status |
|------|--------------|------------|--------|
| SkillSwap PWA (Core) | 10 | 18 | ✅ Complete |
| Dynamic Demo Seeding | 5 | 9 | ✅ Complete |
| Password Reset | 4 | 5 | ✅ Complete |
| Front Page & Site-Wide | 10 | 3 | ✅ Complete |
| Chat Messaging | 10 | 10 | ✅ Complete |
| Demo Video | 4 | 1 | ✅ Complete |

### Meta-Innovation: Kiro Gives Itself a Voice
The demo video narration was written by Kiro and converted to speech using AWS Polly. The AI literally wrote its own presentation script, showcasing the full potential of AI-assisted development.

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

🎤 **Meta-innovation**: Kiro wrote its own demo presentation and generated the narration using AWS Polly

## License

MIT

---

Built with ☕ and [Kiro](https://kiro.dev) for the Dynamous Hackathon 2026
