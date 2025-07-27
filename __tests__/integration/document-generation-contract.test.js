/**
 * Document Generation Service Contract Tests
 * Content-based validation using static test data and DOCX content hashing
 * Replaces superficial file size validation with robust regression testing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the document orchestrator (same as CLI uses)
import { orchestrateGeneration } from '../../document-orchestrator.js';

// Import CLI utilities for proper data formatting
import { resolvePaths, loadResumeData } from '../../path-resolver.js';
import { determineGenerationPlan } from '../../cli-parser.js';

// Import DOCX content extraction utilities
import { extractDocxContent, generateContentHash, validateDocxContentHash, extractMultipleContentHashes } from '../../utils/docx-content-extractor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static test application for consistent baseline
const TEST_APPLICATION = 'test-validation';
const TEST_APP_PATH = path.resolve(__dirname, '../../../data/applications', TEST_APPLICATION);
const GOLDEN_MASTER_PATH = path.resolve(__dirname, '../golden-master/document-content-hashes.json');

describe('Document Generation Service Contract', () => {
  let testResumeData;
  let testOutputPath;
  let testPaths;

  beforeAll(async () => {
    // Verify test application exists
    if (!fs.existsSync(TEST_APP_PATH)) {
      throw new Error(`Test application not found: ${TEST_APP_PATH}`);
    }
    
    // STATIC DATA VALIDATION: Ensure we're using fixed test data, not live data
    const expectedTestApp = 'test-validation';
    if (TEST_APPLICATION !== expectedTestApp) {
      throw new Error(`Contract tests must use static test data. Expected: ${expectedTestApp}, Got: ${TEST_APPLICATION}`);
    }
    
    // Verify test data hasn't been accidentally modified to point to live applications
    const forbiddenApplications = ['general-application', 'live-application', 'production'];
    if (forbiddenApplications.includes(TEST_APPLICATION)) {
      throw new Error(`Contract tests cannot use live application data: ${TEST_APPLICATION}. Use 'test-validation' for static testing.`);
    }
    
    // Verify test data paths are within the data/applications/test-validation directory
    const normalizedTestPath = path.normalize(TEST_APP_PATH);
    if (!normalizedTestPath.includes('data/applications/test-validation')) {
      throw new Error(`Test data path security violation. Expected test-validation directory, got: ${normalizedTestPath}`);
    }
    // Use CLI path resolver to get proper paths (same as CLI)
    testPaths = resolvePaths(TEST_APPLICATION, path.resolve(__dirname, '../../'));
    
    // Load test resume data using CLI method
    const resumeDataResult = loadResumeData(testPaths.resumeDataPath);
    expect(resumeDataResult.isValid).toBe(true);
    testResumeData = resumeDataResult.data;
    
    // Ensure test outputs directory exists
    testOutputPath = path.join(TEST_APP_PATH, 'outputs');
    if (!fs.existsSync(testOutputPath)) {
      fs.mkdirSync(testOutputPath, { recursive: true });
    }
  });

  describe('Content-Based Validation', () => {
    test('should generate resume with correct content', async () => {
      // Create generation plan (same as CLI)
      const generationPlan = determineGenerationPlan({ resume: true }, true);
      
      // Generate document using CLI interface
      const generatedFiles = await orchestrateGeneration(generationPlan, testPaths, testResumeData, false);
      
      // Verify generation succeeded
      expect(generatedFiles).toBeDefined();
      expect(generatedFiles.length).toBeGreaterThan(0);
      
      // Find the generated resume file
      const resumeFile = generatedFiles.find(f => 
        f.includes('Resume') && f.endsWith('.docx')
      );
      expect(resumeFile).toBeDefined();
      expect(fs.existsSync(resumeFile)).toBe(true);

      // Extract and validate content
      const extractedContent = await extractDocxContent(resumeFile);
      
      // Verify key resume data appears in document
      expect(extractedContent).toContain(testResumeData.basics.name);
      expect(extractedContent).toContain(testResumeData.basics.email);
      expect(extractedContent).toContain(testResumeData.work[0].name);
      expect(extractedContent).toContain(testResumeData.work[0].position);
      
      // Verify document structure elements (actual generated content structure)
      expect(extractedContent).toContain('EXPERIENCE');
      expect(extractedContent).toContain('EDUCATION');
      expect(extractedContent).toContain('SKILLS');
    });

    test('should generate cover letter with correct content', async () => {
      // Create generation plan for cover letter (same as CLI)
      const generationPlan = determineGenerationPlan({ 'cover-letter': true }, true);
      
      // Generate document using CLI interface
      const generatedFiles = await orchestrateGeneration(generationPlan, testPaths, testResumeData, false);
      
      // Verify generation succeeded
      expect(generatedFiles).toBeDefined();
      expect(generatedFiles.length).toBeGreaterThan(0);
      
      // Find the generated cover letter file
      const coverLetterFile = generatedFiles.find(f => 
        f.includes('Cover-Letter') && f.endsWith('.docx')
      );
      expect(coverLetterFile).toBeDefined();
      expect(fs.existsSync(coverLetterFile)).toBe(true);

      // Extract and validate content
      const extractedContent = await extractDocxContent(coverLetterFile);
      
      // Verify key content appears in cover letter
      expect(extractedContent).toContain(testResumeData.basics.name);
      expect(extractedContent).toContain('Dear Hiring Manager');
      expect(extractedContent).toContain('Best regards');
    });

    test('should generate combined document with correct content', async () => {
      // Create generation plan for combined document (same as CLI)
      const generationPlan = determineGenerationPlan({ combined: true }, true);
      
      // Generate document using CLI interface
      const generatedFiles = await orchestrateGeneration(generationPlan, testPaths, testResumeData, false);
      
      // Verify generation succeeded
      expect(generatedFiles).toBeDefined();
      expect(generatedFiles.length).toBeGreaterThan(0);
      
      // Find the generated combined file
      const combinedFile = generatedFiles.find(f => 
        f.includes('Cover-Letter-and-Resume') && f.endsWith('.docx')
      );
      expect(combinedFile).toBeDefined();
      expect(fs.existsSync(combinedFile)).toBe(true);

      // Extract and validate content
      const extractedContent = await extractDocxContent(combinedFile);
      
      // Verify both resume and cover letter content
      expect(extractedContent).toContain(testResumeData.basics.name);
      expect(extractedContent).toContain(testResumeData.work[0].name);
      expect(extractedContent).toContain('Dear Hiring Manager');
      expect(extractedContent).toContain('EXPERIENCE');
    });
  });

  describe('Golden Master Hash Validation', () => {
    test('should maintain consistent content hashes', async () => {
      // Skip if golden master file doesn't exist yet
      if (!fs.existsSync(GOLDEN_MASTER_PATH)) {
        console.log('Golden master hashes not found - skipping hash validation');
        console.log('Run "npm run update-document-generation-golden-masters" to create baseline');
        return;
      }

      // Load expected hashes
      const expectedHashes = JSON.parse(fs.readFileSync(GOLDEN_MASTER_PATH, 'utf8'));
      
      // Generate each document type individually to match production pipeline
      const resumeFiles = await orchestrateGeneration(
        determineGenerationPlan({ resume: true }, true), 
        testPaths, 
        testResumeData, 
        false
      );
      
      const coverLetterFiles = await orchestrateGeneration(
        determineGenerationPlan({ 'cover-letter': true }, true), 
        testPaths, 
        testResumeData, 
        false
      );
      
      const combinedFiles = await orchestrateGeneration(
        determineGenerationPlan({ combined: true }, true), 
        testPaths, 
        testResumeData, 
        false
      );
      
      // Combine all generated files (matches golden master approach)
      const generatedFiles = [...resumeFiles, ...coverLetterFiles, ...combinedFiles];
      
      // Verify generation succeeded
      expect(generatedFiles).toBeDefined();
      expect(generatedFiles.length).toBeGreaterThan(0);

      // Validate each document type against golden master
      const documentTypes = [
        { type: 'resume', pattern: 'Resume' },
        { type: 'cover-letter', pattern: 'Cover-Letter' },
        { type: 'combined', pattern: 'Cover-Letter-and-Resume' }
      ];
      
      for (const { type: docType, pattern } of documentTypes) {
        const generatedFile = generatedFiles.find(f => 
          f.includes(pattern) && f.endsWith('.docx')
        );
        
        if (generatedFile && expectedHashes[TEST_APPLICATION] && expectedHashes[TEST_APPLICATION][docType]) {
          const expectedHash = expectedHashes[TEST_APPLICATION][docType].contentHash;
          const validation = await validateDocxContentHash(generatedFile, expectedHash);
          
          if (!validation.valid) {
            const errorMsg = `
Content hash mismatch for ${docType}:
  Expected: ${expectedHash}
  Actual:   ${validation.actualHash}
  
This indicates the document generation pipeline has changed.
If this change was intentional, update golden masters with:
  npm run update-document-generation-golden-masters
            `;
            throw new Error(errorMsg);
          }
        }
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle missing input files gracefully', async () => {
      // Test with invalid resume data (CLI orchestration will handle gracefully)
      const invalidResumeData = null;

      const generationPlan = determineGenerationPlan({ resume: true }, false);
      
      // Should handle invalid resume data gracefully
      await expect(async () => {
        await orchestrateGeneration(generationPlan, testPaths, invalidResumeData, false);
      }).rejects.toThrow(); // CLI orchestration throws on invalid resume data
    });
  });
});
