# 🍃 ReActure × MongoDB Atlas Integration

**Transform ReActure into an ML-Ready Robotics Data Collection Platform**

---

## 🎯 **What This Is**

A complete MongoDB Atlas integration that turns ReActure from a game into a **production-grade robotics dataset collection system**:

- ✅ **Real-time player session storage** (movements, decisions, sensor data)
- ✅ **Cloud-powered leaderboards** (global, friends, daily)
- ✅ **ML-ready dataset exports** (robotics AI training)
- ✅ **Voice event logging** (human-robot interaction data)
- ✅ **10Hz data collection** (high-frequency spatial tracking)
- ✅ **Production-ready** (MongoDB Atlas cloud infrastructure)

---

## 📁 **What's Included**

```
ReActure-1/
├── server/                           # MongoDB Atlas Backend
│   ├── lib/
│   │   └── dbConnect.js             # Atlas connection handler
│   ├── models/
│   │   ├── PlayerSession.js         # Main session schema
│   │   └── VoiceLog.js              # Voice events schema
│   ├── routes/
│   │   ├── session.js               # Session CRUD API
│   │   ├── leaderboard.js           # Leaderboard queries
│   │   └── dataset.js               # ML dataset export
│   ├── server.js                    # Express server
│   └── package.json                 # Backend dependencies
│
├── mongoService.js                   # Frontend MongoDB client
├── MONGODB_SETUP.md                  # Complete setup guide
├── MONGODB_INTEGRATION_SUMMARY.md    # API reference
├── GAME_INTEGRATION_EXAMPLE.md       # Code integration guide
└── MONGODB_README.md                 # This file
```

---

## 🚀 **Quick Start (5 Minutes)**

### **Step 1: MongoDB Atlas Setup**
```bash
1. Go to mongodb.com/cloud/atlas
2. Create FREE account
3. Create M0 (FREE) cluster
4. Create database user
5. Whitelist IP (or allow all)
6. Copy connection string
```

### **Step 2: Install Backend**
```bash
cd server
npm install
echo 'MONGODB_URI=your-connection-string' > .env
npm start
```

### **Step 3: Run Game**
```bash
cd ..
python3 -m http.server 8000
```

### **Step 4: Verify**
```
Open: http://localhost:8000
Console should show: ✅ MongoDB Atlas backend connected
Play a game
Check MongoDB Atlas → Browse Collections
```

✅ **Done!** Data is now being collected!

---

## 📊 **What Gets Collected**

### **Complete Player Sessions**
Every game session captures:

#### **Spatial Data (10Hz)**
- Robot position (x, y, z) every 100ms
- Camera rotation (yaw, pitch)
- Movement trajectory
- 3D path through disaster zone

#### **Decision Data**
- Inspect actions (infrared scan)
- Rescue attempts (success/failure)
- Rubble destruction
- Refuel events
- Timestamps and locations

#### **Sensor Data (10Hz)**
- Accelerometer readings
- Battery level
- Damage accumulation
- Proximity sensors
- Key presses

#### **Performance Metrics**
- Final score
- Victims saved/died
- Health/fuel remaining
- Completion time
- Resilience index (auto-calculated)

#### **Voice Events**
- Narration triggers
- Event types
- Context (position, robot state)
- Timestamps

---

## 🎮 **Integration Points**

The system hooks into your game at key points:

1. **Game Start** → Create MongoDB session
2. **Every 100ms** → Log movement and sensors
3. **Player Actions** → Log decisions (inspect, rescue, destroy)
4. **Voice Events** → Log narration
5. **Game End** → Finalize session with results

**Zero impact on gameplay performance!** All network calls are batched and async.

---

## 📈 **Use Cases**

### **1. Robotics AI Training**
```
Export spatial navigation data
→ Train path planning models
→ Learn obstacle avoidance
→ Optimize rescue strategies
```

### **2. Human-in-the-Loop Learning**
```
Collect human decisions
→ Train behavior cloning
→ Learn from expert players
→ Validate AI policies
```

### **3. Player Analytics**
```
Track learning curves
→ Identify optimal strategies
→ Measure adaptation
→ Personalize difficulty
```

### **4. Competitive Platform**
```
Real-time leaderboards
→ Global rankings
→ Friends competitions
→ Daily challenges
```

---

## 🔌 **API Endpoints**

### **Sessions**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/session` | POST | Create new session |
| `/api/session/:id` | PUT | Update session |
| `/api/session/:id` | GET | Get session details |
| `/api/session/:id/movement` | POST | Log movement |
| `/api/session/:id/decision` | POST | Log decision |

### **Leaderboards**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/leaderboard` | GET | Global leaderboard |
| `/api/leaderboard/today` | GET | Today's top players |
| `/api/leaderboard/friends` | POST | Friends rankings |
| `/api/leaderboard/stats` | GET | Overall statistics |

### **Dataset Export**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dataset/export` | GET | Raw JSON export |
| `/api/dataset/ml-ready` | GET | ML-formatted export |
| `/api/dataset/voice` | GET | Voice logs export |

---

## 💾 **Data Schema**

### **PlayerSession**
```javascript
{
  // Identity
  playerId: "john_doe",
  playerName: "John Doe",
  sessionId: "reacture_1704888000000",
  environment: "earthquake",
  
  // Spatial tracking (10Hz)
  movementPath: [
    { position: {x,y,z}, rotation: {yaw,pitch}, timestamp }
  ],
  
  // Decision tracking
  decisions: [
    { type: "rescue", position: {x,y,z}, success: true, timestamp }
  ],
  
  // Sensor data (10Hz)
  sensorData: [
    { accelerometer: {x,y,z}, battery, damage, timestamp }
  ],
  
  // Performance
  score: 850,
  victimsSaved: 7,
  finalHealth: 75,
  resilienceIndex: 85.5,  // Auto-calculated
  
  // Metadata
  duration: 180,  // seconds
  createdAt: Date,
  completedChallenge: true
}
```

### **VoiceLog**
```javascript
{
  sessionId: "reacture_1704888000000",
  event: "victim_rescued",
  text: "Great job! Victim rescued.",
  context: { position: {x,y,z}, robotHealth: 75 },
  timestamp: 1234567890
}
```

---

## 🎯 **ML Dataset Format**

Exported datasets are ML-ready:

```json
{
  "metadata": {
    "format": "ml-ready",
    "features": ["trajectory", "actions", "sensors"],
    "labels": ["score", "victims_saved"]
  },
  "data": [
    {
      "trajectory": [
        {"x": 0, "y": 1.5, "z": 0, "t": 1000}
      ],
      "actions": [
        {"type": "rescue", "x": 5, "y": 1, "z": 3, "success": true}
      ],
      "sensors": [
        {"accel_x": 0.1, "battery": 100, "t": 1000}
      ],
      "score": 850,
      "victims_saved": 7
    }
  ]
}
```

**Perfect for:**
- PyTorch DataLoaders
- TensorFlow Datasets
- scikit-learn pipelines
- Custom robotics models

---

## 🏆 **Why This Qualifies**

### **For MongoDB Track**

✅ **Uses Atlas as Central Infrastructure**
- All data stored in cloud
- Production-ready deployment
- Scalable from day one

✅ **Advanced Data Modeling**
- Complex nested documents
- Time-series data
- Spatial 3D coordinates
- Aggregation pipelines

✅ **Cloud-First Architecture**
- MongoDB Atlas integration
- RESTful API design
- Real-time queries
- Global accessibility

✅ **Real-World Use Case**
- Robotics dataset collection
- ML training pipeline
- Player analytics
- Competition platform

✅ **Data at Scale**
- 10Hz sensor collection
- Thousands of data points per session
- Batch processing
- Efficient queries

---

## 📚 **Documentation**

| Document | Purpose |
|----------|---------|
| `MONGODB_SETUP.md` | Complete setup guide (step-by-step) |
| `MONGODB_INTEGRATION_SUMMARY.md` | API reference and schemas |
| `GAME_INTEGRATION_EXAMPLE.md` | Code integration examples |
| `MONGODB_README.md` | This overview |

---

## 🔧 **Technology Stack**

### **Backend**
- Node.js + Express
- Mongoose ODM
- MongoDB Atlas (cloud database)
- CORS for cross-origin
- RESTful architecture

### **Frontend**
- Vanilla JavaScript (ES6 modules)
- Async/await for network calls
- Batch processing
- Error handling

### **Database**
- MongoDB Atlas M0 (FREE tier)
- Indexes for performance
- Aggregation pipelines
- Time-series optimization

---

## 🎓 **Getting Started Path**

1. **Setup** (5 min) → Follow `MONGODB_SETUP.md`
2. **Test** (2 min) → Play a game, verify data
3. **Integrate** (15 min) → Add calls to `game.js` using `GAME_INTEGRATION_EXAMPLE.md`
4. **Export** (1 min) → Download ML dataset
5. **Build** (∞) → Create visualizations, train models, analyze data!

---

## 🚀 **Quick Commands**

### **Start Everything**
```bash
# Terminal 1: Backend
cd server && npm start

# Terminal 2: Frontend
cd .. && python3 -m http.server 8000
```

### **Check Status**
```bash
# Backend health
curl http://localhost:3001/health

# Leaderboard
curl http://localhost:3001/api/leaderboard

# Dataset stats
curl http://localhost:3001/api/dataset/stats
```

### **Export Dataset**
```bash
# ML-ready format
curl http://localhost:3001/api/dataset/ml-ready > dataset.json

# Or from browser console
await mongoService.exportMLDataset();
```

---

## 🌟 **Key Features**

| Feature | Description | Status |
|---------|-------------|--------|
| **Real-time Logging** | 10Hz data collection | ✅ |
| **Cloud Storage** | MongoDB Atlas | ✅ |
| **ML Exports** | Pre-formatted datasets | ✅ |
| **Leaderboards** | Multiple ranking types | ✅ |
| **Batch Processing** | Network optimization | ✅ |
| **Voice Logging** | HRI data collection | ✅ |
| **Data Mode Toggle** | Enable/disable on demand | ✅ |
| **RESTful API** | Standard HTTP endpoints | ✅ |
| **Scalable** | Free → Production | ✅ |

---

## 🐛 **Troubleshooting**

### **Backend won't start**
```bash
# Check MongoDB URI
cat server/.env
# Should have valid connection string

# Test connection manually
node -e "import('mongoose').then(m => m.default.connect('YOUR_URI').then(() => console.log('✅ Connected')).catch(e => console.error('❌', e)))"
```

### **Frontend can't connect**
```bash
# Check backend is running
curl http://localhost:3001/health

# Check CORS
# Backend should have cors() middleware

# Check browser console for errors
```

### **No data in MongoDB**
```
1. Ensure mongoService.enabled = true
2. Check browser console for errors
3. Verify session was created
4. Check batch is flushing
5. Look at Network tab for API calls
```

---

## 📊 **Example Queries**

### **Top 10 Players**
```bash
curl http://localhost:3001/api/leaderboard?limit=10
```

### **Today's Leaders**
```bash
curl http://localhost:3001/api/leaderboard/today
```

### **Earthquake Masters**
```bash
curl http://localhost:3001/api/leaderboard/environment/earthquake
```

### **Export All Data**
```bash
curl http://localhost:3001/api/dataset/export?limit=1000 > all_sessions.json
```

---

## 🎉 **Success Criteria**

You've successfully integrated MongoDB Atlas when:

- [ ] Backend starts without errors
- [ ] Frontend console shows "MongoDB connected"
- [ ] Playing a game creates data in Atlas
- [ ] Leaderboard shows real data from Atlas
- [ ] Dataset exports successfully
- [ ] API endpoints respond correctly

---

## 🔥 **Next Steps**

1. **Visualize** → Build dashboard with Chart.js
2. **Train** → Use datasets for ML models
3. **Analyze** → Study player behaviors
4. **Compete** → Launch competitions
5. **Scale** → Upgrade Atlas tier
6. **Publish** → Share datasets with research community

---

## 🤝 **Support**

- **Setup Issues?** → See `MONGODB_SETUP.md` troubleshooting section
- **Integration Help?** → Check `GAME_INTEGRATION_EXAMPLE.md`
- **API Questions?** → Reference `MONGODB_INTEGRATION_SUMMARY.md`

---

## 📜 **License**

MIT License - Use this integration freely in your projects!

---

## 🙏 **Credits**

Built with:
- MongoDB Atlas (cloud database)
- Express.js (web framework)
- Mongoose (MongoDB ODM)
- Three.js (3D graphics)
- ReActure (disaster response simulation)

---

**🍃 MongoDB Atlas + 🤖 ReActure = 📊 Production-Ready Robotics Dataset Platform**

**Ready to collect data at scale!** 🚀

*Questions? Check the documentation files or create an issue!*

