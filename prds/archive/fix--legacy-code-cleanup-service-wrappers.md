# Legacy Code Cleanup: Service Wrappers PRD

## Executive Summary

Phase 4 of the standardized polyglot architecture aimed to achieve "Clean Codebase: Legacy code removed, clear separation of concerns established." While service standardization was implemented, the cleanup phase was never completed, leaving substantial technical debt in all service wrappers.

**Current Problem**: All service wrappers maintain dual `executeLegacy*()` and `executeStandardized*()` implementations that perform identical operations, creating unnecessary complexity and maintenance burden.

## Problem Statement

### Critical Issue Discovery
Analysis of service wrappers reveals that **legacy code removal was not completed** after standardization:

1. **Hiring Evaluation Service**: `executeLegacyEvaluation()` and `executeStandardizedEvaluation()` both use identical `EvaluationRunner` API
2. **Document Generation Service**: Both legacy and standardized methods call same `documentOrchestrator` functions  
3. **Vale Linting Service**: Legacy method just calls standardized method (line 110)
4. **Keyword Analysis Service**: Standardized method just calls legacy method (line 153)

### Impact on Development
- **Code Duplication**: Identical logic maintained in multiple methods
- **Misleading Architecture**: "Legacy" implementations aren't actually legacy
- **Feature Flag Overhead**: Complex branching logic for non-existent differences
- **Maintenance Burden**: Changes require updates in multiple locations
- **Cognitive Load**: Developers must understand unnecessary complexity

### Technical Debt Metrics
- **4 service wrappers** with dual implementation patterns
- **~200 lines of duplicated code** across services
- **8+ unnecessary methods** that can be removed
- **Feature flag infrastructure** serving no actual purpose

## Solution Overview

**Objective**: Complete the legacy code cleanup that should have been part of Phase 4, achieving true "clean codebase" status.

**Approach**: Remove all `executeLegacy*()` methods and feature flag branching logic, keeping only the working implementations.

## Implementation Plan

### Phase 1: Prepare for Cleanup (Session 1)
**Foundation**: Existing comprehensive test suite provides safety net for aggressive cleanup.

**Objectives**:
- Create rollback point with git tag
- Validate current test coverage covers all service functionality
- Document which implementations are actually being used in production

**Deliverables**:
- **Git Tag**: Create `pre-legacy-cleanup` tag for instant rollback
- **Test Coverage Validation**: Confirm all service methods covered by tests
- **Usage Analysis**: Document actual feature flag states and method calls

**Acceptance Criteria**:
- All existing tests pass before cleanup begins
- Git tag created for safe rollback
- Documentation shows which methods are actually in use

### Phase 2: Service-by-Service Legacy Removal (Sessions 1-2)

**Strategy**: Remove legacy code one service at a time with validation between each step.

#### Service Cleanup Order:
1. **Vale Linting Service** (Lowest Risk)
   - Legacy method already just calls standardized method
   - Simple removal with minimal impact

2. **Keyword Analysis Service** (Medium Risk)
   - Standardized method calls legacy - reverse the relationship
   - Update to use direct Python service integration

3. **Document Generation Service** (Medium Risk)
   - Both methods call same orchestrator functions
   - Consolidate to single implementation path

4. **Hiring Evaluation Service** (Highest Risk)
   - Most complex service with multiple workflow paths
   - Critical for evaluation functionality

#### Per-Service Cleanup Process:
1. **Remove Legacy Method**: Delete `executeLegacy*()` method entirely
2. **Rename Standardized Method**: Remove "Standardized" prefix from method name
3. **Remove Feature Flag Logic**: Delete `shouldUseLegacyImplementation()` calls
4. **Update Method Calls**: Ensure all calls go to simplified method
5. **Run Full Test Suite**: Validate no functionality lost
6. **Create Git Commit**: Checkpoint each service cleanup

### Phase 3: Infrastructure Cleanup (Session 2)

**Objectives**:
- Remove feature flag infrastructure from base wrapper class
- Clean up feature flag configuration files
- Update service registry to remove legacy concepts

**Deliverables**:
- **BaseServiceWrapper Cleanup**: Remove `shouldUseLegacyImplementation()` method
- **Feature Flag Removal**: Delete service-specific feature flags
- **Constructor Simplification**: Remove feature flag parameters from wrapper constructors
- **Documentation Updates**: Update SERVICE_STANDARDS.md to reflect clean architecture

### Phase 4: Test Suite Updates (Session 2)

**Objectives**:
- Remove tests that validate legacy vs standardized behavior differences
- Simplify test assertions to focus on functional correctness
- Update integration tests to remove dual-implementation checks

**Deliverables**:
- **Test Cleanup**: Remove legacy implementation validation tests
- **Assertion Simplification**: Focus tests on service functionality, not implementation details
- **Integration Test Updates**: Remove feature flag testing from service wrapper tests

## Technical Implementation Details

### Code Removal Strategy
```javascript
// BEFORE (complex dual implementation)
async evaluate(input) {
  const useLegacy = this.shouldUseLegacyImplementation();
  if (useLegacy) {
    return await this.executeLegacyEvaluation(input, startTime);
  } else {
    return await this.executeStandardizedEvaluation(input, startTime);
  }
}

// AFTER (clean single implementation)
async evaluate(input) {
  return await this.executeEvaluation(input, startTime);
}
```

### Feature Flag Cleanup
- Remove `STANDARDIZED_*` flags from feature-flags.js
- Delete `.feature-flags.json` service-specific configuration
- Remove feature flag checks from BaseServiceWrapper

### Method Naming Convention
- Keep the working implementation (usually "standardized")
- Rename to remove implementation-specific prefixes
- Use clear, functional method names (e.g., `executeEvaluation`, `executeGeneration`)

## Risk Assessment & Mitigation

### Low Risk Elements
- **Test Coverage**: Comprehensive existing test suite validates functionality
- **Git Safety**: Full rollback capability with tagged checkpoint
- **Incremental Approach**: One service at a time with validation between steps

### Medium Risk Elements
- **Integration Dependencies**: Other services may expect specific method signatures
- **CLI Interface**: Generate-resume.js may rely on specific wrapper behavior

### Mitigation Strategies
- **Pre-cleanup Testing**: Run full test suite before any changes
- **Service-by-service Validation**: Complete test validation after each service cleanup
- **Git Checkpoints**: Commit after each successful service cleanup
- **Rollback Plan**: Tagged checkpoint enables instant reversion if issues arise

## Success Metrics

### Quantitative Goals
- **Code Reduction**: Remove ~200 lines of duplicated legacy code
- **Method Reduction**: Remove 8+ unnecessary legacy methods
- **Complexity Reduction**: Remove feature flag branching from all service calls
- **Test Simplification**: Remove ~20 legacy implementation test assertions

### Qualitative Goals
- **Clear Architecture**: Single implementation path per service operation
- **Reduced Cognitive Load**: Developers work with simpler, more direct code
- **True "Clean Codebase"**: Achieve Phase 4 objective that was never completed
- **Maintainability**: Future service changes require updates in one location only

## Timeline & Dependencies

**Total Duration**: 2 sessions
**Dependencies**: Existing comprehensive test suite (already in place)

### Session Breakdown
- **Session 1**: Preparation, Vale & Keyword Analysis cleanup
- **Session 2**: Document Generation & Hiring Evaluation cleanup, infrastructure cleanup, test updates

## Expected Outcomes

### Immediate Benefits
- **Simplified Service Architecture**: Clear, single implementation paths
- **Reduced Maintenance**: Changes only need to be made once
- **Improved Code Readability**: No more confusing legacy vs standardized distinctions

### Long-term Benefits
- **Foundation for TypeScript Migration**: Clean JavaScript codebase ready for type system
- **Easier Onboarding**: New developers see straightforward service implementations
- **Architectural Clarity**: True separation of concerns without artificial complexity

## Conclusion

This PRD addresses the unfinished business from Phase 4 of the standardized polyglot architecture. By removing the accumulated technical debt from incomplete legacy cleanup, we achieve the "clean codebase" that was the original objective.

**Key Insight**: The standardization work was successful - now we need to complete it by removing the scaffolding that's no longer needed.