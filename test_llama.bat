@echo off
echo Testing llama.cpp compilation...
echo.

REM Set paths
set LLAMA_PATH=%~dp0llama.cpp\build\bin\Release
set MODEL_PATH=%~dp0models

echo Llama.cpp executables path: %LLAMA_PATH%
echo Model path: %MODEL_PATH%
echo.

REM Check if executables exist
if not exist "%LLAMA_PATH%\llama-cli.exe" (
    echo ERROR: llama-cli.exe not found!
    echo Please make sure llama.cpp is built correctly.
    goto :end
)

echo Available llama.cpp tools:
dir "%LLAMA_PATH%\*.exe" /b

echo.
echo =================================
echo NEXT STEPS TO USE YOUR MODEL:
echo =================================
echo.
echo 1. Convert your LoRA model to GGUF format:
echo    - First, you need to merge your LoRA adapter with a base model
echo    - Then convert to GGUF format using convert_hf_to_gguf.py
echo.
echo 2. Example conversion command:
echo    cd llama.cpp
echo    python convert_hf_to_gguf.py ../sailor2-1b-vangvieng-finetuned --outdir ../models --outtype f16
echo.
echo 3. Once converted, test with:
echo    llama.cpp\build\bin\Release\llama-cli.exe -m models\sailor2-1b-vangvieng-finetuned.gguf -p "Hello, how are you?"
echo.
echo Current model directory contents:
if exist "%~dp0sailor2-1b-vangvieng-finetuned" (
    echo Found LoRA model: sailor2-1b-vangvieng-finetuned
    dir "%~dp0sailor2-1b-vangvieng-finetuned" /b
) else (
    echo No model found
)

:end
echo.
pause
