const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      // One-shot migration runner for the Compose `migrate` service.
      additionalEntryPoints: [
        {
          entryName: 'migrate',
          // Resolved from the workspace root, unlike assets.
          entryPath: 'packages/db/src/scripts/migrate.ts',
        },
      ],
      tsConfig: './tsconfig.app.json',
      assets: [
        './src/assets',
        {
          input: '../../packages/db/migrations',
          glob: '**/*',
          output: 'migrations',
        },
      ],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: true,
    }),
  ],
};
