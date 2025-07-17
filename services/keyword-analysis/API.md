# Keyword Analysis Service API Documentation

## Overview

The Keyword Analysis Service provides intelligent keyword processing for resume optimization. It categorizes keywords into knockouts and skills, performs semantic clustering, and provides injection analysis.

## Main Entry Point

### `kw_rank_modular.py`

**Usage:**
```bash
python kw_rank_modular.py /path/to/application/directory
```

**Input Requirements:**
- `inputs/resume.json` - Resume data in JSON format
- `inputs/keywords.json` - Keywords list (string array or dict array)

**Output Files:**
- `working/keyword_analysis.json` - Detailed analysis results
- `working/kw_rank_post.json` - Full ranking results
- `working/top5.json` - Top 5 skills for optimization
- `working/keyword-checklist.md` - Human-readable checklist

## Core Modules

### `kw_rank.core.scoring`

**Functions:**
- `calculate_tfidf_scores(documents, keywords)` - Calculate TF-IDF scores
- `score_single_keyword(keyword, resume_data)` - Score individual keyword
- `apply_enhancements(scores, resume_data)` - Apply section/compound boosts

**Example:**
```python
from kw_rank.core.scoring import score_single_keyword

score = score_single_keyword("product management", resume_data)
```

### `kw_rank.core.categorization`

**Functions:**
- `detect_knockout_keywords(keywords)` - Separate knockouts from skills
- `is_years_knockout(keyword)` - Check if keyword is years-based knockout
- `is_traditional_knockout(keyword)` - Check if keyword is traditional knockout
- `categorize_keywords(keywords, scores)` - Full categorization with scores

**Example:**
```python
from kw_rank.core.categorization import detect_knockout_keywords

knockouts, skills = detect_knockout_keywords(keyword_list)
```

### `kw_rank.core.clustering`

**Functions:**
- `cluster_keywords(keywords)` - Perform semantic clustering
- `compute_similarity_matrix(keywords)` - Calculate similarity matrix
- `assign_aliases(clusters, keywords, scores)` - Assign aliases to keywords

**Example:**
```python
from kw_rank.core.clustering import cluster_keywords

clusters = cluster_keywords(skills_list)
```

### `kw_rank.core.injection`

**Functions:**
- `process_keyword_injection(keywords, resume_data)` - Analyze keyword injection
- `find_sentence_matches(keyword, sentences)` - Find semantic matches
- `calculate_injection_score(matches)` - Calculate injection score

**Example:**
```python
from kw_rank.core.injection import process_keyword_injection

injection_results = process_keyword_injection(keywords, resume_data)
```

## I/O Modules

### `kw_rank.io.loaders`

**Functions:**
- `load_resume_data(file_path)` - Load and validate resume JSON
- `load_keywords(file_path)` - Load and validate keywords JSON
- `safe_load_json(file_path)` - Safe JSON loading with error handling

**Example:**
```python
from kw_rank.io.loaders import load_resume_data, load_keywords

resume_data = load_resume_data("inputs/resume.json")
keywords = load_keywords("inputs/keywords.json")
```

### `kw_rank.io.exporters`

**Functions:**
- `export_all_results(categorized_data, output_dir)` - Export all output files
- `save_json_results(data, file_path)` - Save JSON results
- `save_keyword_checklist(data, file_path)` - Save markdown checklist

**Example:**
```python
from kw_rank.io.exporters import export_all_results

success = export_all_results(results, "working/")
```

## Configuration

### `config.constants`

**Classes:**
- `ScoringWeights` - TF-IDF, section, role weights
- `ClusteringConfig` - Clustering thresholds and parameters
- `KnockoutConfig` - Knockout detection patterns
- `InjectionConfig` - Sentence matching configuration
- `OutputConfig` - Output formatting settings

**Example:**
```python
from config.constants import DEFAULT_CONFIG

config = DEFAULT_CONFIG
clustering_threshold = config.clustering.similarity_threshold
```

## Data Structures

### Resume Data Format
```json
{
  "personal": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "experiences": [
    {
      "title": "Product Manager",
      "company": "TechCorp",
      "description": "Led product initiatives..."
    }
  ],
  "skills": ["Product Management", "Leadership"],
  "education": [
    {
      "degree": "MBA",
      "school": "University"
    }
  ]
}
```

### Keywords Format
```json
[
  "product management",
  "team leadership",
  "5+ years experience"
]
```

Or dictionary format:
```json
[
  {"kw": "product management"},
  {"text": "team leadership"}
]
```

### Output Format
```json
{
  "knockouts": [
    {
      "keyword": "MBA required",
      "score": 0.85,
      "aliases": []
    }
  ],
  "skills": [
    {
      "keyword": "product management",
      "score": 0.95,
      "aliases": ["product strategy", "product planning"]
    }
  ]
}
```

## Error Handling

All functions return `None` or appropriate error indicators on failure. Check return values before proceeding:

```python
resume_data = load_resume_data("resume.json")
if resume_data is None:
    print("Failed to load resume data")
    return
```

## Testing

Run tests with:
```bash
python run_tests.py --coverage
```

Or individual test suites:
```bash
python -m pytest tests/unit/
python -m pytest tests/integration/
```

## Dependencies

**Core:**
- `numpy` - Numerical operations
- `scikit-learn` - TF-IDF and clustering
- `sentence-transformers` - Semantic similarity

**Development:**
- `pytest` - Testing framework
- `pytest-cov` - Coverage reporting
- `pytest-mock` - Mocking utilities