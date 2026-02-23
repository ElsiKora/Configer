import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@application': path.resolve(PROJECT_ROOT, 'src/application'),
      '@domain': path.resolve(PROJECT_ROOT, 'src/domain'),
      '@infrastructure': path.resolve(PROJECT_ROOT, 'src/infrastructure'),
      '@presentation': path.resolve(PROJECT_ROOT, 'src/presentation'),
      '@src': path.resolve(PROJECT_ROOT, 'src'),
    },
  },
  test: {
    coverage: {
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    include: ['test/**/*.test.ts'],
  },
});
