# PRD: Vale Resume Style Linting Service

## Overview
Implement an automated prose linting service using Vale to enforce resume style guide standards with deterministic, fast validation that integrates into the local CI/CD pipeline.

## Goals
- ✅ **Deterministic Style Enforcement**: Automated detection of style guide violations
- ✅ **Fast Execution**: <3 seconds validation time for typical resume content
- ✅ **CI/CD Integration**: Seamless integration with Phase 2.5 Local CI/CD pipeline  
- ✅ **Style Guide Coverage**: Address top 6 deterministic patterns from style guide
- ✅ **Developer Experience**: Clear, actionable feedback with specific fixes

## Problem Statement
Resume optimization currently suffers from "whack-a-mole" issues:
- Manual style enforcement is inconsistent and time-consuming
- LLM-driven improvements often break existing good content while fixing other issues
- No systematic way to catch deterministic style violations (voice consistency, word repetition, formatting patterns)

## Solution Architecture

### **Service Structure**
```
data/services/vale-linting/
├── .vale.ini                 # Vale configuration
├── styles/
│   └── Resume/              # Custom resume-specific rules
│       ├── VoiceConsistency.yml
│       ├── BoldHeaderPattern.yml
│       └── CurrencyPrefix.yml
└── test/                    # Rule validation tests
```

### **Vale Rule Implementation**

#### 1. **Word Repetition Detection**
- **Rule**: `retext-repeated-words` plugin
- **Target**: Flag >3 uses of "product," "strategy," "led," "managed," "driven"
- **Output**: Count and locations of overused words

#### 2. **Voice Consistency** (Deterministic Heuristics)
- **Rule**: Custom YAML with narrow regex patterns
- **Target**: Two specific violations that catch 90% of errors
  - (a) No "I " inside bullet lines (`^\s*[-•].*\bI\s`)
  - (b) No leading past-tense verbs in summary (`summary.*^(Led|Built|Achieved|Managed)`)
- **Rationale**: Avoid NLP complexity, focus on deterministic patterns

#### 3. **Sentence Length & Readability**
- **Rule**: `write-good`, `textlint-rule-sentence-length`
- **Target**: Sentences >30 words, passive voice detection
- **Output**: Sentence complexity warnings

#### 4. **Oxford Comma Enforcement**
- **Rule**: `textlint-rule-oxford-comma`
- **Target**: Ensure consistent comma usage in lists
- **Output**: Missing Oxford comma locations

#### 5. **Bold Header Pattern Validation**
- **Rule**: Simple regex in Vale YAML
- **Target**: Detect `**📊 Category**: content` pattern in highlights
- **Pattern**: `^\*\*[^*]+\*\*:\s+` (bold text followed by colon)
- **Implementation**: Pure Vale regex, no JS/Node dependencies

#### 6. **Currency Prefix Standardization**
- **Rule**: Custom regex pattern
- **Target**: "CAD $X.XM" first mention, "$X.XM" subsequent
- **Output**: Currency format violations

### **Integration with Local CI/CD**

#### Modified Pipeline Structure
```bash
scripts/ci/
├── local-pipeline.sh        # Enhanced with Vale step
├── pre-commit.sh           # Fast style check
├── validate-all.sh         # Full validation
└── vale-check.sh          # Vale-specific validation
```

#### Pipeline Integration
```bash
# scripts/ci/local-pipeline.sh (enhanced)
1. Run ESLint → Exit on failure
2. Run Vale linting → Warning level (advisory)  # NEW
3. Run Jest tests → Exit on failure  
4. Run Python tests → Exit on failure
5. Run error validation → Exit on failure
6. Print success summary → Exit 0
```

## Implementation Plan

### **Phase 1: Core Vale Setup** (~30 minutes)
- Install Vale binary (single dependency)
- Create basic `.vale.ini` with warning-level alerts
- Implement 4 standard rules (repetition, sentence length, Oxford comma, passive voice)
- Test against current resume content

### **Phase 2: Custom Rules Development** (~45 minutes)  
- Develop voice consistency YAML rule (narrow regex patterns)
- Implement bold header pattern with pure regex
- Create currency prefix regex rule
- Build test suite for custom rules

### **Phase 3: CI/CD Integration** (~30 minutes)
- Create `vale-check.sh` script
- Integrate into local pipeline
- Configure pre-commit hook integration
- Test with automated commits

### **Phase 4: Documentation & Validation** (~15 minutes)
- Document rule configuration
- Update CLAUDE.md with Vale usage
- Validate against existing resume content
- Confirm <3 second execution time

## Technical Specifications

### **Vale Configuration (.vale.ini)**
```ini
StylesPath = styles
MinAlertLevel = warning
Packages = write-good, retext-repeated-words

[*.{json,md}]
BasedOnStyles = Resume, write-good
```

### **Custom Rule Example (Voice Consistency)**
```yaml
# styles/Resume/VoiceConsistency.yml
extends: existence  
message: "Voice consistency violation detected"
ignorecase: true
level: warning
tokens:
  - '^\s*[-•].*\bI\s'      # No "I " in bullet lines
  - 'summary.*^(Led|Built|Achieved|Managed)'  # No past-tense verbs in summary
```

### **CLI Integration**
```bash
# Direct Vale usage - no wrapper needed
vale data/applications/[company]/inputs/resume.json
# Output: Direct Vale warnings/errors
```

## Success Criteria

### **Functional Requirements**
- ✅ Detects all 6 style guide patterns reliably
- ✅ Executes in <3 seconds on typical resume
- ✅ Integrates smoothly with local CI/CD pipeline
- ✅ Provides actionable feedback with line numbers
- ✅ Zero false positives on good content

### **Integration Requirements**
- ✅ Works with both manual and automated commits  
- ✅ Clear exit codes for CI/CD pipeline
- ✅ JSON output for programmatic consumption
- ✅ Non-interactive execution
- ✅ Graceful handling of edge cases

### **Quality Gates**
- ✅ All existing style guide examples pass validation
- ✅ No regression in resume content quality
- ✅ Compatible with existing keyword analysis service
- ✅ Maintains fast iteration cycles

## Risk Mitigation

### **Implementation Risks**
- **False Positives**: Start with warning-level alerts, flip to error only after <2% false positive rate proven
- **Performance Issues**: Single binary keeps execution <1s on small docs
- **Rule Complexity**: Focus on narrow regex patterns that catch 90% of violations

### **Integration Risks**  
- **CI/CD Disruption**: Advisory warnings prevent pipeline failures during initial rollout
- **Vale Rage-Quit**: Warning-level alerts maintain dev velocity while proving accuracy
- **Dependencies**: Single Vale binary eliminates npm/Node cold-start overhead

## Deliverables

1. **Vale Service** (`data/services/vale-linting/`)
2. **Custom Style Rules** (6 deterministic patterns from style guide)
3. **CI/CD Integration** (Enhanced local pipeline)
4. **Documentation** (Usage guide, rule explanations)
5. **Test Suite** (Validation for all rules)

## Timeline
- **Phase 1**: Core setup (~45 minutes)
- **Phase 2**: Custom rules (~60 minutes)  
- **Phase 3**: CI/CD integration (~30 minutes)
- **Phase 4**: Documentation (~15 minutes)
- **Total**: ~2 hours

## Success Metrics
- ✅ **Execution Speed**: <3 seconds per resume validation
- ✅ **Style Coverage**: 6/6 deterministic patterns detected
- ✅ **CI/CD Integration**: Seamless pipeline integration
- ✅ **Developer Experience**: Clear, actionable feedback
- ✅ **Quality Improvement**: Reduced manual style checking time

---

**Objective**: Implement fast, deterministic prose linting that catches style guide violations automatically, eliminating "whack-a-mole" manual editing while maintaining content quality.