/**
 * Unit Tests for CLI Parser - Vitest Version (Proof of Concept)
 * Tests command line argument parsing and validation
 */

import { parseCliArguments, validateCliArguments } from '../../cli/argument-parser.js';
import { determineGenerationPlan, validateGenerationPlan } from '../../core/generation-planning.js';
import { MockDataUtils as _MockDataUtils, ConsoleUtils as _ConsoleUtils } from '../helpers/test-utils.js';

describe('CLI Parser (Vitest POC)', () => {
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
        flags: { preview: true },
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

    test('should handle default behavior with markdown', () => {
      const flags = {};
      const hasMarkdownFile = true;
      
      const plan = determineGenerationPlan(flags, hasMarkdownFile);
      
      expect(plan.generateResume).toBe(true);
      expect(plan.generateCoverLetter).toBe(true);
      expect(plan.generateCombinedDoc).toBe(true);
      expect(plan.runHiringEvaluation).toBe(false);
      expect(plan.behaviorDescription).toContain('Default behavior');
    });
  });
});
