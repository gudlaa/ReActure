# 🍃 MongoDB Atlas Integration - Quick Summary

## ✅ **What's Been Created**

### **Backend (Node.js + Express + MongoDB)**
```
server/
├── lib/
│   └── dbConnect.js          # MongoDB Atlas connection handler
├── models/
│   ├── PlayerSession.js      # Player session schema
│   └── VoiceLog.js           # Voice event schema
├── routes/
│   ├── session.js            # Session CRUD endpoints
│   ├── leaderboard.js        # Leaderboard queries
│   └── dataset.js            # ML dataset export
├── server.js                 # Express server main file
└── package.json              # Backend dependencies
```

### **Frontend Integration**
```
mongoService.js               # MongoDB API client service
MONGODB_SETUP.md              # Complete setup guide
```

---

## 🚀 **Quick Start**

### **1. Set Up MongoDB Atlas** (5 minutes)
1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster (FREE tier M0)
3. Create database user
4. Whitelist IP (or allow all for dev)
5. Get connection string

### **2. Configure Backend**
```bash
cd server
npm install
echo 'MONGODB_URI=your-connection-string-here' > .env
npm start
```

### **3. Start Frontend**
```bash
cd ..
python3 -m http.server 8000
```

### **4. Play & Verify**
- Open `http://localhost:8000`
- Play a game
- Check MongoDB Atlas → Browse Collections

---

## 📊 **What Gets Stored**

### **PlayerSession Collection**
```javascript
{
  playerId: "john_doe",
  playerName: "John Doe",
  sessionId: "reacture_1704888000000",
  environment: "earthquake",
  
  // Spatial data
  movementPath: [
    { position: {x,y,z}, rotation: {yaw,pitch}, timestamp }
  ],
  
  // Decision data  
  decisions: [
    { type: "rescue", position: {x,y,z}, timestamp, success: true }
  ],
  
  // Performance
  score: 850,
  victimsSaved: 7,
  victimsTotal: 10,
  finalHealth: 75,
  finalFuel: 40,
  
  // 10Hz sensor data
  sensorData: [
    { timestamp, accelerometer: {x,y,z}, battery, damage, proximity, keyPresses }
  ],
  
  // ML metrics
  resilienceIndex: 85.5,
  adaptationScore: 78.2,
  
  createdAt: Date
}
```

### **VoiceLog Collection**
```javascript
{
  sessionId: "reacture_1704888000000",
  playerId: "john_doe",
  event: "victim_rescued",
  text: "Great job! Victim rescued safely.",
  voiceId: "default",
  context: { position: {x,y,z}, robotHealth: 75, ... },
  timestamp: 1234567890,
  createdAt: Date
}
```

---

## 🔌 **API Endpoints Reference**

### **Session Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/session` | Create new session |
| PUT | `/api/session/:id` | Update session |
| GET | `/api/session/:id` | Get session details |
| GET | `/api/session/player/:id` | Get player's sessions |
| POST | `/api/session/:id/movement` | Log movement point |
| POST | `/api/session/:id/decision` | Log decision |
| POST | `/api/session/:id/voice` | Log voice event |

### **Leaderboard**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Global leaderboard |
| GET | `/api/leaderboard?type=resilience` | Resilience leaderboard |
| GET | `/api/leaderboard/today` | Today's top players |
| GET | `/api/leaderboard/environment/earthquake` | Environment-specific |
| POST | `/api/leaderboard/friends` | Friends-only leaderboard |
| GET | `/api/leaderboard/stats` | Overall statistics |

### **Dataset Export**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dataset/export` | Export raw dataset (JSON) |
| GET | `/api/dataset/ml-ready` | Export ML-ready format |
| GET | `/api/dataset/voice` | Export voice logs |
| GET | `/api/dataset/stats` | Get dataset statistics |

---

## 💻 **Frontend Integration**

### **1. Import Service** (Add to index.html)
```html
<script type="module" src="mongoService.js"></script>
```

### **2. Use in game.js**
```javascript
import mongoService from './mongoService.js';

// Game start
const session = await mongoService.createSession({
  playerId: userManager.currentUser.username,
  playerName: userManager.currentUser.displayName,
  sessionId: 'reacture_' + Date.now(),
  environment: gameState.environment,
  victimsTotal: victims.length
});

// During gameplay (every 10Hz or on events)
mongoService.logMovement({
  position: { x, y, z },
  rotation: { yaw, pitch },
  timestamp: Date.now()
});

mongoService.logDecision({
  type: 'rescue',
  position: { x, y, z },
  timestamp: Date.now(),
  success: true
});

// Game end
await mongoService.finalizeSession({
  score: gameState.score,
  victimsSaved: gameState.victimsSaved,
  finalHealth: robotState.health,
  finalFuel: robotState.fuel,
  duration: gameState.elapsedTime
});
```

### **3. Leaderboard Display**
```javascript
// Global leaderboard
const leaderboard = await mongoService.getLeaderboard('score', 10);

// Friends leaderboard
const friendIds = userManager.currentUser.friends;
const friendsBoard = await mongoService.getFriendsLeaderboard(friendIds);

// Display
leaderboard.forEach((entry, i) => {
  console.log(`#${i+1}: ${entry.playerName} - ${entry.score} pts`);
});
```

### **4. Export ML Dataset**
```javascript
// From browser console or button click
await mongoService.exportMLDataset();
// Downloads: reacture_ml_dataset_<timestamp>.json
```

---

## 📈 **ML Dataset Format**

### **Exported Structure**
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
      
      "trajectory": [
        { "x": 0, "y": 1.5, "z": 0, "yaw": 0, "pitch": 0, "t": 1000 },
        { "x": 1.2, "y": 1.5, "z": 0.5, "yaw": 0.3, "pitch": -0.1, "t": 1100 }
      ],
      
      "actions": [
        { "type": "inspect", "x": 5, "y": 1, "z": 3, "t": 2000, "success": true },
        { "type": "rescue", "x": 5.1, "y": 1, "z": 3.2, "t": 3000, "success": true }
      ],
      
      "sensors": [
        { "t": 1000, "accel_x": 0.1, "accel_y": 0, "accel_z": 0.05, "battery": 100, "damage": 0, "proximity": 8.2 }
      ],
      
      "score": 850,
      "victims_saved": 7
    }
  ]
}
```

---

## 🎯 **Use Cases**

### **1. Robotics AI Training**
- Train path planning models with `trajectory` data
- Learn rescue strategies from `actions` sequences
- Predict outcomes from `sensors` readings

### **2. Player Analytics**
- Identify optimal strategies
- Track learning curves
- Measure adaptation to challenges

### **3. Leaderboards & Competition**
- Real-time global rankings
- Friends-only competitions
- Environment-specific challenges

### **4. Research & Development**
- Collect human-in-the-loop data
- Study decision-making patterns
- Validate AI models

---

## 🔥 **Key Features**

✅ **Real-time Data Collection** - Every movement, decision, and sensor reading  
✅ **Cloud Storage** - Persistent data in MongoDB Atlas  
✅ **ML-Ready Exports** - Pre-formatted for training  
✅ **Leaderboards** - Multiple ranking systems  
✅ **Batch Processing** - Efficient network usage  
✅ **Data Mode Toggle** - Enable/disable on demand  
✅ **RESTful API** - Standard HTTP endpoints  
✅ **Scalable** - Free tier → production ready  

---

## 🧪 **Testing**

### **Test Backend Connection**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok",...}
```

### **Test Session Creation**
```bash
curl -X POST http://localhost:3001/api/session \
  -H "Content-Type: application/json" \
  -d '{"playerId":"test","playerName":"Test","sessionId":"test123","environment":"earthquake","victimsTotal":5}'
```

### **Test Leaderboard**
```bash
curl http://localhost:3001/api/leaderboard
# Should return array of top sessions
```

### **Test Dataset Export**
```bash
curl http://localhost:3001/api/dataset/ml-ready > dataset.json
# Downloads ML-ready dataset
```

---

## 📚 **Documentation**

- **Complete Setup**: See `MONGODB_SETUP.md`
- **API Reference**: See server routes in `server/routes/`
- **Schema Details**: See `server/models/`

---

## 🏆 **Why This Qualifies for MongoDB Track**

1. ✅ **Uses Atlas as Central Infrastructure**
   - All game data stored in cloud
   - Real-time queries and analytics
   - Scalable from free tier to production

2. ✅ **Advanced Data Modeling**
   - Complex nested documents (paths, sensors)
   - Time-series data at 10Hz
   - Spatial data with 3D coordinates

3. ✅ **Cloud-First Architecture**
   - MongoDB Atlas integration
   - RESTful API design
   - Production-ready setup

4. ✅ **Real-World Use Case**
   - Robotics dataset collection
   - ML training data pipeline
   - Player analytics platform

5. ✅ **Data at Scale**
   - Handles thousands of data points per session
   - Batching for efficiency
   - Aggregation pipelines for analytics

---

## 🎓 **Next Steps**

1. **Run Setup**: Follow `MONGODB_SETUP.md`
2. **Integrate Frontend**: Add mongoService calls to game.js
3. **Test**: Play games and verify data in Atlas
4. **Export**: Download ML datasets
5. **Build**: Create visualizations and dashboards
6. **Scale**: Upgrade Atlas tier as needed

---

**🍃 Ready to collect robotics training data at scale with MongoDB Atlas!**

**Questions?** Check `MONGODB_SETUP.md` for troubleshooting!

