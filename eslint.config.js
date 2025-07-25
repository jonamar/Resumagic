/**
 * ESLint Flat Configuration for ESM Codebase
 * Modern configuration supporting ES modules and Jest testing
 */

import js from '@eslint/js';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,
  
  {
    // Global configuration
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        // Jest globals (for test files)
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    },
    
    // Files to lint
    files: ['**/*.js'],
    
    // Basic rules for code quality
    rules: {
      // Error prevention (relaxed for development)
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      'no-undef': 'error',
      'no-console': 'off', // Allow console for CLI app
      
      // Code style (minimal for now)
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 2],
      
      // ES module specific
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      
      // Async/await best practices (relaxed for development)
      'require-await': 'warn',
      'no-return-await': 'warn'
    }
  },
  
  {
    // Test-specific configuration
    files: ['**/*.test.js', '**/__tests__/**/*.js'],
    rules: {
      // Relax some rules for tests
      'no-unused-expressions': 'off'
    }
  },
  
  {
    // Ignore patterns
    ignores: [
      'node_modules/',
      'coverage/',
      'dist/',
      '*.config.js',
      'jest.setup.js', // Setup file can have different patterns
      // Ignore legacy CommonJS files that need separate migration
      '.eslintrc.error-handling.js',
      'test-isolation.js', // Has require() calls
      'utils/eslint-rules/', // ESLint rule files use CommonJS
      // Ignore services that are primarily test/benchmark files
      'services/hiring-evaluation/*test*.js',
      'services/hiring-evaluation/run-benchmarks.js',
      'services/hiring-evaluation/ollama-optimization-experiment/',
      // Files with CommonJS that haven't been migrated yet
      'scripts/feature-flags.js',
      'services/hiring-evaluation/generate-prompt.js',
      'services/hiring-evaluation/quick-benchmark.js',
      'services/hiring-evaluation/evaluation-test.js',
      // Vale linting has its own node_modules
      'services/vale-linting/',
      // Python virtual environment
      'venv/'
    ]
  }
];