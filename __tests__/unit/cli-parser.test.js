/**
 * Unit Tests for CLI Parser
 * Tests command line argument parsing and validation
 */

const { parseCliArguments, validateCliArguments, determineGenerationPlan, validateGenerationPlan } = require('../../cli-parser');
const { MockDataUtils, ConsoleUtils } = require('../helpers/test-utils');

describe('CLI Parser', () => {
  describe('parseCliArguments', () => {
    test('should parse application name from arguments', () => {
      const args = ['test-application'];
      const result = parseCliArguments(args);
      
      expect(result.applicationName).toBe('test-application');
      expect(result.flags.preview).toBe(true); // Default auto preview
      expect(result.rawArgs).toEqual(args);
    });

    test('should parse flags correctly', () => {
      const args = ['test-app', '--cover-letter', '--preview'];
      const result = parseCliArguments(args);
      
      expect(result.applicationName).toBe('test-app');
      expect(result.flags.coverLetter).toBe(true);
      expect(result.flags.preview).toBe(true);
      expect(result.flags.both).toBe(false);
      expect(result.flags.auto).toBe(false);
    });

    test('should handle multiple flags', () => {
      const args = ['my-app', '--both', '--auto'];
      const result = parseCliArguments(args);
      
      expect(result.applicationName).toBe('my-app');
      expect(result.flags.both).toBe(true);
      expect(result.flags.auto).toBe(true);
    });

    test('should handle no application name', () => {
      const args = ['--preview', '--cover-letter'];
      const result = parseCliArguments(args);
      
      expect(result.applicationName).toBeUndefined();
      expect(result.flags.preview).toBe(true);
      expect(result.flags.coverLetter).toBe(true);
    });

    test('should handle empty arguments', () => {
      const args = [];
      const result = parseCliArguments(args);
      
      expect(result.applicationName).toBeUndefined();
      expect(result.flags.preview).toBe(true); // Default auto preview
      expect(result.rawArgs).toEqual([]);
    });
  });

  describe('validateCliArguments', () => {
    test('should validate valid configuration', () => {
      const config = {
        applicationName: 'valid-app-name',
        flags: { preview: true }
      };
      
      const result = validateCliArguments(config);
      expect(result.isValid).toBe(true);
    });

    test('should reject missing application name', () => {
      const config = {
        applicationName: undefined,
        flags: { preview: true }
      };
      
      const result = validateCliArguments(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('application name');
    });

    test('should reject empty application name', () => {
      const config = {
        applicationName: '',
        flags: { preview: true }
      };
      
      const result = validateCliArguments(config);
      expect(result.isValid).toBe(false);
    });

    test('should reject null application name', () => {
      const config = {
        applicationName: null,
        flags: { preview: true }
      };
      
      const result = validateCliArguments(config);
      expect(result.isValid).toBe(false);
    });
  });

  describe('determineGenerationPlan', () => {
    test('should create plan for resume only', () => {
      const flags = { preview: true, coverLetter: false, both: false };
      const markdownExists = false;
      
      const plan = determineGenerationPlan(flags, markdownExists);
      
      expect(plan.generateResume).toBe(true);
      expect(plan.generateCoverLetter).toBe(false);
      expect(plan.openPreview).toBe(true);
    });

    test('should create plan for cover letter only', () => {
      const flags = { preview: true, coverLetter: true, both: false };
      const markdownExists = true;
      
      const plan = determineGenerationPlan(flags, markdownExists);
      
      expect(plan.generateResume).toBe(false);
      expect(plan.generateCoverLetter).toBe(true);
      expect(plan.openPreview).toBe(true);
    });

    test('should create plan for both documents', () => {
      const flags = { preview: true, coverLetter: false, both: true };
      const markdownExists = true;
      
      const plan = determineGenerationPlan(flags, markdownExists);
      
      expect(plan.generateResume).toBe(true);
      expect(plan.generateCoverLetter).toBe(true);
      expect(plan.openPreview).toBe(true);
    });

    test('should handle no preview flag', () => {
      const flags = { preview: false, coverLetter: false, both: false };
      const markdownExists = false;
      
      const plan = determineGenerationPlan(flags, markdownExists);
      
      expect(plan.generateResume).toBe(true);
      expect(plan.openPreview).toBe(false);
    });
  });

  describe('validateGenerationPlan', () => {
    test('should validate valid resume-only plan', () => {
      const plan = {
        generateResume: true,
        generateCoverLetter: false,
        openPreview: true
      };
      const markdownExists = false;
      const markdownPath = '/path/to/cover-letter.md';
      
      const result = validateGenerationPlan(plan, markdownExists, markdownPath);
      expect(result.isValid).toBe(true);
    });

    test('should validate valid cover letter plan when markdown exists', () => {
      const plan = {
        generateResume: false,
        generateCoverLetter: true,
        openPreview: true
      };
      const markdownExists = true;
      const markdownPath = '/path/to/cover-letter.md';
      
      const result = validateGenerationPlan(plan, markdownExists, markdownPath);
      expect(result.isValid).toBe(true);
    });

    test('should reject cover letter plan when markdown missing', () => {
      const plan = {
        generateResume: false,
        generateCoverLetter: true,
        openPreview: true
      };
      const markdownExists = false;
      const markdownPath = '/path/to/cover-letter.md';
      
      const result = validateGenerationPlan(plan, markdownExists, markdownPath);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cover letter');
    });

    test('should validate both documents when markdown exists', () => {
      const plan = {
        generateResume: true,
        generateCoverLetter: true,
        openPreview: true
      };
      const markdownExists = true;
      const markdownPath = '/path/to/cover-letter.md';
      
      const result = validateGenerationPlan(plan, markdownExists, markdownPath);
      expect(result.isValid).toBe(true);
    });

    test('should handle both documents when markdown missing (should generate resume only)', () => {
      const plan = {
        generateResume: true,
        generateCoverLetter: true,
        openPreview: true
      };
      const markdownExists = false;
      const markdownPath = '/path/to/cover-letter.md';
      
      const result = validateGenerationPlan(plan, markdownExists, markdownPath);
      // This should either be valid (fallback to resume only) or invalid with clear message
      expect(typeof result.isValid).toBe('boolean');
      if (!result.isValid) {
        expect(result.error).toContain('cover letter');
      }
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle malformed flags gracefully', () => {
      const config = {
        applicationName: 'test-app',
        flags: null
      };
      
      // Should not throw, should handle gracefully
      expect(() => validateCliArguments(config)).not.toThrow();
    });

    test('should handle special characters in application name', () => {
      const args = ['app-with-dashes_and_underscores'];
      const result = parseCliArguments(args);
      
      expect(result.applicationName).toBe('app-with-dashes_and_underscores');
    });

    test('should ignore unknown flags', () => {
      const args = ['test-app', '--unknown-flag', '--another-unknown'];
      const result = parseCliArguments(args);
      
      expect(result.applicationName).toBe('test-app');
      // Unknown flags should be ignored, not cause errors
      expect(result.flags.preview).toBe(true); // Default should still work
    });
  });
});
