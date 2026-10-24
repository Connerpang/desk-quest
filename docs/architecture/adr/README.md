# Architecture decision records

Each record captures one significant decision: the context, what was decided
and what follows from it. Records are numbered and never renumbered. To change
a decision, add a new record that supersedes the old one and update the old
record's status.

Start from [template.md](template.md).

| ADR                                        | Decision                                                | Status   |
| ------------------------------------------ | ------------------------------------------------------- | -------- |
| [0001](0001-nestjs-with-fastify.md)        | NestJS with the Fastify adapter                         | Accepted |
| [0002](0002-drizzle-orm-and-migrations.md) | Drizzle ORM and drizzle-kit migrations                  | Accepted |
| [0003](0003-programmatic-svg-art.md)       | Programmatic SVG for initial art                        | Accepted |
| [0004](0004-nx-and-pnpm-monorepo.md)       | Nx and pnpm workspaces                                  | Accepted |
| [0005](0005-node-24-lts.md)                | Node.js 24 LTS                                          | Accepted |
| [0006](0006-zod-shared-contracts.md)       | Zod schemas as shared contracts                         | Accepted |
| [0007](0007-better-auth.md)                | Better Auth with database sessions                      | Accepted |
| [0008](0008-pg-boss-background-jobs.md)    | pg-boss for background jobs                             | Accepted |
| [0009](0009-sse-with-listen-notify.md)     | Server-sent events with LISTEN/NOTIFY                   | Accepted |
| [0010](0010-testing-strategy.md)           | Testing strategy                                        | Accepted |
| [0011](0011-angular-frontend.md)           | Angular with standalone components, signals and the CDK | Accepted |
| [0012](0012-apache-2-licence.md)           | Apache-2.0 licence                                      | Accepted |

The plan's decision IDs (D1–D12 in
[implementation-plan.md](../../planning/implementation-plan.md)) map to ADRs
0001–0012.
