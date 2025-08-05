# PRD: TypeScript Hiring Evaluation Service Completion

## Problem Statement

The hiring evaluation service files were hastily converted from JavaScript to TypeScript during linting cleanup, resulting in "functional but not type-safe" code. The current state provides compilation but loses most TypeScript benefits and maintainability.

**Current Issues:**
- **Large monolithic files** (evaluation-runner.ts: 400+ lines, evaluation-processor.ts: 554 lines)
- **Excessive `any` types** defeating TypeScript's purpose
- **Missing method signatures** throughout most functions
- **No runtime type validation** for external data (HTTP responses, file parsing)
- **Poor separation of concerns** within large classes

## Affected Files Analysis

### 1. `evaluation-runner.ts` (400+ lines)
**Current Violations**: 1 linting issue
**Type Safety Issues:**
- HTTP client responses typed as `any`
- File parsing results untyped
- Ollama API responses untyped
- Methods like `callOllama()`, `loadFile()`, `parseSimpleYaml()` lack signatures

**Structural Issues:**
- Single class handles HTTP client, file I/O, YAML parsing, prompt generation, and evaluation orchestration
- Mixed concerns: infrastructure (HTTP) + business logic (evaluation)
- No error type definitions

**Investigation Needed:**
- What does Ollama API actually return? (Need to capture real responses)
- What file formats are being parsed? (Resume JSON, YAML personas)
- Can HTTP client be extracted to separate module?

### 2. `evaluation-processor.ts` (554 lines)
**Current Violations**: 1 linting issue  
**Type Safety Issues:**
- `qualitative: any` in Insights interface
- Method parameters lack types: `extractQualitativeInsights(evaluations, processedData)`
- Complex nested data structures untyped
- String processing and regex operations untyped

**Structural Issues:**
- Single class handles scoring, analysis, markdown generation, and insight extraction
- 400+ line methods for report generation
- Heavy string concatenation could be templated

**Investigation Needed:**
- What's the actual structure of `evaluations` parameter? (6-persona evaluation format)
- Can report generation be extracted to template system?
- What qualitative insights are actually extracted? (Need examples)

### 3. `generate-prompt.ts` (108 lines)
**Current Violations**: Minimal
**Type Safety Issues:**
- YAML parsing returns loosely typed objects
- Regex-based parsing brittle and unvalidated

**Structural Issues:**
- Acceptable size, but YAML parsing logic could be more robust
- String template building could use proper templating

### 4. `keyword-extractor.ts` (228 lines)
**Current Violations**: Minimal
**Type Safety Issues:**
- Similarity calculation methods untyped
- Domain assignment logic complex and untyped

**Structural Issues:**
- Reasonable size and single responsibility
- Semantic similarity logic could be extracted for reuse

## Implementation Strategy

### Phase 1: Type Discovery & Interface Definition (2 days)
**Goal**: Understand and define proper types for all data structures

1. **Runtime Type Capture**
   - Add temporary logging to capture actual Ollama API responses
   - Document real evaluation data structures from 6-persona runs
   - Map file formats (resume JSON schema, persona YAML structure)

2. **Interface Definition**
   ```typescript
   // Target interfaces to create:
   interface OllamaResponse {
     model: string;
     response: string;
     // ... actual structure
   }
   
   interface PersonaEvaluation {
     persona: string;
     scores: Record<string, CriterionScore>;
     overall_assessment: AssessmentSummary;
   }
   
   interface CriterionScore {
     score: number;
     reasoning: string;
   }
   ```

3. **Error Type System**
   ```typescript
   type EvaluationError = 
     | { type: 'OLLAMA_UNAVAILABLE'; message: string }  
     | { type: 'INVALID_RESPONSE'; response: unknown }
     | { type: 'FILE_READ_ERROR'; path: string; cause: Error }
   ```

### Phase 2: Structural Refactoring (3 days)
**Goal**: Break down monolithic classes following Single Responsibility Principle

1. **evaluation-runner.ts Decomposition**
   ```typescript
   // Split into:
   class OllamaClient {
     async callModel(prompt: string, options: ModelOptions): Promise<OllamaResponse>
   }
   
   class PersonaPromptGenerator {
     generatePrompt(personaKey: string, context: EvaluationContext): string
   }
   
   class EvaluationOrchestrator {
     async runEvaluation(candidateName: string): Promise<EvaluationResult>
   }
   
   class FileSystemAdapter {
     loadFile(path: string): Promise<string>
     parseYaml(content: string): PersonaConfig
   }
   ```

2. **evaluation-processor.ts Decomposition**
   ```typescript
   // Split into:
   class ScoreCalculator {
     calculateWeightedComposite(data: ProcessedPersonaData[]): number
   }
   
   class InsightExtractor {
     extractQualitativeInsights(evaluations: PersonaEvaluation[]): QualitativeInsights
   }
   
   class ReportGenerator {
     generateMarkdownSummary(data: EvaluationSummaryData): string
   }
   ```

### Phase 3: Type Implementation & Validation (2 days)
**Goal**: Apply strict typing throughout and add runtime validation

1. **Method Signature Completion**
   - Type all method parameters and return values
   - Remove all `any` types
   - Add generic constraints where appropriate

2. **Runtime Validation**
   ```typescript
   // Add validation for external data
   function validateOllamaResponse(response: unknown): OllamaResponse {
     // Runtime type checking with clear error messages
   }
   
   function validatePersonaEvaluation(data: unknown): PersonaEvaluation {
     // Validate 6-persona evaluation structure
   }
   ```

3. **Error Handling Improvement**
   - Replace generic Error throws with typed error unions
   - Add error context and recovery suggestions

## Success Criteria

### Quantitative Goals
- **Reduce file sizes**: evaluation-runner.ts <250 lines, evaluation-processor.ts <300 lines
- **Eliminate `any` types**: 0 remaining `any` types in core business logic
- **Type coverage**: 100% of public methods have complete type signatures
- **Linting violations**: <5 per file (down from current minimal but could increase during refactor)

### Qualitative Goals
- **Agent-friendly code**: Clear single-responsibility classes that are easy to understand and modify
- **Runtime safety**: External data validated with helpful error messages
- **Maintainable structure**: New features can be added without modifying multiple concerns

## Investigation Priorities

### High Priority (Must Resolve)
1. **Ollama API Response Structure**: What does a real evaluation response look like?
2. **6-Persona Evaluation Format**: Document the exact structure of evaluation arrays
3. **File Format Schemas**: What are the actual resume JSON and persona YAML schemas?

### Medium Priority (Should Investigate)
1. **Error Scenarios**: What failure modes exist in production? (Network, file access, parsing)
2. **Performance Bottlenecks**: Are there memory/CPU issues with large evaluations?
3. **Configuration Management**: How are model settings and persona weights managed?

### Low Priority (Nice to Have)
1. **Template System**: Could report generation use a proper template engine?
2. **Caching Strategy**: Should evaluation results be cached?
3. **Metrics Collection**: What evaluation metrics should be tracked?

## Risks & Mitigation

### High Risk
- **Breaking existing functionality** during refactoring
  - *Mitigation*: Maintain existing public APIs, add comprehensive tests first

### Medium Risk  
- **Unknown external dependencies** on current behavior
  - *Mitigation*: Document all public methods before changes, use feature flags

### Low Risk
- **Performance regression** from additional type checking
  - *Mitigation*: Benchmark before/after, runtime validation only in dev mode

## Timeline

- **Week 1**: Phase 1 (Type Discovery) - 2 days
- **Week 2**: Phase 2 (Structural Refactoring) - 3 days  
- **Week 3**: Phase 3 (Type Implementation) - 2 days

**Total**: 7 days for complete TypeScript transformation with proper architecture

## Definition of Done

- [ ] All files <300 lines with single responsibility
- [ ] Zero `any` types in business logic
- [ ] 100% method signature coverage
- [ ] Runtime validation for all external data
- [ ] Comprehensive error type system
- [ ] All existing tests passing
- [ ] Integration tests for refactored components
- [ ] Documentation for new class structure

This transformation will make the hiring evaluation service truly type-safe, maintainable, and agent-friendly while preserving all existing functionality.