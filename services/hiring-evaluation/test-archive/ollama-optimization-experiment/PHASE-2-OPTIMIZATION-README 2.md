# Phase 2: Comprehensive Ollama Performance Optimization

## Overview

Phase 2 conducts systematic testing of Ollama performance optimization configurations to identify the optimal settings for **real-world single-applicant, 6-persona parallel evaluations**.

This addresses the key finding from Phase 1: all models showed similar speeds (~150-180s) because Ollama was running with default settings that process persona evaluations sequentially rather than in parallel.

## Test Objectives

### Primary Goal
Optimize the **real-world use case**: 1 applicant → 6 personas running in parallel (not multiple resumes)

### Key Questions
1. Which Ollama configuration achieves fastest 6-persona parallel evaluation?
2. What are the memory/stability tradeoffs of aggressive parallelization?
3. Which model performs best with optimization enabled?
4. What are the production deployment requirements?

## Comprehensive Test Matrix

### Models Under Test
- **dolphin3:latest** (baseline - current production)
- **phi3:mini** (Phase 1 speed winner)
- **deepseek-r1:8b** (Phase 1 quality winner)

### Optimization Configurations
1. **baseline_default**: Current production settings (no environment variables)
2. **parallel_6_personas**: `OLLAMA_NUM_PARALLEL=6` (match 6 personas)
3. **parallel_threads_optimized**: Parallel + `OLLAMA_NUM_THREADS=8` (M4 optimization)
4. **memory_conservative**: `OLLAMA_NUM_PARALLEL=4` + memory limits (16GB constraint)
5. **aggressive_parallel**: `OLLAMA_NUM_PARALLEL=8` + max threading (test limits)

### Test Validation
- **Multiple runs per configuration** (3 runs for statistical validity)
- **Two candidate types** (weak/average for speed+accuracy validation)
- **Quality gate enforcement** (no degradation in score accuracy or reasoning depth)
- **Memory usage monitoring** (16GB RAM constraint compliance)
- **Timeout protection** (5min per evaluation maximum)

## Expected Outcomes

### Performance Targets
- **Current baseline**: ~150-180s per evaluation
- **Target with optimization**: <30s per evaluation (5-6x improvement)
- **Acceptable range**: <60s per evaluation (2-3x improvement)

### Success Metrics
1. **Speed**: Total evaluation time reduction
2. **Quality**: Maintained score appropriateness and feedback depth  
3. **Stability**: No memory exhaustion or timeouts
4. **Consistency**: Low variance across multiple runs

## Data Collection Framework

### Comprehensive Metrics Per Test
- **Performance**: Duration, personas completed, average persona time
- **Quality**: Score appropriateness, reasoning depth, persona discrimination
- **System**: Memory usage before/during/after, CPU utilization
- **Reliability**: Success rate, timeout occurrences, error patterns

### Statistical Analysis
- **Mean/median/std deviation** for all timing measurements
- **Confidence intervals** for performance claims
- **Quality consistency** across multiple runs
- **Resource utilization patterns**

### Full Data Archive
- **Raw evaluation outputs** preserved for quality verification
- **Complete test metadata** for reproducibility
- **System snapshots** for resource analysis
- **Statistical summaries** for production decisions

## Production Deployment Focus

### Real-World Optimization
Testing focuses specifically on optimizations that benefit the production use case:
- **Single applicant evaluation** (not bulk processing)
- **6-persona parallel processing** (not model parallelization)
- **Mac Mini M4 constraints** (16GB RAM, 10-core CPU)
- **Quality maintenance** (no degradation acceptable)

### Deployment Outputs
1. **Optimal configuration recommendation** with exact environment variables
2. **Performance improvement quantification** (baseline vs optimized)
3. **Step-by-step deployment instructions** for production
4. **Resource requirement validation** for current hardware

## Implementation Approach

### 1. Automated Testing Framework ✅
Comprehensive test runner with:
- Full configuration matrix coverage (5 configs × 3 models × 2 candidates × 3 runs = 90 evaluations)
- Ollama environment management (stop/configure/restart/validate)
- Statistical data collection and analysis
- Quality gate enforcement
- Production recommendation generation

### 2. Statistical Validation
- Multiple runs per configuration for confidence intervals
- Cross-candidate validation (weak/average) for consistency
- Quality metrics enforcement (no degradation tolerance)
- Resource constraint compliance verification

### 3. Production Recommendations
- Optimal configuration identification based on speed+quality+stability
- Deployment instruction generation
- Performance gain quantification
- Resource requirement documentation

## Timeline & Execution

**Estimated Duration**: 2-3 hours for complete test matrix
- ~2-3 minutes per evaluation × 90 evaluations = ~4 hours if sequential
- With optimization: ~30-60s per evaluation × 90 = ~90 minutes if successful

**Execution Strategy**:
1. Start automated comprehensive test framework
2. Monitor progress and collect real-time metrics
3. Generate statistical analysis upon completion
4. Create production deployment recommendations
5. Validate optimal configuration with manual verification

This systematic approach ensures we gather comprehensive, statistically valid data to make confident production deployment decisions for Ollama performance optimization.