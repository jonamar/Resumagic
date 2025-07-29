# Standardized Polyglot Architecture PRD

## Executive Summary

Transform the current multi-language service architecture into a **standardized polyglot system** optimized for AI-agent development with unified interfaces, consistent patterns, and minimal cognitive overhead while preserving technical optimality.

## Product Vision & Priorities

### Core Product Values
- **Simplicity**: Single entry point, consistent patterns, minimal decision fatigue
- **Modularity**: Clear service boundaries with well-defined responsibilities  
- **Accessibility**: AI-agent friendly with predictable interfaces and error handling
- **Maintainability**: Standardized patterns prevent architectural drift
- **Performance**: Right tool for right job - no technical compromises

### Target Developer Experience
**Primary Users**: AI coding agents (Claude, GPT, etc.)
**Secondary Users**: Human developers onboarding to the system

**Key Experience Goals**:
- **Single Interface**: One CLI command handles all operations
- **Predictable Patterns**: Consistent error handling, configuration, and communication
- **Clear Documentation**: Self-documenting architecture with obvious entry points
- **Fast Feedback**: Rapid development cycles with unified testing and validation

## Problem Statement

The current architecture exhibits **polyglot sprawl** rather than **polyglot design**:

### Current Pain Points
- **Multiple CLI Patterns**: `node generate-resume.js` vs `python kw_rank_modular.py` vs future Go commands
- **Inconsistent Error Handling**: Each service handles failures differently despite centralized error work
- **Mixed Communication Patterns**: File system, shell execution, JSON APIs - no standard
- **Configuration Drift**: Different config approaches across services
- **Testing Fragmentation**: Separate test runners and patterns per language
- **Documentation Scatter**: Service-specific docs with no unified architectural view

### Impact on AI Agents
- **Context Switching Overhead**: Agents must learn multiple patterns for similar operations
- **Error Handling Complexity**: Inconsistent error formats require different handling logic
- **Integration Uncertainty**: Unclear service boundaries and communication protocols
- **Debugging Difficulty**: Multiple logging formats and error reporting styles

## Solution Overview

**One Interface, Multiple Engines**: Standardized polyglot architecture that embraces multi-language strengths while providing unified developer experience.

### Architectural Philosophy
- **Language Optimization**: Each service uses the optimal technology for its domain
- **Interface Standardization**: All services expose identical JSON-based APIs
- **Pattern Consistency**: Unified error handling, configuration, and communication
- **Single Entry Point**: All operations flow through one CLI interface

## Success Criteria

### Developer Experience Metrics
- **Single CLI Command**: All operations accessible via `generate-resume.js` with consistent flags
- **Unified Error Taxonomy**: Cross-language error codes with consistent structure
- **Standard Configuration**: Single config system across all services
- **Consistent Testing**: One test runner handles all languages and produces unified reports
- **Documentation Unity**: Single source of truth for all architectural patterns

### Technical Performance Metrics
- **No Performance Regression**: Maintain or improve current processing times
- **Service Reliability**: >99% success rate with graceful error handling
- **Development Velocity**: <5 minute setup for new AI agents
- **Pattern Consistency**: 100% of services follow standard interface contracts

## Implementation Plan

### Phase 1: Extend Existing CI/CD for Standardization Safety (Session 1)

**Foundation Already in Place:**
- ✅ **Comprehensive Test Suite**: 124 tests (96 JS + 28 Python) with unified coverage
- ✅ **CI/CD Pipeline**: 6-second validation with automated testing
- ✅ **Pre-commit Hook**: `/scripts/ci/pre-commit.sh` with linting validation
- ✅ **Cross-Language Testing**: Jest (JS) + pytest (Python) integration
- ✅ **Error Handling Infrastructure**: Unified error taxonomy and handling

**Objectives:**
- Extend existing CI/CD infrastructure for standardization refactor safety
- Add golden master test suite for behavioral validation
- Implement feature flag system for safe service migration
- Enhance pre-commit validation for comprehensive safety

**Deliverables:**
- **Golden Master Test Suite**: Capture current workflow outputs as regression baseline
- **Feature Flag System**: Toggle between legacy and standardized service implementations
- **Enhanced Pre-commit Validation**: Extend existing hook with golden master and performance checks
- **Performance Regression Detection**: Automated baseline comparison for service migrations

**Acceptance Criteria:**
- Golden master tests capture all current workflow outputs (resume, cover letter, keyword analysis)
- Feature flag system enables instant rollback for each service
- Enhanced pre-commit hook validates golden master + performance (still <10 seconds)
- Existing 124 tests continue to pass with new safety infrastructure

### Phase 2: Standardize Existing Service Infrastructure (Sessions 2-3)

**Foundation Already in Place:**
- ✅ **Unified CLI Interface**: `generate-resume.js` serves as single entry point for all operations
- ✅ **Service Orchestration**: `document-orchestrator.js` coordinates multiple services effectively
- ✅ **Cross-Language Integration**: Node.js successfully calls Python services via `execAsync`
- ✅ **Unified Error Handling**: Complete error taxonomy and handling already implemented
- ✅ **Workflow Integration**: CLI flags (`--evaluate`, `--fast`, `--all`) already provide unified workflows
- ✅ **Multi-Service Coordination**: System successfully orchestrates document generation, keyword analysis, and hiring evaluation

**Objectives:**
- Add standardized JSON API layer over existing service communication
- Implement feature flag system for safe service interface migration
- Create consistent service response format without changing core logic
- Build service wrapper layer that maintains existing functionality

**Deliverables:**
- **Service Wrapper Layer**: JSON API wrappers around existing shell-based service calls
- **Feature Flag System**: Toggle between legacy shell execution and standardized JSON APIs
- **Standard Response Format**: Consistent JSON response structure across all services
- **Interface Validation Suite**: Ensure wrappers produce identical results to current implementation

**Acceptance Criteria:**
- Service wrappers produce identical outputs to existing shell-based calls
- Feature flags enable instant rollback to legacy service communication
- All existing CLI workflows (`--evaluate`, `--fast`, `--all`) work unchanged
- JSON response format standardized across document generation, keyword analysis, and hiring evaluation

### Phase 2.5: Infrastructure Modernization (ESM Migration) (Session 2.5)

**Context:**
Phase 2 service wrapper validation is blocked by Jest/ESM compatibility issues with the `marked` package. The current JavaScript codebase uses CommonJS (`require`/`module.exports`) while modern dependencies assume ESM (`import`/`export`). This creates module resolution conflicts that prevent comprehensive test suite execution.

**Architectural Rationale:**
ESM migration is fundamentally **infrastructure standardization work** that belongs in Phase 2. The PRD emphasizes "AI-agent friendly with predictable interfaces" and "consistent patterns prevent architectural drift." Mixed CJS/ESM creates unpredictable import patterns that violate these core principles. Phase 2.5 leverages existing Jest/ESM investigation context - deferring would require re-learning module resolution issues during Phase 3 development.

**Production Safety:**
ESM conversion affects only JavaScript module loading. Python/Go services use CLI interfaces - zero impact on polyglot service communication patterns or outputs.

**Foundation Already in Place:**
- ✅ **Pure CommonJS Codebase**: 92 JavaScript files with consistent `require`/`module.exports` patterns
- ✅ **Isolated Multi-Language Services**: Python and Go services communicate via CLI/HTTP, zero module import dependencies
- ✅ **Modern Node.js Dependencies**: All current dependencies (`marked@16.0.0`, `jest@29.7.0`) support ESM
- ✅ **Service Wrapper Abstraction**: Phase 2A wrappers provide clean API boundaries for migration
- ✅ **Golden Master Test Coverage**: 96/96 baseline tests provide comprehensive regression detection

**Objectives:**
- Convert JavaScript codebase from CommonJS to ESM module system
- Resolve Jest/marked compatibility issues blocking test suite execution
- Establish modern JavaScript module standards for Phase 3 toolkit foundation
- Maintain 100% functional compatibility during migration

**Deliverables:**
- **Package.json ESM Configuration**: Add `"type": "module"` and update scripts
- **Core Module Conversion**: Convert utilities, error handling, and base infrastructure to ESM
- **Service Layer Conversion**: Convert service wrappers and orchestration to ESM imports/exports
- **Test Suite Migration**: Update Jest configuration and test files for ESM compatibility
- **Validation Scripts**: Ensure all CI/CD scripts work with ESM modules

**Migration Strategy with Rollback Points:**
```javascript
// Phase 2.5A: Core Infrastructure (utils, error-handler, theme)
//   → Git tag + golden master validation
// Phase 2.5B: Service Wrappers (already abstracted APIs)  
//   → Git tag + service integration tests
// Phase 2.5C: CLI Entry Point (generate-resume.js)
//   → Git tag + full workflow validation
// Phase 2.5D: Jest Configuration (comprehensive test suite)
//   → Complete test suite execution
```

**Acceptance Criteria:**
- All 96/96 baseline tests continue to pass with ESM modules
- Comprehensive service wrapper validation test suite runs successfully
- Jest/marked compatibility issue resolved completely
- Python/Go services maintain identical CLI interfaces and outputs (validated by golden masters)
- All CLI workflows (`generate-resume.js`, `--evaluate`, `--fast`) work identically
- Golden master tests validate zero behavioral changes during migration
- Each migration phase has explicit rollback point with git tag
- Phase 3 toolkit development can proceed on modern ESM foundation

### Phase 3: Create Service Standardization Toolkit (Sessions 4-7)

**Foundation Already in Place:**
- ✅ **Service Modularity**: Services are already well-separated and independently deployable
- ✅ **Individual Service Configuration**: Services have their own configuration patterns (e.g., hiring-evaluation config)
- ✅ **Git-based Rollback**: Standard git revert capability available for all changes
- ✅ **Environment Handling**: Basic environment variable support (`NODE_ENV`) in error handling

**Missing Infrastructure:**
- ❌ **Migration Toolkit**: No reusable utilities for standardizing service interfaces
- ❌ **Unified Configuration System**: Each service uses different config approaches
- ❌ **Structured Logging**: Only ad-hoc console.log statements, no unified logging format
- ❌ **Feature Flag Utilities**: No simple infrastructure for toggling implementations
- ❌ **Developer Guidelines**: No discoverable documentation for service interface standards

**Objectives:**
- Create lightweight, reusable toolkit for service standardization
- Build simple utilities that follow "adapter + feature flag + validate" pattern
- Establish clear, discoverable guidelines for future service development
- Implement structured logging and configuration patterns

**Deliverables:**
- **Migration Toolkit**: Simple utilities (`adapter-template.js`, `feature-flag-helper.js`, `golden-master-validator.js`)
- **Service Templates**: Copy-paste templates for standardizing each service type
- **Developer Guidelines**: Clear documentation (`SERVICE_STANDARDS.md`) in project root
- **Unified Configuration Pattern**: Simple, consistent config approach across languages
- **Structured Logging Utilities**: Replace console.log with consistent logging format

**Service Standardization Pattern:**
```javascript
// 1. Create adapter that wraps existing service
// 2. Add feature flag to toggle old/new implementation
// 3. Validate with golden master that output is identical
// 4. Switch to new implementation, remove old code
```

**Future Developer Discoverability:**
- **`/docs/SERVICE_STANDARDS.md`**: Primary documentation for service interface patterns
- **`/templates/service-adapter-template.js`**: Copy-paste template for new services
- **Code comments**: Clear examples in existing standardized services
- **Error messages**: Helpful guidance when services don't follow standards

**Acceptance Criteria:**
- Migration toolkit enables consistent, low-risk service standardization
- Templates and documentation make standards immediately discoverable
- All services use unified configuration and logging patterns
- Feature flag utilities enable instant rollback for any service change
- Golden master validation catches any behavioral changes during standardization
- New developers can implement standard service interfaces without guidance

### Phase 4: Execute Service Migrations (Sessions 8-11)

**Foundation in Place:**
- ✅ **Complete Migration Toolkit**: Feature flags, golden master validation, service templates ready
- ✅ **Proven Pattern**: Keyword analysis adapter demonstrates successful standardization approach
- ✅ **Safety Infrastructure**: Instant rollback capability and behavioral validation established
- ✅ **Documentation**: SERVICE_STANDARDS.md provides clear implementation guidelines

**Remaining Services for Standardization:**
- **Hiring Evaluation Service** (Node.js) - LLM integration and multi-persona evaluation
- **Document Generation Service** (Node.js) - DOCX template processing and orchestration
- **Vale Linting Service** (Go) - Style guide enforcement and grammar validation

**Migration Strategy: Binary Toggle Approach**

**Rationale**: Single-user environment enables simplified migration strategy focused on fast iteration and immediate feedback rather than gradual production rollouts.

**Per-Service Migration Process:**
1. **Preparation**: Copy `templates/service-adapter-template.js` → `[service]-adapter.js`
2. **Legacy Wrapper**: Implement `executeLegacyService()` - wrap existing service calls
3. **Golden Master Creation**: `node [service]-adapter.js create-golden-master` 
4. **Standardized Implementation**: Build `executeStandardizedService()` with JSON interface
5. **Validation**: `node [service]-adapter.js compare` until outputs identical
6. **Binary Switch**: `node feature-flag-helper.js enable services.[service].useStandardizedWrapper`
7. **E2E Testing**: Validate complete workflows function correctly
8. **Legacy Removal**: Delete old implementation immediately after validation

**Migration Priority Order:**
1. **Hiring Evaluation** (Session 8) - Most complex, highest risk, established patterns for LLM integration
2. **Document Generation** (Session 9) - Core functionality, moderate complexity, central to workflows
3. **Vale Linting** (Session 10-11) - Cross-language (Go), currently optional, lowest risk

**Quality Gates per Service:**
- Golden master validation shows byte-for-byte identical outputs
- All existing test suites continue to pass (132/132 tests maintained)
- Complete CLI workflows function identically (`--evaluate`, `--fast`, `--all` flags)
- Performance benchmarks meet or exceed current baseline
- Feature flag enables instant rollback if issues discovered

**Acceptance Criteria:**
- All three services implement identical JSON-in/JSON-out interface contract
- Service registry provides unified access to all standardized services
- CLI commands work identically regardless of underlying implementation
- Legacy code completely removed after successful migration validation
- Documentation updated to reflect standardized interfaces only

**Risk Mitigation:**
- **Instant Rollback**: Feature flags enable immediate reversion to legacy implementation
- **Behavioral Validation**: Golden master ensures no functional regressions
- **Incremental Approach**: One service at a time with full validation between migrations  
- **Fast Iteration**: Binary toggle approach enables rapid debugging cycles
- **Comprehensive Testing**: Existing test infrastructure validates each migration step

**Expected Outcomes:**
- **Unified Interface**: All services accessible through consistent JSON API patterns
- **AI-Agent Friendly**: Single learning curve for all service interactions
- **Maintainable**: Clear separation of concerns with standard error handling
- **Performant**: No regression in processing times or capabilities
- **Discoverable**: Complete documentation and examples for future development

### Phase 5: Architectural Review & TypeScript Strategy (Sessions 12-14)

**Foundation in Place:**
- ✅ **Unified Service Interfaces**: All services standardized with consistent JSON APIs
- ✅ **Proven Patterns**: Service standardization demonstrates architectural decisions at scale
- ✅ **Clean Codebase**: Legacy code removed, clear separation of concerns established

**Objectives:**
- **Comprehensive Architecture Assessment**: Review standardized polyglot architecture for TypeScript readiness
- **Type System Design**: Plan TypeScript interfaces, generics, and architectural patterns
- **Migration Strategy**: Define TypeScript migration approach that preserves architectural quality
- **Tooling Evaluation**: Assess Vitest migration alongside TypeScript adoption

**Key Focus Areas:**
- **Service Interface Architecture**: Design TypeScript contracts for standardized services
- **Error Handling Strategy**: TypeScript-compatible error types and handling patterns
- **Configuration System**: Type-safe configuration interfaces across languages
- **Testing Architecture**: Vitest migration strategy with TypeScript integration

### Phase 6: TypeScript & Vitest Migration (Sessions 15+)

**Foundation in Place:**
- ✅ **Architectural Plan**: Clear TypeScript interface design and migration strategy
- ✅ **Standardized Services**: Consistent patterns ready for type system integration
- ✅ **Migration Roadmap**: Step-by-step approach maintaining system stability

**Objectives:**
- **TypeScript Migration**: Convert standardized JavaScript interfaces to TypeScript
- **Vitest Integration**: Migrate from Jest to Vitest with TypeScript support
- **Type Safety**: Implement comprehensive type checking across service boundaries
- **Developer Experience**: Enhanced IDE support and compile-time error detection

**Expected Outcomes:**
- **Type-Safe Architecture**: Compile-time validation of service interfaces
- **Enhanced Maintainability**: Strong typing prevents runtime errors
- **Improved Developer Experience**: Better IDE support and refactoring capabilities
- **Modern Tooling**: Vitest performance benefits with TypeScript integration

### Session-Based Development Workflow

**Typical Agent Session Pattern:**
1. **Pre-Session**: Run `npm run test:baseline` to establish current state
2. **Development**: Make incremental changes with frequent commits
3. **Validation**: Pre-commit hook runs automatically (blocks problematic commits)
4. **Post-Session**: Background extended validation provides continuous feedback

**Commit-Driven Quality Gates:**
```bash
# Pre-commit hook (runs in <10 seconds)
- Golden master validation
- Full e2e test suite (all workflow flags)
- Performance regression check
- Cross-language integration test
- Error handling validation
```

## Technical Architecture

### Service Architecture
```
Unified CLI Interface (Node.js)
├── Document Generation Engine (Node.js)
│   ├── DOCX Template Processing
│   ├── Markdown Parsing
│   └── Theme Management
├── Keyword Analysis Engine (Python)
│   ├── Job Posting Analysis
│   ├── Keyword Extraction & Ranking
│   └── Semantic Clustering
├── Hiring Evaluation Engine (Node.js)
│   ├── Multi-Persona Simulation
│   ├── LLM Integration (Ollama)
│   └── Performance Optimization
└── Vale Linting Engine (Go)
    ├── Style Guide Enforcement
    ├── Grammar Validation
    └── ATS Optimization Checks
```

### Technology Stack Rationale
- **Node.js**: I/O operations, orchestration, document processing, CLI interface
- **Python**: Machine learning, data analysis, keyword processing, semantic analysis
- **Go**: High-performance text processing, concurrent linting operations
- **Unified Interface**: JSON-based APIs with consistent error handling

### Standard Interface Contract
```javascript
// All services implement this interface
{
  "service": "service-name",
  "version": "1.0.0",
  "input": { /* service-specific input */ },
  "output": { /* service-specific output */ },
  "error": { 
    "code": "ERROR_TYPE",
    "message": "Human readable message",
    "details": { /* context-specific details */ }
  },
  "metadata": {
    "duration_ms": 1234,
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

## Risk Assessment & Mitigation

### Low Risk
- **Technical Implementation**: Building on existing successful architecture
- **Performance Impact**: No changes to core processing logic
- **Team Adoption**: AI agents adapt quickly to consistent patterns

### Medium Risk
- **Interface Migration**: Wrapping existing services requires careful testing
- **Configuration Consolidation**: Merging different config approaches
- **Testing Integration**: Unifying different test frameworks

### Mitigation Strategies
- **Incremental Implementation**: Standardize one service at a time
- **Backward Compatibility**: Maintain existing interfaces during transition
- **Comprehensive Testing**: Validate each standardization step
- **Rollback Capability**: Easy reversion if issues arise

## Timeline & Resources

**Total Duration**: 7 weeks
**Resource Requirements**: 1-2 AI agents focused on standardization work
**Dependencies**: Current architecture stability (already achieved)

### Milestones
- **Week 2**: All services accessible through unified CLI (✅ Complete)
- **Week 4**: Pattern consolidation complete with unified testing (✅ Complete)
- **Week 5**: Documentation and tooling complete, ready for production (✅ Complete - Phase 3)
- **Week 6**: Hiring evaluation and document generation services standardized (✅ Complete - Phase 4A)
- **Week 7**: Vale linting service standardized, legacy code removed (✅ Complete - Phase 4B)
- **Week 8-9**: Architectural review and TypeScript strategy planning (Phase 5)
- **Week 10+**: TypeScript and Vitest migration execution (Phase 6)

## Success Metrics

### Quantitative Metrics
- **CLI Unification**: 100% of operations accessible via single command
- **Error Consistency**: 100% of services use standard error format
- **Test Coverage**: >90% coverage with unified reporting
- **Performance**: No regression in processing times
- **Setup Time**: <5 minutes for new AI agent onboarding

### Qualitative Metrics
- **Pattern Consistency**: All services follow identical interface patterns
- **Documentation Quality**: Single source of truth for all architectural decisions
- **Developer Experience**: Predictable, consistent interaction patterns
- **Maintainability**: Clear service boundaries with standard communication

## Future Considerations

This standardized polyglot architecture provides a solid foundation for evolution:

### Scaling Opportunities
- **Service Extraction**: Clear interfaces enable easy microservice migration if needed
- **Language Addition**: Standard interface contract supports new languages
- **Performance Optimization**: Service-specific optimizations within standard interfaces

### Architectural Evolution
- **Container Deployment**: Standard interfaces support containerization
- **API Gateway**: Unified interface can evolve into external API
- **Monitoring Enhancement**: Standard patterns enable advanced observability

## Conclusion

The standardized polyglot architecture embraces the technical strengths of multi-language development while eliminating the complexity overhead through consistent patterns and unified interfaces. This approach optimizes for AI-agent development workflows while maintaining the performance and capability advantages of the current system.

**Key Insight**: The problem isn't multiple languages - it's multiple patterns. Standardization solves the real issue while preserving technical optimality.
