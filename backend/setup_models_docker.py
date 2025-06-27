#!/usr/bin/env python3
"""
Model setup script for Docker containers
This script can download models at build time or runtime
"""

import os
import shutil
import logging
from pathlib import Path
from typing import Optional

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self, models_dir: str = "/app/models"):
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
    def check_model_exists(self, model_path: str) -> bool:
        """Check if a model file exists"""
        full_path = self.models_dir / model_path
        return full_path.exists() and full_path.stat().st_size > 0
    
    def list_available_models(self) -> dict:
        """List all available models in the models directory"""
        models = {}
        for model_type in ['embeddings', 'knowledge_base']:
            type_dir = self.models_dir / model_type
            if type_dir.exists():
                models[model_type] = list(type_dir.rglob('*'))
        return models
    
    def download_huggingface_model(self, model_name: str, target_dir: str):
        """Download a model from Hugging Face (if needed)"""
        try:
            from transformers import AutoModel, AutoTokenizer
            
            target_path = self.models_dir / target_dir
            target_path.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"Downloading {model_name} to {target_path}")
            
            # Download model and tokenizer
            model = AutoModel.from_pretrained(model_name)
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            
            # Save locally
            model.save_pretrained(target_path)
            tokenizer.save_pretrained(target_path)
            
            logger.info(f"Successfully downloaded {model_name}")
            
        except Exception as e:
            logger.error(f"Failed to download {model_name}: {e}")
            raise
    
    def copy_local_models(self, source_dir: str):
        """Copy models from a local directory"""
        source_path = Path(source_dir)
        if not source_path.exists():
            logger.warning(f"Source directory {source_dir} does not exist")
            return
            
        logger.info(f"Copying models from {source_dir} to {self.models_dir}")
        
        # Copy all files and directories
        for item in source_path.iterdir():
            if item.is_file():
                shutil.copy2(item, self.models_dir / item.name)
            elif item.is_dir():
                shutil.copytree(item, self.models_dir / item.name, dirs_exist_ok=True)
    
    def validate_models(self) -> bool:
        """Validate that required models are present"""
        required_models = [
            "knowledge_base/knowledge_base_with_embeddings.pt",
            "embeddings/sailor2-1b-vangvieng-finetuned"
        ]
        
        all_present = True
        for model in required_models:
            if not self.check_model_exists(model):
                logger.error(f"Required model missing: {model}")
                all_present = False
            else:
                logger.info(f"Model found: {model}")
        
        return all_present

def main():
    """Main function to setup models"""
    manager = ModelManager()
    
    # Check if models are already present
    if manager.validate_models():
        logger.info("All required models are present")
        return True
    
    # Try to download or setup models
    logger.info("Setting up models...")
    
    # Add your model setup logic here
    # For example:
    # manager.download_huggingface_model("your-model-name", "embeddings/your-model")
    
    # Validate again
    if manager.validate_models():
        logger.info("Model setup completed successfully")
        return True
    else:
        logger.error("Model setup failed")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
