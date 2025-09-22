# PRD: ESLint Configuration & Type Safety Cleanup

## Problem Statement

The codebase has 1,275 linting violations that are hindering maintainability and agent productivity. However, many violations result from overly rigid ESLint configuration rather than actual code quality issues. We need a **lean, surgical approach** that improves real code quality without architectural complexity.

**Current State:**
- 1,275 total violations (811 errors, 464 warnings)
- 323 console violations (many legitimate CLI output)
- 718 TypeScript unsafe operations (mix of real issues + overly strict rules)
- 33 missing imports (real crash risks)
- 57 unused variables (cleanup opportunities)

## Solution Philosophy

**Configuration > Code Changes**
- Smart ESLint rules that help write better code, not force workarounds
- TypeScript interfaces for actual data flow, not theoretical completeness
- Focus on real maintainability issues, not linter compliance theater

## Data Flow Analysis

Before making changes, we must understand the complete data pipeline:

### Input Sources
1. **User-created files** (controlled schemas):
   - `resume.json` (JSON Resume format)
   - `cover-letter.md` (Markdown with YAML frontmatter)
   - `keywords.json` (keyword analysis results)
   - `job-posting.md` (job description text)

2. **Generated/processed data**:
   - Keyword analysis Python service output
   - Ollama evaluation API responses
   - Vale linting results

3. **Configuration files**:
   - `personas/*.yaml` (evaluation persona configs)
   - Theme and styling configurations

### Processing Pipeline
```
[resume.json] + [job-posting.md] → Keyword Analysis Service → [keywords.json]
[cover-letter.md] → YAML frontmatter parsing → Structured data
[All inputs] → Document Generation → [DOCX files]
[resume.json] → Hiring Evaluation Service → [evaluation results]
```

### Key Interface Points (Where Type Safety Matters Most)
1. **File I/O boundaries** (JSON.parse, YAML parsing, file reading)
2. **Service boundaries** (Python ↔ Node, Ollama API responses)
3. **Document generation** (structured data → DOCX conversion)
4. **Error propagation** (service failures, validation errors)

## Implementation Plan

### Phase 1: ESLint Configuration Tuning (2 hours)

**1.1 Console Logging Rules**
Problem: CLI applications legitimately need console output
```javascript
// eslint.config.mjs
rules: {
  'no-console': ['warn', { 
    allow: ['error', 'warn', 'info'] // Allow semantic console usage
  }],
}
```
Expected reduction: 200-250 violations

**1.2 TypeScript Rule Adjustments**
Problem: Rules too strict for practical usage patterns
**Strategy: Make Rules Smarter, Not Quieter**
```javascript
// Allow specific safe patterns instead of blanket downgrades
'@typescript-eslint/no-unsafe-member-access': ['error', {
  // Allow accessing common Error properties (frequent pattern)
  allow: ['Error.prototype.message', 'error.message', 'error.name', 'error.stack']
}],
'@typescript-eslint/no-unsafe-assignment': ['error', {
  // Allow JSON.parse assignments (we'll use type assertions)  
  ignoreRestArgs: true
}],
// Keep strict for genuinely dangerous operations
'@typescript-eslint/no-unsafe-argument': 'error',
'@typescript-eslint/no-unsafe-call': 'error',
```
**Alternative if above isn't sufficient**: Temporarily disable most problematic rules while we implement proper interfaces, then re-enable:
```javascript
// Temporary: Disable during interface implementation phase
'@typescript-eslint/no-unsafe-member-access': 'off',
'@typescript-eslint/no-unsafe-assignment': 'off',
// Re-enable after Phase 3 completion
```
Expected reduction: 500-600 violations

**Test Impact:**
```bash
npm run lint 2>&1 | tail -3  # Check new violation count
```

### Phase 2: Safe Auto-fixes (30 minutes)

**2.1 Formatting Issues**
Only 46 violations are auto-fixable (trailing commas, indentation)
```bash
git add -A && git commit -m "Pre auto-fix checkpoint"
npm run lint -- --fix
git diff  # Review changes
git add -A && git commit -m "Auto-fix formatting issues"
```

**2.2 Manual Review**
Verify only cosmetic changes (no logic modifications)

### Phase 3: Critical Error Fixes (4 hours)

**3.1 Missing Imports (33 violations) - HIGH PRIORITY**
These cause runtime crashes - fix immediately
```bash
# Find undefined variables
npm run lint 2>&1 | grep "no-undef"
# Add missing imports for each file
```

**3.2 Data Flow Type Interfaces**
Define interfaces for actual data structures in the pipeline:

```typescript
// Core data interfaces based on actual usage
interface ResumeData {
  basics: {
    name: string;
    email: string;
    // ... actual resume.json structure
  };
  work: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    summary: string;
    // ... actual work entry structure
  }>;
  // ... complete interface based on JSON Resume schema
}

interface CoverLetterFrontMatter {
  applicationName: string;
  company: string;
  jobTitle: string;
  // ... actual YAML frontmatter structure
}

interface KeywordAnalysisResult {
  knockout_requirements: Array<{
    kw: string;
    priority: number;
    // ... actual keyword analysis structure
  }>;
  skills_ranked: Array<{
    kw: string;
    score: number;
    // ... actual skills structure
  }>;
  // ... complete structure from Python service
}

interface OllamaEvaluationResponse {
  model: string;
  response: string;
  // ... actual Ollama API response structure
}
```

**3.3 Strategic Error Handling**
Fix the most common error handling pattern:
```typescript
// Before: catch (error) - error is unknown
// After: catch (error: unknown) - explicit typing
function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'object' && error && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error(String(error));
}

// Usage: catch (error) { throw normalizeError(error); }
```

**3.4 File I/O Type Safety**
Apply interfaces to actual data loading:
```typescript
// Replace: const resumeData = JSON.parse(content);
// With: const resumeData = JSON.parse(content) as ResumeData;
// Better: 
function loadResumeData(path: string): ResumeData {
  const content = fs.readFileSync(path, 'utf8');
  const data = JSON.parse(content) as ResumeData;
  // Basic validation without over-engineering
  if (!data.basics?.name) {
    throw new Error(`Invalid resume data: missing basics.name in ${path}`);
  }
  return data;
}
```

### Phase 4: Verification & Testing (2 hours)

**4.1 Functionality Testing**
Test actual data flow paths:
```bash
# Test core functionality still works
npm test
# Test document generation with real data
node generate-resume.js test-validation
# Verify keyword analysis pipeline
# Verify evaluation service
```

**4.2 Type Safety Validation**
Ensure TypeScript catches real errors:
```typescript
// Intentionally break something to verify types work
const resumeData: ResumeData = { invalid: "data" }; // Should error
```

**4.3 Linting Progress Check**
```bash
npm run lint 2>&1 | tail -3  # Final violation count
```

## Success Criteria

### Quantitative Goals
- **Total violations**: From 1,275 to <200 (84% reduction)
- **Error-level violations**: From 811 to <50 (94% reduction)
- **Real type safety**: Interfaces for all data flow boundaries
- **Test pass rate**: 100% of existing functionality

### Qualitative Goals
- **Agent-friendly**: Linter helps write better code, doesn't create noise
- **Maintainability**: Clear data flow with typed interfaces
- **Practical**: Rules match actual usage patterns of CLI application
- **Understandable**: Error messages point to real issues, not theoretical ones

## Risk Mitigation

### Data Flow Risks
- **YAML parsing**: Test with actual persona files and cover letter frontmatter
- **JSON parsing**: Verify with real resume.json files from applications directory
- **Service integration**: Test keyword analysis and evaluation services end-to-end
- **Document generation**: Verify DOCX output with real data

### Implementation Risks
- **Git checkpoints**: Commit before each phase for easy rollback
- **Incremental testing**: Test after each change, not at the end
- **Real data validation**: Use actual files from data/applications/ for testing

### Configuration Risks
- **Rule changes**: Ensure stricter rules still catch real errors
- **TypeScript config**: Don't break existing compilation
- **Import resolution**: Verify all module imports still work

## Timeline

**Day 1 (Morning - 3 hours):**
- Phase 1: ESLint configuration tuning
- Phase 2: Safe auto-fixes
- Initial testing and verification

**Day 1 (Afternoon - 4 hours):**
- Phase 3: Critical error fixes
- Data flow interface definitions
- Error handling improvements

**Day 2 (Morning - 2 hours):**
- Phase 4: Comprehensive testing
- Final verification and cleanup

**Total**: 8 hours over 2 days

## Investigation Checklist ✅ COMPLETED

**Data Flow Analysis Based on babylist-founding-pm Application:**

### ✅ `resume.json` Structure (JSON Resume Schema Compliant)
```typescript
interface ResumeData {
  basics: {
    name: string;
    label: string;
    email: string;
    phone: string;
    summary: string;
    work_modes: string;
    location: {
      city: string;
      region: string;
      country: string;
      postalCode: string;
    };
    profiles: Array<{
      network: string;
      username: string;
      url: string;
    }>;
  };
  work: Array<{
    name: string;          // Company name
    position: string;      // Job title
    url?: string;
    location: string;
    startDate: string;     // Format: "Oct 2022"
    endDate?: string;      // Format: "May 2025" or missing for current
    summary: string;       // Brief role description
    highlights: string[];  // Achievement bullets
  }>;
  // Additional sections: education, skills, projects, etc.
}
```

### ✅ `cover-letter.md` YAML Frontmatter Structure
```typescript
interface CoverLetterFrontMatter {
  date: string;           // Format: "2025-07-21"
  customClosing: string;  // Format: "Warmly", "Best regards"
  // Content follows as markdown after ---
}
```

### ✅ `keywords.json` Input Structure (Manual Keywords)
```typescript
interface KeywordInput {
  keywords: Array<{
    kw: string;
    role: "core" | "industry_experience" | "functional_skills";
  }>;
}
```

### ✅ `keyword_analysis.json` Output Structure (Python Service)
```typescript
interface KeywordAnalysisResult {
  knockout_requirements: Array<{
    kw: string;
    tfidf: number;
    section: number;
    role: number;
    score: number;
    is_buzzword: boolean;
    category: "knockout";
    knockout_type: "required";
    knockout_confidence: number;
  }>;
  skills_ranked: Array<{
    kw: string;
    tfidf: number;
    section: number;
    role: number;
    score: number;
    is_buzzword: boolean;
    category: "skill";
    knockout_type: null;
    knockout_confidence: number;
    aliases: string[];
  }>;
}
```

### ✅ `evaluation-results.json` Structure (Ollama Service)
```typescript
interface EvaluationResult {
  evaluation_timestamp: string;    // ISO timestamp
  model: string;                  // "dolphin3:latest"
  candidate: string;              // Candidate name
  evaluations: Array<{
    scores: Record<string, {      // Dynamic criteria names
      score: number;              // 1-10 rating
      reasoning: string;          // Detailed explanation
    }>;
    overall_assessment: {
      persona_score: number;      // Overall 1-10 rating
      recommendation: string;     // Summary recommendation
    };
    persona: string;             // "HR Manager", "Director of Engineering", etc.
  }>;
}
```

### ✅ Critical Interface Points Identified
1. **File I/O**: JSON.parse() calls need type assertion to proper interfaces
2. **Service Boundaries**: Python keyword analysis → Node.js document generation
3. **Document Generation**: Structured data → DOCX conversion requires typed inputs
4. **Error Handling**: catch (error) blocks need proper Error typing

## Definition of Done

- [ ] ESLint violations <200 total
- [ ] All critical imports resolved (0 no-undef violations)
- [ ] TypeScript interfaces for all data flow boundaries
- [ ] Console usage semantic and appropriate
- [ ] All existing tests passing
- [ ] Document generation working with real data
- [ ] No architectural complexity added
- [ ] Clear error messages for actual issues
- [ ] Git history clean with descriptive commits

This approach prioritizes **real maintainability improvements** over linter compliance, ensuring the codebase becomes genuinely easier to work with for both humans and AI agents.