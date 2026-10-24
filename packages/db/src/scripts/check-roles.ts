import { Client } from 'pg';
import { describeError } from '../lib/errors';
import { migratorUrlOrExit } from '../lib/env';
import { findRoleProblems } from '../lib/roles';

async function main() {
  const client = new Client({ connectionString: migratorUrlOrExit() });
  await client.connect();
  try {
    const problems = await findRoleProblems(client);
    if (problems.length > 0) {
      process.stderr.write(
        `Database role check failed:\n${problems.map((p) => `  - ${p}`).join('\n')}\n`,
      );
      process.exit(1);
    }
    process.stdout.write('Database role check passed.\n');
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`Role check failed: ${describeError(err)}\n`);
  process.exit(1);
});
