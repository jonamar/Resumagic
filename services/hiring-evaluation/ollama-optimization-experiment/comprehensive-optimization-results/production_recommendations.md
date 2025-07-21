# Production Deployment Recommendations

**Optimal Configuration**: aggressive_parallel
**Recommended Model**: phi3:mini
**Expected Performance**: 139.2s per evaluation

## Performance Improvement
- **Baseline**: 140.7s
- **Optimized**: 139.2s
- **Speedup**: 1.0x

## Deployment Instructions

### Step 1: Stop Current Ollama
```bash
pkill -f "ollama serve"
```

### Step 2: Set Environment Variables
```bash
export OLLAMA_NUM_PARALLEL=8
export OLLAMA_NUM_THREADS=10
export OLLAMA_MAX_LOADED_MODELS=1
```

### Step 3: Start Optimized Ollama
```bash
ollama serve
```

### Step 4: Verify Configuration
Run a test evaluation to confirm performance improvements.
