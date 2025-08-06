# qwen3:0.6b Parallelization Test PRD

**Status**: Draft | **Priority**: High | **Effort**: 2 hours | **Owner**: AI Assistant  

## Hypothesis
**qwen3:0.6b's 4x smaller memory footprint (522MB vs 2.2GB) enables higher OLLAMA_NUM_PARALLEL settings, reducing total 6-persona evaluation time below phi3:mini's 140s baseline despite similar per-request speeds.**

## Problem Statement
Previous optimization tests showed that increasing `OLLAMA_NUM_PARALLEL` from 1→6 only improved phi3:mini by 1.1s (140.7s→139.6s), far below expected 6x improvement. This suggests phi3:mini hits Ollama's memory-constrained parallelization ceiling.

## Test Design

### Configurations to Test
1. **phi3:mini baseline**: `OLLAMA_NUM_PARALLEL=4` (current recommended)
2. **qwen3:0.6b same**: `OLLAMA_NUM_PARALLEL=4` (control) 
3. **qwen3:0.6b higher**: `OLLAMA_NUM_PARALLEL=8` (test if smaller enables more)
4. **qwen3:0.6b aggressive**: `OLLAMA_NUM_PARALLEL=12` (push limits)

### Success Criteria
- **Winner**: qwen3:0.6b at higher parallelization beats phi3:mini baseline by >10% (target: <126s)
- **Quality gate**: Scores remain appropriate for candidate levels

### Implementation
- TypeScript script using existing evaluation-runner.ts
- Test all configs against same 3 candidates (weak/average/strong)
- Measure: wall-clock time, memory usage, actual parallelization achieved

## Deliverables
1. **Test script**: `parallelization-test.ts`
2. **Results**: JSON with timing + quality data
3. **Recommendation**: Deploy qwen3:0.6b with optimal parallel config OR stick with phi3:mini

---
**Expected runtime**: ~20 minutes (4 configs × 3 candidates × ~1.5min each)