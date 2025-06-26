@echo off
call cd .\backend
call conda activate cuda_env
python .\main.py
