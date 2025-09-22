# qwen3:0.6b Model Evaluation PRD: Speed vs Quality Analysis

**Status**: Updated Draft | **Priority**: Medium | **Effort**: 1-2 days | **Owner**: AI Assistant  
**Dependencies**: Minor test framework fixes, existing hiring evaluation infrastructure

## Executive Summary

Systematically evaluate the `qwen3:0.6b` model against the current speed baseline `phi3:mini` (140s) to determine if it offers better speed performance while maintaining quality for hiring evaluations.

**Key Metrics**: Speed comparison (target: <140s baseline), quality maintenance (score appropriateness), memory efficiency under conservative Ollama settings.

## Current Infrastructure Status

**Testing Framework**: Minor compatibility issues need fixing
- Import path needs update from `./evaluation-runner` to `./evaluation-runner.ts` 
- Test candidate references need updating from folder names to JSON file structure
- Otherwise fully functional framework ready for model testing

**Model Configuration**: `qwen3:0.6b` needs to be added to active test suite
- Currently in archived test files but missing from active `speed_3_4b` category
- Simple addition to existing model list required

## Problem Statement

### Current State
- **Production Models**: `dolphin3:latest` (quality-optimized, ~170s, 9.0-10.0/10) and `phi3:mini` (speed-optimized, ~140s, 7.0-8.0/10) 
- **Current Speed Target**: `phi3:mini` at 140s - the model we want to beat with qwen3:0.6b
- **Test Framework Status**: Minor compatibility issues preventing execution (TS import path, file vs folder references)
- **Pain Point**: Need to evaluate new ultra-lightweight models for potential speed improvements over current 140s baseline

### Opportunity
- **qwen3:0.6b** represents a new ultra-lightweight model that may offer:
  - Faster inference than current `phi3:mini` speed baseline (target: <140s)
  - Maintained quality compared to current production models
  - Better memory efficiency due to smaller model size

## Solution: Production-Realistic Model Evaluation

### Design Principles

1. **Production Fidelity**: Test using actual production Ollama settings (`conservative_parallel`)
2. **Comparative Analysis**: Direct comparison against `phi3:mini` speed baseline (140s target to beat)
3. **Quality Gates**: Maintain evaluation accuracy and feedback depth standards
4. **Statistical Validity**: Multiple test runs across representative candidate profiles

### Implementation Approach

#### Phase 1: Standardized Test Framework
- **Script**: `model-comparison-test.ts` - reusable test runner for any model comparison
- **Config**: `qwen-vs-phi3.config.json` - specific test configuration with static record
- Separates logic from configuration for standardization and comparability
- Easy to create new configs for future model tests

#### Phase 2: Execute & Analyze  
- Run: `npx ts-node model-comparison-test.ts qwen-vs-phi3.config.json`
- Automated comparison using config-specified models and candidates  
- Generate markdown report with speed/quality analysis and clear winner recommendation
- Results include config snapshot for full reproducibility

## Success Metrics

### Speed Performance
- **Target**: Beat current `phi3:mini` speed baseline of 140s
- **Acceptable**: Within 10% of baseline (126-154s range)  
- **Excellent**: >15% improvement (<119s)

### Quality Maintenance
- **Score Appropriateness**: Candidates receive expected score ranges
- **Score Discrimination**: Good variance between personas (σ > 0.5)
- **Feedback Quality**: Specific, actionable reasoning (>50 chars per criterion)
- **Consistency**: No evaluation failures or timeouts

### Technical Requirements
- Memory usage within 16GB constraint
- No degradation in evaluation accuracy
- Compatibility with existing production infrastructure

## Implementation Details

### Testing Framework
- **Base Script**: `ollama-optimization-experiment/model-performance-test.js`
- **Test Candidates**: JSON files in `app/test-resumes/` (`weak-candidate.json`, `average-candidate.json`, `strong-candidate.json`)
- **Evaluation Runner**: TypeScript `evaluation-runner.ts` (requires import compatibility fixes)
- **Test Execution**: Automated benchmark runs (currently broken due to TS/JS import issues)
- **Results Storage**: JSON logs in `model-test-results/` with full evaluation archives
- **Documentation**: Update `benchmark-results.md`

### Environment Setup
```bash
# Production Ollama configuration (conservative parallel settings)
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_NUM_THREADS=6
export OLLAMA_MAX_LOADED_MODELS=1
ollama serve
```

### Expected Deliverables
1. **Standardized Test Framework**: `model-comparison-test.ts` - reusable script for any model comparison
2. **Test Configuration**: `qwen-vs-phi3.config.json` - static record of test parameters and thresholds
3. **Benchmark Results**: JSON results with full config snapshot and raw data for reproducibility
4. **Analysis Report**: Markdown report with speed/quality comparison and clear deployment recommendation  
5. **Template for Future Tests**: Easy to create new `.config.json` files for different model comparisons

## Risk Mitigation

### Technical Risks
- **Framework Compatibility**: Fix TypeScript/JavaScript import issues preventing test execution (high priority)
- **Model Unavailability**: Verify `qwen3:0.6b` is available in Ollama before testing  
- **Quality Degradation**: Implement quality gates to catch evaluation accuracy issues
- **File Path Dependencies**: Update hardcoded test candidate folder references to use actual JSON file structure

### Timeline Risks
- **Ollama Performance Variability**: Run multiple test iterations for statistical validity
- **Extended Evaluation Times**: Set reasonable timeouts (5min max per evaluation)

## Validation Plan

### Pre-Implementation
- [ ] Fix test framework TypeScript import compatibility issues
- [ ] Update test candidate file path references (folders → JSON files)
- [ ] Verify `qwen3:0.6b` model availability in Ollama
- [ ] Confirm test framework functionality after repairs
- [ ] Validate production Ollama configuration

### Post-Implementation
- [ ] Execute comprehensive benchmark suite
- [ ] Analyze speed and quality metrics
- [ ] Generate deployment recommendation
- [ ] Update documentation

## Future Considerations

### Continuous Model Evaluation
- Establish repeatable process for evaluating new models
- Consider automation of benchmark runs for new model releases
- Integrate findings into production deployment pipeline

### Performance Optimization
- Use findings to inform future Ollama configuration tuning
- Consider model-specific temperature optimizations
- Evaluate potential for hybrid model strategies (fast screening + detailed review)
