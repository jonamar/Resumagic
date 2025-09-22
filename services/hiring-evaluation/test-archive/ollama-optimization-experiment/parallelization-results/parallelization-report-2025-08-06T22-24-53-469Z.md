# qwen3:0.6b Parallelization Test Results

**Test Date**: 2025-08-06T22:24:53.469Z
**Hypothesis**: qwen3:0.6b's 4x smaller memory enables better parallelization

## Results Summary

### phi3_baseline
- **Model**: phi3:mini
- **OLLAMA_NUM_PARALLEL**: 4
- **Average Time**: FAILED
- **Success Rate**: 0/3

### qwen_same
- **Model**: qwen3:0.6b
- **OLLAMA_NUM_PARALLEL**: 4
- **Average Time**: FAILED
- **Success Rate**: 0/3

### qwen_higher
- **Model**: qwen3:0.6b
- **OLLAMA_NUM_PARALLEL**: 8
- **Average Time**: FAILED
- **Success Rate**: 0/3

### qwen_aggressive
- **Model**: qwen3:0.6b
- **OLLAMA_NUM_PARALLEL**: 12
- **Average Time**: FAILED
- **Success Rate**: 0/3

## Conclusion

