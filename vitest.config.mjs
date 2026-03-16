import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        statements: 63,
        branches: 38,
        functions: 50,
        lines: 70,
      },
    },
    include: ['tests/**/*.test.ts'],
  },
});
