# qwen3:0.6b Model Evaluation PRD: Speed vs Quality Analysis

**Status**: Draft | **Priority**: Medium | **Effort**: 1-2 days | **Owner**: AI Assistant  
**Dependencies**: Existing hiring evaluation testing framework

## Executive Summary

Systematically evaluate the new `qwen3:0.6b` model against the current production baseline `phi3:mini` to determine if it offers better speed/quality tradeoffs for hiring evaluations in production-realistic conditions.

**Key Metrics**: Speed comparison (target: <139s baseline), quality maintenance (score appropriateness), memory efficiency under optimized Ollama settings.

## Problem Statement

### Current State
- **Production Model**: `phi3:mini` with aggressive parallel Ollama configuration
- **Current Performance**: ~139s per 6-persona evaluation (baseline from comprehensive optimization)
- **Pain Point**: Need to continuously evaluate new lightweight models for potential speed/quality improvements

### Opportunity
- **qwen3:0.6b** represents a new ultra-lightweight model that may offer:
  - Faster inference than current `phi3:mini` baseline
  - Maintained or improved output quality
  - Better memory efficiency

## Solution: Production-Realistic Model Evaluation

### Design Principles

1. **Production Fidelity**: Test using actual production Ollama settings (`aggressive_parallel`)
2. **Comparative Analysis**: Direct comparison against established `phi3:mini` baseline
3. **Quality Gates**: Maintain evaluation accuracy and feedback depth standards
4. **Statistical Validity**: Multiple test runs across representative candidate profiles

### Implementation Approach

#### Phase 1: Framework Integration
- Add `qwen3:0.6b` to existing `model-performance-test.js` framework
- Ensure compatibility with current test infrastructure
- Verify model availability in Ollama

#### Phase 2: Benchmark Execution
- Run comprehensive tests using 3 standard test candidates:
  - **Alex Johnson** (Weak - 1-2yr exp, target score 3-6)
  - **Morgan Davis** (Average - 4-5yr exp, target score 5-7)  
  - **Dr. Sarah Chen** (Strong - 12yr exp, target score 7-9)
- Use production Ollama configuration:
  ```bash
  OLLAMA_NUM_PARALLEL=8
  OLLAMA_NUM_THREADS=10
  OLLAMA_MAX_LOADED_MODELS=1
  ```
- Execute 6-persona parallel evaluations matching production flow

#### Phase 3: Analysis & Documentation
- Compare speed metrics (total evaluation time)
- Analyze quality metrics (score appropriateness, feedback depth)
- Update benchmark documentation with findings
- Provide deployment recommendation

## Success Metrics

### Speed Performance
- **Target**: Beat current `phi3:mini` baseline of ~139s
- **Acceptable**: Within 10% of baseline (125-153s range)
- **Excellent**: >20% improvement (<111s)

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
- **Base Script**: `model-performance-test.js`
- **Test Execution**: Automated benchmark runs
- **Results Storage**: JSON logs with full evaluation archives
- **Documentation**: Update `benchmark-results.md`

### Environment Setup
```bash
# Production-like Ollama configuration
export OLLAMA_NUM_PARALLEL=8
export OLLAMA_NUM_THREADS=10
export OLLAMA_MAX_LOADED_MODELS=1
ollama serve
```

### Expected Deliverables
1. **Updated Test Framework**: `qwen3:0.6b` added to model test list
2. **Benchmark Results**: Complete performance data vs `phi3:mini`
3. **Analysis Report**: Speed/quality comparison with deployment recommendation
4. **Documentation**: Updated benchmark results and methodology notes

## Risk Mitigation

### Technical Risks
- **Model Unavailability**: Verify `qwen3:0.6b` is available in Ollama before testing
- **Quality Degradation**: Implement quality gates to catch evaluation accuracy issues
- **Test Framework Compatibility**: Validate integration with existing test infrastructure

### Timeline Risks
- **Ollama Performance Variability**: Run multiple test iterations for statistical validity
- **Extended Evaluation Times**: Set reasonable timeouts (5min max per evaluation)

## Validation Plan

### Pre-Implementation
- [ ] Verify `qwen3:0.6b` model availability
- [ ] Confirm test framework functionality
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
