# DeskQuest

An open-source, self-hostable desk check-in app for small and medium-sized
offices, with an isometric office map and optional, privacy-friendly game
elements. Employees tap an NFC tag or scan a QR code on a desk to check in;
everyone sees which desks are free.

> **Status: early development.** The foundation (Phase 0) is in place:
> API, web shell, database, Docker Compose, tests and CI. Check-in, the map
> and gamification come next. See the
> [implementation plan](docs/planning/implementation-plan.md).

**Privacy first.** DeskQuest stores an email address and a self-chosen alias,
and nothing else about people. Coworkers see "occupied", not who. History is
anonymised after 30 days, and nothing is sent to third parties: no analytics,
no external fonts or CDNs, no telemetry. The binding rules are in
[docs/privacy/data-inventory.md](docs/privacy/data-inventory.md).

## Contents

- [Requirements](#requirements)
- [Run the whole stack with Docker](#run-the-whole-stack-with-docker)
- [Set up for development](#set-up-for-development)
- [Run the tests](#run-the-tests)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Project layout](#project-layout)
- [Contributing, security and licence](#contributing-security-and-licence)

## Requirements

| Tool                   | Version           | Notes                                                                     |
| ---------------------- | ----------------- | ------------------------------------------------------------------------- |
| Git                    | any recent        |                                                                           |
| Docker with Compose v2 | Docker Engine 24+ | Docker Desktop, Rancher Desktop (dockerd/moby engine) or Colima           |
| Node.js                | 24                | Only for development. [nvm](https://github.com/nvm-sh/nvm) reads `.nvmrc` |
| pnpm                   | 12.15.0           | Only for development. Provided by corepack, which ships with Node 24      |

## Run the whole stack with Docker

This runs PostgreSQL, the API, the web app and (for development) Mailpit.
You don't need Node.js for this.

1. Clone the repository:

   ```sh
   git clone https://github.com/Connerpang/desk-quest.git
   cd desk-quest
   ```

2. Create your `.env` file:

   ```sh
   cp .env.example .env
   ```

   Open `.env` and change the three passwords
   (`POSTGRES_SUPERUSER_PASSWORD`, `APP_MIGRATOR_PASSWORD`,
   `APP_RUNTIME_PASSWORD`). Use letters, digits, `-` and `_` only, because
   they go into connection URLs. `openssl rand -hex 24` makes a good one.
   If you'll also develop locally, put the same migrator and runtime
   passwords into `MIGRATOR_DATABASE_URL` and `DATABASE_URL`.

3. Build and start everything:

   ```sh
   docker compose up -d --build --wait
   ```

   The first build takes a few minutes. Compose starts Postgres, runs the
   database migrations once, then starts the API and the web server.
   `--wait` returns when every service is healthy.

4. Open <http://localhost:8080>. You should see the DeskQuest header and
   **API: online**.

Development extras are also running: Mailpit catches all outgoing email at
<http://localhost:8025>, and Postgres listens on `localhost:5432`.

To stop: `docker compose down`. Your data stays in the `postgres-data`
volume. `docker compose down -v` deletes it.

**Running on a server:** use only the base file, which leaves out Mailpit
and the published database port:

```sh
docker compose -f docker-compose.yml up -d --build --wait
```

The web server listens on `127.0.0.1:8080`. Put a reverse proxy with HTTPS
in front of it, and set the `SMTP_*` settings to a real mail relay. A full
deployment guide (TLS, backups, upgrades) comes in Phase 4.

## Set up for development

1. Clone the repository and create `.env` as in steps 1 and 2 above.

2. Select Node 24 and install dependencies:

   ```sh
   nvm use
   corepack enable
   pnpm install
   ```

   If `nvm use` reports that Node 24 isn't installed, run `nvm install`
   first. Run `nvm use` in every new terminal.

3. Start Postgres and Mailpit in Docker, then create the schema and load the
   demo data:

   ```sh
   docker compose up -d --wait postgres mailpit
   pnpm db:migrate
   pnpm db:seed
   ```

   You should see `Migrations applied.` and
   `Seed complete: 1 tenant(s), 2 user(s) inserted.` The seed only adds
   demo data (users at `example.com`) and refuses to run when
   `NODE_ENV=production`.

4. Start the API and the web app with live reload:

   ```sh
   pnpm nx serve web
   ```

   This also starts the API on <http://localhost:3000>. Open
   <http://localhost:4200>; requests to `/api` are proxied to the API.

### Everyday commands

| Command                                         | What it does                                                |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `pnpm nx serve web`                             | API + web app with live reload                              |
| `pnpm nx serve api`                             | API only                                                    |
| `pnpm nx run-many -t lint test typecheck build` | The checks every change must pass                           |
| `pnpm test:integration`                         | Tests against real Postgres containers (needs Docker)       |
| `pnpm nx e2e web-e2e`                           | Browser smoke test (starts the dev servers)                 |
| `pnpm db:generate`                              | Create a migration from changes to `packages/db/src/schema` |
| `pnpm db:migrate`                               | Apply migrations (as `app_migrator`)                        |
| `pnpm db:seed`                                  | Load demo data                                              |
| `pnpm db:check-roles`                           | Check database role separation                              |
| `pnpm db:check-personal-data`                   | Check migrations against the data inventory                 |

## Run the tests

```sh
# Unit tests, lint, type checks and builds
pnpm nx run-many -t lint test typecheck build

# Integration tests: start throwaway Postgres 17 containers
pnpm test:integration

# End-to-end smoke test. Install the browsers once, then run it.
# Needs the development database from step 3 above.
pnpm exec playwright install chromium webkit
pnpm nx e2e web-e2e
```

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs all of
these, plus a secrets scan (gitleaks), a dependency audit and the
end-to-end test against the full Docker Compose stack.

## Configuration

All settings come from environment variables, read from `.env` by both
Docker Compose and Nx. [.env.example](.env.example) lists them with
comments. The API checks its settings at startup and exits with a clear
message if one is missing or invalid.

| Variable                                                                           | Used by                                | Default                |
| ---------------------------------------------------------------------------------- | -------------------------------------- | ---------------------- |
| `POSTGRES_SUPERUSER_PASSWORD`, `APP_MIGRATOR_PASSWORD`, `APP_RUNTIME_PASSWORD`     | Compose (required)                     | —                      |
| `DATABASE_URL`                                                                     | API (required). Must use `app_runtime` | —                      |
| `MIGRATOR_DATABASE_URL`                                                            | `pnpm db:*` commands                   | —                      |
| `PORT`, `HOST`                                                                     | API                                    | `3000`, `localhost`    |
| `LOG_LEVEL`                                                                        | API                                    | `info`                 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | API (email)                            | port `587`             |
| `WEB_PORT`, `WEB_BIND`                                                             | Compose                                | `8080`, `127.0.0.1`    |
| `POSTGRES_PORT`, `MAILPIT_UI_PORT`, `MAILPIT_SMTP_PORT`                            | Compose (development)                  | `5432`, `8025`, `1025` |

The database uses two roles: `app_migrator` owns the schema and runs
migrations; `app_runtime` is what the API uses and can only read and write
rows. See [ADR 0002](docs/architecture/adr/0002-drizzle-orm-and-migrations.md).

## Troubleshooting

**`Cannot connect to the Docker daemon`** — start Docker Desktop, Rancher
Desktop or Colima. On Rancher Desktop, if the VM shows as running but
Docker still doesn't answer, restart Rancher Desktop.

**A port is already in use** — set `WEB_PORT`, `POSTGRES_PORT`,
`MAILPIT_UI_PORT` or `MAILPIT_SMTP_PORT` in `.env`. If you change
`POSTGRES_PORT`, change the port in `DATABASE_URL` and
`MIGRATOR_DATABASE_URL` too.

**`pnpm db:migrate` fails right after starting Postgres** — on a brand-new
volume Postgres takes a few seconds to create the roles. Start it with
`--wait` as shown above, or rerun the command.

**`connect ECONNREFUSED … 5432`** — Postgres isn't running:
`docker compose up -d --wait postgres`.

**The API exits with `Invalid environment configuration`** — the message
names the variable to fix in `.env`.

**Wrong Node version or `pnpm: command not found`** — run `nvm use` and
`corepack enable`.

**Integration tests can't find Docker** — the tests read the endpoint from
your active `docker context`. Check that `docker context ls` marks the
right one, or set `DOCKER_HOST`.

## Project layout

```text
apps/
  api/          NestJS API (Fastify)
  web/          Angular web app
  web-e2e/      Playwright end-to-end tests
packages/
  contracts/    Zod schemas shared by API and web
  db/           Drizzle schema, migrations, seed and database scripts
  test-utils/   Test helpers (Testcontainers Postgres)
deployment/     Dockerfile, nginx config, Postgres role bootstrap
docs/           Specification, plan, privacy rules, ADRs
```

## Contributing, security and licence

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
- Report security issues privately as described in
  [SECURITY.md](SECURITY.md), never in a public issue.
- Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
- Architecture decisions are recorded in
  [docs/architecture/adr](docs/architecture/adr/README.md).

DeskQuest is licensed under the [Apache License 2.0](LICENSE).
