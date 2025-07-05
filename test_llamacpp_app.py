#!/usr/bin/env python3
# test_llamacpp_app.py
# Quick test script for the llama.cpp FastAPI integration

import requests
import json

def test_llamacpp_integration():
    base_url = "http://localhost:8000"
    
    print("🧪 Testing llama.cpp FastAPI integration...")
    
    # Test 1: Check llama.cpp status
    print("\n1. Checking llama.cpp status...")
    try:
        response = requests.get(f"{base_url}/llamacpp_status/")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: Check GPU status
    print("\n2. Checking GPU status...")
    try:
        response = requests.get(f"{base_url}/gpu_status/")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: Test simple chat
    print("\n3. Testing simple chat...")
    try:
        chat_data = {
            "text": "ສະບາຍດີ, ທ່ານເป็ນຄືແນວ?",
            "session_id": "test-session-1"
        }
        response = requests.post(f"{base_url}/ask/", json=chat_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 4: Test booking intent
    print("\n4. Testing booking intent...")
    try:
        booking_data = {
            "text": "ຂ້ອຍຕ້ອງການຈອງຫ້ອງ",
            "session_id": "test-session-2"
        }
        response = requests.post(f"{base_url}/ask/", json=booking_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_llamacpp_integration()
