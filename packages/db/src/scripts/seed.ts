import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '../schema';
import { describeError } from '../lib/errors';
import { migratorUrlOrExit } from '../lib/env';
import { seedTenants, seedUsers } from '../lib/seed-data';

async function main() {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Refusing to load demo seed data with NODE_ENV=production');
  }
  const client = new Client({ connectionString: migratorUrlOrExit() });
  await client.connect();
  try {
    const db = drizzle({ client, schema });
    // Idempotent: re-running leaves existing rows untouched.
    const counts = await db.transaction(async (tx) => {
      const tenants = await tx
        .insert(schema.tenants)
        .values(seedTenants)
        .onConflictDoNothing()
        .returning({ id: schema.tenants.id });
      const users = await tx
        .insert(schema.users)
        .values(seedUsers)
        .onConflictDoNothing()
        .returning({ id: schema.users.id });
      return { tenants: tenants.length, users: users.length };
    });
    process.stdout.write(
      `Seed complete: ${counts.tenants} tenant(s), ${counts.users} user(s) inserted.\n`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`Seed failed: ${describeError(err)}\n`);
  process.exit(1);
});
