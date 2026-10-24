import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/db',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'db',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Docker-backed tests run via the `integration` target instead.
    exclude: ['**/node_modules/**', '**/*.int.spec.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/db',
      provider: 'v8' as const,
    },
  },
}));
