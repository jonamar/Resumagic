/**
 * Jest Configuration for Resumagic JavaScript Testing
 * Minimal viable setup for unit and integration testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!**/*.test.js',
    '!**/*.spec.js',
    '!**/__tests__/**',
    '!jest.config.js',
    '!.eslintrc*.js',
    '*.js',
    'utils/**/*.js',
    'services/**/*.js',
    '!utils/eslint-rules/**' // Exclude ESLint rules from coverage
  ],
  
  // Coverage output
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  
  // Coverage thresholds (starting conservative, will increase over time)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Test setup
  setupFilesAfterEnv: [],
  
  // Module paths
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],
  
  // Verbose output for better debugging
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Collect coverage from untested files
  collectCoverageFrom: [
    '*.js',
    'utils/**/*.js',
    'services/**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!**/*.test.js',
    '!**/*.spec.js',
    '!**/__tests__/**',
    '!jest.config.js',
    '!.eslintrc*.js',
    '!utils/eslint-rules/**' // Exclude ESLint rules from coverage
  ]
};
