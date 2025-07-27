# PRD: Data Directory Cleanup and Canonical Source Implementation

**Status:** Draft  
**Priority:** High  
**Estimated Effort:** 2-3 days  
**Target Completion:** End of current sprint  

## Executive Summary

Consolidate the data directory structure to eliminate confusion between template sources, establish a single canonical resume source, and implement automated new application creation through CLI integration. This cleanup addresses developer experience issues and creates a clear, maintainable structure for both human users and AI agents.

## Problem Statement

### Current Issues
1. **Dual Template Confusion**: Both `template/` and `general-application/` serve as starting points for new applications
2. **Unclear Canonical Source**: No single source of truth for the "real" resume data  
3. **Manual Application Setup**: Creating new applications requires manual file copying and folder creation
4. **Testing Data Mixed with Production**: `general-application` used for both golden master testing and as a template
5. **AI Agent Confusion**: No clear documentation for agents on how to create new applications

### Impact
- Developer confusion about which resume version to update
- Manual, error-prone application setup process
- Test data pollution in production application directory
- Inconsistent AI agent behavior when creating applications

## Solution Overview

### New Directory Structure
```
data/
├── canonical/                    # Single source of truth
│   ├── inputs/
│   │   ├── resume.json          # Master resume (evolving)
│   │   ├── cover-letter.md      # Generic cover letter template
│   │   └── job-posting.md       # Blank template for manual completion
│   ├── working/                 # Empty folder structure for copying
│   └── outputs/                 # Empty folder structure for copying
│
├── applications/                 # Only real job applications
│   ├── relay-director-product/
│   ├── nicejob-director-product/
│   └── [all existing applications]
│
├── test/                        # Testing and golden master data
│   └── general-application/     # Moved from applications/
│
└── resources/                   # Keep existing templates/tiles
```

### CLI Integration
```bash
# New application creation command
node generate-resume.js --new-app "company-name" "job-title"

# Example usage
node generate-resume.js --new-app "spotify" "senior-product-manager"
# Creates: data/applications/spotify-senior-product-manager/
```

## Implementation Plan

### Phase 1: Infrastructure Setup (Non-Breaking)
**Duration:** 0.5 days  
**Goal:** Create new structure alongside existing

#### Steps:
1. **Create new directory structure**
   ```bash
   mkdir -p data/canonical/{inputs,working,outputs}
   mkdir -p data/test
   ```

2. **Copy general-application to test location**
   ```bash
   cp -r data/applications/general-application data/test/
   ```

3. **Create canonical from general-application**
   ```bash
   cp -r data/applications/general-application/inputs data/canonical/
   # Add blank job-posting.md template
   ```

4. **Validate existing functionality**
   ```bash
   npm test
   node generate-resume.js general-application --preview
   ```

### Phase 2: Configuration Updates
**Duration:** 0.5 days  
**Goal:** Update system configuration to support new paths

#### Steps:
1. **Update theme.js constants**
   ```javascript
   fileNaming: {
     // Existing (keep for compatibility)
     dataDir: '../data',
     applicationsDir: 'applications',
     templateDir: 'template',
     
     // New paths
     canonicalDir: 'canonical',
     testDir: 'test',
     testApplicationName: 'general-application',
   }
   ```

2. **Add canonical path resolution**
   - Update `path-resolution.js` to handle canonical directory
   - Add helper functions for canonical file access

3. **Validate configuration**
   ```bash
   npm test
   ./scripts/ci/golden-master.sh --compare
   ```

### Phase 3: Test Migration
**Duration:** 0.5 days  
**Goal:** Update all test references to use new test directory

#### Files to Update:
- `app/__tests__/golden-master/baseline/manifest.json`
- `app/__tests__/golden-master/baseline/metadata/general-application-documents.json`
- `app/__tests__/integration/application-isolation.test.js`
- `app/__tests__/integration/document-generation-contract.test.js`
- `app/scripts/ci/golden-master.sh`
- `app/scripts/ci/performance-regression.sh`
- `scripts/ci/pre-commit.sh`

#### Changes:
```javascript
// Before
const testApp = 'general-application';
const testPath = path.join('data', 'applications', testApp);

// After  
const testApp = theme.fileNaming.testApplicationName;
const testPath = path.join(theme.fileNaming.dataDir, theme.fileNaming.testDir, testApp);
```

#### Validation:
```bash
npm test
./scripts/ci/golden-master.sh --compare
./scripts/ci/performance-regression.sh
```

### Phase 4: CLI Enhancement
**Duration:** 0.5 days  
**Goal:** Implement --new-app functionality

#### Implementation:
1. **Update argument-parser.js**
   ```javascript
   // Add --new-app flag parsing
   // Validate company and job-title arguments
   // Handle kebab-case conversion
   ```

2. **Create new-application.js module**
   ```javascript
   async function createNewApplication(company, jobTitle) {
     const appName = generateApplicationName(company, jobTitle);
     await copyCanonicalStructure(appName);
     await createFolderStructure(appName);
     return appName;
   }
   ```

3. **Update command-handler.js**
   - Add new application creation flow
   - Integrate with existing argument parsing

#### Validation:
```bash
node generate-resume.js --new-app "test-company" "test-role"
# Verify structure creation
# Test document generation on new application
```

### Phase 5: Legacy Cleanup and Documentation
**Duration:** 0.5 days  
**Goal:** Remove deprecated code and update documentation

#### Legacy Removal:
1. **Remove deprecated directories**
   ```bash
   rm -rf data/applications/template
   rm -rf data/applications/general-application  # After tests pass
   ```

2. **Remove deprecated theme constants**
   ```javascript
   // Remove from theme.js
   templateDir: 'template',  // DELETE
   ```

3. **Remove deprecated references**
   - Search and replace remaining template references
   - Update any hardcoded paths in services

#### Documentation Updates:
1. **Update data/applications/README.md**
   - Remove template copying instructions
   - Add --new-app CLI documentation
   - Update directory structure diagrams

2. **Update data/CLAUDE.md**
   ```markdown
   ### Creating New Applications (NEW!)
   
   **CLI Command:**
   ```bash
   node generate-resume.js --new-app "company-name" "job-title"
   ```
   
   **AI Agent Usage:**
   When user requests "create new application for company X and role Y":
   1. Use: node generate-resume.js --new-app "company" "role"
   2. This creates: data/applications/company-role/ with complete structure
   3. Remind user to edit inputs/job-posting.md with job details
   ```

3. **Update root .cursorrules**
   ```
   # Application Creation
   - Use CLI: node generate-resume.js --new-app "company" "role"
   - Never manually copy directories
   - Canonical source is data/canonical/ - update this for resume improvements
   - Test data is in data/test/ - never modify for application creation
   ```

4. **Update root .windsurf**
   - Add new application creation workflow
   - Update directory structure documentation
   - Add canonical source guidelines

5. **Update app/.cursorrules**
   - Add test path updates for developers
   - Document new theme constants
   - Add migration validation steps

## Risk Assessment and Mitigation

### High Risk: Golden Master Test Breakage
**Mitigation:** 
- Keep `data/applications/general-application` until Phase 3 completes
- Validate golden masters after each phase
- Implement rollback plan

### Medium Risk: Service Path Dependencies
**Mitigation:**
- Audit all service wrappers for hardcoded paths
- Test keyword analysis and hiring evaluation services
- Update path resolution incrementally

### Low Risk: Documentation Drift
**Mitigation:**
- Update documentation in same commit as code changes
- Validate AI agent instructions through testing
- Create validation checklist

## Rollback Plan

If any phase fails:
1. **Restore original structure**
   ```bash
   git checkout HEAD -- app/theme.js
   rm -rf data/canonical data/test
   ```

2. **Validate restoration**
   ```bash
   npm test
   ./scripts/ci/golden-master.sh --compare
   ```

3. **Keep partial progress**
   - Can keep canonical directory for future use
   - Phase-by-phase rollback possible

## Success Criteria

### Functional Requirements
- [ ] `node generate-resume.js --new-app "company" "role"` creates complete application structure
- [ ] All existing tests pass with new structure
- [ ] Golden master validation continues to work
- [ ] Existing applications remain functional
- [ ] AI agents can reliably create new applications

### Quality Requirements
- [ ] No hardcoded paths to old template directory
- [ ] Single canonical source for resume updates
- [ ] Clear separation of test vs production data
- [ ] Complete documentation for AI agent usage
- [ ] No deprecated code remaining

### Performance Requirements
- [ ] New application creation completes in <2 seconds
- [ ] Test suite performance unchanged
- [ ] Golden master validation time unchanged

## Post-Implementation

### Monitoring
- Track new application creation success rate
- Monitor AI agent usage patterns
- Validate test stability over time

### Future Enhancements
- Add application templates for different role types
- Implement bulk application creation
- Add validation for application naming conventions

## Appendix: Files Modified

### Code Changes
- `app/theme.js` - Add new directory constants
- `app/core/path-resolution.js` - Add canonical path support
- `app/cli/argument-parser.js` - Add --new-app flag
- `app/cli/command-handler.js` - Add new app creation flow
- `app/core/new-application.js` - New module for app creation
- All test files referencing `general-application`

### Documentation Changes
- `data/applications/README.md` - Complete rewrite
- `data/CLAUDE.md` - Add CLI documentation and AI agent guidelines
- `/.cursorrules` - Update application creation workflow
- `/.windsurf` - Update directory structure and guidelines
- `/app/.cursorrules` - Update development guidelines

### Deletions
- `data/applications/template/` - Remove after validation
- `data/applications/general-application/` - Move to test directory
- Various deprecated references in documentation

This PRD ensures a systematic, safe migration that preserves all existing functionality while establishing a clean, maintainable structure for future development.