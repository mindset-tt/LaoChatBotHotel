from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import sys
import os

def main():
    if len(sys.argv) != 4:
        print("Usage: python merge_lora_and_save.py <base_model_path> <lora_path> <output_path>")
        sys.exit(1)

    base_model_path = sys.argv[1]
    lora_path = sys.argv[2]
    output_path = sys.argv[3]

    print(f"[INFO] Loading base model from: {base_model_path}")
    base = AutoModelForCausalLM.from_pretrained(base_model_path, torch_dtype="auto")

    print(f"[INFO] Applying LoRA from: {lora_path}")
    model = PeftModel.from_pretrained(base, lora_path)
    model = model.merge_and_unload()

    print(f"[INFO] Saving merged model to: {output_path}")
    model.save_pretrained(output_path)

    # Optionally save tokenizer
    print(f"[INFO] Saving tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(base_model_path)
    tokenizer.save_pretrained(output_path)

    print("[✅] Merge complete!")

if __name__ == "__main__":
    main()
