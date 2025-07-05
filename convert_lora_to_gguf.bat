@echo off
setlocal enabledelayedexpansion

REM =================== USER CONFIG ======================
set BASE_MODEL=sail/Sailor2-L-1B-Chat
set LORA_DIR=sailor2-1b-vangvieng-finetuned
set MERGED_OUT=merged-model-dir
set GGUF_OUT=models
REM ======================================================

echo.
echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    goto :end
)

echo.
echo [2/5] Installing required packages...
pip install torch transformers peft safetensors sentencepiece gguf

echo.
echo [3/5] Merging base model and LoRA adapter...
python merge_lora_and_save.py %BASE_MODEL% %LORA_DIR% %MERGED_OUT%
if errorlevel 1 (
    echo [❌] LoRA merge failed.
    goto :end
)

echo.
echo [4/5] Converting merged model to GGUF...
cd llama.cpp
python convert_hf_to_gguf.py "../%MERGED_OUT%" --outfile "../%GGUF_OUT%/%GGUF_NAME%" --outtype f16
if errorlevel 1 (
    echo [❌] GGUF conversion failed.
    goto :end
)
cd ..

echo.
echo [✅] All steps complete! Check the output folder: %GGUF_OUT%

:end
pause
