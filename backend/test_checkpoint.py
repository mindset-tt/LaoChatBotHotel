#!/usr/bin/env python3
"""
Test checkpoint selection logic
"""

import os

def test_get_best_checkpoint(base_dir, prefer_best=True):
    """Test version of get_best_checkpoint without PyTorch dependencies"""
    if not os.path.isdir(base_dir): 
        return None
    
    # Check if we should prefer best-checkpoint
    if prefer_best:
        # First priority: look for best-checkpoint directory
        best_checkpoint_path = os.path.join(base_dir, "best-checkpoint")
        if os.path.isdir(best_checkpoint_path):
            print(f"🏆 Using best checkpoint: {best_checkpoint_path}")
            return best_checkpoint_path
    
    # Second priority: use latest numbered checkpoint
    checkpoints = [d for d in os.listdir(base_dir) if d.startswith("checkpoint-")]
    if checkpoints:
        latest = sorted(checkpoints, key=lambda x: int(x.split('-')[-1]))[-1]
        latest_path = os.path.join(base_dir, latest)
        print(f"📈 Using latest checkpoint: {latest_path}")
        return latest_path
    
    # Fallback: try best-checkpoint even if preference is disabled
    if not prefer_best:
        best_checkpoint_path = os.path.join(base_dir, "best-checkpoint")
        if os.path.isdir(best_checkpoint_path):
            print(f"🏆 Fallback to best checkpoint: {best_checkpoint_path}")
            return best_checkpoint_path
    
    return None

if __name__ == "__main__":
    model_dir = "./models/checkpoints/sailor2-1b-vangvieng-finetuned"
    
    print("🧪 Testing checkpoint selection logic:")
    print(f"📁 Model directory: {model_dir}")
    print(f"📋 Available checkpoints: {os.listdir(model_dir) if os.path.exists(model_dir) else 'Directory not found'}")
    
    print("\n🏆 With PREFER_BEST_CHECKPOINT=True:")
    selected = test_get_best_checkpoint(model_dir, prefer_best=True)
    print(f"   Selected: {selected}")
    
    print("\n📈 With PREFER_BEST_CHECKPOINT=False:")
    selected = test_get_best_checkpoint(model_dir, prefer_best=False)
    print(f"   Selected: {selected}")
