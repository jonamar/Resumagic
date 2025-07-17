# Keyword Analysis Service Setup Guide

## For AI Agents Working with this Codebase

This guide helps AI agents understand and work with the keyword analysis service.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Service
```bash
python kw_rank_modular.py /path/to/application/directory
```

### 3. Run Tests
```bash
python run_tests.py --coverage
```

## Project Structure

```
services/keyword-analysis/
├── kw_rank/                    # Core Python package
│   ├── core/                   # Core analysis modules
│   │   ├── scoring.py          # TF-IDF and keyword scoring
│   │   ├── categorization.py   # Knockout vs skills separation
│   │   ├── clustering.py       # Semantic clustering and aliases
│   │   └── injection.py        # Resume sentence matching
│   └── io/                     # Input/output operations
│       ├── loaders.py          # JSON loading and validation
│       └── exporters.py        # Results export (JSON, markdown)
├── config/
│   └── constants.py            # All configuration constants
├── tests/                      # Comprehensive test suite
│   ├── unit/                   # Unit tests for each module
│   ├── integration/            # End-to-end workflow tests
│   └── fixtures/               # Test data and utilities
└── kw_rank_modular.py         # Main entry point
```

## Key Concepts

### 1. Knockout vs Skills Separation
- **Knockouts**: Binary requirements (degrees, years of experience)
- **Skills**: Gradual scoring opportunities (product management, leadership)

### 2. Semantic Clustering
- Groups similar keywords using sentence transformers
- Only applies to skills, not knockouts
- Assigns aliases to reduce redundancy

### 3. TF-IDF Scoring
- Prioritizes keywords that appear in job postings
- Enhanced with section boosts and role weights
- Compound keyword detection for multi-word terms

### 4. Sentence Matching
- Finds existing resume content that matches keywords
- Uses semantic similarity (not exact matching)
- Provides injection scores for optimization

## Configuration

All configuration is centralized in `config/constants.py`:

```python
from config.constants import DEFAULT_CONFIG

# Adjust clustering threshold
DEFAULT_CONFIG.clustering.similarity_threshold = 0.6

# Change knockout detection confidence
DEFAULT_CONFIG.knockouts.confidence_threshold = 0.7
```

## Input/Output

### Input Format
```
application-name/
├── inputs/
│   ├── resume.json      # Resume data structure
│   └── keywords.json    # Keywords to analyze
└── working/             # Output directory
```

### Output Files
- `keyword_analysis.json` - Detailed analysis with injection data
- `kw_rank_post.json` - Full ranking results
- `top5.json` - Top 5 skills for resume optimization
- `keyword-checklist.md` - Human-readable checklist

## Common Operations

### Adding New Knockout Patterns
```python
# Edit config/constants.py
hard_patterns = [
    r'bachelor\'?s?\s*degree',
    r'your_new_pattern_here'
]
```

### Adjusting Scoring Weights
```python
# Edit config/constants.py
@dataclass
class ScoringWeights:
    tfidf: float = 0.55  # Adjust TF-IDF importance
    section: float = 0.25  # Adjust section boost
    role: float = 0.2    # Adjust role weight
```

### Modifying Clustering Behavior
```python
# Edit config/constants.py
@dataclass
class ClusteringConfig:
    similarity_threshold: float = 0.5  # Lower = more clustering
    distance_threshold: float = 0.5    # AgglomerativeClustering param
```

## Testing Strategy

### Unit Tests
- Test individual functions in isolation
- Mock external dependencies
- Focus on edge cases and error conditions

### Integration Tests
- Test complete workflows end-to-end
- Use real data structures
- Verify output file generation

### Coverage Requirements
- Target 85%+ code coverage
- All core modules must have comprehensive tests
- Critical paths must be fully tested

## Error Handling

The service uses defensive programming:
- All file operations are wrapped in try-catch
- Invalid inputs return `None` with logging
- Validation occurs at module boundaries
- Graceful degradation for missing data

## Performance Considerations

- Sentence transformer models are cached globally
- TF-IDF calculations are vectorized
- Clustering is optimized for typical keyword counts (10-50)
- Large keyword lists (>100) may need threshold adjustments

## AI Agent Guidelines

When modifying this code:

1. **Always run tests** after changes: `python run_tests.py`
2. **Check configuration** before changing algorithms
3. **Validate inputs** - the service handles multiple keyword formats
4. **Preserve backward compatibility** - applications depend on output formats
5. **Document changes** - update docstrings and comments
6. **Test edge cases** - empty inputs, malformed data, etc.

## Common Issues

### Import Errors
- Ensure you're in the correct directory
- Check Python path includes the service root
- Verify all dependencies are installed

### Model Loading Failures
- Sentence transformer models require internet for first download
- Models are cached in `~/.cache/torch/sentence_transformers/`
- Offline usage requires pre-downloaded models

### Clustering Issues
- Very similar keywords may not cluster with default threshold
- Adjust `similarity_threshold` in config for more/less clustering
- Empty results may indicate threshold is too high

### Performance Issues
- Large keyword lists (>100) may be slow
- Consider batching or sampling for very large datasets
- Increase timeouts for model loading on slow connections

## Dependencies

**Core Analysis:**
- `numpy` - Numerical operations
- `scikit-learn` - TF-IDF, clustering algorithms
- `sentence-transformers` - Semantic similarity models

**Development:**
- `pytest` - Testing framework
- `pytest-cov` - Coverage reporting
- `pytest-mock` - Mocking utilities

**Runtime:**
- Python 3.8+ required
- ~2GB RAM for sentence transformer models
- Internet connection for first model download