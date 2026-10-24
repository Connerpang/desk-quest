# Data Inventory & Minimisation Rules

**Status:** Binding design rule from Phase 0 onward (see plan decision D18)
**Principle:** Store nothing we don't strictly need. Hide what we do store from everyone who doesn't need it. Delete or anonymise it as early as possible.

> Zero personal data is not achievable for a system with logins: an email address and "who sat at which desk" are personal data by definition. This document defines the **minimum** set we store and the rules that keep it minimal.

---

## 1. What we store (the complete list)

Any field not in this table needs a documented reason and a review before it can be added.

| Data | Where | Why it's needed | Who can see it | Retention |
|---|---|---|---|---|
| Email address | `users.email` | Sign-in, magic links, invitations, finding coworkers (opt-in) | The user themselves and tenant admins (member list). Other employees **only if the user opts in** (see §1.1) | Until account deletion |
| Password hash (argon2id) | Auth tables (separate from profile) | Password login | Nobody; it's never returned by any API | Until changed or the account is deleted |
| Session token **hash** | Auth sessions table | Keeping users signed in | Nobody | Session lifetime (default 14 days idle) |
| Display name / alias | `users.display_name` | Shown in the UI | Self + admins. Other employees only if the user opts in | Until account deletion |
| Role in organisation | `memberships` | Permissions | Self + admins | Until membership ends |
| Active check-in (user ↔ desk) | `occupancy_sessions` | Showing the desk as occupied | Others see **"Occupied" only** by default. Alias and email are shown if the occupant opted in (§1.1). Admins see who | While active |
| Visibility preference | `memberships.show_to_coworkers` (boolean, default `false`) | Opt-in for showing identity on the map | Self + admins | Until membership ends |
| Check-in history | `occupancy_sessions` (closed) | The user's own history, aggregate utilisation | Self + admins | **30 days**, then `user_id` is removed (anonymised). Configurable per tenant, max 365 days |
| XP, achievements, quest progress | Game tables | Gamification (opt-in) | Self only. Team totals are aggregated | Until account deletion or game data reset |
| Audit events | `audit_events` | Security and accountability | Admins | 365 days. On user deletion, the actor is replaced with a pseudonym |

### 1.1 "Show me to coworkers" (opt-in)

- Off by default, per organisation membership. The toggle is in Profile and also offered once, with an explanation, at first check-in.
- When **on**: members of the **same organisation** who click your occupied desk see your alias and email (e.g. to message you). Nothing is shown to other organisations or to anyone who isn't signed in.
- Only the **current** desk is shown. Coworkers can never see your check-in history.
- Turning it off takes effect immediately, including on open maps (an SSE `workstation.updated` event triggers a re-fetch).
- The API returns the identity only through the authorised workstation-details endpoint, never in SSE broadcasts or list or bulk endpoints. This stops anyone scraping where everyone sits.
- Changing the setting is not audited, so no record is kept of who toggled visibility when.

### Data the system does not store
- Real names (the display name is a free alias, defaulting to a generated name such as "Curious Otter")
- Phone number, photo, date of birth, gender, address, job title, department or employee ID
- GPS, Wi-Fi, Bluetooth or any device location. Check-in only proves "a tag was scanned"
- Device identifiers and browser fingerprints
- **IP addresses at rest**. Rate limiting keeps them in memory only. Logs keep no IPs
- Request or response bodies in logs
- Uploaded floor-plan images or photos (MVP layouts are drawn on a grid, so no building blueprints are uploaded)
- Personal data on NFC tags or in QR codes. They contain only a random tag ID
- Third-party analytics, tracking pixels, external fonts or CDNs at runtime. Everything is self-hosted, so no visitor data leaks to third parties
- Any telemetry sent "home" to the project maintainers

---

## 2. Rules for code (enforced in review and CI)

1. **Schema allow-list.** A CI check fails if a migration adds a column whose name matches a personal-data pattern (`phone`, `dob`, `birth`, `address`, `gender`, `photo`, `ip`, `location`, `lat`, `lng`, `ssn`, `passport`, `salary`) unless it is listed in this inventory.
2. **Log redaction.** The pino logger redacts `email`, `password`, `token`, `cookie`, `authorization`, `set-cookie` and `*.secret`. A test feeds a request containing an email address and asserts that the address never appears in log output.
3. **No personal data in events.** SSE broadcasts, outbox payloads and audit metadata carry IDs only, never emails or display names. Schemas enforce this, and a contract test checks it.
4. **API minimisation.** Response DTOs are explicit allow-lists, never `SELECT *` mapped to JSON. Workstation and occupancy endpoints for employees return `occupied: true`, not who occupies the desk.
5. **Free-text fields are limited.** Desk names, zone names and quest descriptions have length limits. Admin UI hints warn against entering personal or confidential information.
6. **Secrets live in the environment only.** They never go in the DB, logs, the repo or error messages. gitleaks runs in CI and as a pre-commit hook.
7. **Errors are generic.** Clients get no stack traces, SQL or internal IDs of other tenants.
8. **Anonymisation job.** A nightly pg-boss job nulls `user_id` on occupancy history older than the retention period and purges expired sessions and idempotency keys.
9. **Right to erasure.** "Delete my account" hard-deletes the user, their game data and their auth records, anonymises their occupancy history, and pseudonymises them in audit events. It can't be undone and is itself audited, but without personal data.
10. **Right of access.** "Download my data" exports everything in the table above for that user as JSON.
11. **Backups** follow the same retention. The docs require encrypted storage for self-hosted backups.

---

## 3. Confidential company data

| Data | Protection |
|---|---|
| Office and floor layout | Tenant isolation (RLS). Visible only to members. No public endpoint |
| Organisation and member list | Admins only |
| Utilisation reports | Aggregated only (minimum group size of 5 to prevent singling out individuals) |
| Tag IDs | Treated as public. They reveal nothing without a logged-in member account |

---

## 4. Self-hoster responsibilities (documented in the deployment guide)
- Run behind HTTPS.
- Use disk encryption for the database volume and backups.
- Restrict who has shell or database access to the server.
- Publish a privacy notice to employees (a template is provided in `docs/privacy/notice-template.md`, Phase 4).
