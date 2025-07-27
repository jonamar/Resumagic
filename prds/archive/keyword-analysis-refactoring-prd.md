# Keyword Analysis Tool Refactoring PRD

## Overview

This PRD outlines a comprehensive refactoring plan for the keyword analysis tool (`kw_rank.py`) to improve code maintainability, testability, and extensibility. The current 1,248-line monolithic file needs to be restructured into a modular architecture with proper configuration management and separation of concerns.

## Problem Statement

### Current Issues
1. **Monolithic Architecture**: Single 1,248-line file mixing multiple concerns
2. **Magic Numbers**: Hard-coded values scattered throughout the codebase
3. **Poor Testability**: Large functions with multiple responsibilities
4. **Configuration Management**: Constants scattered with no centralized configuration
5. **Maintenance Burden**: Difficult to modify, extend, or debug specific features

### Business Impact
- **Developer Velocity**: Hard to onboard new developers or make changes
- **Feature Development**: Difficult to add new scoring algorithms or clustering methods
- **Bug Fixes**: Complex debugging due to mixed concerns
- **Scalability**: Cannot easily adapt to different job markets or keyword types

## Solution Overview

Transform the monolithic keyword analysis tool into a modular, maintainable architecture with clear separation of concerns, centralized configuration, and improved testability.

## Success Metrics

### Technical Metrics
- **Code Maintainability**: Reduce cyclomatic complexity by 40%
- **Test Coverage**: Achieve 85%+ unit test coverage
- **Module Coupling**: Each module should have <5 dependencies
- **Configuration Flexibility**: 100% of magic numbers moved to configuration

### Business Metrics
- **Developer Onboarding**: New developers can contribute within 1 day
- **Feature Velocity**: New features can be added 50% faster
- **Bug Resolution**: Bug fixes take 60% less time
- **System Reliability**: Zero regressions during refactoring

## Implementation Plan

### Phase 1: Constants & Configuration Management
**Timeline**: 2-3 days  
**Priority**: High  
**Risk**: Low  

#### Deliverables
1. **Configuration Module** (`config/constants.py`)
   - Extract all magic numbers into typed configuration classes
   - Implement dataclasses for different configuration domains
   - Add configuration validation and defaults

2. **Configuration Structure**
   ```python
   @dataclass
   class ScoringConfig:
       tfidf_weight: float = 0.55
       section_weight: float = 0.25
       role_weight: float = 0.2
       buzzword_penalty: float = 0.7

   @dataclass
   class ClusteringConfig:
       similarity_threshold: float = 0.5
       median_multiplier: float = 1.2
       min_keywords: int = 10

   @dataclass
   class KnockoutConfig:
       max_knockouts: int = 5
       confidence_threshold: float = 0.6
       hard_pattern_weight: float = 0.6
       medium_pattern_weight: float = 0.3
       years_high_role_weight: float = 0.4
       degree_high_role_weight: float = 0.4
       required_language_weight: float = 0.2
   ```

3. **Pattern Management**
   - Move all regex patterns to configuration
   - Organize patterns by domain (knockout, section, executive)
   - Add pattern validation and compilation

#### Success Criteria
- [ ] Zero magic numbers in main code
- [ ] All constants centralized in configuration module
- [ ] Configuration classes have proper type hints
- [ ] All tests pass after refactoring

### Phase 2: Function Decomposition
**Timeline**: 3-4 days  
**Priority**: High  
**Risk**: Medium  

#### Deliverables
1. **Break Down Large Functions**
   - `rank_keywords()` → `score_keywords()` + `categorize_keywords()`
   - `find_injection_points()` → `extract_resume_content()` + `compute_similarities()` + `classify_matches()`
   - `main()` → Extract pipeline steps into separate orchestration functions

2. **Single Responsibility Principle**
   - Each function should have one clear purpose
   - Functions should be <50 lines
   - Clear input/output contracts

3. **Improved Error Handling**
   - Replace print statements with proper logging
   - Consistent error handling patterns
   - Graceful error recovery

#### Success Criteria
- [ ] No function >75 lines
- [ ] Each function has single responsibility
- [ ] All functions have proper docstrings
- [ ] Error handling is consistent across all functions

### Phase 3: Core Modularization
**Timeline**: 5-6 days  
**Priority**: Medium  
**Risk**: High  

#### Deliverables
1. **Module Structure**
   ```
   kw_rank/
   ├── __init__.py
   ├── core/
   │   ├── __init__.py
   │   ├── scoring.py          # TF-IDF, role scoring, boosting
   │   ├── categorization.py   # Knockout detection, classification
   │   ├── clustering.py       # Alias clustering, similarity
   │   └── injection.py        # Sentence matching, injection points
   ├── config/
   │   ├── __init__.py
   │   └── constants.py        # All constants and patterns
   ├── io/
   │   ├── __init__.py
   │   ├── loaders.py          # File loading functions
   │   └── exporters.py        # Output file generation
   └── main.py                 # Main orchestration
   ```

2. **Core Modules**
   - **scoring.py**: TF-IDF calculation, role-based scoring, compound boosting
   - **categorization.py**: Knockout detection, keyword classification
   - **clustering.py**: Semantic clustering, alias generation
   - **injection.py**: Resume parsing, sentence matching, injection point detection

3. **I/O Modules**
   - **loaders.py**: JSON/markdown file loading with validation
   - **exporters.py**: Analysis file generation, checklist creation

#### Success Criteria
- [ ] Each module has <300 lines
- [ ] Clear interfaces between modules
- [ ] All modules have comprehensive unit tests
- [ ] No circular dependencies

### Phase 4: Testing & Documentation
**Timeline**: 2-3 days  
**Priority**: Medium  
**Risk**: Low  

#### Deliverables
1. **Comprehensive Test Suite**
   - Unit tests for all modules (85%+ coverage)
   - Integration tests for end-to-end workflows
   - Property-based testing for scoring algorithms
   - Mock-based testing for I/O operations

2. **Documentation**
   - API documentation for all modules
   - Architecture decision records (ADRs)
   - Developer setup and contribution guide
   - Performance benchmarking results

3. **CI/CD Pipeline**
   - Automated testing on code changes
   - Code quality checks (linting, type checking)
   - Performance regression testing

#### Success Criteria
- [ ] 85%+ test coverage across all modules
- [ ] All public APIs documented
- [ ] CI/CD pipeline passes all checks
- [ ] Performance benchmarks show no regressions

## Technical Specifications

### Configuration Management
```python
# config/constants.py
from dataclasses import dataclass
from typing import Dict, List, Set

@dataclass
class ScoringWeights:
    tfidf: float = 0.55
    section: float = 0.25
    role: float = 0.2

@dataclass
class RoleWeights:
    core: float = 1.2
    important: float = 0.6
    culture: float = 0.3

@dataclass
class BuzzwordConfig:
    penalty: float = 0.7
    executive_penalty: float = 0.8
    executive_boost: float = 1.15
    terms: Set[str] = field(default_factory=lambda: {...})

@dataclass
class KnockoutThresholds:
    confidence_threshold: float = 0.6
    hard_pattern_weight: float = 0.6
    medium_pattern_weight: float = 0.3
    years_high_role_weight: float = 0.4
    degree_high_role_weight: float = 0.4
    required_language_weight: float = 0.2
```

### Core Module Interfaces
```python
# core/scoring.py
def calculate_tfidf_scores(keywords: List[dict], job_text: str) -> Dict[str, float]:
    """Calculate TF-IDF scores for keywords against job posting."""
    pass

def score_keyword(keyword: dict, tfidf_score: float, job_text: str, 
                 config: ScoringConfig) -> float:
    """Calculate final score for a keyword."""
    pass

# core/categorization.py
def categorize_keyword(keyword: dict, score: float, 
                      config: KnockoutConfig) -> str:
    """Categorize keyword as knockout or skill."""
    pass

def detect_knockout_confidence(keyword: str, role_weight: float,
                              config: KnockoutConfig) -> float:
    """Calculate confidence score for knockout classification."""
    pass

# core/clustering.py
def cluster_keywords(keywords: List[dict], 
                    config: ClusteringConfig) -> List[dict]:
    """Cluster similar keywords and generate aliases."""
    pass

def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """Calculate semantic similarity between two texts."""
    pass
```

### Error Handling Strategy
```python
# utils/logging.py
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def safe_load_json(file_path: Path) -> dict:
    """Safely load JSON with proper error handling."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {file_path}: {e}")
        raise

def safe_compute_similarity(text1: str, text2: str) -> Optional[float]:
    """Safely compute similarity with error handling."""
    try:
        return compute_similarity(text1, text2)
    except Exception as e:
        logger.warning(f"Similarity computation failed: {e}")
        return None
```

## Risk Analysis

### High-Risk Areas
1. **Module Boundaries**: Risk of creating tight coupling between modules
2. **Performance**: Risk of performance degradation during refactoring
3. **Backward Compatibility**: Risk of breaking existing workflows

### Mitigation Strategies
1. **Incremental Refactoring**: Implement changes in small, testable chunks
2. **Comprehensive Testing**: Maintain test coverage throughout refactoring
3. **Performance Monitoring**: Benchmark before/after each phase
4. **Feature Flags**: Use feature flags for risky changes

## Success Validation

### Automated Checks
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Performance benchmarks within 5% of baseline
- [ ] Code coverage >85%
- [ ] No linting or type checking errors

### Manual Validation
- [ ] End-to-end workflow produces identical results
- [ ] All CLI commands work as expected
- [ ] Error messages are clear and actionable
- [ ] Code is readable and maintainable

## Rollback Plan

### Phase 1-2 Rollback
- Simple git revert since changes are additive
- No breaking changes to existing functionality

### Phase 3 Rollback
- Maintain original `kw_rank.py` as `kw_rank_legacy.py`
- Implement feature flag to switch between old/new implementations
- Automated testing to ensure behavioral equivalence

## Post-Implementation

### Monitoring
- Track module usage and performance metrics
- Monitor error rates and types
- Measure developer productivity improvements

### Future Enhancements
- Plugin architecture for new scoring algorithms
- Configuration UI for non-technical users
- API endpoints for external integrations
- Machine learning-based keyword scoring

## Timeline Summary

| Phase | Duration | Priority | Risk | Dependencies |
|-------|----------|----------|------|--------------|
| Phase 1: Constants & Config | 2-3 days | High | Low | None |
| Phase 2: Function Decomposition | 3-4 days | High | Medium | Phase 1 |
| Phase 3: Core Modularization | 5-6 days | Medium | High | Phase 2 |
| Phase 4: Testing & Documentation | 2-3 days | Medium | Low | Phase 3 |
| **Total** | **12-16 days** | | | |

## Resource Requirements

### Development Resources
- 1 Senior Developer (lead refactoring)
- 1 Junior Developer (testing support)
- 0.5 Tech Lead (code reviews, architecture decisions)

### Infrastructure
- CI/CD pipeline setup
- Code coverage tooling
- Performance monitoring tools

## Conclusion

This refactoring will transform the keyword analysis tool from a monolithic, hard-to-maintain script into a modern, modular, and extensible system. The phased approach minimizes risk while delivering incremental value. The improved architecture will enable faster feature development, easier debugging, and better long-term maintainability.