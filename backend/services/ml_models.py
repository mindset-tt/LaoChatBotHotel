# services/ml_models.py
import os
import torch
import gc
import logging
from typing import List, Optional
from sentence_transformers import SentenceTransformer, util
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel
from laonlp.tokenize import word_tokenize
from config.settings import CONFIG

class ModelStore:
    def __init__(self):
        self.models_loaded = False
        self.retriever = None
        self.generator_llm = None
        self.tokenizer = None
        self.booking_intent_embedding = None
        self.rag_chunks: List[str] = []
        self.rag_embeddings: Optional[torch.Tensor] = None
        self.device = None

# Global model store
model_store = ModelStore()

def cleanup_gpu_memory():
    """Clean up GPU memory to prevent OOM errors"""
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.synchronize()
    gc.collect()

def check_gpu_memory():
    """Check and log GPU memory usage"""
    if torch.cuda.is_available():
        allocated = torch.cuda.memory_allocated() / 1024**3
        reserved = torch.cuda.memory_reserved() / 1024**3
        logging.info(f"GPU Memory - Allocated: {allocated:.2f}GB, Reserved: {reserved:.2f}GB")
        return allocated, reserved
    return 0, 0

def get_best_checkpoint(base_dir):
    """Get the best checkpoint, prioritizing 'best-checkpoint' over numbered checkpoints"""
    if not os.path.isdir(base_dir): 
        return None
    
    # Check if we should prefer best-checkpoint
    if CONFIG.PREFER_BEST_CHECKPOINT:
        # First priority: look for best-checkpoint directory
        best_checkpoint_path = os.path.join(base_dir, "best-checkpoint")
        if os.path.isdir(best_checkpoint_path):
            logging.info(f"🏆 Using best checkpoint: {best_checkpoint_path}")
            return best_checkpoint_path
    
    # Second priority: use latest numbered checkpoint
    checkpoints = [d for d in os.listdir(base_dir) if d.startswith("checkpoint-")]
    if checkpoints:
        latest = sorted(checkpoints, key=lambda x: int(x.split('-')[-1]))[-1]
        latest_path = os.path.join(base_dir, latest)
        logging.info(f"📈 Using latest checkpoint: {latest_path}")
        return latest_path
    
    # Fallback: try best-checkpoint even if preference is disabled
    if not CONFIG.PREFER_BEST_CHECKPOINT:
        best_checkpoint_path = os.path.join(base_dir, "best-checkpoint")
        if os.path.isdir(best_checkpoint_path):
            logging.info(f"🏆 Fallback to best checkpoint: {best_checkpoint_path}")
            return best_checkpoint_path
    
    return None

def load_all_models_and_data():
    if model_store.models_loaded: 
        return
    logging.info("🚀 Starting to load models optimized for RTX 3050 Ti Mobile...")

    try:
        # Set device with memory management
        model_store.device = "cuda" if torch.cuda.is_available() else "cpu"

        if torch.cuda.is_available():
            # Set memory fraction for mobile GPU
            torch.cuda.set_per_process_memory_fraction(0.85)  # Use 85% of VRAM
            logging.info(f"GPU: {torch.cuda.get_device_name()}")
            logging.info(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

        cleanup_gpu_memory()

        # Load smaller retriever model first
        logging.info(f"Loading retriever model: {CONFIG.RETRIEVER_MODEL}")
        model_store.retriever = SentenceTransformer(CONFIG.RETRIEVER_MODEL, device=model_store.device)
        check_gpu_memory()

        # Load knowledge base with fallback paths
        knowledge_base_path = None
        for path in [CONFIG.KNOWLEDGE_BASE_PATH, CONFIG.LEGACY_KNOWLEDGE_BASE_PATH]:
            if os.path.exists(path):
                knowledge_base_path = path
                break
        
        if knowledge_base_path:
            logging.info(f"Loading knowledge base from: {knowledge_base_path}")
            kb_data = torch.load(knowledge_base_path, map_location=model_store.device)
            model_store.rag_chunks = kb_data['chunks']
            model_store.rag_embeddings = kb_data['embeddings'].to(model_store.device)
            logging.info(f"✅ Knowledge base loaded with {len(model_store.rag_chunks)} chunks.")
            check_gpu_memory()
        else:
            logging.warning(f"Knowledge base file not found. RAG will be disabled.")
            logging.info(f"Searched paths: {CONFIG.KNOWLEDGE_BASE_PATH}, {CONFIG.LEGACY_KNOWLEDGE_BASE_PATH}")

        # Load fine-tuned model with fallback paths
        best_checkpoint = None
        for checkpoint_dir in [CONFIG.FINETUNED_OUTPUT_DIR, CONFIG.LEGACY_FINETUNED_OUTPUT_DIR]:
            best_checkpoint = get_best_checkpoint(checkpoint_dir)
            if best_checkpoint:
                break
        
        if not best_checkpoint:
            raise FileNotFoundError(f"No fine-tuned model checkpoint found in {CONFIG.FINETUNED_OUTPUT_DIR} or {CONFIG.LEGACY_FINETUNED_OUTPUT_DIR}.")

        logging.info(f"Loading fine-tuned LLM from: {best_checkpoint}")

        # AGGRESSIVE quantization for mobile GPU
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,  # Double quantization for extra compression
            bnb_4bit_quant_storage=torch.uint8  # Use uint8 for storage
        )

        # Load with minimal memory footprint
        base_model = AutoModelForCausalLM.from_pretrained(
            CONFIG.BASE_LLM_MODEL,
            quantization_config=bnb_config,
            device_map="auto",  # Let transformers handle device mapping
            trust_remote_code=True,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,  # Reduce CPU memory usage during loading
            use_cache=False  # Disable KV cache to save memory
        )

        model_store.generator_llm = PeftModel.from_pretrained(base_model, best_checkpoint)
        model_store.tokenizer = AutoTokenizer.from_pretrained(CONFIG.BASE_LLM_MODEL, trust_remote_code=True)

        if model_store.tokenizer.pad_token is None:
            model_store.tokenizer.pad_token = model_store.tokenizer.eos_token

        logging.info("✅ Fine-tuned LLM loaded successfully.")
        check_gpu_memory()

        # Create booking intent embedding
        booking_intent_phrase = "ຂ້ອຍຕ້ອງການຈອງຫ້ອງ"
        model_store.booking_intent_embedding = model_store.retriever.encode(
            booking_intent_phrase,
            convert_to_tensor=True,
            device=model_store.device
        )

        model_store.models_loaded = True
        logging.info("👍 All models loaded and optimized for mobile GPU.")
        check_gpu_memory()

    except torch.cuda.OutOfMemoryError:
        logging.error("❌ CUDA out of memory. Try closing other applications or reducing model size.")
        cleanup_gpu_memory()
        raise
    except Exception as e:
        logging.error(f"❌❌❌ Error during model loading: {e}", exc_info=True)
        cleanup_gpu_memory()
        raise

def get_rag_context(query: str) -> str:
    if not model_store.rag_chunks or model_store.rag_embeddings is None:
        return "ບໍ່ມີຂໍ້ມູນສະເພາະໃນຄັງຄວາມຮູ້ກ່ຽວກັບວັງວຽງ ແລະ ບໍລິການໂຮງແຮມ."

    try:
        # Use word_tokenize if available, otherwise use query as-is
        try:
            tokenized_query = " ".join(word_tokenize(query))
        except:
            tokenized_query = query
            
        query_embedding = model_store.retriever.encode(
            tokenized_query,
            convert_to_tensor=True,
            device=model_store.device
        )
        hits = util.semantic_search(
            query_embedding,
            model_store.rag_embeddings,
            top_k=CONFIG.RAG_TOP_K
        )[0]

        if hits and hits[0]['score'] > CONFIG.RAG_CONFIDENCE_THRESHOLD:
            context = "\n".join([model_store.rag_chunks[hit['corpus_id']] for hit in hits])
            logging.info(f"Retrieved context with top score: {hits[0]['score']:.4f}")
            return context
        return "ບໍ່ມີຂໍ້ມູນສະເພາະກ່ຽວກັບເລື່ອງນີ້ໃນວັງວຽງ, ແຕ່ຂ້ອຍສາມາດໃຫ້ຄຳແນະນຳທົ່ວໄປໄດ້."
    except Exception as e:
        logging.error(f"Error in RAG context retrieval: {e}")
        return "ເກີດຂໍ້ຜິດພາດໃນການຄົ້ນຫາຂໍ້ມູນ."

def generate_llm_answer_sync(user_query: str, context: str) -> str:
    """
    OPTIMIZED for mobile GPU - reduced memory usage and faster inference
    """
    try:
        cleanup_gpu_memory()  # Clean memory before inference

        system_prompt = (
            "You are Sailor2, an AI assistant for Vang Vieng, Laos tourism and hotel services. "
            "Respond in Lao language (ພາສາລາວ) with helpful, professional information about:\n"
            "- Hotel bookings and accommodations\n"
            "- Tourist attractions in Vang Vieng\n"
            "- Restaurants and local food\n"
            "- Transportation and travel tips\n"
            "- Adventure activities\n"
            "Keep responses concise and friendly."
        )

        # Shorter prompt for mobile GPU
        prompt = (
            f"System: {system_prompt}\n\n"
            f"Context: {context[:300]}...\n\n"  # Limit context length
            f"Human: {user_query}\n\n"
            f"Assistant: "
        )

        inputs = model_store.tokenizer(
            prompt,
            return_tensors="pt",
            max_length=CONFIG.MAX_INPUT_LENGTH,
            truncation=True,
            padding=False  # Don't pad to save memory
        ).to(model_store.device)

        with torch.no_grad():
            with torch.amp.autocast('cuda'):  # Use automatic mixed precision
                outputs = model_store.generator_llm.generate(
                    **inputs,
                    max_new_tokens=CONFIG.MAX_NEW_TOKENS,
                    eos_token_id=model_store.tokenizer.eos_token_id,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.9,
                    repetition_penalty=1.1,
                    use_cache=False,  # Disable KV cache to save memory
                    pad_token_id=model_store.tokenizer.eos_token_id
                )

        response = model_store.tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Clean up immediately after generation
        del inputs, outputs
        cleanup_gpu_memory()

        try:
            return response.split("Assistant: ")[-1].strip()
        except IndexError:
            return response.strip()

    except torch.cuda.OutOfMemoryError:
        logging.error("GPU OOM during generation. Cleaning memory and falling back.")
        cleanup_gpu_memory()
        return "ຂໍອະໄພ, ລະບົບໝົດຄວາມຈື່ຊົ່ວຄາວ. ກະລຸນາລອງຖາມຄຳຖາມສັ້ນໆ."
    except Exception as e:
        logging.error(f"Error in LLM generation: {e}")
        cleanup_gpu_memory()
        return "ຂໍອະໄພ, ເກີດຂໍ້ຜິດພາດໃນການຕອບ."
