# Phase 4 Developer Handoff Guide

## Overview

This guide provides the critical implementation details needed to successfully execute Phase 4: Service Migrations. Read this **before** starting any service migration work to avoid common pitfalls and ensure architectural consistency.

## Current Service Architecture Map

### Service Communication Patterns

**Current State (Pre-Phase 4):**
```
CLI (generate-resume.js)
├── Document Orchestrator
│   ├── Document Generation (direct function calls)
│   ├── Keyword Analysis (shell: python script)
│   └── Hiring Evaluation (shell: node script)
└── Service Wrappers (Phase 2)
    ├── KeywordAnalysisWrapper → shell execution
    ├── HiringEvaluationWrapper → direct imports
    └── DocumentGenerationWrapper → direct function calls
```

**Target State (Post-Phase 4):**
```
CLI (generate-resume.js)
├── Document Orchestrator 
│   └── Service Registry → Standardized Adapters
│       ├── KeywordAnalysisAdapter (JSON API)
│       ├── HiringEvaluationAdapter (JSON API)
│       └── DocumentGenerationAdapter (JSON API)
└── Feature Flags control legacy vs standardized implementations
```

### Critical Integration Points

1. **CLI Entry Point**: `generate-resume.js` calls `document-orchestrator.js`
2. **Service Registry**: `services/wrappers/service-registry.js` provides unified service access
3. **Error Handling**: `utils/error-handler.js` must receive standardized error formats
4. **Feature Flags**: Existing `feature-flags.js` controls implementation selection

## Service-Specific Implementation Guidance

### 1. Keyword Analysis Service (Python)

**Current Integration:**
- File: `services/keyword-analysis/kw_rank_modular.py`
- Input: Markdown file path
- Output: `keyword_analysis.json` file
- Execution: Shell command via `execAsync`

**Migration Approach:**
```javascript
// Legacy wrapper - keep it simple
async executeLegacyService(input) {
  const { jobDescription, jobPostingPath } = input;
  
  // Write temp file if needed
  const inputFile = jobPostingPath || this.createTempFile(jobDescription);
  
  // Execute Python script (existing pattern)
  await execAsync(`python services/keyword-analysis/kw_rank_modular.py "${inputFile}"`);
  
  // Read result file
  const result = JSON.parse(fs.readFileSync('keyword_analysis.json', 'utf8'));
  return this.formatOutput(result);
}
```

**🚨 Trap to Avoid:** Don't try to rewrite the Python logic in JavaScript. Just wrap the shell execution cleanly.

### 2. Hiring Evaluation Service (Node.js)

**Current Integration:**
- File: `services/hiring-evaluation/evaluation-runner.js`
- Input: Application name, candidate name
- Output: Evaluation JSON
- Execution: Direct import or shell command

**Migration Approach:**
```javascript
// Legacy wrapper - use existing imports
async executeLegacyService(input) {
  const { applicationName, candidateName, fastMode } = input;
  
  // Import existing service
  const EvaluationRunner = (await import('../services/hiring-evaluation/evaluation-runner.js')).default;
  const runner = new EvaluationRunner(applicationName);
  
  // Use existing methods
  return await runner.run(candidateName);
}
```

**🚨 Trap to Avoid:** The LLM integration is complex (retries, timeouts, model switching). Don't optimize this - just wrap the existing logic.

### 3. Document Generation Service (Node.js)

**Current Integration:**
- File: `document-orchestrator.js` → `docx-template.js`
- Input: Resume data, template settings
- Output: DOCX file buffer
- Execution: Direct function calls

**Migration Approach:**
```javascript
// Legacy wrapper - use existing functions
async executeLegacyService(input) {
  const { resumeData, templateSettings, outputPath } = input;
  
  // Import existing functions
  const { generateResumeDocument } = await import('../document-orchestrator.js');
  
  // Use existing document generation
  return await generateResumeDocument(resumeData, templateSettings, outputPath);
}
```

**🚨 Trap to Avoid:** Document generation has complex template merging. Don't reimplement - wrap the existing `document-orchestrator.js` functions.

## Integration with Existing Systems

### Service Wrapper Compatibility

**Key Decision: Adapters Replace Wrappers**
- New adapters (`*-adapter.js`) replace existing wrappers (`services/wrappers/*-wrapper.js`)
- Keep existing wrappers during migration for rollback capability
- Remove wrapper files after successful adapter validation

**Service Registry Integration:**
```javascript
// Update service-registry.js to use adapters when feature flag enabled
const keywordService = featureFlags.useStandardizedService('keywordAnalysis') 
  ? new KeywordAnalysisAdapter()
  : new KeywordAnalysisWrapper();
```

### Error Handling Integration

**Standard Error Format (matches existing error-handler.js):**
```javascript
// All adapters must return this format
{
  service: 'serviceName',
  success: false,
  error: {
    code: 'ERROR_TYPE',        // Must match existing error types
    message: 'Human readable', // For user display
    details: { /* context */ }  // For debugging
  },
  metadata: { duration_ms, timestamp }
}
```

**Error Code Mapping:**
- Use existing error types from `utils/error-types.js`
- Map service-specific errors to standard codes
- Preserve original error context in `details` field

### CLI Integration Points

**No CLI Changes Required:**
- Existing CLI workflows must work identically
- `--evaluate`, `--fast`, `--all` flags preserved
- Feature flags control implementation selection transparently

**Validation Command:**
```bash
# These must work identically before/after migration
node generate-resume.js elovate-director-product-management --fast
node generate-resume.js elovate-director-product-management --evaluate
node generate-resume.js elovate-director-product-management --all
```

## Common Pitfalls & How to Avoid Them

### 1. Golden Master Validation Issues

**Problem:** Golden masters fail due to timestamp differences
**Solution:** Use the normalizer to exclude timestamp fields
```javascript
// Exclude these field patterns from comparison
const timestampFields = ['timestamp', 'created_at', 'duration_ms', 'execution_time'];
```

**Problem:** File path differences in golden masters
**Solution:** Normalize file paths to relative paths
```javascript
// Convert absolute paths to relative for consistent comparison
const normalizedPath = path.relative(process.cwd(), absolutePath);
```

### 2. Async/Promise Handling

**Problem:** Legacy services use different async patterns
**Solution:** Standardize to async/await in adapters
```javascript
// Always wrap legacy callbacks or promises
async executeLegacyService(input) {
  try {
    const result = await legacyServiceCall(input);
    return result;
  } catch (error) {
    throw new Error(`Legacy service failed: ${error.message}`);
  }
}
```

### 3. File I/O and Temporary Files

**Problem:** Services create temporary files with different naming
**Solution:** Use consistent temp file patterns
```javascript
// Standard temp file approach
const tempDir = path.join(__dirname, 'tmp');
const tempFile = path.join(tempDir, `${service}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`);
```

### 4. Performance Regression Detection

**Problem:** No baseline performance metrics defined
**Solution:** Capture baselines before migration
```javascript
// Capture performance baselines
const performanceTest = {
  keywordAnalysis: { baseline: '2.5s', threshold: '3.0s' },
  hiringEvaluation: { baseline: '45s', threshold: '50s' },
  documentGeneration: { baseline: '1.2s', threshold: '1.5s' }
};
```

## Testing Strategy Details

### Golden Master Test Cases

**Per Service Required Test Cases:**

1. **Keyword Analysis:**
   - Job posting with 50+ keywords
   - Job posting with knockout requirements
   - Job posting with minimal content (edge case)

2. **Hiring Evaluation:**
   - Standard evaluation (full candidate data)
   - Fast mode evaluation
   - Evaluation with missing candidate data (error case)

3. **Document Generation:**
   - Full resume with all sections
   - Resume with missing optional sections
   - Resume with complex formatting (nested lists, etc.)

### Validation Workflow

**Before Implementation:**
```bash
# 1. Create golden master with legacy implementation
node [service]-adapter.js create-golden-master

# 2. Verify golden master captures expected behavior
node toolkit/golden-master-validator.js list
```

**During Implementation:**
```bash
# 3. Compare implementations iteratively
node [service]-adapter.js compare

# 4. Fix differences until identical
# Repeat steps 3-4 until validation passes
```

**After Implementation:**
```bash
# 5. Enable feature flag and test E2E
node toolkit/feature-flag-helper.js enable services.[service].useStandardizedWrapper
node generate-resume.js [test-application] --all

# 6. Run full test suite
npm test

# 7. Performance validation
npm run test:performance  # (create if needed)
```

## Success Criteria Checklist

### Per-Service Migration Complete When:

- [ ] Golden master validation shows identical outputs
- [ ] All existing tests pass (132/132)
- [ ] CLI workflows work identically (`--evaluate`, `--fast`, `--all`)
- [ ] Performance within acceptable thresholds
- [ ] Feature flag enables instant rollback
- [ ] Legacy code removed and adapters integrated

### Phase 4 Complete When:

- [ ] All three services migrated successfully
- [ ] Service registry uses adapters exclusively
- [ ] All wrapper files removed
- [ ] Documentation updated to reflect standardized interfaces
- [ ] No feature flags needed (or documented as permanent)

## Debugging and Validation Workflows

### When Golden Master Fails
```bash
# 1. Inspect differences
node [service]-adapter.js compare

# 2. Check for common issues
- Timestamp fields in output
- File path differences
- Async timing issues
- Error format mismatches

# 3. Update normalization if needed
# Edit golden-master-validator.js normalizeData() method
```

### When Performance Regresses
```bash
# 1. Profile both implementations
console.time('legacy-execution');
await executeLegacyService(input);
console.timeEnd('legacy-execution');

console.time('standardized-execution');
await executeStandardizedService(input);
console.timeEnd('standardized-execution');

# 2. Identify bottlenecks
# Look for unnecessary JSON serialization, file I/O, or network calls
```

### When E2E Tests Fail
```bash
# 1. Test service in isolation
node [service]-adapter.js test-standardized

# 2. Test service registry integration
node -e "import('./services/wrappers/service-registry.js').then(r => r.default.get('[service]').execute(testInput))"

# 3. Test CLI integration
node generate-resume.js [test-app] --verbose
```

## Key Files and Their Roles

### Critical Files to Understand:
- `generate-resume.js` - CLI entry point, must work identically
- `document-orchestrator.js` - Service coordination, integration point
- `services/wrappers/service-registry.js` - Service discovery and access
- `utils/error-handler.js` - Error format standards
- `feature-flags.js` - Implementation selection control

### Files You'll Create:
- `keyword-analysis-adapter.js` - Already exists as proof of concept
- `hiring-evaluation-adapter.js` - New file to create
- `document-generation-adapter.js` - New file to create

### Files You'll Modify:
- `services/wrappers/service-registry.js` - Add adapter integration
- `document-orchestrator.js` - Use registry instead of direct calls (if needed)

## Final Notes

**Remember:** The goal is **interface standardization**, not business logic rewriting. When in doubt, wrap existing functionality rather than reimplementing it. The TypeScript migration in Phase 6 will handle code quality improvements - Phase 4 is purely about consistent interfaces.

**Focus on:** JSON-in/JSON-out consistency, error format standardization, and feature flag control. Everything else is secondary.

**Success Metric:** All CLI workflows work identically, but internally use standardized service interfaces.