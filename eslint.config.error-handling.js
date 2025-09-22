/**
 * ESLint Configuration for Error Handling Standards
 * Uses flat config format for ESLint 9.x compatibility
 */

export default [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'coverage/**', 'venv/**', '**/*.test.js', '**/*.spec.js', '**/__tests__/**/*.js'],
    rules: {
      // Standard ESLint rules that support error handling
      'no-console': ['error', { allow: ['warn'] }], // Disallow console.log/error, allow console.warn
      'prefer-promise-reject-errors': 'error', // Ensure promises are rejected with Error objects
      'no-throw-literal': 'error', // Require throwing Error objects
      
      // Encourage proper error handling patterns
      'consistent-return': 'error', // Require consistent return statements
      'no-implicit-coercion': 'error', // Disallow implicit type conversions
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
    },
  },
  {
    // Test files - allow console usage
    files: ['**/*.test.js', '**/*.spec.js', '**/__tests__/**/*.js'],
    rules: {
      'no-console': 'off', // Allow console usage in tests
    },
  },
];
