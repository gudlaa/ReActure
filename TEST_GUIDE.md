# ReActure - Testing Guide

## Quick Test Checklist

Use this checklist to verify all features are working correctly.

---

## 🚀 Initial Setup

### 1. Start Server
```bash
cd /Users/anoushkagudla/Desktop/ReActure/ReActure-1
python3 -m http.server 8000
```

### 2. Open Browser
Navigate to: `http://localhost:8000`

### 3. Check Browser Console
- Open Developer Tools (F12)
- Check Console tab for errors
- Should see: "✅ ReActure initialized - BeReal for the Future"

---

## ✅ Feature Testing Checklist

### Homepage Tests
- [ ] **Page loads** with animated title "ReActure"
- [ ] **Tagline visible**: "BeReal for the Future"
- [ ] **Daily challenge** shows disaster scenario
- [ ] **Timer displays** and updates every second
- [ ] **Streak display** shows "0 days" (for new user)
- [ ] **Quick stats** show all zeros (Total Points, Friends, Avg Time)
- [ ] **Play Now button** is visible
- [ ] **Leaderboard button** is visible
- [ ] **Sign in prompt** shows "Not logged in? Sign In"

### Authentication Tests
- [ ] **Click "Sign In"** → Auth screen appears
- [ ] **Enter username** → Input accepts text
- [ ] **Sign In button** → Shows "User not found" for new username
- [ ] **Switch to Sign Up** link works
- [ ] **Enter username and display name** → Both fields accept input
- [ ] **Sign Up button** → Creates account successfully
- [ ] **Redirects to homepage** after sign up
- [ ] **Stats update** with new user info
- [ ] **Streak shows "1 days"** after first sign in

### Environment Selection Tests
- [ ] **Click "Play Now"** → Environment screen appears
- [ ] **Three cards visible**: Earthquake, Tsunami, Wildfire
- [ ] **Hover effect** on cards (lift and border glow)
- [ ] **Click Earthquake card** → Mission briefing appears
- [ ] **Environment name** updates to "Earthquake Zone"
- [ ] **Back button** returns to homepage

### Mission Briefing Tests
- [ ] **Briefing loads** with environment-specific description
- [ ] **Controls displayed** clearly
- [ ] **Objectives list** shows 6 items
- [ ] **Start Mission button** visible
- [ ] **Click Start Mission** → Game loads

### Gameplay Tests

#### Basic Movement
- [ ] **Press W** → Robot moves forward
- [ ] **Press S** → Robot moves backward
- [ ] **Press A** → Robot moves left
- [ ] **Press D** → Robot moves right
- [ ] **Mouse movement** → Camera rotates around robot
- [ ] **Smooth camera** follows robot

#### Advanced Mechanics
- [ ] **Press Space while moving** → Robot jumps
- [ ] **Jump has arc** (goes up then down)
- [ ] **Robot lands** smoothly on ground
- [ ] **Press Space while stationary + facing rubble** → Rubble destroys
- [ ] **Destroyed rubble** fades and disappears
- [ ] **Score increases** by +5 when rubble destroyed

#### UI Display
- [ ] **Timer counts up** in top bar
- [ ] **Victims Saved** shows correct count
- [ ] **Remaining Victims** updates when victim rescued
- [ ] **Score** updates in real-time
- [ ] **Health bar** decreases when damaged
- [ ] **Fuel bar** decreases during movement
- [ ] **Sensor display** shows proximity value
- [ ] **Zone indicator** shows "Safe" or zone type

#### Refueling
- [ ] **Find fuel station** (blue cube)
- [ ] **Approach station** (get close)
- [ ] **Press R** → Fuel refills to 100%

#### Victim Rescue
- [ ] **Find rubble pile** (multiple brown pieces)
- [ ] **Destroy ~70% of rubble** above victim
- [ ] **Victim becomes visible** (red cylinder)
- [ ] **Approach victim** (within 2.5m)
- [ ] **Victim automatically rescued** (animates upward)
- [ ] **Score increases** by 100+ points
- [ ] **Saved count increments**

#### Hazard Zones
- [ ] **Enter yellow zone** (visible yellow circle)
- [ ] **Movement slows** to 50% speed
- [ ] **Zone indicator** shows "Yellow"
- [ ] **Enter red zone** (visible red circle)
- [ ] **Health decreases** over time
- [ ] **Zone indicator** shows "Red"

#### Game Over
- [ ] **Rescue all victims** OR **Let health reach 0**
- [ ] **Game over screen appears**
- [ ] **Stats display** (time, victims, health, fuel)
- [ ] **Score breakdown** shows all components
- [ ] **Final score calculated** correctly
- [ ] **Three buttons visible**: Play Again, Download Data, Main Menu

### Data Export Tests
- [ ] **Click "Download Data" button**
- [ ] **JSON file downloads** (reacture_data_[timestamp].json)
- [ ] **Open JSON file** in text editor
- [ ] **Verify structure** (array of log entries)
- [ ] **Check timestamps** (~100ms apart for 10Hz entries)
- [ ] **Verify robot positions** change over time
- [ ] **Check sensor data** is present
- [ ] **Confirm action events** logged (move_forward_start, etc.)

### Leaderboard Tests
- [ ] **Click "Leaderboard" from homepage**
- [ ] **Leaderboard screen appears**
- [ ] **Global tab active** by default
- [ ] **Your username appears** in list
- [ ] **Total points displayed** correctly
- [ ] **Click Friends tab** → Shows friends only (or empty)
- [ ] **Click Today tab** → Shows today's players
- [ ] **Top 3 have special colors** (Gold, Silver, Bronze)
- [ ] **Back button** returns to homepage

### Daily Challenge Tests
- [ ] **Challenge displays** on homepage
- [ ] **Timer updates** every second
- [ ] **Challenge status** shows correctly:
  - "Starts in X:XX" (if before challenge time)
  - "⚡ LIVE NOW - X:XX" (during 10-min window)
  - "Challenge Expired" (after window closes)
- [ ] **Border color changes** based on status
- [ ] **Icon matches** challenge type

### Streak Tests
- [ ] **Sign in today** → Streak increments
- [ ] **Sign in again same day** → Streak unchanged
- [ ] **Manually change lastPlayed** in localStorage → Test streak reset
- [ ] **Fire emoji animates** (scales up/down)

### User Profile Tests
- [ ] **Complete a game** → Stats update
- [ ] **Total points increase** by game score
- [ ] **Games played** increments
- [ ] **History stores** game result
- [ ] **Refresh page** → Data persists
- [ ] **Sign out and sign in** → Data still there

---

## 🐛 Common Issues & Fixes

### Game Doesn't Load
- **Check console** for JavaScript errors
- **Verify server running** on port 8000
- **Try different browser** (Chrome recommended)
- **Clear browser cache** and reload

### Can't Move Robot
- **Click on game canvas** to focus
- **Check console** for keyboard event logs
- **Try pressing keys multiple times**
- **Ensure game has started** (not on menu screen)

### No 3D Graphics
- **Check WebGL support**: https://get.webgl.org/
- **Update graphics drivers**
- **Enable hardware acceleration** in browser settings
- **Try different browser**

### LocalStorage Issues
- **Check browser privacy settings**
- **Allow cookies and site data**
- **Clear site data** and start fresh
- **Try incognito/private mode**

### Camera Not Moving
- **Move mouse across canvas**
- **Check console** for mousemove events
- **Try clicking canvas first**
- **Reload page** and try again

### Rubble Won't Destroy
- **Face rubble directly** (center crosshair on it)
- **Be close enough** (< 5 meters)
- **Press Space while stationary** (not while moving)
- **Check console** for destroy events

### Download Not Working
- **Check browser download settings**
- **Allow pop-ups** from localhost
- **Try right-click → "Save As"**
- **Check Downloads folder** manually

---

## 📊 Performance Tests

### Frame Rate
- **Open browser performance monitor**
- **Should maintain ~60 FPS** during gameplay
- **Check for frame drops** during intense action
- **Monitor CPU/GPU usage**

### Data Collection
- **Complete a 2-minute game**
- **Download JSON**
- **Count log entries**: Should have ~1,200 (2 min × 60 sec × 10 Hz)
- **Verify timestamps** increment by ~100ms
- **Check file size**: Should be 200-500 KB

### Memory Usage
- **Open browser task manager**
- **Monitor memory** during gameplay
- **Should stay under 200 MB**
- **No memory leaks** over time

---

## ✅ Full Playthrough Test

**Complete this test to verify all features work together:**

1. **Start server** and open browser
2. **Sign up** with username "TestUser123"
3. **Verify homepage** shows stats
4. **Check daily challenge** displays correctly
5. **Click "Play Now"**
6. **Select Earthquake** environment
7. **Read mission briefing**
8. **Start mission**
9. **Test movement** (WASD + Mouse)
10. **Test jumping** (Space while moving)
11. **Find rubble pile** with victim
12. **Destroy 70%+ of rubble** (multiple presses of Space)
13. **Rescue victim** by approaching
14. **Navigate to fuel station**
15. **Refuel** by pressing R
16. **Enter yellow zone** (check slowdown)
17. **Avoid red zone** (or test damage)
18. **Rescue all victims** or die trying
19. **View game over screen**
20. **Check score breakdown**
21. **Download data** (verify JSON)
22. **Click "Main Menu"**
23. **Check leaderboard** (verify your score)
24. **Sign out** and sign in again
25. **Verify streak incremented**
26. **Play again** with different environment

**If all 26 steps work: ✅ ALL FEATURES WORKING!**

---

## 📝 Test Results Log

Use this template to document your test results:

```
Date: _______________
Browser: _______________
OS: _______________

✅ Homepage loads
✅ Authentication works
✅ Environment selection works
✅ Game starts successfully
✅ Movement responsive
✅ Jumping works
✅ Rubble destruction works
✅ Victim rescue works
✅ Scoring accurate
✅ Data export works
✅ Leaderboard displays
✅ Streak tracking works

Issues Found: _______________________________
___________________________________________
___________________________________________

Overall Result: PASS / FAIL
```

---

## 🎉 Success Criteria

**All features are working if:**
- ✅ No console errors
- ✅ All screens navigate correctly
- ✅ Authentication persists
- ✅ Game runs at 60 FPS
- ✅ All controls respond
- ✅ Scoring calculates correctly
- ✅ Data exports successfully
- ✅ Leaderboard updates
- ✅ Streak increments daily

**Total Features to Test**: 50+ checkboxes  
**Expected Pass Rate**: 100%

---

*Test completed? Ready to share! 🚀*

