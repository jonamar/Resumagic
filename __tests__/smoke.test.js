/**
 * Resumagic Smoke Tests
 * Simple tests that verify core functionality works without crashing
 * Tests the interface, not the implementation
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { analyzeKeywords } from '../services/keyword-analysis';
import { evaluateCandidate } from '../services/hiring-evaluation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data paths
const testDataPath = path.join(__dirname, 'test-data');
const keywordsFile = path.join(testDataPath, 'keywords.json');
const jobPostingFile = path.join(testDataPath, 'job-posting.md');
const resumeFile = path.join(testDataPath, 'resume.json');

// Use a real test application that exists in the data directory
const TEST_APPLICATION = 'test-validation';

describe('Resumagic Smoke Tests', () => {
  test('service functions are importable', () => {
    // Test that we can import the main service functions without errors
    expect(typeof analyzeKeywords).toBe('function');
    expect(typeof evaluateCandidate).toBe('function');
  });

  test('test data files exist', () => {
    // Test that our test data is properly set up
    expect(fs.existsSync(keywordsFile)).toBe(true);
    expect(fs.existsSync(jobPostingFile)).toBe(true);
    expect(fs.existsSync(resumeFile)).toBe(true);
    
    // Test that test data is valid JSON/content
    const keywords = JSON.parse(fs.readFileSync(keywordsFile, 'utf8'));
    const resumeData = JSON.parse(fs.readFileSync(resumeFile, 'utf8'));
    const jobPosting = fs.readFileSync(jobPostingFile, 'utf8');
    
    expect(Array.isArray(keywords)).toBe(true);
    expect(typeof resumeData).toBe('object');
    expect(typeof jobPosting).toBe('string');
    expect(jobPosting.length).toBeGreaterThan(0);
  });

  test('handles invalid input gracefully', async () => {
    // Test error handling - should throw, not crash
    await expect(
      analyzeKeywords('nonexistent-app', keywordsFile, jobPostingFile),
    ).rejects.toThrow();
    
    await expect(
      analyzeKeywords(TEST_APPLICATION, 'nonexistent.json', jobPostingFile),
    ).rejects.toThrow();
  });

  test('evaluateCandidate validates input', async () => {
    // Test that function validates input properly
    await expect(
      evaluateCandidate('', {}),
    ).rejects.toThrow();
    
    await expect(
      evaluateCandidate(TEST_APPLICATION, null),
    ).rejects.toThrow();
  });

  // Commented out slow external service tests - uncomment for full integration testing
  /*
  test('analyzes keywords without crashing', async () => {
    const result = await analyzeKeywords(TEST_APPLICATION, keywordsFile, jobPostingFile, resumeFile);
    expect(result).toBeDefined();
    expect(result.applicationName).toBe(TEST_APPLICATION);
    expect(Array.isArray(result.keywords)).toBe(true);
  }, 10000);
  
  test('evaluates candidate without crashing', async () => {
    const resumeData = JSON.parse(fs.readFileSync(resumeFile, 'utf8'));
    const result = await evaluateCandidate(TEST_APPLICATION, resumeData);
    expect(result).toBeDefined();
    expect(typeof result.overallScore).toBe('number');
  }, 60000);
  */
});
