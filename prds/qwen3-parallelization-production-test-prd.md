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

### 1. Extend Main CLI with Evaluation Flags
Add evaluation-specific flags to the main CLI system:
```bash
node generate-resume.js [application-name] --evaluate --eval-model qwen3:0.6b --eval-parallel 8
```

**Implementation Strategy**: Work within existing CLI architecture
- Add `--eval-model` and `--eval-parallel` flags to `cli/argument-parser.ts`
- Extend `services/hiring-evaluation.ts` to accept model and parallel configuration
- Pass parameters through service wrapper to evaluation-runner implementation
- **Rationale**: Respects existing architecture (CLI → Service Interface → Implementation)

### 2. Add KPI Tracking

**Performance KPIs:**
- Wall-clock time (start to finish)
- Model used
- Parallel setting used
- Success/failure status

**Quality KPIs:**
- Score differentiation: Range across 6 personas per evaluation
- Output completeness: JSON parsing success rate
- Persona-specific reasoning: Unique insights per role

### 3. Test Matrix & Quality Validation

**Performance Test Matrix:**
- **Models**: phi3:mini (baseline), qwen3:0.6b (test)
- **Parallel Settings**: 4 (baseline), 8 (test)  
- **Test Application**: test-validation (real job posting + resume)
- **Runs per config**: 3 (statistical validity)
- **Total tests**: 2 models × 2 parallel settings × 3 runs = 12 tests

**Quality Validation Process:**
- **Automated Quality Checks**: JSON parsing, score ranges, structural completeness
- **Sample Collection**: 1 complete evaluation per configuration for manual review
- **Manual Qualitative Review**: Persona differentiation, reasoning quality, comparative analysis

### 4. Orchestration Script
Simple bash script to run test matrix and collect results.

## Success Criteria

**✅ Performance Success:**
- **Primary**: qwen3:0.6b @ OLLAMA_NUM_PARALLEL=8 beats phi3:mini baseline by >10%
- **Reliability**: 100% success rate across all test configurations
- **Statistical validity**: Consistent results across 3 runs per configuration

**✅ Quality Success:**
- **Score differentiation**: >2 point range across personas per evaluation
- **Persona-specific reasoning**: Each provides unique, role-relevant insights
- **Output completeness**: No truncated responses or parsing failures

**❌ Failure Conditions:**
- Performance improvement <10% target
- All personas give similar scores (poor differentiation)
- Generic reasoning that could come from any persona
- Truncated responses or structural failures

## Test Environment
- **Test Application**: `test-validation` (real job posting + resume data)
- **Hardware**: Mac Mini M4, 16GB RAM (current production environment)
- **Models**: qwen3:0.6b (522MB), phi3:mini (2.2GB)
- **Real Production Complexity**: 10k+ character prompts, full persona evaluation criteria

## Deliverables

**Technical Implementation:**
1. **Enhanced CLI flags** (`--eval-model`, `--eval-parallel`) with path resolution fixes
2. **Test orchestration script** with automated quality validation
3. **Performance metrics** collection and statistical analysis

**Analysis & Reporting:**
4. **Automated quality report** (JSON parsing, score ranges, structural checks)
5. **Manual qualitative analysis** (persona differentiation, reasoning quality)
6. **Combined performance + quality assessment** with production recommendation

**Review Process:**
- **AI Assistant** conducts manual qualitative review of sample evaluations
- **Comparative analysis** between qwen3:0.6b and phi3:mini output quality
- **Final recommendation** combining performance and quality findings

---
**Expected runtime**: ~15 minutes total test execution (12 tests × ~1.25min average)