/**
 * Unit Tests for Error Handler - Vitest
 * Comprehensive test suite for error handling utilities
 */

import { vi } from 'vitest';
import ErrorHandler from '../error-handler.js';
import { ERROR_TYPES, ERROR_SEVERITY, CONTEXT_TYPES } from '../error-types.js';

// Mock console methods to capture output
const originalConsoleError = console.error;
let consoleOutput = [];

beforeEach(() => {
  consoleOutput = [];
  console.error = vi.fn((...args) => {
    consoleOutput.push(args.join(' '));
  });
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('ErrorHandler', () => {
  describe('logError', () => {
    test('should log basic error message', () => {
      ErrorHandler.logError({
        message: 'Test error message',
      });

      expect(console.error).toHaveBeenCalled();
      expect(consoleOutput[0]).toContain('❌ Test error message');
    });

    test('should log error with original error object', () => {
      const originalError = new Error('Original error');
      
      ErrorHandler.logError({
        message: 'Test error message',
        error: originalError,
      });

      expect(consoleOutput).toHaveLength(2);
      expect(consoleOutput[0]).toContain('❌ Test error message');
      expect(consoleOutput[1]).toContain('Original error');
    });

    test('should log error with context information', () => {
      ErrorHandler.logError({
        message: 'Test error message',
        context: {
          filePath: '/test/path.js',
          operation: 'read',
        },
      });

      expect(consoleOutput).toContain('   filePath: /test/path.js');
      expect(consoleOutput).toContain('   operation: read');
    });

    test('should log error with details array', () => {
      ErrorHandler.logError({
        message: 'Test error message',
        details: ['Detail 1', 'Detail 2', 'Detail 3'],
      });

      expect(consoleOutput).toContain('   Detail 1');
      expect(consoleOutput).toContain('   Detail 2');
      expect(consoleOutput).toContain('   Detail 3');
    });

    test('should limit details to maxContextLines', () => {
      const manyDetails = Array.from({ length: 10 }, (_, i) => `Detail ${i + 1}`);
      
      ErrorHandler.logError({
        message: 'Test error message',
        details: manyDetails,
      });

      // Should show first 5 details plus truncation message
      expect(consoleOutput).toContain('   Detail 1');
      expect(consoleOutput).toContain('   Detail 5');
      expect(consoleOutput.some(line => line.includes('... and 5 more details'))).toBe(true);
    });

    test('should not log when logging is disabled', () => {
      ErrorHandler.updateConfig({
        logging: { logToConsole: false },
      });

      ErrorHandler.logError({
        message: 'Test error message',
      });

      expect(console.error).not.toHaveBeenCalled();

      // Reset config
      ErrorHandler.updateConfig({
        logging: { logToConsole: true },
      });
    });
  });

  describe('logServiceError', () => {
    test('should log service error with structured context', () => {
      const error = new Error('Service connection failed');
      
      ErrorHandler.logServiceError('KeywordExtraction', 'extraction', error, {
        url: 'http://localhost:11434',
        timeout: 5000,
      });

      expect(consoleOutput[0]).toContain('❌ KeywordExtraction extraction failed');
      expect(consoleOutput[1]).toContain('Service connection failed');
      expect(consoleOutput).toContain('   service: KeywordExtraction');
      expect(consoleOutput).toContain('   operation: extraction');
      expect(consoleOutput).toContain('   url: http://localhost:11434');
      expect(consoleOutput).toContain('   timeout: 5000');
    });
  });

  describe('logAppError', () => {
    test('should log application error with component context', () => {
      const error = new Error('File not found');
      
      ErrorHandler.logAppError('CLI', 'Invalid application name', error, 
        ['Application name contains invalid characters'], 
        { providedName: 'invalid/name' },
      );

      expect(consoleOutput[0]).toContain('❌ CLI: Invalid application name');
      expect(consoleOutput[1]).toContain('File not found');
      expect(consoleOutput).toContain('   Application name contains invalid characters');
      expect(consoleOutput).toContain('   providedName: invalid/name');
    });
  });

  describe('createResult', () => {
    test('should create successful result', () => {
      const result = ErrorHandler.createResult(true, { data: 'test' });

      expect(result).toEqual({
        isValid: true,
        success: true,
        data: { data: 'test' },
      });
    });

    test('should create error result', () => {
      const result = ErrorHandler.createResult(false, null, 'Test error', ERROR_TYPES.INVALID_INPUT, ['Detail 1']);

      expect(result).toEqual({
        isValid: false,
        success: false,
        error: 'Test error',
        errorType: ERROR_TYPES.INVALID_INPUT,
        details: ['Detail 1'],
      });
    });
  });

  describe('validateInput', () => {
    test('should validate successful input', () => {
      const validator = (value) => typeof value === 'string' && value.length > 0;
      const result = ErrorHandler.validateInput('test', validator, 'testField');

      expect(result.isValid).toBe(true);
      expect(result.data).toBe('test');
    });

    test('should validate failed input', () => {
      const validator = (value) => typeof value === 'string' && value.length > 5;
      const result = ErrorHandler.validateInput('test', validator, 'testField');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid testField');
      expect(result.errorType).toBe(ERROR_TYPES.INVALID_INPUT);
      expect(result.details).toContain('Field: testField');
      expect(result.details).toContain('Value: "test"');
    });

    test('should handle validator exceptions', () => {
      const validator = () => {
        throw new Error('Validator error'); 
      };
      const result = ErrorHandler.validateInput('test', validator, 'testField');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Validation error for testField');
      expect(result.details).toContain('Field: testField');
      expect(result.details).toContain('Error: Validator error');
    });

    test('should use custom error message', () => {
      const validator = () => false;
      const result = ErrorHandler.validateInput('test', validator, 'testField', {
        customMessage: 'Custom validation failed',
      });

      expect(result.error).toBe('Custom validation failed');
    });

    test('should include expected format in details', () => {
      const validator = () => false;
      const result = ErrorHandler.validateInput('test', validator, 'testField', {
        expectedFormat: 'string with length > 5',
      });

      expect(result.details).toContain('Expected: string with length > 5');
    });
  });

  describe('assertRequired', () => {
    test('should pass for valid values', () => {
      expect(() => ErrorHandler.assertRequired('test', 'testField')).not.toThrow();
      expect(() => ErrorHandler.assertRequired(123, 'numberField')).not.toThrow();
      expect(() => ErrorHandler.assertRequired([], 'arrayField')).not.toThrow();
    });

    test('should throw for null values', () => {
      expect(() => ErrorHandler.assertRequired(null, 'testField')).toThrow();
    });

    test('should throw for undefined values', () => {
      expect(() => ErrorHandler.assertRequired(undefined, 'testField')).toThrow();
    });

    test('should throw for empty string', () => {
      expect(() => ErrorHandler.assertRequired('', 'testField')).toThrow();
    });

    test('should throw with correct error properties', () => {
      try {
        ErrorHandler.assertRequired(null, 'testField');
      } catch (error) {
        expect(error.message).toContain('Required field \'testField\' is missing or empty');
        expect(error.type).toBe(ERROR_TYPES.MISSING_REQUIRED_FIELD);
        expect(error.field).toBe('testField');
      }
    });
  });

  describe('buildFileContext', () => {
    test('should build basic file context', async () => {
      const context = await ErrorHandler.buildFileContext('/test/path/file.js');

      expect(context.type).toBe(CONTEXT_TYPES.FILE);
      expect(context.filePath).toBe('/test/path/file.js');
      expect(context.fileName).toBe('file.js');
      expect(context.directory).toBe('/test/path');
    });

    test('should include additional info', async () => {
      const context = await ErrorHandler.buildFileContext('/test/file.js', {
        operation: 'read',
        encoding: 'utf8',
      });

      expect(context.operation).toBe('read');
      expect(context.encoding).toBe('utf8');
    });

    test('should handle file existence check', async () => {
      // Test with a file that likely doesn't exist
      const context = await ErrorHandler.buildFileContext('/nonexistent/file.js');
      
      expect(context.exists).toBe(false);
    });
  });

  describe('buildServiceContext', () => {
    test('should build service context', () => {
      const context = ErrorHandler.buildServiceContext('TestService', 'testOperation');

      expect(context.type).toBe(CONTEXT_TYPES.SERVICE);
      expect(context.service).toBe('TestService');
      expect(context.operation).toBe('testOperation');
      expect(context.timestamp).toBeDefined();
    });

    test('should include additional info', () => {
      const context = ErrorHandler.buildServiceContext('TestService', 'testOperation', {
        url: 'http://localhost:3000',
        timeout: 5000,
      });

      expect(context.url).toBe('http://localhost:3000');
      expect(context.timeout).toBe(5000);
    });
  });

  describe('buildValidationContext', () => {
    test('should build validation context', () => {
      const context = ErrorHandler.buildValidationContext('testField', 'testValue');

      expect(context.type).toBe(CONTEXT_TYPES.VALIDATION);
      expect(context.fieldName).toBe('testField');
      expect(context.providedValue).toBe('"testValue"');
      expect(context.valueType).toBe('string');
    });

    test('should include expected format', () => {
      const context = ErrorHandler.buildValidationContext('testField', 123, 'string');

      expect(context.expectedFormat).toBe('string');
      expect(context.valueType).toBe('number');
    });
  });

  describe('configuration management', () => {
    test('should update configuration', () => {
      const originalConfig = ErrorHandler.getConfig();
      
      ErrorHandler.updateConfig({
        formatting: { useEmojis: false },
      });

      const updatedConfig = ErrorHandler.getConfig();
      expect(updatedConfig.formatting.useEmojis).toBe(false);

      // Reset to original
      ErrorHandler.updateConfig(originalConfig);
    });

    test('should get current configuration', () => {
      const config = ErrorHandler.getConfig();
      
      expect(config).toHaveProperty('formatting');
      expect(config).toHaveProperty('logging');
      expect(config.formatting).toHaveProperty('useEmojis');
      expect(config.formatting).toHaveProperty('includeContext');
    });
  });

  describe('performance', () => {
    test('should handle error logging within performance budget', () => {
      const startTime = process.hrtime.bigint();
      
      // Log multiple errors to test performance
      for (let i = 0; i < 100; i++) {
        ErrorHandler.logError({
          message: `Performance test error ${i}`,
          context: { iteration: i },
          details: [`Detail ${i}`],
        });
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      // Should complete 100 error logs in under 50ms (0.5ms per error)
      expect(durationMs).toBeLessThan(50);
    });
  });
});
