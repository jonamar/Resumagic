/**
 * Test Utilities and Helpers
 * Shared utilities for testing across the application
 */

const fs = require('fs');
const path = require('path');

/**
 * Test file utilities
 */
const TestFileUtils = {
  /**
   * Create a temporary test file with content
   * @param {string} filename - Name of the test file
   * @param {string} content - Content to write
   * @returns {string} Full path to created file
   */
  createTempFile(filename, content) {
    const tempDir = path.join(__dirname, '../fixtures/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  },

  /**
   * Clean up temporary test files
   */
  cleanupTempFiles() {
    const tempDir = path.join(__dirname, '../fixtures/temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  },

  /**
   * Read fixture file content
   * @param {string} fixtureName - Name of fixture file
   * @returns {string} File content
   */
  readFixture(fixtureName) {
    const fixturePath = path.join(__dirname, '../fixtures', fixtureName);
    return fs.readFileSync(fixturePath, 'utf8');
  }
};

/**
 * Console output capture utilities
 */
const ConsoleUtils = {
  /**
   * Capture console output during test execution
   * @param {Function} testFunction - Function to execute while capturing output
   * @returns {Object} Object with captured stdout and stderr
   */
  captureConsoleOutput(testFunction) {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const stdout = [];
    const stderr = [];
    const warnings = [];
    
    console.log = (...args) => stdout.push(args.join(' '));
    console.error = (...args) => stderr.push(args.join(' '));
    console.warn = (...args) => warnings.push(args.join(' '));
    
    try {
      const result = testFunction();
      return {
        result,
        stdout,
        stderr,
        warnings
      };
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  }
};

/**
 * Mock data generators
 */
const MockDataUtils = {
  /**
   * Generate mock resume data
   * @param {Object} overrides - Properties to override in mock data
   * @returns {Object} Mock resume data
   */
  createMockResumeData(overrides = {}) {
    return {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      experience: [
        {
          title: 'Software Engineer',
          company: 'Tech Corp',
          duration: '2020-2023',
          bullets: ['Developed applications', 'Led team of 3 developers']
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science in Computer Science',
          school: 'University of Technology',
          year: '2020'
        }
      ],
      skills: ['JavaScript', 'Python', 'React', 'Node.js'],
      ...overrides
    };
  },

  /**
   * Generate mock CLI arguments
   * @param {Object} options - CLI options to include
   * @returns {Array} Mock CLI arguments array
   */
  createMockCliArgs(options = {}) {
    const args = [];
    
    if (options.applicationName) {
      args.push(options.applicationName);
    }
    
    if (options.preview) args.push('--preview');
    if (options.coverLetter) args.push('--cover-letter');
    if (options.both) args.push('--both');
    if (options.auto) args.push('--auto');
    
    return args;
  }
};

/**
 * Assertion helpers
 */
const AssertionUtils = {
  /**
   * Assert that an object has expected structure
   * @param {Object} obj - Object to validate
   * @param {Object} expectedStructure - Expected structure definition
   */
  assertObjectStructure(obj, expectedStructure) {
    for (const [key, expectedType] of Object.entries(expectedStructure)) {
      expect(obj).toHaveProperty(key);
      
      if (expectedType === 'array') {
        expect(Array.isArray(obj[key])).toBe(true);
      } else if (expectedType === 'object') {
        expect(typeof obj[key]).toBe('object');
        expect(obj[key]).not.toBeNull();
      } else {
        expect(typeof obj[key]).toBe(expectedType);
      }
    }
  },

  /**
   * Assert that error result has expected structure
   * @param {Object} result - Error result object
   * @param {string} expectedErrorType - Expected error type
   */
  assertErrorResult(result, expectedErrorType = null) {
    expect(result).toHaveProperty('isValid', false);
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error');
    expect(typeof result.error).toBe('string');
    
    if (expectedErrorType) {
      expect(result).toHaveProperty('errorType', expectedErrorType);
    }
  },

  /**
   * Assert that success result has expected structure
   * @param {Object} result - Success result object
   * @param {*} expectedData - Expected data value
   */
  assertSuccessResult(result, expectedData = null) {
    expect(result).toHaveProperty('isValid', true);
    expect(result).toHaveProperty('success', true);
    
    if (expectedData !== null) {
      expect(result).toHaveProperty('data', expectedData);
    }
  }
};

module.exports = {
  TestFileUtils,
  ConsoleUtils,
  MockDataUtils,
  AssertionUtils
};
