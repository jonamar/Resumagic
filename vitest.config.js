import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      '**/__tests__/**/*.test.ts',
      '**/__tests__/**/*.test.js',
      '**/*.test.ts',
      '**/*.test.js',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'utils/**/*',
        'services/**/*',
        'core/**/*',
        'cli/**/*',
      ],
      exclude: [
        'node_modules/**',
        'coverage/**',
        'dist/**',
        '**/*.test.js',
        '**/*.test.ts',
        '**/*.spec.js',
        '**/*.spec.ts',
        '**/__tests__/**',
        'jest.config.cjs',
        'vitest.config.js',
        '.eslintrc*.js',
        'utils/eslint-rules/**',
      ],
    },
    // Setup files
    setupFiles: ['./vitest.setup.js'],
    // Test timeout
    testTimeout: 10000,
    // Make globals available like Jest
    globals: true,
  },
});
