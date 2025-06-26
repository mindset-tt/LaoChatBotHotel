# Model Setup Guide

This guide explains where to place your models for the Enhanced Hotel Management System.

## 📁 Model Directory Structure

Your models should be organized in the following structure:

```
📦 models/
├── 📁 checkpoints/                    # Fine-tuned model checkpoints
│   └── 📁 sailor2-1b-vangvieng-finetuned/
│       ├── 📁 checkpoint-100/
│       ├── 📁 checkpoint-200/
│       └── 📁 checkpoint-XXX/         # Latest checkpoint (highest number)
├── 📁 knowledge_base/                 # RAG knowledge base
│   └── 📄 knowledge_base_with_embeddings.pt
└── 📁 embeddings/                     # Additional embeddings (optional)
```

## 🎯 **Where to Place Your Models**

### 1. **Fine-tuned LLM Model** (Your trained Sailor2 model)

**Primary Location:** `./models/checkpoints/sailor2-1b-vangvieng-finetuned/`
**Legacy Location:** `./sailor2-1b-vangvieng-finetuned/` (backward compatibility)

**Structure:**
```
models/checkpoints/sailor2-1b-vangvieng-finetuned/
├── checkpoint-100/
│   ├── adapter_config.json
│   ├── adapter_model.safetensors
│   ├── optimizer.pt
│   ├── rng_state.pth
│   ├── scheduler.pt
│   └── trainer_state.json
├── checkpoint-200/
│   └── (same files)
└── checkpoint-XXX/  ← Latest checkpoint (system auto-detects highest number)
```

### 2. **Knowledge Base** (RAG embeddings)

**Primary Location:** `./models/knowledge_base/knowledge_base_with_embeddings.pt`
**Legacy Location:** `./knowledge_base_with_embeddings.pt` (backward compatibility)

**File Format:** PyTorch tensor file containing:
```python
{
    'chunks': List[str],           # Text chunks for RAG
    'embeddings': torch.Tensor     # Corresponding embeddings
}
```

### 3. **Base Models** (Auto-downloaded)

These are automatically downloaded by Hugging Face:
- **LLM Base:** `sail/Sailor2-L-1B-Chat` → `~/.cache/huggingface/transformers/`
- **Embeddings:** `sentence-transformers/LaBSE` → `~/.cache/sentence_transformers/`

## 🚀 **Quick Setup Commands**

### Option 1: Move existing models to new structure
```bash
# Create directories
mkdir -p models/checkpoints models/knowledge_base models/embeddings

# Move your fine-tuned model
mv sailor2-1b-vangvieng-finetuned models/checkpoints/

# Move your knowledge base
mv knowledge_base_with_embeddings.pt models/knowledge_base/
```

### Option 2: Keep existing structure (legacy support)
```bash
# The system will automatically find models in the old locations:
# - ./sailor2-1b-vangvieng-finetuned/
# - ./knowledge_base_with_embeddings.pt
```

## 🔍 **Model Detection Logic**

The system searches for models in this order:

1. **Fine-tuned Model:**
   - First: `./models/checkpoints/sailor2-1b-vangvieng-finetuned/`
   - Fallback: `./sailor2-1b-vangvieng-finetuned/`

2. **Knowledge Base:**
   - First: `./models/knowledge_base/knowledge_base_with_embeddings.pt`
   - Fallback: `./knowledge_base_with_embeddings.pt`

## 📝 **Configuration**

Current model paths are configured in `config/settings.py`:

```python
# New organized structure
KNOWLEDGE_BASE_PATH = './models/knowledge_base/knowledge_base_with_embeddings.pt'
FINETUNED_OUTPUT_DIR = "./models/checkpoints/sailor2-1b-vangvieng-finetuned"

# Legacy paths (for backward compatibility)
LEGACY_KNOWLEDGE_BASE_PATH = 'knowledge_base_with_embeddings.pt'
LEGACY_FINETUNED_OUTPUT_DIR = "sailor2-1b-vangvieng-finetuned"
```

## ⚠️ **Important Notes**

### Checkpoint Detection
- The system automatically finds the **latest checkpoint** (highest number)
- Example: If you have `checkpoint-100`, `checkpoint-150`, `checkpoint-200`, it will use `checkpoint-200`

### File Permissions
- Ensure the application has read access to model files
- On Windows: Check file properties → Security
- On Linux/Mac: Use `chmod 644` for files, `chmod 755` for directories

### Memory Management
- Models are optimized for RTX 3050 Ti Mobile (4GB VRAM)
- 4-bit quantization is used automatically
- If you have more VRAM, you can adjust settings in `config/settings.py`

## 🔧 **Verification**

To verify your models are detected correctly:

```bash
# Start the application and check logs
python main.py

# Look for these log messages:
# ✅ Knowledge base loaded with X chunks
# ✅ Fine-tuned LLM loaded successfully
```

## 🆘 **Troubleshooting**

### Model Not Found
```
FileNotFoundError: No fine-tuned model checkpoint found
```
**Solution:** Ensure your checkpoint directory contains `checkpoint-XXX` folders

### Knowledge Base Issues
```
Knowledge base file not found. RAG will be disabled.
```
**Solution:** Check if your `.pt` file exists and is readable

### GPU Memory Issues
```
CUDA out of memory
```
**Solution:** The system uses aggressive optimization. If issues persist:
1. Close other GPU applications
2. Restart the application
3. Reduce `MAX_INPUT_LENGTH` in settings

## 📊 **Model Information**

Current model configuration:
- **Base Model:** Sailor2-L-1B-Chat (1 billion parameters)
- **Quantization:** 4-bit NF4 with double quantization
- **Context Length:** 512 tokens (mobile GPU optimized)
- **Max New Tokens:** 2048 tokens
- **Retriever:** LaBSE for multilingual embeddings

---

**Need help?** Check the application logs in `logs/hotel_app.log` for detailed model loading information.
