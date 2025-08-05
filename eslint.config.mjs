/**
 * ESLint Flat Configuration for ESM Codebase with TypeScript Support
 * Modern configuration supporting ES modules, TypeScript, and Jest testing
 */

import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  // Global ignores (must be first)
  {
    ignores: [
      'node_modules/**',
      'coverage/**', 
      'dist/**',
      'venv/**',
      '**/*.min.js',
      '**/.git/**',
      'services/vale-linting/node_modules/**',
      'services/keyword-analysis/venv/**',
      '**/__pycache__/**',
      '**/*.pyc',
      '**/site-packages/**',
      'services/hiring-evaluation/comprehensive-optimization-results/**',
      'services/hiring-evaluation/ollama-optimization-experiment/**',
      'services/hiring-evaluation/model-test-results/**',
      'services/hiring-evaluation/test-archive/**'
    ]
  },
  
  // Base JavaScript recommended rules
  js.configs.recommended,
  
  // TypeScript plugin recommended rules
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      ...ts.configs.recommended.rules,
      ...ts.configs['recommended-requiring-type-checking'].rules,
      // Strategic TypeScript rules: Make rules smarter, not quieter
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // Temporarily relax unsafe rules during interface implementation phase
      // Will re-enable after proper TypeScript interfaces are implemented
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  
  // CommonJS files configuration
  {
    files: ['services/vale-linting/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        // CommonJS globals
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      }
    },
    rules: {
      'no-console': ['warn', { 
        allow: ['error', 'warn', 'info'] // Allow semantic console usage
      }],
    }
  },

  {
    // Global configuration for all other files
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
    files: ['**/*.js', '**/*.ts'],
    
    // Basic rules for code quality
    rules: {
      // Error prevention (relaxed for development)
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      'no-undef': 'error',
      'no-console': ['warn', { 
        allow: ['error', 'warn', 'info'] // Allow semantic console usage for CLI apps
      }],
      
      // Code style (relaxed for development)
      'indent': ['error', 2],
      'quotes': ['error', 'single', { 'avoidEscape': true }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'arrow-spacing': 'error',
      'brace-style': ['error', '1tbs'],
      'eol-last': ['error', 'always'],
      
      // Best practices
      'eqeqeq': 'error',
      'curly': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'no-duplicate-imports': 'error'
    }
  }
];
