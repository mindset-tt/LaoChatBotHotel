#!/usr/bin/env python3
"""
Model Setup Helper Script
Helps you organize and verify your model files for the Enhanced Hotel Management System
"""

import os
import shutil
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_model_directories():
    """Create the organized model directory structure"""
    directories = [
        "models",
        "models/checkpoints",
        "models/knowledge_base",
        "models/embeddings"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        logger.info(f"✓ Created directory: {directory}")

def find_existing_models():
    """Find existing model files in the current directory"""
    found_models = {}
    
    # Look for fine-tuned model directory
    finetuned_dirs = [
        "sailor2-1b-vangvieng-finetuned",
        "models/checkpoints/sailor2-1b-vangvieng-finetuned"
    ]
    
    for finetuned_dir in finetuned_dirs:
        if os.path.exists(finetuned_dir):
            found_models['finetuned'] = finetuned_dir
            break
    
    # Look for knowledge base file
    kb_files = [
        "knowledge_base_with_embeddings.pt",
        "models/knowledge_base/knowledge_base_with_embeddings.pt"
    ]
    
    for kb_file in kb_files:
        if os.path.exists(kb_file):
            found_models['knowledge_base'] = kb_file
            break
    
    return found_models

def organize_models():
    """Move models to the organized structure"""
    found_models = find_existing_models()
    
    if not found_models:
        logger.warning("No existing models found. Please place your models manually.")
        return False
    
    # Move fine-tuned model
    if 'finetuned' in found_models:
        source = found_models['finetuned']
        target = "models/checkpoints/sailor2-1b-vangvieng-finetuned"
        
        if source != target and not os.path.exists(target):
            logger.info(f"Moving fine-tuned model: {source} → {target}")
            shutil.move(source, target)
        else:
            logger.info(f"Fine-tuned model already in correct location: {target}")
    
    # Move knowledge base
    if 'knowledge_base' in found_models:
        source = found_models['knowledge_base']
        target = "models/knowledge_base/knowledge_base_with_embeddings.pt"
        
        if source != target and not os.path.exists(target):
            logger.info(f"Moving knowledge base: {source} → {target}")
            shutil.move(source, target)
        else:
            logger.info(f"Knowledge base already in correct location: {target}")
    
    return True

def verify_model_structure():
    """Verify that models are properly organized"""
    logger.info("Verifying model structure...")
    
    # Check fine-tuned model
    finetuned_path = "models/checkpoints/sailor2-1b-vangvieng-finetuned"
    if os.path.exists(finetuned_path):
        checkpoints = [d for d in os.listdir(finetuned_path) if d.startswith("checkpoint-")]
        if checkpoints:
            latest = sorted(checkpoints, key=lambda x: int(x.split('-')[-1]))[-1]
            logger.info(f"✓ Fine-tuned model found with latest checkpoint: {latest}")
        else:
            logger.warning(f"⚠ Fine-tuned model directory exists but no checkpoints found")
    else:
        logger.warning(f"⚠ Fine-tuned model not found at: {finetuned_path}")
    
    # Check knowledge base
    kb_path = "models/knowledge_base/knowledge_base_with_embeddings.pt"
    if os.path.exists(kb_path):
        size_mb = os.path.getsize(kb_path) / (1024 * 1024)
        logger.info(f"✓ Knowledge base found: {kb_path} ({size_mb:.1f} MB)")
    else:
        logger.warning(f"⚠ Knowledge base not found at: {kb_path}")
    
    # Check legacy locations
    logger.info("Checking legacy locations...")
    legacy_finetuned = "sailor2-1b-vangvieng-finetuned"
    legacy_kb = "knowledge_base_with_embeddings.pt"
    
    if os.path.exists(legacy_finetuned):
        logger.info(f"📁 Legacy fine-tuned model found: {legacy_finetuned}")
    
    if os.path.exists(legacy_kb):
        logger.info(f"📄 Legacy knowledge base found: {legacy_kb}")

def show_model_locations():
    """Show where models should be placed"""
    print("\n" + "="*60)
    print("📁 MODEL PLACEMENT GUIDE")
    print("="*60)
    
    print("\n🎯 PLACE YOUR MODELS HERE:")
    
    print("\n1. Fine-tuned LLM Model:")
    print("   📍 Primary: ./models/checkpoints/sailor2-1b-vangvieng-finetuned/")
    print("   📍 Legacy:  ./sailor2-1b-vangvieng-finetuned/")
    print("   📋 Contains: checkpoint-XXX/ folders with adapter files")
    
    print("\n2. Knowledge Base (RAG):")
    print("   📍 Primary: ./models/knowledge_base/knowledge_base_with_embeddings.pt")
    print("   📍 Legacy:  ./knowledge_base_with_embeddings.pt")
    print("   📋 Contains: PyTorch tensor file with chunks and embeddings")
    
    print("\n3. Base Models (Auto-downloaded):")
    print("   📍 sail/Sailor2-L-1B-Chat → ~/.cache/huggingface/")
    print("   📍 sentence-transformers/LaBSE → ~/.cache/sentence_transformers/")
    
    print("\n" + "="*60)

def find_models_in_system():
    """Find model files anywhere in the system (helpful guidance)"""
    print("\n🔍 SEARCHING FOR YOUR MODELS...")
    print("="*50)
    
    # Check common locations where models might be
    search_paths = [
        ".",  # Current directory
        "..",  # Parent directory
        "../../",  # Grandparent directory
        os.path.expanduser("~"),  # Home directory
        os.path.expanduser("~/Documents"),  # Documents
        os.path.expanduser("~/Desktop"),  # Desktop
    ]
    
    found_locations = []
    
    for search_path in search_paths:
        try:
            if os.path.exists(search_path):
                for item in os.listdir(search_path):
                    full_path = os.path.join(search_path, item)
                    if os.path.isdir(full_path):
                        # Check for fine-tuned model
                        if "sailor2" in item.lower() and "finetuned" in item.lower():
                            found_locations.append(("Fine-tuned Model", full_path))
                        # Check for knowledge base file
                        elif item == "knowledge_base_with_embeddings.pt":
                            found_locations.append(("Knowledge Base", full_path))
                    elif item == "knowledge_base_with_embeddings.pt":
                        found_locations.append(("Knowledge Base", os.path.join(search_path, item)))
        except (PermissionError, FileNotFoundError):
            continue
    
    if found_locations:
        print("📍 FOUND THESE MODELS:")
        for model_type, location in found_locations:
            print(f"   {model_type}: {os.path.abspath(location)}")
        
        print("\n💡 TO USE THESE MODELS:")
        print("   1. Copy/Move them to this directory:")
        print(f"      {os.path.abspath('.')}")
        print("   2. Or update the paths in config/settings.py")
    else:
        print("❌ No models found in common locations.")
        print("\n📝 PLEASE PROVIDE:")
        print("   1. Full path to your sailor2-1b-vangvieng-finetuned directory")
        print("   2. Full path to your knowledge_base_with_embeddings.pt file")
    
    print("="*50)

def main():
    """Main function"""
    print("🏨 Enhanced Hotel Management System - Model Setup Helper")
    print("="*60)
    
    logger.info("Starting model setup...")
    
    # Create directories
    create_model_directories()
    
    # Show where to place models
    show_model_locations()
    
    # Find existing models
    found_models = find_existing_models()
    if found_models:
        logger.info(f"Found existing models: {list(found_models.keys())}")
        
        # Ask user if they want to organize
        response = input("\n🔄 Would you like to organize models into the new structure? (y/n): ")
        if response.lower() in ['y', 'yes']:
            organize_models()
    
    # Verify structure
    verify_model_structure()
    
    # Find models in system
    find_models_in_system()
    
    print("\n✅ Model setup helper completed!")
    print("📖 For detailed instructions, see: MODEL_SETUP.md")
    print("🚀 To start the application: python main.py")

if __name__ == "__main__":
    main()
