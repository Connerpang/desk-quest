# 0009. Server-sent events with LISTEN/NOTIFY

- **Status:** Accepted (implementation in slice 2.5)
- **Date:** 2026-10-23

## Context

Open maps must update within about two seconds when a desk is taken or
released. Updates flow one way (server to browser), and the deployment must
not need Redis.

## Decision

Push updates with **server-sent events** from NestJS. After a transaction
commits, the API issues PostgreSQL `NOTIFY`; every API instance `LISTEN`s
and forwards events to its connected browsers.

## Consequences

- Plain HTTP, automatic browser reconnection, and it scales across API
  instances without a message broker.
- Events carry IDs and status only, never names or emails (data-inventory
  §2.3); a contract test enforces this. Clients re-fetch details through
  authorised endpoints.
- Reverse proxies must not buffer the stream. The bundled nginx config
  already disables buffering for `/api/`.
