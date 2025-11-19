# ReActure - BeReal for the Future

**"One world. One moment. Infinite reactions."**

A gamified disaster response simulation platform with viral social features, inspired by BeReal. Players control rescue robots in randomly generated disaster environments while the system collects comprehensive training data at 10Hz for AI/robotics research.

---

## 🚀 Quick Start

### Running the Game

1. **Navigate to the project directory**: 
   ```bash
   cd /Users/anoushkagudla/Desktop/ReActure/ReActure-1
   ```

2. **Start the server**:
   ```bash
   python3 -m http.server 8000
   ```

   Or use the provided script:
   ```bash
   ./start.sh
   ```

3. **Open in your browser**:
   ```
   http://localhost:8000
   ```

4. **Sign up** with a username and start playing!

---

## 🎮 Core Features

### 🏠 Homepage & Social Features
- **Modern UI** with animated hero section
- **Daily Challenges** (BeReal-style) with countdown timers
- **Streak System** - maintain daily play streaks 🔥
- **Leaderboards** - Global, Friends, and Today views
- **User Profiles** - Track stats, history, and friends
- **Quick Stats Dashboard** - Points, friends, average time

### 🌍 Three Disaster Environments
1. **Earthquake Zone 🏚️** - Collapsed buildings, heavy rubble (1.5x damage)
2. **Tsunami Zone 🌊** - Flooded areas, water hazards (1.2x damage)
3. **Wildfire Zone 🔥** - Spreading flames, fire zones (2.0x damage)

Each environment has unique:
- Visual aesthetics (colors, sky, lighting)
- Hazard behaviors
- Damage multipliers
- Strategic challenges

### 🗺️ Random Map Generation
- **7-11 rubble piles** per game, randomly positioned
- **15-34 rubble pieces** per pile with varied sizes
- **Victims hidden** under 80% of piles
- **4-6 yellow zones** (slow movement)
- **2-3 red zones** (damage over time)
- **Random fuel station** placement
- **Unique every playthrough**

### 🎯 Advanced Scoring System
- **Rubble destruction**: +5 points per piece
- **Victim rescue**: +100 base + health bonus (up to +200)
- **Speed bonus**: Faster completion = more points (up to +600)
- **Health bonus**: +5 per 1% health remaining
- **Fuel bonus**: +2 per 1% fuel remaining
- **Detailed score breakdown** on game over

### 🕹️ Enhanced Gameplay Mechanics
- **Movement**: Smooth WASD controls with mouse camera
- **Jumping**: Space bar to jump over obstacles 🦘
- **Rubble Destruction**: Precise raycast targeting 💥
- **Fuel Management**: Refuel at stations (R key)
- **Zone Effects**: Environmental hazards affect movement and health
- **Victim Health Decay**: Time pressure - victims' health decreases
- **Collision Damage**: Speed-based damage system

### 📊 10Hz Data Collection
**Collected 10 times per second:**
- Robot position, rotation, velocity, acceleration
- Health and fuel levels
- Camera position and rotation
- Proximity sensors (forward, left, right, back)
- Victim detection and positions
- Zone status and hazards
- Fuel station distance
- Player actions (movement, jumps, destructions, rescues)

**Downloadable JSON Dataset** includes:
- Complete robot trajectory
- All sensor readings
- Player action timestamps
- Environment configuration
- Performance metrics
- Session metadata

### ⚡ BeReal-Style Daily Challenges
**"Reacture Moments" System:**
- Random disaster at random time each day (9 AM - 9 PM)
- 10-minute active window
- Live countdown timer
- Urgent notification style
- Different scenario each day
- Builds daily engagement habit
- FOMO-driven participation

---

## 🎮 How to Play

### Getting Started
1. **Homepage** - View your streak, stats, and today's challenge
2. **Sign In/Sign Up** - Create an account or sign in
3. **Environment Selection** - Choose Earthquake, Tsunami, or Wildfire
4. **Mission Briefing** - Review objectives and controls
5. **Play** - Navigate, rescue, and survive!

### Controls
- **W/A/S/D** - Move robot
- **Mouse** - Look around (360° camera control)
- **Space** (while moving) - Jump over obstacles
- **Space** (while stationary) - Destroy rubble in crosshair
- **R** - Refuel at blue station (when nearby)

### Objectives
1. **Primary**: Rescue all victims before time runs out
2. **Secondary**: Maximize score through speed and efficiency
3. **Tertiary**: Maintain your daily streak
4. **Victory**: All victims saved with robot health > 0
5. **Defeat**: Robot health reaches 0

### Strategy Tips
- **Clear 70%+ of rubble** above a victim to rescue them
- **Watch victim health bars** - rescue critical victims first
- **Avoid red zones** - they drain health quickly
- **Jump over obstacles** to save fuel
- **Refuel strategically** before running out
- **Speed matters** for bonus points

---

## 📱 Screens & Navigation

### 1. Homepage
- Hero section with title and tagline
- Daily challenge display with timer
- Streak counter with fire animation
- Quick stats (points, friends, avg time)
- Play Now and Leaderboard buttons

### 2. Sign In / Sign Up
- Simple username-based authentication
- Display name for leaderboards
- Local storage persistence
- Automatic streak tracking

### 3. Environment Selection
- Three disaster type cards
- Visual preview and descriptions
- Difficulty indicators
- Click to select and proceed

### 4. Mission Briefing
- Environment-specific briefing
- Control instructions
- Objective list
- Start Mission button

### 5. Gameplay
- Top bar: Timer, Victims Saved/Remaining, Score
- Right panel: Robot Health & Fuel bars
- Bottom left: Controls reminder
- Bottom right: Sensors display
- Center: Crosshair for targeting

### 6. Game Over
- Mission result (Complete/Failed)
- Final statistics
- Detailed score breakdown
- Play Again / Download Data / Main Menu options

### 7. Leaderboard
- Three tabs: Global, Friends, Today
- Top 20 players
- Gold/Silver/Bronze medals for top 3
- Username and total points

---

## 📊 Data Collection & Export

### What's Collected
**High-frequency (10Hz):**
- Robot kinematics (position, rotation, velocity, acceleration)
- Sensor readings (proximity, zone detection, victim detection)
- Health and fuel levels
- Camera view data

**Event-based:**
- Player input (key presses, mouse movements)
- Actions (jump, destroy, refuel, rescue)
- Collisions and damage events
- Zone transitions
- Game state changes

### Data Format
```json
{
  "timestamp": 12345,
  "type": "robot_state",
  "event": "periodic_update_10hz",
  "robot": {
    "position": { "x": 0, "y": 1, "z": 0 },
    "rotation": { "x": 0, "y": 0, "z": 0 },
    "velocity": { "x": 0, "y": 0, "z": 0 },
    "acceleration": { "x": 0, "y": 0, "z": 0 },
    "health": 100,
    "fuel": 100,
    "zone": "safe",
    "isJumping": false
  },
  "camera": {
    "position": { "x": 0, "y": 5, "z": 8 },
    "rotation": { "x": 0, "y": 0, "z": 0 }
  },
  "sensors": {
    "proximity": 10.0,
    "proximitySensors": {
      "forward": 5.2,
      "left": 8.1,
      "right": 7.3,
      "back": 10.0
    },
    "victimsDetected": 2,
    "victims": [
      { "distance": 12.5, "angle": 1.57, "health": 87 }
    ],
    "fuelStationDistance": 25.3,
    "zone": "yellow",
    "inYellowZone": true,
    "inRedZone": false
  }
}
```

### Downloading Data
1. Complete a mission (or let health reach 0)
2. Click "📥 Download Data" button
3. JSON file downloads: `reacture_data_[timestamp].json`
4. Use for AI training, analysis, or research

---

## 🔬 Research Applications

### AI/ML Use Cases
1. **Imitation Learning** - Learn from human player strategies
2. **Reinforcement Learning** - Train agents in disaster scenarios
3. **Path Planning** - Navigate cluttered environments
4. **Risk Assessment** - Balance speed vs. safety
5. **Resource Management** - Optimize fuel/health usage
6. **Multi-objective Optimization** - Maximize rescues, minimize damage
7. **Sensor Fusion** - Combine multiple sensor modalities
8. **Human-Robot Interaction** - Study human decision patterns

### Dataset Features
- **10Hz sampling** - High-frequency motion data
- **Multi-modal** - Actions, sensors, vision, kinematics
- **Contextualized** - Environment type and hazards labeled
- **Temporally aligned** - Synchronized timestamps
- **Rich annotations** - Game events provide labels
- **Diverse scenarios** - Random maps create variety

---

## 🏆 Leaderboard & Social

### Leaderboard Types
- **Global**: All players, sorted by total points
- **Friends**: Compare with friends only
- **Today**: Players who completed missions today

### Streak System
- Tracks consecutive days played
- Displayed with fire emoji 🔥
- Resets if you miss a day
- Motivates daily engagement

### User Stats Tracked
- Total points earned
- Games played
- Average completion time
- Best score
- Streak count
- Friends list
- Game history (last 50 games)

---

## 🎨 Design & UI

### Aesthetic
- Futuristic sci-fi theme
- Dark blues and purples
- Neon accents (cyan, magenta, yellow)
- Orbitron font for headers
- Glass morphism effects
- Smooth animations

### Responsive Design
- Mobile-friendly layouts
- Adaptive grids
- Touch-ready (for future)
- Maintains playability across devices

### Animations
- Fade-in transitions
- Pulsing challenge alerts
- Flame flicker for streaks
- Hover effects
- Loading states
- Score count-ups

---

## 🛠️ Technical Details

### Technology Stack
- **Frontend**: Vanilla JavaScript ES6 modules
- **3D Engine**: Three.js v0.160.0
- **Rendering**: WebGL with shadow mapping
- **Storage**: LocalStorage API
- **No Dependencies**: Runs in any modern browser

### Performance
- **60 FPS** target frame rate
- **Optimized shadows** - 4096x4096 maps
- **Efficient raycasting** - minimal performance impact
- **Throttled updates** - 10Hz data collection
- **Lazy rendering** - only when needed

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Requires WebGL support
- LocalStorage enabled

---

## 📁 Project Structure

```
ReActure-1/
├── index.html          # Main HTML with all screens
├── style.css           # Complete styling
├── game.js             # Core game logic (ES6 module)
├── README.md           # This file
├── FEATURES.md         # Detailed feature documentation
├── QUICKSTART.md       # Original quickstart guide
├── package.json        # Project metadata
└── start.sh            # Server startup script
```

---

## 🎯 Future Enhancements

### Potential Features
- **Multiplayer co-op** missions
- **Real-time friend challenges**
- **Video replay** system
- **Robot customization** (colors, abilities)
- **More environments** (tornado, avalanche, flood)
- **Weather effects** (rain, wind, fog)
- **Voice commands** for accessibility
- **VR support** for immersion
- **Backend server** for global sync
- **Social sharing** of Reacture Moments
- **Achievement system** with badges
- **Tutorial missions** for onboarding

### Backend Integration (if needed)
- Global leaderboard sync
- Real-time friend updates
- Cloud save system
- Anti-cheat measures
- Analytics dashboard
- Admin panel

---

## 🤝 Contributing

This is a hackathon project for the "Beyond the Dataset" track. Feel free to fork and extend!

### Ideas for Contribution
- Add more disaster types
- Improve AI agent training integration
- Create machine learning examples using collected data
- Enhance multiplayer features
- Optimize performance
- Add accessibility features

---

## 📄 License

MIT License - Created for hackathon submission.

---

## 🎉 Credits

**Developed by**: [Your Name]  
**Inspired by**: BeReal's viral engagement mechanics  
**Built with**: Three.js, WebGL, and lots of ☕

---

## 🐛 Troubleshooting

### Game doesn't load?
- Make sure you're in the correct directory
- Check browser console for errors
- Ensure WebGL is supported
- Try a different browser

### Can't see 3D graphics?
- Update graphics drivers
- Enable hardware acceleration
- Check WebGL support at https://get.webgl.org/

### Data not downloading?
- Check browser download settings
- Ensure pop-ups aren't blocked
- Try right-click → "Save As"

### LocalStorage issues?
- Check browser privacy settings
- Clear site data and retry
- Ensure cookies/storage enabled

---

## 📞 Support

For questions or issues:
1. Check FEATURES.md for detailed documentation
2. Review QUICKSTART.md for setup help
3. Open an issue on GitHub
4. Contact: [your email]

---

**ReActure** - Where disaster response meets viral gaming.  
*Collect data. Save lives. Compete with friends.* 🚁🔥🏆
