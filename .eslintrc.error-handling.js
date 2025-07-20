/**
 * ESLint Configuration for Error Handling Standards
 * Extends the main ESLint config with error handling rules
 */

module.exports = {
  plugins: ['./utils/eslint-rules/error-handling'],
  rules: {
    // Custom error handling rules
    'error-handling/consistent-error-logging': 'error',
    'error-handling/require-error-context': 'warn',
    'error-handling/standardized-error-results': 'warn',
    'error-handling/no-hardcoded-error-messages': 'warn',
    
    // Standard ESLint rules that support error handling
    'no-console': ['error', { allow: ['warn'] }], // Disallow console.log/error, allow console.warn
    'prefer-promise-reject-errors': 'error', // Ensure promises are rejected with Error objects
    'no-throw-literal': 'error', // Require throwing Error objects
    'handle-callback-err': 'error', // Require error handling in callbacks
    
    // Encourage proper error handling patterns
    'consistent-return': 'error', // Require consistent return statements
    'no-implicit-coercion': 'error', // Disallow implicit type conversions
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }]
  },
  
  // Override rules for test files
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js', '**/__tests__/**/*.js'],
      rules: {
        'no-console': 'off', // Allow console usage in tests
        'error-handling/consistent-error-logging': 'off' // Allow console.error in tests
      }
    }
  ]
};
