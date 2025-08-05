# Production Deployment Recommendations

**Optimal Configuration**: conservative_parallel
**Recommended Model**: phi3:mini
**Expected Performance**: ~140s per evaluation

## Performance Improvement
- **Baseline**: 140.7s (default settings)
- **Optimized**: ~140s (conservative parallel, minimal performance impact but better stability)
- **Speedup**: 1.0x (prioritizing stability over marginal speed gains)

## Deployment Instructions

### Step 1: Stop Current Ollama
```bash
pkill -f "ollama serve"
```

### Step 2: Set Environment Variables
```bash
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_NUM_THREADS=6
export OLLAMA_MAX_LOADED_MODELS=1
```

### Step 3: Start Optimized Ollama
```bash
ollama serve
```

### Step 4: Verify Configuration
Run a test evaluation to confirm performance improvements.
