# Keyword Ranking System V2 - Lean MVP Fixes PRD

## 1. Purpose / Problem Statement

The current keyword ranking system has **3 critical bugs** preventing effective keyword prioritization:
- **Section Detection Failure**: All keywords receive section score 1.0, ignoring actual posting structure
- **Experience Keyword Mishandling**: "7+ years in product management" gets clustered as alias instead of primary term
- **Missing Job Title Extraction**: Actual role titles like "Director of Product" absent from output

**Root Cause**: The section detection regex isn't matching real job posting formats, causing the algorithm to treat all keywords as equally important.

## 2. MVP Objectives (Lean Scope)

1. **Fix Section Detection**: Properly identify and boost requirements vs. company info sections
2. **Enhance Experience Keyword Handling**: Prioritize exact experience requirements as canonical terms  
3. **Add Job Title Extraction**: Identify and boost exact role titles from posting headers

**Success Criteria**: If these 3 fixes don't dramatically improve ranking quality, the algorithm approach needs rethinking before adding more complexity.

## 3. Key Decisions (MVP Scope Only)

| Topic | Current State | V2 MVP Decision |
|-------|---------------|-------------|
| Section Weights | Requirements: 0.8, Company: 0.3 | Requirements: 1.0, Company: 0.3 |
| Experience Keywords | Gets aliased | Regex-based canonical term promotion |
| Job Title Extraction | Missing | Extract from header and boost 1.2x |
| Architecture | Monolithic scoring | Single enhancement point for future scaling |

## 4. Technical Implementation (MVP - 2-3 hours total)

### Core Fix 1: Section Detection Repair
**File**: `kw_rank.py:130-155`
**Issue**: All keywords showing section score 1.0 due to faulty regex matching

```python
def calculate_section_boost(job_text, keyword):
    """Fix section boost with proper line-by-line analysis"""
    boost_score = 0.0
    lines = job_text.split('\n')
    current_section = 'company'  # default
    
    for line in lines:
        line = line.strip().lower()
        
        # Detect section headers (improved patterns)
        if re.search(r'(requirements|qualifications|what you.ll need|what we.re looking for)', line):
            current_section = 'requirements'
        elif re.search(r'(responsibilities|what you.ll do|role|opportunity)', line):
            current_section = 'responsibilities'
        elif re.search(r'(about|why join|benefits|culture|perks)', line):
            current_section = 'company'
        
        # Check if keyword appears in this line
        if keyword.lower() in line:
            boost_score = max(boost_score, SECTION_BOOSTS[current_section])
    
    return boost_score
```

### Core Fix 2: Job Title Extraction
**File**: `kw_rank.py` (new function)

```python
def extract_job_title_keywords(job_text):
    """Extract job title from posting header"""
    lines = job_text.split('\n')[:5]  # First 5 lines
    
    title_patterns = [
        r'(director|vp|vice president|head of|lead|manager|senior|principal)\s+.*?(product|engineering|growth)',
        r'(product|engineering|growth)\s+.*?(director|vp|vice president|head of|lead|manager)'
    ]
    
    for line in lines:
        for pattern in title_patterns:
            match = re.search(pattern, line.lower())
            if match:
                return match.group(0).strip()
    
    return None
```

### Core Fix 3: Experience Keyword Priority
**File**: `kw_rank.py:162-207` (modify cluster_aliases function)

```python
def prioritize_experience_keywords(keywords):
    """Ensure experience requirements become canonical terms"""
    experience_patterns = [
        r'\d+\+?\s*years?\s+in\s+',
        r'\d+\+?\s*years?\s+of\s+',
        r'\d+\+?\s*years?\s+experience'
    ]
    
    for kw in keywords:
        is_experience = any(re.search(pattern, kw['kw'].lower()) for pattern in experience_patterns)
        if is_experience:
            kw['experience_priority'] = True  # Flag for canonical selection
    
    return keywords
```

### Architecture Enhancement: Single Enhancement Point
**File**: `kw_rank.py:285-297` (modify final score calculation)

```python
# Create single enhancement point for future scaling
def apply_enhancements(base_score, keyword_text, keyword_data):
    """Single point for all future enhancements"""
    enhanced_score = base_score
    
    # MVP: Only job title boost
    if keyword_data.get('is_job_title', False):
        enhanced_score *= 1.2
    
    # Future enhancements will be added here
    return enhanced_score

# In main scoring function:
final_score = apply_enhancements(base_score, kw_text, keyword_metadata)
```

## 5. Success Metrics & Testing Strategy (MVP)

### 5.1 MVP Success Criteria (NiceJob Test Case)
1. **Section Detection**: < 20% of keywords show section score 1.0 (current: 100%)
2. **Experience Keyword Priority**: "7+ years in product management" in top 10 (current: aliased)
3. **Job Title Extraction**: "Director of Product" appears in output if present in posting
4. **Runtime Performance**: < 3 seconds for 50+ keywords (maintain current performance)

### 5.2 MVP Validation Approach
- **Manual Review**: Top 10 keywords should be obviously more relevant than current output
- **Regression Test**: Run on NiceJob case before/after to ensure no functionality lost
- **PM Checkpoint**: Single review after all 3 fixes implemented

### 5.3 Go/No-Go Decision Point
**After MVP implementation, evaluate:**
- Does the ranking quality improve significantly?
- Are the 3 core issues resolved?
- Is the algorithm approach fundamentally sound?

**If YES → proceed to Future Enhancements**
**If NO → reconsider algorithm approach entirely**

## 6. Implementation Timeline (Lean)

**Total Estimated Effort**: 2-3 hours in single development session

| Hour | Task | Validation |
|------|------|------------|
| 1 | Fix section detection regex | Test on NiceJob posting |
| 2 | Add job title extraction + experience priority | Verify top 10 keywords |
| 3 | Integration testing + PM review | Go/no-go decision |

## 7. Development Best Practices (MVP)

### 7.1 Lean Development Approach
- **Single Commit**: All 3 fixes in one commit with comprehensive tests
- **Fail-Safe Architecture**: Enhancement function gracefully handles failures
- **Manual Validation**: Visual inspection of top 10 keywords pre/post changes
- **Performance Monitoring**: Ensure runtime doesn't degrade

### 7.2 Risk Mitigation
- **Fallback Strategy**: If section detection fails, maintain current behavior
- **Regression Testing**: Run existing functionality tests before committing
- **Configuration**: Make new constants easily tunable

## 8. MVP Success Criteria Checklist

### 8.1 Must-Have Outcomes
- [ ] Section detection working correctly (< 20% false positives)
- [ ] Job title extraction functional
- [ ] Experience keywords prioritized correctly
- [ ] Runtime remains < 3 seconds
- [ ] All existing functionality preserved

### 8.2 Nice-to-Have Outcomes
- [ ] Obvious quality improvement in top 10 keywords
- [ ] "Director of Product" appears in output
- [ ] "7+ years in product management" in top 10

---

# Future Enhancements (Post-MVP)

*The following enhancements should only be considered after MVP validation proves the core algorithm approach is sound.*

## Executive Product Role Sophistication

### 1. Executive-Aware Buzzword Filtering

**Problem**: Terms like "strategy", "roadmap", "vision" are core executive competencies, not buzzwords.

**Solution**: Role-aware vocabulary classification:

```python
# Executive vocabulary classification
EXECUTIVE_CORE_TERMS = {
    'strategy', 'vision', 'roadmap', 'stakeholder alignment', 'portfolio management',
    'go-to-market', 'product-market fit', 'north star', 'okrs', 'kpis'
}

IC_BUZZWORDS = {
    'agile', 'sprint', 'backlog', 'user stories', 'daily standups', 'scrum',
    'kanban', 'retrospective', 'story points'
}

def calculate_role_aware_multiplier(keyword_text, target_role_level='executive'):
    """Apply role-aware buzzword filtering"""
    if target_role_level == 'executive':
        if any(term in keyword_text.lower() for term in EXECUTIVE_CORE_TERMS):
            return 1.3  # Boost executive terms
        elif any(term in keyword_text.lower() for term in IC_BUZZWORDS):
            return 0.7  # Penalize IC terms
    return 1.0
```

### 2. Compound Keyword Prioritization

**Problem**: "product strategy" should outrank "strategy" by significant margin.

**Solution**: Compound specificity multipliers:

```python
def calculate_compound_boost(keyword_text):
    """Boost compound keywords over solo terms"""
    word_count = len(keyword_text.split())
    
    if word_count == 1:
        return 1.0  # No boost for solo terms
    elif word_count == 2:
        return 1.3  # "product strategy", "B2B SaaS"
    elif word_count >= 3:
        return 1.5  # "7+ years in product management"
    
    # Executive-specific compounds get additional boost
    exec_compounds = {
        'product strategy', 'go-to-market', 'product-market fit',
        'revenue expansion', 'customer-driven growth', 'vertical saas',
        'stakeholder alignment', 'cross-functional leadership'
    }
    
    if keyword_text.lower() in exec_compounds:
        return 1.6
    
    return 1.0
```

### 3. Technical Sophistication Scoring

**Problem**: Need to distinguish between basic and advanced technical vocabulary.

**Solution**: Technical depth classification:

```python
def calculate_technical_sophistication_boost(keyword_text):
    """Boost based on technical sophistication level"""
    keyword_lower = keyword_text.lower()
    
    # Platform/Architecture (1.4x)
    platform_terms = {'b2b saas', 'vertical saas', 'multi-tenant', 'api strategy'}
    
    # Business Model (1.3x)
    business_model_terms = {'plg', 'product-led growth', 'arr', 'expansion revenue'}
    
    # Strategic Frameworks (1.2x)
    framework_terms = {'jobs-to-be-done', 'okrs', 'north star metrics'}
    
    # Advanced Tools (1.1x)
    advanced_tools = {'mixpanel', 'amplitude', 'looker', 'tableau'}
    
    if any(term in keyword_lower for term in platform_terms):
        return 1.4
    elif any(term in keyword_lower for term in business_model_terms):
        return 1.3
    elif any(term in keyword_lower for term in framework_terms):
        return 1.2
    elif any(term in keyword_lower for term in advanced_tools):
        return 1.1
    
    return 1.0
```

### 4. Negation Detection & Context Enhancement

**Problem**: Keywords appearing with "not required" or "nice to have" should be deprioritized.

**Solution**: Context-aware requirement analysis:

```python
def detect_requirement_context(job_text, keyword):
    """Detect if keyword appears with negation or preference language"""
    sentences = re.split(r'[.!?]+', job_text.lower())
    
    for sentence in sentences:
        if keyword.lower() in sentence:
            # Soft requirements
            if re.search(r'(not required|nice to have|preferred but not|bonus if)', sentence):
                return 0.8
            
            # Hard requirements
            if re.search(r'(must have|required|essential|mandatory|minimum)', sentence):
                return 1.2
    
    return 1.0
```

## Advanced Features for Future Consideration

### 5. Dynamic Buzzword Detection
- Context-aware buzzword identification based on frequency analysis
- Industry-specific buzzword lists
- Temporal buzzword tracking (what's trending vs. outdated)

### 6. Semantic Keyword Clustering
- Use embeddings to identify related terms beyond string matching
- Cluster similar competencies ("product management" + "product strategy")
- Identify domain-specific synonyms

### 7. ATS System Optimization
- Research specific ATS platforms and their keyword matching algorithms
- Optimize for different ATS parsing behaviors
- Add industry-specific keyword patterns

### 8. Machine Learning Enhancement
- Train on successful resume-job matching pairs
- Learn keyword importance patterns from hiring outcomes
- Personalize keyword ranking based on candidate background

## Implementation Strategy for Future Enhancements

### Phase-Based Approach
1. **Phase 1**: Executive vocabulary + compound keyword boost (3-4 hours)
2. **Phase 2**: Technical sophistication scoring (2-3 hours)
3. **Phase 3**: Context enhancement + negation detection (2-3 hours)
4. **Phase 4**: Advanced features (research phase)

### Integration Architecture
All enhancements integrate through the single `apply_enhancements()` function:

```python
def apply_enhancements(base_score, keyword_text, keyword_data):
    """Single point for all enhancements"""
    enhanced_score = base_score
    
    # MVP: Job title boost
    if keyword_data.get('is_job_title', False):
        enhanced_score *= 1.2
    
    # Future: Executive vocabulary
    enhanced_score *= calculate_role_aware_multiplier(keyword_text)
    
    # Future: Compound keyword boost
    enhanced_score *= calculate_compound_boost(keyword_text)
    
    # Future: Technical sophistication
    enhanced_score *= calculate_technical_sophistication_boost(keyword_text)
    
    # Future: Context enhancement
    enhanced_score *= detect_requirement_context(job_text, keyword_text)
    
    return enhanced_score
```

### Success Metrics for Future Enhancements
- **Compound Keyword Effectiveness**: "product strategy" > "strategy" by ≥30%
- **Executive Vocabulary Accuracy**: Strategic terms boosted appropriately
- **Technical Sophistication**: Advanced terms outrank basic equivalents
- **Context Awareness**: "Nice to have" terms properly deprioritized

---

**Document Version**: 2.0 (Lean MVP Focus)  
**Created**: July 11, 2025  
**Author**: Claude Code  
**Status**: Ready for MVP Implementation  
**Next Review**: After MVP validation - evaluate Future Enhancements