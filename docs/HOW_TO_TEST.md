# How to Test SkillSwap

Quick copy-paste instructions for judges.

---

## 1. Setup (30 seconds)

```bash
# Clone and install
git clone <repo-url>
cd kiro_hackathon_skillswap_pwa
npm install
```

---

## 2. Start the App
Expected Ports

| Service | Port |
|---------|------|
| Frontend (Vite) | 5173 |
| Backend (Express) | 3001 |

If Vite uses a different port (5174, 5175...), kill processes and restart.

```bash

# First kill specific ports (Linux/Mac)
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
# Windows
taskkill /F /IM node.exe


npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
VITE ready in XXms
➜ Local: http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

## 3. Test the Flow

### Option A: Quick Test (Single User + Demo Users)

1. Click **"Get Started"** on the front page
2. Register with any email/password
3. **Allow location access** when prompted
4. Add skills:
   - Offer: Pick any skill (e.g., "Plumbing")
   - Need: Pick any skill (e.g., "Web Design")
5. Go to **Discover** → See 15-25 demo users nearby
6. Click **"I'm Interested"** on a match
7. Demo user auto-responds → Status becomes **"Mutual"**
8. Click **"Schedule Coffee"** → Propose a meeting
9. Demo user auto-accepts
10. Click **"Confirm Meeting Happened"**
11. ✅ Skill swap unlocked!

### Option B: Full Test (Two Real Users)

1. Open **two browser windows** (one regular, one incognito)
2. Register two accounts:
   - **User A**: Offers "Plumbing", Needs "Web Design"
   - **User B**: Offers "Web Design", Needs "Plumbing"
3. Both users go to **Discover** → See each other as matches
4. Both click **"I'm Interested"** → Status becomes **"Mutual"**
5. User A clicks **"Schedule Coffee"** → Proposes meeting
6. User B sees proposal → Clicks **"Accept"**
7. Both users click **"Confirm Meeting Happened"**
8. ✅ Skill swap unlocked!
---



## Troubleshooting

### Port Conflict (Vite shows "Port 5173 is in use")

```bash
# Kill zombie processes
pkill -f node

# Or kill specific ports (Linux/Mac)
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Windows
taskkill /F /IM node.exe

# Restart
npm run dev
```

### Database Reset

```bash
rm database.sqlite
npm run dev
```

---

## Expected Ports

| Service | Port |
|---------|------|
| Frontend (Vite) | 5173 |
| Backend (Express) | 3001 |

If Vite uses a different port (5174, 5175...), kill processes and restart.

---

## What to Look For

✅ Professional front page with hero section  
✅ Smooth registration/login flow  
✅ Location-based matching (demo users appear nearby)  
✅ Mutual interest confirmation  
✅ Coffee meeting scheduling  
✅ Meeting verification unlocks skill swap  
✅ Legal pages (Privacy, Terms, Cookies, Contact)  
✅ PWA installable (look for install prompt)  
✅ Mobile responsive design  

---

Built with ☕ and [Kiro](https://kiro.dev)
