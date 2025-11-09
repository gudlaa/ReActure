# 🤖 ML Dataset Quick Start - ReActure

## 📊 Generate Your First Dataset

### Step 1: Play the Game
```bash
cd /Users/anoushkagudla/Desktop/ReActure/ReActure-1
python3 -m http.server 8000
# Open http://localhost:8000
```

### Step 2: Complete a Mission
- Sign in
- Choose environment
- Play for 2-5 minutes
- Rescue some victims
- Complete or fail the mission

### Step 3: Download Dataset
- Click "📥 Download Data" button
- **4 files will download:**
  1. `reacture_XXXXX_metadata.json`
  2. `reacture_XXXXX_data.jsonl`
  3. `reacture_XXXXX_frames.json`
  4. `reacture_XXXXX_README.md`

---

## 🐍 Load Dataset in Python

### Installation
```bash
pip install numpy
# Optional:
pip install torch tensorflow matplotlib pandas
```

### Load and Explore
```python
from load_reacture_dataset import ReActureDataset

# Load dataset
dataset = ReActureDataset('reacture_1731177600000_metadata.json')

# Print statistics
stats = dataset.get_statistics()
print(f"Samples: {stats['num_samples']}")
print(f"Frames: {stats['num_frames']}")
print(f"Duration: {stats['duration_s']:.1f}s")

# Iterate through data
for i, sample in enumerate(dataset):
    if i >= 5:  # First 5 samples
        break
    
    print(f"\nSample {i}:")
    print(f"  Time: {sample['time_elapsed_s']:.2f}s")
    print(f"  Position: {sample['robot']['position']}")
    print(f"  Battery: {sample['battery']:.1f}%")
    print(f"  Damage: {sample['damage']:.3f}")
    print(f"  Keys: W={sample['key_presses']['W']}")
    
    if sample['frame'] is not None:
        print(f"  Frame: {sample['frame'].shape}")
```

---

## 🔥 PyTorch Training Example

### Simple Behavior Cloning

```python
import torch
import torch.nn as nn
from load_reacture_dataset import ReActureDataset

# Load dataset
dataset = ReActureDataset('metadata.json')
dataloader = dataset.to_pytorch_dataloader(batch_size=32, shuffle=True)

# Define policy network
class RobotPolicy(nn.Module):
    def __init__(self):
        super().__init__()
        # Vision encoder
        self.cnn = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Flatten()
        )
        
        # State encoder
        self.state_fc = nn.Linear(10, 64)  # battery, damage, position, etc.
        
        # Action decoder
        self.action_fc = nn.Sequential(
            nn.Linear(64 * 32 * 32 + 64, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 6),  # W, A, S, D, inspect, destroy
            nn.Sigmoid()
        )
    
    def forward(self, frame, state):
        vis = self.cnn(frame)
        state_features = torch.relu(self.state_fc(state))
        combined = torch.cat([vis, state_features], dim=1)
        return self.action_fc(combined)

# Create model
model = RobotPolicy().cuda()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.BCELoss()

# Training loop
for epoch in range(10):
    total_loss = 0
    
    for batch in dataloader:
        frames = batch['frame'].cuda()
        
        # Combine state features
        state = torch.cat([
            batch['battery'],
            batch['damage'],
            batch['position'],
            batch['velocity'][:, :2],  # x, z velocity
            batch['accelerometer'][:, :2]  # x, z accel
        ], dim=1).cuda()
        
        # Target actions
        target = batch['keys'].cuda()
        
        # Forward
        pred = model(frames, state)
        loss = criterion(pred, target)
        
        # Backward
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    print(f"Epoch {epoch}: Loss = {total_loss/len(dataloader):.4f}")

print("✅ Training complete!")
```

---

## 🧠 TensorFlow Training Example

```python
import tensorflow as tf
from load_reacture_dataset import ReActureDataset

# Load dataset
dataset = ReActureDataset('metadata.json')
tf_dataset = dataset.to_tensorflow_dataset(batch_size=32)

# Define model
model = tf.keras.Sequential([
    # Vision branch
    tf.keras.layers.Conv2D(32, 3, activation='relu', input_shape=(128, 128, 3)),
    tf.keras.layers.MaxPooling2D(2),
    tf.keras.layers.Conv2D(64, 3, activation='relu'),
    tf.keras.layers.MaxPooling2D(2),
    tf.keras.layers.Flatten(),
    
    # Combined layers
    tf.keras.layers.Dense(256, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(6, activation='sigmoid')  # 6 actions
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# Prepare dataset
def extract_xy(batch):
    x = batch['frame']
    y = batch['keys']
    return x, y

train_ds = tf_dataset.map(extract_xy)

# Train
model.fit(train_ds, epochs=10)

print("✅ Training complete!")
```

---

## 📊 Data Exploration

### Extract Key Metrics

```python
dataset = ReActureDataset('metadata.json')

# Get all trajectories
trajectory = dataset.extract_trajectory()
print(f"Total distance traveled: {np.sum(np.diff(trajectory, axis=0)**2)**0.5:.1f}m")

# Get action statistics
keys = dataset.extract_key_presses()
print(f"Forward time: {keys[:, 0].sum() * 0.1:.1f}s")  # W key at 10Hz
print(f"Inspect usage: {keys[:, 4].sum()} times")

# Battery analysis
battery, damage = dataset.extract_battery_damage()
print(f"Battery drain rate: {(battery[0] - battery[-1]) / len(battery) * 10:.2f}%/s")
print(f"Max damage: {damage.max() * 100:.1f}%")
```

### Visualize First-Person View

```python
import matplotlib.pyplot as plt

frames = dataset.get_frames_as_array()

# Show grid of frames
fig, axes = plt.subplots(3, 3, figsize=(12, 12))
for i, ax in enumerate(axes.flat):
    if i < len(frames):
        ax.imshow(frames[i * 100])  # Every 100th frame
        ax.set_title(f"Frame {i * 100}")
        ax.axis('off')

plt.tight_layout()
plt.show()
```

---

## 🎯 Advanced Usage

### Time-Synchronized Data Access

```python
# Get data at specific time
sample_at_10s = dataset.get_sample_at_time(10.0)
print(f"Robot at 10s: {sample_at_10s['robot']['position']}")

# Get time range
first_minute = dataset.get_time_range(0, 60)
print(f"Samples in first minute: {len(first_minute)}")
```

### Multi-Session Loading

```python
from load_reacture_dataset import load_multiple_sessions

# Load multiple gameplay sessions
datasets = load_multiple_sessions([
    'session1_metadata.json',
    'session2_metadata.json',
    'session3_metadata.json'
])

# Combine trajectories
all_trajectories = [ds.extract_trajectory() for ds in datasets]
combined = np.concatenate(all_trajectories, axis=0)

print(f"Total samples across {len(datasets)} sessions: {len(combined)}")
```

### Custom Data Pipeline

```python
# Create custom dataset for specific task
class VictimDetectionDataset(torch.utils.data.Dataset):
    def __init__(self, reacture_dataset):
        self.dataset = reacture_dataset
        
        # Filter to samples where victims are detected
        self.victim_samples = [
            i for i, s in enumerate(reacture_dataset.samples)
            if s['type'] == 'robot_state' and 
               s['sensors']['victimsDetected'] > 0
        ]
    
    def __len__(self):
        return len(self.victim_samples)
    
    def __getitem__(self, idx):
        sample = self.dataset[self.victim_samples[idx]]
        
        frame = torch.from_numpy(sample['frame']).float() / 255.0
        frame = frame.permute(2, 0, 1)  # HWC to CHW
        
        # Target: number of victims detected
        num_victims = sample['sensors']['victimsDetected']
        
        return frame, num_victims

# Use for training victim detection model
victim_dataset = VictimDetectionDataset(dataset)
victim_loader = torch.utils.data.DataLoader(victim_dataset, batch_size=16)
```

---

## 💾 Save Frames as NumPy Files

### Individual .npy Files

```python
dataset = ReActureDataset('metadata.json')

# Save all frames
dataset.save_frames_as_npy('frames_npy')

# Now you have:
# frames_npy/frame_000001.npy
# frames_npy/frame_000002.npy
# ...

# Load individual frame
import numpy as np
frame = np.load('frames_npy/frame_000001.npy')
print(frame.shape)  # (128, 128, 3)
```

---

## 📈 Benchmark Scripts

### Dataset Performance

```python
import time

dataset = ReActureDataset('metadata.json')

# Test iteration speed
start = time.time()
count = 0
for sample in dataset:
    count += 1

elapsed = time.time() - start
print(f"Iterated {count} samples in {elapsed:.2f}s")
print(f"Rate: {count/elapsed:.0f} samples/s")

# Test batch loading
dataloader = dataset.to_pytorch_dataloader(batch_size=32)

start = time.time()
for batch in dataloader:
    pass

elapsed = time.time() - start
print(f"Loaded {len(dataset)} samples in batches: {elapsed:.2f}s")
```

---

## 🎓 Research Ideas

### Possible Research Topics

1. **Imitation Learning**
   - Learn rescue strategies from human players
   - Compare expert vs. novice behaviors
   
2. **Path Planning**
   - Navigation in cluttered environments
   - Dynamic obstacle avoidance
   
3. **Risk Assessment**
   - Balance safety vs. mission urgency
   - Battery management strategies
   
4. **Computer Vision**
   - Victim detection through rubble
   - Hazard zone identification
   - Semantic segmentation
   
5. **Multi-Task Learning**
   - Rescue + navigate + manage resources
   - Transfer across environments
   
6. **Reinforcement Learning**
   - Use as offline RL dataset
   - Learn from human demonstrations
   
7. **Human Factors**
   - Decision-making under pressure
   - Learning curves
   - Strategy adaptation

---

## 📞 Support

### Questions?
- Check `DATASET_FORMAT.md` for complete reference
- See `load_reacture_dataset.py` for code examples
- Open issues on GitHub

### Contributing
- Share your trained models
- Contribute dataset analysis scripts
- Report data quality issues

---

## ✅ Quick Checklist

**To generate dataset:**
- [ ] Play ReActure for 2+ minutes
- [ ] Click "Download Data" button
- [ ] Receive 4 files

**To load dataset:**
- [ ] Install: `pip install numpy`
- [ ] Run: `python load_reacture_dataset.py metadata.json`
- [ ] See statistics and samples

**To train model:**
- [ ] Install PyTorch or TensorFlow
- [ ] Use `dataset.to_pytorch_dataloader()`
- [ ] Implement your model
- [ ] Train and evaluate!

---

## 🎉 You're Ready!

**Dataset System:**
- ✅ 10 Hz sampling
- ✅ Multi-modal data
- ✅ JSONL format
- ✅ Visual frames
- ✅ Session metadata
- ✅ Python loader
- ✅ PyTorch/TF support
- ✅ Complete documentation

**Start generating data and training models!** 🚀

*Play → Download → Train → Repeat*

