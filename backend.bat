@echo off
REM ===================[ BACKEND STARTUP + CONVERT SCRIPT ]======================
REM Compatible with:
REM - Anaconda at: C:\ProgramData\Anaconda3
REM - Conda environment: cuda_env
REM - Visual Studio 2022 (auto-detected)
REM - GPU: NVIDIA 3050 Ti
REM ============================================================================

echo [1/8] Cleaning up environment variables to avoid overflow...
SET INCLUDE=
SET LIB=
SET LIBPATH=
SET PYTHONPATH=
SET CL=
SET LINK=
SET PATH=%SystemRoot%\System32;%SystemRoot%;C:\ProgramData\Anaconda3;C:\ProgramData\Anaconda3\Scripts;C:\ProgramData\Anaconda3\Library\bin

echo [2/8] Activating conda environment: cuda_env
CALL "C:\ProgramData\Anaconda3\Scripts\activate.bat" cuda_env
IF ERRORLEVEL 1 (
    echo [ERROR] Failed to activate conda environment.
    EXIT /B 1
)

echo [3/8] Setting required compiler variables...
SET DISTUTILS_USE_SDK=1
SET MSSdk=1
SET "VS_VERSION=17.0"
SET "VS_MAJOR=17"
SET "VS_YEAR=2022"
SET "MSYS2_ARG_CONV_EXCL=/AI;/AL;/OUT;/out"
SET "MSYS2_ENV_CONV_EXCL=CL"
SET "PY_VCRUNTIME_REDIST=\bin\vcruntime140.dll"
SET "CXX=cl.exe"
SET "CC=cl.exe"

echo [4/8] Setting trimmed INCLUDE path for MSVC...
SET "INCLUDE=C:\Program Files\Microsoft Visual Studio\2022\Professional\VC\Tools\MSVC\14.16.27023\include;"
SET "INCLUDE=%INCLUDE%C:\Program Files (x86)\Windows Kits\10\include\10.0.26100.0\ucrt;"
SET "INCLUDE=%INCLUDE%C:\Program Files (x86)\Windows Kits\10\include\10.0.26100.0\um;"
SET "INCLUDE=%INCLUDE%C:\Program Files (x86)\Windows Kits\10\include\10.0.26100.0\shared;"

echo [5/8] Loading Visual Studio 2022 Developer Tools...
FOR /F "tokens=*" %%i IN ('"C:\Program Files\Microsoft Visual Studio\Installer\vswhere.exe" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath') DO SET "VSINSTALLDIR=%%i"
IF NOT EXIST "%VSINSTALLDIR%\Common7\Tools\VsDevCmd.bat" (
    echo [ERROR] Could not find VsDevCmd.bat in VS installation at: %VSINSTALLDIR%
    EXIT /B 1
)
CALL "%VSINSTALLDIR%\Common7\Tools\VsDevCmd.bat"
IF ERRORLEVEL 1 (
    echo [ERROR] Failed to initialize Visual Studio 2022 environment.
    EXIT /B 1
)

echo [6/8] Verifying CUDA GPU availability via Python...
python -c "import torch; print('CUDA available:', torch.cuda.is_available()); assert torch.cuda.is_available(), 'CUDA not available!'; print('GPU:', torch.cuda.get_device_name(0))"
IF ERRORLEVEL 1 (
    echo [ERROR] CUDA GPU not detected or PyTorch CUDA not working.
    EXIT /B 1
)

echo [7/8] Running backend conversion script...
python .\app_llamacpp.py
IF ERRORLEVEL 1 (
    echo [ERROR] Backend conversion script failed.
    EXIT /B 1
)

echo [8/8] Backend conversion completed successfully!
