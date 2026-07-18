# UDK Platform Design Specification

**Date:** 2026-07-18  
**Status:** Approved for planning  
**Reference platform:** `pglemos/p1academy`  
**Target repository:** `pglemos/udk`

## 1. Product vision

UDK is a multi-championship karting platform with the Ultras do Kart championship as the default branded experience. It combines public content, registrations, sporting operations, result ingestion, standings, disciplinary governance, Endurance team operations, sponsor activation, auditability and offline track-side workflows.

The platform must not overwrite or mutate the P1 Academy product. P1 Academy is a technical reference for stack and patterns only.

## 2. Delivery strategy

The approved strategy is controlled modular rollout:

1. Foundation and core operations.
2. Results, standings and sporting governance.
3. Endurance and track-side offline workflows.
4. Public CMS, sponsors and advanced analytics.

Every phase must produce deployable, testable software. A full-platform big-bang release is explicitly rejected.

## 3. Architecture

```text
apps/
  web-publico/
  plataforma/
packages/
  ui/
  database/
  auth/
  permissions/
  scoring-engine/
  results-importer/
  notifications/
  cms/
  payments/
  audit/
  analytics/
  endurance/
  disciplinary/
  offline-sync/
```

### 3.1 Public application

`apps/web-publico` exposes only published or explicitly provisional information:

- home page and institutional pages;
- calendar and registration calls to action;
- standings and results;
- public driver and team profiles;
- regulations, decisions and news;
- galleries and sponsor activations;
- SEO and social previews.

### 3.2 Authenticated platform

`apps/plataforma` serves all authenticated roles:

- driver;
- legal guardian;
- organization;
- global administrator;
- judging committee;
- track marshal;
- finance;
- sponsor;
- content editor.

A single user account may hold multiple roles. Navigation and server-side authorization are derived from the active role and scope.

## 4. Technology baseline

Use the P1 Academy baseline unless a later architecture decision records a deliberate change:

- Next.js 16.0.10 or newer compatible release;
- React 19.2.3;
- TypeScript 5.9.3;
- Supabase JavaScript 2.108.2;
- Framer Motion 12.23.26;
- Lucide React 0.555.0;
- Puppeteer Core 25.0.4 with Sparticuz Chromium 148.0.0;
- PostgreSQL through Supabase;
- row-level security for tenant and role isolation.

The monorepo uses pnpm workspaces and Turborepo. Package versions are pinned through the root workspace.

## 5. Multi-championship model

A championship contains seasons. A season contains categories, regulation versions, scoring rules, stages and sessions.

```text
Championship
└── Season
    ├── Categories
    ├── Regulation versions
    ├── Scoring versions
    └── Stages
        └── Sessions
```

UDK is the primary/default championship. Per-championship branding is limited to name, logos, colors, icon, cover, social image, description and sponsors. The design system and interaction model remain centralized.

## 6. Roles and permissions

Authorization is computed from:

```text
user + role + championship + season + category + stage + session + module + action + validity period
```

Actions include view, create, edit, approve, publish, cancel, export, restore and grant permissions. All authorization is enforced in UI, server actions, APIs, database RLS and storage policies.

Track marshal access may be restricted by event and time window and expires automatically after the event.

## 7. UDK season model

Initial categories:

- Ultras Insanos;
- Ultras Rápidos.

Initial calendar baseline:

| Date | Time | Format | Track |
|---|---:|---|---|
| 18/08/2026 | 21:00 | Endurance | Track 01 inverted with chicane |
| 08/09/2026 | 21:00 | Regular | Track 02 normal/inverted |
| 13/10/2026 | 21:00 | Regular | Track 05 normal/inverted |
| 10/11/2026 | 21:00 | Regular | Track 11 normal/inverted |
| 12/12/2026 | 11:00 | Endurance | Track 01 normal |

The current regulation contains a contradiction between eight regular races and the visible calendar. The data model must support eight regular races, six counting results and two discards, but final homologation must remain blocked until the official regulation or addendum resolves the contradiction.

Tie-break criteria are never rearranged in an admin UI. They come exclusively from the applicable regulation version. Missing criteria block final standings homologation.

## 8. Drivers, guardians and documents

A driver profile stores private identity data separately from public sporting data.

Required documents for every championship:

- identity document with photo;
- profile photo;
- responsibility term;
- confirmed registration data;
- regulation acceptance;
- platform policy acceptance;
- season image authorization.

Document states:

```text
Not sent → Sent → Under review → Approved / Rejected / Correction requested → Replaced → Archived
```

Minors require an approved guardian account, guardian documents, signed authorization and a mandatory registration link. One guardian may manage multiple minors.

Image authorization is mandatory for participation, valid for the full season and renewed each season. It covers site, social media, transmissions, institutional material, result publication and sponsor campaigns.

## 9. Registrations and categories

Season and event registrations are separate entities.

Initial commercial values:

- season registration: R$ 400.00;
- regular stage: R$ 260.00;
- Endurance: R$ 370.00.

The driver requests Ultras Insanos, Ultras Rápidos or no preference. The organization approves or changes the category before registration homologation. Requested category, approved category, reason, responsible user and timestamp are preserved.

Mid-season category changes may preserve, zero, transfer, convert or archive prior points. Every change requires simulation, approval, effective stage, recalculation and audit.

## 10. Payments and credits

Phase one uses manual PIX validation:

```text
Charge created → Awaiting payment → Receipt sent → Under review → Approved / Rejected / Correction requested
```

Sporting and financial approvals are independent and both are required for homologation.

Credits have origin, amount, validity, restrictions, reservation and immutable ledger history. Default rule is personal and non-transferable. Audited exceptions may transfer credit to another driver or between minors under the same guardian.

Cancellation and refund policies are configurable by championship and event. Refunds are manual PIX operations with proof and full history.

## 11. Result ingestion

Primary source is Sisecom MYLAPS LapTime email delivery. Supported entry paths:

- direct official inbox;
- manual forward;
- manual PDF upload.

Expected reports:

- `TimingOfficialReport.pdf`;
- `LapToLapReport.pdf`.

The importer stores original email and files, detects duplicates, classifies reports, extracts structured data, pairs sessions, normalizes names, matches registered drivers and creates a draft.

Official reports may truncate names. Matching therefore combines normalized name, kart number, position, lap count, best lap, session timing and registered participants. Low-confidence matches require human confirmation.

Result states:

```text
Received → Processing → Imported → Draft → Analysis → Provisional → Homologated → Published
```

Rectification creates a new version. Previous versions remain accessible according to permission.

## 12. Scoring and standings

The scoring engine is isolated from UI code. It processes:

- position points;
- Super Pole;
- Endurance;
- bonuses;
- penalties;
- discards;
- category changes;
- regulation-defined tie-breaks.

Regular, Super Pole and Endurance rules are independently versioned. Admin users may start from predefined templates and customize point tables, but tie-break order remains regulation-controlled.

The public standings experience includes:

- Ultras Insanos and Ultras Rápidos tabs;
- Summary and Detailed views;
- fixed headers and driver column;
- search, filters and comparison;
- provisional/official state;
- version history;
- responsive drawer and result detail modal;
- exports and shareable links.

## 13. Penalties, evidence and appeals

Occurrence flow:

```text
Occurrence → Triage → Analysis → Penalty or archive → Provisional result → Protest/appeal → Judgment → Final decision
```

Penalty effect may be immediate, provisional, suspended or automatic after a deadline. Severe penalties may be exclusive to the judging committee.

Evidence requirements are configurable by infraction and may include photo, video, written report, witness, document, time, lap and regulation clause. Evidence access can hide witness identity, sensitive images and internal documents while preserving the driver’s right to see material directly used against them, except protected portions with recorded justification.

Default protest/appeal deadline is 30 minutes after provisional publication. The deadline is configurable by championship and session. Reopening requires a reason and audit record. There is no appeal fee.

Judging committee initial members:

- Christian Peticov;
- Jadilson Melo;
- Guilherme Figueiredo.

## 14. Endurance

An Endurance event configures:

- minimum and maximum drivers;
- titulars and reserves;
- season-fixed or event-specific teams;
- mixed category permission;
- substitution deadlines;
- mandatory stops and stint limits;
- team and individual scoring;
- driver eligibility thresholds.

Team flow:

```text
Team created → Invitations → Acceptance → Documents and payment → Organization homologation
```

Stint flow:

```text
Planned → Requested → Awaiting confirmation → Confirmed → In progress → Closed
```

The team may request a change. A track marshal or organization user confirms the official record.

Endurance awards both team-championship points and individual points to eligible drivers. Eligibility is configurable by time, laps, percentage, stints and reserve rules. Default behavior requires minimum participation.

## 15. Offline PWA

Track-side operations must work offline for check-in, swaps, stints, incidents and evidence notes.

The client caches event, team, driver, kart, rule and permission data. Offline events are stored in an encrypted local queue with unique ID, device ID, user, local timestamp, sequence number and sync state.

Conflict policy: latest valid record wins the current state, while the prior version remains in audit. Ordering uses local timestamp, device sequence, server receive time, clock offset and logical event relationships. Clock tolerance is configurable.

No physical deletion occurs through conflict resolution.

## 16. Public portal and CMS

The public portal includes:

- home, championship, calendar, standings, results, drivers, teams, news, gallery, regulations, sponsors and registration CTA;
- premium UDK visual identity based on the approved Figma prototype;
- full public driver profiles for adults and minors, while private identity, contact, finance and guardian data remain hidden;
- public team profiles and Endurance timelines;
- accessible, responsive and performant rendering.

The CMS uses structured premium blocks rather than arbitrary page builders. Blocks include hero, countdown, calendar, standings, results, drivers, teams, news, gallery, FAQ, regulations, sponsors, streaming, location, CTA and campaign placements.

Content states:

```text
Draft → Review → Adjustments → Approved → Scheduled → Published → Archived
```

Critical content such as regulations, results, standings, penalties, legal terms, payment-impacting changes and sponsor campaigns may require approval.

## 17. Sponsors and consent

Sponsors can manage only their contracted scope:

- campaigns;
- assets and approvals;
- coupons;
- metrics;
- reports;
- consented leads.

Campaign states:

```text
Draft → Approval → Adjustments → Approved → Scheduled → Published → Ended
```

Sponsors never receive the full driver database. Leads require explicit consent that identifies recipient, purpose and data fields.

## 18. Notifications

Channels in phase one:

- email;
- internal platform notifications.

Critical notices cannot be disabled. Optional reminders, editorial updates and sponsor promotions are configurable separately by channel.

## 19. Audit, security and privacy

Every critical event records user, role, action, entity, previous value, new value, reason, timestamp, IP, device, source and version.

Security requirements:

- server-side authorization on every mutation;
- Supabase RLS and storage policies;
- temporary private-file URLs;
- rate limiting and session controls;
- logical deletion for operational records;
- immutable financial, result, decision and audit history;
- restricted exports with justification and logging;
- minor-specific privacy controls.

## 20. Observability and resilience

Monitor application errors, latency, database health, storage, email delivery, importer jobs, queues, offline sync, publication and scheduled tasks.

Use durable asynchronous jobs for PDF processing, e-mail delivery, report generation, heavy recalculation, images and exports. Jobs are idempotent and retry-safe.

Environments:

- development;
- staging;
- production.

Backups must be automated and restoration must be tested periodically.

## 21. Testing strategy

Required layers:

- unit tests for scoring, permissions, deadlines, credits and state transitions;
- integration tests for Supabase, registrations, payments, importer, penalties, CMS and notifications;
- end-to-end tests for adult driver, minor with guardian, organization, Endurance and disciplinary journeys;
- visual regression for public and admin screens;
- accessibility, performance and security testing;
- anonymized real timing reports as importer regression fixtures.

## 22. Acceptance criteria

The first deployable release is accepted when:

1. Adult and minor driver accounts can be created and verified.
2. Documents, terms and image authorization can be approved.
3. Season and stage registration can be paid by PIX and homologated.
4. Organization users can create stages and sessions.
5. Timing PDFs can be imported, matched and reviewed.
6. Provisional and homologated results can be published with versions.
7. Points and discards calculate deterministically.
8. Standings and public profiles render on desktop and mobile.
9. Penalties can create a versioned rectification.
10. Role and scope isolation passes automated tests.
11. Audit records all critical changes.
12. Backups and restoration are verified.

## 23. Unresolved official inputs

The system must not invent these items:

- final UDK points table;
- official resolution of the eight-race versus visible-calendar contradiction;
- exact regulation tie-break sequence when absent from the current document.

The application supports configuration and versioning for these rules, but final homologation remains blocked until an official regulation or addendum provides them.
