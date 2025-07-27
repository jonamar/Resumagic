# Fix: Keyword Analysis Testing Strategy

## Executive Summary

Replace console output validation with file-based service contract testing using static test data. Focus on service integration reliability rather than ML quality validation, ensuring tests don't break when creating new job applications.

## Problem Statement

### Current Testing Issues
- **Wrong Output Format**: Golden master captures console logs ("🔍 Loading keywords...") but wrapper expects JSON from `stdout`
- **Shell Integration Fragility**: Wrapper assumes `JSON.parse(stdout)` will work but Python service outputs structured logs
- **Service Contract Ignored**: Tests console output instead of actual service deliverables (files)
- **Workflow Disruption**: Tests would break every time a new job posting is analyzed (standard operation)

### Evidence of Mismatch
```javascript
// Wrapper expectation - will fail
const parsed = JSON.parse(stdout);

// Actual golden master content
"🔍 Loading keywords from: /Users/jonamar/Documents/resumagic/data/applications/..."
"📊 Loading 74 keywords"
```

```python
# Real service behavior - writes files, not JSON to stdout
save_output_files(knockout_requirements, top_skills, canonical_keywords, args)
print(f"✅ Keyword analysis saved to: {analysis_file}")
```

## Solution Overview

### Static Test Data Approach
Create dedicated test application with fixed keywords and job posting that never changes. Test the actual service contract (file generation) rather than console output.

### Core Testing Strategy
1. **File-Based Contract Testing**: Validate service generates expected output files
2. **Content Hash Validation**: Ensure output content remains consistent using hash comparison
3. **JSON Structure Validation**: Ensure output files have correct data structure
4. **Shell Integration Testing**: Verify command construction and execution work correctly
5. **Static Test Data**: Controlled baseline prevents workflow disruption

## Detailed Implementation Plan

### Phase 1: Create Test Application Infrastructure

#### Test Application Setup
```
data/applications/test-validation/
├── inputs/
│   ├── keywords.json        # Fixed keyword list for testing
│   ├── job-posting.md       # Fixed job description
│   └── resume.json          # Fixed resume for injection testing
├── working/
│   ├── keyword_analysis.json    # Generated output
│   └── keyword-checklist.md     # Generated checklist
└── outputs/
    └── [any document outputs]
```

#### Test Keywords Requirements
- **Comprehensive Coverage**: Mix of knockout requirements and skills
- **Realistic Data**: Professional keywords that would appear in real job analysis
- **Category Diversity**: Technical skills, soft skills, industry terms, role requirements
- **Stable Content**: Never changes unless testing infrastructure needs updates

#### Test Job Posting Requirements
- **Standard Format**: Professional job description with clear requirements
- **Keyword Overlap**: Contains some keywords from test keywords.json for scoring
- **Realistic Content**: Believable job posting that exercises TF-IDF scoring
- **Consistent Structure**: Standard sections (responsibilities, requirements, etc.)

### Phase 2: Remove Broken Test Infrastructure

#### Golden Master Cleanup
```bash
# Remove console output golden masters
rm -rf app/__tests__/golden-master/baseline/keyword-analysis/
rm -rf app/__tests__/golden-master/current/keyword-analysis/

# Remove metadata files for keyword analysis
rm -f app/__tests__/golden-master/baseline/metadata/*keyword-analysis*
```

#### Wrapper Implementation Fix
```javascript
// REMOVE: Broken JSON parsing from stdout
// const parsed = JSON.parse(stdout);

// ADD: File-based output validation
const outputPath = path.join(applicationPath, 'working', 'keyword_analysis.json');
if (!fs.existsSync(outputPath)) {
  throw new Error(`Service failed to generate output file: ${outputPath}`);
}
const analysisData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
```

### Phase 3: Service Contract Testing

#### Content Hash Golden Master Setup
```javascript
// Golden master hash storage
const expectedHashes = {
  'keyword_analysis.json': 'a1b2c3d4e5f6...',
  'keyword-checklist.md': 'f1e2d3c4b5a6...'
};

function generateContentHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}
```

#### File Generation and Content Validation
```javascript
describe('Keyword Analysis Service Contract', () => {
  test('should generate required output files with correct content', async () => {
    const keywordService = getServiceWrapper('keyword-analysis');
    
    const result = await keywordService.analyze({
      applicationName: 'test-validation',
      keywordsFile: 'test-validation/inputs/keywords.json',
      jobPostingFile: 'test-validation/inputs/job-posting.md',
      resumeFile: 'test-validation/inputs/resume.json'
    });
    
    // Verify service contract - files created
    const workingDir = 'data/applications/test-validation/working';
    const analysisPath = path.join(workingDir, 'keyword_analysis.json');
    const checklistPath = path.join(workingDir, 'keyword-checklist.md');
    
    expect(fs.existsSync(analysisPath)).toBe(true);
    expect(fs.existsSync(checklistPath)).toBe(true);
    
    // Verify content consistency with golden master
    const analysisContent = fs.readFileSync(analysisPath, 'utf8');
    const checklistContent = fs.readFileSync(checklistPath, 'utf8');
    
    const analysisHash = generateContentHash(analysisContent);
    const checklistHash = generateContentHash(checklistContent);
    
    expect(analysisHash).toBe(expectedHashes['keyword_analysis.json']);
    expect(checklistHash).toBe(expectedHashes['keyword-checklist.md']);
    
    // Verify service succeeded
    expect(result.success).toBe(true);
    expect(result.data.analysis).toBeDefined();
  });
});
```

#### JSON Structure Validation
```javascript
test('should generate valid keyword analysis JSON structure', async () => {
  const analysisPath = 'data/applications/test-validation/working/keyword_analysis.json';
  const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
  
  // Validate required structure
  expect(analysisData.knockouts).toBeInstanceOf(Array);
  expect(analysisData.skills).toBeInstanceOf(Array);
  expect(analysisData.metadata).toBeDefined();
  
  // Validate knockout structure
  if (analysisData.knockouts.length > 0) {
    expect(analysisData.knockouts[0]).toHaveProperty('kw');
    expect(analysisData.knockouts[0]).toHaveProperty('score');
    expect(analysisData.knockouts[0]).toHaveProperty('category', 'knockout');
  }
  
  // Validate skills structure
  if (analysisData.skills.length > 0) {
    expect(analysisData.skills[0]).toHaveProperty('kw');
    expect(analysisData.skills[0]).toHaveProperty('score');
    expect(analysisData.skills[0]).toHaveProperty('category', 'skill');
  }
});
```

#### Shell Command Integration Testing
```javascript
test('should construct and execute shell command correctly', async () => {
  const keywordService = getServiceWrapper('keyword-analysis');
  
  // Spy on shell execution to verify command construction
  const execSpy = jest.spyOn(require('child_process'), 'exec');
  
  await keywordService.analyze({
    applicationName: 'test-validation',
    keywordsFile: 'test-validation/inputs/keywords.json',
    jobPostingFile: 'test-validation/inputs/job-posting.md',
    topCount: 10
  });
  
  // Verify command was constructed correctly
  const executedCommand = execSpy.mock.calls[0][0];
  expect(executedCommand).toContain('python services/keyword-analysis/kw_rank_modular.py');
  expect(executedCommand).toContain('test-validation/inputs/keywords.json');
  expect(executedCommand).toContain('test-validation/inputs/job-posting.md');
  expect(executedCommand).toContain('--top 10');
  
  execSpy.mockRestore();
});
```

### Phase 4: Enhanced Error Handling

#### Service Failure Detection
```javascript
// Enhanced wrapper implementation
async executeLegacyAnalysis(input, startTime) {
  const command = this.constructCommand(input);
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: path.resolve(__dirname, '../..'),
      timeout: 120000
    });
    
    // Check for service output files instead of parsing stdout
    const outputPath = path.join(input.applicationPath, 'working', 'keyword_analysis.json');
    
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Service failed to generate output file: ${outputPath}`);
    }
    
    const analysisData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    const duration = Date.now() - startTime;
    
    return this.createSuccessResponse({
      analysis: analysisData,
      command: command,
      implementation: 'legacy'
    }, duration);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    return this.createErrorResponse(
      'ANALYSIS_FAILED',
      `Keyword analysis failed: ${error.message}`,
      { originalError: error.message, command },
      duration
    );
  }
}
```

## Implementation Guidelines

### Critical Architecture Understanding
**⚠️ IMPORTANT**: Before implementing, thoroughly understand the existing service architecture:

1. **Study the existing CLI workflow**: Run `node generate-resume.js --help` and trace how keyword analysis is actually invoked
2. **Examine the working wrapper**: Review `services/wrappers/keyword-analysis-wrapper.js` to understand the current interface
3. **Test manually first**: Verify keyword analysis works with `python services/keyword-analysis/kw_rank_modular.py` before writing tests
4. **Use existing patterns**: The working CLI and existing wrapper show the correct way to integrate - don't invent new interfaces

**Common mistake**: Creating new service interfaces instead of testing the existing, working integration patterns.

### Test Execution Strategy

#### Integration with Existing Pre-Commit Hook
```bash
# Add to scripts/ci/pre-commit.sh after Stage 4
# Stage 5: Service wrapper contract validation (if relevant changes detected)

# Keyword analysis service test triggers
KEYWORD_CHANGES=false
echo "$CHANGED_FILES" | grep -E "services/keyword-analysis/" > /dev/null && KEYWORD_CHANGES=true
echo "$CHANGED_FILES" | grep -E "services/wrappers/keyword-analysis" > /dev/null && KEYWORD_CHANGES=true
echo "$CHANGED_FILES" | grep -E "services/keyword-extraction\.js" > /dev/null && KEYWORD_CHANGES=true

if [ "$KEYWORD_CHANGES" = "true" ]; then
    print_status $BLUE "🔍 Running keyword analysis contract tests"
    if ! npm run test:keyword-analysis > /dev/null 2>&1; then
        print_status $RED "❌ Keyword analysis tests failed"
        exit 1
    fi
    print_status $GREEN "✅ Keyword analysis tests passed (5s)"
fi
```

#### Test Suite Implementation
```javascript
// Primary tests - file-based contract validation with content hashing
describe('Keyword Analysis Service Contract', () => {
  test('generates analysis files with correct content', async () => {
    // Tests shell execution + file generation + content consistency
    // Completes in <5 seconds with Python service execution
    // Triggered by: keyword analysis service, wrapper, or related file changes
  });
  
  test('handles missing input files gracefully', async () => {
    // Tests error handling and command construction
    // Completes quickly (<1 second)
  });
});

// Execution context:
// - Triggered: Only when keyword analysis code changes
// - Performance: <5 seconds (includes Python service execution)
// - Skip options: SKIP_CI=true, SKIP_SERVICE_TESTS=true, [skip ci]
```

#### Package.json Script Addition
```json
{
  "scripts": {
    "test:keyword-analysis": "jest __tests__/integration/keyword-analysis-contract.test.js"
  }
}
```

### Test Data Creation
```json
// test-validation/inputs/keywords.json
[
  {
    "kw": "Product Manager",
    "category": "knockout",
    "knockout_type": "required"
  },
  {
    "kw": "Agile",
    "category": "skill"
  },
  {
    "kw": "Scrum",
    "category": "skill"
  },
  {
    "kw": "Data Analysis",
    "category": "skill"
  },
  {
    "kw": "Product Strategy",
    "category": "skill"
  }
]
```

```markdown
# test-validation/inputs/job-posting.md
# Senior Product Manager - Test Position

## About the Role
We are seeking a Senior Product Manager to lead our product strategy and development initiatives.

## Requirements
- 5+ years of Product Manager experience
- Strong background in Agile methodologies
- Experience with Scrum frameworks
- Data Analysis capabilities
- Product Strategy expertise

## Responsibilities
- Lead cross-functional teams
- Develop product roadmaps
- Analyze market opportunities
```

### Golden Master Update Process
```bash
# Update golden master hashes when service output intentionally changes
npm run update-keyword-analysis-golden-masters

# This regenerates expected content hashes for:
# - keyword_analysis.json 
# - keyword-checklist.md
```

### Cleanup Process
1. **Remove Broken Tests**: Delete console output golden masters
2. **Update Wrapper Logic**: Replace stdout parsing with file validation
3. **Add New Test Suite**: Implement file-based contract testing with content hashing
4. **Update Test Documentation**: Remove references to console output testing

### Error Handling Strategy
```javascript
// Clear error messages for service failures
if (!fs.existsSync(outputPath)) {
  const errorMsg = `
Keyword analysis service failed to generate output file: ${outputPath}

This indicates the Python service execution failed.
Check the command: ${command}
Check stderr output: ${stderr}
  `;
  throw new Error(errorMsg);
}
```

## Success Criteria

### Functional Requirements
- **Service Integration**: Python script executes successfully with correct arguments
- **File Generation**: Required output files created in working directory
- **Data Structure**: Generated JSON has expected structure and required fields
- **Error Handling**: Service failures detected and reported clearly

### Technical Requirements
- **Workflow Compatibility**: Tests don't break when analyzing new job postings
- **Reliable Execution**: Shell integration works consistently across environments
- **Fast Testing**: File validation completes quickly (<5 seconds)
- **Clear Diagnostics**: Service failures provide actionable error messages

### Quality Gates
- **100% Service Contract Coverage**: All expected files validated
- **Zero Workflow Disruption**: Normal operations don't affect tests
- **Reliable Detection**: Actual service failures always caught
- **Developer Friendly**: Clear process for test data maintenance

## Risk Mitigation

### Service Evolution
- **Risk**: Python service changes argument format or output structure
- **Mitigation**: Test command construction and file structure separately
- **Detection**: Tests fail immediately when service contract changes

### Test Data Staleness
- **Risk**: Test keywords/job posting become unrealistic over time
- **Mitigation**: Periodic review of test application relevance
- **Process**: Annual review of test data quality

### File System Dependencies
- **Risk**: Tests depend on specific file system paths
- **Mitigation**: Use relative paths and proper path resolution
- **Portability**: Tests work across different environments

## Future Enhancements

### Advanced Service Testing
- **Performance Validation**: Measure keyword analysis execution time
- **Output Quality Metrics**: Basic validation of keyword count and score ranges
- **Resume Integration Testing**: Validate sentence injection functionality

### Multiple Test Scenarios
- **Large Keyword Sets**: Test with extensive keyword lists
- **Edge Case Job Postings**: Test with unusual formatting or content
- **Error Conditions**: Test with malformed input files

### Automated Test Data Management
- **Smart Updates**: Detect when test data needs refreshing
- **Baseline Regeneration**: Regenerate expected outputs when service improves
- **Change Tracking**: Monitor service output evolution over time

## Conclusion

This strategy focuses on testing the keyword analysis service integration contract rather than attempting to validate ML quality. By using static test data and file-based validation, we ensure the service works reliably without disrupting normal job analysis workflows.

The approach provides robust protection against service integration failures while avoiding the complexity and fragility of trying to validate TF-IDF scoring quality through automated tests.