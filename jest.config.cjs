/**
 * Jest Configuration for Resumagic JavaScript Testing
 * Minimal viable setup for unit and integration testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // ESM Support with TypeScript
  moduleNameMapper: {
    '^(\\.\\.?\\/.+)\\.js$': '$1'
  },
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }]
  },
  
  // Test file patterns - include both JS and TS files
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/*.test.js',
    '**/*.spec.js',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],
  
  // Transform ignore patterns for ESM/CJS compatibility
  transformIgnorePatterns: [
    'node_modules/(?!(marked)/)'
  ],
  
  // Coverage configuration - include both JS and TS files
  collectCoverageFrom: [
    '**/*.js',
    '**/*.ts',
    '*.js',
    '*.ts',
    'utils/**/*.js',
    'utils/**/*.ts',
    'services/**/*.js',
    'services/**/*.ts',
    'core/**/*.js',
    'core/**/*.ts',
    '!node_modules/**',
    '!coverage/**',
    '!dist/**',
    '!**/*.test.js',
    '!**/*.test.ts',
    '!**/*.spec.js',
    '!**/*.spec.ts',
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