# DeskQuest
## Open-Source Gamified Workplace Platform — Product & Technical Specification

**Document type:** Product requirements + software architecture + implementation instructions  
**Status:** Initial build specification  
**Project name:** DeskQuest (renamed from the provisional "OpenOffice Quest" to avoid the Apache OpenOffice trademark)  
**Target audience:** Small and medium-sized offices  
**Deployment:** Self-hosted and managed SaaS  
**Primary interface:** Responsive web application  
**Visual style:** Isometric, game-like office map  
**Gamification:** Configurable, optional, independently deployable feature module  
**Preferred implementation stack:** Angular, TypeScript, Node.js, PostgreSQL, Docker Compose  
**Primary goal:** Build a useful, privacy-conscious workplace platform that can be deployed by different companies without modifying the application source code.

---

# 1. Product Vision

DeskQuest turns an ordinary workplace into an interactive digital office.

Employees scan NFC tags or QR codes at their workstations to check in and out. The application updates the office map, displays workstation availability, and optionally triggers gamification events.

Companies can enable a configurable game layer featuring XP, achievements, quests, virtual companions, team challenges, collectible items and an animated isometric office.

The platform must work for a company with a single office and a small number of desks, while supporting a future path toward multiple offices and enterprise deployments.

## 1.1 Product principles

1. **Useful before playful.** Workplace management must work when gamification is disabled.
2. **Configuration over customisation.** Companies configure layouts, policies, themes and rewards rather than maintaining code forks.
3. **Privacy by design.** Occupancy data is operational information, not an employee performance score.
4. **Self-hosting is a first-class deployment.** No mandatory cloud account or external AI service.
5. **Open and extensible.** Developers can add integrations, themes and game mechanics through documented interfaces.
6. **Progressive complexity.** A new office can get started with a small number of steps.
7. **Accessible by default.** The isometric map is an interface, not the only way to use the product.
8. **Reliable transactions.** Game rewards must never compromise workstation availability or data integrity.

## 1.2 Target users

### Employee
- View workstation availability.
- Check in and out using NFC or QR.
- Find a workstation.
- View their own check-in status.
- Optionally participate in quests and collect achievements.
- Manage their gamification preferences.

### Office administrator
- Create and configure an office.
- Manage floors, zones, workstations and NFC tags.
- Manage memberships and permissions.
- Configure check-in and occupancy policies.
- View appropriate operational reports.

### Game administrator
- Enable or disable gamification.
- Configure XP rules, quests, achievements and themes.
- Configure team challenges.
- Review game events and investigate reward abuse.

### Platform operator
- Manage hosted SaaS organisations.
- Monitor service health.
- Manage subscription and service limits if introduced.
- Handle tenant provisioning and support.
- Never access tenant data without an authorised operational reason and appropriate audit trail.

### Open-source contributor
- Run the project locally.
- Add or modify features.
- Create extensions.
- Submit changes using documented contribution guidelines.

---

# 2. Product Scope

## 2.1 MVP — required

The first usable release must include:

- User authentication.
- Organisation and membership management.
- Office, floor and zone management.
- Workstation management.
- An isometric office map.
- Workstation availability.
- NFC and QR check-in.
- Check-out and stale-occupancy expiry.
- Basic admin dashboard.
- Optional gamification configuration.
- A basic XP and achievement system.
- Docker-based local deployment.
- Database migrations and seed data.
- Automated tests.
- Setup and deployment documentation.

## 2.2 Post-MVP

- Multiple offices and floors per organisation.
- Virtual companion collection.
- Animated characters and collectibles.
- Daily and weekly quests.
- Cooperative team challenges.
- Virtual office decoration.
- Seasonal events.
- Advanced analytics.
- Enterprise SSO integrations.
- Calendar and chat integrations.
- Extension/plugin framework.
- Optional AI office assistant.
- Managed SaaS billing and subscription management.

## 2.3 Explicitly out of scope for MVP

- Native iOS or Android applications.
- Automatic physical-presence detection.
- Bluetooth beacon tracking.
- Facial recognition or biometric identification.
- Employee productivity scoring.
- Automatic monitoring of employee movements.
- Complex 3D modelling and physics.
- Microservices architecture.
- Mandatory generative AI.
- Mandatory paid external services.
- Arbitrary third-party plugin code execution.

---

# 3. Core User Experience

## 3.1 Employee journey

1. The employee signs in.
2. The application opens the default office map.
3. Workstations display their current status.
4. The employee scans a workstation NFC tag or QR code.
5. The application identifies the workstation from the tag identifier.
6. The employee authenticates if not already signed in.
7. The backend validates access, availability and check-in policy.
8. The backend creates the occupancy record.
9. The office map updates.
10. If gamification is enabled, an eligible event is evaluated by the game engine.
11. The employee sees confirmation and any applicable reward.
12. When leaving, the employee checks out or the configured expiry policy releases stale occupancy.

The interface must clearly distinguish a successful check-in from a failed or conflicting request.

## 3.2 Administrator journey

1. Create an organisation.
2. Create an office.
3. Create a floor and zones.
4. Upload or draw a floor plan.
5. Place workstation markers on the map.
6. Configure workstation properties.
7. Generate tag identifiers and printable QR codes.
8. Configure occupancy rules.
9. Optionally enable gamification.
10. Invite employees.
11. Test check-in and check-out.
12. Review operational status and aggregated utilisation.

## 3.3 NFC behaviour

For MVP, use URL-based NFC tags.

A tag should contain a URL such as:

`https://example.org/check-in/<opaque-tag-id>`

The URL identifies the workstation tag, not an employee.

Requirements:

- Do not store employee names, credentials or personal data on tags.
- Treat tag IDs as public identifiers, not authentication secrets.
- Resolve tags server-side.
- Validate organisation, workstation and tag status.
- Require an authenticated user for occupancy changes.
- Apply rate limits and duplicate-request protection.
- Provide a QR fallback.
- Support tag revocation and replacement.
- Make the check-in flow usable on mobile browsers.
- Test supported iOS and Android devices.

A successful scan only proves that the tag was scanned. It does not prove that the employee remains at the workstation.

---

# 4. Product UI and Isometric Office Map

## 4.1 Main screens

### Employee application

**A. Office map**
- Isometric office scene.
- Floor and zone selector.
- Workstation status indicators.
- Workstation details panel.
- Filters for equipment and workstation type.
- Search for an available workstation.
- Accessible list alternative.

**B. My workspace**
- Current workstation, if any.
- Check-in and check-out actions.
- Personal check-in history with limited retention.
- Gamification preferences.
- Personal achievements when enabled.

**C. Game centre**
- XP and level.
- Achievement collection.
- Available quests.
- Mascot collection.
- Team challenge progress.
- Reward history.

Hide or disable this screen when gamification is off.

**D. Profile**
- Display name.
- Preferences.
- Notification settings.
- Privacy information.
- Account and data controls.

### Administration application

- Organisation settings.
- Office and floor editor.
- Workstation and zone editor.
- NFC/QR tag management.
- Membership and role management.
- Occupancy policy.
- Gamification configuration.
- Audit log.
- Service health.

## 4.2 Isometric rendering strategy

Use a 2D isometric scene, not a real-time 3D engine, for MVP.

Recommended implementation:
- Angular for the application.
- SVG for the isometric map and interactive objects.
- CSS animations for simple transitions.
- TypeScript scene model for coordinates and object state.
- Optional Canvas rendering later if performance testing justifies it.

Represent each floor as a collection of positioned objects.

Example:

```json
{
  "version": 1,
  "projection": "isometric",
  "objects": [
    {
      "id": "desk-a01",
      "type": "workstation",
      "x": 160,
      "y": 120,
      "rotation": 0,
      "asset": "desk-basic",
      "zoneId": "engineering"
    }
  ]
}
```

This is an illustrative scene format. The final schema must include validation, bounds and versioning.

### Rendering requirements

- Objects must be selectable using stable IDs.
- Workstation status must be rendered independently from artwork.
- Support zoom and pan.
- Avoid requiring precise drag-and-drop on mobile.
- Support keyboard navigation and screen-reader labels.
- Provide a list or table view with equivalent functionality.
- Store layout coordinates separately from workstation data.
- Do not put employee names directly into the floor-plan file.
- Support layout versioning and future schema migrations.
- Ensure custom artwork is optional and replaceable.

## 4.3 Asset pipeline

Initially ship simple, original vector assets:
- Workstations.
- Chairs.
- Plants.
- Meeting tables.
- Pantry furniture.
- Doors and walls.
- Availability indicators.
- One original mascot.

Use a consistent visual grid and documented asset dimensions.

Mascot animation should be a separate layer from the office layout. Do not make the core application depend on a particular mascot collection.

---

# 5. Recommended Architecture

## 5.1 Architectural style

Use a **modular monolith** with clear domain boundaries.

Do not begin with microservices. The first release should be simple to develop, run, test and deploy.

Suggested modules:

1. Identity and access.
2. Organisations and memberships.
3. Office structure.
4. Floor-plan layouts.
5. Workstation management.
6. Occupancy.
7. NFC and QR tags.
8. Gamification.
9. Notifications.
10. Audit and administration.
11. SaaS platform operations.

Modules should communicate through explicit service interfaces. Domain events may be used to decouple optional gamification from the core occupancy workflow.

## 5.2 Technology choices

| Layer | Technology |
|---|---|
| Frontend | Angular + TypeScript |
| Map renderer | SVG |
| Backend | Node.js + TypeScript |
| HTTP framework | Fastify or NestJS; choose one |
| API contract | OpenAPI |
| Database | PostgreSQL |
| Database access | Type-safe SQL or a mature ORM |
| Realtime updates | Server-Sent Events initially |
| Background jobs | PostgreSQL-backed job processing initially, if required |
| Cache | None initially; Redis optional later |
| Validation | Shared schemas or equivalent runtime validation |
| Authentication | Secure session-based authentication for initial deployment |
| Packaging | Docker and Docker Compose |
| Testing | Unit, integration, API and end-to-end tests |
| CI | GitHub Actions |
| Documentation | Markdown and OpenAPI |
| Observability | Structured logs, health endpoints and metrics |

Choose the HTTP framework and database access library before implementation. Do not mix multiple frameworks or ORMs without a concrete reason.

Use the currently supported stable releases at implementation time, pin dependency versions, and commit the package lockfiles.

## 5.3 Logical architecture

```text
                    ┌──────────────────────┐
                    │ Employee Web App     │
                    │ Admin Console        │
                    └──────────┬───────────┘
                               │ HTTPS
                    ┌──────────▼───────────┐
                    │ Node.js API          │
                    │ Authentication       │
                    │ Tenant Context       │
                    │ Authorization        │
                    └──────────┬───────────┘
                               │
           ┌───────────────────┼────────────────────┐
           │                   │                    │
┌──────────▼────────┐ ┌────────▼─────────┐ ┌────────▼─────────┐
│ Workplace Module  │ │ Gamification     │ │ Admin / Audit    │
│ Offices and Desks │ │ Rules and XP      │ │ Policies         │
│ Occupancy         │ │ Quests / Badges   │ │ Audit Events     │
└──────────┬────────┘ └────────┬─────────┘ └────────┬─────────┘
           │                   │                    │
           └───────────────────┼────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │ PostgreSQL           │
                    │ Tenant-scoped data   │
                    │ Transactional state  │
                    └──────────────────────┘
```

The diagram describes logical modules, not separately deployed services.

## 5.4 Core event flow

A successful check-in should:

1. Authenticate the user.
2. Resolve the tenant and membership.
3. Validate the workstation tag.
4. Begin a database transaction.
5. Acquire the necessary lock or use an equivalent concurrency-safe operation.
6. Confirm that the workstation can be occupied.
7. Create or update the occupancy record.
8. Write an audit event where required.
9. Write an outbox event if gamification is enabled.
10. Commit the transaction.
11. Return the confirmed occupancy state.
12. Publish the update and process optional rewards asynchronously.

Use a transactional outbox when reliable event delivery is needed. Do not rely on an uncoordinated in-memory callback to guarantee rewards.

If the reward processor fails, occupancy must still be correct. Reward processing must be retryable and idempotent.

---

# 6. Deployment Architecture: Self-Hosted and SaaS

## 6.1 Shared application core

Both deployment models should use the same application code, migrations, API and business rules.

Do not maintain separate self-hosted and SaaS codebases.

Differences should be limited to deployment configuration and platform-specific services.

## 6.2 Self-hosted deployment

A small office should be able to run the application using Docker Compose.

Minimum services:

- Web frontend.
- API backend.
- PostgreSQL.
- Optional reverse proxy.

Provide:
- `.env.example`.
- Database migration command.
- Seed-data command.
- Initial administrator setup.
- Backup and restore instructions.
- Upgrade instructions.
- Health checks.
- Secure production configuration guide.

The application must not require Redis, an AI API key or a proprietary cloud service for its core features.

## 6.3 Managed SaaS deployment

The hosted platform may share application infrastructure between organisations while logically isolating their data.

Recommended initial model: **shared application and database, with tenant-scoped records and PostgreSQL Row-Level Security as defence in depth.**

Requirements:
- Each organisation has a unique tenant ID.
- All tenant-owned records are scoped to that tenant.
- Tenant identity is derived from authenticated membership and trusted server-side context.
- Never trust a client-supplied tenant ID as proof of access.
- Cross-tenant queries must fail closed.
- Database connection pooling must not leak tenant context between requests.
- Platform administration must be separate from ordinary tenant administration.

PostgreSQL Row-Level Security is useful, but it is not a substitute for application authorisation. Table owners and privileged database roles may bypass policies, so runtime roles and migration roles must be separated appropriately.

Reference: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

## 6.4 Future deployment options

Do not implement database-per-tenant or dedicated infrastructure in MVP.

Design interfaces so that a later enterprise edition can support:
- Dedicated database per customer.
- Dedicated deployment.
- Enterprise identity providers.
- Custom retention policies.
- Customer-controlled backups.
- Regional data hosting.

These should be future capabilities, not reasons to delay the first release.

---

# 7. Multi-Tenant Data Model

## 7.1 Tenant model

Use the same data model in self-hosted and SaaS deployments.

A self-hosted instance may have one organisation initially, but it should still use organisation IDs and membership-based permissions. This avoids a major redesign if multi-organisation support is introduced later.

A single company may have multiple offices, floors and zones.

The logical hierarchy is:

```text
Platform
  └── Organisation / Tenant
        ├── Members
        ├── Offices
        │     ├── Floors
        │     │     ├── Zones
        │     │     └── Workstations
        │     └── Layouts
        ├── Tags
        ├── Occupancy Records
        ├── Game Configuration
        ├── Quests
        ├── Achievements
        └── Audit Events
```

## 7.2 Core tables

### `tenants`
- `id` UUID primary key.
- `name`.
- `slug`.
- `status`.
- `settings_json`.
- `created_at`.
- `updated_at`.

### `users`
- `id` UUID primary key.
- `email` or external identity subject.
- `display_name`.
- `status`.
- `created_at`.
- `updated_at`.

Keep authentication secrets out of ordinary profile records. If using an external identity provider, store the required provider subject and minimal profile data.

### `memberships`
- `id` UUID.
- `tenant_id`.
- `user_id`.
- `role`.
- `status`.
- `created_at`.
- `updated_at`.

Unique constraint: `(tenant_id, user_id)`.

### `offices`
- `id`.
- `tenant_id`.
- `name`.
- `timezone`.
- `status`.
- `created_at`.
- `updated_at`.

### `floors`
- `id`.
- `tenant_id`.
- `office_id`.
- `name`.
- `sort_order`.

### `zones`
- `id`.
- `tenant_id`.
- `floor_id`.
- `name`.
- `zone_type`.
- `settings_json`.

### `workstations`
- `id`.
- `tenant_id`.
- `floor_id`.
- `zone_id`, nullable.
- `code`.
- `name`.
- `workstation_type`.
- `equipment_json`.
- `status`.
- `created_at`.
- `updated_at`.

Unique constraint: `(tenant_id, code)` unless codes are explicitly scoped per office.

### `floor_layouts`
- `id`.
- `tenant_id`.
- `floor_id`.
- `version`.
- `projection`.
- `layout_json`.
- `created_by`.
- `created_at`.

### `nfc_tags`
- `id`.
- `tenant_id`.
- `workstation_id`.
- `public_tag_id`.
- `tag_type`.
- `status`.
- `created_at`.
- `revoked_at`, nullable.

The public tag identifier must be unique and revocable. Do not treat it as an authentication credential.

### `occupancy_sessions`
- `id`.
- `tenant_id`.
- `workstation_id`.
- `user_id`.
- `checked_in_at`.
- `checked_out_at`, nullable.
- `expires_at`, nullable.
- `check_in_method`.
- `created_at`.

Only one active occupancy session may exist for a workstation where exclusive occupancy is required.

Use a PostgreSQL partial unique index or equivalent transaction-safe constraint for active sessions. Add appropriate indexes for active workstation and user lookups.

### `audit_events`
- `id`.
- `tenant_id`.
- `actor_user_id`, nullable.
- `action`.
- `resource_type`.
- `resource_id`.
- `metadata_json`, restricted to necessary non-sensitive data.
- `created_at`.

Do not store credentials, tokens or unnecessary personal information in audit metadata.

## 7.3 Gamification tables

### `game_settings`
- `tenant_id`.
- `enabled`.
- `config_json`.
- `updated_at`.

### `game_rules`
- `id`.
- `tenant_id`.
- `name`.
- `trigger_type`.
- `condition_json`.
- `reward_json`.
- `enabled`.
- `version`.

### `quests`
- `id`.
- `tenant_id`.
- `name`.
- `description`.
- `quest_type`.
- `condition_json`.
- `reward_json`.
- `starts_at`, nullable.
- `ends_at`, nullable.
- `enabled`.

### `quest_progress`
- `id`.
- `tenant_id`.
- `quest_id`.
- `user_id` or team reference.
- `progress_json`.
- `status`.
- `started_at`.
- `completed_at`, nullable.

### `achievements`
- `id`.
- `tenant_id`.
- `code`.
- `name`.
- `description`.
- `criteria_json`.
- `enabled`.

### `user_achievements`
- `id`.
- `tenant_id`.
- `user_id`.
- `achievement_id`.
- `earned_at`.

Unique constraint: `(tenant_id, user_id, achievement_id)` for non-repeatable achievements.

### `xp_ledger`
- `id`.
- `tenant_id`.
- `user_id`.
- `event_id`.
- `reason_code`.
- `points`.
- `created_at`.

Use an append-only ledger for reward history. Prevent duplicate reward grants using a unique idempotency key or event identity.

Do not treat a mutable client-side XP value as authoritative.

### `outbox_events`
- `id`.
- `tenant_id`.
- `event_type`.
- `payload_json`.
- `created_at`.
- `processed_at`, nullable.
- `attempt_count`.

Use an outbox only where durable asynchronous event processing is needed.

## 7.4 Data model rules

- Every tenant-owned record includes `tenant_id`.
- Use foreign keys and unique constraints.
- Use composite tenant-aware foreign keys where appropriate to prevent references across organisations.
- Use UUID identifiers where suitable.
- Store timestamps in UTC.
- Store office timezones as IANA timezone names.
- Use migrations for every schema change.
- Define indexes for common access patterns.
- Avoid deleting historical records in ways that violate foreign keys.
- Apply retention and deletion policies to occupancy history, audit events and game history.
- Do not collect precise location data from mobile devices.

---

# 8. Occupancy Rules and Concurrency

## 8.1 Default policy

- A workstation can have at most one active occupant.
- An employee can have at most one active workstation session within the configured scope.
- Repeated check-in to the same workstation is idempotent.
- A conflicting check-in returns HTTP `409 Conflict`.
- A workstation marked unavailable cannot be occupied.
- An administrator can release an occupancy session with an audit record.
- Expired sessions are released by a scheduled job or equivalent reliable mechanism.
- Expiry does not silently erase historical records before the configured retention period.

## 8.2 Transaction requirements

Implement occupancy changes with database transactions and suitable locking or uniqueness constraints.

Never use the following pattern as the sole concurrency control:

1. Query whether the desk is free.
2. Return to the application.
3. Insert a new session without a database constraint.

Two simultaneous requests can both observe an available workstation.

The database must be the final authority on exclusive occupancy.

## 8.3 Check-in idempotency

Accept an idempotency key on mutation requests where appropriate.

A retry after a network failure must not:
- Create duplicate occupancy sessions.
- Award duplicate XP.
- Create duplicate achievements.
- Trigger duplicate notifications.

Store and validate idempotency keys according to a documented scope and retention period.

---

# 9. Gamification Engine

## 9.1 Enable/disable behaviour

Gamification must be optional per tenant.

When disabled:
- Occupancy still works.
- The office map still works.
- NFC and QR check-in still work.
- Core audit and security events remain active.
- No XP, quests, badges or game rewards are generated.
- Game-related UI is hidden or clearly marked disabled.
- Existing game history is retained or deleted according to tenant policy, not automatically erased.

Do not confuse disabling gamification with disabling operational auditing.

## 9.2 Initial game events

Use a documented event catalogue, for example:

- `workstation.checked_in`
- `workstation.checked_out`
- `zone.discovered`
- `quest.started`
- `quest.completed`
- `achievement.earned`
- `team.challenge.completed`

Events must be validated and generated by trusted server-side services.

## 9.3 Initial rewards

Illustrative defaults:

| Action | Reward |
|---|---:|
| First successful check-in of the day | 20 XP |
| Discover a new zone | 15 XP |
| Complete a daily quest | 10–30 XP |
| Complete a verified team activity | 50 XP |
| Complete a weekly team challenge | 100 XP |

These are sample rules, not fixed business requirements.

Rules must support:
- Daily caps.
- Unique-event limits.
- Repeatable and non-repeatable quests.
- Time windows.
- Tenant-configurable reward values.
- Rule versioning.
- Idempotent reward processing.
- Auditability.

Do not reward hours spent at a desk, continuous presence or raw scan volume. Avoid mechanics that encourage unnecessary office attendance.

## 9.4 Rule execution

Store rule configuration as validated JSON.

Do not execute arbitrary JavaScript from database configuration.

Implement a small declarative evaluator that supports a known set of conditions:
- Event type.
- Number of unique zones visited.
- Number of eligible completed activities.
- Date window.
- Daily or weekly limit.
- Team milestone.

Reject unknown operators and unsupported expression structures.

## 9.5 Game configuration example

```json
{
  "enabled": true,
  "rules": [
    {
      "code": "first-check-in",
      "trigger": "workstation.checked_in",
      "condition": {
        "firstCheckInOfDay": true
      },
      "reward": {
        "xp": 20
      },
      "dailyLimit": 1
    }
  ]
}
```

This is a proposed configuration format. Implement a JSON Schema or equivalent runtime validation before accepting saved rules.

## 9.6 Future extension interfaces

Possible extension points:
- `onCheckIn`
- `onCheckOut`
- `onZoneDiscovered`
- `onQuestCompleted`
- `onAchievementEarned`
- `onTeamMilestone`

For MVP, implement internal interfaces rather than a third-party plugin marketplace.

Future plugins should have:
- Explicit permissions.
- Versioned APIs.
- Defined input and output schemas.
- Execution limits.
- Failure isolation.
- Documented upgrade and compatibility rules.

---

# 10. API Design

Use REST over HTTPS, versioned under `/api/v1`.

Return JSON responses and consistent error objects.

All protected routes must authenticate the user, resolve tenant membership and enforce resource-level permissions.

## 10.1 Response conventions

Success:

```json
{
  "data": {},
  "meta": {
    "requestId": "request-uuid"
  }
}
```

Error:

```json
{
  "error": {
    "code": "WORKSTATION_OCCUPIED",
    "message": "This workstation is no longer available.",
    "requestId": "request-uuid"
  }
}
```

Do not return internal stack traces, SQL details or secrets.

## 10.2 Identity and organisation

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/me` | Current authenticated user |
| GET | `/api/v1/organisations` | Organisations accessible to the user |
| POST | `/api/v1/organisations` | Create an organisation |
| GET | `/api/v1/organisations/:tenantId` | Get organisation settings |
| PATCH | `/api/v1/organisations/:tenantId` | Update permitted settings |
| GET | `/api/v1/organisations/:tenantId/members` | List members |
| POST | `/api/v1/organisations/:tenantId/invitations` | Invite a member |
| PATCH | `/api/v1/organisations/:tenantId/members/:id` | Update a membership |
| DELETE | `/api/v1/organisations/:tenantId/members/:id` | Revoke a membership |

The tenant ID in a URL is a resource selector, not proof of authorisation.

## 10.3 Offices and layouts

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/offices` | List accessible offices |
| POST | `/api/v1/offices` | Create an office |
| GET | `/api/v1/offices/:officeId` | Get office details |
| PATCH | `/api/v1/offices/:officeId` | Update office details |
| GET | `/api/v1/offices/:officeId/floors` | List floors |
| POST | `/api/v1/offices/:officeId/floors` | Create a floor |
| GET | `/api/v1/floors/:floorId/layout` | Retrieve the current layout |
| PUT | `/api/v1/floors/:floorId/layout` | Save a validated layout |
| GET | `/api/v1/floors/:floorId/zones` | List zones |
| POST | `/api/v1/floors/:floorId/zones` | Create a zone |
| GET | `/api/v1/floors/:floorId/workstations` | List workstations |

Support pagination for potentially large lists.

## 10.4 Workstations and occupancy

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/workstations` | Create a workstation |
| GET | `/api/v1/workstations/:id` | Get workstation details |
| PATCH | `/api/v1/workstations/:id` | Update workstation configuration |
| GET | `/api/v1/workstations/availability` | Query availability |
| POST | `/api/v1/check-ins` | Check in using a workstation tag |
| POST | `/api/v1/check-outs` | Check out of the active workstation |
| GET | `/api/v1/me/occupancy` | Get current user's active session |
| GET | `/api/v1/offices/:id/occupancy` | Get permitted office occupancy |
| POST | `/api/v1/admin/occupancy/:id/release` | Administrator releases a session |

A check-in request may look like:

```json
{
  "tagId": "opaque-public-tag-id"
}
```

Do not accept a client-supplied user ID as the identity of the employee performing the check-in. Derive the user from the authenticated session.

A successful response should return:
- Occupancy session ID.
- Workstation ID.
- Current occupancy state.
- Check-in timestamp.
- Any relevant status information.

Return `409 Conflict` if the workstation has been claimed by someone else.

## 10.5 NFC and QR tag administration

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/admin/tags` | Create or register a tag |
| GET | `/api/v1/admin/tags` | List tags |
| POST | `/api/v1/admin/tags/:id/revoke` | Revoke a tag |
| POST | `/api/v1/admin/tags/:id/replace` | Replace a tag |
| GET | `/api/v1/admin/tags/:id/qr` | Generate or retrieve a printable QR code |

Tag administration requires an appropriate role. Public tag resolution must not expose private workstation or employee information.

## 10.6 Gamification

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/game/settings` | Get permitted game settings |
| PATCH | `/api/v1/admin/game/settings` | Enable, disable or configure gamification |
| GET | `/api/v1/game/me` | Get personal game profile |
| GET | `/api/v1/game/me/achievements` | List personal achievements |
| GET | `/api/v1/game/me/quests` | List eligible quests |
| POST | `/api/v1/game/quests/:id/start` | Start a quest |
| GET | `/api/v1/game/quests/:id/progress` | Get quest progress |
| GET | `/api/v1/admin/game/rules` | List game rules |
| POST | `/api/v1/admin/game/rules` | Create a rule |
| PATCH | `/api/v1/admin/game/rules/:id` | Update a rule |
| GET | `/api/v1/game/events` | Get permitted game history |

The client must not directly award XP or mark achievements as earned.

## 10.7 Realtime updates

Provide an SSE endpoint such as:

`GET /api/v1/offices/:officeId/events`

Events may include:
- `occupancy.updated`
- `workstation.updated`
- `layout.updated`
- `game.rewarded`

Requirements:
- Authenticate the connection.
- Verify office and tenant permissions.
- Filter events by authorised scope.
- Revalidate access when necessary.
- Avoid publishing employee personal data in broadcast events.
- Support reconnecting and refreshing from an authoritative API response.

## 10.8 API documentation

- Generate OpenAPI documentation.
- Validate requests and responses.
- Document authentication requirements.
- Document role permissions.
- Document status codes.
- Include example requests and responses.
- Add contract tests for critical endpoints.
- Keep the API version stable within a release series.

---

# 11. Authentication and Authorisation

## 11.1 Initial authentication

For a self-hosted MVP, use a secure authentication approach with:
- Server-side sessions.
- Secure, HttpOnly cookies.
- Appropriate SameSite settings.
- CSRF protection for cookie-authenticated mutations.
- Login rate limits.
- Secure password hashing if local passwords are supported.
- Password reset flow, if applicable.
- Session revocation.
- No credentials in local storage.

Use a mature authentication library rather than implementing cryptography or password handling from scratch.

For hosted SaaS, add an established identity provider or OIDC-compatible integration. Keep the application identity model separate from the authentication provider.

## 11.2 Roles

Initial tenant roles:

- `owner`
- `admin`
- `game_admin`
- `employee`

A user may have a different role in different organisations.

Example permissions:

| Capability | Employee | Game admin | Admin | Owner |
|---|---:|---:|---:|---:|
| View permitted office map | Yes | Yes | Yes | Yes |
| Check in/out | Yes | Yes | Yes | Yes |
| View own game profile | If enabled | If enabled | If enabled | If enabled |
| Configure game rules | No | Yes | Optional | Yes |
| Manage workstations | No | No | Yes | Yes |
| Manage members | No | No | Yes | Yes |
| Delete organisation | No | No | No | Yes |

The exact permission matrix should be enforced on the backend, not merely hidden in the frontend.

---

# 12. Security and Privacy Requirements

## 12.1 Tenant isolation

- Every tenant-owned resource must be authorised against the active tenant.
- Enforce tenant boundaries in application services and database access.
- Use PostgreSQL Row-Level Security where appropriate.
- Use a restricted runtime database role.
- Separate migration and administrative roles.
- Never allow client-supplied tenant IDs to override authenticated membership.
- Test cross-tenant access attempts for every major resource type.
- Prevent cross-tenant references through foreign-key and validation rules.

## 12.2 Web security

- Require HTTPS in production.
- Validate all incoming data.
- Use parameterised database queries.
- Apply CSRF protection where needed.
- Escape untrusted output.
- Use a restrictive Content Security Policy.
- Apply security headers.
- Rate-limit login, check-in and tag-resolution endpoints.
- Protect against insecure direct object references.
- Avoid unsafe dynamic code execution.
- Keep dependencies patched.
- Scan dependencies and container images.
- Never commit secrets.

## 12.3 Privacy

Collect only the information needed for the service.

Requirements:
- Publish a clear privacy notice.
- Explain the purpose of occupancy records.
- Limit employee-level visibility.
- Do not expose individual occupancy histories through public leaderboards.
- Make game participation optional.
- Allow employees to view relevant personal records.
- Define configurable retention periods.
- Support account and personal-data deletion where appropriate.
- Keep operational audit data distinct from gamification history.
- Avoid tracking employees outside explicit application interactions.
- Do not infer productivity or performance from occupancy.

Retention defaults must be documented and configurable. Expired occupancy should release a workstation without necessarily deleting its historical record.

## 12.4 Auditability

Record sensitive administrative operations, such as:
- Role changes.
- Membership removal.
- Tag revocation.
- Workstation releases by administrators.
- Retention configuration changes.
- Gamification configuration changes.
- Data export or deletion operations.

Do not record passwords, session cookies, access tokens or unnecessary personal data.

## 12.5 Security verification

Use OWASP Application Security Verification Standard (ASVS) as a structured checklist for security requirements and testing. Target an appropriate baseline for the application and strengthen it before production SaaS launch.

Reference: https://owasp.org/www-project-application-security-verification-standard/

Before a public SaaS launch, perform a threat model and review authentication, authorisation, tenant isolation, session handling, data retention, backup access and administrative privileges.

---

# 13. Open-Source Licensing and Governance

## 13.1 Recommended initial licence

Evaluate **Apache License 2.0** for the application source code.

Reasons:
- Permissive reuse.
- Commercial use is permitted subject to licence terms.
- Explicit patent-grant provisions.
- Suitable for organisations that may integrate the project into their own systems.

MIT is also a reasonable permissive option if a shorter and simpler licence is preferred.

Review the trade-offs before selecting one. This is a project recommendation, not legal advice.

References:
- https://www.apache.org/licenses/LICENSE-2.0
- https://www.apache.org/foundation/license-faq

## 13.2 Separate software and asset licensing

Do not assume that the code licence automatically covers every asset.

Review and document licences for:
- Mascot artwork.
- SVG illustrations.
- Fonts.
- Sounds.
- Animations.
- Icons.
- Third-party templates.
- Dependencies.
- Documentation images.

Prefer original artwork or assets with clearly documented redistribution rights.

Keep a dependency and asset attribution inventory. Include required licence texts and notices.

## 13.3 Repository governance

Create:
- `LICENSE`
- `NOTICE`, if needed
- `README.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `CHANGELOG.md`
- Issue templates
- Pull request template
- Architecture decision records
- Dependency and licence review workflow

Do not use company logos, proprietary mascots or company-specific assets as default branding without explicit permission.

## 13.4 SaaS and open-source relationship

The hosted SaaS should initially use the same licensed core as the self-hosted version.

Possible future revenue streams:
- Managed hosting.
- Enterprise support.
- Deployment assistance.
- Custom integrations.
- Premium support agreements.

Do not make core desk check-in dependent on a paid service.

If premium features are considered later, document which features are open source and which are separately distributed before building them.

---

# 14. Repository Structure

Use a monorepo initially.

```text
deskquest/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/
│   │   │   │   ├── auth/
│   │   │   │   ├── office-map/
│   │   │   │   ├── workstations/
│   │   │   │   ├── occupancy/
│   │   │   │   ├── admin/
│   │   │   │   ├── game/
│   │   │   │   └── shared/
│   │   │   └── assets/
│   │   └── project.json
│   │
│   └── api/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── tenants/
│       │   │   ├── memberships/
│       │   │   ├── offices/
│       │   │   ├── layouts/
│       │   │   ├── workstations/
│       │   │   ├── occupancy/
│       │   │   ├── tags/
│       │   │   ├── gamification/
│       │   │   ├── audit/
│       │   │   └── health/
│       │   ├── plugins/
│       │   ├── infrastructure/
│       │   ├── config/
│       │   └── main.ts
│       └── project.json
│
├── packages/
│   ├── api-client/
│   ├── api-contracts/
│   ├── validation/
│   ├── ui/
│   ├── isometric-map/
│   ├── game-engine/
│   ├── theme-sdk/
│   └── test-utils/
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── test-fixtures/
│
├── assets/
│   ├── office/
│   └── mascot/
│
├── deployment/
│   ├── docker/
│   ├── compose/
│   └── reverse-proxy/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── deployment/
│   ├── security/
│   ├── privacy/
│   ├── gamification/
│   └── development/
│
├── tests/
│   ├── integration/
│   ├── e2e/
│   ├── tenant-isolation/
│   └── performance/
│
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
│
├── docker-compose.yml
├── .env.example
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── LICENSE
├── NOTICE
└── package.json
```

This is the intended logical structure. The coding agent may adapt framework-specific files, but it must preserve clear domain boundaries.

Do not create empty packages merely to match the tree. Introduce packages when there is actual shared functionality.

---

# 15. Environment and Configuration

Use environment variables for deployment-specific settings.

Example `.env.example`:

```dotenv
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://app:change-me@localhost:5432/deskquest
SESSION_SECRET=replace-with-a-random-secret

PUBLIC_BASE_URL=http://localhost:4200
API_BASE_URL=http://localhost:3000

GAMIFICATION_ENABLED=false

LOG_LEVEL=info
```

These are placeholders, not production credentials.

Requirements:
- Validate configuration at startup.
- Fail fast on missing required settings.
- Never use example secrets in production.
- Keep `.env` files out of version control.
- Document which settings are required, optional or deployment-specific.
- Avoid storing tenant-specific business settings in environment variables.
- Store tenant-specific configuration in the database with validation.

---

# 16. Testing Strategy

## 16.1 Unit tests

Test:
- Tenant resolution.
- Permission checks.
- Occupancy policy.
- Check-in idempotency.
- Reward calculation.
- Quest conditions.
- Achievement evaluation.
- Layout validation.
- Tag revocation.
- Retention logic.

## 16.2 Integration tests

Use a real PostgreSQL test database or an equivalent reliable test environment.

Test:
- Database migrations.
- Foreign-key integrity.
- Exclusive occupancy.
- Concurrent check-ins.
- Transaction rollback.
- Outbox retries.
- Duplicate event delivery.
- Tenant isolation.
- Role-based access control.

## 16.3 End-to-end tests

Cover these workflows:
1. Create an organisation.
2. Create an office and floor.
3. Add workstations.
4. Place workstations on the isometric map.
5. Generate and resolve a QR tag.
6. Check in as an employee.
7. Verify the workstation changes to occupied.
8. Check out and verify availability.
9. Enable gamification and verify one eligible reward.
10. Disable gamification and verify that occupancy still works.
11. Attempt to access another tenant's data and verify denial.

## 16.4 Concurrency test

Simulate two authenticated users checking into the same exclusive workstation simultaneously.

Expected result:
- At most one active occupancy session.
- One successful check-in.
- One clear conflict response.
- No duplicate XP from retries.
- Database state remains consistent.

## 16.5 Security tests

Include:
- Cross-tenant read and write attempts.
- Insecure object reference attempts.
- Session expiry and revocation.
- CSRF tests where relevant.
- Invalid and revoked tag IDs.
- Rate-limit tests.
- Malformed configuration.
- Unauthorised game reward requests.
- Sensitive data leakage in logs.
- Backup and restore tests.

---

# 17. CI/CD and Quality Gates

Every pull request must run:

1. Formatting and linting.
2. Type checking.
3. Unit tests.
4. API and schema validation.
5. Database migration checks.
6. Integration tests.
7. Tenant-isolation tests.
8. Frontend production build.
9. Backend production build.
10. Dependency and secret scanning.

Before a tagged release:
- Build reproducible application images where practical.
- Verify migration compatibility.
- Generate release notes.
- Check third-party licence compliance.
- Test Docker deployment from a clean environment.
- Verify backup and restore procedures.
- Publish a versioned release with upgrade instructions.

Never merge code that weakens tenant isolation merely to make a test pass.

---

# 18. Phased Implementation Plan

## Phase 0 — Foundation

Deliverables:
- Monorepo.
- Angular application.
- Node.js API.
- PostgreSQL.
- Docker Compose.
- Environment validation.
- Database migrations.
- Seed data.
- Health endpoints.
- CI pipeline.
- Basic documentation.

Acceptance criteria:
- A new developer can clone the repository and follow the setup instructions.
- The application starts from a clean local environment.
- Database migrations run successfully.
- Health endpoints report dependency failures appropriately.
- No production secrets are committed.

## Phase 1 — Workplace management

Deliverables:
- Authentication.
- Organisation and membership model.
- Office, floor, zone and workstation CRUD.
- Basic isometric office map.
- Workstation status.
- Accessible workstation list.
- Basic administrator interface.

Acceptance criteria:
- An administrator can create an office without editing source code.
- Workstations can be placed on a map.
- Workstation status is consistent between map and list views.
- Unauthorised users cannot access protected resources.
- Layout changes persist across application restarts.

## Phase 2 — NFC and occupancy

Deliverables:
- Tag management.
- QR generation.
- NFC URL resolution.
- Check-in and check-out.
- Occupancy expiry.
- Concurrency-safe database constraints.
- Occupancy events.
- Real-time status updates.

Acceptance criteria:
- A valid authenticated employee can check into an available workstation.
- A conflicting check-in returns a clear error.
- Repeated requests do not create duplicate sessions.
- Revoked tags cannot initiate check-in.
- Expired occupancy is released reliably.
- A QR fallback works without NFC hardware.

## Phase 3 — Gamification

Deliverables:
- Tenant-level enable/disable switch.
- XP ledger.
- Rule configuration and validation.
- Basic achievements.
- Quest progress.
- Reward idempotency.
- Basic mascot and animation.
- Game settings interface.

Acceptance criteria:
- Gamification can be disabled without breaking occupancy.
- Clients cannot award themselves XP.
- A duplicate event cannot grant duplicate rewards.
- Unknown or invalid rules are rejected.
- A reward processor failure does not corrupt occupancy.
- Game participation is optional.

## Phase 4 — Open-source readiness

Deliverables:
- Public README and architecture guide.
- Contribution guide and code of conduct.
- Security reporting process.
- Licence and attribution inventory.
- Docker quick start.
- Example office and seed data.
- API documentation.
- Deployment and backup guide.
- Demo screenshots or a synthetic-data demo.

Acceptance criteria:
- A contributor unfamiliar with the codebase can run the project.
- A company can configure a new office without source changes.
- A self-hosted installation works without proprietary external services.
- The security and tenant-isolation test suite passes.
- Third-party assets and dependencies have documented licences.

## Phase 5 — Pilot and refinement

Deliverables:
- Small-office pilot.
- Usability feedback.
- Performance measurements.
- Improved office editor.
- Privacy and retention settings.
- Error reporting and service metrics.
- Installation friction fixes.

Acceptance criteria:
- Pilot users can check in without developer assistance.
- Administrators can correct a layout or replace a tag.
- Occupancy conflicts are understandable.
- Users can disable gamification.
- Operational data is retained according to documented policies.
- Installation and upgrade instructions have been validated.

## Phase 6 — Managed SaaS

Deliverables:
- Tenant provisioning.
- Hosted authentication integration.
- SaaS operations dashboard.
- Tenant isolation hardening.
- Backup and disaster recovery.
- Service monitoring and alerting.
- Resource limits.
- Account lifecycle and deletion workflows.
- Billing only if a commercial model is adopted.

Acceptance criteria:
- Automated tests verify isolation between tenants.
- Tenant context cannot be supplied or overridden by an unauthorised client.
- Platform administration is separated from tenant administration.
- Backups can be restored.
- Incident response and data deletion processes are documented.
- Security review is completed before production launch.

---

# 19. MVP Definition of Done

The MVP is complete when all of the following are true:

- [ ] A developer can start the application using the documented setup.
- [ ] The application supports organisation-scoped data.
- [ ] An administrator can configure an office, floor, zone and workstation.
- [ ] Workstations appear on an interactive isometric map.
- [ ] Employees can view workstation availability.
- [ ] Employees can check in using NFC or QR.
- [ ] Employees can check out.
- [ ] Exclusive workstation occupancy is concurrency-safe.
- [ ] Expired sessions are released.
- [ ] Gamification can be enabled or disabled per organisation.
- [ ] XP and achievements are generated only by trusted server-side logic.
- [ ] Duplicate events cannot grant duplicate rewards.
- [ ] Tenant-isolation tests pass.
- [ ] Core functionality does not require a paid external API.
- [ ] Self-hosted deployment and database backup are documented.
- [ ] Licence and asset attribution are complete.
- [ ] Core workflows are covered by automated tests.
- [ ] An administrator can configure the platform without modifying application source code.

---

# 20. Instructions to the Coding Agent

Treat this document as the initial product specification and implementation contract.

## Working rules

1. Inspect the existing repository before creating or changing files.
2. If a repository already exists, preserve working code and document deviations.
3. If the repository is empty, establish the monorepo foundation first.
4. Implement one phase at a time.
5. Do not attempt to build the complete platform in a single change.
6. Prefer simple, typed, testable implementations.
7. Keep modules small and domain boundaries explicit.
8. Use database migrations for schema changes.
9. Use server-side validation for all external input.
10. Never trust client-supplied user identity or tenant identity.
11. Write tests alongside each feature.
12. Do not hardcode a company, office, floor, workstation, mascot or XP rule.
13. Keep gamification optional and independent of occupancy correctness.
14. Do not add AI or microservices unless a specific requirement justifies them.
15. Document any deviation from this specification.
16. Never claim a feature is complete until its tests and acceptance criteria pass.

## Required workflow for each phase

For each phase:

1. Summarise the intended changes.
2. Inspect relevant existing files.
3. Identify the database and API changes.
4. Implement the smallest working vertical slice.
5. Add unit and integration tests.
6. Run linting, type checking and builds.
7. Run relevant end-to-end and security tests.
8. Report what passed and what failed.
9. Update the documentation.
10. Commit changes only when explicitly authorised.

## First implementation task

Start with **Phase 0 only**.

Create:
- Repository structure.
- Angular frontend.
- Node.js TypeScript API.
- PostgreSQL connection.
- Database migration framework.
- Docker Compose configuration.
- Configuration validation.
- Health endpoints.
- Basic CI.
- README with exact local setup instructions.

Do not implement occupancy, NFC, quests or gamification during Phase 0.

Once Phase 0 runs reliably from a clean environment, report the resulting architecture, commands, files created, tests executed and any outstanding issues. Then proceed to Phase 1.

---

# 21. Reference Documentation

Use official documentation when selecting and implementing dependencies:

- Angular components: https://angular.dev/guide/components
- PostgreSQL row security: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- OWASP Application Security Verification Standard: https://owasp.org/www-project-application-security-verification-standard/
- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
- Apache licensing FAQ: https://www.apache.org/foundation/license-faq

Verify current supported versions and dependency licences when implementation begins.

---

## Final product direction

Build a practical, open-source workplace application first. Make the isometric map its visual identity, NFC/QR its low-friction interaction mechanism, and gamification its distinctive optional layer.

The platform should be easy for a small office to self-host, straightforward for developers to extend, and architected carefully enough that a managed multi-tenant SaaS offering can grow from the same codebase.

**First milestone: a working, self-hosted office map with reliable workstation occupancy. Everything else builds on that foundation.**
