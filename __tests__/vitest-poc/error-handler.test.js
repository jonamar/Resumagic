/**  
 * Unit Tests for Error Handler - Vitest Version (Proof of Concept)
 * Comprehensive test suite for error handling utilities
 */

import { vi } from 'vitest';
import ErrorHandler from '../../utils/error-handler.js';
import { ERROR_TYPES, ERROR_SEVERITY, CONTEXT_TYPES } from '../../utils/error-types.js';

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

describe('ErrorHandler (Vitest POC)', () => {
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
  });
});