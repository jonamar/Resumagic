module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Error handling rules
    'no-console': 'off', // Allow console for error logging
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    
    // Code quality - relaxed for existing codebase
    'indent': 'off', // Too many existing violations
    'linebreak-style': 'off',
    'quotes': 'off', // Mixed quote styles in existing code
    'semi': 'off',
    
    // Best practices
    'eqeqeq': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-var': 'warn',
    'prefer-const': 'warn',
    'no-dupe-keys': 'error'
  },
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    '*.min.js',
    '__tests__/fixtures/',
    'venv/',
    'services/',
    '**/python*/**',
    '**/site-packages/**',
    '**/*.py'
  ]
};
