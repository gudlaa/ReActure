# ReActure Dataset Format Documentation

## Overview

ReActure generates ML-ready datasets from disaster response simulation gameplay at **10 Hz sampling rate** (100ms intervals). The dataset includes synchronized multi-modal data: robot kinematics, sensor readings, player inputs, visual frames, and environmental context.

---

## 📊 Data Collection Specification

### Sampling Rate
- **Frequency**: 10 Hz (100ms intervals)
- **Synchronization**: All modalities time-aligned
- **Format**: JSONL (JSON Lines) for scalar data
- **Frames**: Base64-encoded RGB arrays (128x128x3)

### Data Modalities

1. **Robot Kinematics** - Position, velocity, rotation
2. **Player Inputs** - Key presses, mouse movement
3. **Sensor Readings** - Proximity, zone detection, victim detection
4. **Visual Frames** - First-person camera view (10 Hz)
5. **Robot State** - Battery, damage, health, fuel
6. **Accelerometer** - Simulated IMU (x, y, z m/s²)
7. **Environmental Context** - Zone type, hazards

---

## 📁 Dataset Structure

```
reacture_<timestamp>/
├── reacture_<timestamp>_metadata.json     # Session metadata
├── reacture_<timestamp>_data.jsonl        # Time-series data (10Hz)
├── reacture_<timestamp>_frames.json       # Visual frames (base64)
└── reacture_<timestamp>_README.md         # Dataset documentation
```

---

## 📋 File Formats

### 1. `session_metadata.json`

Session-level information and summary statistics.

```json
{
  "session_id": "reacture_1731177600000_a1b2c3d4e",
  "start_time": "2025-11-09T14:22:13.000Z",
  "end_time": "2025-11-09T14:25:36.400Z",
  "duration_s": 523.4,
  "sampling_rate_hz": 10,
  "player_id": "user123",
  "player_name": "John Doe",
  "robot_model": "ReActure_v1",
  "environment": "earthquake",
  "environment_name": "Earthquake Zone",
  "game_result": {
    "victims_total": 8,
    "victims_saved": 7,
    "victims_died": 1,
    "final_score": 1850,
    "final_health": 73.2,
    "final_fuel": 45.8,
    "completion_status": "success"
  },
  "data_stats": {
    "total_samples": 5234,
    "total_frames": 5234,
    "actions_logged": 342
  }
}
```

### 2. `data.jsonl` (JSONL Format)

One JSON object per line, each representing a 100ms sample.

**Example Line:**
```json
{"timestamp":"2025-11-09T14:22:13.200Z","timestamp_ms":200,"time_elapsed_s":0.2,"type":"robot_state","event":"periodic_update_10hz","key_presses":{"W":true,"A":false,"S":false,"D":true,"Space":false,"E":false,"R":false,"mouse_dx":3.2,"mouse_dy":-1.4,"inspect":false,"destroy":false},"robot":{"position":{"x":0.45,"y":1.5,"z":-0.23},"rotation":{"x":0,"y":0.15,"z":0},"velocity":{"x":0.34,"y":0,"z":-0.12},"isJumping":false},"accelerometer":{"x":0.14,"y":-0.02,"z":0.05},"battery":87.3,"damage":0.12,"health":88.0,"fuel":87.3,"zone":"safe","camera":{"position":{"x":0.45,"y":3.0,"z":-0.23},"rotation":{"x":-0.05,"y":0.15,"z":0},"yaw":0.15,"pitch":-0.05},"sensors":{"proximity":5.2,"proximitySensors":{"forward":5.2,"left":8.1,"right":7.3,"back":10.0},"victimsDetected":2,"victims":[{"distance":12.5,"angle":1.57,"health":87}],"fuelStationDistance":25.3,"zone":"safe","inYellowZone":false,"inRedZone":false},"visual_frame_path":"frames/frame_000002.npy"}
```

### 3. `frames.json`

Visual frame manifest with base64-encoded image data.

```json
[
  {
    "path": "frames/frame_000001.npy",
    "timestamp_ms": 100,
    "width": 128,
    "height": 128,
    "shape": [128, 128, 3],
    "dtype": "uint8",
    "data_base64": "iVBORw0KGgoAAAANSUhEUg..."
  },
  ...
]
```

---

## 🔬 Data Fields Reference

### Core Fields (Every Sample)

| Field | Type | Description | Range/Units |
|-------|------|-------------|-------------|
| `timestamp` | string (ISO8601) | Absolute timestamp | "2025-11-09T14:22:13.200Z" |
| `timestamp_ms` | integer | Milliseconds since game start | 0 - duration_ms |
| `time_elapsed_s` | float | Seconds since game start | 0.0 - duration_s |
| `type` | string | Log entry type | "robot_state" or "player_action" |
| `event` | string | Event name | "periodic_update_10hz", etc. |

### Key Presses

| Field | Type | Description | Values |
|-------|------|-------------|--------|
| `key_presses.W` | boolean | Forward movement | true/false |
| `key_presses.A` | boolean | Left strafe | true/false |
| `key_presses.S` | boolean | Backward movement | true/false |
| `key_presses.D` | boolean | Right strafe | true/false |
| `key_presses.Space` | boolean | Jump/Destroy (momentary) | true/false |
| `key_presses.E` | boolean | Inspect mode active | true/false |
| `key_presses.R` | boolean | Refuel (momentary) | true/false |
| `key_presses.mouse_dx` | float | Mouse X delta | pixels |
| `key_presses.mouse_dy` | float | Mouse Y delta | pixels |
| `key_presses.inspect` | boolean | Infrared active | true/false |
| `key_presses.destroy` | boolean | Destroying rubble | true/false |

### Robot State

| Field | Type | Description | Units |
|-------|------|-------------|-------|
| `robot.position.x` | float | X coordinate | meters |
| `robot.position.y` | float | Y coordinate (height) | meters |
| `robot.position.z` | float | Z coordinate | meters |
| `robot.rotation.x` | float | Pitch rotation | radians |
| `robot.rotation.y` | float | Yaw rotation | radians |
| `robot.rotation.z` | float | Roll rotation | radians |
| `robot.velocity.x` | float | X velocity | m/s |
| `robot.velocity.y` | float | Y velocity | m/s |
| `robot.velocity.z` | float | Z velocity | m/s |
| `robot.isJumping` | boolean | Jump state | true/false |

### Accelerometer (IMU)

| Field | Type | Description | Units |
|-------|------|-------------|-------|
| `accelerometer.x` | float | X-axis acceleration | m/s² |
| `accelerometer.y` | float | Y-axis acceleration | m/s² |
| `accelerometer.z` | float | Z-axis acceleration | m/s² |

### Battery & Damage

| Field | Type | Description | Range |
|-------|------|-------------|-------|
| `battery` | float | Battery/fuel level | 0-100 (percentage) |
| `damage` | float | Damage level | 0.0-1.0 (0=no damage, 1=destroyed) |
| `health` | float | Health percentage | 0-100 |
| `fuel` | float | Fuel percentage | 0-100 |

### Camera (First-Person View)

| Field | Type | Description | Units |
|-------|------|-------------|-------|
| `camera.position.x/y/z` | float | Camera position | meters |
| `camera.rotation.x/y/z` | float | Camera rotation | radians |
| `camera.yaw` | float | Horizontal rotation | radians |
| `camera.pitch` | float | Vertical rotation | radians |

### Sensors

| Field | Type | Description | Units |
|-------|------|-------------|-------|
| `sensors.proximity` | float | Forward distance | meters |
| `sensors.proximitySensors` | object | Multi-directional distances | meters |
| `sensors.victimsDetected` | integer | Number of nearby victims | count |
| `sensors.victims` | array | Victim details (distance, angle, health) | - |
| `sensors.fuelStationDistance` | float | Distance to fuel station | meters |
| `sensors.zone` | string | Current zone type | "safe", "yellow", "red" |
| `sensors.inYellowZone` | boolean | In caution zone | true/false |
| `sensors.inRedZone` | boolean | In danger zone | true/false |

### Visual Frames

| Field | Type | Description | Format |
|-------|------|-------------|--------|
| `visual_frame_path` | string | Frame reference | "frames/frame_000123.npy" |
| Frame data in frames.json | base64 string | RGB image data | 128x128x3 uint8 |

---

## 🔧 Data Processing

### Loading with Python

```python
from load_reacture_dataset import ReActureDataset

# Load dataset
dataset = ReActureDataset('reacture_1731177600000_metadata.json')

# Iterate through samples
for sample in dataset:
    position = sample['robot']['position']
    keys = sample['key_presses']
    frame = sample['frame']  # NumPy array (128, 128, 3)
    battery = sample['battery']
    damage = sample['damage']
```

### PyTorch DataLoader

```python
# Create PyTorch dataloader
dataloader = dataset.to_pytorch_dataloader(batch_size=32, shuffle=True)

for batch in dataloader:
    frames = batch['frame']           # (32, 3, 128, 128)
    keys = batch['keys']              # (32, 6)
    position = batch['position']      # (32, 3)
    accelerometer = batch['accelerometer']  # (32, 3)
    battery = batch['battery']        # (32, 1)
    damage = batch['damage']          # (32, 1)
```

### TensorFlow Dataset

```python
# Create TensorFlow dataset
tf_dataset = dataset.to_tensorflow_dataset(batch_size=32, shuffle=True)

for batch in tf_dataset:
    frames = batch['frame']           # (32, 128, 128, 3)
    keys = batch['keys']              # (32, 6)
    position = batch['position']      # (32, 3)
    battery = batch['battery']        # (32, 1)
```

### Extract Specific Data

```python
# Extract trajectory
trajectory = dataset.extract_trajectory()  # (N, 3) array

# Extract key presses
keys = dataset.extract_key_presses()  # (N, 6) binary matrix

# Extract sensor data
accel = dataset.extract_accelerometer()  # (N, 3) array
battery, damage = dataset.extract_battery_damage()  # (N,) arrays

# Get frames as 4D array
frames = dataset.get_frames_as_array()  # (N, 128, 128, 3)
```

---

## 🎯 Use Cases

### 1. Imitation Learning
Train agent to mimic human player behavior.

```python
# Input: visual frame + sensor data
# Output: key presses (action)

for sample in dataset:
    state = {
        'frame': sample['frame'],
        'sensors': sample['sensors'],
        'battery': sample['battery']
    }
    action = sample['key_presses']
    
    # Train model: policy(state) -> action
```

### 2. Path Planning
Learn navigation in cluttered environments.

```python
# Input: start position + goal + obstacles
# Output: trajectory

trajectory = dataset.extract_trajectory()
# Train planner with trajectory data
```

### 3. Risk Assessment
Learn when to take risks vs. play safe.

```python
for sample in dataset:
    risk_factors = {
        'battery': sample['battery'],
        'damage': sample['damage'],
        'zone': sample['sensors']['zone']
    }
    action = sample['key_presses']
    
    # Learn risk-aware policies
```

### 4. Sensor Fusion
Combine multiple sensor modalities.

```python
for sample in dataset:
    sensor_data = {
        'visual': sample['frame'],
        'proximity': sample['sensors']['proximitySensors'],
        'accelerometer': sample['accelerometer'],
        'position': sample['robot']['position']
    }
    
    # Train fusion model
```

---

## 📊 Dataset Statistics

### Typical Session
- **Duration**: 2-10 minutes
- **Samples**: 1,200 - 6,000 (at 10 Hz)
- **Frames**: Same as samples (10 Hz synchronized)
- **File Sizes**:
  - JSONL: 5-30 MB
  - Frames JSON: 50-300 MB (base64 encoded)
  - Metadata: < 1 KB
  - Total: ~60-330 MB per session

### Data Volume
- **10 second game**: ~100 samples, ~100 frames
- **1 minute game**: ~600 samples, ~600 frames
- **5 minute game**: ~3,000 samples, ~3,000 frames

---

## 🔬 Research Applications

### Robotics
- Path planning in disaster scenarios
- Obstacle avoidance strategies
- Multi-objective optimization (rescue vs. safety)
- Resource management (battery optimization)

### AI/ML
- Imitation learning from human operators
- Reinforcement learning environment
- Computer vision (victim detection through rubble)
- Sensor fusion algorithms

### Human Factors
- Decision-making under time pressure
- Risk tolerance analysis
- Learning curves
- Strategy evolution

---

## 🛠️ Tools & Libraries

### Python Loader
- **File**: `load_reacture_dataset.py`
- **Dependencies**: NumPy, PyTorch/TensorFlow (optional)
- **Features**:
  - JSONL parsing
  - Frame decoding
  - PyTorch DataLoader
  - TensorFlow Dataset
  - Trajectory extraction
  - Visualization tools

### Installation
```bash
pip install -r requirements.txt
```

### Basic Usage
```bash
python load_reacture_dataset.py reacture_1731177600000_metadata.json
```

---

## 📝 Data Quality

### Synchronization
- All modalities sampled at exactly 10 Hz
- Timestamps synchronized across all data
- Frame capture aligned with state samples
- No missing samples (complete time series)

### Accuracy
- Position: ±0.01m
- Rotation: ±0.001 radians
- Battery/Damage: ±0.1%
- Accelerometer: Simulated (consistent with motion)
- Timestamps: Millisecond precision

### Completeness
- Every 100ms sample includes all fields
- No NaN or null values (except optional frames)
- Consistent schema across all samples
- Action logs capture all player inputs

---

## 🎮 Gameplay Context

### Environments
- **Earthquake**: Collapsed buildings, unstable rubble
- **Tsunami**: Flooded areas, water hazards
- **Wildfire**: Fire zones, spreading flames

### Actions
- **Movement**: WASD keys (binary states)
- **Camera**: Mouse movement (continuous)
- **Inspect**: E key (x-ray vision, 3s duration)
- **Destroy**: Space key (rubble destruction)
- **Rescue**: Mouse click (victim retrieval)
- **Refuel**: R key (battery replenishment)

### Objectives
- Rescue all victims before health depletes
- Maximize score through efficiency
- Balance speed vs. safety
- Manage battery and damage

---

## 💡 Example Analyses

### 1. Trajectory Analysis
```python
trajectory = dataset.extract_trajectory()
import matplotlib.pyplot as plt

plt.plot(trajectory[:, 0], trajectory[:, 2])
plt.xlabel('X Position (m)')
plt.ylabel('Z Position (m)')
plt.title('Robot Path')
plt.show()
```

### 2. Battery Drain Analysis
```python
battery, damage = dataset.extract_battery_damage()
times = [s['time_elapsed_s'] for s in dataset.samples 
         if s['type'] == 'robot_state']

plt.plot(times, battery, label='Battery')
plt.plot(times, damage * 100, label='Damage')
plt.legend()
plt.show()
```

### 3. Key Press Frequency
```python
keys = dataset.extract_key_presses()
key_names = ['W', 'A', 'S', 'D', 'Inspect', 'Destroy']
frequencies = keys.mean(axis=0)

plt.bar(key_names, frequencies)
plt.ylabel('Press Frequency')
plt.show()
```

### 4. Frame Visualization
```python
frames = dataset.get_frames_as_array()

# Show first frame
plt.imshow(frames[0])
plt.title('First-Person View')
plt.show()

# Create video
import cv2
out = cv2.VideoWriter('gameplay.mp4', 
                      cv2.VideoWriter_fourcc(*'mp4v'),
                      10, (128, 128))

for frame in frames:
    out.write(cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))

out.release()
```

---

## 🚀 Training Examples

### Imitation Learning (Behavior Cloning)

```python
import torch
import torch.nn as nn

dataset = ReActureDataset('metadata.json')
dataloader = dataset.to_pytorch_dataloader(batch_size=32)

class PolicyNetwork(nn.Module):
    def __init__(self):
        super().__init__()
        # CNN for visual input
        self.conv = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Flatten()
        )
        
        # MLP for combined features
        self.fc = nn.Sequential(
            nn.Linear(64 * 32 * 32 + 10, 256),
            nn.ReLU(),
            nn.Linear(256, 6)  # 6 action outputs (WASD + inspect + destroy)
        )
    
    def forward(self, frame, state_features):
        vis_features = self.conv(frame)
        combined = torch.cat([vis_features, state_features], dim=1)
        return torch.sigmoid(self.fc(combined))

# Training loop
model = PolicyNetwork()
optimizer = torch.optim.Adam(model.parameters())
criterion = nn.BCELoss()

for epoch in range(10):
    for batch in dataloader:
        frames = batch['frame']
        
        # Combine battery, damage, position as state features
        state_features = torch.cat([
            batch['battery'],
            batch['damage'],
            batch['position'][:, :2],  # x, z position
            batch['velocity'][:, :2],  # x, z velocity
            batch['accelerometer'][:, :2]  # x, z accel
        ], dim=1)  # 10 features
        
        # Target actions
        target_actions = batch['keys']
        
        # Forward pass
        predicted_actions = model(frames, state_features)
        
        # Compute loss
        loss = criterion(predicted_actions, target_actions)
        
        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    
    print(f"Epoch {epoch}: Loss = {loss.item():.4f}")
```

### Reinforcement Learning Environment

```python
# Use dataset for offline RL or env initialization
samples = dataset.get_time_range(0, 60)  # First 60s

# Extract expert trajectories for initialization
expert_positions = [s['robot']['position'] for s in samples]
expert_actions = [s['key_presses'] for s in samples]

# Train RL agent with expert demonstrations
```

---

## 📚 Dataset Schema Version

**Version**: 1.0  
**Date**: 2025-11-09  
**Compatible with**: ReActure v1.0+

---

## 🔗 Links

- **Game**: https://github.com/gudlaa/ReActure
- **Documentation**: See README.md in game repository
- **Issues**: https://github.com/gudlaa/ReActure/issues

---

## 📄 License

Data generated from ReActure gameplay. For research and educational purposes.

---

## ✅ Validation Checklist

When loading a dataset, verify:
- [ ] Metadata file exists and parses
- [ ] JSONL file has expected number of lines
- [ ] All timestamps are sequential
- [ ] Sampling rate is consistent (~100ms between samples)
- [ ] Frames manifest matches sample count
- [ ] All required fields present
- [ ] No NaN or null values
- [ ] Battery/damage in valid ranges
- [ ] Positions within reasonable bounds

---

*Generated by ReActure v1.0 - Disaster Response Simulation*  
*For ML training and robotics research*

