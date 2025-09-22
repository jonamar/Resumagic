# PRD: Document Templates Modularization

## Problem Statement

The `core/document-templates.js` file (1416 lines) contains multiple responsibilities:
- Resume document generation
- Cover letter document generation  
- Combined document generation
- Section builders for different content types
- Formatting utilities
- Date/region processing utilities

This monolithic structure makes it:
- Difficult for AI agents to convert to TypeScript (qwen3-coder failed with 42+ errors)
- Hard to maintain and debug
- Challenging to test individual components
- Prone to merge conflicts during development

## Solution: Modular Architecture

### Proposed Module Structure

#### 1. Document Builders (`services/document-generation/document-builders/`)
- `resume-builder.ts` - `createResumeDocx()` function
- `cover-letter-builder.ts` - `createCoverLetterDocx()` function  
- `combined-builder.ts` - `createCombinedDocx()` function

#### 2. Resume Section Builders (`services/document-generation/sections/resume/`)
- `header-section.ts` - `createHeader()` function
- `summary-section.ts` - `createSummary()` function
- `experience-section.ts` - `createExperience()` function
- `skills-section.ts` - `createSkills()` function
- `education-section.ts` - `createEducation()` function
- `projects-section.ts` - `createProjects()` function
- `speaking-section.ts` - `createSpeakingEngagements()` function
- `languages-section.ts` - `createLanguages()` function

#### 3. Cover Letter Section Builders (`services/document-generation/sections/cover-letter/`)
- `date-section.ts` - `createCoverLetterDate()` function
- `content-section.ts` - `createCoverLetterContent()` function
- `closing-section.ts` - `createCoverLetterClosing()` function
- `footer-section.ts` - `createCoverLetterFooter()` function

#### 4. Shared Utilities (`services/document-generation/formatting/`)
- `text-formatting.ts` - `createFormattedTextRuns()` function
- `date-utilities.ts` - `formatDate()`, `getRegionAbbreviation()` functions
- `section-utilities.ts` - `createItemSection()`, `createSectionHeading()` functions

#### 5. Orchestration & Planning
- `services/document-generation/document-orchestration.ts` - Generation orchestration
- `services/document-generation/generation-planning.ts` - Plan generation behavior
- `services/document-generation/path-resolution.ts` - Resolve/validate app paths

## Implementation Strategy

### Phase 1: Extract Utilities (Low Risk)
1. Move formatting utilities to separate files
2. Update imports in main file
3. Test that generation still works

### Phase 2: Extract Resume Sections (Medium Risk)  
1. Move each resume section builder to its own file
2. Update main resume builder to import sections
3. Test resume generation

### Phase 3: Extract Cover Letter Sections (Medium Risk)
1. Move each cover letter section builder to its own file  
2. Update main cover letter builder to import sections
3. Test cover letter generation

### Phase 4: Extract Main Builders (Low Risk)
1. Move document builders to separate files
2. Create main entry point with re-exports
3. Update all imports throughout codebase

### Phase 5: TypeScript Conversion (Low Risk with Small Files)
1. Convert each small module individually
2. Add proper TypeScript interfaces
3. Validate compilation

## Benefits

### For Development
- **Easier Testing**: Test individual sections in isolation
- **Parallel Development**: Multiple developers can work on different sections
- **Clearer Responsibilities**: Each file has a single, clear purpose
- **Reduced Merge Conflicts**: Changes to different sections won't conflict

### For AI Conversion
- **Manageable File Sizes**: Each file will be 50-200 lines vs 1416 lines
- **Clear Scope**: AI agents can focus on single responsibility conversion
- **Lower Error Rate**: Smaller surface area for TypeScript errors
- **Faster Iteration**: Quick feedback on individual module conversion

### For Maintenance  
- **Easier Debugging**: Issues can be traced to specific modules
- **Cleaner Git History**: Changes are scoped to relevant modules
- **Better Code Reuse**: Utilities can be shared across different builders
- **Improved Documentation**: Each module can have focused documentation

## Risk Mitigation

1. **Backward Compatibility**: Main entry point maintains existing API
2. **Incremental Approach**: Each phase can be tested independently
3. **Rollback Plan**: Git commits at each phase allow easy rollback
4. **Test Coverage**: Existing tests continue to pass throughout process

## Success Criteria

1. All existing tests continue to pass
2. Generated documents are identical to current output
3. Each module is under 200 lines
4. TypeScript conversion succeeds with zero errors
5. Build and test times remain unchanged

## Timeline

- **Phase 1-2**: 2-3 hours (utilities + resume sections)
- **Phase 3**: 1-2 hours (cover letter sections)  
- **Phase 4**: 1 hour (main builders + entry point)
- **Phase 5**: 1-2 hours (TypeScript conversion)

**Total Estimated Time**: 5-8 hours