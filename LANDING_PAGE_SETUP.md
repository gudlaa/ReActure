# 🌐 Quick Landing Page Setup for reacture.tech

## 📋 **Summary**

I've created a comprehensive guide (**DOMAIN_HOSTING_GUIDE.md**) for setting up a .tech domain. Here's the quick version:

---

## 🚀 **What You Need to Do**

### **Step 1: Buy a .tech Domain** (~$10-20/year)

Go to any domain registrar:
- **get.tech** (official .tech registrar)
- **Namecheap**
- **GoDaddy**
- **Google Domains**

Search for: **reacture.tech** (or variations if taken)

### **Step 2: Create Landing Page**

I recommend creating a **separate public showcase website** that:
- Introduces the project professionally
- Links to the actual game
- Shows live MongoDB Atlas data
- Highlights the team and GitHub repo

**Why separate from the game?**
- The game is complex (Three.js, first-person controls)
- Landing page should be **fast, SEO-friendly, and mobile-responsive**
- Judges need a quick overview before diving into gameplay
- Landing page can stay static while game updates

---

## 📂 **Recommended Structure**

```
Option 1: Simple (Recommended for Hackathon)
=========================================
reacture.tech/              → Landing page (showcase)
reacture.tech/game/         → Actual game
reacture.tech/docs/         → Documentation

Option 2: Subdomains
====================
reacture.tech               → Landing page
play.reacture.tech          → Game
api.reacture.tech           → Backend
docs.reacture.tech          → Documentation
```

---

## 🎨 **Landing Page Sections**

1. **Hero** - Project title, tagline, key stats, CTA buttons
2. **Mission** - The problem, solution, innovation
3. **Features** - BeReal mechanics, MongoDB Atlas, ML datasets
4. **Tech Stack** - Full technology breakdown
5. **Live Demo** - Link to game + screenshots
6. **Live Data** - Real-time MongoDB stats (via your backend API)
7. **Team** - Your info + GitHub links
8. **CTA** - "Play Now" and "View GitHub" buttons

---

## ⚡ **Fastest Setup Method: GitHub Pages**

### **Step-by-Step:**

```bash
# 1. Create landing page content
cd /Users/anoushkagudla/Desktop/ReActure/ReActure-1
mkdir landing-page
cd landing-page

# 2. Create index.html (I can provide a template)
# 3. Create styles.css
# 4. Create script.js (for live MongoDB data)

# 5. Deploy to GitHub Pages
git checkout -b gh-pages
cp -r landing-page/* .
git add .
git commit -m "Add landing page for reacture.tech"
git push origin gh-pages

# 6. Enable GitHub Pages
# Go to: GitHub repo → Settings → Pages
# Source: Deploy from branch "gh-pages"
# Save

# 7. Configure custom domain
# In GitHub Pages settings: Add custom domain "reacture.tech"
```

### **DNS Configuration** (at your domain registrar):

```
Type: A       Name: @       Value: 185.199.108.153
Type: A       Name: @       Value: 185.199.109.153
Type: A       Name: @       Value: 185.199.110.153
Type: A       Name: @       Value: 185.199.111.153
Type: CNAME   Name: www     Value: gudlaa.github.io
```

### **Result:**
- Landing page: `https://reacture.tech`
- Game: Link from landing page to `https://gudlaa.github.io/ReActure/` or deploy separately
- Backend: Keep on Railway/Render (CORS needs to allow reacture.tech)

---

## 🔌 **Live Data Integration**

### **Add Stats Endpoint to Backend:**

Create `server/routes/stats.js`:

```javascript
import express from 'express';
import PlayerSession from '../models/PlayerSession.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const totalSessions = await PlayerSession.countDocuments();
        const uniquePlayers = (await PlayerSession.distinct('playerId')).length;
        const result = await PlayerSession.aggregate([
            { $group: { _id: null, total: { $sum: '$victimsSaved' } } }
        ]);
        
        res.json({
            success: true,
            totalSessions,
            uniquePlayers,
            totalVictimsRescued: result[0]?.total || 0,
            totalDataPoints: totalSessions * 1800,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
```

Add to `server/server.js`:

```javascript
import statsRouter from './routes/stats.js';
app.use('/api/stats', statsRouter);
```

### **Fetch from Landing Page:**

In `landing-page/script.js`:

```javascript
async function loadLiveData() {
    try {
        const response = await fetch('https://your-backend.railway.app/api/stats');
        const data = await response.json();
        
        document.getElementById('totalSessions').textContent = data.totalSessions;
        document.getElementById('totalPlayers').textContent = data.uniquePlayers;
        document.getElementById('totalVictims').textContent = data.totalVictimsRescued;
        document.getElementById('dataPoints').textContent = 
            data.totalDataPoints.toLocaleString();
    } catch (error) {
        console.error('Failed to load stats:', error);
        // Show fallback
        document.getElementById('totalSessions').textContent = '15+';
        document.getElementById('totalPlayers').textContent = '8+';
    }
}

// Load on page load
loadLiveData();

// Refresh every 30 seconds
setInterval(loadLiveData, 30000);
```

---

## ✅ **Checklist for .tech Domain Track**

- [ ] Buy .tech domain (reacture.tech or similar)
- [ ] Create professional landing page
- [ ] Deploy to GitHub Pages (or Vercel/Netlify)
- [ ] Configure DNS to point to hosting
- [ ] Enable HTTPS
- [ ] Add live MongoDB data section
- [ ] Link to game demo
- [ ] Link to GitHub repo
- [ ] Mobile-responsive design
- [ ] Test all links work
- [ ] Fast loading (<3 seconds)
- [ ] SEO meta tags (description, keywords, og:image)

---

## 🎯 **What Makes It Qualify for Best .tech Domain?**

✅ **Active .tech domain** - Your project accessible at reacture.tech  
✅ **Professional showcase** - Landing page is polished and informative  
✅ **Live integration** - Real MongoDB Atlas data displayed  
✅ **Working demo** - Links to actual playable game  
✅ **Technical depth** - Shows tech stack and architecture  
✅ **Open source** - GitHub repo prominently linked  
✅ **Social proof** - Live leaderboard from database  

---

## 📝 **Simple Landing Page Template**

Want me to create a simple, clean landing page for you? It will include:

1. **Clean Design** - Dark theme with purple gradients
2. **Hero Section** - Title, tagline, stats, CTAs
3. **Feature Showcase** - 6 key features with icons
4. **Live Data** - Real-time MongoDB stats
5. **Tech Stack** - Visual breakdown
6. **Team** - Your info
7. **Footer** - Links and badges

Just say "create landing page" and I'll generate the HTML, CSS, and JS files ready to deploy!

---

## 💰 **Cost Breakdown**

- .tech domain: **$10-20/year** (one-time for hackathon)
- GitHub Pages hosting: **FREE**
- MongoDB Atlas: **FREE** (M0 tier)
- Backend hosting: **FREE** (Railway/Render free tier)

**Total: ~$15 for the hackathon** 🎉

---

## 🚀 **Timeline**

- **Day 1**: Buy domain, create landing page files (2 hours)
- **Day 1**: Deploy to GitHub Pages, configure DNS (30 min)
- **Day 2**: Wait for DNS propagation, test everything (1 hour)
- **Day 2**: Add live data integration (1 hour)
- **Day 3**: Polish, screenshots, final testing (1 hour)

**Total: ~5 hours** to have a professional reacture.tech live! ⚡

---

## 🎨 **Want Me to Build It?**

I can create a complete, production-ready landing page with:
- Responsive HTML5
- Modern CSS3 (animations, gradients, grid)
- Vanilla JavaScript (live data, smooth scrolling)
- SEO optimized
- Mobile-friendly
- Fast loading

Ready to build it? Let me know! 🚀

