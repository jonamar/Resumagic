# PRD: Service TypeScript Cleanup - Lean Type Enhancement

## Problem Statement

Three key services need TypeScript improvements for better agent DX and code maintainability, while maintaining the working architecture and avoiding over-engineering.

**Current Issues:**
1. **keyword-extraction.ts** (308 lines): Completely untyped methods in TypeScript file
2. **document-generation.ts** (111 lines): Uses `any` for critical data boundaries  
3. **Vale linting service** (9 files, CommonJS): Mixed module system creates ESLint complexity and inconsistent agent experience

## Solution Philosophy

**Enhancement over Rebuild**: Add proper TypeScript support to working code without changing architecture or creating artificial abstractions.

## Scope

### 1. keyword-extraction.ts - Moderate Typing Effort
- **Issue**: Completely untyped JavaScript-style methods in a .ts file
- **Impact**: Service is actively used but has 0% TypeScript benefits
- **Fix**: Add proper method signatures (similar to hiring-evaluation work)
- **Why Worth It**: Agents get zero IntelliSense help here, it's effectively JavaScript

### 2. document-generation.ts - Easy Win  
- **Issue**: Uses `any` for `resumeData` parameter (critical data flow boundary)
- **Impact**: Core document generation service with no type safety on main input
- **Fix**: Define `ResumeData` interface and replace `any` types
- **Why Worth It**: Main service, small effort, big agent DX gain

### 3. Vale Linting Service - ESM + TypeScript Conversion
- **Issue**: CommonJS creates mixed module system and ESLint complexity
- **Impact**: Inconsistent agent experience, no TypeScript benefits
- **Fix**: Convert to ESM + add TypeScript interfaces, keep existing file structure
- **Why Worth It**: System consistency, better agent DX, eliminates CommonJS special cases

## Implementation Plan

### Phase 1: keyword-extraction.ts Type Addition (2 hours)

**1.1 Method Signature Addition**
Add proper types to untyped methods:
```typescript
// Current: async extractKeywords(jobPostingPath, outputPath)
// Target: async extractKeywords(jobPostingPath: string, outputPath: string): Promise<void>

// Current: validateExperienceRequirements(keywords, jobPosting)  
// Target: validateExperienceRequirements(keywords: KeywordSet, jobPosting: string): KeywordSet

// Current: callOllama(prompt)
// Target: callOllama(prompt: string): Promise<string>
```

**1.2 Interface Definition**
Based on actual usage patterns:
```typescript
interface KeywordSet {
  keywords: Array<{
    kw: string;
    role: 'core' | 'industry_experience' | 'functional_skills' | 'culture';
    source?: string;
    originalYears?: string;
    originalDescription?: string;
  }>;
}

interface ExtractionService {
  ollamaUrl: string;
  modelName: string;
  extractKeywords(jobPostingPath: string, outputPath: string): Promise<void>;
  validateExperienceRequirements(keywords: KeywordSet, jobPosting: string): KeywordSet;
  callOllama(prompt: string): Promise<string>;
  parseJSON(text: string): KeywordSet;
}
```

### Phase 2: document-generation.ts Interface Addition (1 hour)

**2.1 ResumeData Interface**
Define interface based on JSON Resume schema (already used in system):
```typescript
interface ResumeData {
  basics: {
    name: string;
    label: string;
    email: string;
    phone: string;
    summary: string;
    location: {
      city: string;
      region: string;
      country: string;
    };
    profiles: Array<{
      network: string;
      username: string;
      url: string;
    }>;
  };
  work: Array<{
    name: string;
    position: string;
    location: string;
    startDate: string;
    endDate?: string;
    summary: string;
    highlights: string[];
  }>;
  // Additional sections as needed
}
```

**2.2 Replace Any Types**
```typescript
// Current: generateDocument(documentType, resumeData: any, outputPath, ...)
// Target: generateDocument(documentType, resumeData: ResumeData, outputPath, ...)
```

### Phase 3: Vale Service ESM + TypeScript Conversion (2 hours) - PROCEEDING

**3.1 CommonJS → ESM Conversion**
Convert all 9 files systematically:
- Replace `require()` with `import` statements
- Replace `module.exports` with `export` statements  
- Update file extensions from `.js` to `.ts`
- Keep existing file structure (355-line files are fine, no artificial splitting)
- Update cross-file references to use `.js` extensions (ESM requirement)

**3.2 Basic TypeScript Interfaces**
Add minimal typing for main classes based on actual usage:
```typescript
// two-tier-analyzer.ts (355 lines - keep as single file)
interface AnalysisSection {
  id: string;
  content: string;
  lineStart: number;
  lineEnd: number;
}

interface ValeResult {
  message: string;
  severity: string;
  line: number;
  column: number;
  rule: string;
}

interface AnalysisResult {
  tier1: ValeResult[];
  tier2: ValeResult[];
  spelling: ValeResult[];
  wordCount: number;
  processingTime: number;
}

// extractor.ts
interface ExtractionResult {
  content: string;
  lineMap: Map<number, number>;
  processingTime: number;
}

// watcher.ts
interface WatcherConfig {
  applicationsDir: string;
  debounceMs: number;
  maxRetries: number;
}
```

**3.3 Method Signature Updates**
Add parameter types to main methods (similar to keyword-extraction work):
```typescript
// Example method signature improvements
class TwoTierAnalyzer {
  async analyzeResume(jsonPath: string): Promise<AnalysisResult>
  extractSections(resume: any, jsonContent: string): AnalysisSection[]
  async runValeOnContent(content: string, sectionId: string): Promise<ValeResult[]>
}

class ResumeTextExtractor {
  extractText(jsonPath: string): ExtractionResult
  findLineInJSON(jsonContent: string, searchText: string): number
}
```

**3.4 ESLint Configuration Update**
Remove CommonJS special case rules since all files will be ESM:
```javascript
// Remove this section from eslint.config.mjs:
{
  files: ['services/vale-linting/**/*.js'],
  languageOptions: {
    sourceType: 'commonjs',
    // ... CommonJS globals
  }
}
```

## Success Criteria

### Quantitative Goals
- **keyword-extraction.ts**: 100% method signatures, 0 `any` types in business logic
- **document-generation.ts**: `ResumeData` interface replaces all `any` types
- **Vale service**: 9 files converted to ESM + basic TypeScript interfaces
- **ESLint violations**: Reduce by removing CommonJS complexity
- **All tests passing**: No functionality regressions

### Qualitative Goals  
- **Agent DX**: IntelliSense works for all service method calls
- **System consistency**: Single module system (ESM only)
- **Maintainability**: Clear data types at service boundaries
- **Architecture preserved**: No structural changes to working code

## Risk Mitigation

### Low-Risk Approach
- **Type-only changes**: No logic modifications
- **Preserve APIs**: All existing method signatures maintained
- **Incremental testing**: Test after each service completion
- **Git checkpoints**: Commit after each phase

### Validation Strategy
- Run existing tests after each change
- Verify TypeScript compilation passes
- Check ESLint violations don't increase
- Test with babylist application for integration verification

## Timeline

- **Phase 1**: keyword-extraction.ts typing (2 hours)
- **Phase 2**: document-generation.ts interface addition (1 hour)  
- **Phase 3**: Vale service ESM + TypeScript conversion (2 hours)

**Total**: 5 hours for comprehensive service TypeScript enhancement

## Definition of Done

- [ ] All service methods have explicit parameter types
- [ ] Zero `any` types in critical data flow boundaries
- [ ] All files use ESM (no CommonJS remaining)
- [ ] TypeScript compilation passes without errors
- [ ] All existing tests pass
- [ ] ESLint violations stable or reduced
- [ ] Agent IntelliSense works for all major service calls
- [ ] System maintains single module system consistency

This lean approach enhances developer/agent experience while respecting working architecture and avoiding over-engineering patterns.