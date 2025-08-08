# Statistical Analysis: Ollama Optimization Results

**Test Completed**: 2025-07-21T19:35:26.050Z
**Total Evaluations**: 90

## Performance Summary by Configuration

| Configuration | Model | Mean Duration (s) | Std Dev | Quality Score | Success Rate |
|---------------|-------|------------------|---------|---------------|--------------|
| baseline_default | dolphin3:latest | 169.4 | ±11.4 | 9.0/10 | 100% |
| baseline_default | phi3:mini | 140.7 | ±6.8 | 7.5/10 | 100% |
| baseline_default | deepseek-r1:8b | 154.8 | ±3.6 | 9.0/10 | 100% |
| parallel_6_personas | dolphin3:latest | 172.7 | ±11.3 | 9.3/10 | 100% |
| parallel_6_personas | phi3:mini | 139.6 | ±4.6 | 8.0/10 | 100% |
| parallel_6_personas | deepseek-r1:8b | 154.1 | ±4.6 | 9.0/10 | 100% |
| parallel_threads_optimized | dolphin3:latest | 166.7 | ±12.7 | 9.3/10 | 100% |
| parallel_threads_optimized | phi3:mini | 139.7 | ±4.0 | 7.0/10 | 100% |
| parallel_threads_optimized | deepseek-r1:8b | 150.6 | ±8.5 | 8.8/10 | 100% |
| memory_conservative | dolphin3:latest | 175.6 | ±8.4 | 10.0/10 | 100% |
| memory_conservative | phi3:mini | 140.3 | ±3.5 | 7.0/10 | 100% |
| memory_conservative | deepseek-r1:8b | 147.3 | ±8.2 | 8.7/10 | 100% |
| aggressive_parallel | dolphin3:latest | 171.9 | ±7.7 | 9.7/10 | 100% |
| aggressive_parallel | phi3:mini | 139.2 | ±4.9 | 8.0/10 | 100% |
| aggressive_parallel | deepseek-r1:8b | 154.1 | ±8.4 | 8.5/10 | 100% |
