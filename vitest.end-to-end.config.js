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
    exclude: ['test/unit/**'],
    include: ['test/e2e/**/*.test.ts'],
  },
});
