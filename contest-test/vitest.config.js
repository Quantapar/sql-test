import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000, // 30 seconds per test
    hookTimeout: 60000, // 60 seconds for setup/teardown
    sequence: {
      shuffle: false, // Run tests in order (important for dependent tests)
    },
    reporter: ['verbose'],
    bail: 0, // Continue running all tests even if some fail
  },
});

