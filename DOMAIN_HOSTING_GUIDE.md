# 🌐 ReActure .tech Domain Hosting Guide

## 🎯 **Goal**

Host ReActure on **reacture.tech** (or similar .tech domain) to qualify for the **Best .tech Domain** track.

The landing page should showcase:
- ✅ Project mission & impact
- ✅ Live demo access
- ✅ Real-time MongoDB Atlas data
- ✅ Team information
- ✅ GitHub repository link
- ✅ Technical documentation

---

## 📋 **What You Need to Create**

### **1. Public Landing Page** (`landing-page/`)

A professional showcase website separate from the game itself:

```
landing-page/
├── index.html          # Main landing page
├── styles.css          # Styling
├── script.js           # Interactive features
└── README.md           # Setup instructions
```

**Purpose:**
- Public-facing showcase for judges, potential users, and researchers
- Links to the actual game (served separately)
- Real-time stats from MongoDB Atlas
- Professional presentation of the project

---

## 🏗️ **Landing Page Structure**

### **Sections to Include:**

#### **1. Hero Section**
- Project title: "ReActure - React for the Future"
- Tagline: "BeReal meets robotics AI"
- Key stats (10Hz data, 1,800 samples/game, 3 environments)
- CTA buttons: "Play Demo" and "View GitHub"
- Eye-catching REACT TIME visual mockup

#### **2. Mission Section**
- **The Problem**: Robotics training data is expensive and doesn't scale
- **The Solution**: Gamify data collection with viral mechanics
- **The Innovation**: BeReal-style challenges + MongoDB Atlas cloud
- **Impact**: What each game session generates

#### **3. Key Features**
- BeReal-Style Virality (REACT TIME challenges)
- MongoDB Atlas Cloud Infrastructure
- First-Person Disaster Simulation
- ML-Ready Datasets (NumPy, JSONL, JSON)
- Social Competition (friends, leaderboards)
- Secure Authentication (SHA-256)

#### **4. Tech Stack**
- Frontend: Three.js, Vanilla JS, Web APIs
- Backend: Node.js, Express, Mongoose
- Database: MongoDB Atlas
- ML: NumPy, PyTorch, TensorFlow
- Architecture diagram

#### **5. Live Demo**
- Embedded gameplay video or screenshots
- Link to full game
- Quick feature tour

#### **6. Live Data** (Real-time MongoDB stats)
- Total sessions played
- Active players
- Victims rescued
- Data points collected
- Top 10 leaderboard

#### **7. Team Section**
- Your photo/avatar
- Role and bio
- Links (GitHub, LinkedIn)

#### **8. Footer**
- GitHub repo link
- Documentation links
- MongoDB Atlas + .tech domain badges
- Social links

---

## 🎨 **Design Guidelines**

### **Visual Style:**
- Dark theme with purple/blue gradients (matches game aesthetic)
- Modern, clean, professional
- Animated stats counters
- Smooth scroll animations
- Responsive (mobile-friendly)

### **Branding:**
- Logo: ⚡ with "ReActure" in Orbitron font
- Colors:
  - Primary: #667eea (purple)
  - Secondary: #764ba2 (deep purple)
  - Accent: #ff5722 (orange for REACT TIME)
  - Background: #0a0a0f (dark)
  - Text: #ffffff (white)

### **Fonts:**
- Headings: Orbitron (futuristic, tech-focused)
- Body: Inter (clean, readable)

---

## 🔌 **Live Data Integration**

### **MongoDB Atlas API Integration:**

```javascript
// script.js - Fetch real-time stats from your backend

async function loadLiveData() {
    try {
        // Fetch total sessions
        const response = await fetch('http://localhost:3001/api/stats');
        const data = await response.json();
        
        // Update stats on page
        document.getElementById('totalSessions').textContent = data.totalSessions;
        document.getElementById('totalPlayers').textContent = data.uniquePlayers;
        document.getElementById('totalVictims').textContent = data.totalVictimsRescued;
        document.getElementById('dataPoints').textContent = 
            (data.totalSessions * 1800).toLocaleString();
        
        // Fetch leaderboard
        const leaderboardRes = await fetch('http://localhost:3001/api/leaderboard?limit=10');
        const leaderboard = await leaderboardRes.json();
        
        // Display leaderboard
        displayLeaderboard(leaderboard.leaderboard);
    } catch (error) {
        console.error('Failed to load live data:', error);
        // Show fallback data or hide section
    }
}

// Refresh every 30 seconds
setInterval(loadLiveData, 30000);
loadLiveData();
```

### **New Backend Endpoint** (`server/routes/stats.js`):

```javascript
import express from 'express';
import PlayerSession from '../models/PlayerSession.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const totalSessions = await PlayerSession.countDocuments();
        const uniquePlayers = await PlayerSession.distinct('playerId').length;
        const totalVictimsRescued = await PlayerSession.aggregate([
            { $group: { _id: null, total: { $sum: '$victimsSaved' } } }
        ]);
        
        res.json({
            totalSessions,
            uniquePlayers,
            totalVictimsRescued: totalVictimsRescued[0]?.total || 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
```

---

## 🚀 **Hosting Options for .tech Domain**

### **Option 1: GitHub Pages (Recommended - Free & Easy)**

**Steps:**

1. **Buy .tech domain** (from get.tech, Namecheap, etc.)
   - Cost: ~$10-20/year
   - Search for available names (reacture.tech, reactureai.tech, etc.)

2. **Create `gh-pages` branch** in your GitHub repo:
   ```bash
   cd /Users/anoushkagudla/Desktop/ReActure/ReActure-1
   git checkout -b gh-pages
   
   # Copy landing page to root
   cp -r landing-page/* .
   
   # Commit and push
   git add .
   git commit -m "Add landing page for GitHub Pages"
   git push origin gh-pages
   ```

3. **Enable GitHub Pages**:
   - Go to repo Settings → Pages
   - Source: Deploy from branch `gh-pages`
   - Custom domain: `reacture.tech`
   - Enforce HTTPS: ✅

4. **Configure DNS** (at your domain registrar):
   ```
   Type: A
   Name: @
   Value: 185.199.108.153
   
   Type: A
   Name: @
   Value: 185.199.109.153
   
   Type: A
   Name: @
   Value: 185.199.110.153
   
   Type: A
   Name: @
   Value: 185.199.111.153
   
   Type: CNAME
   Name: www
   Value: gudlaa.github.io
   ```

5. **Wait for DNS propagation** (15 minutes to 24 hours)

6. **Verify**: Visit https://reacture.tech

**Pros:**
- ✅ Free hosting
- ✅ HTTPS included
- ✅ Easy to update (just push to gh-pages)
- ✅ Fast (GitHub CDN)

**Cons:**
- ❌ Static only (no Node.js backend on same domain)
- ❌ Need to host backend separately

---

### **Option 2: Vercel (Free, Backend Support)**

**Steps:**

1. **Buy .tech domain**

2. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

3. **Deploy**:
   ```bash
   cd /Users/anoushkagudla/Desktop/ReActure/ReActure-1
   vercel
   # Follow prompts
   ```

4. **Add custom domain**:
   - Vercel dashboard → Project → Settings → Domains
   - Add: `reacture.tech`
   - Follow DNS instructions

5. **Configure for full-stack**:
   ```json
   // vercel.json
   {
     "version": 2,
     "builds": [
       { "src": "landing-page/**", "use": "@vercel/static" },
       { "src": "server/server.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "/server/server.js" },
       { "src": "/(.*)", "dest": "/landing-page/$1" }
     ]
   }
   ```

**Pros:**
- ✅ Free tier (enough for hackathon)
- ✅ Backend + frontend on same domain
- ✅ Automatic HTTPS
- ✅ Serverless functions for API

**Cons:**
- ❌ More complex setup
- ❌ MongoDB Atlas needs to allow Vercel IPs

---

### **Option 3: Netlify (Free, Easy)**

Similar to GitHub Pages but with form handling and serverless functions.

**Steps:**

1. **Buy .tech domain**

2. **Deploy**:
   ```bash
   npm install -g netlify-cli
   cd /Users/anoushkagudla/Desktop/ReActure/ReActure-1/landing-page
   netlify deploy --prod
   ```

3. **Add custom domain** in Netlify dashboard

4. **Configure DNS** (Netlify provides instructions)

**Pros:**
- ✅ Free hosting
- ✅ Easy setup
- ✅ Forms and functions

**Cons:**
- ❌ Backend needs separate hosting

---

## 📂 **File Structure for .tech Domain**

```
ReActure/
├── landing-page/               # Public showcase (hosted on .tech)
│   ├── index.html             # Landing page
│   ├── styles.css             # Styling
│   ├── script.js              # Live data fetch
│   └── assets/
│       ├── screenshots/       # Game screenshots
│       └── logo.svg           # ReActure logo
│
├── game/                      # Actual game (link from landing page)
│   ├── index.html            # Game UI
│   ├── game.js               # Game logic
│   ├── style.css             # Game styling
│   └── mongoService.js       # MongoDB integration
│
├── server/                    # Backend API
│   ├── server.js
│   ├── models/
│   └── routes/
│
└── docs/                      # Documentation
    ├── README.md
    ├── MONGODB_SETUP.md
    └── API_EXPLANATIONS.md
```

**Hosting Strategy:**
- **Landing page** → `reacture.tech` (GitHub Pages or Vercel)
- **Game** → `reacture.tech/game` or `play.reacture.tech`
- **Backend** → Railway, Render, or Heroku (separate)
- **MongoDB** → Already on Atlas (cloud)

---

## ✅ **Quick Setup Checklist**

### **Phase 1: Create Landing Page**
- [ ] Create `landing-page/` folder
- [ ] Write `index.html` with all sections
- [ ] Style with `styles.css`
- [ ] Add `script.js` for live data
- [ ] Test locally (`python3 -m http.server 8001`)

### **Phase 2: Buy Domain**
- [ ] Search for .tech domain (reacture.tech, reactureai.tech)
- [ ] Purchase (~$10-20/year)
- [ ] Get access to DNS settings

### **Phase 3: Deploy**
- [ ] Choose hosting (GitHub Pages recommended)
- [ ] Deploy landing page
- [ ] Configure DNS
- [ ] Wait for propagation (check with `dig reacture.tech`)
- [ ] Verify HTTPS works

### **Phase 4: Backend for Live Data**
- [ ] Add `/api/stats` endpoint to backend
- [ ] Update CORS to allow .tech domain
- [ ] Deploy backend (if not already)
- [ ] Update `script.js` with backend URL

### **Phase 5: Polish**
- [ ] Add real screenshots/demo video
- [ ] Test all links
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] SEO meta tags

---

## 🎯 **Landing Page Goals**

### **For Hackathon Judges:**
- ✅ Professional presentation
- ✅ Clear value proposition
- ✅ Technical depth (MongoDB Atlas integration)
- ✅ Live, working demo
- ✅ Real data from database

### **For Users:**
- ✅ Understand project in 30 seconds
- ✅ Easy access to play game
- ✅ Social proof (leaderboard)
- ✅ Clear call-to-action

### **For Researchers:**
- ✅ Technical details
- ✅ Dataset access
- ✅ API documentation
- ✅ GitHub repository

---

## 🏆 **Best .tech Domain Track Requirements**

To qualify for this track, your .tech domain should:

1. **Be active and accessible** ✅
   - Domain resolves to your site
   - HTTPS enabled
   - Fast loading

2. **Showcase the project** ✅
   - Clear description
   - Working demo
   - Technical details

3. **Professional presentation** ✅
   - Good design
   - Mobile-friendly
   - No broken links

4. **Add value beyond just code** ✅
   - Public-facing showcase
   - Live data integration
   - Educational content

---

## 📝 **Domain Name Suggestions**

If `reacture.tech` is taken:

- `reacture.tech` ⭐ (First choice)
- `reactureai.tech`
- `reacturegame.tech`
- `reactforthefuture.tech`
- `disasterai.tech`
- `rescuebot.tech`
- `roboticsdata.tech`
- `savelives.tech`

Check availability at: https://get.tech/

---

## 🚀 **Quick Start (GitHub Pages Method)**

```bash
# 1. Create landing page folder
cd /Users/anoushkagudla/Desktop/ReActure/ReActure-1
mkdir landing-page
cd landing-page

# 2. Create files (I'll provide the HTML/CSS/JS)

# 3. Create gh-pages branch
git checkout -b gh-pages
cp -r ../landing-page/* .
git add .
git commit -m "Add landing page for .tech domain"
git push origin gh-pages

# 4. Enable GitHub Pages in repo settings
# Settings → Pages → Source: gh-pages → Save

# 5. Buy domain and configure DNS (instructions above)

# 6. Add custom domain in GitHub Pages settings

# Done! Visit reacture.tech
```

---

## 📊 **Success Metrics**

After hosting on .tech domain, you should have:

✅ Professional landing page at `reacture.tech`  
✅ Live MongoDB Atlas data displayed  
✅ Working demo link to full game  
✅ GitHub repository prominently linked  
✅ Mobile-responsive design  
✅ HTTPS enabled  
✅ Fast page load (<3 seconds)  
✅ Clear call-to-action  
✅ Team information  
✅ Technical documentation  

---

## 🎨 **Next Steps**

1. **I'll create the landing page files** (HTML, CSS, JS)
2. **You buy the .tech domain** (~$10-20)
3. **Deploy to GitHub Pages** (free, easy)
4. **Configure DNS** (point domain to GitHub)
5. **Add backend live data** (stats endpoint)
6. **Polish and test**
7. **Submit for hackathon** 🏆

---

**Ready to get started?** Let me know and I'll create the complete landing page files for you to deploy! 🚀

