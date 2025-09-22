# Codebase Intuitive Organization PRD
**Problem:** Module organization and function placement patterns that hinder developer productivity and code maintainability

---

## Notes

**Context:** During recent development work, patterns emerged showing that the current codebase organization creates cognitive overhead for developers. Functions are not located where developers intuitively expect them, and module boundaries are unclear. This PRD addresses systematic reorganization to improve developer experience and code maintainability.

**Scope:** This focuses on Node.js application structure in `/app` directory. Does not address Python services or data organization.

**Priority:** Medium-High - Affects all future development but not blocking critical functionality.

---

## Problem Statement

### Core Issues

The resumagic codebase suffers from **poor module organization** that creates significant developer friction:

1. **Functions in unexpected locations** - Business logic mixed with parsing utilities
2. **Unclear module boundaries** - No clear separation between CLI, business logic, and service layers  
3. **Mixed concerns** - Single files handling multiple unrelated responsibilities
4. **Organic growth pattern** - Code placed by implementation convenience rather than logical organization

### Impact on Development

- **Increased cognitive load** - Developers must hunt across multiple files to find related functionality
- **Reduced productivity** - Time spent searching for functions instead of implementing features
- **Poor maintainability** - Changes require understanding scattered code locations
- **Difficult onboarding** - New developers cannot intuitively navigate the codebase

### Specific Examples

| Function | Current Location | Expected Location | Issue |
|----------|------------------|-------------------|-------|
| `determineGenerationPlan()` | `cli-parser.js` | Generation planning module | Business logic in parsing module |
| Path resolution functions | Scattered across files | Single path module | Related functions separated |
| CLI command logic | Mixed with parsing | Dedicated commands module | Concerns not separated |

## Current Architecture Analysis

### Existing Structure Problems

```
app/
├── cli-parser.js              # Contains both parsing AND business logic
├── path-resolver.js           # Only some path functions
├── generate-resume.js         # CLI entry point with embedded logic
├── document-orchestrator.js   # Core logic mixed with implementation
└── services/wrappers/         # Clean service layer (good example)
```

### Root Causes

1. **Historical Growth** - Code added where convenient, not where logical
2. **No Architectural Guidelines** - Lack of clear module responsibility principles
3. **Mixed Abstraction Levels** - CLI, business, and service logic intermingled
4. **Convenience Over Design** - Functions placed where first needed

## Proposed Solution

### Target Architecture

```
app/
├── cli/                       # CLI-specific concerns
│   ├── argument-parser.js     # Pure CLI argument parsing
│   ├── commands.js           # CLI command implementations
│   └── interface.js          # CLI output and user interaction
├── core/                     # Core business logic
│   ├── generation-planning.js # Generation plan logic and validation
│   ├── path-resolution.js    # All path-related functionality
│   ├── document-orchestration.js # Main orchestration logic
│   └── template-processing.js # Document template handling
├── services/                 # Service layer (existing structure)
│   └── wrappers/            # Keep existing service wrappers
├── utils/                    # Pure utility functions
│   ├── error-handling.js    # Error utilities
│   ├── file-operations.js   # File system utilities
│   └── validation.js        # Input validation utilities
└── __tests__/               # Tests organized by module
    ├── cli/
    ├── core/
    └── services/
```

### Module Responsibilities

#### CLI Layer (`/cli`)
- **Purpose**: Handle command-line interface concerns only
- **Responsibilities**: Argument parsing, command routing, user output
- **Dependencies**: Calls core modules for business logic

#### Core Layer (`/core`) 
- **Purpose**: Business logic and domain operations
- **Responsibilities**: Generation planning, orchestration, path resolution
- **Dependencies**: Independent of CLI and service layers

#### Service Layer (`/services`)
- **Purpose**: API interfaces and external service wrappers
- **Responsibilities**: Standardized service interfaces, error handling
- **Dependencies**: Calls core modules for business operations

#### Utils Layer (`/utils`)
- **Purpose**: Pure utility functions
- **Responsibilities**: Reusable helper functions with no business logic
- **Dependencies**: No dependencies on other application modules

## Implementation Plan

### Phase 1: Create New Structure (Week 1)
- Create new directory structure
- Define module interfaces and exports
- Document module responsibilities

### Phase 2: Migrate Core Functions (Week 2)
- Move `determineGenerationPlan()` to `core/generation-planning.js`
- Consolidate path functions in `core/path-resolution.js`
- Separate CLI parsing from business logic

### Phase 3: Update Dependencies (Week 3)
- Update imports across codebase
- Modify tests to use new module structure
- Update documentation

### Phase 4: Cleanup and Validation (Week 4)
- Remove old files
- Validate all functionality works
- Update developer documentation

## Benefits

### Developer Experience
- **Intuitive Navigation** - Functions located where logically expected
- **Faster Development** - Reduced time searching for code
- **Easier Onboarding** - Clear module structure for new developers

### Code Quality
- **Better Separation of Concerns** - Clear module boundaries
- **Improved Testability** - Isolated modules easier to test
- **Enhanced Maintainability** - Changes have clear impact boundaries

### Architecture
- **Scalable Structure** - Clear patterns for adding new functionality
- **Consistent Organization** - Predictable code organization patterns
- **Better Documentation** - Module purposes are self-evident

## Success Metrics

- **Developer Survey** - Time to find functions reduced by 50%
- **Code Navigation** - Related functions co-located in same modules
- **Test Organization** - Tests mirror module structure
- **Documentation Quality** - Module purposes clear without explanation

## Risks and Mitigation

### Risk: Breaking Changes During Migration
**Mitigation**: Gradual migration with temporary compatibility exports

### Risk: Developer Resistance to Change
**Mitigation**: Clear documentation of benefits and migration guide

### Risk: Test Suite Disruption
**Mitigation**: Update tests incrementally, maintain test coverage

## Alignment with Existing Initiatives

This reorganization aligns with the **Standardized Polyglot Architecture** initiative:

- **Phase 1: Interface Standardization** - Clear module boundaries
- **Phase 2: Pattern Consolidation** - Consistent organization patterns
- **Phase 3: Documentation & Tooling** - Discoverable module structure

The reorganization can be integrated into existing architecture work without conflicting priorities.

## Conclusion

The current codebase organization creates unnecessary developer friction through poor module boundaries and unexpected function placement. Systematic reorganization into intuitive, domain-based modules will significantly improve developer productivity, code maintainability, and onboarding experience.

This represents technical debt that should be addressed proactively to prevent further accumulation and maintain development velocity as the codebase grows.
