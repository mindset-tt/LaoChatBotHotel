#!/usr/bin/env python3
# debug_llamacpp.py
# Debug script to test llama.cpp directly

import asyncio
import tempfile
import os
import subprocess

async def test_llamacpp_direct():
    """Test llama.cpp directly to see what's happening"""
    
    # Simple prompt
    prompt = """System: You are a helpful assistant. Respond in Lao language."""
    prompt += "\nUser: ສະບາຍດີ"
    
    # Create a temporary file for the prompt
    with tempfile.NamedTemporaryFile(delete=False, mode='w', encoding='utf-8') as temp_file:
        temp_file.write(prompt)
        temp_file_path = temp_file.name
    
    # Path to the llama.cpp executable
    llama_cpp_executable = "llama"  # Adjust this path if necessary
    
    # Run the llama.cpp executable with the temporary file
    try:
        result = subprocess.run(
            [llama_cpp_executable, "--prompt", temp_file_path],
            capture_output=True,
            text=True
        )
        
        print("Output:")
        print(result.stdout)
        
        if result.stderr:
            print("Errors:")
            print(result.stderr)
    
    finally:
        # Clean up the temporary file
        os.remove(temp_file_path)

if __name__ == "__main__":
    asyncio.run(test_llamacpp_direct())
    print("Testing llama.cpp directly...")