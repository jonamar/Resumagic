# PRD: JSON Resume Schema Compliance Migration

**Status**: Draft  
**Priority**: Medium  
**Timeline**: 3-4 weeks  
**Author**: System  
**Date**: 2025-07-26  

## Overview

Migrate resumagic's current pseudo-JSON Resume schema to full compliance with the official JSON Resume specification while preserving all existing functionality and maintaining accessibility for dyslexic date reading.

## Problem Statement

**Current Issues:**
- Resume JSON files use non-compliant date formats (`"Oct 2022"` vs `"2022-10-01"`)
- Custom fields lack clear naming conventions for agent developers
- Country codes use full names instead of ISO-3166-1 ALPHA-2 format
- Schema deviates from standard without clear documentation of extensions

**Impact:**
- Reduced compatibility with JSON Resume ecosystem tools
- Unclear intent for agent developers working in codebase
- Potential parsing errors in validation systems
- Risk of conflicts with future JSON Resume spec updates

## Goals

### Primary Goals
1. **Achieve JSON Resume spec compliance** while preserving all existing content
2. **Maintain dyslexia-friendly date interface** for human readability
3. **Establish clear custom extension naming** for agent developer clarity
4. **Ensure zero regression** in DOCX output quality and functionality

### Secondary Goals
- Document resumagic's schema extensions
- Create reusable migration patterns for future schema updates
- Improve codebase maintainability

## Success Metrics

- ✅ All resume.json files validate against official JSON Resume schema
- ✅ All existing DOCX outputs remain functionally identical
- ✅ All custom fields clearly identified with `x_` prefix
- ✅ Date accessibility maintained for user with dyslexia
- ✅ Zero breaking changes to document generation pipeline
- ✅ **Golden Master Preservation**: Phase 4 validation suite passes with identical results pre/post migration
- ✅ **DOCX Quality Maintained**: All 3 document types generate successfully with same performance
- ✅ **Controlled Testing**: All validation uses `general-application` baseline, not problematic applications

## Technical Approach

### Date Format Strategy

**Research Finding**: JSON Resume spec uses flexible ISO 8601 pattern supporting:
- Full format: `2022-10-01` (YYYY-MM-DD)
- Month format: `2022-10` (YYYY-MM) 
- Year format: `2022` (YYYY)

**Chosen Format**: `YYYY-MM-DD` for maximum compatibility and human readability.

**Dual-Format Solution**:
```json
{
  "work": [{
    "x_start": "Oct 2022",        // Dyslexia-friendly source of truth
    "startDate": "2022-10-01",    // Generated ISO format (1st of month)
    "x_end": "May 2025", 
    "endDate": "2025-05-31"       // Generated ISO format (last of month)
  }]
}
```

### Custom Extension Naming

**Convention**: `x_` prefix for all non-standard fields
- **Rationale**: Industry standard, concise, grep-friendly
- **Examples**: `x_work_modes`, `x_location`, `x_type`

### Schema Compliance Fixes

**Critical Violations**:
- `countryCode: "Canada"` → `countryCode: "CA"`
- Date formats as described above

**Extension Standardization**:
- `work_modes` → `x_work_modes`
- `location` (in work/education) → `x_location`
- `type` (in publications) → `x_type`

## Implementation Plan

### Phase 1: Schema Design (Week 1)
**Deliverables:**
- `resumagic-schema.json` extending official JSON Resume schema
- Documentation of all `x_` extensions and their purposes
- Field-by-field mapping from current to new format

**Tasks:**
- Create extended schema file
- Document custom extensions with agent-developer context
- Design date generation logic (readable → ISO)

### Phase 2: Parser Updates (Week 2)
**Deliverables:**
- Updated document generation to prioritize `x_start`/`x_end` dates
- ISO date generation from readable formats
- Backward compatibility for existing resume files

**Tasks:**
- Modify date parsing in document generators
- Add ISO date generation utility functions
- Implement graceful fallback for old format files
- **Testing**: Field-by-field smoke tests to ensure output consistency

### Phase 3: Migration Script (Week 2-3)
**Deliverables:**
- Automated migration script for all resume.json files
- Error reporting for problematic files (e.g., Elovate flat structure)
- Dry-run capability and rollback mechanisms

**Tasks:**
- Build migration script with known issue handling
- Create validation reporting
- **Handle Known Issues**: Surface Elovate flat structure problems without blocking
- Test migration on sample files

### Phase 4: Golden Master Validation & Rollout (Week 3-4)
**Deliverables:**
- Migrated resume.json files
- **Golden master validation results** confirming DOCX output preservation
- Updated documentation

**Tasks:**
- **Pre-Migration Golden Master**: Run Phase 4 validation suite to establish baseline using `general-application`
- Run migration script across all resume files
- **Post-Migration Golden Master**: Re-run Phase 4 validation to confirm no regressions
- **DOCX Quality Validation**: Ensure all 3 document types (resume, cover letter, combined) generate successfully
- **Performance Validation**: Confirm document generation remains under 5000ms threshold
- Document any manual fixes needed for problematic files

## Risk Mitigation

### High Risk: Date Generation Logic
- **Risk**: Incorrect month-end dates or parsing errors
- **Mitigation**: Comprehensive unit tests, manual spot-checking of generated dates

### High Risk: DOCX Output Regression
- **Risk**: Schema changes break document generation pipeline, causing golden master failures
- **Mitigation**: 
  - Run Phase 4 validation before and after each migration phase
  - Use `general-application` as controlled golden master baseline
  - Implement rollback capability if golden master tests fail
  - Test with working applications only (avoid `elovate-director-product-management`)

### Medium Risk: Parser Breaking Changes
- **Risk**: Document generation fails after schema updates
- **Mitigation**: Backward compatibility layer, extensive smoke testing

### Low Risk: Migration Script Edge Cases
- **Risk**: Unparseable resume files block migration
- **Mitigation**: Error reporting with manual fix capability, skip problematic files

## Known Issues & Constraints

### Elovate Resume Flat Structure
- **Issue**: Known bug in Elovate resume structure (lacks `basics` property)
- **Impact**: This application fails document generation and cannot be used for golden master baseline
- **Approach**: 
  - Skip during golden master validation (use `general-application` instead)
  - Surface errors during migration for manual handling
  - Do not use for validation or testing purposes
- **Non-Goal**: Don't build migration script around this edge case

### Validation System Integration
- **Note**: Schema validation being handled separately in parallel effort
- **Approach**: Focus on data structure compliance, not validation implementation

## Dependencies

- **Concurrent**: Phase 4 validation system (now completed and available)
- **Prerequisite**: Golden master baseline established using `general-application`
- **Integration Point**: Phase 4 validation suite for regression testing

## Golden Master Integration

### DOCX-Level Validation Framework
- **Current State**: Phase 4 validation suite now includes DOCX-level golden master testing using `general-application` as baseline
- **Baseline Established**: System currently generates 3 high-quality DOCX files (resume, cover letter, combined) in ~26ms with ATS optimization
- **Quality Gate**: All schema changes must preserve exact DOCX output quality and performance

### Integration Requirements
- **Before Migration**: Run Phase 4 validation to establish pre-migration baseline
- **During Migration**: Use golden master tests to validate each phase doesn't break document generation
- **After Migration**: Confirm golden master tests still pass with migrated data
- **Success Criteria**: Identical DOCX output quality and performance metrics maintained

## Out of Scope

- JSON Schema validation implementation (handled separately)
- Elovate bug fixes (manual handling acceptable)
- Migration to different resume standards beyond JSON Resume
- Tool compatibility testing with external JSON Resume tools

## Future Considerations

- Potential contribution of useful extensions back to JSON Resume community
- Evolution path to pure JSON Resume compliance (removing all extensions)
- Integration with resumagic validation system once completed

---

**Next Steps:**
1. Review and approve this PRD
2. Begin Phase 1: Schema design and documentation
3. Create sample migrated resume for validation testing
