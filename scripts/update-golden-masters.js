#!/usr/bin/env node

/**
 * Golden Master Update Script
 * Updates golden master hashes for document generation testing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { orchestrateGeneration } from '../services/document-generation/document-orchestration';
import { resolvePaths, loadResumeData } from '../services/document-generation/path-resolution';
import { determineGenerationPlan } from '../services/document-generation/generation-planning';
import { extractDocxContent, generateContentHash } from '../utils/docx-content-extractor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_TYPE = process.argv[2];

if (!SERVICE_TYPE) {
  console.error('Usage: node scripts/update-golden-masters.js <service-type>');
  console.error('Example: node scripts/update-golden-masters.js document-generation');
  process.exit(1);
}

async function updateDocumentGenerationMasters() {
  console.log('🔄 Updating document generation golden masters...');
  
  // Use same test application as contract tests
  const TEST_APPLICATION = 'test-validation';
  const testPaths = resolvePaths(TEST_APPLICATION, path.resolve(__dirname, '../'));
  
  // Load test resume data
  const resumeDataResult = loadResumeData(testPaths.resumeDataPath);
  if (!resumeDataResult.isValid) {
    throw new Error(`Failed to load test resume data: ${resumeDataResult.error}`);
  }
  const testResumeData = resumeDataResult.data;
  
  // Generate all document types using EXACT SAME method as production tests
  console.log('📄 Generating documents for baseline...');
  
  // CRITICAL: Use identical generation plans as tests to ensure hash consistency
  const resumeResults = await orchestrateGeneration(
    determineGenerationPlan({ resume: true }, true), 
    testPaths, 
    testResumeData, 
    false,
  );
  
  const coverLetterResults = await orchestrateGeneration(
    determineGenerationPlan({ 'cover-letter': true }, true), 
    testPaths, 
    testResumeData, 
    false,
  );
  
  const combinedResults = await orchestrateGeneration(
    determineGenerationPlan({ combined: true }, true), 
    testPaths, 
    testResumeData, 
    false,
  );
  
  // Combine all generated files (same as production would create)
  const generatedFiles = [...resumeResults, ...coverLetterResults, ...combinedResults];
  
  console.log(`✅ Generated ${generatedFiles.length} documents`);
  
  // Extract content hashes
  console.log('🔍 Extracting content hashes...');
  const documentTypes = [
    { type: 'resume', pattern: 'Resume' },
    { type: 'cover-letter', pattern: 'Cover-Letter' },
    { type: 'combined', pattern: 'Cover-Letter-and-Resume' },
  ];
  
  const masterHashes = {
    [TEST_APPLICATION]: {},
    metadata: {
      created: new Date().toISOString(),
      description: 'Golden master content hashes for document generation regression testing',
      testApplication: TEST_APPLICATION,
    },
  };
  
  for (const { type: docType, pattern } of documentTypes) {
    const generatedFile = generatedFiles.find(f => 
      f.includes(pattern) && f.endsWith('.docx'),
    );
    
    if (generatedFile) {
      try {
        const content = await extractDocxContent(generatedFile);
        const contentHash = generateContentHash(content);
        
        masterHashes[TEST_APPLICATION][docType] = {
          contentHash: contentHash,
          filePath: generatedFile,
          lastUpdated: new Date().toISOString(),
          contentLength: content.length,
        };
        
        console.log(`✅ ${docType}: ${contentHash.substring(0, 16)}...`);
        console.log(`   Content length: ${content.length} characters`);
        
      } catch (error) {
        console.warn(`⚠️  Hash extraction failed for ${docType}: ${error.message}`);
        masterHashes[TEST_APPLICATION][docType] = {
          contentHash: 'extraction-failed',
          filePath: generatedFile,
          lastUpdated: new Date().toISOString(),
          error: error.message,
        };
      }
    } else {
      console.warn(`⚠️  Document type ${docType} not found in generated files`);
    }
  }
  
  // Ensure golden master directory exists
  const goldenMasterDir = path.resolve(__dirname, '../__tests__/golden-master');
  if (!fs.existsSync(goldenMasterDir)) {
    fs.mkdirSync(goldenMasterDir, { recursive: true });
  }
  
  // Write golden master hashes
  const goldenMasterPath = path.join(goldenMasterDir, 'document-content-hashes.json');
  fs.writeFileSync(goldenMasterPath, JSON.stringify(masterHashes, null, 2));
  
  console.log(`📝 Golden master hashes saved to: ${goldenMasterPath}`);
  console.log('🎯 Document generation golden masters updated successfully!');
}

async function main() {
  try {
    switch (SERVICE_TYPE) {
    case 'document-generation':
      await updateDocumentGenerationMasters();
      break;
    default:
      console.error(`Unknown service type: ${SERVICE_TYPE}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to update golden masters:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
