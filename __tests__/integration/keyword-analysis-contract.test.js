/**
 * Keyword Analysis Service Contract Tests
 * Tests the actual service contract (file generation) rather than console output
 * Uses static test data to prevent workflow disruption
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import KeywordAnalysisWrapper from '../../services/wrappers/keyword-analysis-wrapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Expected content hashes for baseline validation
const expectedHashes = {
  'keyword_analysis.json': '99e04f7203effa7d45037206d234ea0a7710be28d60b51a382af6e5268ab8644',
  'keyword-checklist.md': '93706d638de0a5e71424e3ec665a7e9bfadd2d31eaa40e14292ba4127e48079c'
};

/**
 * Generate SHA256 hash for content
 */
function generateContentHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Get paths for test validation application
 */
function getTestPaths() {
  const appRoot = path.resolve(__dirname, '../..');
  const dataRoot = path.resolve(appRoot, '../data/applications/test-validation');
  
  return {
    appRoot,
    dataRoot,
    inputs: {
      keywords: path.join(dataRoot, 'inputs', 'keywords.json'),
      jobPosting: path.join(dataRoot, 'inputs', 'job-posting.md'),
      resume: path.join(dataRoot, 'inputs', 'resume.json')
    },
    working: {
      analysis: path.join(dataRoot, 'working', 'keyword_analysis.json'),
      checklist: path.join(dataRoot, 'working', 'keyword-checklist.md')
    }
  };
}

describe('Keyword Analysis Service Contract', () => {
  let keywordService;
  let testPaths;

  beforeAll(() => {
    keywordService = new KeywordAnalysisWrapper();
    testPaths = getTestPaths();
  });

  beforeEach(() => {
    // Clean up any existing output files before each test
    if (fs.existsSync(testPaths.working.analysis)) {
      fs.unlinkSync(testPaths.working.analysis);
    }
    if (fs.existsSync(testPaths.working.checklist)) {
      fs.unlinkSync(testPaths.working.checklist);
    }
  });

  test('should generate required output files with correct content', async () => {
    const result = await keywordService.analyze({
      applicationName: 'test-validation',
      keywordsFile: testPaths.inputs.keywords,
      jobPostingFile: testPaths.inputs.jobPosting,
      resumeFile: testPaths.inputs.resume
    });

    // Verify service succeeded
    expect(result.success).toBe(true);
    expect(result.data.analysis).toBeDefined();
    expect(result.data.implementation).toBe('legacy');

    // Verify service contract - files created
    expect(fs.existsSync(testPaths.working.analysis)).toBe(true);
    expect(fs.existsSync(testPaths.working.checklist)).toBe(true);

    // Verify content consistency with golden master
    const analysisContent = fs.readFileSync(testPaths.working.analysis, 'utf8');
    const checklistContent = fs.readFileSync(testPaths.working.checklist, 'utf8');

    const analysisHash = generateContentHash(analysisContent);
    const checklistHash = generateContentHash(checklistContent);

    expect(analysisHash).toBe(expectedHashes['keyword_analysis.json']);
    expect(checklistHash).toBe(expectedHashes['keyword-checklist.md']);
  }, 30000); // 30 second timeout for ML processing

  test('should generate valid keyword analysis JSON structure', async () => {
    await keywordService.analyze({
      applicationName: 'test-validation',
      keywordsFile: testPaths.inputs.keywords,
      jobPostingFile: testPaths.inputs.jobPosting,
      resumeFile: testPaths.inputs.resume
    });

    const analysisData = JSON.parse(fs.readFileSync(testPaths.working.analysis, 'utf8'));

    // Validate required structure
    expect(analysisData.knockout_requirements).toBeInstanceOf(Array);
    expect(analysisData.skills_ranked).toBeInstanceOf(Array);
    expect(analysisData.metadata).toBeDefined();

    // Validate skills structure
    if (analysisData.skills_ranked.length > 0) {
      const skill = analysisData.skills_ranked[0];
      expect(skill).toHaveProperty('kw');
      expect(skill).toHaveProperty('score');
      expect(skill).toHaveProperty('category', 'skill');
      expect(skill).toHaveProperty('aliases');
      expect(skill.aliases).toBeInstanceOf(Array);
    }

    // Validate metadata structure
    expect(analysisData.metadata).toHaveProperty('total_keywords_processed');
    expect(analysisData.metadata).toHaveProperty('knockout_count');
    expect(analysisData.metadata).toHaveProperty('skills_count');
  });

  test('should handle missing input files gracefully', async () => {
    const result = await keywordService.analyze({
      applicationName: 'test-validation',
      keywordsFile: '/nonexistent/keywords.json',
      jobPostingFile: testPaths.inputs.jobPosting,
      resumeFile: testPaths.inputs.resume
    });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('FILE_NOT_FOUND');
    expect(result.error.message).toContain('Keywords file not found');
  });

  test('should handle missing job posting file gracefully', async () => {
    const result = await keywordService.analyze({
      applicationName: 'test-validation',
      keywordsFile: testPaths.inputs.keywords,
      jobPostingFile: '/nonexistent/job-posting.md',
      resumeFile: testPaths.inputs.resume
    });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('FILE_NOT_FOUND');
    expect(result.error.message).toContain('Job posting file not found');
  });

  test('should work without resume file (optional parameter)', async () => {
    const result = await keywordService.analyze({
      applicationName: 'test-validation',
      keywordsFile: testPaths.inputs.keywords,
      jobPostingFile: testPaths.inputs.jobPosting
      // No resume file provided
    });

    expect(result.success).toBe(true);
    expect(fs.existsSync(testPaths.working.analysis)).toBe(true);
    expect(fs.existsSync(testPaths.working.checklist)).toBe(true);
  });
});

// Export utility for updating golden masters when service output intentionally changes
export function updateGoldenMasters() {
  const testPaths = getTestPaths();
  
  if (!fs.existsSync(testPaths.working.analysis) || !fs.existsSync(testPaths.working.checklist)) {
    throw new Error('Output files not found. Run the service first to generate baseline.');
  }

  const analysisContent = fs.readFileSync(testPaths.working.analysis, 'utf8');
  const checklistContent = fs.readFileSync(testPaths.working.checklist, 'utf8');

  const analysisHash = generateContentHash(analysisContent);
  const checklistHash = generateContentHash(checklistContent);

  console.log('Updated golden master hashes:');
  console.log(`'keyword_analysis.json': '${analysisHash}',`);
  console.log(`'keyword-checklist.md': '${checklistHash}'`);
  
  return {
    'keyword_analysis.json': analysisHash,
    'keyword-checklist.md': checklistHash
  };
}