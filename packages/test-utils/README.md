# @deskquest/test-utils

Test helpers. Import only from test files.

## `startTestDatabase()`

Starts a throwaway Postgres 17 container with the same roles as Docker
Compose (`deployment/compose/postgres/initdb/01-roles.sh`) and the real
migrations applied. Returns `superuserUrl`, `migratorUrl`, `runtimeUrl` and
`stop()`.

```ts
let db: TestDatabase;
beforeAll(async () => (db = await startTestDatabase()));
afterAll(() => db?.stop());
```

Put Docker-backed tests in `*.int.spec.ts` files. They run with
`pnpm test:integration`, not with the `test` target.

The Docker endpoint is read from the active `docker context`, so Rancher
Desktop and Colima work without setting `DOCKER_HOST`.
