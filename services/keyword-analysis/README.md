# Keyword Analysis Service

A Python microservice for analyzing job postings and ranking keywords for optimal resume targeting using TF-IDF scoring and intelligent categorization.

## Overview

This service takes job postings and keyword lists as input and produces:
- **Knockout Requirements**: Critical qualifications that must be addressed
- **Top Skills**: Highest-priority skills to emphasize  
- **Semantic Clustering**: Groups related keywords with aliases
- **Resume Injection Points**: Optimal placement suggestions (when resume provided)

## Architecture

```
keyword-analysis/
├── kw_rank/                 # Modular Python package
│   ├── core/                # Core analysis modules
│   │   ├── scoring.py       # TF-IDF, role scoring, section boosts
│   │   ├── categorization.py # Knockout detection, classification
│   │   ├── clustering.py    # Semantic clustering, alias generation
│   │   └── injection.py     # Resume parsing, sentence matching
│   ├── io/                  # Input/Output modules
│   │   ├── loaders.py       # File loading with validation
│   │   └── exporters.py     # Output file generation
│   └── main.py              # Main orchestration
├── config/                  # Configuration management
│   └── constants.py         # All constants and patterns
├── kw_rank.py              # Legacy entry point (monolithic)
├── kw_rank_modular.py      # Modern entry point (modular)
└── requirements.txt        # Python dependencies
```

## Installation

```bash
# Navigate to service directory
cd services/keyword-analysis

# Install dependencies
pip install -r requirements.txt
```

## Usage

### Command Line Interface

```bash
# Basic usage (legacy script)
python kw_rank.py keywords.json job-posting.md

# Modular version (recommended)
python kw_rank_modular.py keywords.json job-posting.md --top 5

# With resume injection points
python kw_rank_modular.py keywords.json job-posting.md --resume resume.json

# Options
--top N              # Number of top skills to output (default: 5)
--cluster-thresh X   # Clustering threshold (default: 0.5)
--drop-buzz         # Drop buzzwords instead of penalizing
--summary           # Show detailed summary
```

### Integration from Node.js App

```javascript
// From main app directory
const { exec } = require('child_process');

const keywordAnalysisCommand = `python services/keyword-analysis/kw_rank_modular.py ${keywordsFile} ${jobFile} --top 5`;

exec(keywordAnalysisCommand, (error, stdout, stderr) => {
    if (error) {
        console.error('Keyword analysis failed:', error);
        return;
    }
    console.log('Keyword analysis complete:', stdout);
});
```

## Input Formats

### Keywords JSON
```json
[
  {"kw": "Director of Product", "role": "core"},
  {"kw": "8+ years of product management", "role": "core"},
  {"kw": "B2B SaaS experience", "role": "important"}
]
```

### Job Posting
- Markdown file with job posting content
- Plain text also supported

### Resume JSON (Optional)
- Standard JSON Resume format
- Used for injection point analysis

## Output Files

### keyword_analysis.json
Structured analysis data with scores and categorization.

### keyword-checklist.md  
Human-readable checklist for resume optimization.

## Configuration

All configuration is centralized in `config/constants.py`:
- **Scoring weights**: TF-IDF, section, role weights
- **Knockout patterns**: Detection rules and thresholds  
- **Clustering settings**: Similarity thresholds
- **Buzzword lists**: Terms to penalize or boost

## Key Features

1. **Intelligent Categorization**: Separates knockout requirements from skills
2. **Semantic Clustering**: Groups related keywords with aliases
3. **TF-IDF Scoring**: Prioritizes keywords that appear in job posting
4. **Resume Integration**: Finds optimal injection points in existing resume
5. **Configurable**: All thresholds and patterns easily adjustable

## Technology Stack

- **Python 3.8+**
- **scikit-learn**: TF-IDF vectorization and clustering
- **sentence-transformers**: Semantic similarity calculations  
- **numpy**: Numerical computations

## Development

```bash
# Run tests (when available)
pytest

# Code formatting
black .

# Linting  
flake8 .
```

## Integration with Main App

This service is called by the main Node.js application for keyword analysis functionality. The clean separation allows:

- **Independent Development**: Python service can evolve separately
- **Technology Focus**: Each service uses appropriate technology stack
- **Clear Boundaries**: Easy to understand and maintain
- **Scalability**: Can be deployed as separate microservice if needed