/**
 * Unit Tests for Path Resolver
 * Tests path resolution and validation functionality
 */

const { resolvePaths, validatePaths, hasMarkdownFile, loadResumeData } = require('../../path-resolver');
const { TestFileUtils, MockDataUtils } = require('../helpers/test-utils');
const fs = require('fs');
const path = require('path');

describe('Path Resolver', () => {
  let tempDir;

  beforeEach(() => {
    // Create temporary test directory structure
    tempDir = path.join(__dirname, '../fixtures/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temporary files
    TestFileUtils.cleanupTempFiles();
  });

  describe('resolvePaths', () => {
    test('should resolve basic paths correctly', () => {
      const paths = resolvePaths('test-app', __dirname);
      
      expect(paths.companyName).toBe('Test');
      expect(paths.applicationFolderPath).toContain('test-app');
      expect(paths.resumeDataPath).toContain('resume.json');
      expect(paths.markdownFilePath).toContain('cover-letter.md');
      expect(paths.outputsDir).toContain('outputs');
    });

    test('should handle complex application names', () => {
      const paths = resolvePaths('my-company-role', __dirname);
      
      expect(paths.companyName).toBe('My');
      expect(paths.applicationFolderPath).toContain('my-company-role');
    });

    test('should resolve relative paths correctly', () => {
      const applicationName = 'test-app';
      const baseDir = path.resolve(__dirname, '../..');
      
      const paths = resolvePaths(applicationName, baseDir);
      
      expect(path.isAbsolute(paths.applicationFolderPath)).toBe(true);
      expect(path.isAbsolute(paths.resumeDataPath)).toBe(true);
      expect(path.isAbsolute(paths.outputsDir)).toBe(true);
    });

    test('should extract company name from application name', () => {
      const applicationName = 'google-software-engineer';
      const baseDir = __dirname;
      
      const paths = resolvePaths(applicationName, baseDir);
      
      // Should extract company name (implementation-dependent)
      expect(paths.companyName).toBeDefined();
      expect(typeof paths.companyName).toBe('string');
    });
  });

  describe('validatePaths', () => {
    test('should validate existing directory structure', () => {
      // Create mock directory structure
      const appDir = path.join(tempDir, 'test-app');
      const inputsDir = path.join(appDir, 'inputs');
      const outputsDir = path.join(appDir, 'outputs');
      
      fs.mkdirSync(appDir, { recursive: true });
      fs.mkdirSync(inputsDir, { recursive: true });
      fs.mkdirSync(outputsDir, { recursive: true });
      
      // Create resume.json
      const resumePath = path.join(inputsDir, 'resume.json');
      fs.writeFileSync(resumePath, JSON.stringify(MockDataUtils.createMockResumeData()));
      
      const paths = {
        applicationFolderPath: appDir,
        resumeDataPath: resumePath,
        outputsDir: outputsDir
      };
      
      const result = validatePaths(paths);
      expect(result.isValid).toBe(true);
    });

    test('should reject non-existent application directory', () => {
      const paths = {
        applicationFolderPath: '/nonexistent/path',
        resumeDataPath: '/nonexistent/resume.json',
        outputsDir: '/nonexistent/outputs'
      };
      
      const result = validatePaths(paths);
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('FILE_NOT_FOUND');
      expect(result.legacyErrorType).toBe('APPLICATION_NOT_FOUND');
    });

    test('should reject missing resume data file', () => {
      // Create a temporary application directory but no resume file
      const tempAppDir = TestFileUtils.createTempDir('test-app');
      const paths = {
        applicationFolderPath: tempAppDir,
        resumeDataPath: path.join(tempAppDir, 'resume.json'),
        outputsDir: path.join(tempAppDir, 'outputs')
      };
      
      const result = validatePaths(paths);
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('FILE_NOT_FOUND');
      expect(result.error).toContain('resume.json');
      expect(result.legacyErrorType).toBe('RESUME_NOT_FOUND');
    });

    test('should create output directory if it does not exist', () => {
      // Create a temporary application directory and resume file
      const tempAppDir = TestFileUtils.createTempDir('test-app');
      const resumePath = TestFileUtils.createTempFile('resume.json', '{}', tempAppDir);
      const outputsDir = path.join(tempAppDir, 'outputs');
      
      const paths = {
        applicationFolderPath: tempAppDir,
        resumeDataPath: resumePath,
        outputsDir: outputsDir
      };
      
      const result = validatePaths(paths);
      expect(result.isValid).toBe(true);
      expect(fs.existsSync(outputsDir)).toBe(true);
    });
  });

  describe('hasMarkdownFile', () => {
    test('should return true for existing markdown file', () => {
      const markdownPath = TestFileUtils.createTempFile('cover-letter.md', '# Cover Letter\n\nContent here.');
      
      const result = hasMarkdownFile(markdownPath);
      expect(result).toBe(true);
    });

    test('should return false for non-existent markdown file', () => {
      const markdownPath = path.join(tempDir, 'nonexistent.md');
      
      const result = hasMarkdownFile(markdownPath);
      expect(result).toBe(false);
    });

    test('should return false for empty path', () => {
      const result = hasMarkdownFile('');
      expect(result).toBe(false);
    });

    test('should return false for null path', () => {
      const result = hasMarkdownFile(null);
      expect(result).toBe(false);
    });
  });

  describe('loadResumeData', () => {
    test('should load valid resume data', () => {
      const mockData = MockDataUtils.createMockResumeData();
      const resumePath = TestFileUtils.createTempFile('resume.json', JSON.stringify(mockData));
      
      const result = loadResumeData(resumePath);
      
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    test('should reject non-existent resume file', () => {
      const resumePath = path.join(tempDir, 'nonexistent-resume.json');
      
      const result = loadResumeData(resumePath);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Error loading resume data');
    });

    test('should reject invalid JSON', () => {
      const resumePath = TestFileUtils.createTempFile('invalid-resume.json', '{ invalid json content');
      
      const result = loadResumeData(resumePath);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('JSON');
    });

    test('should reject empty file', () => {
      const resumePath = TestFileUtils.createTempFile('empty-resume.json', '');
      
      const result = loadResumeData(resumePath);
      
      expect(result.isValid).toBe(false);
    });

    test('should validate resume data structure', () => {
      const invalidData = { name: 'John Doe' }; // Missing required fields
      const resumePath = TestFileUtils.createTempFile('minimal-resume.json', JSON.stringify(invalidData));
      
      const result = loadResumeData(resumePath);
      
      // Should either be valid (if minimal structure is acceptable) or invalid with clear message
      expect(typeof result.isValid).toBe('boolean');
      if (!result.isValid) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle undefined application name gracefully', () => {
      expect(() => resolvePaths(undefined, __dirname)).toThrow();
    });

    test('should handle null base directory gracefully', () => {
      expect(() => resolvePaths('test-app', null)).toThrow();
    });

    test('should handle very long application names', () => {
      const longName = 'a'.repeat(100);
      const paths = resolvePaths(longName, __dirname);
      
      expect(paths.companyName).toBe('Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    });

    test('should handle paths with unicode characters', () => {
      const unicodeName = 'test-app-🚀-2024';
      const paths = resolvePaths(unicodeName, __dirname);
      
      expect(paths.companyName).toBe('Test');
    });

    test('should handle permission errors gracefully', () => {
      // This test might be platform-specific and could be skipped on some systems
      const paths = {
        applicationFolderPath: '/root/restricted', // Typically restricted on Unix systems
        resumeDataPath: '/root/restricted/resume.json',
        outputFolderPath: '/root/restricted/outputs'
      };
      
      const result = validatePaths(paths);
      expect(result.isValid).toBe(false);
      // Should handle permission errors gracefully, not crash
    });
  });
});
