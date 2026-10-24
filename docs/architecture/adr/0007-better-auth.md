# 0007. Better Auth with database sessions

- **Status:** Accepted (implementation in slice 1.1)
- **Date:** 2026-10-23

## Context

The spec (§11.1) rules out hand-rolled authentication. Sign-in is email and
password plus magic links (plan D13). Sessions must use HttpOnly cookies,
never tokens in `localStorage`, and the managed SaaS will later need OIDC.

## Decision

Use **Better Auth** with its Drizzle adapter and database-backed sessions in
HttpOnly, Secure, `SameSite=Lax` cookies. Session tokens are stored hashed.
Auth tables are separate from the user profile, which holds only email and
alias (data-inventory §1).

**Fallback:** if Better Auth does not integrate cleanly with NestJS and
Fastify, use `@fastify/session` with argon2id password hashing, and record
that in a superseding ADR.

## Consequences

- A maintained library handles password hashing, magic-link tokens, session
  rotation and CSRF considerations.
- Its expected table and column names must map onto our schema and the data
  inventory; any extra stored field needs an inventory entry.
- Magic links need SMTP: Mailpit in development, any relay in production
  (`SMTP_*` settings).
