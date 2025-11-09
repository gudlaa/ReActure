# ⚡ REACT TIME Configuration

## 🎯 Current Settings

**Mode**: **Demo Mode** - REACT TIME activates immediately on page load!

This is perfect for:
- ✅ Testing
- ✅ Demos
- ✅ Showing judges
- ✅ Development

---

## ⚙️ **How It's Configured Now**

### **Daily Challenge Timing** (in `game.js`)

```javascript
getRandomDailyTime() {
    const now = Date.now();
    return now - (1 * 60 * 1000); // Started 1 minute ago (active NOW)
}
```

**Result**: REACT TIME is **always active** when you open the app!

---

## 🔄 **Change to Production Mode**

### **For Real Random Daily Times**:

Replace the `getRandomDailyTime()` function with:

```javascript
getRandomDailyTime() {
    // Set random time between 9 AM - 9 PM
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const randomHour = 9 + Math.floor(Math.random() * 12); // 9 AM - 9 PM
    const randomMinute = Math.floor(Math.random() * 60);
    return todayStart.getTime() + (randomHour * 60 * 60 * 1000) + (randomMinute * 60 * 1000);
}
```

**Result**: REACT TIME happens at a **random time each day** (like BeReal!)

---

## 🎯 **For Specific Daily Time**

### **Example: Always at 6 PM**:

```javascript
getRandomDailyTime() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const sixPM = 18 * 60 * 60 * 1000; // 6 PM
    return todayStart.getTime() + sixPM;
}
```

### **Example: Always at Noon**:

```javascript
getRandomDailyTime() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const noon = 12 * 60 * 60 * 1000; // 12 PM
    return todayStart.getTime() + noon;
}
```

---

## ⏰ **Change Window Duration**

### **Current**: 10 minutes

```javascript
expiresAt: randomTime + (10 * 60 * 1000)
```

### **Change to 5 minutes**:

```javascript
expiresAt: randomTime + (5 * 60 * 1000)
```

### **Change to 30 minutes**:

```javascript
expiresAt: randomTime + (30 * 60 * 1000)
```

---

## 📅 **Daily Challenge Rotation**

### **Current Challenges**:

```javascript
dailyChallenges = [
    { title: "REACT TIME: Tokyo Earthquake", env: "earthquake", reactTime: 120 },
    { title: "REACT TIME: Pacific Tsunami", env: "tsunami", reactTime: 120 },
    { title: "REACT TIME: California Wildfire", env: "wildfire", reactTime: 90 },
    { title: "REACT TIME: Volcanic Eruption", env: "wildfire", reactTime: 120 },
    { title: "REACT TIME: Building Collapse", env: "earthquake", reactTime: 180 },
    { title: "REACT TIME: Flash Flood", env: "tsunami", reactTime: 90 }
];
```

**Selection**: Random challenge each day

### **Add More Challenges**:

Just add to the array:

```javascript
{ 
    title: "REACT TIME: Hurricane Katrina", 
    description: "Category 5 hurricane incoming! Evacuate now!", 
    icon: "🌪️", 
    env: "tsunami", 
    reactTime: 150 
}
```

---

## 🔔 **Popup Behavior**

### **Current**: Shows 0.5 seconds after page load

```javascript
setTimeout(() => {
    challengeManager.showReactTimePopup();
}, 500);
```

### **Make Instant**:

```javascript
setTimeout(() => {
    challengeManager.showReactTimePopup();
}, 100); // Nearly instant
```

### **Delay More**:

```javascript
setTimeout(() => {
    challengeManager.showReactTimePopup();
}, 2000); // 2 seconds delay
```

---

## 🎮 **Testing Different Scenarios**

### **Test: Challenge Active Now**
```javascript
// Already configured! Just refresh the page
```

### **Test: Challenge in 2 Hours**
```javascript
const now = Date.now();
const challenge = {
    ...challengeManager.currentChallenge,
    date: new Date().toDateString(),
    time: now + (2 * 60 * 60 * 1000), // 2 hours from now
    expiresAt: now + (2 * 60 * 60 * 1000) + (10 * 60 * 1000)
};
localStorage.setItem('reacture_dailyChallenge', JSON.stringify(challenge));
location.reload();
```

### **Test: Challenge Just Expired**
```javascript
const now = Date.now();
const challenge = {
    ...challengeManager.currentChallenge,
    date: new Date().toDateString(),
    time: now - (15 * 60 * 1000), // 15 minutes ago
    expiresAt: now - (5 * 60 * 1000) // Expired 5 minutes ago
};
localStorage.setItem('reacture_dailyChallenge', JSON.stringify(challenge));
location.reload();
```

---

## 🚀 **Deployment Recommendations**

### **For Hackathon Demo**:
✅ **Use current settings** (instant activation)
- Judges see REACT TIME immediately
- No waiting around
- Shows full feature

### **For Production**:
```javascript
// Random time each day
getRandomDailyTime() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const randomHour = 9 + Math.floor(Math.random() * 12);
    const randomMinute = Math.floor(Math.random() * 60);
    return todayStart.getTime() + (randomHour * 60 * 60 * 1000) + (randomMinute * 60 * 1000);
}
```

### **For Scheduled Events**:
```javascript
// Example: Every day at 12 PM EST
getRandomDailyTime() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const noonEST = 12 * 60 * 60 * 1000;
    return todayStart.getTime() + noonEST;
}
```

---

## 📊 **Analytics to Track**

When deploying, track:

1. **Participation Rate** - % of users who complete when notified
2. **Average Response Time** - How fast they react to notification
3. **Completion Rate** - % who finish vs abandon
4. **Aftermath Views** - How many check results after
5. **Share Rate** - % who share to social media
6. **Daily Active Users** - Tracking the habit

---

## 🎯 **Current Flow** (Demo Mode)

```
Open app
    ↓
Login/Sign in
    ↓
Homepage loads
    ↓
0.5 seconds later...
    ↓
⚡ REACT TIME POPUP APPEARS!
    ↓
"Tokyo Earthquake - You have 9 minutes!"
    ↓
Click "React Now!"
    ↓
Start challenge immediately
```

**Perfect for demos!** ✅

---

## 🔄 **Reset Daily Challenge** (Testing)

To test multiple times per day:

```javascript
// In browser console
localStorage.removeItem('reacture_dailyChallenge');
delete userManager.currentUser.dailyChallengeCompleted;
userManager.saveUser();
location.reload();
```

This will:
- Generate a new challenge
- Reset your completion status
- Show the popup again

---

## 💡 **Pro Tips**

### **For Best Viral Effect**:

1. **Use random times** (unpredictable)
2. **Keep window short** (5-10 minutes)
3. **Make popup impossible to ignore** (full screen, sound)
4. **Show aftermath** (social comparison)
5. **Enable push notifications** (when user is offline)

### **For Events/Competitions**:

1. **Schedule specific times** (announced beforehand)
2. **Longer windows** (30-60 minutes for events)
3. **Special challenges** (unique disasters)
4. **Prizes for top 3** (incentivize participation)

---

## ✅ **Summary**

**Current Configuration**:
- ⚡ REACT TIME activates **immediately on page load**
- ⏰ 10-minute window to complete
- 🎯 One random challenge per day
- 📸 Aftermath screen available after
- 🔒 Can't replay after completion

**Perfect for**: Demos, testing, hackathon judging

**For production**: Change `getRandomDailyTime()` to use random hours

---

**🔥 REACT TIME is ready! Refresh your browser and see the popup!** ⚡

