#!/bin/bash

# Setup script for Ollama Optimization Experiment
echo "🚀 Setting up Ollama Optimization Experiment"
echo "==========================================="

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install from: https://ollama.ai"
    exit 1
fi

echo "✅ Ollama found: $(ollama --version)"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama server not running. Starting ollama serve..."
    echo "   Run 'ollama serve' in another terminal and press Enter to continue..."
    read -p ""
fi

echo "✅ Ollama server is running"

# Pull required models
echo "📥 Pulling required models (this may take several minutes)..."

models=("dolphin3:latest" "phi3:mini" "deepseek-r1:8b" "qwen3:8b" "gemma3:4b" "qwen3:4b")

for model in "${models[@]}"; do
    echo "   Pulling $model..."
    if ollama pull "$model"; then
        echo "   ✅ $model ready"
    else
        echo "   ❌ Failed to pull $model (you can continue without it)"
    fi
done

echo ""
echo "🧪 Experiment Ready!"
echo ""
echo "Available commands:"
echo "  npm run phase1  - Run Phase 1: Model Selection Benchmark (~4 hours)"
echo "  npm run phase2  - Run Phase 2: Configuration Optimization (~6 hours)"  
echo ""
echo "⚠️  Note: Full experiment takes 8-10 hours. Consider testing with reduced iterations first."
echo ""
echo "📖 See README.md for detailed methodology and expected results."