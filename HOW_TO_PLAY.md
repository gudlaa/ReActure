# 🎮 ReActure - Complete How To Play Guide

## 🚀 **START PLAYING (3 Steps)**

### 1. **Refresh Browser**
**CRITICAL:** Clear cache to see all changes!
- **Mac:** `Cmd + Shift + R`
- **Windows:** `Ctrl + Shift + R`

### 2. **Open Game**
```
http://localhost:8000
```

### 3. **Navigate**
```
Homepage → Sign In → Play Now → Choose Environment → Start Mission
```

---

## 🎯 **COMPLETE CONTROLS**

### Essential Controls:
```
🖱️ CLICK CANVAS FIRST - Enables mouse look (REQUIRED!)

Movement:
  W - Forward
  A - Left
  S - Backward
  D - Right
  Mouse - Look around (360°)

Actions:
  E - Infrared scan (reveals victims for 2.5s)
  Space - Destroy rubble (aim with crosshair)
  F / Click - Rescue victim (when in range) ✨
  R - Refuel at station

Game:
  ESC - Pause/Resume
```

---

## 🆘 **HOW TO RESCUE VICTIMS (Step-by-Step)**

### **The Rescue Process:**

#### **Step 1: SCAN (E Key)**
```
→ Press E
→ Infrared activates for 2.5 seconds
→ Victims glow RED/ORANGE (heat signature)
→ Rubble glows BLUE (solid objects)
→ Only shows what's IN FRONT of you (60° cone)
→ Locate victim position
```

#### **Step 2: CLEAR RUBBLE (Space Key)**
```
→ Aim crosshair at rubble pieces
→ Press Space to destroy
→ Each piece destroyed = +5 points
→ Must clear 70%+ of pile above victim
→ Watch pieces fall with gravity!
```

#### **Step 3: CHECK ACCESSIBILITY**
```
→ Move close to victim area
→ Victim pulses GREEN when accessible ✅
→ If still RED: Clear more rubble
→ Green = ready for rescue!
```

#### **Step 4: RESCUE (F Key or Click)**
```
→ Get within 3 meters of victim
→ Press F key OR Click mouse
→ Victim floats up (rescue animation)
→ Score increases (+100 base + health bonus)
→ Console: "✅ Victim rescued!"
```

---

## 🎮 **FIRST-PERSON VIEW**

### **How It Works:**

**When Game Starts:**
- See environment from robot's eyes
- Camera at 1.5m height (eye level)
- Robot body hidden (true FPS)
- Message: "🖱️ Click to enable mouse look"

**Click Canvas:**
- Cursor disappears
- Pointer locked
- Now mouse controls view!

**Move Mouse:**
- Look left/right (yaw)
- Look up/down (pitch)
- Full 360° horizontal
- ±90° vertical

**Move with WASD:**
- Forward = where you're looking
- Backward = opposite direction
- Strafe left/right
- Camera-relative movement

**Press ESC:**
- Pause menu appears
- Pointer unlocked
- Mouse cursor returns
- Press ESC again or click Resume

---

## 🧱 **RUBBLE GRAVITY PHYSICS**

### **How It Works:**

**Automatic Physics:**
- Runs every frame
- Checks each rubble piece for support
- If no support below → falls
- Gravity: -0.5 acceleration
- Settles on ground or other rubble

**Watch It Happen:**
1. Find a rubble pile
2. Destroy pieces at the bottom
3. Watch top pieces fall
4. Realistic collapse behavior!

**Strategic Use:**
- Plan demolition route
- Create avalanches
- Clear paths efficiently
- Watch for falling debris

---

## 🔍 **INFRARED INSPECT MODE (E Key)**

### **Like a Thermal Camera:**

**Activation:**
- Press E at any time
- Lasts 2.5 seconds
- Can use repeatedly
- No cooldown

**What You See:**
- **Victims:** RED/ORANGE glow (heat signature)
- **Rubble:** BLUE glow (solid objects)
- **Range:** 20 meters
- **Cone:** 60° (only what's in front)

**Strategic Use:**
- Scan area before moving
- Locate hidden victims
- See through rubble
- Plan rescue route
- Find optimal path

---

## 🟡🔴 **HAZARD ZONES**

### **Flat Circles on Ground:**

**Yellow Zones** 🟡
- Caution areas
- Movement slowed to 50%
- No damage
- Can traverse safely (slower)

**Red Zones** 🔴
- Danger areas
- Continuous damage over time
- Glow effect for visibility
- Avoid if possible!
- Environment-specific (fire, water, unstable)

**Visual:**
- Flat circles on ground plane
- Easy to see from first-person
- Clear boundaries
- Emissive glow

---

## ⛽ **REFUELING**

### **How to Refuel:**

1. **Locate fuel station** (blue glowing cube)
2. **Navigate to it** (use infrared if needed)
3. **Get close** (within 3m)
4. **Press R key**
5. **Fuel restores to 100%**

**When to Refuel:**
- Fuel below 30%
- Before long journey
- After heavy movement
- Strategic planning

---

## 🎯 **SCORING SYSTEM**

### **How Points Work:**

**During Game:**
- Destroy rubble: **+5** per piece
- Rescue victim: **+100** base
- Victim health bonus: **up to +200** (healthier = more points)
- Speed bonus: **varies** (faster rescue = more)

**End Game Bonuses:**
- Time bonus: **up to +600** (under 5 minutes)
- Health bonus: **+5** per 1% remaining
- Fuel bonus: **+2** per 1% remaining

**Strategy:**
- Rescue victims quickly (health bonus)
- Complete fast (time bonus)
- Maintain health (avoid damage)
- Save fuel (refuel strategically)

---

## 🎬 **GAME END**

### **Game Ends When:**
1. All victims rescued ✅
2. OR all victims died ☠️ (health reached 0)
3. OR robot health reached 0 💔

**NOT time-based!**
- Time is tracked for scoring
- But doesn't end the game
- You have as long as needed
- Perfect for data collection

### **What Happens:**
- Game over screen appears
- Shows final statistics
- Detailed score breakdown
- Social sharing options
- Download data button
- **Scroll to see everything!**
- Click Main Menu to return

---

## 💡 **PRO TIPS**

### **For High Scores:**
1. **Use E often** - Know where victims are
2. **Rescue quickly** - Health bonus is huge
3. **Avoid damage** - Health bonus at end
4. **Save fuel** - Refuel strategically
5. **Plan routes** - Efficient path = faster time

### **For Efficient Rescue:**
1. **Scan first** (E) - See all victims
2. **Plan order** - Closest to furthest
3. **Clear strategically** - Use gravity to help
4. **Watch for green pulse** - Ready indicator
5. **F or Click** - Quick rescue

### **For Better Data:**
1. **Try different strategies** - Varied data
2. **Use all features** - Complete dataset
3. **Play all environments** - Diverse scenarios
4. **Download after each** - Save all data
5. **Check JSON structure** - Understand data

---

## 🔧 **CURRENT ISSUES & SOLUTIONS**

### **Blue Screen When Game Starts?**

**Solution:**
- Hard refresh (Cmd+Shift+R)
- Try different browser
- Check console for errors
- Should see grass ground, not blue

### **Can't Move?**

**Solution:**
1. **Click canvas first!** (Very important)
2. Check console for "Pointer locked"
3. Press W and check console
4. Should see "Key pressed: KeyW"

### **Can't Look Around?**

**Solution:**
1. **Click canvas** to lock pointer
2. Cursor should disappear
3. Move mouse slowly at first
4. Check console for "Pointer locked"

### **Can't Rescue Victim?**

**Solution:**
1. Clear 70%+ of rubble above victim
2. Get within 3 meters
3. Wait for green pulse
4. Press F or Click
5. Check console for feedback message

---

## 📊 **WHAT TO EXPECT**

### **When Game Loads:**
- Grass ground (green or environment color)
- Horizontal rubble debris fields
- Flat yellow/red hazard zones
- Blue fuel station cube
- Crosshair in center
- Message: "Click to enable mouse look"

### **After Clicking:**
- Cursor disappears
- Mouse moves view
- WASD moves robot
- First-person immersion!

### **During Gameplay:**
- E shows infrared vision
- Space destroys rubble
- Rubble falls with gravity
- Accessible victims pulse green
- F or Click rescues
- ESC pauses

### **Game Over:**
- Screen appears
- Scrollable content
- All stats visible
- Share buttons
- Download button
- Main Menu button

---

## 🎮 **RECOMMENDED GAMEPLAY**

### **First Playthrough:**

```
1. Choose Earthquake (easiest)
2. Click canvas immediately
3. Press E to scan area
4. Note victim locations (red glows)
5. Pick closest victim
6. Destroy rubble carefully
7. Watch gravity in action
8. See victim turn green
9. Press F to rescue
10. Repeat for all victims
11. Check final score
12. Download data
13. Try different environment!
```

---

## 🌟 **KEY FEATURES**

### **Why ReActure is Unique:**

1. **First-Person Immersion** - You ARE the robot
2. **Infrared Vision** - Like thermal imaging
3. **Manual Rescue** - Strategic decision making
4. **Rubble Physics** - Realistic gravity
5. **Solid Collision** - Can't walk through obstacles
6. **10Hz Data Collection** - Research-grade dataset
7. **Social Features** - Leaderboards, streaks, sharing
8. **REACT TIME** - Daily challenges
9. **Beautiful UI** - Modern sci-fi design
10. **No Installation** - Browser-based

---

## 📱 **SERVER INFO**

**Running:** ✅  
**Port:** 8000  
**URL:** http://localhost:8000  
**Status:** 🟢 READY

---

## 🎉 **YOU'RE ALL SET!**

**All Features Working:**
- ✅ First-person camera
- ✅ Infrared inspect (E)
- ✅ Manual rescue (F / Click)
- ✅ Rubble gravity physics
- ✅ Solid collision
- ✅ Horizontal debris
- ✅ Flat hazard zones
- ✅ Scrollable screens
- ✅ Pause menu (ESC)
- ✅ Social sharing
- ✅ Data export

---

## 🚀 **PLAY NOW!**

**Remember:**
1. **Hard refresh** (Cmd+Shift+R)
2. **Click canvas** when game starts
3. **Press E** to scan
4. **Press F or Click** to rescue
5. **Have fun!**

---

*ReActure - First-Person Disaster Response Simulation*  
*"Scan. Clear. Rescue. Repeat."* 🔍💥🆘

**Server: http://localhost:8000**

