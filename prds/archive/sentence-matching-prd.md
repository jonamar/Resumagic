⏺ PRD: Sentence-Matcher for Keyword Injection

## Problem Statement

Current keyword injection workflow requires users to manually scan through hundreds of lines of resume content to find optimal placement spots for each priority keyword, leading to:
- 20+ minute manual scanning process per application
- Suboptimal keyword placement due to fatigue and oversight
- Inconsistent keyword integration across applications
- High cognitive load that reduces quality of strategic keyword selection

## Solution

Implement **Semantic Similarity Injection Points** to automatically identify the 2-3 best sentences in Jon's resume for each top-priority keyword, eliminating manual scanning while preserving user control over final placement decisions.

### Core Feature: Semantic Similarity Injection Points

**Approach**: Leverage existing sentence-transformers infrastructure to find semantically similar content in resume using hybrid bullet/sentence matching optimized for natural editing.

**Content Extraction Strategy**:
- **Highlights**: Bullet-level matching (`work[].highlights[]`) - preserves natural bullet context
- **Summaries**: Sentence-level matching (`work[].summary`, `basics.summary`) - enables targeted sentence editing
- **Rationale**: Respects natural content structure while providing optimal granularity for editing

**Implementation**:
1. Extract bullets from highlights + sentences from summaries in `resume.json`
2. For each keyword, compute semantic similarity using `all-MiniLM-L6-v2` model
3. Return top 3 matches with actionable classification and context
4. Integrate into existing `keyword-checklist.md` workflow

**Actionable Classification System**:
- **✅ Exact-match**: Content already contains keyword - no work needed
- **✏️ High fit** (≥0.75): Likely one-word tweak required  
- **🟠 Medium fit** (0.55-0.75): May need short phrase addition
- **🚫 No fit** (<0.55): Suggest adding new bullet point

**Example Output**:
```markdown
- [ ] **local service businesses** (score: 0.926)
  **Best placement spots:**
  1. ✅ "...ran an agency for small businesses..." (already contains keyword)
  2. ✏️ "...helping participants raise €10M in VC funding..." (similarity: 0.78, likely one-word tweak)
  3. 🟠 "...Secured commitments from 4 Berlin retailers..." (similarity: 0.68, may need short phrase)
```

## Success Metrics

- **Primary**: Time to complete keyword injection reduces from 20+ minutes to <5 minutes
- **Secondary**: User successfully places keywords in optimal spots without full resume scanning
- **Validation**: Semantic similarity scores correlate with effective keyword placement in practice

## Implementation Plan

### Phase 1: MVP (Immediate)
1. Add `extract_matchable_content()` function for hybrid bullet/sentence extraction
2. Implement `find_injection_points()` with actionable classification system
3. Enhance `generate_keyword_checklist()` to include top 3 matches with action labels
4. Test on existing applications (nicejob, clearer, zearch) with real-world editing workflow
5. Validate that similarity scores correlate with effective keyword placement in practice

### Phase 2: Refinement (Based on usage)
- Optimize similarity thresholds for each action category
- Add contextual filtering (avoid duplicate suggestions)
- Improve content truncation and display formatting
- Fine-tune exact-match detection (stemming, phrase variations)

## Technical Requirements

- **Dependencies**: Existing sentence-transformers (`all-MiniLM-L6-v2`)
- **Input**: `resume.json` + `keyword_analysis.json`
- **Output**: Enhanced `keyword-checklist.md`
- **Performance**: <3 second processing time (maintains current pipeline speed)

## Future Feature Considerations

### Research-Based Enhancements

**Tie-break Logic** (From SEO/ATS research)
- **Status**: Future refinement consideration
- **Scope**: When two bullets score within 0.05 similarity, prefer bullets with shared word stems (easier editing) and penalize bullets >40 words (harder to edit gracefully)
- **Implementation**: Token overlap detection + length penalties for tie-breaking

**Deterministic JSON/Markdown Output** (From SEO/ATS research)  
- **Status**: Already implemented in current approach
- **Scope**: Keep output deterministic, surface where to edit, let user decide how to phrase
- **Validation**: Follow up with exact-match detection to ensure inserted keywords persist

### Option 2: Context-Aware Insertion Suggestions
**Status**: Future consideration  
**Scope**: Medium complexity, high precision approach

Analyze sentence context and suggest specific insertion points with sample text modifications.

**Key Features**:
- Before/after text examples
- Confidence levels for each suggestion
- Specific insertion point recommendations
- Natural language flow preservation

**Implementation Complexity**: Medium - requires context analysis and text generation

### Option 3: Smart Resume Rewriter
**Status**: Future consideration  
**Scope**: Highest complexity, maximum automation

Automatically rewrite sentences to naturally incorporate keywords while preserving meaning and quantitative impact.

**Key Features**:
- Automatic sentence rewriting with keyword integration
- Impact preservation scoring
- Quantitative metrics preservation
- Multiple rewrite options per keyword

**Implementation Complexity**: High - requires LLM integration and sophisticated text analysis

## Risk Assessment

**Low Risk**: Option 1 (Semantic Similarity)
- Doesn't modify resume content
- Leverages existing infrastructure
- Provides guidance without automation risk
- Easy to validate and iterate

**Medium Risk**: Option 2 (Context-Aware Insertion)
- Requires careful text analysis
- May suggest awkward insertions
- Moderate complexity to implement well

**High Risk**: Option 3 (Smart Resume Rewriter)
- Could alter resume voice/tone
- Risk of losing quantitative impact
- High complexity with many edge cases
- Requires extensive testing and validation

## Decision Rationale

**Why Option 1 First:**
- **Fastest to implement** - Uses existing sentence-transformers infrastructure
- **Immediate value** - Eliminates manual scanning entirely
- **Low risk** - Doesn't modify resume content, just provides guidance
- **Testable** - Can validate against real applications immediately
- **Foundation building** - Creates semantic matching foundation for future features

This approach provides immediate value while building the foundation for more sophisticated keyword injection features in the future.