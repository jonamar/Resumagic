# qwen3:0.6b Production Parallelization Test PRD

**Status**: Implementation | **Priority**: High | **Effort**: 1 hour | **Owner**: AI Assistant

## Hypothesis
**qwen3:0.6b's 4x smaller memory footprint (522MB vs 2.2GB) enables higher OLLAMA_NUM_PARALLEL settings, reducing total 6-persona evaluation time below phi3:mini's ~140s baseline when tested against real evaluation complexity.**

## Problem Statement
Previous tests used oversimplified prompts and artificial timeouts. Need to test against actual production workload:
- Real 10k+ character prompts with full persona evaluation criteria
- Real test resume datasets (weak/average/strong candidates)
- Real job posting requirements
- Full 6-persona evaluation pipeline

## Implementation Plan

### 1. Extend evaluation-runner.ts CLI
Add parameters without breaking existing functionality:
```bash
npx ts-node evaluation-runner.ts [application-name] [candidate-name] --model=MODEL --parallel=N
```

**Implementation Strategy**: Work with compiled files approach
- Keep existing `.js` dynamic imports (leverage existing `dist/` compiled files)
- Add CLI parameter parsing and KPI tracking to source
- Run `tsc` build process to compile changes
- Test against compiled JavaScript files in `dist/` directory
- **Rationale**: Existing system already works with compiled files, minimal risk approach

### 2. Add KPI Tracking
Minimal logging addition to capture:
- Wall-clock time (start to finish)
- Model used
- Parallel setting used
- Success/failure status

### 3. Test Matrix
**Models**: phi3:mini (baseline), qwen3:0.6b (test)
**Parallel Settings**: 4 (baseline), 8 (test)  
**Test Resumes**: weak-candidate, average-candidate, strong-candidate
**Runs per config**: 3 (statistical validity)
**Total tests**: 2 models × 2 parallel settings × 3 resumes × 3 runs = 36 tests

### 4. Orchestration Script
Simple bash script to run test matrix and collect results.

## Success Criteria
- **Primary**: qwen3:0.6b at OLLAMA_NUM_PARALLEL=8 beats phi3:mini baseline by >10%
- **Reliability**: 100% success rate across all test configurations
- **Statistical validity**: Consistent results across 3 runs per configuration

## Test Environment
- **Job Posting**: Use existing real job posting from applications folder
- **Test Resumes**: Use the 3 test resume datasets (weak/average/strong)
- **Hardware**: Mac Mini M4, 16GB RAM (current production environment)

## Deliverables
1. **Enhanced evaluation-runner.ts** with CLI parameters and KPI logging
2. **Test orchestration script** for automated test execution
3. **Results analysis** in markdown format with performance comparison
4. **Production recommendation** based on test outcomes

---
**Expected runtime**: ~45 minutes total test execution (36 tests × ~1.25min average)