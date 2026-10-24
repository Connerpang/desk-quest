import type { ClientBase } from 'pg';

export const MIGRATOR_ROLE = 'app_migrator';
export const RUNTIME_ROLE = 'app_runtime';

/**
 * Checks the role separation from spec §12.1 and plan §5: the runtime role
 * must not own objects, create objects or bypass RLS. Returns the problems
 * found; an empty list means the setup is safe.
 */
export async function findRoleProblems(client: ClientBase): Promise<string[]> {
  const problems: string[] = [];

  const { rows: roles } = await client.query<{
    rolname: string;
    rolsuper: boolean;
    rolbypassrls: boolean;
    rolcreaterole: boolean;
    rolcreatedb: boolean;
  }>(
    `select rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb
       from pg_roles where rolname = any($1)`,
    [[MIGRATOR_ROLE, RUNTIME_ROLE]],
  );
  for (const name of [MIGRATOR_ROLE, RUNTIME_ROLE]) {
    const role = roles.find((r) => r.rolname === name);
    if (!role) {
      problems.push(`role ${name} does not exist`);
      continue;
    }
    if (role.rolsuper) problems.push(`${name} is a superuser`);
    if (role.rolbypassrls) problems.push(`${name} has BYPASSRLS`);
    if (role.rolcreaterole) problems.push(`${name} has CREATEROLE`);
    if (name === RUNTIME_ROLE && role.rolcreatedb) {
      problems.push(`${name} has CREATEDB`);
    }
  }
  if (problems.some((p) => p.endsWith('does not exist'))) return problems;

  const { rows: owned } = await client.query<{ name: string }>(
    `select n.nspname || '.' || c.relname as name
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relowner = (select oid from pg_roles where rolname = $1)
     union all
     select nspname from pg_namespace
      where nspowner = (select oid from pg_roles where rolname = $1)`,
    [RUNTIME_ROLE],
  );
  for (const { name } of owned) {
    problems.push(`${RUNTIME_ROLE} owns ${name}`);
  }

  const { rows: privileges } = await client.query<{
    schema_create: boolean;
    database_create: boolean;
  }>(
    `select has_schema_privilege($1, 'public', 'CREATE') as schema_create,
            has_database_privilege($1, current_database(), 'CREATE')
              as database_create`,
    [RUNTIME_ROLE],
  );
  if (privileges[0].schema_create) {
    problems.push(`${RUNTIME_ROLE} can CREATE in schema public`);
  }
  if (privileges[0].database_create) {
    problems.push(`${RUNTIME_ROLE} can CREATE schemas in the database`);
  }

  return problems;
}
