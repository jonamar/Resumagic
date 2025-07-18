#!/usr/bin/env python3
"""
Simple test script to confirm Ollama integration works locally.
"""

import requests
import json
import sys

def test_ollama_connection():
    """Test basic connection to Ollama API"""
    try:
        # Test if Ollama is running
        response = requests.get("http://localhost:11434/api/tags")
        if response.status_code == 200:
            models = response.json()
            print("✓ Ollama is running")
            print(f"Available models: {[model['name'] for model in models.get('models', [])]}")
            return True
        else:
            print(f"✗ Ollama API returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to Ollama. Is it running on localhost:11434?")
        return False
    except Exception as e:
        print(f"✗ Error connecting to Ollama: {e}")
        return False

def test_simple_chat(model_name="qwen3:8b"):
    """Test a simple chat interaction"""
    try:
        url = "http://localhost:11434/api/generate"
        data = {
            "model": model_name,
            "prompt": "Hello! Can you respond with just 'Hello from Ollama!'?",
            "stream": False
        }
        
        response = requests.post(url, json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Chat test successful with {model_name}")
            print(f"Response: {result.get('response', 'No response')}")
            return True
        else:
            print(f"✗ Chat test failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error in chat test: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing Ollama integration...\n")
    
    # Test connection
    if not test_ollama_connection():
        print("\nQuick fix: Run 'ollama serve' in another terminal")
        sys.exit(1)
    
    print()
    
    # Test chat
    if not test_simple_chat():
        print("\nTry: ollama pull llama3.2")
        sys.exit(1)
    
    print("\n✓ All tests passed! Ollama integration is working.")

if __name__ == "__main__":
    main()