# 🍃 MongoDB Atlas Integration Setup Guide

Complete guide to integrate MongoDB Atlas with ReActure for storing player data, leaderboards, and ML datasets.

---

## 📋 **Prerequisites**

- Node.js 16+ installed
- MongoDB Atlas account (free tier works!)
- Basic knowledge of REST APIs

---

## 🚀 **Step 1: Set Up MongoDB Atlas**

### **1.1 Create MongoDB Atlas Account**
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" and create an account
3. Choose the **FREE tier** (M0 Sandbox)

### **1.2 Create a Cluster**
1. Click "Build a Database"
2. Choose **FREE** tier
3. Select a cloud provider (AWS recommended)
4. Choose a region close to you
5. Click "Create Cluster"

### **1.3 Set Up Database Access**
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose **Password** authentication
4. Username: `reacture_user` (or your choice)
5. Password: Generate a secure password (save it!)
6. Set privileges to **Read and write to any database**
7. Click "Add User"

### **1.4 Set Up Network Access**
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add your specific IP
5. Click "Confirm"

### **1.5 Get Connection String**
1. Go back to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string:
   ```
   mongodb+srv://reacture_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Save this connection string!

---

## 🛠️ **Step 2: Install Backend Dependencies**

### **2.1 Navigate to Server Directory**
```bash
cd ReActure-1/server
```

### **2.2 Install Dependencies**
```bash
npm install
```

This installs:
- `express` - Web server
- `mongoose` - MongoDB ODM
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Environment variables

---

## ⚙️ **Step 3: Configure Environment**

### **3.1 Create .env File**
Create a file named `.env` in the `server/` directory:

```bash
touch .env
```

### **3.2 Add Configuration**
Edit `.env` and add:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://reacture_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/reacture?retryWrites=true&w=majority

# Server Port
PORT=3001

# Node Environment
NODE_ENV=development
```

**⚠️ Important:**
- Replace `YOUR_PASSWORD` with your actual MongoDB password
- Replace `cluster0.xxxxx` with your actual cluster address
- Add database name: `/reacture` before the `?`

---

## 🏃 **Step 4: Start the Backend Server**

### **4.1 Start Server**
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### **4.2 Verify Server is Running**
You should see:
```
🚀 ReActure MongoDB Atlas Backend
✅ Server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
📡 API endpoints: http://localhost:3001/api
🔄 Connecting to MongoDB Atlas...
✅ Connected to MongoDB Atlas
```

### **4.3 Test Health Endpoint**
Open browser or use curl:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-10T12:00:00.000Z",
  "service": "ReActure MongoDB API"
}
```

---

## 🎮 **Step 5: Start Frontend**

### **5.1 In New Terminal**
```bash
cd ReActure-1
python3 -m http.server 8000
```

### **5.2 Open Browser**
```
http://localhost:8000
```

### **5.3 Verify MongoDB Connection**
Open browser console (F12), you should see:
```
✅ MongoDB Atlas backend connected
📊 Data Mode: ENABLED
```

---

## 🧪 **Step 6: Test the Integration**

### **6.1 Play a Game**
1. Sign in or create account
2. Select an environment
3. Play for 30+ seconds
4. Complete the game

### **6.2 Check MongoDB Atlas**
1. Go to your MongoDB Atlas dashboard
2. Click "Browse Collections"
3. You should see:
   - Database: `reacture`
   - Collections: `playersessions`, `voicelogs`
   - Documents: Your game session data!

### **6.3 Test Leaderboard API**
```bash
curl http://localhost:3001/api/leaderboard
```

Should return top player sessions!

---

## 📊 **API Endpoints**

### **Session Management**
```
POST   /api/session              - Create new session
PUT    /api/session/:id          - Update session
GET    /api/session/:id          - Get session
GET    /api/session/player/:id   - Get player sessions
POST   /api/session/:id/movement - Log movement
POST   /api/session/:id/decision - Log decision
POST   /api/session/:id/voice    - Log voice event
```

### **Leaderboard**
```
GET    /api/leaderboard           - Global leaderboard
GET    /api/leaderboard/today     - Today's leaderboard
GET    /api/leaderboard/environment/:env - Environment leaderboard
POST   /api/leaderboard/friends   - Friends leaderboard
GET    /api/leaderboard/stats     - Overall statistics
```

### **Dataset Export**
```
GET    /api/dataset/export     - Export raw dataset
GET    /api/dataset/ml-ready   - Export ML-ready format
GET    /api/dataset/voice      - Export voice logs
GET    /api/dataset/stats      - Dataset statistics
```

---

## 🎯 **Step 7: Export ML Dataset**

### **7.1 From Browser**
When a game ends, open console and run:
```javascript
await mongoService.exportMLDataset();
```

### **7.2 From API**
```bash
curl http://localhost:3001/api/dataset/ml-ready > dataset.json
```

### **7.3 Dataset Format**
```json
{
  "metadata": {
    "format": "ml-ready",
    "exported_at": "2024-01-10T12:00:00.000Z",
    "total_samples": 150,
    "features": ["trajectory", "actions", "sensors"],
    "labels": ["score", "victims_saved"]
  },
  "data": [
    {
      "session_id": "reacture_1704888000000",
      "player_id": "john_doe",
      "environment": "earthquake",
      "trajectory": [...],
      "actions": [...],
      "sensors": [...],
      "score": 850,
      "victims_saved": 7
    }
  ]
}
```

---

## 🔧 **Troubleshooting**

### **Connection Issues**

**Problem:** `MongoServerError: bad auth`
```
Solution:
- Check username/password in MONGODB_URI
- Ensure user has correct permissions
- Password might need URL encoding (replace special chars)
```

**Problem:** `MongoServerError: connect ECONNREFUSED`
```
Solution:
- Check Network Access whitelist in Atlas
- Ensure IP address is allowed
- Try "Allow from Anywhere" for testing
```

**Problem:** `MongoDB backend not available`
```
Solution:
- Ensure backend server is running on port 3001
- Check if CORS is enabled
- Verify MONGODB_URI in .env
```

### **Frontend Issues**

**Problem:** Data not saving to MongoDB
```
Solution:
- Check browser console for errors
- Verify mongoService.enabled is true
- Ensure backend server is running
- Check CORS configuration
```

**Problem:** Leaderboard not showing
```
Solution:
- Play at least one complete game first
- Check API endpoint: http://localhost:3001/api/leaderboard
- Verify MongoDB has data: Browse Collections in Atlas
```

---

## 🌟 **Advanced Features**

### **Data Mode Toggle**
Enable/disable MongoDB logging:
```javascript
// In browser console
mongoService.toggleDataMode(false); // Disable
mongoService.toggleDataMode(true);  // Enable
```

### **Custom Queries**
Query specific data:
```javascript
// Get player's sessions
const sessions = await fetch('http://localhost:3001/api/session/player/john_doe')
  .then(r => r.json());

// Get earthquake leaderboard
const leaderboard = await fetch('http://localhost:3001/api/leaderboard/environment/earthquake')
  .then(r => r.json());
```

### **Batch Export**
Export all data:
```bash
# Raw dataset
curl http://localhost:3001/api/dataset/export > raw_dataset.json

# ML-ready format
curl http://localhost:3001/api/dataset/ml-ready > ml_dataset.json

# Voice logs
curl http://localhost:3001/api/dataset/voice > voice_logs.json
```

---

## 📈 **Monitoring**

### **Dataset Statistics**
```bash
curl http://localhost:3001/api/dataset/stats
```

Returns:
```json
{
  "success": true,
  "stats": {
    "sessions": 150,
    "voiceLogs": 1250,
    "totalMovementPoints": [{"_id": null, "total": 45000}],
    "totalDecisions": [{"_id": null, "total": 2100}],
    "byEnvironment": [
      {"_id": "earthquake", "count": 50},
      {"_id": "tsunami", "count": 45},
      {"_id": "wildfire", "count": 55}
    ]
  }
}
```

---

## 🎓 **Next Steps**

1. ✅ **Visualize Data** - Create dashboard with Chart.js
2. ✅ **Real-time Updates** - Add WebSocket support
3. ✅ **ML Training** - Use exported datasets for robotics AI
4. ✅ **Analytics** - Build custom queries and reports
5. ✅ **Scale** - Upgrade Atlas tier as data grows

---

## 📚 **Resources**

- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [Express.js Docs](https://expressjs.com/)
- [ReActure GitHub](https://github.com/yourrepo/reacture)

---

## 🤝 **Support**

Having issues? Check:
1. MongoDB Atlas dashboard - is cluster running?
2. Backend server logs - any errors?
3. Browser console - MongoDB connected?
4. Network tab - API calls succeeding?

**Still stuck?** Create an issue on GitHub!

---

## ✅ **Quick Verification Checklist**

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with correct permissions
- [ ] Network access configured (IP whitelist)
- [ ] Connection string copied and password replaced
- [ ] .env file created with MONGODB_URI
- [ ] Backend dependencies installed (`npm install`)
- [ ] Backend server running (`npm start`)
- [ ] Frontend server running (`python3 -m http.server 8000`)
- [ ] Browser console shows "MongoDB connected"
- [ ] Played a complete game
- [ ] Data visible in MongoDB Atlas Browse Collections
- [ ] Leaderboard API returns data
- [ ] ML dataset exported successfully

**If all checked, you're ready to go!** 🎉

---

**🍃 MongoDB + 🤖 ReActure = 📊 ML-Ready Robotics Dataset**

