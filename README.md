# ReActure - Disaster Rescue Simulation

A gamified data collection platform for training AI robots in disaster rescue scenarios. This project collects comprehensive sensor data and player actions to train robots for real-world disaster response situations.

## Overview

ReActure simulates a disaster scenario where a robot must rescue victims trapped under rubble. The game tracks all robot sensor data, environmental states, and player actions, creating a rich dataset for training AI models in spatial planning, obstacle navigation, and rescue operations.

## Features

### Game Mechanics
- **Robot Movement**: First-person control with realistic physics
- **Rubble Destruction**: Destroy rubble pieces to clear paths to victims
- **Victim Rescue**: Locate and rescue victims before their health depletes
- **Zone System**: 
  - Yellow zones slow robot movement
  - Red zones damage the robot over time
- **Resource Management**: 
  - Robot health (damaged by collisions and red zones)
  - Fuel/battery system (consumed during movement)
  - Fuel station for refueling

### Data Collection
The game logs comprehensive data including:
- **Robot State**: Position, rotation, velocity, health, fuel, current zone
- **Sensor Data**: 
  - Proximity sensors (distance to obstacles)
  - Victim detection (number of victims in range)
  - Zone detection (current zone type and status)
- **Player Actions**: All movement, destruction, and interaction events
- **Environmental State**: Rubble positions, victim health, zone locations
- **Temporal Data**: Timestamps for all events

## How to Run

**⚠️ IMPORTANT: You must be in the ReActure directory when starting the server!**

1. **Navigate to the project directory**:
   ```bash
   cd ~/Desktop/ReActure/ReActure
   ```

2. **Start a local server** (choose one):

   **Option A - Python** (Recommended):
   ```bash
   python3 -m http.server 8000
   ```

   **Option B - Node.js**:
   ```bash
   npx http-server -p 8000
   ```

3. **Open in your browser**:
   ```
   http://localhost:8000
   ```

4. **You should see**:
   - A beautiful start screen with the ReActure title
   - Mission briefing and controls
   - Click "Start Mission" to begin!

**Note**: If you see a directory listing instead of the game, you're in the wrong directory. Make sure you `cd` into the `ReActure/ReActure` folder first!

## Controls

- **WASD / Arrow Keys**: Move robot
- **Mouse**: Look around (click to lock pointer)
- **Space**: Destroy rubble piece you're pointing at
- **R**: Refuel at fuel station (must be close)

## Data Export

After completing a mission, click "Download Data Logs" to export all collected data as a JSON file. The logs include:

- Timestamped robot states with sensor readings
- All player actions with context
- Environmental changes (rubble destruction, victim rescue)
- Final mission statistics

## Data Format

Each log entry contains:
```json
{
  "timestamp": 12345,
  "type": "robot_state" | "player_action",
  "event": "event_name",
  "robot": {
    "position": { "x": 0, "y": 1.6, "z": 0 },
    "rotation": { "x": 0, "y": 0, "z": 0 },
    "health": 100,
    "fuel": 100,
    "zone": "safe" | "yellow" | "red",
    "velocity": { "x": 0, "y": 0, "z": 0 }
  },
  "sensors": {
    "proximity": 5.2,
    "victimsDetected": 2,
    "zone": "yellow",
    "inYellowZone": true,
    "inRedZone": false
  }
}
```

## Use Cases for AI Training

This data can be used to train AI models for:
- **Spatial Planning**: Understanding 3D environments and obstacle navigation
- **Decision Making**: When to destroy rubble vs. find alternative paths
- **Resource Management**: Balancing fuel consumption with rescue urgency
- **Multi-objective Optimization**: Maximizing victims saved while minimizing damage
- **Sensor Fusion**: Combining proximity, visual, and zone data for navigation

## Technical Stack

- **Three.js**: 3D graphics and rendering
- **WebGL**: Hardware-accelerated graphics
- **Vanilla JavaScript**: No framework dependencies for maximum compatibility

## Future Enhancements

- Multiple robot types with different capabilities
- More complex rubble physics
- Weather and time-of-day effects
- Multi-player cooperative rescue
- Real-time AI agent training mode
- Integration with reinforcement learning frameworks

## License

Created for hackathon submission - "Beyond the Dataset" track.

