import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { Client, PoolClient } from 'pg';
import { MIGRATOR_ROLE } from './roles';

export async function runMigrations(
  client: Client | PoolClient,
  migrationsFolder: string,
): Promise<void> {
  // Objects belong to whoever creates them, so migrations must run as the
  // migrator role or app_runtime's default grants won't apply.
  const { rows } = await client.query<{ current_user: string }>(
    'select current_user',
  );
  if (rows[0].current_user !== MIGRATOR_ROLE) {
    throw new Error(
      `Migrations must run as ${MIGRATOR_ROLE}, not ${rows[0].current_user}`,
    );
  }
  await migrate(drizzle({ client }), { migrationsFolder });
}
