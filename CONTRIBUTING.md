# Contributing to DeskQuest

Thanks for helping. DeskQuest is a small project with a part-time
maintainer, so a little care up front gets your change merged faster.

## Before you start

- For anything bigger than a small fix, open an issue first so we can agree
  on the approach.
- Work is planned in small slices in
  [docs/planning/implementation-plan.md](docs/planning/implementation-plan.md).
  Pick one slice (or part of one) per pull request.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- Found a security problem? Don't open an issue; see
  [SECURITY.md](SECURITY.md).

## Set up

Follow [Set up for development](README.md#set-up-for-development) in the
README. You need Node 24, pnpm (via corepack) and Docker.

## Rules every change must follow

These come from the specification and the data inventory, and reviews
check them.

1. **Privacy.** Store no personal data beyond
   [docs/privacy/data-inventory.md](docs/privacy/data-inventory.md). Never
   log emails, tokens, cookies or IP addresses. Never put names or emails in
   server-sent events, outbox payloads or audit metadata; use IDs.
   CI rejects migrations that add columns such as `phone`, `address` or
   `ip` unless the inventory lists them (`pnpm db:check-personal-data`).
2. **Tenant isolation.** Never trust a user or tenant ID sent by the
   client. Every tenant-owned table gets `tenant_id`, Row-Level Security
   policies and a test proving another tenant can't read or change it.
3. **No third-party runtime calls.** No analytics, CDNs, external fonts or
   telemetry. Everything the app loads is served by DeskQuest itself.
4. **Validate on the server.** All external input goes through Zod schemas
   (`packages/contracts`).
5. **Configure, don't hardcode.** No company, office, desk, mascot or XP
   rule may be hardcoded.
6. **Gamification stays optional.** Check-in must work, and stay correct,
   with the game switched off.

## Making changes

- **Database:** edit the schema in `packages/db/src/schema`, then run
  `pnpm db:generate` and commit the generated SQL in
  `packages/db/migrations`. Never edit a migration that has been merged; add
  a new one. Grants, policies and other SQL the schema can't express go in
  a custom migration (`pnpm exec drizzle-kit generate --custom` in
  `packages/db`).
- **Tests:** add tests with every change. Unit tests go in `*.spec.ts`
  next to the code. Tests that need a real database go in `*.int.spec.ts`
  and use `startTestDatabase()` from `@deskquest/test-utils`.
- **Significant decisions** (a new dependency with wide impact, a change of
  approach, a deviation from the spec) need an ADR in
  [docs/architecture/adr](docs/architecture/adr/README.md).
- **Run tasks through Nx** (`pnpm nx …`), not the underlying tools.

## Before you open a pull request

Run these and make sure they pass:

```sh
pnpm nx run-many -t lint test typecheck build
pnpm test:integration
pnpm db:check-personal-data
pnpm nx e2e web-e2e
```

Format with Prettier (`pnpm prettier --write <files>`; the editor
integration works too).

In the pull request, describe what changed and why, name the plan slice,
and say how you tested it. Keep pull requests focused: one concern each.

## Secrets

This repository is public. Never commit secrets, real `.env` files or
personal data, including in test fixtures (use `example.com` addresses).

`pnpm install` installs a gitleaks pre-commit hook from `.githooks/` if
your git setup has no other hooks path. It needs
[gitleaks](https://github.com/gitleaks/gitleaks#installing) installed
(`brew install gitleaks` on macOS). If you already use a company or global
hooks path, the installer leaves it alone; you can scan staged changes
yourself with `gitleaks git --pre-commit --staged`. CI scans the full
history either way.

A deliberately fake secret in a test fixture can be marked with a
`gitleaks:allow` comment on the same line.

## Licence of contributions

DeskQuest is licensed under the [Apache License 2.0](LICENSE). Unless you
say otherwise, anything you submit is contributed under the same licence
(Apache-2.0, section 5). Only submit work you have the right to
contribute, and don't include artwork, fonts or other assets without a
licence that allows redistribution.
