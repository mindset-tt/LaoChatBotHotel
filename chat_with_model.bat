@echo off
echo Testing Sailor2 Model with llama.cpp
echo ====================================
echo.

set MODEL_PATH=models\Sailor2-L-1B-Chat-F16.gguf
set LLAMA_CLI=llama.cpp\build\bin\Release\llama-cli.exe

if not exist "%LLAMA_CLI%" (
    echo ERROR: llama-cli.exe not found!
    echo Please build llama.cpp first by running build_llama.bat
    goto :end
)

if not exist "%MODEL_PATH%" (
    echo ERROR: Model file not found: %MODEL_PATH%
    echo Please convert your model first by running convert_model.bat
    echo.
    echo Available files in models directory:
    if exist "models" (
        dir models
    ) else (
        echo Models directory not found.
    )
    goto :end
)

echo Model found: %MODEL_PATH%
echo Starting interactive chat...
echo.
echo Instructions:
echo - Type your message and press Enter
echo - Type 'quit' to exit
echo - The model will respond based on your fine-tuning
echo.

REM Interactive mode
"%LLAMA_CLI%" -m "%MODEL_PATH%" -i --color --interactive-first

:end
echo.
pause
