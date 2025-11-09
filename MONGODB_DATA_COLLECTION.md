# 🍃 MongoDB Data Collection - Complete!

## ✅ **All Sensor Data Now Being Sent!**

Your gameplay data is now being collected and sent to MongoDB Atlas with **full 10Hz sensor readings**, movement paths, and player decisions!

---

## 📊 **What Gets Sent to MongoDB**

### **When Game Starts** (`initGame`):
```javascript
{
  playerId: "hihihi",
  playerName: "Hi Hi Hi",
  sessionId: "reacture_1699999999999",
  environment: "earthquake",
  victimsTotal: 10,
  movementPath: [],
  decisions: [],
  sensorData: []
}
```

### **When Game Ends** (`endGame`):
```javascript
{
  // Performance metrics
  score: 1250,
  victimsSaved: 8,
  victimsDied: 2,
  victimsTotal: 10,
  rubbleDestroyed: 15,
  finalHealth: 75,
  finalFuel: 40,
  duration: 165,  // seconds
  completedChallenge: true,
  challengeType: "REACT TIME: Tokyo Earthquake",
  
  // ✨ 10Hz Sensor Data (NEW!)
  sensorData: [
    {
      timestamp: 100,
      accelerometer: { x: 0.14, y: 0.0, z: 0.05 },
      battery: 100,
      damage: 0,
      proximity: 8.2,
      keyPresses: { W: true, A: false, S: false, D: false, ... }
    },
    {
      timestamp: 200,
      accelerometer: { x: 0.18, y: 0.0, z: 0.07 },
      battery: 99.8,
      damage: 0,
      proximity: 7.5,
      keyPresses: { W: true, A: false, S: false, D: false, ... }
    },
    // ... hundreds more samples (10 per second)
  ],
  
  // ✨ Movement Path (NEW! - sampled at 1Hz)
  movementPath: [
    {
      position: { x: 0, y: 1.5, z: 0 },
      rotation: { yaw: 0, pitch: 0 },
      timestamp: 0
    },
    {
      position: { x: 1.2, y: 1.5, z: 0.5 },
      rotation: { yaw: 0.3, pitch: -0.1 },
      timestamp: 1000
    },
    // ... one point per second
  ],
  
  // ✨ Player Decisions (NEW!)
  decisions: [
    {
      type: "inspect",
      position: { x: 5, y: 1, z: 3 },
      timestamp: 2000,
      success: true,
      metadata: { action: "inspect_activated" }
    },
    {
      type: "rescue",
      position: { x: 5.1, y: 1, z: 3.2 },
      timestamp: 3500,
      success: true,
      metadata: { victimHealth: 85 }
    },
    {
      type: "destroy_rubble",
      position: { x: 4.5, y: 1, z: 2.8 },
      timestamp: 1500,
      success: true
    }
  ]
}
```

---

## 📈 **Data Collection Rate**

### **Sensor Data** (10Hz):
- **Frequency**: 10 samples per second
- **Total samples**: ~1,650 for a 3-minute game
- **Data collected**:
  - Accelerometer (x, y, z)
  - Battery level
  - Damage accumulated
  - Proximity sensor
  - Key presses (WASD, Space, E, etc.)

### **Movement Path** (1Hz - Sampled):
- **Frequency**: 1 sample per second (downsampled from 10Hz for efficiency)
- **Total samples**: ~165 for a 3-minute game
- **Data collected**:
  - 3D position (x, y, z)
  - Camera rotation (yaw, pitch)
  - Timestamp

### **Player Decisions** (Event-based):
- **Frequency**: Whenever player takes action
- **Total samples**: 10-50 per game (depending on playstyle)
- **Actions tracked**:
  - **Inspect** (E key - infrared scan)
  - **Rescue** (Mouse click - save victim)
  - **Destroy Rubble** (Space key - clear debris)

---

## 🎯 **Example MongoDB Document**

After playing a 2-minute game:

```json
{
  "_id": "691058bb79b4bcb43919a62c",
  "playerId": "hihihi",
  "playerName": "Hi Hi Hi",
  "sessionId": "reacture_1699999999999",
  "environment": "earthquake",
  
  "score": 1250,
  "victimsSaved": 8,
  "victimsTotal": 10,
  "victimsDied": 2,
  "finalHealth": 75,
  "finalFuel": 40,
  "duration": 120,
  
  "completedChallenge": true,
  "challengeType": "REACT TIME: Tokyo Earthquake",
  
  "sensorData": [
    // ~1,200 samples (120 seconds × 10 Hz)
    { "timestamp": 100, "accelerometer": {...}, "battery": 100, ... },
    { "timestamp": 200, "accelerometer": {...}, "battery": 99.9, ... },
    ...
  ],
  
  "movementPath": [
    // ~120 samples (120 seconds × 1 Hz)
    { "position": {...}, "rotation": {...}, "timestamp": 0 },
    { "position": {...}, "rotation": {...}, "timestamp": 1000 },
    ...
  ],
  
  "decisions": [
    // ~25 actions
    { "type": "inspect", "position": {...}, "timestamp": 2000, "success": true },
    { "type": "rescue", "position": {...}, "timestamp": 5000, "success": true },
    { "type": "destroy_rubble", "position": {...}, "timestamp": 1500, "success": true },
    ...
  ],
  
  "createdAt": "2025-11-09T09:30:00.000Z",
  "updatedAt": "2025-11-09T09:32:00.000Z"
}
```

---

## 🧪 **Test It Now**

### **Step 1: Refresh Browser**
```
Cmd + Shift + R
```

### **Step 2: Play a Complete Game**
1. Sign in as "hihihi"
2. Select any environment
3. Play for at least 30 seconds
4. Use **E** to inspect
5. **Click** to rescue victims
6. **Space** to destroy rubble
7. Complete or let game end

### **Step 3: Watch Console**
When game ends, you should see:
```
📊 Data Summary:
   - Sensor samples: 300 (10.0 Hz)
   - Movement points: 30
   - Player decisions: 12
   - Visual frames: 300
✅ MongoDB session uploaded!
   📈 Uploaded data:
      -  300 sensor readings (10Hz)
      -  30 movement points (1Hz)
      -  12 player decisions
   🍃 Check MongoDB Atlas → reacture → playersessions
```

### **Step 4: Check MongoDB Atlas**
1. Go to **cloud.mongodb.com**
2. **Browse Collections**
3. Database: **`reacture`**
4. Collection: **`playersessions`**
5. **Click on the newest document**
6. **Expand the arrays**:
   - `sensorData` - Should have hundreds of entries!
   - `movementPath` - Should have dozens of entries!
   - `decisions` - Should have your actions!

---

## 📊 **Data Breakdown**

### **What Each Array Contains**:

#### **sensorData** (10Hz):
```javascript
[
  {
    timestamp: 100,           // ms since game start
    accelerometer: {
      x: 0.14,               // m/s²
      y: 0.0,
      z: 0.05
    },
    battery: 100,            // percentage
    damage: 0,               // accumulated damage
    proximity: 8.2,          // meters to nearest object
    keyPresses: {
      W: true,               // moving forward
      A: false,
      S: false,
      D: false,
      Space: false,
      E: false
    }
  },
  // ... 10 samples per second
]
```

#### **movementPath** (1Hz):
```javascript
[
  {
    position: { x: 0, y: 1.5, z: 0 },
    rotation: { yaw: 0, pitch: 0 },
    timestamp: 0
  },
  {
    position: { x: 1.2, y: 1.5, z: 0.5 },
    rotation: { yaw: 0.3, pitch: -0.1 },
    timestamp: 1000
  },
  // ... 1 sample per second
]
```

#### **decisions** (Event-based):
```javascript
[
  {
    type: "inspect",
    position: { x: 5, y: 1, z: 3 },
    timestamp: 2000,
    success: true,
    metadata: { action: "inspect_activated" }
  },
  {
    type: "rescue",
    position: { x: 5.1, y: 1, z: 3.2 },
    timestamp: 3500,
    success: true,
    metadata: { victimHealth: 85 }
  },
  {
    type: "destroy_rubble",
    position: { x: 4.5, y: 1, z: 2.8 },
    timestamp: 1500,
    success: true
  }
]
```

---

## 🔍 **Verify in MongoDB Atlas**

### **Navigate to Your Data**:
1. MongoDB Atlas Dashboard
2. Database Deployments → Cluster0
3. Collections → Browse Collections
4. Database dropdown → **`reacture`**
5. Collection dropdown → **`playersessions`**

### **Find Your Session**:
Look for:
- `playerId: "hihihi"`
- Latest `createdAt` timestamp
- Click to expand

### **Check Arrays**:
- Click ▶️ next to `sensorData` → Should show hundreds of objects!
- Click ▶️ next to `movementPath` → Should show dozens of points!
- Click ▶️ next to `decisions` → Should show your actions!

---

## 📈 **Expected Sizes**

For a typical game:

| Duration | sensorData | movementPath | decisions |
|----------|------------|--------------|-----------|
| 30 sec | ~300 samples | ~30 points | ~5-15 actions |
| 1 min | ~600 samples | ~60 points | ~10-25 actions |
| 3 min | ~1,800 samples | ~180 points | ~25-50 actions |
| 5 min | ~3,000 samples | ~300 points | ~40-80 actions |

---

## 🎯 **What Changed**

### **Before**:
```javascript
sensorData: []        // ❌ Empty
movementPath: []      // ❌ Empty
decisions: []         // ❌ Empty
```

### **After**:
```javascript
sensorData: [        // ✅ Hundreds of samples!
  {timestamp, accelerometer, battery, damage, proximity, keyPresses},
  ...
],
movementPath: [      // ✅ Dozens of positions!
  {position, rotation, timestamp},
  ...
],
decisions: [         // ✅ All your actions!
  {type: "inspect", position, timestamp, success},
  {type: "rescue", position, timestamp, success},
  {type: "destroy_rubble", position, timestamp, success},
  ...
]
```

---

## 🚀 **Test Right Now**

```javascript
// In browser console after a game:
console.log('Sensor data points:', gameState.logs.length);
console.log('Sample log:', gameState.logs[0]);
```

Should show lots of data!

---

## ✅ **Summary**

**What you now have in MongoDB**:
- ✅ **10Hz sensor data** (accelerometer, battery, damage, proximity, keys)
- ✅ **1Hz movement path** (position + rotation)
- ✅ **Player decisions** (inspect, rescue, destroy)
- ✅ **Performance metrics** (score, victims, health, fuel)
- ✅ **Challenge tracking** (completion status, type)

**Perfect for**:
- 🤖 ML training (behavior cloning)
- 📊 Player analytics
- 🎮 Strategy analysis
- 🏆 Leaderboard rankings
- 📈 Research datasets

---

**Play a game now and check MongoDB Atlas - the arrays will be FULL of data!** 🍃📊

**Console will show you exactly how many samples were uploaded!** 🔍

