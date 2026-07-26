# UDK Single-App Consolidation Design

Date: 2026-07-25
Status: Approved
Branch: `feat/complete-operational-modules`

## 1. Objective

Consolidate the UDK platform into one Next.js application, one Vercel project and one Supabase project.

The unified application will serve the public website, authentication flows and the authenticated operations panel from a single domain and codebase.

## 2. Chosen architecture

The surviving application is `apps/plataforma`.

The current public application in `apps/web-publico` will be migrated into `apps/plataforma` and then removed from the workspace.

This choice preserves the more complex and mature application, including authentication, PWA support, role-based navigation, CRUD modules, reports and offline synchronization.

## 3. Route model

### Public routes

- `/`: public home page
- `/classificacao`: public standings
- `/calendario`: public calendar
- `/resultados`: public results
- `/pilotos`: public drivers directory
- `/pilotos/[slug]`: public driver profile
- `/regulamento`: regulations
- `/noticias`: news
- `/patrocinadores`: sponsors
- `/inscricao`: registration entry flow

### Authentication routes

- `/login`: sign in and sign up
- `/recuperar-senha`: password recovery request
- `/nova-senha`: password update after recovery

### Protected routes

- `/painel`: authenticated dashboard
- `/painel/**`: operational modules filtered by active role and granular permission

### Health route

- `/api/health`: application and Supabase configuration status

## 4. Authentication and authorization

Public routes do not require a session.

The `/painel/**` route tree requires an authenticated Supabase session. Users without an active role fail closed and cannot access operational data.

The application will preserve:

- role expiration;
- championship and season scope;
- granular permissions by module and action;
- global administrator protection;
- recovery flow with password confirmation;
- RLS as the final authorization boundary.

Client-side visibility is not treated as an authorization mechanism. Every protected mutation remains subject to Supabase policies.

## 5. Supabase integration

The connected Supabase project is `UDK`, reference `gyhsirfwwsmugvirpwsi`.

All versioned migrations under `supabase/migrations/` will be applied to the remote project in order.

The deployment must create and validate:

- operational schema;
- public views;
- functions and triggers;
- RLS policies;
- storage buckets and scoped paths;
- seed data for the 2026 season;
- pgTAP security and integrity tests.

The application uses only the public project URL and public/anon key in browser code. The service role key must never be exposed to Vercel client bundles.

## 6. Vercel integration

The connected Vercel project is `udk` in the `ULTRAS` team.

Target settings:

- Root Directory: `apps/plataforma`
- Framework: Next.js
- Production Branch: `main`
- Node.js: 22.x
- one deployment for public and authenticated routes

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

The separate `NEXT_PUBLIC_PLATFORM_URL` variable is removed because public and protected surfaces share the same origin.

## 7. Code consolidation

Implementation will:

1. migrate public pages and public data access into `apps/plataforma`;
2. move the existing authentication screen from `/` to `/login`;
3. create separate public and protected layouts inside the same App Router tree;
4. centralize Supabase configuration and public data access;
5. preserve PWA behavior without caching authenticated HTML;
6. fix offline queue project identification without reading protected Supabase client properties;
7. remove `apps/web-publico` from the workspace;
8. update workspace, Turbo, CI, docs and Vercel configuration for one application;
9. remove obsolete cross-application URLs and deployment instructions.

## 8. Offline and PWA behavior

The service worker may cache public static assets and the public shell.

Authenticated HTML, API responses and user-specific Supabase data must not be cached as shared responses.

Offline mutations remain:

- encrypted with Web Crypto;
- scoped to the authenticated user;
- scoped to the configured Supabase project URL;
- idempotent for replay;
- isolated from other browser accounts.

The project URL is supplied by application configuration rather than accessing protected properties of `SupabaseClient`.

## 9. Error handling

The application must provide explicit states for:

- missing environment variables;
- unavailable Supabase connection;
- expired or missing session;
- authenticated user without active role;
- RLS rejection;
- upload failure and rollback;
- offline mutation queued for replay;
- public data unavailable, with controlled fallback content where appropriate.

The `/api/health` endpoint must not disclose secrets or privileged database information.

## 10. Testing and quality gates

The following gates are mandatory before merge:

### Application

- workspace verification;
- ESLint;
- TypeScript;
- unit tests;
- production build of the single application;
- route smoke tests for public, authentication and protected surfaces;
- `/api/health` verification.

### Database

- local Supabase start;
- full migration replay;
- seed execution;
- pgTAP tests;
- database lint;
- remote migration verification;
- security and performance advisor review.

### Deployment

- successful Vercel preview;
- successful production deployment after merge;
- public home page loads;
- login and recovery flows load;
- protected route rejects unauthenticated access;
- public standings and calendar read from Supabase;
- private uploads remain non-public and scoped.

## 11. Migration strategy

The existing PR #13 remains the implementation vehicle.

The consolidation is performed on `feat/complete-operational-modules` and validated before squash merge into `main`.

The remote Supabase project is currently empty, so migrations can be applied without reconciling production user data.

The existing failed Vercel deployment is treated as obsolete after the single-app refactor and a new preview is required.

## 12. Completion criteria

The work is complete only when:

- the repository contains one deployable Next.js app;
- `apps/web-publico` is removed;
- all public and protected routes exist under `apps/plataforma`;
- GitHub application and database CI are green;
- Supabase remote migrations are applied and verified;
- Vercel project settings target `apps/plataforma` with Node 22;
- preview and production deployments succeed;
- PR #13 is merged into `main`;
- production health and core flows are verified.
