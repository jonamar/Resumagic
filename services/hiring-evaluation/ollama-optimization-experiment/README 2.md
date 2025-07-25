# Ollama Optimization Experiment: Mac Mini Performance Study

A comprehensive performance study on optimizing Ollama for real-world AI applications, specifically testing multi-persona LLM evaluations on Mac Mini M4 hardware.

## 📊 Key Results Summary

**Primary Finding**: Model selection provides **10x more performance impact** than Ollama configuration optimization for complex, context-heavy applications.

- **Speed Winner**: `phi3:mini` (140s per evaluation, 17% faster than baseline)
- **Quality Winner**: `deepseek-r1:8b` (150s per evaluation, 9.0/10 quality)
- **Surprising Result**: `OLLAMA_NUM_PARALLEL=6` improved performance by only 1.1s, not the expected 110s

## 📖 Full Case Study

👉 **[Read the complete case study](model-test-results/ollama-optimization-case-study.md)** - Comprehensive analysis with methodology, results, and production recommendations.

## 🧪 Experiment Structure

This repository contains two phases of systematic testing:

### Phase 1: Model Selection Benchmark
**Objective**: Identify optimal models from speed vs quality perspective

- **Test Matrix**: 5 models × 3 test candidates = 15 evaluations
- **Duration**: ~4 hours of systematic testing
- **Framework**: [`model-performance-test.js`](model-performance-test.js)
- **Results**: [`model-test-results/`](model-test-results/)
- **Documentation**: [`MODEL-TESTING-README.md`](MODEL-TESTING-README.md)

**Key Output**: Selected 3 optimal models for Phase 2 testing

### Phase 2: Ollama Configuration Optimization  
**Objective**: Test Ollama environment variables for performance optimization

- **Test Matrix**: 5 configurations × 3 models × 2 candidates × 3 runs = 90 evaluations
- **Duration**: ~6 hours with comprehensive monitoring
- **Framework**: [`comprehensive-optimization-test.js`](comprehensive-optimization-test.js)  
- **Results**: [`comprehensive-optimization-results/`](comprehensive-optimization-results/)
- **Documentation**: [`PHASE-2-OPTIMIZATION-README.md`](PHASE-2-OPTIMIZATION-README.md)

**Key Output**: Production-ready configuration recommendations

## 🚀 Production Recommendations

Based on 90+ systematic evaluations, here are the proven optimal settings:

### Recommended Configuration
```bash
# Model Selection (most impactful change)
export EVALUATION_MODEL="phi3:mini"

# Ollama Environment Variables  
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_NUM_THREADS=6

# Start Ollama
ollama serve
```

**Expected Performance**: 
- ~140 seconds per evaluation (17% improvement)
- 8.0/10 quality score (maintained quality)
- 100% reliability (no timeouts or failures)

### Alternative Quality-First Configuration
```bash
export EVALUATION_MODEL="deepseek-r1:8b"  # +7% time for higher quality
# Same Ollama settings as above
```

## 📁 Repository Contents

```
ollama-optimization-experiment/
├── README.md                                    # This file
├── model-performance-test.js                    # Phase 1 test framework
├── comprehensive-optimization-test.js           # Phase 2 test framework  
├── MODEL-TESTING-README.md                      # Phase 1 methodology
├── PHASE-2-OPTIMIZATION-README.md              # Phase 2 methodology
├── model-test-results/                         # Phase 1 results & analysis
│   ├── ollama-optimization-case-study.md      # Complete case study
│   ├── benchmark_results.json                 # Structured results data
│   ├── final_report.md                        # Phase 1 executive summary
│   └── archives/                              # Raw evaluation outputs
└── comprehensive-optimization-results/         # Phase 2 results & analysis
    ├── comprehensive_optimization_results.json # Full test data
    ├── statistical_analysis.md                # Statistical breakdown
    ├── production_recommendations.md          # Deployment guide
    └── detailed-runs/                         # Individual evaluation archives
```

## 🔧 Hardware & Environment

**Test System Specifications**:
- **Hardware**: Mac Mini M4, 16GB unified memory
- **OS**: macOS Darwin 24.5.0  
- **Node.js**: v24.3.0
- **Ollama**: Standard installation with local model storage
- **Usage**: Daily driver (not dedicated server)

**Test Application**: AI hiring evaluation system with 6 concurrent personas processing 10k+ character prompts.

## 📈 Results Overview

### Performance by Configuration

| Configuration | Model | Duration | Quality | Success Rate |
|---------------|-------|----------|---------|--------------|
| **baseline_default** | phi3:mini | 140.7s | 7.5/10 | 100% |
| **parallel_6_personas** | phi3:mini | 139.6s | 8.0/10 | 100% |
| **memory_conservative** | deepseek-r1:8b | 147.3s | 8.7/10 | 100% |
| **aggressive_parallel** | phi3:mini | 139.2s | 8.0/10 | 100% |

### Key Insights for Other Developers

1. **Individual model inference time** is the bottleneck, not request queuing
2. **Model selection** provides 10x more impact than configuration tuning
3. **Conservative parallel settings** (4-6) are safer than aggressive settings (8+)
4. **Mac Mini M4** handles complex LLM workloads surprisingly well
5. **Quality can be maintained** while optimizing for speed

## 🧬 Methodology Highlights

### Statistical Rigor
- **90 total evaluations** for statistical validity
- **Multiple runs per configuration** (3x each)  
- **Quality gates enforced** (score appropriateness, reasoning depth)
- **Comprehensive monitoring** (memory, connections, health)

### Real-World Focus
- **Production application** (not synthetic benchmarks)
- **Complex prompts** (10k+ characters)
- **Quality assessment** (not just speed optimization)
- **Resource constraints** (16GB consumer hardware)

## 🔄 Reproducibility

### Prerequisites
```bash
# Install required dependencies
npm install

# Ensure Ollama is installed and running
ollama --version

# Pull required models
ollama pull dolphin3:latest
ollama pull phi3:mini  
ollama pull deepseek-r1:8b
```

### Running Phase 1 (Model Selection)
```bash
node model-performance-test.js
```

### Running Phase 2 (Configuration Optimization)  
```bash
node comprehensive-optimization-test.js
```

**Note**: Full experiment takes 8-10 hours. Consider running individual tests or reducing the test matrix for quicker validation.

## 🤝 Contributing & Usage

### For Researchers
- All raw data included for reanalysis
- Methodology documented for replication
- Statistical analysis framework provided

### For Developers  
- Production-ready configuration recommendations
- Error handling and monitoring examples
- Real-world performance baseline data

### For Organizations
- Cost/benefit analysis of different optimization approaches
- Quality vs speed trade-off quantification  
- Hardware requirement validation for Mac Mini deployments

## 📊 Data & Transparency

**Full Transparency**: All test results, raw evaluation outputs, and analysis frameworks are included. No cherry-picking - all 90 evaluations documented with success/failure rates, timing variance, and quality metrics.

**Limitations**: Results are specific to Mac Mini M4 hardware and context-heavy LLM applications. See the full case study for detailed limitations and methodological considerations.

## 📄 Citation

If you use this research or methodology, please reference:

```
Ollama Optimization Experiment: Mac Mini Performance Study
https://github.com/[your-repo]/ollama-optimization-experiment
Testing framework and analysis for Ollama performance optimization on consumer hardware
```

## 🔗 Related Links

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Mac Mini M4 Technical Specifications](https://www.apple.com/mac-mini/)
- [Complete Case Study](model-test-results/ollama-optimization-case-study.md)

---

*This experiment package provides everything needed to understand, reproduce, or build upon our Ollama optimization research. Questions welcome via issues or discussions.*