# PRD: ESLint Technical Debt Cleanup

## Problem Statement

The codebase has 1,441 linting violations (587 errors, 869 warnings) that are hindering development productivity and code maintainability. The primary issues are:

- **725 `no-console` violations** - Excessive debug logging
- **483 TypeScript unsafe operations** - Heavy use of `any` types 
- **107 `no-undef` violations** - Missing imports/declarations
- **78 `no-unused-vars` violations** - Dead code

The most problematic files are core processing modules (`services/keyword-extraction.ts`, `core/markdown-processing.ts`, `core/document-orchestration.ts`) and experimental test files.

## Solution Approach

Following the [Agentic Refactoring Guide](../docs/agentic-refactoring-guide.md), we will focus on **SUBTRACTION of complexity**, not addition of systems. The approach prioritizes making code boring, predictable, and agent-friendly.

## Implementation Phases

### Phase 1: Quick Wins (Low Risk, High Impact)
**Goal**: Reduce violations by 60% without changing functionality

1. **Remove Debug Console Logs** (~725 violations)
   - Search for `console.log`, `console.warn`, `console.error` in production code
   - Keep only essential user-facing messages
   - Test: Run existing tests after each file cleanup

2. **Remove Dead Code** (~78 violations)
   - Use `grep -r "functionName" .` to verify usage before deletion
   - Delete unused variables, imports, functions
   - Test: Lint and run tests after each cleanup

3. **Fix Missing Imports** (~107 violations)
   - Add proper import statements for undefined variables
   - Prefer explicit imports over global assumptions
   - Test: TypeScript compilation after each fix

### Phase 2: TypeScript Safety (Medium Risk, High Value)
**Goal**: Replace `any` types with proper typing

1. **Start with Leaf Nodes** (files with fewest dependencies)
   - Begin with utility functions and formatters
   - Add explicit return types and parameter types
   - Test: Existing functionality unchanged

2. **Work Up Dependency Chain** 
   - Fix `services/keyword-extraction.ts` (100 violations)
   - Fix `core/markdown-processing.ts` (84 violations)
   - Fix `core/document-orchestration.ts` (69 violations)
   - Test: Integration tests pass after each major file

3. **Define Clear Interfaces**
   - Create types for common data structures (CandidateData, ResumeDocument, etc.)
   - Avoid over-engineering - only type what's actually used
   - Test: Type checking passes

### Phase 3: Experimental Code Cleanup (Low Priority)
**Goal**: Clean up test/experiment files that inflate violation counts

1. **Move Experiment Files** out of main linting scope
   - Consider moving `services/hiring-evaluation/` experiments to separate directory
   - Add to ESLint ignore if they're truly experimental
   - Test: Core application unaffected

## Success Criteria

### Quantitative Goals
- **Reduce total violations from 1,441 to <200** (86% reduction)
- **Eliminate all `error` level violations** (currently 587)
- **Keep warnings under 200** (currently 869)
- **Maintain 100% test pass rate** throughout cleanup

### Qualitative Goals
- **Agent-friendly codebase**: New agents can navigate and modify code easily
- **Predictable patterns**: Similar problems solved in similar ways
- **Obvious file locations**: Clear where to find and add functionality

## Implementation Guidelines

### The Five Critical Tests (from Agentic Guide)
1. **Grep Test**: `grep "generateResume"` finds one clear function
2. **Obvious Location Test**: Theme changes go in `theme.ts`  
3. **15-Minute Human Test**: Changes understandable in 15 minutes
4. **Agent Onboarding Test**: Codebase explainable in 3 sentences
5. **Rollback Test**: Changes undoable in 5 minutes

### Safety Protocols
- **Test after every file**: Run `npm test` after cleaning each file
- **Commit frequently**: Commit working state after every 5-10 files cleaned
- **Verify functionality**: Ensure document generation still works
- **No framework additions**: Use existing patterns, don't create new abstractions

### Red Flags to Avoid
- ❌ Creating interfaces for things that will never be swapped
- ❌ Building "reusable" components for single use cases  
- ❌ Adding configuration for things that never change
- ❌ Creating abstractions to "future-proof" the code

## Rollback Plan

If any phase breaks functionality:
1. **Immediate**: `git revert` to last working commit
2. **File-level**: Restore specific file from git history
3. **Phase-level**: Reset entire phase and restart with smaller increments

## Timeline

- **Phase 1 (Quick Wins)**: 1-2 days
- **Phase 2 (TypeScript Safety)**: 3-5 days  
- **Phase 3 (Experimental Cleanup)**: 1 day

**Total**: 5-8 days for complete cleanup

## Definition of Done

- [ ] ESLint runs in <30 seconds (no timeouts)
- [ ] <200 total linting violations
- [ ] 0 error-level violations
- [ ] All existing tests pass
- [ ] Document generation functionality unchanged
- [ ] Agent can complete common tasks (generate resume, analyze keywords) without getting lost in codebase

## Meta-Rule Compliance

> **If your refactoring makes the code harder for a new agent to understand, you're going in the wrong direction.**

Every change will be evaluated against this principle. Code should become more boring, obvious, and predictable - not more flexible or "better designed."