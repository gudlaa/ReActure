# ReActure - Complete Feature List

## 🎮 Overview
ReActure is a gamified disaster response simulation platform with social features, inspired by BeReal's viral mechanics. Players control rescue robots in randomly generated disaster environments while the system collects comprehensive training data at 10Hz for AI/robotics research.

**Tagline:** "BeReal for the Future - One world. One moment. Infinite reactions."

---

## ✨ Core Features Implemented

### 1. 🏠 Modern Homepage UI
- **Hero Section** with animated title and tagline
- **Daily Challenge Display** (BeReal-style) showing:
  - Current disaster scenario
  - Live countdown timer
  - Challenge status (upcoming/active/expired)
- **Streak Display** with fire animation
  - Shows consecutive days played
  - Motivates daily engagement
- **Quick Stats Dashboard**:
  - Total Points earned
  - Friends count
  - Average completion time
- **Action Buttons**: Play Now, View Leaderboard
- **Sign-in prompt** for non-authenticated users

### 2. 🔐 Authentication System
- **Sign In**: Existing user authentication
- **Sign Up**: New user registration with username and display name
- **Local Storage**: All user data persisted in browser localStorage
- **Automatic Streak Tracking**: Updates on each play session
- **Session Management**: Maintains current user state

### 3. 🌍 Three Environment Types

#### Earthquake Zone 🏚️
- Brown/dusty color palette
- Collapsed buildings and unstable ground
- Heavy rubble piles
- 1.5x damage multiplier
- Characteristics: High collision damage, structural debris

#### Tsunami Zone 🌊
- Blue/aquatic color palette
- Flooded areas with water hazards
- Waterlogged rubble
- 1.2x damage multiplier
- Characteristics: Increased fuel consumption in water zones

#### Wildfire Zone 🔥
- Red/orange fire palette
- Spreading flames and smoke effects
- Charred rubble
- 2.0x damage multiplier (highest)
- Characteristics: Continuous fire damage, time pressure

### 4. 🗺️ Random Map Generation
- **Dynamic Rubble Piles**: 7-11 randomly placed piles per game
- **Rubble Pieces**: 15-34 pieces per pile with varied sizes and rotations
- **Victim Placement**: 80% of piles contain trapped victims underneath
- **Hazard Zones**:
  - Yellow zones (4-6): Slow movement, caution areas
  - Red zones (2-3): Damage over time, environment-specific hazards
- **Fuel Station**: Randomly positioned for refueling
- **Unique Every Game**: Seed-based randomization ensures variety

### 5. 🎯 Complete Scoring System

**Base Score Components:**
- Destroying rubble: +5 points per piece
- Rescuing victim: +100 base + health bonus
- Victim health bonus: Up to +200 points (based on victim's remaining health)
- Speed bonus: Faster rescue = more points

**End Game Bonuses:**
- Time bonus: Up to +600 points (for completing under 5 minutes)
- Health bonus: +5 points per 1% health remaining
- Fuel bonus: +2 points per 1% fuel remaining

**Score Breakdown Display** on game over showing all components

### 6. 🕹️ Enhanced Game Mechanics

#### Movement System
- **WASD**: Directional movement
- **Mouse**: 360-degree camera control
- **Smooth Rotation**: Interpolated robot turning
- **Zone Effects**:
  - Yellow zones: 50% speed reduction
  - Red zones: Damage over time
- **Fuel Consumption**: Movement drains battery

#### Jumping 🦘
- **Space Bar** (while moving): Jump over obstacles
- **Realistic Physics**: Gravity-based jump arc
- **Landing Detection**: Ground collision handling
- **Strategic Use**: Jump over rubble or hazards

#### Destroy Mechanism 💥
- **Space Bar** (while stationary): Destroy rubble in crosshair
- **Raycast Detection**: Precise targeting system
- **Animated Destruction**: Scale-down and fade effect
- **Victim Liberation**: Clearing 70%+ of rubble pile frees victim

#### Robot Damage
- **Collision Damage**: Speed-based collision with rubble
- **Zone Damage**: Environment-specific hazards
- **Health Bar**: Real-time display
- **Game Over**: Health reaches 0

### 7. 📊 10Hz Data Collection System

**Collected every 100ms (10 times per second):**

#### Robot State
- Position (x, y, z)
- Rotation (x, y, z)
- Velocity (x, y, z)
- Acceleration (x, y, z) - simulated accelerometer
- Health percentage
- Fuel/battery percentage
- Jumping status

#### Camera State
- Position (x, y, z)
- Rotation (x, y, z)
- FOV and perspective data

#### Sensor Data
- **Proximity Sensors**: Forward, left, right, back distances
- **Victim Detection**: Number and positions of nearby victims
- **Zone Detection**: Current hazard zone type
- **Fuel Station Distance**: Navigation aid

#### Player Actions (Event-based)
- Movement start/stop (W, A, S, D)
- Jump events
- Rubble destruction
- Victim rescue
- Refueling
- Collisions
- Zone transitions

#### Visual Frames
- Timestamp synchronized with game state
- Can be correlated with collected data

### 8. 📥 Downloadable Dataset (JSON)
**Comprehensive Export includes:**
- All 10Hz sensor readings
- Complete robot trajectory
- All player actions with timestamps
- Victim rescue data
- Environment configuration
- Game performance metrics
- Session metadata

**Format:** Clean JSON with hierarchical structure  
**Use Case:** AI/ML training, behavior analysis, robotics simulation

### 9. 🏆 Leaderboard System

**Three Views:**
- **Global**: Top 20 players worldwide (localStorage-based)
- **Friends**: Compare with added friends
- **Today**: Players who completed missions today

**Features:**
- Real-time rank updates
- Animated podium (Gold/Silver/Bronze medals for top 3)
- Display name and total points
- Visual feedback on user position

### 10. ⚡ BeReal-Style Daily Challenges

**"Reacture Moments" System:**
- Random daily disaster at random time (9 AM - 9 PM)
- 10-minute active window to complete
- Urgent notification style with countdown
- Different disaster each day
- Encourages daily engagement
- FOMO-driven participation

**Challenge Display:**
- Live timer showing remaining time
- Challenge icon and description
- Status indicator (Upcoming/Active/Expired)
- Pulsing animation when active

### 11. 🔥 Streak System
- **Daily Tracking**: Consecutive days played
- **Visual Display**: Fire emoji with day count
- **Persistence**: Survives browser sessions
- **Motivation**: Encourages regular play
- **Loss Condition**: Missing a day resets streak

### 12. 👥 Social Features (Foundation)
- **Friends System**: Add/manage friends
- **Friend Leaderboards**: Compare scores
- **User Profiles**: Display name, stats, history
- **Game History**: Last 50 games stored per user

### 13. 🎨 Beautiful Modern UI

**Design Language:**
- Futuristic sci-fi aesthetic
- Orbitron font for headers
- Gradient effects and animations
- Glass morphism (frosted glass effects)
- Smooth transitions
- Responsive design for mobile/tablet/desktop

**Color Palette:**
- Dark blues and purples for backgrounds
- Vibrant accents (cyan, magenta, yellow)
- Environment-specific colors
- High contrast for readability

**Animations:**
- Fade-in page transitions
- Pulsing challenge alerts
- Flame animation for streaks
- Smooth hover effects
- Robot movement animations

### 14. 🤖 Robot Features
- **3D Model**: Detailed robot with body, head, arms, legs, wheels
- **Animated Wheels**: Rotate during movement
- **Shadow Casting**: Realistic shadows
- **Sensor Eye**: Glowing red eye indicator
- **Third-Person Camera**: Orbiting camera view
- **Visible in Environment**: Full 3D presence

### 15. 🎯 Game Objectives
- **Primary**: Rescue all victims before health depletes
- **Secondary**: Maximize score through bonuses
- **Tertiary**: Complete daily challenges for streak
- **Victory Conditions**:
  - All victims saved = Victory
  - Health reaches 0 = Defeat
- **Time Pressure**: Victims' health decays over time

### 16. 📱 Responsive Design
- Mobile-friendly layouts
- Touch controls (future enhancement)
- Adaptive grid layouts
- Stacked elements on small screens
- Maintains playability across devices

---

## 🎮 Gameplay Flow

1. **Homepage** → View streak, stats, daily challenge
2. **Sign In/Sign Up** → Create or access account
3. **Environment Selection** → Choose disaster type
4. **Mission Briefing** → Review controls and objectives
5. **Gameplay** → Navigate, destroy rubble, rescue victims
6. **Mission Complete** → View score breakdown
7. **Leaderboard** → Compare with others
8. **Repeat** → New random map each time

---

## 🔧 Technical Implementation

**Technology Stack:**
- **Frontend**: Vanilla JavaScript (ES6 modules)
- **3D Engine**: Three.js (v0.160.0)
- **Storage**: LocalStorage API
- **Rendering**: WebGL with shadow mapping
- **Physics**: Custom gravity and collision system

**Performance:**
- 60 FPS target frame rate
- Optimized shadow maps (4096x4096)
- Efficient raycasting for interactions
- Throttled sensor updates (10Hz)

**Data Collection Rate:**
- 10 samples per second (100ms intervals)
- Event-driven action logging
- Minimal performance impact

---

## 📊 Data Collection Use Cases

1. **Robotics Training**: Real-world disaster response scenarios
2. **AI Pathfinding**: Navigation in cluttered environments
3. **Human-Robot Interaction**: Player decision patterns
4. **Risk Assessment**: Zone avoidance behaviors
5. **Resource Management**: Fuel/health management strategies
6. **Time-Critical Operations**: Speed vs. safety trade-offs

---

## 🚀 Future Enhancements (Potential)

- Multiplayer co-op missions
- Real-time friend challenges
- Video replay system
- Advanced robot customization
- More environment types
- Weather effects
- Voice commands
- VR support
- Backend server for global leaderboards
- Social sharing of "Reacture Moments"

---

## 🎉 Unique Selling Points

1. **BeReal-Inspired Virality**: Daily challenges create FOMO and routine
2. **Dual Purpose**: Fun game + valuable research data
3. **Social Competition**: Leaderboards and streaks drive engagement
4. **Educational Value**: Teaches disaster response concepts
5. **Random Maps**: Infinite replayability
6. **Comprehensive Data**: 10Hz collection for serious research
7. **Beautiful UI**: Modern, professional design
8. **No Installation**: Browser-based, instant play
9. **Privacy-Focused**: All data stored locally
10. **Free & Open**: Accessible to everyone

---

## 📝 How to Play

1. **Visit** `http://localhost:8000` in your browser
2. **Sign up** with a username and display name
3. **Select** an environment (Earthquake/Tsunami/Wildfire)
4. **Use Controls**:
   - W/A/S/D: Move
   - Mouse: Look around
   - Space (moving): Jump
   - Space (stationary): Destroy rubble
   - R: Refuel at station
5. **Rescue victims** by clearing rubble and approaching them
6. **Watch** your health and fuel
7. **Complete mission** and view score
8. **Download data** for research purposes

---

## 🏅 Scoring Tips

- **Rescue victims quickly** before health depletes (+200 health bonus)
- **Destroy rubble efficiently** (each piece = +5 points)
- **Complete missions fast** for time bonuses (up to +600)
- **Maintain high health** (+5 per 1% at end)
- **Save fuel** (+2 per 1% at end)
- **Avoid hazard zones** to preserve health
- **Strategic jumping** over obstacles saves fuel

---

## 📱 Daily Challenge System

**How It Works:**
- New challenge generated each day at random time
- 10-minute window to participate
- Shows countdown timer
- Encourages "drop everything and play" behavior
- Builds habit of checking in daily
- Maintains streak for consistent players

**Psychological Drivers:**
- **FOMO** (Fear of Missing Out)
- **Habit Formation** (daily routine)
- **Social Pressure** (friends playing)
- **Streak Maintenance** (don't break the chain)
- **Exclusivity** (limited time window)

---

## 🔬 Research Value

**Data Insights:**
- Human decision-making under time pressure
- Navigation strategies in hazardous environments
- Resource management in limited scenarios
- Risk tolerance and safety behaviors
- Learning curves across repeated play
- Environmental adaptation patterns
- Social influence on gameplay

**AI Training Applications:**
- Imitation learning from human players
- Reinforcement learning environment
- Path planning validation
- Sensor fusion algorithms
- Multi-objective optimization
- Emergency response simulation

---

*ReActure - Where Gaming Meets Research*  
*Collect data, save lives, compete with friends.*

