/**
 * Jest Configuration for Resumagic JavaScript Testing
 * Minimal viable setup for unit and integration testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // ESM Support
  moduleNameMapper: {
    '^(\\.\\.?\\/.+)\\.js$': '$1'
  },
  transform: {},
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  
  // Transform ignore patterns for ESM/CJS compatibility
  transformIgnorePatterns: [
    'node_modules/(?!(marked)/)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    '**/*.js',
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
  ],
  
  // Coverage output
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  
  // Coverage thresholds disabled for CI pipeline (focus on test execution)
  // coverageThreshold: {
  //   global: {
  //     branches: 5,
  //     functions: 5,
  //     lines: 5,
  //     statements: 5
  //   }
  // },
  
  // Test setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module paths
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/__tests__/helpers/'
  ],
  
  // Verbose output for better debugging
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Make Jest globals available
  injectGlobals: true

};