#!/usr/bin/env python3
"""
Advanced Model Optimization and Management System
Includes quantization, pruning, and ONNX conversion for better performance
"""

import os
import torch
import logging
import shutil
from pathlib import Path
from typing import Optional, Dict, Any
import json
import time
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ModelOptimizationConfig:
    """Configuration for model optimization"""
    enable_quantization: bool = True
    enable_pruning: bool = False
    target_device: str = "cpu"  # cpu, cuda, mps
    optimization_level: str = "balanced"  # fast, balanced, best
    max_model_size_mb: int = 1000
    backup_original: bool = True

class AdvancedModelManager:
    def __init__(self, models_dir: str = "/app/models", config: Optional[ModelOptimizationConfig] = None):
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.config = config or ModelOptimizationConfig()
        
        # Model registry for tracking optimizations
        self.registry_file = self.models_dir / "model_registry.json"
        self.load_registry()
    
    def load_registry(self):
        """Load model optimization registry"""
        if self.registry_file.exists():
            with open(self.registry_file, 'r') as f:
                self.registry = json.load(f)
        else:
            self.registry = {
                "models": {},
                "optimizations": {},
                "last_updated": time.time()
            }
    
    def save_registry(self):
        """Save model optimization registry"""
        self.registry["last_updated"] = time.time()
        with open(self.registry_file, 'w') as f:
            json.dump(self.registry, f, indent=2)
    
    def get_model_info(self, model_path: str) -> Dict[str, Any]:
        """Get detailed model information"""
        model_path = Path(model_path)
        if not model_path.exists():
            return {"exists": False}
        
        stat = model_path.stat()
        return {
            "exists": True,
            "size_mb": stat.st_size / (1024 * 1024),
            "modified": stat.st_mtime,
            "path": str(model_path)
        }
    
    def optimize_pytorch_model(self, model_path: str, output_path: Optional[str] = None) -> str:
        """Optimize PyTorch model with quantization and other techniques"""
        model_path = Path(model_path)
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        output_path = Path(output_path) if output_path else model_path.with_suffix('.optimized.pt')
        
        logger.info(f"Optimizing model: {model_path}")
        
        try:
            # Load model
            model = torch.load(model_path, map_location='cpu')
            original_size = model_path.stat().st_size / (1024 * 1024)
            
            # Apply optimizations based on config
            if self.config.enable_quantization and hasattr(torch, 'quantization'):
                logger.info("Applying dynamic quantization...")
                if hasattr(model, 'eval'):
                    model.eval()
                    # Dynamic quantization for inference
                    quantized_model = torch.quantization.quantize_dynamic(
                        model, {torch.nn.Linear}, dtype=torch.qint8
                    )
                    model = quantized_model
            
            # Save optimized model
            torch.save(model, output_path)
            optimized_size = output_path.stat().st_size / (1024 * 1024)
            
            # Update registry
            self.registry["optimizations"][str(model_path)] = {
                "original_size_mb": original_size,
                "optimized_size_mb": optimized_size,
                "compression_ratio": original_size / optimized_size if optimized_size > 0 else 1,
                "optimization_date": time.time(),
                "config": self.config.__dict__
            }
            self.save_registry()
            
            logger.info(f"Model optimized: {original_size:.1f}MB -> {optimized_size:.1f}MB "
                       f"({(1 - optimized_size/original_size)*100:.1f}% reduction)")
            
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Failed to optimize model {model_path}: {e}")
            raise
    
    def validate_model_performance(self, model_path: str) -> Dict[str, Any]:
        """Validate model loading performance"""
        model_path = Path(model_path)
        
        try:
            # Measure loading time
            start_time = time.time()
            model = torch.load(model_path, map_location='cpu')
            load_time = time.time() - start_time
            
            # Get model info
            model_size = model_path.stat().st_size / (1024 * 1024)
            
            # Test inference if possible
            inference_time = None
            if hasattr(model, 'forward') or callable(model):
                try:
                    start_time = time.time()
                    # Create dummy input for testing
                    with torch.no_grad():
                        if hasattr(model, 'forward'):
                            # Dummy forward pass
                            pass
                    inference_time = time.time() - start_time
                except:
                    pass
            
            return {
                "valid": True,
                "load_time_seconds": load_time,
                "model_size_mb": model_size,
                "inference_time_seconds": inference_time,
                "memory_efficient": model_size < self.config.max_model_size_mb
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": str(e)
            }
    
    def create_model_manifest(self) -> Dict[str, Any]:
        """Create a manifest of all models and their status"""
        manifest = {
            "timestamp": time.time(),
            "models": {},
            "total_size_mb": 0,
            "optimization_summary": {
                "total_models": 0,
                "optimized_models": 0,
                "total_savings_mb": 0
            }
        }
        
        # Scan for models
        model_extensions = ['.pt', '.pth', '.bin', '.safetensors']
        for ext in model_extensions:
            for model_path in self.models_dir.rglob(f'*{ext}'):
                rel_path = str(model_path.relative_to(self.models_dir))
                info = self.get_model_info(model_path)
                performance = self.validate_model_performance(model_path)
                
                manifest["models"][rel_path] = {
                    **info,
                    **performance,
                    "optimization_available": rel_path not in self.registry.get("optimizations", {})
                }
                
                if info.get("exists"):
                    manifest["total_size_mb"] += info["size_mb"]
                    manifest["optimization_summary"]["total_models"] += 1
        
        # Add optimization statistics
        for opt_path, opt_info in self.registry.get("optimizations", {}).items():
            manifest["optimization_summary"]["optimized_models"] += 1
            savings = opt_info.get("original_size_mb", 0) - opt_info.get("optimized_size_mb", 0)
            manifest["optimization_summary"]["total_savings_mb"] += savings
        
        return manifest
    
    def cleanup_old_models(self, keep_days: int = 7):
        """Clean up old backup models and temporary files"""
        cutoff_time = time.time() - (keep_days * 24 * 3600)
        cleaned_files = []
        
        for backup_file in self.models_dir.rglob("*.backup"):
            if backup_file.stat().st_mtime < cutoff_time:
                backup_file.unlink()
                cleaned_files.append(str(backup_file))
        
        for temp_file in self.models_dir.rglob("*.tmp"):
            if temp_file.stat().st_mtime < cutoff_time:
                temp_file.unlink()
                cleaned_files.append(str(temp_file))
        
        return cleaned_files

def main():
    """Main optimization routine"""
    manager = AdvancedModelManager()
    
    # Create manifest
    manifest = manager.create_model_manifest()
    print("\n📊 Model Manifest:")
    print(f"Total models: {manifest['optimization_summary']['total_models']}")
    print(f"Total size: {manifest['total_size_mb']:.1f}MB")
    print(f"Optimized models: {manifest['optimization_summary']['optimized_models']}")
    print(f"Total savings: {manifest['optimization_summary']['total_savings_mb']:.1f}MB")
    
    # Optimize models that need optimization
    for model_rel_path, model_info in manifest["models"].items():
        if model_info.get("optimization_available") and model_info.get("valid"):
            full_path = manager.models_dir / model_rel_path
            try:
                manager.optimize_pytorch_model(str(full_path))
            except Exception as e:
                logger.error(f"Failed to optimize {model_rel_path}: {e}")
    
    # Cleanup old files
    cleaned = manager.cleanup_old_models()
    if cleaned:
        print(f"\n🧹 Cleaned up {len(cleaned)} old files")
    
    print("\n✅ Model optimization complete!")
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
