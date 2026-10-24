import { Client } from 'pg';
import { describeError } from '../lib/errors';
import { migratorUrlOrExit } from '../lib/env';
import { runMigrations } from '../lib/migrate';

async function main() {
  const client = new Client({ connectionString: migratorUrlOrExit() });
  await client.connect();
  try {
    await runMigrations(client, 'migrations');
    process.stdout.write('Migrations applied.\n');
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`Migration failed: ${describeError(err)}\n`);
  process.exit(1);
});
