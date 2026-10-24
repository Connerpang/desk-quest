import { defineConfig } from 'vitest/config';

// Integration tests start real Postgres containers (packages/test-utils).
export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/api-integration',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'api-integration',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.int.spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    reporters: ['default'],
  },
});
