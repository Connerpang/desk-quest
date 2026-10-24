import { defineConfig } from 'vitest/config';

// Integration tests start real Postgres containers (packages/test-utils).
export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/db-integration',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'db-integration',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.int.spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    reporters: ['default'],
  },
});
