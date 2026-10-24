import { join } from 'node:path';
import { workspaceRoot } from '@nx/devkit';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import { useDockerContextHost } from './docker-host';

const ROLES_SCRIPT = join(
  workspaceRoot,
  'deployment/compose/postgres/initdb/01-roles.sh',
);
const MIGRATIONS_FOLDER = join(workspaceRoot, 'packages/db/migrations');
const DATABASE = 'deskquest';

export interface TestDatabase {
  /** Bootstrap superuser: only for tests that tamper with the setup. */
  superuserUrl: string;
  migratorUrl: string;
  runtimeUrl: string;
  stop(): Promise<void>;
}

export interface TestDatabaseOptions {
  /** Apply packages/db/migrations as app_migrator. Defaults to true. */
  migrate?: boolean;
}

/**
 * Starts a throwaway Postgres 17 with the same roles as Docker Compose
 * (deployment/compose/postgres/initdb/01-roles.sh) and, by default, the
 * real migrations applied.
 */
export async function startTestDatabase(
  options: TestDatabaseOptions = {},
): Promise<TestDatabase> {
  useDockerContextHost();
  const container = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase(DATABASE)
    .withUsername('postgres')
    .withPassword('postgres')
    .withEnvironment({
      APP_MIGRATOR_PASSWORD: 'migrator',
      APP_RUNTIME_PASSWORD: 'runtime',
    })
    .withCopyFilesToContainer([
      {
        source: ROLES_SCRIPT,
        target: '/docker-entrypoint-initdb.d/01-roles.sh',
        mode: 0o755,
      },
    ])
    .start();

  const url = (user: string, password: string) =>
    `postgres://${user}:${password}@${container.getHost()}:${container.getPort()}/${DATABASE}`;
  const database: TestDatabase = {
    superuserUrl: url('postgres', 'postgres'),
    migratorUrl: url('app_migrator', 'migrator'),
    runtimeUrl: url('app_runtime', 'runtime'),
    stop: async () => {
      await container.stop();
    },
  };

  if (options.migrate ?? true) {
    await withClient(database.migratorUrl, (client) =>
      migrate(drizzle({ client }), { migrationsFolder: MIGRATIONS_FOLDER }),
    );
  }
  return database;
}

/** Runs `fn` with a connected client, always closing it afterwards. */
export async function withClient<T>(
  connectionString: string,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}
