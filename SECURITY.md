# Security policy

DeskQuest stores who checks in where, so we take security and privacy
reports seriously.

## Supported versions

DeskQuest has not had a release yet. Security fixes go into the `main`
branch. Once versioned releases start, this section will list which ones
receive fixes.

## Reporting a vulnerability

**Please don't report security problems in public issues, discussions or
pull requests.**

Report privately through GitHub:
[Security → Report a vulnerability](https://github.com/Connerpang/desk-quest/security/advisories/new).
Only the maintainers can see the report.

Please include:

- what the problem is and what an attacker could do with it
- the steps or a proof of concept to reproduce it
- the version or commit, and how DeskQuest was deployed (Docker Compose,
  development setup, other)
- any suggested fix

Don't include real personal data. Use test accounts and `example.com`
addresses.

## What to expect

DeskQuest is maintained part-time, so these are targets, not guarantees:

- We acknowledge your report within **7 days**.
- We confirm or rule out the problem and share a plan within **30 days**.
- We aim to fix it and publish an advisory within **90 days** of your
  report, and we agree the disclosure date with you. Please don't disclose
  publicly before then.

We'll credit you in the advisory unless you'd rather stay anonymous.

## Scope

In scope: this repository's code, the Docker images and Compose files it
builds, and its default configuration. Examples of what we especially want
to hear about:

- access to another organisation's data (tenant isolation)
- seeing who sits where without permission
- personal data in logs, events or API responses beyond the
  [data inventory](docs/privacy/data-inventory.md)
- authentication or session weaknesses
- anything that lets the runtime database role bypass Row-Level Security

Out of scope: denial of service through traffic volume, problems that need
an already compromised server or database, and deployments that ignore the
hardening notes below.

## Hardening notes for self-hosters

- Change every password in `.env`, and keep `.env` out of version control.
- Run behind a reverse proxy with HTTPS. The bundled web server listens on
  `127.0.0.1` only by default.
- On servers, start with `docker compose -f docker-compose.yml …` so the
  database port and Mailpit aren't published.
- Encrypt the database volume and backups, and restrict who has shell or
  database access (data inventory §4).
