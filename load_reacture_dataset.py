#!/usr/bin/env python3
"""
ReActure Dataset Loader
========================

Load and stream ReActure simulation data for ML training.

Usage:
    from load_reacture_dataset import ReActureDataset
    
    dataset = ReActureDataset('reacture_1731177600000_metadata.json')
    
    # Iterate through samples
    for sample in dataset:
        print(sample['timestamp'], sample['battery'], sample['damage'])
        frame = sample['frame']  # NumPy array (128, 128, 3)
        
    # Or use with PyTorch/TensorFlow
    dataloader = dataset.to_pytorch_dataloader(batch_size=32)
"""

import json
import base64
import numpy as np
from pathlib import Path
from typing import Dict, List, Iterator, Optional, Tuple
import warnings


class ReActureDataset:
    """
    Loads and provides access to ReActure simulation datasets.
    
    Attributes:
        metadata: Session metadata dictionary
        samples: List of all data samples (10Hz)
        frames: Dictionary mapping frame paths to NumPy arrays
    """
    
    def __init__(self, metadata_path: str):
        """
        Load a ReActure dataset from metadata file.
        
        Args:
            metadata_path: Path to session_metadata.json file
        """
        self.base_path = Path(metadata_path).parent
        self.session_id = Path(metadata_path).stem.replace('_metadata', '')
        
        # Load metadata
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
        
        print(f"📁 Loading dataset: {self.metadata['session_id']}")
        print(f"⏱️  Duration: {self.metadata['duration_s']:.1f}s")
        print(f"📊 Sampling rate: {self.metadata['sampling_rate_hz']} Hz")
        
        # Load JSONL data
        self.samples = self._load_jsonl()
        
        # Load frames (NumPy array)
        self.frames_array = self._load_frames()
        self.frame_timestamps = getattr(self, 'frame_timestamps', None)
        
        print(f"✅ Loaded {len(self.samples)} samples")
        if self.frames_array is not None:
            print(f"✅ Loaded frames array with shape: {self.frames_array.shape}")
    
    def _load_jsonl(self) -> List[Dict]:
        """Load JSONL data file."""
        jsonl_path = self.base_path / f"{self.session_id}_data.jsonl"
        
        if not jsonl_path.exists():
            raise FileNotFoundError(f"JSONL file not found: {jsonl_path}")
        
        samples = []
        with open(jsonl_path, 'r') as f:
            for line in f:
                if line.strip():
                    samples.append(json.loads(line))
        
        return samples
    
    def _load_frames(self) -> np.ndarray:
        """Load visual frames from PNG files."""
        try:
            from PIL import Image
        except ImportError:
            print("⚠️  PIL/Pillow not installed. Install with: pip install Pillow")
            print("   Frames will not be loaded.")
            return None
        
        # Find all PNG frame files
        frame_pattern = f"{self.session_id}_frame_*.png"
        frame_files = sorted(list(self.base_path.glob(frame_pattern)))
        
        if not frame_files:
            warnings.warn(f"No PNG frames found matching pattern: {frame_pattern}")
            return None
        
        print(f"📷 Loading {len(frame_files)} PNG frames...")
        
        frames_list = []
        for i, frame_path in enumerate(frame_files):
            img = Image.open(frame_path)
            frame = np.array(img)
            
            # Ensure RGB format (remove alpha if present)
            if frame.shape[-1] == 4:
                frame = frame[:, :, :3]
            
            frames_list.append(frame)
            
            # Progress indicator
            if (i + 1) % 100 == 0 or i == len(frame_files) - 1:
                print(f"   Loaded {i + 1}/{len(frame_files)} frames...")
        
        # Stack into single array
        frames_array = np.stack(frames_list, axis=0)
        
        # Generate timestamps (10 Hz = 100ms intervals)
        self.frame_timestamps = np.arange(len(frames_array)) * 100.0
        
        print(f"✅ Loaded frames with shape: {frames_array.shape}")
        return frames_array
    
    def __len__(self) -> int:
        """Number of samples in dataset."""
        return len(self.samples)
    
    def __getitem__(self, idx: int) -> Dict:
        """
        Get a single sample with its associated frame.
        
        Returns:
            Dictionary with all sample data plus 'frame' as NumPy array
        """
        sample = self.samples[idx].copy()
        
        # Add frame from frames array if available
        if self.frames_array is not None and idx < len(self.frames_array):
            sample['frame'] = self.frames_array[idx]
            if self.frame_timestamps is not None and idx < len(self.frame_timestamps):
                sample['frame_timestamp_ms'] = self.frame_timestamps[idx]
        else:
            sample['frame'] = None
        
        return sample
    
    def __iter__(self) -> Iterator[Dict]:
        """Iterate through all samples."""
        for i in range(len(self)):
            yield self[i]
    
    def get_sample_at_time(self, time_s: float) -> Optional[Dict]:
        """Get sample closest to specified time."""
        if not self.samples:
            return None
        
        # Find closest sample
        closest_idx = min(range(len(self.samples)), 
                         key=lambda i: abs(self.samples[i]['time_elapsed_s'] - time_s))
        
        return self[closest_idx]
    
    def get_time_range(self, start_s: float, end_s: float) -> List[Dict]:
        """Get all samples within time range."""
        return [
            self[i] for i in range(len(self))
            if start_s <= self.samples[i]['time_elapsed_s'] <= end_s
        ]
    
    def extract_trajectory(self) -> np.ndarray:
        """
        Extract robot position trajectory.
        
        Returns:
            NumPy array of shape (N, 3) with x, y, z positions
        """
        positions = []
        for sample in self.samples:
            if sample['type'] == 'robot_state':
                pos = sample['robot']['position']
                positions.append([pos['x'], pos['y'], pos['z']])
        
        return np.array(positions)
    
    def extract_key_presses(self) -> np.ndarray:
        """
        Extract key press data as binary matrix.
        
        Returns:
            NumPy array of shape (N, 6) for [W, A, S, D, inspect, destroy]
        """
        keys = []
        for sample in self.samples:
            if sample['type'] == 'robot_state':
                kp = sample['key_presses']
                keys.append([
                    int(kp['W']),
                    int(kp['A']),
                    int(kp['S']),
                    int(kp['D']),
                    int(kp['inspect']),
                    int(kp['destroy'])
                ])
        
        return np.array(keys)
    
    def extract_accelerometer(self) -> np.ndarray:
        """
        Extract accelerometer readings.
        
        Returns:
            NumPy array of shape (N, 3) with x, y, z acceleration
        """
        accel = []
        for sample in self.samples:
            if sample['type'] == 'robot_state':
                acc = sample['accelerometer']
                accel.append([acc['x'], acc['y'], acc['z']])
        
        return np.array(accel)
    
    def extract_battery_damage(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Extract battery and damage levels.
        
        Returns:
            Tuple of (battery_array, damage_array)
        """
        battery = []
        damage = []
        
        for sample in self.samples:
            if sample['type'] == 'robot_state':
                battery.append(sample['battery'])
                damage.append(sample['damage'])
        
        return np.array(battery), np.array(damage)
    
    def get_frames_as_array(self) -> Optional[np.ndarray]:
        """
        Get all frames as a single NumPy array.
        
        Returns:
            NumPy array of shape (N, H, W, 3) or None
        """
        return self.frames_array
    
    def to_pytorch_dataloader(self, batch_size: int = 32, shuffle: bool = True):
        """
        Create PyTorch DataLoader from dataset.
        
        Args:
            batch_size: Batch size
            shuffle: Whether to shuffle data
            
        Returns:
            PyTorch DataLoader
        """
        try:
            import torch
            from torch.utils.data import Dataset, DataLoader
            
            class ReActurePyTorchDataset(Dataset):
                def __init__(self, reacture_dataset):
                    self.dataset = reacture_dataset
                
                def __len__(self):
                    return len(self.dataset)
                
                def __getitem__(self, idx):
                    sample = self.dataset[idx]
                    
                    # Convert to tensors
                    frame = sample['frame']
                    if frame is not None:
                        frame = torch.from_numpy(frame).float() / 255.0
                        frame = frame.permute(2, 0, 1)  # HWC to CHW
                    else:
                        frame = torch.zeros(3, 128, 128)
                    
                    # Key presses
                    kp = sample['key_presses']
                    keys = torch.tensor([
                        float(kp['W']),
                        float(kp['A']),
                        float(kp['S']),
                        float(kp['D']),
                        float(kp['inspect']),
                        float(kp['destroy'])
                    ])
                    
                    # Robot state
                    pos = sample['robot']['position']
                    position = torch.tensor([pos['x'], pos['y'], pos['z']])
                    
                    vel = sample['robot']['velocity']
                    velocity = torch.tensor([vel['x'], vel['y'], vel['z']])
                    
                    # Accelerometer
                    acc = sample['accelerometer']
                    accelerometer = torch.tensor([acc['x'], acc['y'], acc['z']])
                    
                    # Scalars
                    battery = torch.tensor([sample['battery']])
                    damage = torch.tensor([sample['damage']])
                    
                    return {
                        'frame': frame,
                        'keys': keys,
                        'position': position,
                        'velocity': velocity,
                        'accelerometer': accelerometer,
                        'battery': battery,
                        'damage': damage,
                        'timestamp': sample['timestamp_ms']
                    }
            
            torch_dataset = ReActurePyTorchDataset(self)
            return DataLoader(torch_dataset, batch_size=batch_size, shuffle=shuffle)
        
        except ImportError:
            raise ImportError("PyTorch not installed. Install with: pip install torch")
    
    def to_tensorflow_dataset(self, batch_size: int = 32, shuffle: bool = True):
        """
        Create TensorFlow Dataset.
        
        Args:
            batch_size: Batch size
            shuffle: Whether to shuffle
            
        Returns:
            TensorFlow Dataset
        """
        try:
            import tensorflow as tf
            
            def generator():
                for sample in self:
                    frame = sample['frame']
                    if frame is None:
                        frame = np.zeros((128, 128, 3), dtype=np.uint8)
                    
                    frame = frame.astype(np.float32) / 255.0
                    
                    kp = sample['key_presses']
                    keys = np.array([
                        float(kp['W']),
                        float(kp['A']),
                        float(kp['S']),
                        float(kp['D']),
                        float(kp['inspect']),
                        float(kp['destroy'])
                    ], dtype=np.float32)
                    
                    pos = sample['robot']['position']
                    position = np.array([pos['x'], pos['y'], pos['z']], dtype=np.float32)
                    
                    vel = sample['robot']['velocity']
                    velocity = np.array([vel['x'], vel['y'], vel['z']], dtype=np.float32)
                    
                    acc = sample['accelerometer']
                    accelerometer = np.array([acc['x'], acc['y'], acc['z']], dtype=np.float32)
                    
                    battery = np.array([sample['battery']], dtype=np.float32)
                    damage = np.array([sample['damage']], dtype=np.float32)
                    
                    yield {
                        'frame': frame,
                        'keys': keys,
                        'position': position,
                        'velocity': velocity,
                        'accelerometer': accelerometer,
                        'battery': battery,
                        'damage': damage
                    }
            
            output_signature = {
                'frame': tf.TensorSpec(shape=(128, 128, 3), dtype=tf.float32),
                'keys': tf.TensorSpec(shape=(6,), dtype=tf.float32),
                'position': tf.TensorSpec(shape=(3,), dtype=tf.float32),
                'velocity': tf.TensorSpec(shape=(3,), dtype=tf.float32),
                'accelerometer': tf.TensorSpec(shape=(3,), dtype=tf.float32),
                'battery': tf.TensorSpec(shape=(1,), dtype=tf.float32),
                'damage': tf.TensorSpec(shape=(1,), dtype=tf.float32)
            }
            
            dataset = tf.data.Dataset.from_generator(generator, output_signature=output_signature)
            
            if shuffle:
                dataset = dataset.shuffle(buffer_size=1000)
            
            dataset = dataset.batch(batch_size)
            dataset = dataset.prefetch(tf.data.AUTOTUNE)
            
            return dataset
        
        except ImportError:
            raise ImportError("TensorFlow not installed. Install with: pip install tensorflow")
    
    def get_statistics(self) -> Dict:
        """Get dataset statistics."""
        trajectory = self.extract_trajectory()
        keys = self.extract_key_presses()
        battery, damage = self.extract_battery_damage()
        
        return {
            'num_samples': len(self.samples),
            'num_frames': len(self.frames),
            'duration_s': self.metadata['duration_s'],
            'sampling_rate': self.metadata['sampling_rate_hz'],
            'trajectory_stats': {
                'mean_position': trajectory.mean(axis=0).tolist(),
                'std_position': trajectory.std(axis=0).tolist(),
                'min_position': trajectory.min(axis=0).tolist(),
                'max_position': trajectory.max(axis=0).tolist()
            },
            'key_press_frequency': {
                'W': keys[:, 0].mean(),
                'A': keys[:, 1].mean(),
                'S': keys[:, 2].mean(),
                'D': keys[:, 3].mean(),
                'inspect': keys[:, 4].mean(),
                'destroy': keys[:, 5].mean()
            },
            'battery_stats': {
                'mean': battery.mean(),
                'std': battery.std(),
                'min': battery.min(),
                'max': battery.max()
            },
            'damage_stats': {
                'mean': damage.mean(),
                'std': damage.std(),
                'min': damage.min(),
                'max': damage.max()
            }
        }
    
    def save_frames_as_individual_npy(self, output_dir: str = 'frames'):
        """
        Save frames as individual .npy files (one per frame).
        
        Args:
            output_dir: Directory to save frames
        """
        if self.frames_array is None:
            print("⚠️  No frames to save")
            return
        
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        for i, frame in enumerate(self.frames_array):
            filename = f"frame_{str(i).zfill(6)}.npy"
            output_file = output_path / filename
            np.save(output_file, frame)
            
            if i % 100 == 0:
                print(f"💾 Saved {i+1}/{len(self.frames_array)} frames...")
        
        print(f"✅ Saved {len(self.frames_array)} frames to {output_dir}/")
    
    def visualize_trajectory(self, save_path: Optional[str] = None):
        """
        Visualize robot trajectory in 3D.
        
        Args:
            save_path: Optional path to save figure
        """
        try:
            import matplotlib.pyplot as plt
            from mpl_toolkits.mplot3d import Axes3D
            
            trajectory = self.extract_trajectory()
            
            fig = plt.figure(figsize=(12, 8))
            ax = fig.add_subplot(111, projection='3d')
            
            ax.plot(trajectory[:, 0], trajectory[:, 2], trajectory[:, 1], 
                   'b-', linewidth=2, alpha=0.7)
            ax.scatter(trajectory[0, 0], trajectory[0, 2], trajectory[0, 1],
                      c='green', s=100, marker='o', label='Start')
            ax.scatter(trajectory[-1, 0], trajectory[-1, 2], trajectory[-1, 1],
                      c='red', s=100, marker='x', label='End')
            
            ax.set_xlabel('X Position (m)')
            ax.set_ylabel('Z Position (m)')
            ax.set_zlabel('Y Position (m)')
            ax.set_title(f'Robot Trajectory - {self.metadata["environment_name"]}')
            ax.legend()
            ax.grid(True, alpha=0.3)
            
            if save_path:
                plt.savefig(save_path, dpi=150, bbox_inches='tight')
                print(f"💾 Saved trajectory plot to {save_path}")
            else:
                plt.show()
        
        except ImportError:
            print("Matplotlib not installed. Install with: pip install matplotlib")


def load_multiple_sessions(metadata_paths: List[str]) -> List[ReActureDataset]:
    """
    Load multiple dataset sessions.
    
    Args:
        metadata_paths: List of paths to metadata files
        
    Returns:
        List of ReActureDataset objects
    """
    datasets = []
    for path in metadata_paths:
        try:
            dataset = ReActureDataset(path)
            datasets.append(dataset)
        except Exception as e:
            print(f"⚠️  Failed to load {path}: {e}")
    
    return datasets


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python load_reacture_dataset.py <metadata_file.json>")
        print("\nExample:")
        print("  python load_reacture_dataset.py reacture_1731177600000_metadata.json")
        sys.exit(1)
    
    metadata_file = sys.argv[1]
    
    print("="*70)
    print("ReActure Dataset Loader")
    print("="*70)
    
    # Load dataset
    dataset = ReActureDataset(metadata_file)
    
    print("\n" + "="*70)
    print("Dataset Statistics")
    print("="*70)
    
    stats = dataset.get_statistics()
    print(json.dumps(stats, indent=2))
    
    print("\n" + "="*70)
    print("Sample Data (first 3 entries)")
    print("="*70)
    
    for i, sample in enumerate(dataset):
        if i >= 3:
            break
        
        print(f"\nSample {i}:")
        print(f"  Time: {sample['time_elapsed_s']:.3f}s")
        print(f"  Position: ({sample['robot']['position']['x']:.2f}, "
              f"{sample['robot']['position']['y']:.2f}, "
              f"{sample['robot']['position']['z']:.2f})")
        print(f"  Battery: {sample['battery']:.1f}%")
        print(f"  Damage: {sample['damage']:.3f}")
        print(f"  Keys: W={sample['key_presses']['W']}, "
              f"A={sample['key_presses']['A']}, "
              f"S={sample['key_presses']['S']}, "
              f"D={sample['key_presses']['D']}")
        if sample['frame'] is not None:
            print(f"  Frame shape: {sample['frame'].shape}")
    
    print("\n" + "="*70)
    print("PyTorch Example")
    print("="*70)
    
    try:
        dataloader = dataset.to_pytorch_dataloader(batch_size=16, shuffle=True)
        print(f"✅ Created PyTorch DataLoader")
        print(f"   Batches: {len(dataloader)}")
        
        # Get first batch
        batch = next(iter(dataloader))
        print(f"\n  First batch:")
        print(f"    Frames: {batch['frame'].shape}")
        print(f"    Keys: {batch['keys'].shape}")
        print(f"    Position: {batch['position'].shape}")
        print(f"    Battery: {batch['battery'].shape}")
        
    except ImportError:
        print("⚠️  PyTorch not installed (optional)")
    
    print("\n" + "="*70)
    print("Visualization")
    print("="*70)
    
    try:
        print("Generating trajectory plot...")
        dataset.visualize_trajectory(save_path='trajectory_plot.png')
    except ImportError:
        print("⚠️  Matplotlib not installed (optional)")
    
    print("\n" + "="*70)
    print("Export Frames as .npy")
    print("="*70)
    
    if dataset.frames:
        save_option = input("Save frames as individual .npy files? (y/n): ")
        if save_option.lower() == 'y':
            dataset.save_frames_as_npy('frames_npy')
    
    print("\n✅ Dataset loading complete!")
    print("="*70)

