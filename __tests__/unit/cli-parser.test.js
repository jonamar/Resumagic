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
      const config = { applicationName: null, flags: {} };
      const result = validateCliArguments(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Error: Please specify an application folder name.');
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
      const flags = {};
      const hasMarkdownFile = false;
      
      const plan = determineGenerationPlan(flags, hasMarkdownFile);
      
      expect(plan.generateResume).toBe(true);
      expect(plan.generateCoverLetter).toBe(false);
      expect(plan.generateCombinedDoc).toBe(false);
      expect(plan.behaviorDescription).toContain('resume only');
    });

    test('should create plan for cover letter only', () => {
      const flags = { coverLetter: true };
      const hasMarkdownFile = true;
      
      const plan = determineGenerationPlan(flags, hasMarkdownFile);
      
      expect(plan.generateResume).toBe(false);
      expect(plan.generateCoverLetter).toBe(true);
      expect(plan.generateCombinedDoc).toBe(false);
      expect(plan.behaviorDescription).toBe('Cover letter only mode');
    });

    test('should create plan for both documents', () => {
      const flags = { both: true };
      const hasMarkdownFile = true;
      
      const plan = determineGenerationPlan(flags, hasMarkdownFile);
      
      expect(plan.generateResume).toBe(true);
      expect(plan.generateCoverLetter).toBe(true);
      expect(plan.generateCombinedDoc).toBe(false);
      expect(plan.behaviorDescription).toBe('Both resume and cover letter mode');
    });

    test('should handle default behavior with markdown', () => {
      const flags = {};
      const hasMarkdownFile = true;
      
      const plan = determineGenerationPlan(flags, hasMarkdownFile);
      
      expect(plan.generateResume).toBe(true);
      expect(plan.generateCoverLetter).toBe(true);
      expect(plan.generateCombinedDoc).toBe(true);
      expect(plan.behaviorDescription).toContain('Default behavior');
    });
  });

  describe('validateGenerationPlan', () => {
    test('should validate valid resume-only plan', () => {
      const plan = {
        generateResume: true,
        generateCoverLetter: false,
        generateCombinedDoc: false
      };
      const markdownExists = false;
      const markdownPath = '/path/to/cover-letter.md';
      
      const result = validateGenerationPlan(plan, markdownExists, markdownPath);
      expect(result.isValid).toBe(true);
    });

    test('should reject cover letter plan when markdown missing', () => {
      const plan = { generateCoverLetter: true, generateCombinedDoc: false };
      const markdownExists = false;
      const markdownPath = '/path/to/missing.md';
      
      const result = validateGenerationPlan(plan, markdownExists, markdownPath);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Error: Cover letter generation requested but no markdown file found.');
    });

    test('should validate both documents when markdown exists', () => {
      const plan = {
        generateResume: true,
        generateCoverLetter: true,
        generateCombinedDoc: true
      };
      const markdownExists = true;
      const markdownPath = '/path/to/cover-letter.md';
      
      const result = validateGenerationPlan(plan, markdownExists, markdownPath);
      expect(result.isValid).toBe(true);
    });

    test('should handle both documents when markdown missing (should generate resume only)', () => {
      const plan = { generateCoverLetter: true, generateCombinedDoc: true };
      const markdownExists = false;
      const markdownPath = '/path/to/missing.md';
      
      const result = validateGenerationPlan(plan, markdownExists, markdownPath);
      
      // Should fail validation since cover letter is requested but markdown is missing
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Error: Cover letter generation requested but no markdown file found.');
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
