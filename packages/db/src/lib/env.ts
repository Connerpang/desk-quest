import { z } from 'zod';

const postgresUrl = z.url({
  protocol: /^postgres(ql)?$/,
  error: (issue) =>
    issue.input === undefined
      ? 'is required'
      : 'must be a postgres:// or postgresql:// URL',
});

/** Reads MIGRATOR_DATABASE_URL, exiting with a clear message when invalid. */
export function migratorUrlOrExit(
  env: Record<string, string | undefined> = process.env,
): string {
  const result = postgresUrl.safeParse(env['MIGRATOR_DATABASE_URL']);
  if (!result.success) {
    process.stderr.write(
      `Invalid environment configuration:\n  - MIGRATOR_DATABASE_URL: ${result.error.issues[0].message}\n`,
    );
    process.exit(1);
  }
  return result.data;
}
