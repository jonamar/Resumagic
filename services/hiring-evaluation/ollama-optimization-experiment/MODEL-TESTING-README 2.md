# Model Performance Testing Experiment

## Intent & Objectives

This experiment systematically tests different LLM models for the hiring evaluation service to optimize the balance between **speed** and **quality**.

### Current Problem
- **Baseline**: `dolphin3:latest` produces excellent quality but takes ~35s per persona (3.5min total for 6 personas)
- **Target**: Sub-60s total evaluation time while maintaining evaluation quality

### Experiment Design

We're testing **5 candidate models** across **2 performance tiers** against **3 test candidates** (weak/average/strong) to identify optimal model choices.

#### Test Models
**Quality Tier (8B)** - Potential dolphin replacements:
- `deepseek-r1:8b` - Latest reasoning model, strong analytical capabilities
- `qwen3:8b` - Well-balanced performance, good instruction following

**Speed Tier (3-4B)** - Fast evaluation candidates:
- `gemma3:4b` - Google's efficient model, good reasoning
- `phi3:mini` - Microsoft's compact model, optimized for speed
- `qwen3:4b` - Smaller version of qwen3, speed/quality balance

#### Test Candidates
1. **Alex Johnson** (Weak) - 1-2yr exp, should score 3-6
2. **Morgan Davis** (Average) - 4-5yr exp, should score 5-7  
3. **Dr. Sarah Chen** (Strong) - 12yr exp, should score 7-9

### Success Metrics

**Speed**: Total evaluation time (6 personas parallel)
- Target: <60s (current: ~210s)
- Acceptable: <90s

**Quality**: Evaluation discrimination and feedback richness
- **Score Appropriateness**: Weak/Average/Strong candidates get expected score ranges
- **Score Variance**: Good discrimination between personas (σ > 0.5)
- **Feedback Depth**: Specific, actionable reasoning (>50 chars per criterion)

### Expected Outcomes

**Two-tier recommendation system**:
1. **Quality Winner** - Best 8B model to replace dolphin3:latest for detailed reviews
2. **Speed Winner** - Best 3-4B model for `--fast` mode quick screenings

### Implementation Strategy

**Phase 1**: Comprehensive benchmark (this experiment)
- Test all 5 models × 3 candidates = 15 evaluations
- Archive full results for quality analysis
- Generate speed/quality comparison report

**Phase 2**: Winner integration
- Implement winning models as options
- Add model switching logic to evaluation runner
- Update CLI flags (`--fast` uses speed winner)

**Phase 3**: Production optimization
- Fine-tune prompts for winning models if needed
- Implement model-specific optimizations
- Clean up experimental code

### Data Collection

All results stored in `model-test-results/`:
- `benchmark_results.json` - Structured performance data
- `final_report.md` - Executive summary with recommendations
- `archives/` - Full evaluation outputs for quality verification

This systematic approach ensures we make data-driven decisions about model selection while maintaining the high evaluation quality users expect.

## Current Test Status & Data Collection

### Methodology Principles
**Data Accuracy Over Speed**: Following rigorous data science methodology with meticulous testing approach. Quality data collection prioritized over rapid completion to ensure statistically valid results.

### Live Test Matrix Progress
✅ **dolphin3:latest** (baseline):
- Alex Johnson (weak): 4.70 avg, 156.5s, Quality: 10/10
- Morgan Davis (average): 6.50 avg, 164.9s, Quality: 10/10  
- Dr. Sarah Chen (strong): 8.25 avg, 185.5s, Quality: 10/10

✅ **deepseek-r1:8b** (quality tier):
- Alex Johnson (weak): 3.50 avg, 154.7s, Quality: 10/10
- Morgan Davis (average): 6.92 avg, 147.4s, Quality: 10/10
- 🔄 Dr. Sarah Chen (strong): *in progress*

⏳ **Remaining tests**: qwen3:8b (3 candidates), gemma3:4b (3 candidates), phi3:mini (3 candidates), qwen3:4b (3 candidates)

### Results Storage Architecture
- **Live tracking**: `full_benchmark.log` - Real-time progress monitoring
- **Raw archives**: `model-test-results/archives/` - Complete evaluation outputs for quality verification
- **Structured data**: `model-test-results/benchmark_results.json` - Performance metrics and analysis
- **Executive summary**: `model-test-results/final_report.md` - Recommendations and conclusions

### Key Observations So Far
1. **Score Calibration Working**: Models correctly discriminating between weak (3.5-4.7), average (6.5-6.9), and strong (8.25) candidates
2. **Speed Consistency**: All models performing within 147-185s range per evaluation  
3. **Quality Maintained**: 10/10 quality scores across all completed tests
4. **deepseek-r1 Advantage**: Showing appropriate scoring with slightly faster completion times

### Data Quality Assurance
- **Score Appropriateness**: ✅ All tests showing expected score ranges for candidate levels
- **Variance Tracking**: Good discrimination between personas (detailed in archived results)
- **Feedback Depth**: Rich, actionable reasoning captured in all evaluations
- **Error Handling**: No failures detected, all models completing successfully

This comprehensive data collection ensures our final model recommendations will be based on robust, statistically valid performance comparisons across the complete test matrix.