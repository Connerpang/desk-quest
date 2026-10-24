import {
  startTestDatabase,
  TestDatabase,
  withClient,
} from '@deskquest/test-utils';
import { runMigrations } from './migrate';
import { findRoleProblems } from './roles';

// Plan §5: "Runtime role accidentally owns tables, which bypasses RLS".
describe('database role separation', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
  });

  afterAll(async () => {
    await db?.stop();
  });

  it('passes the role check after migrations', async () => {
    await expect(withClient(db.migratorUrl, findRoleProblems)).resolves.toEqual(
      [],
    );
  });

  it('lets app_runtime read and write rows', async () => {
    const count = await withClient(db.runtimeUrl, async (client) => {
      await client.query(
        `insert into tenants (name, slug) values ('Runtime Co', 'runtime-co')`,
      );
      const { rows } = await client.query<{ count: string }>(
        'select count(*) from tenants',
      );
      return Number(rows[0].count);
    });
    expect(count).toBe(1);
  });

  it.each([
    ['create a table', 'create table evil (x int)'],
    ['alter a table', 'alter table users add column phone text'],
    ['read migration history', 'select * from drizzle.__drizzle_migrations'],
  ])('stops app_runtime from trying to %s', async (_, statement) => {
    await expect(
      withClient(db.runtimeUrl, (client) => client.query(statement)),
    ).rejects.toMatchObject({ code: expect.stringMatching(/^42501$/) });
  });

  it('refuses to migrate as app_runtime', async () => {
    await expect(
      withClient(db.runtimeUrl, (client) =>
        runMigrations(client, 'packages/db/migrations'),
      ),
    ).rejects.toThrow('Migrations must run as app_migrator, not app_runtime');
  });

  it('reports a runtime role that owns a table or bypasses RLS', async () => {
    await withClient(db.superuserUrl, (client) =>
      client.query(
        'alter table users owner to app_runtime; alter role app_runtime bypassrls',
      ),
    );
    try {
      const problems = await withClient(db.migratorUrl, findRoleProblems);
      expect(problems).toEqual(
        expect.arrayContaining([
          'app_runtime has BYPASSRLS',
          'app_runtime owns public.users',
        ]),
      );
    } finally {
      await withClient(db.superuserUrl, (client) =>
        client.query(
          'alter table users owner to app_migrator; alter role app_runtime nobypassrls',
        ),
      );
    }
  });
});
