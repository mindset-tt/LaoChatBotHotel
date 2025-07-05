@echo off
echo Converting Sailor2 LoRA model to GGUF format...
echo.

REM Create models directory if it doesn't exist
if not exist "models" mkdir models

echo Step 1: Converting HuggingFace model to GGUF...
cd llama.cpp

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found! Please install Python first.
    goto :end
)

REM Install required Python packages
echo Installing required packages...
pip install torch transformers safetensors gguf numpy sentencepiece

echo.
echo Converting model...
python convert_hf_to_gguf.py ../sailor2-1b-vangvieng-finetuned --outdir ../models --outtype f16

if errorlevel 1 (
    echo ERROR: Conversion failed!
    echo This might be because it's a LoRA adapter that needs to be merged with a base model first.
    echo.
    echo Alternative approach:
    echo 1. Download the base Sailor2-1B model
    echo 2. Merge the LoRA adapter with the base model
    echo 3. Then convert to GGUF
    goto :end
)

echo.
echo Step 2: Testing the converted model...
cd ..

if exist "models\sailor2-1b-vangvieng-finetuned.gguf" (
    echo Model converted successfully!
    echo Testing with a simple prompt...
    llama.cpp\build\bin\Release\llama-cli.exe -m models\sailor2-1b-vangvieng-finetuned.gguf -p "Hello! My name is" -n 50
) else (
    echo Model file not found. Conversion may have failed.
    echo Check the models directory:
    dir models
)

:end
echo.
pause
