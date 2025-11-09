# 🐛 MongoDB Debug Checklist

## 📋 **Information I Need From You**

Please check these and tell me the results:

---

## ✅ **Step 1: Is Backend Server Running?**

Open a **new terminal** and run:
```bash
curl http://localhost:3001/health
```

**What do you see?**
- ✅ If you see: `{"status":"ok",...}` → Backend is running
- ❌ If you see: `curl: (7) Failed to connect` → Backend is NOT running

**If NOT running**, start it:
```bash
cd /Users/anoushkagudla/Desktop/ReActure/ReActure-1/server
npm start
```

---

## ✅ **Step 2: Check Browser Console**

1. Open your game: `http://localhost:8000`
2. Press **F12** to open console
3. Look for this message when page loads:

**Do you see?**
```
✅ MongoDB Atlas backend connected
📊 Data Mode: ENABLED
```

**Or do you see?**
```
⚠️ MongoDB Atlas backend not available
📊 Data Mode: DISABLED
```

**Tell me which one you see!**

---

## ✅ **Step 3: Check Network Requests**

1. Open browser (F12)
2. Go to **Network** tab
3. **Play a game** (start to finish)
4. In Network tab, filter by "session"

**Do you see any requests to**:
- `http://localhost:3001/api/session` (POST)
- `http://localhost:3001/api/session/...` (PUT)

**Tell me**: Do you see these requests? Are they green (200) or red (error)?

---

## ✅ **Step 4: Check Console During Game**

Play a game and watch the console.

**Do you see these messages?**
- `📊 Creating MongoDB session: reacture_...`
- `✅ MongoDB session created: ...`
- `📊 Finalizing MongoDB session...`
- `✅ MongoDB session finalized`

**Or do you see errors?**

---

## ✅ **Step 5: Test API Manually**

Run this in terminal:
```bash
curl http://localhost:3001/api/leaderboard
```

**What do you get?**
- ✅ `{"success":true,"leaderboard":[...]}`
- ❌ Error or connection refused?

---

## ✅ **Step 6: Check MongoDB Atlas**

In MongoDB Atlas dashboard:

1. Go to **Database** → **Browse Collections**
2. Database name: **`reacture`**
3. Collection: **`playersessions`**

**What do you see?**
- Documents with game data?
- Empty collection?
- Database doesn't exist?

---

## ✅ **Step 7: Check Backend Logs**

Look at the terminal where you ran `npm start`.

**Do you see?**
- `✅ Connected to MongoDB Atlas`
- `POST /api/session` when you play?
- Any errors?

---

## 📊 **Quick Test Script**

Run this in your **browser console** (F12):

```javascript
console.log('=== MONGODB DEBUG ===');
console.log('1. mongoService exists:', typeof mongoService !== 'undefined');
console.log('2. mongoService.enabled:', mongoService?.enabled);
console.log('3. Current user:', userManager.currentUser?.username);

// Test backend connection
fetch('http://localhost:3001/health')
    .then(r => r.json())
    .then(d => console.log('4. Backend health:', d))
    .catch(e => console.error('4. Backend error:', e));

// Test leaderboard
fetch('http://localhost:3001/api/leaderboard')
    .then(r => r.json())
    .then(d => console.log('5. Leaderboard:', d))
    .catch(e => console.error('5. Leaderboard error:', e));
```

**Copy the output and send it to me!**

---

## 🎯 **Most Likely Issues**

### **Issue 1: Backend Not Running** (80% likely)
```bash
# Check if running
curl http://localhost:3001/health

# If not, start it
cd /Users/anoushkagudla/Desktop/ReActure/ReActure-1/server
npm start
```

### **Issue 2: mongoService Not Loaded** (15% likely)
Check browser console for:
```
✅ MongoDB Atlas backend connected
```

If you see:
```
⚠️ MongoDB backend not available
```

Then the script isn't loading or backend isn't responding.

### **Issue 3: CORS Error** (5% likely)
Check browser console for red errors mentioning "CORS" or "blocked"

---

## 🔍 **Tell Me**

Please run through Steps 1-4 and tell me:

1. ✅ or ❌ Backend server running?
2. ✅ or ❌ "MongoDB connected" message in console?
3. ✅ or ❌ Network requests to `/api/session`?
4. ✅ or ❌ Console messages about MongoDB during game?
5. Copy the output of the **Quick Test Script**

With this info, I can tell you exactly what's wrong! 🔍

---

## 🆘 **Quick Checks**

Run these commands:

```bash
# 1. Check if backend process is running
ps aux | grep "node.*server.js"

# 2. Check if port 3001 is in use
lsof -i :3001

# 3. Check backend health
curl http://localhost:3001/health

# 4. Check leaderboard
curl http://localhost:3001/api/leaderboard
```

**Send me the results!**

