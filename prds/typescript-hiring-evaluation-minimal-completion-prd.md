# PRD: TypeScript Hiring Evaluation Service - Minimal Type Completion

## Problem Statement

The hiring evaluation service has good structure and functionality but lacks proper TypeScript typing. This creates minor friction for agents and developers working with the code, missing out on IntelliSense and type safety benefits without adding complexity.

**Current State:**
- evaluation-runner.ts: 461 lines, 19 methods, 4 `any` types
- evaluation-processor.ts: 597 lines, 28 methods, 5 `any` types  
- Methods missing parameter type signatures
- Interface definitions use `any` for complex objects

**Assessment:** Code structure is **agent-friendly** and **functional** - no architectural changes needed.

## Solution: Minimal Type Enhancement

**Philosophy:** Enhance existing code with types, don't rebuild it.

### Scope: Type Completion Only
1. **Add method parameter types** to untyped functions
2. **Replace `any` types** with proper interfaces based on actual data structures
3. **Extract 1-2 longest methods** within existing files (no new classes)
4. **Preserve all existing public APIs** and behavior

### Non-Scope: What We Won't Do
- ❌ Break apart working classes
- ❌ Create new abstraction layers  
- ❌ Add runtime validation systems
- ❌ Restructure file organization
- ❌ Change any public method signatures

## Implementation Plan

### Day 1: Interface Definition & Method Signatures (4 hours)

**1.1 Data Structure Investigation** (1 hour)
- Examine actual evaluation-results.json from babylist application
- Document the real structure of Ollama responses
- Map persona evaluation format from existing data

**1.2 Interface Creation** (1 hour)
Based on actual data from babylist-founding-pm:
```typescript
interface PersonaEvaluation {
  persona: string;
  scores: Record<string, {
    score: number;
    reasoning: string;
  }>;
  overall_assessment: {
    persona_score: number;
    recommendation: string;
  };
}

interface EvaluationResult {
  evaluation_timestamp: string;
  model: string;
  candidate: string;
  evaluations: PersonaEvaluation[];
}

interface ProcessedPersonaData {
  persona: string;
  calculatedAverage: number;
  scores: Record<string, number>;
  overallAssessment: string;
}
```

**1.3 Method Type Addition** (2 hours)
Add types to untyped methods:
- `evaluation-runner.ts`: `loadFile()`, `callOllama()`, `parseJSON()`, etc.
- `evaluation-processor.ts`: `extractQualitativeInsights()`, `generateMarkdownSummary()`, etc.

### Day 2: Type Application & Testing (4 hours)

**2.1 Replace `any` Types** (2 hours)
- Update interface definitions with proper types
- Replace `any[]` with typed arrays
- Update `qualitative: any` with proper structure

**2.2 Extract Long Methods** (1 hour)
Extract only the longest methods within existing files:
- `evaluation-processor.ts`: Break up `generateMarkdownSummary()` if >100 lines
- Keep all extractions within same class/file

**2.3 Testing & Verification** (1 hour)
- Run existing tests to ensure no regressions
- Test with babylist application data
- Verify TypeScript compilation passes
- Check ESLint violations reduced

## Success Criteria

### Quantitative Goals
- **Zero `any` types** in core business logic (interfaces can have specific `any` for flexibility)
- **100% method signatures** have parameter types
- **TypeScript compilation** passes without errors
- **All existing tests pass**
- **ESLint violations** don't increase

### Qualitative Goals
- **IntelliSense works** for all method calls
- **Agent-friendly**: Same structure, better type assistance
- **Zero behavior changes**: All existing functionality preserved
- **Maintainable**: Types reflect actual data, not theoretical perfection

## Files Affected

```
services/hiring-evaluation/
├── evaluation-runner.ts       # Add method signatures, replace 4 any types
├── evaluation-processor.ts    # Add method signatures, replace 5 any types  
├── keyword-extractor.ts       # Already minimal any usage
└── generate-prompt.ts         # Already well-typed
```

## Risk Mitigation

### Low Risk Approach
- **No structural changes**: Preserve all existing class organization
- **Type-only changes**: No logic modifications
- **Incremental testing**: Test after each file completion
- **Rollback ready**: Each change is independently committable

### Validation Strategy
- Use actual data from babylist-founding-pm for interface validation
- Test TypeScript compilation after each change
- Verify no runtime behavior changes

## Timeline

- **Day 1 Morning**: Data investigation & interface definition (2 hours)
- **Day 1 Afternoon**: Method signature completion (2 hours)
- **Day 2 Morning**: Type application & any replacement (2 hours)  
- **Day 2 Afternoon**: Long method extraction & testing (2 hours)

**Total**: 8 hours over 2 days

## Definition of Done

- [ ] All method parameters have explicit types
- [ ] Zero `any` types in business logic (specific exceptions documented)
- [ ] TypeScript compilation passes without errors
- [ ] All existing tests pass
- [ ] babylist application evaluation works correctly
- [ ] ESLint violations stable or reduced
- [ ] Code structure unchanged (same classes, same files)
- [ ] All public APIs preserved

This approach enhances developer/agent experience while respecting the working architecture and avoiding over-engineering.