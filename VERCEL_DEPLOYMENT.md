# 🚀 Deploying ReActure to Vercel

This guide will walk you through deploying ReActure to Vercel for free hosting.

---

## 📋 **PREREQUISITES**

1. **Vercel Account** (free)
   - Sign up at https://vercel.com
   - Connect your GitHub account

2. **MongoDB Atlas** (free tier)
   - Already set up with your connection string
   - Keep your `MONGODB_URI` ready

3. **GitHub Repository**
   - ReActure code already pushed to GitHub
   - Repository: https://github.com/gudlaa/ReActure

---

## 🎯 **DEPLOYMENT STEPS**

### **Step 1: Prepare Your Repository**

Make sure these files exist in your repository:

```
ReActure/
├── api/                    # Vercel serverless functions
│   ├── session.js         # Session API endpoint
│   ├── leaderboard.js     # Leaderboard API endpoint
│   ├── stats.js           # Statistics API endpoint
│   ├── dataset.js         # Dataset export endpoint
│   └── health.js          # Health check endpoint
├── server/                 # Backend code (used by API)
│   ├── lib/
│   │   └── dbConnect.js   # MongoDB connection
│   └── models/
│       ├── PlayerSession.js
│       └── VoiceLog.js
├── vercel.json            # Vercel configuration
├── index.html             # Frontend entry point
├── game.js                # Game logic
├── style.css              # Styles
├── mongoService.js        # API client
└── package.json           # Dependencies
```

✅ All these files are already created and ready!

---

### **Step 2: Deploy to Vercel**

#### **Option A: Deploy via Vercel Dashboard (Recommended)**

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click **"Add New..."** → **"Project"**

2. **Import Git Repository**
   - Click **"Import Git Repository"**
   - Select **"GitHub"**
   - Choose your **ReActure** repository
   - Click **"Import"**

3. **Configure Project**
   - **Project Name**: `reacture` (or your choice)
   - **Framework Preset**: Select **"Other"**
   - **Root Directory**: Leave as `.` (root)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: Leave as `.` (root)
   
4. **Add Environment Variables**
   - Click **"Environment Variables"**
   - Add the following:
   
   | Name | Value | Notes |
   |------|-------|-------|
   | `MONGODB_URI` | `mongodb+srv://username:password@cluster.mongodb.net/reacture?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
   
   ⚠️ **IMPORTANT**: Replace with YOUR actual MongoDB URI from Atlas!

5. **Deploy**
   - Click **"Deploy"**
   - Wait 2-3 minutes for deployment to complete
   - You'll get a URL like `https://reacture.vercel.app`

#### **Option B: Deploy via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd /path/to/ReActure
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? reacture
# - Directory? ./ (default)
# - Override settings? No

# Add environment variable
vercel env add MONGODB_URI production
# Paste your MongoDB connection string when prompted

# Deploy to production
vercel --prod
```

---

### **Step 3: Verify Deployment**

1. **Check Health Endpoint**
   ```bash
   curl https://reacture.vercel.app/api/health
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "database": "connected",
     "timestamp": "2024-11-09T12:00:00.000Z",
     "message": "ReActure API is running!"
   }
   ```

2. **Test the Game**
   - Visit `https://reacture.vercel.app`
   - Create an account and sign in
   - Play a game
   - Check if data saves to MongoDB

3. **Verify MongoDB**
   - Go to MongoDB Atlas dashboard
   - Navigate to **Collections**
   - Check `reacture` database → `playersessions` collection
   - You should see your game session data!

---

## 🔧 **VERCEL CONFIGURATION**

### **vercel.json Explained**

```json
{
  "version": 2,
  "name": "reacture",
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "MONGODB_URI": "@mongodb_uri"
  }
}
```

**What it does:**
- **builds**: Tells Vercel to build all `api/*.js` files as Node.js serverless functions
- **routes**: Routes `/api/*` requests to serverless functions, everything else to static files
- **env**: References the `MONGODB_URI` environment variable

---

## 📡 **API ENDPOINTS**

Once deployed, your API will be available at:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://reacture.vercel.app/api/health` | GET | Health check |
| `https://reacture.vercel.app/api/session` | POST | Create session |
| `https://reacture.vercel.app/api/session?sessionId=xxx` | PUT | Update session |
| `https://reacture.vercel.app/api/session?sessionId=xxx` | GET | Get session |
| `https://reacture.vercel.app/api/leaderboard` | GET | Global leaderboard |
| `https://reacture.vercel.app/api/leaderboard?today=true` | GET | Today's leaderboard |
| `https://reacture.vercel.app/api/leaderboard?environment=earthquake` | GET | Environment-specific |
| `https://reacture.vercel.app/api/stats` | GET | Overall statistics |
| `https://reacture.vercel.app/api/dataset` | GET | Export dataset |

---

## 🔐 **ENVIRONMENT VARIABLES**

### **Add Environment Variables in Vercel Dashboard**

1. Go to your project in Vercel dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | Production, Preview, Development |

### **Get MongoDB URI from Atlas**

1. Go to MongoDB Atlas dashboard
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `reacture`

**Example:**
```
mongodb+srv://anoushka:yourpassword@cluster0.abc123.mongodb.net/reacture?retryWrites=true&w=majority
```

---

## 🌐 **CUSTOM DOMAIN (Optional)**

### **Add a Custom Domain**

1. Go to your project in Vercel
2. Click **"Settings"** → **"Domains"**
3. Add your domain (e.g., `reacture.com`)
4. Follow DNS configuration instructions
5. Vercel automatically provisions SSL certificate

**Free domains:**
- Vercel provides `*.vercel.app` for free
- Connect custom domain if you own one

---

## 🐛 **TROUBLESHOOTING**

### **Issue: API Returns 500 Error**

**Check logs:**
```bash
vercel logs
```

**Common causes:**
- MongoDB URI not set correctly
- Missing environment variable
- MongoDB Atlas IP whitelist (should be `0.0.0.0/0` for Vercel)

**Fix:**
1. Go to MongoDB Atlas → Network Access
2. Add IP Address: `0.0.0.0/0` (allow all)
3. Or add Vercel IPs (changes frequently, not recommended)

---

### **Issue: API Endpoint Not Found (404)**

**Check:**
- API files are in `/api` directory (not `/server/api`)
- File names match URL paths:
  - `/api/session.js` → `/api/session`
  - `/api/leaderboard.js` → `/api/leaderboard`

**Fix:**
- Ensure `api/` directory is at project root
- Redeploy with `vercel --prod`

---

### **Issue: CORS Errors**

**Symptoms:**
- Browser console shows CORS policy errors
- API calls fail from frontend

**Fix:**
Each API function already includes CORS headers:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
```

If still having issues:
1. Clear browser cache
2. Try in incognito mode
3. Check Vercel logs for actual error

---

### **Issue: MongoDB Connection Timeout**

**Check:**
1. **MongoDB Atlas IP Whitelist**
   - Go to Network Access
   - Ensure `0.0.0.0/0` is allowed

2. **Connection String Format**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/reacture?retryWrites=true&w=majority
   ```
   
   - No spaces
   - Password properly encoded if contains special characters
   - Database name included

3. **Test Connection Locally**
   ```bash
   cd server
   node test-connection.js
   ```

---

### **Issue: Environment Variables Not Loading**

**Verify:**
```bash
# Check environment variables
vercel env ls

# Pull environment variables locally
vercel env pull
```

**Re-add if needed:**
```bash
vercel env add MONGODB_URI production
```

---

## 🔄 **CONTINUOUS DEPLOYMENT**

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update game logic"
git push origin main

# Vercel automatically:
# 1. Detects the push
# 2. Builds the project
# 3. Deploys to production
# 4. Updates your live site in ~2 minutes
```

**Deployment Status:**
- Check https://vercel.com/dashboard
- View build logs
- See deployment history
- Rollback if needed

---

## 📊 **MONITORING**

### **Vercel Analytics (Free)**

1. Go to your project dashboard
2. Click **"Analytics"**
3. View:
   - Page views
   - Visitor count
   - Performance metrics
   - API response times

### **MongoDB Atlas Monitoring**

1. Go to MongoDB Atlas dashboard
2. Click **"Metrics"**
3. View:
   - Database operations
   - Storage usage
   - Network traffic
   - Query performance

---

## 💰 **PRICING**

### **Free Tier Limits (Hobby Plan)**

Vercel Free Tier includes:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth per month
- ✅ Automatic HTTPS
- ✅ Serverless functions (100 GB-hours)
- ✅ 100 builds per day

MongoDB Atlas Free Tier (M0):
- ✅ 512 MB storage
- ✅ Shared cluster
- ✅ Unlimited users
- ✅ Basic monitoring

**For ReActure:**
- Free tier is sufficient for development and testing
- Supports hundreds of players per month
- Upgrade if you hit limits

---

## 🎯 **POST-DEPLOYMENT CHECKLIST**

- [ ] Vercel deployment successful
- [ ] Custom domain configured (if applicable)
- [ ] MongoDB URI environment variable set
- [ ] Health endpoint returns `200 OK`
- [ ] Test user account creation
- [ ] Test game session creation
- [ ] Verify data in MongoDB Atlas
- [ ] Test leaderboard loading
- [ ] Test all three environments (earthquake, tsunami, wildfire)
- [ ] Test REACT TIME popup
- [ ] Test friends system
- [ ] Check Vercel Analytics
- [ ] Monitor MongoDB Atlas metrics

---

## 🚀 **NEXT STEPS**

### **1. Share Your Game**

Your game is now live at:
```
https://reacture.vercel.app
```

Share with:
- Friends (test the viral mechanics!)
- Hackathon judges
- Social media
- Research community

### **2. Monitor Usage**

- Check Vercel Analytics daily
- Monitor MongoDB storage usage
- Review API response times
- Check for errors in logs

### **3. Iterate**

Make changes and push to GitHub:
```bash
git add .
git commit -m "Add new feature"
git push origin main
```

Vercel auto-deploys in ~2 minutes!

### **4. Upgrade if Needed**

If you exceed free tier:
- **Vercel Pro**: $20/month (1 TB bandwidth)
- **MongoDB Atlas M2**: $9/month (2 GB storage)

---

## 🎉 **SUCCESS!**

Your ReActure game is now live and accessible worldwide! 🌍

**Live URLs:**
- Game: `https://reacture.vercel.app`
- Health Check: `https://reacture.vercel.app/api/health`
- Leaderboard: `https://reacture.vercel.app/api/leaderboard`

**What's Working:**
✅ Frontend (3D game with Three.js)  
✅ Backend (Serverless API functions)  
✅ Database (MongoDB Atlas cloud)  
✅ Authentication (Secure passwords)  
✅ Data Collection (10Hz sensor data)  
✅ Social Features (Friends, leaderboards)  
✅ BeReal Mechanics (REACT TIME)  

---

## 📚 **USEFUL LINKS**

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Your GitHub Repo**: https://github.com/gudlaa/ReActure
- **Vercel CLI Docs**: https://vercel.com/docs/cli

---

## 🆘 **NEED HELP?**

### **Vercel Support**
- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions

### **MongoDB Support**
- Documentation: https://docs.mongodb.com
- Community Forums: https://www.mongodb.com/community/forums

### **ReActure Issues**
- GitHub Issues: https://github.com/gudlaa/ReActure/issues

---

**🎮 Happy Deploying! Your disaster response game is ready to collect robotics training data at scale! 🤖**

