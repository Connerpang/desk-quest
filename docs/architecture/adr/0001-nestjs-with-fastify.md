# 0001. NestJS with the Fastify adapter

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The spec (§5.1) asks for a modular monolith with clear domain boundaries:
identity, tenancy, offices, occupancy, tags, gamification and audit. The
frontend is Angular, and a solo developer maintains both sides.

## Decision

Build the API with **NestJS** on the **Fastify** HTTP adapter. Domain areas
become Nest modules. The API is served under `/api/v1` (URI versioning).

## Consequences

- Modules, providers, guards and interceptors map directly onto the spec's
  boundaries, and the tenant-context interceptor (slice 1.2) has an obvious
  home. The dependency-injection style is familiar from Angular.
- Fastify is faster than Express and has first-class schema support.
- Some Nest examples assume Express. Middleware sees a rewritten `req.url`
  under Fastify (use `originalUrl`), which bit the health-check log filter in
  slice 0.2.
- `@nestjs/platform-fastify` pins an exact Fastify version. In Phase 0 that
  version had four high-severity advisories, so `pnpm-workspace.yaml`
  overrides it to a patched release. Remove the override once Nest ships the
  fix, and keep `pnpm audit --prod` blocking in CI.
- `@nestjs/core` lists Express as an optional peer, which pnpm installs
  anyway. It is removed with an override so Express never ships.
