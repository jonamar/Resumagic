# Eliminate Service Wrapper Anti-Pattern PRD

**Version:** 1.0  
**Date:** 2025-01-30  
**Status:** Draft  

## Problem Statement

The service wrapper architecture actively undermines TypeScript benefits and creates agent confusion:

```typescript
// Current (bad) - loses all type information
const keywordService = getServiceWrapper('keyword-analysis');
const result = await keywordService.execute(); // Promise<any> 🤮
```

**Issues:**
- **Type safety destroyed:** `Promise<any>` tells agents nothing
- **Runtime string lookups:** Agent can't predict `getServiceWrapper('keyword-analysis')`  
- **Indirection complexity:** Multiple hops to understand what code does
- **Zero IDE support:** No auto-complete, no refactoring safety

## Solution

**Delete the wrapper system. Replace with direct function calls.**

```typescript
// Goal (good) - clear, typed, predictable
import { analyzeKeywords } from './services/keyword-analysis';
const result: KeywordAnalysis = await analyzeKeywords(jobText);
```

## Scope

### Files Using Wrapper Pattern (Must Fix):
- `generate-resume.ts` - 2 calls to `getServiceWrapper()`
- `cli/command-handler.ts` - 2 calls to `getServiceWrapper()`

### Files to Delete (Entire Directory):
- `services/wrappers/base-service-wrapper.ts`
- `services/wrappers/document-generation-wrapper.ts`
- `services/wrappers/hiring-evaluation-wrapper.ts`
- `services/wrappers/keyword-analysis-wrapper.ts`
- `services/wrappers/vale-linting-wrapper.ts`
- `services/wrappers/service-registry.ts`
- `services/wrappers/README.md`

### Tests to Update:
- `__tests__/integration/service-wrapper-validation.test.js` - Delete entirely
- `__tests__/integration/service-wrapper-core-validation.test.js` - Delete entirely

## Implementation

### Step 1: Create Direct Service Functions
Create simple, typed functions in the service directories:

```typescript
// services/keyword-analysis.ts (new file)
export async function analyzeKeywords(applicationName: string): Promise<KeywordAnalysis> {
  // Move logic from keyword-analysis-wrapper.ts
  // Direct Python service call, no wrapper abstraction
}

// services/hiring-evaluation.ts (new file)  
export async function evaluateCandidate(applicationName: string, fastMode = false): Promise<HiringEvaluation> {
  // Move logic from hiring-evaluation-wrapper.ts
  // Direct Ollama service call, no wrapper abstraction
}

// services/document-generation.ts (new file)
export async function generateDocument(options: DocumentOptions): Promise<GenerationResult> {
  // Move logic from document-generation-wrapper.ts
  // Direct DOCX generation, no wrapper abstraction
}
```

### Step 2: Update Main Application Files
Replace wrapper calls with direct imports:

```typescript
// generate-resume.ts - before
import { getServiceWrapper } from './services/wrappers/service-registry';
const keywordService = getServiceWrapper('keyword-analysis');
const result = await keywordService.execute();

// generate-resume.ts - after  
import { analyzeKeywords } from './services/keyword-analysis';
const result = await analyzeKeywords(applicationName);
```

### Step 3: Delete Wrapper Infrastructure
```bash
rm -rf services/wrappers/
rm __tests__/integration/service-wrapper-*.test.js
```

### Step 4: Update Tests
Replace wrapper tests with direct function tests:

```typescript
// __tests__/integration/keyword-analysis.test.js (new)
import { analyzeKeywords } from '../../services/keyword-analysis';

test('analyzes keywords for application', async () => {
  const result = await analyzeKeywords('test-application');
  expect(result.keywords).toBeDefined();
});
```

## Migration Strategy

### Phase 1: Keyword Analysis (30 minutes)
1. Create `services/keyword-analysis.ts` with direct function
2. Update `generate-resume.ts` and `cli/command-handler.ts` imports
3. Test that keyword analysis still works

### Phase 2: Hiring Evaluation (30 minutes)  
1. Create `services/hiring-evaluation.ts` with direct function
2. Update import statements in main files
3. Test that hiring evaluation still works

### Phase 3: Document Generation (30 minutes)
1. Create `services/document-generation.ts` with direct function  
2. Update remaining import statements
3. Test that document generation still works

### Phase 4: Cleanup (15 minutes)
1. Delete `services/wrappers/` directory entirely
2. Delete wrapper test files
3. Update any remaining references

**Total time: 2 hours**

## Success Criteria

- [ ] Zero calls to `getServiceWrapper()` in codebase
- [ ] All service calls return proper TypeScript types (no `Promise<any>`)
- [ ] `services/wrappers/` directory deleted
- [ ] All existing functionality works identically
- [ ] Agents can understand service calls through direct imports

## Type Definitions Needed

```typescript
// types/services.ts (new file)
export interface KeywordAnalysis {
  keywords: string[];
  topSkills: string[];
  applicationName: string;
}

export interface HiringEvaluation {
  overallScore: number;
  summary: string;
  applicationName: string;
}

export interface DocumentOptions {
  applicationName: string;
  documentType: 'resume' | 'cover-letter' | 'combined';
}

export interface GenerationResult {
  filePath: string;
  documentType: string;
}
```

## Risk Assessment

**Low Risk:**
- Simple file movement and import changes
- No business logic changes
- Can test each service independently
- Easy rollback (git revert)

**Mitigation:**
- Test each phase independently
- Keep existing integration tests working
- Verify end-to-end workflows after each phase

## Benefits

### For Agents:
- **Predictable:** `import { analyzeKeywords }` → agent knows exactly what this does
- **Typed:** `KeywordAnalysis` return type → agent knows what properties exist
- **Direct:** No indirection → agent can trace code easily

### For Developers:
- **IDE Support:** Auto-complete, go-to-definition, refactoring
- **Type Safety:** Compile-time error detection
- **Clarity:** Obvious what each service call does

### For Codebase:
- **Fewer Files:** Delete 8 wrapper files + tests
- **Less Complexity:** Remove abstraction layer
- **Better Performance:** No runtime service registry lookups

## Definition of Done

1. `grep -r "getServiceWrapper" app/` returns zero results
2. `grep -r "BaseServiceWrapper" app/` returns zero results  
3. All integration tests pass
4. Document generation, keyword analysis, and hiring evaluation work identically
5. TypeScript compilation produces zero `any` type warnings for service calls

---

**Key Insight:** This isn't refactoring—it's **complexity removal**. We're deleting the abstraction layer that provides zero value while actively harmful to agent navigation and TypeScript benefits.