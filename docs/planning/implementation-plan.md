# DeskQuest — Implementation Plan

**Source spec:** [deskquest-specification.md](../deskquest-specification.md)
**Status:** Draft v1 — 2026-10-23
**Team model:** Solo developer + Claude Code, part-time (assume ~8–12 hours/week)

This plan turns the specification into an ordered sequence of small, shippable slices. Each slice should fit in one or two part-time weeks and end with green tests and something you can demo.

---

## 1. Decisions taken

| # | Decision | Choice | Why |
|---|---|---|---|
| D1 | Backend framework | **NestJS** (Fastify adapter) | Its modules and dependency injection map directly onto the spec's modular monolith. Patterns feel familiar coming from Angular. First-class OpenAPI support. |
| D2 | Database access | **Drizzle ORM** + drizzle-kit migrations | SQL-first and type-safe. Handles partial unique indexes, composite foreign keys, RLS policies and `SET LOCAL` tenant context without fighting the ORM. |
| D3 | Initial art | **Programmatic SVG** | Geometric isometric primitives generated in code, which unblocks the map work. A designer can replace them later through the asset manifest. |
| D4 | Monorepo tooling | **Nx + pnpm workspaces** | The spec's tree uses `project.json`, which is Nx. Gives one task graph for lint, test and build, and caches results in CI. |
| D5 | Runtime | **Node 24 LTS** | ⚠️ Your machine has Node 20.20, which reached end of life in April 2026. Upgrade before Phase 0 (`nvm install 24` or `fnm`). |
| D6 | Validation / contracts | **Zod** schemas in `packages/contracts`, shared by API and web | One source of truth for requests, responses, layout JSON and game-rule JSON. Wired into NestJS with `nestjs-zod` and turned into OpenAPI from there. |
| D7 | Authentication | **Better Auth** (Drizzle adapter) with DB-backed sessions and HttpOnly cookies | A mature library rather than hand-rolled auth (spec §11.1). Has an OIDC path for SaaS later. *Fallback:* `@fastify/session` + argon2 if Better Auth doesn't fit NestJS cleanly. |
| D8 | Background jobs | **pg-boss** (backed by PostgreSQL) | Handles occupancy expiry and outbox processing without needing Redis (spec §6.2). |
| D9 | Realtime | NestJS **SSE** + PostgreSQL `LISTEN/NOTIFY` | Lets updates fan out across multiple API instances later without adding Redis. |
| D10 | Testing | Vitest (unit), **Testcontainers** Postgres (integration), Supertest (API), **Playwright** (end-to-end) | Integration tests need a real Postgres for locks, RLS and partial indexes (spec §16.2). |
| D11 | Frontend | Angular (current stable) with standalone components, signals and Angular CDK (a11y, overlays) | The spec requires Angular. The CDK supplies keyboard and screen-reader support for the map and list views. |
| D12 | Licence | **Apache-2.0** (confirmed 2026-10-24) | Both MIT and Apache-2.0 are open source. Apache adds an explicit patent grant, which companies evaluating self-hosted software like to see. |
| D13 | Sign-in methods | **Email/password + magic link** | Magic links need SMTP. Use Mailpit in dev and any SMTP relay in production, configured via env. |
| D14 | Hosting & visibility | **Public GitHub repo** from day one | Never commit secrets. gitleaks runs in CI and pre-commit. |
| D15 | Deployment focus | **Self-hosted first.** The data model stays tenant-ready (`tenant_id` + RLS), but Phase 6 SaaS is deferred | Fastest path to a usable product. SaaS adds billing, operations, on-call and legal work that only pays off after the pilot proves value. |
| D16 | Default auto check-out | **19:00 local office time** daily, configurable per office | Covers people who work late without leaving desks "occupied" overnight. |
| D18 | Privacy | **Data minimisation is a hard requirement.** Follow [data-inventory.md](../privacy/data-inventory.md) exactly: email + alias only, no IPs at rest, employees see "occupied" not *who*, history anonymised after 30 days, no third-party calls | Personal data can't be zero for a system with logins, so it is kept to the minimum and enforced by CI checks. |
| D17 | NFC tags | **NTAG213 sticker tags** (NTAG215 is fine too). Use *anti-metal / on-metal* versions for metal desks | Cheap, widely supported, and hold a ~100-character URL. iPhone XS and later read URL tags in the background with no app needed. |

Each decision gets an ADR in `docs/architecture/adr/` during Phase 0.

---

## 2. Open questions for you

These don't block Phase 0. Each one is marked with the phase that needs an answer.

| # | Question | Needed by | Default if you don't decide |
|---|---|---|---|
| Q5 | Pilot office: probably 20–30 desks. Confirm which office and when | Phase 5 | Seed data models a 24-desk office |

Resolved: Q1 → **Apache-2.0** (confirmed 2026-10-24), Q2 → **DeskQuest** (confirmed 2026-10-23), Q3 → D13, Q4 → D14, Q6 → D17 (iOS first), Q7 → D16, Q8 → D15.

### 2.1 Name candidates

"OpenOffice Quest" collides with the **Apache OpenOffice** trademark, so it should be replaced before the public repo goes up.

| Name | Feel | npm | GitHub user/org |
|---|---|---|---|
| **DeskQuest** | Clear, playful, says what it does | free | taken (use `deskquest-app` or similar) |
| **QuestDesk** | Same idea, reversed | free | free |
| **Isodesk** | Nods to the isometric map, sounds more professional | free | taken |
| **Deskling** | Cute, works well with a mascot ("your deskling") | free | taken |
| **Hotdesk Heroes** | Most game-like, less enterprise-friendly | free | — |

Before committing to a name: search for trademarks (USPTO / WIPO Global Brand DB / your local registry) and check domain availability. This availability check is not legal advice.

### 2.2 NFC testing notes (iOS first)

- **Tags:** NTAG213 round stickers, about 25 mm. Buy a pack of 10–20 for testing. Use on-metal tags for metal desks.
- **Writing tags:** iOS Safari cannot write NFC (there's no Web NFC on iOS). Use a free app such as **NFC Tools** to write a *URL record* containing `https://<host>/check-in/<tagId>`, then **lock** the tag so nobody can overwrite it.
- **Reading:** iPhone XS and later read the tag in the background when it's tapped near the top of the phone, with the screen unlocked. iPhone 7–X need the "NFC Tag Reader" button in Control Center.
- **QR codes** stay the guaranteed fallback and get printed on the same label.

---

## 3. Guiding approach

1. **Build vertical slices, not layers.** Each slice runs from DB migration → API → UI → tests.
2. **The "boring core" first.** The occupancy check-in has to be correct before anything playful is built on it (spec principle 8).
3. **Tenant isolation from day one.** Every table gets `tenant_id`, RLS policies and an isolation test when it is created. Retrofitting this later is the most expensive mistake available.
4. **Gamification is a consumer of events, never a participant in transactions.** It reads `outbox_events` and never runs inside the check-in transaction.
5. **Write tests for the hard parts first:** concurrency, idempotency, RLS and rule validation.
6. **One slice per Claude Code session.** Start each session by pointing Claude at this plan plus the slice ID (e.g. "implement slice 2.3"). End it by updating the checklist below.

---

## 4. Phase-by-phase plan

Estimates are in part-time weeks (~10 h each) and are rough.

### Phase 0 — Foundation (≈ 2–3 weeks)

| Slice | Scope | Done when |
|---|---|---|
| **0.1 Repo skeleton** | `git init`, Nx workspace with pnpm, `apps/web` (Angular), `apps/api` (NestJS + Fastify), `packages/contracts`. ESLint, Prettier, strict TS, `.editorconfig`, `.nvmrc` (24), `LICENSE` | `pnpm nx run-many -t lint,build` passes |
| **0.2 Config & health** | Zod-validated env config that fails fast on bad values. `/api/v1/health/live` and `/health/ready` (the readiness check pings the DB). Structured logging with pino, a request ID and a **redaction list** (no emails, tokens, cookies, IPs or bodies) | Missing `DATABASE_URL` → the process exits with a clear message. Readiness returns 503 when the DB is down. **A log-leak test passes** |
| **0.3 Database** | Postgres 17 in Docker Compose. drizzle-kit migrations. **Two DB roles** (`app_migrator` owns the schema, `app_runtime` has no BYPASSRLS). `tenants` and `users` tables. Seed script | `pnpm db:migrate` and `pnpm db:seed` work on a clean volume |
| **0.4 Docker Compose** | `web` (nginx serving the Angular build), `api`, `postgres`, `mailpit` (dev only, for magic-link and invite emails). `.env.example` including `SMTP_*`. Healthchecks | `docker compose up` from a fresh clone → the app shell loads and health is green |
| **0.5 Test harness** | Vitest across the repo. A Testcontainers helper in `packages/test-utils`. A Playwright smoke test | One unit, one integration and one e2e test each pass |
| **0.6 CI** | GitHub Actions: install, lint, typecheck, test (including integration against a Postgres service), build, `pnpm audit`, gitleaks (CI + pre-commit), **personal-data column check** on migrations | A PR shows all checks green. A migration adding `phone` fails CI |
| **0.7 Docs & governance** | README with exact setup steps, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, ADRs D1–D12 | A fresh clone following only the README works (test it in a new directory) |

### Phase 1 — Workplace management (≈ 5–7 weeks)

| Slice | Scope | Done when |
|---|---|---|
| **1.1 Auth** | Better Auth: sign-up (email + optional alias, with a generated default such as "Curious Otter"), sign-in with password or magic link, sign-out, hashed session tokens, CSRF, in-memory login rate limit. `GET /me`. Angular auth guard and login page | Session cookie is HttpOnly, Secure and SameSite=Lax. No token in localStorage. `/me` and member APIs return only allow-listed fields |
| **1.2 Tenancy core** | `memberships` with roles. Tenant-context interceptor: resolve membership → `SET LOCAL app.tenant_id` inside a per-request transaction. RLS policies. Roles guard (`@Roles('admin')`) | **The isolation test suite exists**: a user in tenant A gets 404/403 on every tenant B resource |
| **1.3 Orgs & invites** | Create an organisation (the creator becomes owner). Invite by email. Accept the invite. List members and change roles. Audit events for role changes | Role changes appear in `audit_events` |
| **1.4 Offices / floors / zones / workstations** | CRUD APIs + admin forms. Composite tenant-aware foreign keys. Pagination | Cross-tenant foreign-key insert fails at the DB level |
| **1.5 Layout schema** | `floor_layouts` (versioned) + Zod layout schema (bounds, object types, version) in `contracts` | Invalid layouts are rejected with a useful error |
| **1.6 Isometric renderer** | `packages/isometric-map`: grid↔screen projection, depth sorting, a programmatic SVG asset library (desk, chair, plant, wall, door, table), zoom and pan, selection by stable ID, status overlay kept separate from the artwork | Renders the seed office. Status colours and icons are not colour-only |
| **1.7 Layout editor (admin)** | Click-to-place on the grid (snap, no precise dragging), rotate, delete, link an object to a workstation, save a new version | Layout persists across restarts. Works on a tablet |
| **1.8 Employee map + list view** | Floor/zone selector, details panel, filters, accessible table view sharing the same data source | Keyboard-only user can find and select a desk. axe-core passes in Playwright |

### Phase 2 — NFC/QR and occupancy (≈ 4–5 weeks)

| Slice | Scope | Done when |
|---|---|---|
| **2.1 Tags** | `nfc_tags` with an opaque public ID (≥128-bit random, base62). Create, revoke, replace. QR PNG/SVG via `qrcode`. A printable A4 sheet of QR labels | A revoked tag returns a neutral error. The public resolve endpoint leaks nothing private |
| **2.2 Check-in core** ⭐ | `occupancy_sessions` with **partial unique indexes** (`WHERE checked_out_at IS NULL`) on workstation and on user. Transaction + `SELECT … FOR UPDATE` on the workstation. 409 on conflict. `Idempotency-Key` table | **Concurrency test**: 50 parallel check-ins → exactly 1 succeeds and the rest get 409 |
| **2.3 Check-in UX** | `/check-in/:tagId` mobile page with a sign-in redirect that returns to the check-in. Distinct success, conflict and error states. Check-out. "My workspace" page | Works on iOS Safari and Android Chrome via QR |
| **2.4 Expiry & anonymisation** | pg-boss scheduled job. Per-office policy (default 19:00 local, D16). Admin release with an audit event. Nightly job anonymises history older than the retention period (default 30 days) and purges expired sessions and idempotency keys | An expired session is released and its history row is kept. Rows older than 30 days have `user_id = NULL` |
| **2.4b Privacy controls** | "Download my data" (JSON export) and "Delete my account" (hard delete + anonymise + pseudonymise audit). "Show me to coworkers" opt-in toggle (default off), which reveals alias and email on your **current** desk to same-org members via the desk details endpoint only | E2E: after deletion, no row in any table contains the user's email or ID. With opt-in off, a coworker sees only "Occupied". With it on, they see alias + email. No SSE event ever contains an email |
| **2.5 Realtime** | SSE endpoint per office. `LISTEN/NOTIFY` after commit. Authorised scope. Broadcasts carry IDs and status only, with a contract test that checks for this. The client re-fetches on reconnect | Two browsers: a check-in in one updates the map in the other within 2 s |
| **2.6 NFC field test** | Write NTAG URL records and test on real phones. Document the results | A device compatibility table is in `docs/deployment/nfc.md` |

### Phase 3 — Gamification (≈ 4–6 weeks)

| Slice | Scope | Done when |
|---|---|---|
| **3.1 Outbox** | Check-in and check-out write `outbox_events` inside the occupancy transaction **only when game settings are enabled**. pg-boss worker with retry, backoff and dead-letter handling | Killing the worker mid-run leaves occupancy correct, and the events are processed on restart |
| **3.2 Game settings** | `game_settings` enable switch per tenant. Per-user opt-out preference. UI hides the game centre when disabled | E2E: disable → check-in still works and no XP is written |
| **3.3 Rule engine** | `packages/game-engine`: a pure TS declarative evaluator. Zod schema for conditions with **no unknown operators**. Daily caps, time windows, rule versioning | Fuzz/property tests: malformed rules are rejected |
| **3.4 XP ledger** | Append-only `xp_ledger` with `UNIQUE(tenant_id, user_id, event_id, rule_code)`. Level curve | Replaying the same event 10× grants XP once |
| **3.5 Achievements & quests** | Seeded achievements (first check-in, explorer: 3 zones, etc.). Daily quest progress | Achievement earned once only |
| **3.6 Game centre UI** | XP and level, badge collection, quests, reward toast via SSE `game.rewarded` | No public leaderboard of individuals (privacy) |
| **3.7 Mascot** | One original SVG mascot with CSS idle and celebrate animations, on its own layer that can be toggled off and respects `prefers-reduced-motion` | Map renders the same with the mascot disabled |
| **3.8 Game admin UI** | Rule list and editor (form-based, not raw JSON), event history, abuse review | Saving an invalid rule returns a clear validation error |

**→ MVP checkpoint:** walk through the spec §19 Definition of Done checklist.

### Phase 4 — Open-source readiness (≈ 2–3 weeks)
Covers the public README, architecture guide, API docs (published OpenAPI), backup/restore and upgrade guides, the licence and asset attribution inventory (`license-checker`), a synthetic demo dataset, screenshots, issue and PR templates, and a CHANGELOG with the first tagged release (`v0.1.0`). It also includes a threat-model pass against OWASP ASVS L1 and a trademark check on "DeskQuest".

### Phase 5 — Pilot (ongoing, ≈ 4+ weeks)
Run in a real or friendly office. Collect usability feedback, fix installation friction, add retention settings, track performance metrics, and improve the editor.

### Phase 6 — Managed SaaS (deferred, D15: revisit after the pilot)
Covers OIDC, tenant provisioning, a separate platform-operator role and console, backup and disaster recovery, monitoring and alerting, quotas, an ASVS L2 review and an external pen test.

**Rough total to MVP (Phases 0–3): ~15–21 part-time weeks, about 4–5 months.**

---

## 5. Highest-risk items (tackle early, test hard)

| Risk | Mitigation |
|---|---|
| RLS tenant context leaking between pooled connections | Use only `SET LOCAL` inside an explicit transaction, never session-level `SET`. Add a test that runs interleaved requests from two tenants on a pool of size 1 |
| Runtime role accidentally owns tables, which bypasses RLS | Migrations run as `app_migrator` and the app connects as `app_runtime`. A CI check asserts `app_runtime` is not the owner and lacks BYPASSRLS |
| Double check-in race | Partial unique index (the DB is the final authority) + row lock + concurrency test in CI |
| Duplicate rewards | Ledger unique key on event identity. The outbox consumer is idempotent |
| Isometric editor eats all the time | Grid-snap and click-to-place only for MVP. No freeform drag, no custom artwork upload until Phase 5 |
| iOS NFC quirks (iPhone only reads NDEF URL tags in the background on supported models) | QR is the guaranteed path and NFC is a convenience. Field test in slice 2.6 |
| Scope creep into "game" features | Phase 3 ships only XP, achievements and simple quests. Companions, decoration and seasons stay post-MVP |

---

## 6. Skills required to build this

### 6.1 Human / engineering skill areas

| Area | What you need to know | Learning priority |
|---|---|---|
| **TypeScript (advanced)** | Generics, discriminated unions, Zod inference | High |
| **Angular** | Standalone components, signals, router guards, CDK a11y, reactive forms | High |
| **NestJS** | Modules, providers, guards, interceptors, pipes, request-scoped context | High |
| **PostgreSQL** | Transactions and isolation levels, `SELECT … FOR UPDATE`, partial and composite indexes, **Row-Level Security**, roles and grants, `LISTEN/NOTIFY` | **Critical** |
| **Drizzle ORM** | Schema definitions, migrations, raw SQL escape hatches, transactions | Medium |
| **Web security** | Session cookies, CSRF, CSP, rate limiting, IDOR, OWASP ASVS | **Critical** |
| **Distributed-systems basics** | Idempotency keys, transactional outbox, at-least-once delivery, retries | High |
| **SVG & isometric math** | 2:1 isometric projection, depth sorting, viewBox zoom and pan, pointer events | High (core to the "game" feel) |
| **Game design** | Reward loops, pacing, avoiding unhealthy incentives (spec §9.3), achievement design | Medium |
| **Pixel and vector illustration / animation** | Consistent isometric grid art, mascot character design, CSS/SMIL animation, `prefers-reduced-motion` | Medium (can be outsourced later) |
| **UX & accessibility** | Mobile-first check-in flow, WCAG 2.2 AA, screen-reader labelling of a visual map | High |
| **NFC / QR** | NDEF URL records, tag types (NTAG21x), iOS/Android behaviour, printable label layout | Low–Medium |
| **DevOps** | Docker multi-stage builds, Compose, GitHub Actions, reverse proxy (Caddy) and TLS, backups (`pg_dump`) | Medium |
| **Testing** | Testcontainers, Playwright, concurrency testing, property-based tests (fast-check) | High |
| **Privacy & legal** | GDPR/PDPA basics, retention policies, privacy notices, open-source licensing and asset licensing | Medium |
| **Open-source maintenance** | Semantic versioning, changelogs, contributor docs, triaging issues | Low (Phase 4+) |

### 6.2 Claude Code skills/tools useful for this project

| Skill | When to use it |
|---|---|
| `/init` | After Phase 0.1, to create a `CLAUDE.md` with build/test commands and the working rules from spec §20 |
| `/run` | To launch the app and verify a slice in a real browser |
| `/code-review` | Before closing each slice (use the `high` level for slices 1.2, 2.2 and 3.4) |
| `/security-review` | After auth (1.1), tenancy (1.2), tags (2.1) and before any public release |
| `vuln-check` | Dependency CVE and licence scans (Phase 4 licence inventory, pre-release) |
| `/simplify` | Clean-up pass after a slice works |
| `ui-ux-revamp` | Polishing the employee map, check-in page and game centre |
| `dataviz` | Admin utilisation reports and dashboards (Phase 5) |
| `hyperframes` / `motion-graphics` | Optional: a demo or launch video for the open-source release (Phase 4) |
| `find-skills` | To find community skills for Angular, NestJS or Playwright if needed |

---

## 7. Progress checklist

- [x] Q3, Q4, Q6, Q7, Q8 answered
- [x] Q2 name confirmed: DeskQuest
- [x] Q1 licence confirmed: Apache-2.0
- [x] Node 24 installed (v24.22.1, pnpm 12.15.0)
- [x] Slice 0.1: Nx 24 workspace, Angular 22 `web` + `web-e2e` (Playwright, iPhone profile), NestJS `api`, `@deskquest/contracts` library, Apache-2.0 LICENSE. Lint, test, typecheck and build all green
- [x] Slice 0.2: API moved to the Fastify adapter (D1). Zod env config (`apps/api/src/config/env.ts`) exits with code 1 and names bad variables without echoing values. `GET /api/v1/health/live` and `/health/ready` (`SELECT 1` via a `pg` pool, 503 when down). nestjs-pino with request IDs (`X-Request-ID`), allow-list serializers (no headers, bodies, query strings or IPs), key redaction and an email-scrubbing destination. Log-leak test passes. Projects tagged `scope:api` / `scope:web` / `scope:shared`
- [x] Slice 0.3: `@deskquest/db` library (Drizzle schema, drizzle-kit migrations in `packages/db/migrations`). Compose Postgres 17 (loopback only). `deployment/compose/postgres/initdb/01-roles.sh` creates `app_migrator` (owns everything) and `app_runtime` (DML only, no BYPASSRLS); migration 0000 sets default grants. `tenants` + `users` tables. `pnpm db:migrate`, `db:seed` (idempotent, refuses in production) and `db:check-roles` verified on a clean volume, including a tamper test. **Carry forward:** `tenants` / `users` have no `tenant_id` and no RLS yet; add their policies in 1.1/1.2. Wire `db:check-roles` into CI in 0.6
- [x] Slice 0.4: `deployment/docker/Dockerfile` (targets `api` and `web`). `docker-compose.yml` (production-shaped: postgres, one-shot `migrate`, `api`, `web` on nginx-unprivileged with CSP and privacy log format, read-only + cap_drop) plus `docker-compose.override.yml` (dev: published Postgres port, Mailpit). `SMTP_*` in `.env.example` and the API env schema. Nx welcome replaced with a minimal DeskQuest shell showing API status. Verified from a fresh copy: all services healthy, shell loads in Chrome with no CSP errors or external requests
- [x] Slice 0.5: `@deskquest/test-utils` with `startTestDatabase()` (Testcontainers Postgres 17, Compose role script, real migrations; finds the Docker socket via `docker context`). Integration tests in `*.int.spec.ts`, run by `pnpm test:integration` (separate `integration` target, excluded from `test`): role separation (7) and API readiness as `app_runtime` (1). Playwright smoke test `apps/web-e2e/src/smoke.spec.ts` passes in Chromium and iPhone 15 WebKit. **Carry forward to 0.6:** the e2e smoke needs the API, so CI should run it against the Compose stack (`BASE_URL`), not `web:serve-static`
- [x] Slice 0.6 (verified locally; first GitHub run pending the first push): `.github/workflows/ci.yml` with jobs `checks` (lint/test/typecheck/build + personal-data column check), `integration` (Testcontainers), `e2e` (Compose stack + `db:check-roles` + Playwright via `BASE_URL`) and `security` (gitleaks full history, checksum-verified; `pnpm audit --prod` blocking, full audit advisory). Actions pinned to SHAs; weekly scheduled run. `pnpm db:check-personal-data` rejects a migration adding `phone`. Pre-commit gitleaks hook in `.githooks/` (installer leaves an existing `core.hooksPath` alone). Security overrides in `pnpm-workspace.yaml`: fastify 5.12.7 (was 5.11.3, 4 high advisories), patched vite/undici/body-parser, and the unused `@nestjs/platform-express` peer removed
- [x] Slice 0.7: `README.md` (Docker and development setup, commands, configuration, troubleshooting), `CONTRIBUTING.md`, `SECURITY.md` (GitHub private vulnerability reporting), `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1, private reports via the same form), ADRs 0001–0012 in `docs/architecture/adr`. Verified by following only the README in a new directory: Docker path, development setup, checks, integration and e2e all pass. Found and fixed: `web:serve` didn't wait for the API to be ready (the cause of the one-off e2e failure in 0.6)
- [x] **Phase 0 complete** (verified locally; first GitHub CI run pending the first push)
- [ ] Phase 1 complete (1.1–1.8)
- [ ] Phase 2 complete (2.1–2.6)
- [ ] Phase 3 complete (3.1–3.8) → **MVP**
- [ ] Phase 4 complete → `v0.1.0` public
- [ ] Phase 5 pilot
- [ ] Phase 6 (revisit after the pilot, D15)

---

## 8. How to kick off the next session

> "Read `docs/deskquest-specification.md` and `docs/planning/implementation-plan.md`. Implement **slice 1.1** only. Follow the spec §20 workflow and report what passed and what failed."
