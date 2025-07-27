# Ollama Review Board MVP PRD

## Problem Statement

Current resume optimization relies on manual iteration cycles without systematic feedback from different perspectives. This leads to:

1. **Suboptimal Optimization**: No structured feedback from HR, technical, and executive perspectives
2. **Inconsistent Evaluation**: Different reviewers would focus on different aspects (qualifications vs. technical skills vs. strategic thinking)
3. **Time-Intensive Iteration**: Manual review cycles take significant time without guaranteed improvement
4. **Lack of Calibration**: No validation that local LLM feedback aligns with more capable models

## Solution Overview

Build an **Ollama-based review board MVP** that simulates multi-persona reviewers (HR, Technical, Executive) using local LLMs. Each reviewer has distinct prompts, scoring rubrics, and access to job materials. The system supports calibration periods and consensus building for iterative resume improvement.

## Success Metrics

### Primary Metrics
- **Review Quality**: Calibrated reviewers provide feedback comparable to Claude/GPT-4 (within 15% agreement)
- **Iteration Speed**: Reduce resume optimization cycles from hours to 10-15 minutes
- **Feedback Consistency**: Standardized rubrics ensure consistent evaluation across applications

### Secondary Metrics
- **Consensus Building**: Reviewers reach agreement on key improvement areas
- **Calibration Accuracy**: Local LLM scores correlate with external model validation
- **Integration Success**: Seamless workflow with existing resume generation pipeline

## Architecture Design

### Core Components

```
review-board/
├── core/                    # Core review functionality
│   ├── reviewers/          # Individual reviewer implementations
│   │   ├── hr-reviewer.js  # HR persona reviewer
│   │   ├── technical-reviewer.js  # Technical persona reviewer
│   │   └── executive-reviewer.js  # Executive persona reviewer
│   ├── orchestrator.js     # Review board coordination
│   ├── calibration.js      # Calibration and validation
│   └── consensus.js        # Cross-reviewer consensus building
├── prompts/                # Reviewer-specific prompts
│   ├── hr-prompt.md        # HR reviewer prompt template
│   ├── technical-prompt.md # Technical reviewer prompt template
│   └── executive-prompt.md # Executive reviewer prompt template
├── config/                 # Configuration management
│   ├── personas.js         # Reviewer persona definitions
│   ├── rubrics.js          # Scoring rubrics
│   └── weights.js          # Reviewer weighting system
├── tests/                  # Test suite
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
├── review-board.js         # Main entry point
└── package.json           # Dependencies
```

### Integration with Existing Pipeline

```
EXISTING WORKFLOW:
resume.json + job-posting.md → keyword analysis → document generation

ENHANCED WORKFLOW:
resume.json + job-posting.md → keyword analysis → document generation → review board → iterative improvement
```

## Technical Implementation

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 Ollama Integration Layer
**Deliverables:**
- `core/ollama-client.js`: HTTP client for Ollama API
- `core/model-manager.js`: Model selection and management
- `core/prompt-engine.js`: Prompt templating and optimization

**Key Features:**
- Support for multiple Ollama models (llama2, mistral, codellama)
- Efficient prompt engineering for local models
- Error handling and retry logic
- Performance optimization for batch processing

#### 1.2 Reviewer Framework
**Deliverables:**
- `core/reviewer-base.js`: Abstract reviewer class
- `reviewers/hr-reviewer.js`: HR persona implementation
- `reviewers/technical-reviewer.js`: Technical persona implementation
- `reviewers/executive-reviewer.js`: Executive persona implementation

**Reviewer Personas:**
```javascript
// HR Reviewer
{
  name: "Sarah Chen",
  title: "Senior HR Manager", 
  experience: "15 years in tech recruitment",
  focus: ["qualifications", "experience_match", "cultural_fit"],
  model: "llama2",
  weight: 0.4
}

// Technical Reviewer
{
  name: "Dr. Jennifer Liu",
  title: "Former CTO at HealthTech Unicorn",
  experience: "20 years in engineering leadership", 
  focus: ["technical_skills", "architecture", "problem_solving"],
  model: "codellama",
  weight: 0.3
}

// Executive Reviewer
{
  name: "Michael Rodriguez",
  title: "VP of Product Strategy",
  experience: "12 years in product leadership",
  focus: ["strategic_thinking", "business_impact", "leadership"],
  model: "mistral", 
  weight: 0.3
}
```

#### 1.3 Scoring Rubrics
**Deliverables:**
- `config/rubrics.js`: Comprehensive scoring criteria
- `config/weights.js`: Reviewer weighting system

**Scoring Categories:**
```javascript
{
  qualifications: {
    weight: 0.25,
    criteria: [
      { name: "experience_match", weight: 0.4 },
      { name: "skill_alignment", weight: 0.3 },
      { name: "education_relevance", weight: 0.2 },
      { name: "certifications", weight: 0.1 }
    ]
  },
  technical_skills: {
    weight: 0.25,
    criteria: [
      { name: "technical_depth", weight: 0.4 },
      { name: "architecture_thinking", weight: 0.3 },
      { name: "problem_solving", weight: 0.2 },
      { name: "technology_stack", weight: 0.1 }
    ]
  },
  strategic_thinking: {
    weight: 0.25,
    criteria: [
      { name: "business_impact", weight: 0.4 },
      { name: "market_understanding", weight: 0.3 },
      { name: "strategic_vision", weight: 0.2 },
      { name: "competitive_positioning", weight: 0.1 }
    ]
  },
  leadership: {
    weight: 0.25,
    criteria: [
      { name: "team_management", weight: 0.4 },
      { name: "stakeholder_management", weight: 0.3 },
      { name: "communication", weight: 0.2 },
      { name: "decision_making", weight: 0.1 }
    ]
  }
}
```

### Phase 2: Prompt Engineering & Calibration (Week 2)

#### 2.1 Prompt Templates
**Deliverables:**
- `prompts/hr-prompt.md`: HR reviewer prompt
- `prompts/technical-prompt.md`: Technical reviewer prompt  
- `prompts/executive-prompt.md`: Executive reviewer prompt

**Prompt Design Principles:**
- Clear instructions with specific scoring criteria
- Context provision (job posting, requirements, resume data)
- Persona consistency and personality maintenance
- Structured output format for parsing

#### 2.2 Calibration System
**Deliverables:**
- `core/calibration.js`: Calibration against external models
- `core/validation.js`: Result validation and comparison

**Calibration Process:**
1. **Initial Calibration**: Run local reviewers on sample applications
2. **External Comparison**: Compare with Claude/GPT-4 on same applications
3. **Bias Detection**: Identify systematic scoring differences
4. **Prompt Adjustment**: Refine prompts based on discrepancies
5. **Weight Optimization**: Adjust reviewer weights for better alignment

#### 2.3 Validation Framework
**Deliverables:**
- Test suite with known-good applications
- Calibration metrics tracking
- Agreement level measurement
- Confidence scoring

### Phase 3: Consensus Building & Orchestration (Week 3)

#### 3.1 Consensus Engine
**Deliverables:**
- `core/consensus.js`: Cross-reviewer discussion and agreement
- `core/conflict-resolution.js`: Handle reviewer disagreements

**Consensus Features:**
- Cross-reviewer discussion simulation
- Conflict resolution strategies
- Final recommendation consolidation
- Agreement level measurement

#### 3.2 Orchestration Layer
**Deliverables:**
- `core/orchestrator.js`: Review board coordination
- `review-board.js`: Main entry point and CLI

**Orchestration Features:**
- Parallel reviewer execution
- Result aggregation and analysis
- Consensus building workflow
- Output generation and formatting

### Phase 4: Integration & Testing (Week 4)

#### 4.1 Pipeline Integration
**Deliverables:**
- Integration with existing resume generation workflow
- File structure compatibility
- CLI integration with existing tools

**Integration Points:**
```bash
# Enhanced workflow
node generate-resume.js elovate-director-product-management
python services/keyword-analysis/kw_rank_modular.py elovate-director-product-management
node services/review-board/review-board.js elovate-director-product-management
```

#### 4.2 Testing & Validation
**Deliverables:**
- Comprehensive test suite (85%+ coverage)
- Integration tests with existing pipeline
- Performance benchmarking
- End-to-end workflow validation

## Data Flow & File Structure

### Input Requirements
```
elovate-director-product-management/
├── inputs/
│   ├── resume.json          # Resume data (existing)
│   ├── cover-letter.md      # Cover letter (existing)
│   ├── job-posting.md       # Job posting (existing)
│   └── keywords.json        # Keywords (existing)
```

### Output Structure
```
elovate-director-product-management/
├── working/
│   ├── keyword_analysis.json    # Existing keyword analysis
│   ├── hr-review.json          # HR reviewer results
│   ├── technical-review.json   # Technical reviewer results
│   ├── executive-review.json   # Executive reviewer results
│   ├── consensus-report.json   # Consensus building results
│   └── calibration-results.json # Calibration validation
└── outputs/
    ├── Jon-Amar-Resume-Elovate.docx
    ├── Jon-Amar-Cover-Letter-Elovate.docx
    └── Jon-Amar-Combined-Elovate.docx
```

### Review Output Format
```json
{
  "reviewer": "hr",
  "persona": {
    "name": "Sarah Chen",
    "title": "Senior HR Manager"
  },
  "scores": {
    "overall": 8.2,
    "qualifications": 8.5,
    "experience_match": 8.0,
    "cultural_fit": 8.3
  },
  "feedback": {
    "strengths": ["Strong experience match", "Clear career progression"],
    "concerns": ["Could emphasize leadership more"],
    "recommendations": ["Add more quantifiable achievements"]
  },
  "confidence": 0.85
}
```

## Build vs. AutoGen Decision

### AutoGen Analysis

**Pros:**
- Natural language consensus building
- Dynamic conversation capabilities
- Memory persistence across sessions
- Sophisticated multi-agent coordination

**Cons:**
- Higher complexity for MVP
- Additional dependencies and setup
- More difficult to calibrate and validate
- Potential over-engineering for initial use case

### Recommended Approach: Custom Implementation First

**Rationale:**
1. **Faster MVP**: Custom implementation can be built in 4 weeks vs. 6-8 weeks for AutoGen
2. **Better Control**: Precise control over reviewer personas and scoring
3. **Easier Calibration**: Simpler to validate against external models
4. **Foundation Building**: Creates foundation for future AutoGen integration

**Future AutoGen Integration:**
- Phase 2: Add AutoGen as optional consensus mode
- Phase 3: Full AutoGen orchestration for advanced use cases
- Phase 4: Hybrid approach with custom reviewers + AutoGen coordination

## Implementation Timeline

### Week 1: Core Infrastructure
- [ ] Ollama integration layer
- [ ] Reviewer framework and personas
- [ ] Basic scoring rubrics
- [ ] Unit test framework

### Week 2: Prompt Engineering & Calibration
- [ ] Prompt templates for all reviewers
- [ ] Calibration system against external models
- [ ] Validation framework
- [ ] Initial calibration testing

### Week 3: Consensus & Orchestration
- [ ] Consensus building engine
- [ ] Conflict resolution strategies
- [ ] Orchestration layer
- [ ] CLI integration

### Week 4: Integration & Testing
- [ ] Pipeline integration with existing workflow
- [ ] Comprehensive testing suite
- [ ] Performance optimization
- [ ] Documentation and examples

## Risk Assessment

### High-Risk Areas
1. **Prompt Engineering**: Local LLMs may not follow complex instructions reliably
2. **Calibration Accuracy**: Local models may not align well with external models
3. **Performance**: Multiple LLM calls may be slow for iterative workflows

### Mitigation Strategies
1. **Iterative Prompt Development**: Test and refine prompts with real applications
2. **Fallback Mechanisms**: Graceful degradation when calibration fails
3. **Caching**: Cache common prompt templates and responses
4. **Parallel Processing**: Run reviewers concurrently for better performance

## Success Validation

### Automated Checks
- [ ] All unit tests pass
- [ ] Integration tests with existing pipeline
- [ ] Performance benchmarks within acceptable limits
- [ ] Calibration accuracy within 15% of external models

### Manual Validation
- [ ] Review feedback is actionable and specific
- [ ] Consensus building produces coherent recommendations
- [ ] Integration workflow is seamless
- [ ] Output quality matches expectations

## Future Enhancements

### Phase 2: Advanced Features
- **Multi-language Support**: Reviews in different languages
- **Industry-specific Personas**: Specialized reviewers for different sectors
- **Advanced Consensus**: More sophisticated disagreement resolution
- **Real-time Collaboration**: Live review board sessions

### Phase 3: AutoGen Integration
- **Agent-based Reviewers**: Full AutoGen agent implementation
- **Dynamic Conversation**: Natural language consensus building
- **Memory Persistence**: Long-term reviewer memory and learning
- **Multi-agent Coordination**: Complex multi-step review processes

## Resource Requirements

### Development Resources
- 1 Senior Developer (lead implementation)
- 1 Junior Developer (testing and documentation)
- 0.5 Tech Lead (architecture decisions and code reviews)

### Infrastructure
- Ollama installation and model management
- CI/CD pipeline for testing
- Performance monitoring tools

## Conclusion

This Ollama-based review board MVP will provide immediate value through systematic, multi-perspective resume evaluation while building a foundation for more sophisticated AI-powered optimization workflows. The phased approach minimizes risk while delivering incremental value, and the custom implementation provides a solid foundation for future AutoGen integration.

The system will integrate seamlessly with the existing resume generation pipeline, providing a complete optimization workflow from keyword analysis through iterative improvement based on calibrated reviewer feedback. 