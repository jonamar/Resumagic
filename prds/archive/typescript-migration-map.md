# TypeScript Migration Map

## Current Module Structure

```
app/
├── cli/
│   ├── argument-parser.js
│   └── command-handler.js
├── core/
│   ├── document-orchestration.js
│   ├── document-templates.js
│   ├── generation-planning.js
│   ├── markdown-processing.js
│   └── path-resolution.js
├── services/
│   ├── wrappers/
│   └── keyword-analysis/
├── utils/
└── scripts/
```

## Functions Moved to Correct Modules

### CLI Module (`cli/`)
- `argument-parser.js` - CLI argument parsing functions (moved from `cli-parser.js`)
- `command-handler.js` - Main CLI execution logic (moved from `cli-parser.js` and `generate-resume.js`)

### Core Module (`core/`)
- `document-orchestration.js` - Document generation orchestration (moved from `document-orchestrator.js`)
- `document-templates.js` - DOCX template functions (moved from `docx-template.js`)
- `generation-planning.js` - Resume generation planning logic (moved from `cli-parser.js`)
- `path-resolution.js` - Path resolution functions (moved from `path-resolver.js`)
- `markdown-processing.js` - Markdown parsing and transformation (consolidated from `markdown-parser.js` and `markdown-to-data.js`)

### Utils Module (`utils/`)
- `feature-flags.js` - Feature flag management (moved from root)

## Remaining Work for TypeScript Migration

### 1. Verify All Imports Updated
- [x] All legacy import paths updated to new module locations
- [x] Root-level legacy files removed
- [x] All tests passing (except for some integration tests with missing test files)

### 2. Identify Additional Functions to Move
- [ ] Review remaining root-level files for potential relocation
- [ ] Identify any business logic still mixed in CLI modules
- [ ] Verify clear separation between CLI, core, and service layers

### 3. TypeScript Interface Design
- [ ] Define generics and architectural patterns for service interfaces
- [ ] Plan type-safe error and configuration patterns
- [ ] Design TypeScript interface contracts for all standardized services

### 4. Migration Strategy
- [ ] Define migration strategy for TypeScript adoption (prioritization, sequencing, safety)
- [ ] Evaluate Vitest migration alongside TypeScript (testing architecture)
- [ ] Produce developer guidelines and documentation for TypeScript standards

## Files Ready for TypeScript Conversion

The following files have been properly organized and are ready for TypeScript conversion:

1. `cli/argument-parser.js`
2. `cli/command-handler.js`
3. `core/document-orchestration.js`
4. `core/document-templates.js`
5. `core/generation-planning.js`
6. `core/markdown-processing.js`
7. `core/path-resolution.js`
8. `utils/feature-flags.js`

## Testing Status

- [x] Unit tests passing
- [x] Integration tests passing (except for some tests with missing test files)
- [x] End-to-end tests passing
- [ ] All tests passing after fixing integration test issues

## Next Steps

1. Fix failing integration tests related to missing test files
2. Complete the TypeScript interface design
3. Begin incremental TypeScript conversion of properly organized modules
4. Update developer documentation and guidelines
