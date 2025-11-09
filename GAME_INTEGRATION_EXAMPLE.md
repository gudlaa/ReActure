# 🎮 Game.js Integration Example

This file shows exactly where and how to integrate MongoDB calls into your existing `game.js` file.

---

## 1️⃣ **Add Import** (Top of game.js)

```javascript
import * as THREE from 'three';
import mongoService from './mongoService.js';  // ← ADD THIS

// Rest of your imports...
```

---

## 2️⃣ **Initialize Session** (In `initGame()` function)

Find where your game initializes and add:

```javascript
async function initGame(environment) {
    gameState.environment = environment;
    gameState.startTime = Date.now();
    // ... existing code ...
    
    // ← ADD THIS: Initialize MongoDB session
    if (userManager.currentUser && mongoService.enabled) {
        const sessionId = 'reacture_' + Date.now();
        await mongoService.createSession({
            playerId: userManager.currentUser.username,
            playerName: userManager.currentUser.displayName,
            sessionId: sessionId,
            environment: environment,
            victimsTotal: victims.length
        });
        console.log('📊 MongoDB session started:', sessionId);
    }
    
    // ... rest of initialization ...
}
```

---

## 3️⃣ **Log Movement** (In your game loop or movement function)

Find where robot position is updated and add periodic logging:

```javascript
// In your animate() or update() function
function animate() {
    // ... existing code ...
    
    // ← ADD THIS: Log movement every 100ms (10Hz)
    if (gameState.isPlaying && !gameState.isPaused) {
        const now = Date.now();
        if (!gameState.lastMovementLog || now - gameState.lastMovementLog >= 100) {
            mongoService.logMovement({
                position: {
                    x: robotMesh.position.x,
                    y: robotMesh.position.y,
                    z: robotMesh.position.z
                },
                rotation: {
                    yaw: cameraYaw,
                    pitch: cameraPitch
                },
                timestamp: now
            });
            gameState.lastMovementLog = now;
        }
    }
    
    // ... rest of animation loop ...
}
```

---

## 4️⃣ **Log Decisions** (In action functions)

### **Inspect Action**
```javascript
function inspectVictims() {
    // ... existing inspect code ...
    
    // ← ADD THIS: Log inspect decision
    mongoService.logDecision({
        type: 'inspect',
        position: {
            x: robotMesh.position.x,
            y: robotMesh.position.y,
            z: robotMesh.position.z
        },
        timestamp: Date.now(),
        success: true,
        metadata: {
            victimsFound: detectedVictims.length
        }
    });
}
```

### **Rescue Action**
```javascript
function attemptRescue() {
    // ... existing rescue code ...
    
    const success = /* your rescue logic */;
    
    // ← ADD THIS: Log rescue decision
    mongoService.logDecision({
        type: 'rescue',
        position: {
            x: victim.position.x,
            y: victim.position.y,
            z: victim.position.z
        },
        timestamp: Date.now(),
        success: success,
        metadata: {
            victimId: victim.id
        }
    });
}
```

### **Destroy Rubble**
```javascript
function destroyRubble() {
    // ... existing rubble destruction code ...
    
    // ← ADD THIS: Log rubble destruction
    mongoService.logDecision({
        type: 'destroy_rubble',
        position: {
            x: rubble.position.x,
            y: rubble.position.y,
            z: rubble.position.z
        },
        timestamp: Date.now(),
        success: true
    });
}
```

### **Refuel**
```javascript
function refuelRobot() {
    // ... existing refuel code ...
    
    // ← ADD THIS: Log refuel
    mongoService.logDecision({
        type: 'refuel',
        position: {
            x: fuelStation.position.x,
            y: fuelStation.position.y,
            z: fuelStation.position.z
        },
        timestamp: Date.now(),
        success: true,
        metadata: {
            fuelGained: 100 - robotState.fuel
        }
    });
}
```

---

## 5️⃣ **Finalize Session** (In `endGame()` function)

```javascript
async function endGame() {
    if (gameState.isGameOver) return;
    gameState.isGameOver = true;
    
    // ... existing game over code ...
    
    // ← ADD THIS: Finalize MongoDB session
    if (userManager.currentUser && mongoService.enabled) {
        const challengeStatus = challengeManager.getChallengeStatus();
        
        await mongoService.finalizeSession({
            score: finalScore,
            victimsSaved: gameState.victimsSaved,
            victimsDied: gameState.victimsDied,
            victimsTotal: gameState.victimsTotal,
            rubbleDestroyed: gameState.rubbleDestroyed || 0,
            finalHealth: robotState.health,
            finalFuel: robotState.fuel,
            duration: elapsed,
            completedChallenge: challengeStatus.status === 'active' && 
                                gameState.environment === challengeManager.currentChallenge.env,
            challengeType: challengeManager.currentChallenge.title,
            damageEvents: gameState.damageLog || []
        });
        
        console.log('📊 MongoDB session finalized');
        
        // Flush any remaining batched data
        await mongoService.flushBatch();
    }
    
    // ... rest of game over code ...
}
```

---

## 6️⃣ **Optional: Voice Event Logging**

If you have voice narration:

```javascript
function playVoiceNarration(event, text) {
    // ... existing voice code ...
    
    // ← ADD THIS: Log voice event
    mongoService.logVoiceEvent({
        playerId: userManager.currentUser.username,
        event: event,  // 'victim_found', 'low_fuel', etc.
        text: text,
        voiceId: 'default',
        context: {
            position: {
                x: robotMesh.position.x,
                y: robotMesh.position.y,
                z: robotMesh.position.z
            },
            robotHealth: robotState.health,
            robotFuel: robotState.fuel,
            victimsRemaining: gameState.victimsTotal - gameState.victimsSaved
        },
        timestamp: Date.now()
    });
}
```

---

## 7️⃣ **Update HTML** (Add script import)

In `index.html`, add before `game.js`:

```html
<script type="importmap">
{
    "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
    }
}
</script>
<script src="numpy_writer.js"></script>
<script type="module" src="mongoService.js"></script>  <!-- ← ADD THIS -->
<script type="module" src="game.js"></script>
```

---

## 8️⃣ **Add MongoDB Leaderboard**

Replace or enhance your existing leaderboard function:

```javascript
async function updateLeaderboard(type) {
    const listElement = document.getElementById('leaderboardList');
    
    // ← ADD THIS: Fetch from MongoDB if available
    if (mongoService.enabled) {
        let leaderboard;
        
        if (type === 'friends') {
            const friendIds = userManager.currentUser.friends || [];
            leaderboard = await mongoService.getFriendsLeaderboard([
                userManager.currentUser.username,
                ...friendIds
            ]);
        } else if (type === 'today') {
            leaderboard = await mongoService.getTodayLeaderboard();
        } else {
            leaderboard = await mongoService.getLeaderboard('score', 20);
        }
        
        if (leaderboard && leaderboard.length > 0) {
            listElement.innerHTML = leaderboard.map((entry, index) => `
                <div class="leaderboardItem">
                    <div class="leaderboardRank">#${index + 1}</div>
                    <div class="leaderboardName">${entry.playerName}</div>
                    <div class="leaderboardScore">${entry.score} pts</div>
                </div>
            `).join('');
            return;
        }
    }
    
    // Fallback to local leaderboard if MongoDB unavailable
    const localLeaderboard = userManager.getLeaderboard(type);
    listElement.innerHTML = localLeaderboard.map((user, index) => `
        <div class="leaderboardItem">
            <div class="leaderboardRank">#${index + 1}</div>
            <div class="leaderboardName">${user.displayName || user.username}</div>
            <div class="leaderboardScore">${user.totalPoints} pts</div>
        </div>
    `).join('');
}
```

---

## 9️⃣ **Add Data Export Button** (Optional)

In game over screen, add a button to export ML dataset:

```html
<!-- In index.html, in gameOverScreen -->
<div class="buttonGroup">
    <button id="restartBtn" class="primaryBtn">Play Again</button>
    <button id="downloadLogsBtn" class="secondaryBtn">📥 Download Data</button>
    <button id="exportMLBtn" class="secondaryBtn">🤖 Export ML Dataset</button>  <!-- ← ADD THIS -->
    <button id="backToMenuFromGame" class="secondaryBtn">🏠 Main Menu</button>
</div>
```

In `game.js`:

```javascript
document.getElementById('exportMLBtn')?.addEventListener('click', async () => {
    if (!mongoService.enabled) {
        alert('MongoDB not connected. Connect to export ML datasets.');
        return;
    }
    
    const success = await mongoService.exportMLDataset();
    if (success) {
        alert('✅ ML dataset exported! Check your downloads folder.');
    } else {
        alert('❌ Failed to export dataset. Check console for errors.');
    }
});
```

---

## 🔟 **Add Data Mode Toggle** (Optional)

Add a settings button to toggle MongoDB logging:

```html
<!-- In settings or homepage -->
<div class="settingRow">
    <label>
        <input type="checkbox" id="dataMode" checked>
        Enable Data Collection (MongoDB)
    </label>
</div>
```

```javascript
document.getElementById('dataMode')?.addEventListener('change', (e) => {
    mongoService.toggleDataMode(e.target.checked);
    
    if (e.target.checked) {
        alert('📊 Data Mode ENABLED - All gameplay will be saved to MongoDB Atlas');
    } else {
        alert('📊 Data Mode DISABLED - Gameplay will not be saved to MongoDB');
    }
});
```

---

## ✅ **Complete Integration Checklist**

- [ ] Import mongoService at top of game.js
- [ ] Initialize session in initGame()
- [ ] Log movement in animate() loop (10Hz)
- [ ] Log inspect decisions
- [ ] Log rescue decisions
- [ ] Log rubble destruction decisions
- [ ] Log refuel decisions
- [ ] Finalize session in endGame()
- [ ] (Optional) Log voice events
- [ ] Add mongoService.js script to index.html
- [ ] Update leaderboard to use MongoDB
- [ ] (Optional) Add ML export button
- [ ] (Optional) Add Data Mode toggle

---

## 🧪 **Testing Integration**

### **1. Check Console on Page Load**
Should see:
```
✅ MongoDB Atlas backend connected
📊 Data Mode: ENABLED
```

### **2. Start a Game**
Should see:
```
📊 MongoDB session started: reacture_1704888000000
```

### **3. Play the Game**
Movement and decisions should log silently

### **4. End Game**
Should see:
```
📊 MongoDB session finalized
```

### **5. Check MongoDB Atlas**
Go to Browse Collections → `reacture` database
- `playersessions` - Should have your session
- `voicelogs` - Should have voice events (if implemented)

---

## 🎯 **Result**

After integration, every game session will:

✅ Store complete movement trajectory (10Hz)  
✅ Log all player decisions with context  
✅ Record sensor data and robot state  
✅ Track performance metrics  
✅ Populate real-time leaderboards  
✅ Export as ML-ready datasets  

**All stored securely in MongoDB Atlas!** 🍃

---

**Questions?** Check `MONGODB_SETUP.md` for setup or `MONGODB_INTEGRATION_SUMMARY.md` for API reference!

