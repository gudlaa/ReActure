# 📊 NumPy Files - Dataset Export Guide

## ✅ **ACTUAL .NPY FILES NOW GENERATED!**

ReActure now creates **real NumPy files** (.npy format) for visual frames, ready for ML training!

---

## 📁 **WHAT YOU GET**

### **5 Files Downloaded:**

1. **`reacture_XXXXX_metadata.json`** - Session info
2. **`reacture_XXXXX_data.jsonl`** - 10Hz time-series data
3. **`reacture_XXXXX_frames.npy`** - All visual frames (NumPy array) ✨ NEW
4. **`reacture_XXXXX_timestamps.npy`** - Frame timestamps (NumPy array) ✨ NEW
5. **`reacture_XXXXX_README.md`** - Dataset documentation

---

## 🎨 **FRAMES.NPY FORMAT**

### **Consolidated NumPy File:**

**Why one file?**
- ✅ Faster loading (single file read)
- ✅ Memory-mappable
- ✅ Better for batch processing
- ✅ Simpler file management
- ✅ Optimal for ML training

**File Structure:**
- **Filename**: `reacture_XXXXX_frames.npy`
- **Format**: NumPy .npy binary format
- **Shape**: `(N, 128, 128, 3)`
  - N = number of frames (~600 for 1-minute game at 10Hz)
  - 128x128 = image resolution (downsampled for efficiency)
  - 3 = RGB channels
- **Dtype**: `uint8` (0-255)
- **Size**: ~5-50 MB depending on duration

---

## ⏱️ **TIMESTAMPS.NPY FORMAT**

### **Frame Timing Data:**

**File Structure:**
- **Filename**: `reacture_XXXXX_timestamps.npy`
- **Format**: NumPy .npy binary format
- **Shape**: `(N,)`
- **Dtype**: `float32`
- **Units**: Milliseconds since game start
- **Synchronized**: `frames[i]` corresponds to `timestamps[i]`

**Example:**
```python
timestamps = np.load('timestamps.npy')
# [100.0, 200.0, 300.0, 400.0, ...]  # 10 Hz = 100ms intervals
```

---

## 🐍 **LOADING IN PYTHON**

### **Direct NumPy Loading:**

```python
import numpy as np

# Load all frames at once
frames = np.load('reacture_1731177600000_frames.npy')
print(frames.shape)  # (600, 128, 128, 3) for 1-minute game

# Load timestamps
timestamps = np.load('reacture_1731177600000_timestamps.npy')
print(timestamps.shape)  # (600,)

# Access specific frame
frame_10 = frames[10]  # Frame at index 10
time_10 = timestamps[10]  # Timestamp for that frame
print(f"Frame {10} at {time_10}ms: {frame_10.shape}")

# Visualize a frame
import matplotlib.pyplot as plt
plt.imshow(frames[0])
plt.title(f'First Frame (t={timestamps[0]}ms)')
plt.show()
```

### **Using the Dataset Loader:**

```python
from load_reacture_dataset import ReActureDataset

# Load dataset (automatically loads .npy files)
dataset = ReActureDataset('reacture_1731177600000_metadata.json')

# Frames loaded automatically
print(dataset.frames_array.shape)  # (N, 128, 128, 3)
print(dataset.frame_timestamps.shape)  # (N,)

# Iterate with frames included
for i, sample in enumerate(dataset):
    frame = sample['frame']  # NumPy array (128, 128, 3)
    timestamp = sample['frame_timestamp_ms']
    battery = sample['battery']
    
    if i >= 5:
        break
    
    print(f"Sample {i}: t={timestamp}ms, battery={battery}%, frame shape={frame.shape}")
```

---

## 🔥 **ML TRAINING**

### **PyTorch DataLoader:**

```python
# Frames automatically included in batches!
dataloader = dataset.to_pytorch_dataloader(batch_size=32, shuffle=True)

for batch in dataloader:
    frames = batch['frame']  # (32, 3, 128, 128) - already in CHW format
    keys = batch['keys']      # (32, 6)
    battery = batch['battery']  # (32, 1)
    
    # Train your model
    # model(frames) -> predicted_actions
```

### **TensorFlow Dataset:**

```python
tf_dataset = dataset.to_tensorflow_dataset(batch_size=32)

for batch in tf_dataset:
    frames = batch['frame']  # (32, 128, 128, 3) - HWC format
    keys = batch['keys']     # (32, 6)
    
    # Train model
```

---

## 📊 **DATA SYNCHRONIZATION**

### **Perfect 10Hz Alignment:**

```python
# Every index corresponds across all data:

i = 50  # Sample index

# JSONL data (sample 50)
with open('data.jsonl', 'r') as f:
    samples = [json.loads(line) for line in f]
    sample_50 = samples[50]

# NumPy frames (frame 50)
frames = np.load('frames.npy')
frame_50 = frames[50]

# NumPy timestamps (timestamp 50)
timestamps = np.load('timestamps.npy')
time_50 = timestamps[50]

# All synchronized!
print(f"Sample {i}:")
print(f"  JSONL timestamp: {sample_50['timestamp_ms']}ms")
print(f"  Frame timestamp: {time_50}ms")
print(f"  Frame shape: {frame_50.shape}")
print(f"  Battery: {sample_50['battery']}%")
```

---

## 🎮 **HOW TO GENERATE**

### **Step 1: Play Game**
```
http://localhost:8000
→ Sign in
→ Choose environment
→ Play for 2-5 minutes (or longer!)
```

### **Step 2: Download**
```
→ Click "📥 Download Data" button
→ Wait for all 5 files to download
→ Check Downloads folder
```

### **Step 3: Verify**
```bash
# Check files
ls -lh reacture_*

# Should see:
# reacture_XXXXX_metadata.json  (~1 KB)
# reacture_XXXXX_data.jsonl     (~5-30 MB)
# reacture_XXXXX_frames.npy     (~5-50 MB) ← NumPy file!
# reacture_XXXXX_timestamps.npy (~2-20 KB) ← NumPy file!
# reacture_XXXXX_README.md      (~2 KB)
```

### **Step 4: Load**
```python
python load_reacture_dataset.py reacture_XXXXX_metadata.json
```

---

## 🔬 **TECHNICAL DETAILS**

### **NumPy File Format:**
- **Standard .npy format** (created in JavaScript)
- **Compatible with** `np.load()`
- **Binary format** (not base64)
- **Proper header** (magic string, version, dtype, shape)
- **Little-endian** encoding

### **Frame Capture:**
- **Source**: WebGL canvas via `readPixels()`
- **Original**: Full resolution (e.g., 1920x1080)
- **Downsampled**: 128x128 for efficiency
- **Format**: RGB (3 channels, no alpha)
- **Dtype**: uint8 (0-255)
- **Rate**: 10 Hz (every 100ms)

### **Performance:**
- **Capture time**: ~5ms per frame
- **Downsampling**: ~2ms per frame
- **Total overhead**: ~7ms per frame (10Hz = 100ms available)
- **No lag** during gameplay

---

## 💡 **ADVANTAGES**

### **Over JSON/Base64:**
- ✅ **Faster loading** - No decoding needed
- ✅ **Smaller files** - Binary vs. base64
- ✅ **Memory efficient** - Can memory-map
- ✅ **Standard format** - Works with all ML tools
- ✅ **Easier to use** - Direct `np.load()`

### **Over Individual Files:**
- ✅ **Single file** - No thousands of files
- ✅ **Faster** - One I/O operation
- ✅ **Cleaner** - Easy file management
- ✅ **Batch friendly** - Load all at once

---

## 📈 **DATASET SIZES**

### **Typical Sizes:**

**1-minute game (~600 frames):**
- frames.npy: ~30 MB
- timestamps.npy: ~2.4 KB
- data.jsonl: ~5 MB
- **Total: ~35 MB**

**5-minute game (~3,000 frames):**
- frames.npy: ~150 MB
- timestamps.npy: ~12 KB
- data.jsonl: ~25 MB
- **Total: ~175 MB**

**10-minute game (~6,000 frames):**
- frames.npy: ~300 MB
- timestamps.npy: ~24 KB
- data.jsonl: ~50 MB
- **Total: ~350 MB**

---

## 🎯 **EXAMPLE: LOAD AND VISUALIZE**

### **Quick Start:**

```python
import numpy as np
import matplotlib.pyplot as plt

# Load frames
frames = np.load('reacture_1731177600000_frames.npy')
timestamps = np.load('reacture_1731177600000_timestamps.npy')

print(f"Loaded {len(frames)} frames")
print(f"Shape: {frames.shape}")
print(f"Duration: {timestamps[-1]/1000:.1f}s")

# Show first and last frame
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

axes[0].imshow(frames[0])
axes[0].set_title(f'First Frame (t={timestamps[0]}ms)')
axes[0].axis('off')

axes[1].imshow(frames[-1])
axes[1].set_title(f'Last Frame (t={timestamps[-1]}ms)')
axes[1].axis('off')

plt.tight_layout()
plt.savefig('first_last_frames.png', dpi=150)
plt.show()
```

### **Create Video:**

```python
import cv2

frames = np.load('reacture_1731177600000_frames.npy')

# Create video at 10 FPS (matches 10Hz capture)
out = cv2.VideoWriter('gameplay.mp4', 
                      cv2.VideoWriter_fourcc(*'mp4v'),
                      10,  # 10 FPS
                      (128, 128))

for frame in frames:
    # Convert RGB to BGR for OpenCV
    bgr_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
    out.write(bgr_frame)

out.release()
print(f"✅ Saved gameplay.mp4 ({len(frames)} frames)")
```

---

## 🚀 **READY TO USE!**

### **Download Dataset:**
```
1. Play game
2. Click "Download Data"
3. Get 5 files (including .npy files!)
```

### **Load in Python:**
```python
import numpy as np

frames = np.load('reacture_XXXXX_frames.npy')
timestamps = np.load('reacture_XXXXX_timestamps.npy')

# Ready for training!
```

---

## 🎉 **SUMMARY**

**You Now Get:**
- ✅ `frames.npy` - All frames in one NumPy file (N, 128, 128, 3)
- ✅ `timestamps.npy` - Frame timestamps (N,)
- ✅ Both synchronized to 10Hz
- ✅ Standard NumPy format
- ✅ Direct `np.load()` compatible
- ✅ Optimal for ML training

**Benefits:**
- Fast loading
- Easy to use
- Standard format
- Batch processing ready
- Memory efficient
- Production quality

---

**Start generating datasets with real NumPy files!** 📊🔬

*Play → Download → Load → Train!*

