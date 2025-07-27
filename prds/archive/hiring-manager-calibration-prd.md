# Hiring Manager Calibration System PRD

## Problem Statement

We need to validate whether local LLMs (specifically Qwen3:8b via Ollama) can provide hiring manager feedback that's comparable to Claude's evaluation quality. This requires a systematic calibration process to tune local model prompts and scoring to achieve baseline accuracy.

## Solution Overview

Build a **calibration system** that:
1. Establishes Claude-based baseline scores from three hiring manager personas
2. Implements equivalent Ollama-based personas using Qwen3:8b
3. Iteratively tunes prompts and scoring until Ollama results are within 15% of Claude baseline
4. Uses both manual evaluation and metrics-based experimentation

## Success Criteria

- **Primary Goal**: Ollama persona scores within 15% of Claude baseline scores
- **Secondary Goal**: Identify optimal prompt structures for hiring manager simulation
- **Tertiary Goal**: Document what works/doesn't work for future model experiments

## Architecture

```
hiring-mob-p2/
├── application-materials/
│   ├── job-posting.md          # Job posting (existing)
│   └── resume.json             # Resume data (existing)
├── baseline/
│   ├── claude-results.json     # Claude baseline scores
│   └── claude-reasoning.md     # Claude detailed reasoning
├── ollama/
│   ├── ollama-results.json     # Ollama scores
│   └── ollama-reasoning.md     # Ollama detailed reasoning
├── prompts/
│   ├── claude-hr-prompt.md
│   ├── claude-technical-prompt.md
│   ├── claude-executive-prompt.md
│   ├── ollama-hr-prompt.md
│   ├── ollama-technical-prompt.md
│   └── ollama-executive-prompt.md
├── scoring/
│   └── unified-rubric.md
├── calibration/
│   ├── calibration-log.md      # Tuning iterations log
│   └── final-results.json     # Final calibration results
└── README.md                   # Implementation guide
```

## Implementation Plan

### Phase 1: Baseline Establishment (Claude)
1. Create three distinct hiring manager personas
2. Generate baseline scores using Claude for each persona
3. Establish ground truth for comparison

### Phase 2: Ollama Implementation
1. Implement equivalent personas using Qwen3:8b
2. Generate initial scores using same rubric
3. Compare against baseline

### Phase 3: Iterative Calibration
1. Analyze score discrepancies
2. Tune prompts and/or scoring weights
3. Re-evaluate until 15% accuracy achieved or local maximum reached

## Personas & Prompts

### Baseline Claude Personas

#### HR Manager: Sarah Chen
**Role**: Senior HR Manager, 15 years tech recruitment
**Focus**: Cultural fit, experience match, qualification alignment
**Scoring Weight**: 35%

**Prompt Template**:
```
You are Sarah Chen, a Senior HR Manager with 15 years of experience in tech recruitment. You've successfully placed hundreds of candidates at companies ranging from startups to Fortune 500 tech giants. Your expertise lies in assessing cultural fit, experience alignment, and overall qualification match.

BACKGROUND:
- 15 years in tech recruitment
- Placed 300+ candidates successfully
- Expert in cultural fit assessment
- Strong focus on experience progression
- Values clear communication and leadership potential

EVALUATION TASK:
Review the attached resume against the job posting and score the candidate on the following criteria using the provided rubric. Focus particularly on:
- Experience match and career progression
- Cultural fit indicators
- Qualification alignment
- Communication and interpersonal skills

Provide scores (1-10) and detailed reasoning for each criterion.
```

#### Technical Manager: Dr. Jennifer Liu
**Role**: Former CTO, 20 years engineering leadership
**Focus**: Technical depth, architecture thinking, problem-solving
**Scoring Weight**: 40%

**Prompt Template**:
```
You are Dr. Jennifer Liu, a former CTO with 20 years of engineering leadership experience. You've built and scaled engineering teams at three successful startups that achieved unicorn status. Your expertise is in evaluating technical depth, architectural thinking, and problem-solving capabilities.

BACKGROUND:
- PhD in Computer Science, Stanford
- Former CTO at three unicorn startups
- 20 years engineering leadership
- Expert in system architecture and scalability
- Strong focus on technical problem-solving

EVALUATION TASK:
Review the attached resume against the job posting and score the candidate on the following criteria using the provided rubric. Focus particularly on:
- Technical skill depth and breadth
- Architecture and system design thinking
- Problem-solving approach and complexity
- Technical leadership and mentoring

Provide scores (1-10) and detailed reasoning for each criterion.
```

#### Executive Manager: Michael Rodriguez
**Role**: VP of Product Strategy, 12 years product leadership
**Focus**: Strategic thinking, business impact, vision alignment
**Scoring Weight**: 25%

**Prompt Template**:
```
You are Michael Rodriguez, VP of Product Strategy with 12 years of product leadership experience. You've launched multiple successful products and driven strategic initiatives at high-growth companies. Your expertise is in evaluating strategic thinking, business impact, and vision alignment.

BACKGROUND:
- MBA from Wharton
- 12 years product leadership
- Launched 8 successful products
- Expert in strategic planning and market analysis
- Strong focus on business impact and ROI

EVALUATION TASK:
Review the attached resume against the job posting and score the candidate on the following criteria using the provided rubric. Focus particularly on:
- Strategic thinking and market understanding
- Business impact and results orientation
- Vision alignment and forward-thinking
- Stakeholder management and influence

Provide scores (1-10) and detailed reasoning for each criterion.
```

### Ollama Qwen3:8b Personas

#### HR Manager: Sarah Chen (Ollama Version)
```
You are Sarah Chen, a Senior HR Manager with 15 years of experience in tech recruitment. You have successfully placed hundreds of candidates at companies from startups to Fortune 500 tech giants.

Your expertise:
- 15 years in tech recruitment
- Placed 300+ candidates successfully
- Expert in cultural fit assessment
- Strong focus on experience progression
- Values clear communication and leadership potential

TASK: Review this resume against the job posting. Score the candidate (1-10) on:
1. Experience Match (How well does their experience align with requirements?)
2. Cultural Fit (Do they demonstrate values and behaviors that fit the company?)
3. Qualification Alignment (Do they meet the core qualifications?)
4. Communication Skills (Evidence of strong communication abilities?)

For each score, provide 2-3 sentences explaining your reasoning.

RESUME:
{resume_content}

JOB POSTING:
{job_posting_content}
```

#### Technical Manager: Dr. Jennifer Liu (Ollama Version)
```
You are Dr. Jennifer Liu, a former CTO with 20 years of engineering leadership experience. You have built and scaled engineering teams at three successful startups that achieved unicorn status.

Your expertise:
- PhD in Computer Science, Stanford
- Former CTO at three unicorn startups
- 20 years engineering leadership
- Expert in system architecture and scalability
- Strong focus on technical problem-solving

TASK: Review this resume against the job posting. Score the candidate (1-10) on:
1. Technical Depth (How deep is their technical expertise?)
2. Architecture Thinking (Evidence of system design and architectural skills?)
3. Problem Solving (Complexity of problems they've solved?)
4. Technical Leadership (Evidence of leading technical teams/initiatives?)

For each score, provide 2-3 sentences explaining your reasoning.

RESUME:
{resume_content}

JOB POSTING:
{job_posting_content}
```

#### Executive Manager: Michael Rodriguez (Ollama Version)
```
You are Michael Rodriguez, VP of Product Strategy with 12 years of product leadership experience. You have launched multiple successful products and driven strategic initiatives at high-growth companies.

Your expertise:
- MBA from Wharton
- 12 years product leadership
- Launched 8 successful products
- Expert in strategic planning and market analysis
- Strong focus on business impact and ROI

TASK: Review this resume against the job posting. Score the candidate (1-10) on:
1. Strategic Thinking (Evidence of strategic planning and market understanding?)
2. Business Impact (Quantifiable results and business outcomes?)
3. Vision Alignment (Forward-thinking and innovation capabilities?)
4. Stakeholder Management (Evidence of managing diverse stakeholders?)

For each score, provide 2-3 sentences explaining your reasoning.

RESUME:
{resume_content}

JOB POSTING:
{job_posting_content}
```

## Unified Scoring Rubric

### Core Evaluation Criteria

Each persona evaluates using a 1-10 scale across their focus areas:

#### Experience Match (All Personas)
- **9-10**: Perfect alignment, exceeds requirements
- **7-8**: Strong alignment, meets all key requirements
- **5-6**: Moderate alignment, meets most requirements
- **3-4**: Weak alignment, missing key requirements
- **1-2**: Poor alignment, significant gaps

#### Technical Depth (Technical Manager Focus)
- **9-10**: Expert level, cutting-edge expertise
- **7-8**: Senior level, strong technical skills
- **5-6**: Intermediate level, solid foundation
- **3-4**: Junior level, basic skills
- **1-2**: Beginner level, significant gaps

#### Strategic Thinking (Executive Manager Focus)
- **9-10**: Visionary, drives market strategy
- **7-8**: Strategic, influences product direction
- **5-6**: Tactical, executes on strategy
- **3-4**: Operational, limited strategic input
- **1-2**: Task-oriented, no strategic thinking

#### Cultural Fit (HR Manager Focus)
- **9-10**: Perfect culture match, strong values alignment
- **7-8**: Good culture match, compatible values
- **5-6**: Neutral culture match, adaptable
- **3-4**: Weak culture match, some concerns
- **1-2**: Poor culture match, significant concerns

### Composite Scoring Formula

```
Final Score = (HR Score × 0.35) + (Technical Score × 0.40) + (Executive Score × 0.25)
```

## Calibration Process

### Step 1: Baseline Generation
1. Feed resume + job posting to Claude with each persona prompt
2. Collect scores and reasoning for each criterion
3. Calculate weighted composite score
4. Store as baseline for comparison

### Step 2: Initial Ollama Evaluation
1. Feed same resume + job posting to Qwen3:8b with equivalent prompts
2. Collect scores and reasoning
3. Calculate weighted composite score
4. Compare against baseline

### Step 3: Iterative Tuning
1. **Analyze Discrepancies**: Identify which scores differ most from baseline
2. **Prompt Refinement**: Adjust persona details, instructions, or examples
3. **Weight Adjustment**: Modify scoring weights if needed
4. **Re-evaluate**: Test refined prompts against baseline
5. **Repeat**: Continue until 15% accuracy achieved

### Evaluation Metrics

#### Primary Metrics
- **Absolute Score Difference**: `|claude_score - ollama_score|`
- **Percentage Accuracy**: `(1 - |difference|/claude_score) × 100`
- **Composite Accuracy**: Weighted average across all criteria

#### Secondary Metrics
- **Reasoning Quality**: Manual assessment of explanation coherence
- **Consistency**: Score variation across multiple runs
- **Response Time**: Ollama evaluation speed

### Success Validation

#### Automated Checks
- [ ] Composite score within 15% of Claude baseline
- [ ] Individual criteria scores within 20% of baseline
- [ ] Reasoning quality passes manual review
- [ ] Response format matches expected JSON structure

#### Manual Evaluation
- [ ] Reasoning demonstrates persona-appropriate expertise
- [ ] Scores reflect logical assessment of resume content
- [ ] Feedback is actionable and specific
- [ ] Tone matches professional hiring manager communication

## Expected Workflow

```bash
# Step 1: Generate Claude baseline
node calibration-runner.js --mode=baseline --resume=resume.json --job=job-posting.md

# Step 2: Run Ollama evaluation
node calibration-runner.js --mode=ollama --resume=resume.json --job=job-posting.md

# Step 3: Analyze and tune
node calibration-runner.js --mode=calibrate --target-accuracy=15

# Step 4: Validate results
node calibration-runner.js --mode=validate --resume=resume.json --job=job-posting.md
```

## Risk Mitigation

### High-Risk Areas
1. **Prompt Sensitivity**: Qwen3:8b may not follow complex persona instructions
2. **Scoring Consistency**: Local model may produce variable scores
3. **Reasoning Quality**: Explanations may lack professional depth

### Mitigation Strategies
1. **Iterative Prompt Development**: Test multiple prompt variations
2. **Multiple Run Averaging**: Average scores across multiple evaluations
3. **Fallback Prompts**: Simplified prompts if complex ones fail
4. **Local Maximum Detection**: Stop tuning when improvements plateau

## Success Criteria & Exit Conditions

### Success Conditions
- [ ] Composite score within 15% of Claude baseline
- [ ] Individual persona scores within 20% of baseline
- [ ] Reasoning quality acceptable for hiring decisions
- [ ] System completes evaluation in <2 minutes

### Exit Conditions (Local Maximum Reached)
- [ ] No improvement after 5 consecutive tuning iterations
- [ ] Accuracy plateaus above 25% difference
- [ ] Reasoning quality remains unacceptable after prompt refinement
- [ ] System becomes unstable or unreliable

## Future Enhancements

### V2 Considerations
- Multi-model comparison (Mistral, Gemma, etc.)
- Advanced consensus building between personas
- Real-time collaborative evaluation
- Integration with existing resume generation pipeline

This PRD provides a comprehensive framework for systematic calibration of local LLMs against Claude's hiring manager evaluation quality.