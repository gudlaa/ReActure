#!/usr/bin/env python3
"""
ReActure Dataset - Training Example
====================================

Simple example showing how to train a policy network on ReActure data.

Usage:
    python example_training.py <metadata_file.json>
"""

import sys
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from load_reacture_dataset import ReActureDataset


class RobotPolicy(nn.Module):
    """Simple policy network for behavior cloning."""
    
    def __init__(self):
        super().__init__()
        
        # Vision encoder (CNN)
        self.vision = nn.Sequential(
            nn.Conv2d(3, 16, 5, stride=2, padding=2),  # 128 -> 64
            nn.ReLU(),
            nn.Conv2d(16, 32, 5, stride=2, padding=2),  # 64 -> 32
            nn.ReLU(),
            nn.Conv2d(32, 64, 5, stride=2, padding=2),  # 32 -> 16
            nn.ReLU(),
            nn.Flatten()
        )
        
        # State encoder
        self.state_encoder = nn.Sequential(
            nn.Linear(9, 64),  # battery, damage, position (3), velocity (2), accel (2)
            nn.ReLU()
        )
        
        # Action decoder
        self.action_head = nn.Sequential(
            nn.Linear(64 * 16 * 16 + 64, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 6),  # W, A, S, D, inspect, destroy
            nn.Sigmoid()
        )
    
    def forward(self, frame, battery, damage, position, velocity, accelerometer):
        # Encode vision
        vis_features = self.vision(frame)
        
        # Encode state
        state = torch.cat([
            battery,
            damage,
            position,
            velocity[:, :2],  # x, z velocity
            accelerometer[:, :2]  # x, z acceleration
        ], dim=1)
        state_features = self.state_encoder(state)
        
        # Combine and predict
        combined = torch.cat([vis_features, state_features], dim=1)
        return self.action_head(combined)


def train_model(dataset_path: str, epochs: int = 10, batch_size: int = 32):
    """Train policy network on dataset."""
    
    print("="*70)
    print("ReActure Policy Training")
    print("="*70)
    
    # Load dataset
    print("\n📁 Loading dataset...")
    dataset = ReActureDataset(dataset_path)
    
    # Create dataloader
    print("📦 Creating dataloader...")
    dataloader = dataset.to_pytorch_dataloader(batch_size=batch_size, shuffle=True)
    
    # Create model
    print("🤖 Creating model...")
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = RobotPolicy().to(device)
    
    num_params = sum(p.numel() for p in model.parameters())
    print(f"   Parameters: {num_params:,}")
    print(f"   Device: {device}")
    
    # Training setup
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.BCELoss()
    
    # Training loop
    print(f"\n🏃 Training for {epochs} epochs...")
    print("-"*70)
    
    losses = []
    
    for epoch in range(epochs):
        model.train()
        epoch_loss = 0
        num_batches = 0
        
        for batch in dataloader:
            # Move to device
            frames = batch['frame'].to(device)
            battery = batch['battery'].to(device)
            damage = batch['damage'].to(device)
            position = batch['position'].to(device)
            velocity = batch['velocity'].to(device)
            accelerometer = batch['accelerometer'].to(device)
            target_actions = batch['keys'].to(device)
            
            # Forward pass
            predicted_actions = model(frames, battery, damage, position, velocity, accelerometer)
            
            # Compute loss
            loss = criterion(predicted_actions, target_actions)
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            num_batches += 1
        
        avg_loss = epoch_loss / num_batches
        losses.append(avg_loss)
        
        print(f"Epoch {epoch+1:2d}/{epochs}: Loss = {avg_loss:.4f}")
    
    print("-"*70)
    print("✅ Training complete!\n")
    
    # Save model
    model_path = 'reacture_policy_model.pth'
    torch.save({
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'training_losses': losses,
        'dataset_metadata': dataset.metadata
    }, model_path)
    
    print(f"💾 Model saved to {model_path}")
    
    # Test on sample
    print("\n🧪 Testing on sample...")
    model.eval()
    
    with torch.no_grad():
        sample = dataset[len(dataset) // 2]  # Middle sample
        
        frame = torch.from_numpy(sample['frame']).float() / 255.0
        frame = frame.permute(2, 0, 1).unsqueeze(0).to(device)
        
        battery = torch.tensor([[sample['battery']]]).to(device)
        damage = torch.tensor([[sample['damage']]]).to(device)
        
        pos = sample['robot']['position']
        position = torch.tensor([[pos['x'], pos['y'], pos['z']]]).to(device)
        
        vel = sample['robot']['velocity']
        velocity = torch.tensor([[vel['x'], vel['y'], vel['z']]]).to(device)
        
        acc = sample['accelerometer']
        accelerometer = torch.tensor([[acc['x'], acc['y'], acc['z']]]).to(device)
        
        # Predict
        predicted = model(frame, battery, damage, position, velocity, accelerometer)
        pred_actions = (predicted.cpu().numpy()[0] > 0.5).astype(int)
        
        # Actual
        actual_keys = sample['key_presses']
        actual_actions = [
            int(actual_keys['W']),
            int(actual_keys['A']),
            int(actual_keys['S']),
            int(actual_keys['D']),
            int(actual_keys['inspect']),
            int(actual_keys['destroy'])
        ]
        
        # Display
        key_names = ['W', 'A', 'S', 'D', 'Inspect', 'Destroy']
        
        print(f"\n{'Key':<10} {'Predicted':<12} {'Actual':<10} {'Match'}")
        print("-"*45)
        for name, pred, actual in zip(key_names, pred_actions, actual_actions):
            match = "✅" if pred == actual else "❌"
            print(f"{name:<10} {pred:<12} {actual:<10} {match}")
    
    print("\n" + "="*70)
    print("🎉 Example complete!")
    print("="*70)
    
    return model, losses


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python example_training.py <metadata_file.json>")
        print("\nExample:")
        print("  python example_training.py reacture_1731177600000_metadata.json")
        sys.exit(1)
    
    metadata_file = sys.argv[1]
    
    try:
        model, losses = train_model(metadata_file, epochs=5, batch_size=32)
        
        # Plot losses
        try:
            import matplotlib.pyplot as plt
            
            plt.figure(figsize=(10, 6))
            plt.plot(losses, 'b-o', linewidth=2, markersize=8)
            plt.xlabel('Epoch', fontsize=12)
            plt.ylabel('Loss', fontsize=12)
            plt.title('Training Loss - ReActure Policy Network', fontsize=14)
            plt.grid(True, alpha=0.3)
            plt.savefig('training_loss.png', dpi=150, bbox_inches='tight')
            print("\n💾 Saved training plot to training_loss.png")
            
        except ImportError:
            print("\n⚠️  Matplotlib not installed - skipping plot")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

