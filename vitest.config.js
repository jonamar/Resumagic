import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // CRITICAL: Prevent memory issues with single worker
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,        // Force single process
        minWorkers: 1,
        maxWorkers: 1,
      },
    },
    
    // Only run smoke tests once created
    include: ['__tests__/smoke.test.js'],
    
    // Fast timeouts so processes die quickly
    testTimeout: 5000,
    
    // Disable memory-heavy features
    coverage: {
      enabled: false,
    },
    
    // Minimal environment
    environment: 'node',
    globals: true,
  },
});
