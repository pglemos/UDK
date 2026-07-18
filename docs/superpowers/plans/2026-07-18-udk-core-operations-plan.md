# UDK Core Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver driver, guardian, document, term, registration, PIX, credit and check-in workflows.

**Architecture:** Domain tables are exposed through server-side services and audited state machines. Private files live in protected Supabase Storage buckets with short-lived signed URLs.

**Tech Stack:** Next.js server actions, Supabase PostgreSQL/Auth/Storage, Zod, Vitest, Playwright.

## Global Constraints

- Minor registrations require an approved guardian link.
- Image authorization is mandatory for homologation.
- Sporting and financial approvals are independent.
- Payment phase one is manual PIX validation.
- Financial and document records use logical deletion only.

---

### Task 1: Add driver and guardian schema

**Files:**
- Create: `supabase/migrations/202607180010_drivers_guardians.sql`
- Create: `packages/database/src/repositories/drivers.ts`
- Create: `packages/database/src/repositories/guardians.ts`
- Test: `packages/database/src/repositories/drivers.test.ts`

**Interfaces:**
- Produces: `drivers`, `guardian_links`, `emergency_contacts`, `public_driver_profiles`.

- [ ] Write failing repository tests for adult and minor profiles.
- [ ] Run `pnpm --filter @udk/database test drivers` and confirm failure.
- [ ] Implement schema, RLS and typed repositories.
- [ ] Reset the local database and rerun tests.
- [ ] Commit with `feat: add driver and guardian domain`.

### Task 2: Implement document review and protected storage

**Files:**
- Create: `supabase/migrations/202607180011_documents.sql`
- Create: `packages/database/src/repositories/documents.ts`
- Create: `apps/plataforma/app/(driver)/documents/page.tsx`
- Create: `apps/plataforma/app/(organization)/documents/review/page.tsx`
- Test: `packages/database/src/repositories/documents.test.ts`
- Test: `apps/plataforma/e2e/document-review.spec.ts`

**Interfaces:**
- Produces: `submitDocument`, `approveDocument`, `rejectDocument`, `requestCorrection`.

- [ ] Write state-transition tests and signed-URL access tests.
- [ ] Verify tests fail before implementation.
- [ ] Add private `driver-documents` bucket policies and versioned metadata rows.
- [ ] Implement driver upload and reviewer queue.
- [ ] Run unit and E2E tests.
- [ ] Commit with `feat: add document approval workflow`.

### Task 3: Implement versioned terms and acceptance

**Files:**
- Create: `supabase/migrations/202607180012_terms.sql`
- Create: `packages/database/src/repositories/terms.ts`
- Create: `apps/plataforma/app/(driver)/terms/[termId]/page.tsx`
- Test: `packages/database/src/repositories/terms.test.ts`

**Interfaces:**
- Produces: `publishTermVersion`, `acceptTermVersion`, `hasRequiredAcceptance`.

- [ ] Test exact-version acceptance, guardian signature and reacceptance after a new version.
- [ ] Implement immutable term versions and acceptance evidence fields.
- [ ] Verify with `pnpm --filter @udk/database test terms`.
- [ ] Commit with `feat: add versioned terms and image authorization`.

### Task 4: Implement season and stage registration state machines

**Files:**
- Create: `supabase/migrations/202607180013_registrations.sql`
- Create: `packages/database/src/repositories/registrations.ts`
- Create: `packages/database/src/state-machines/registration.ts`
- Create: `apps/plataforma/app/(driver)/registrations/page.tsx`
- Create: `apps/plataforma/app/(organization)/registrations/page.tsx`
- Test: `packages/database/src/state-machines/registration.test.ts`

**Interfaces:**
- Produces: `createSeasonRegistration`, `createStageRegistration`, `approveSporting`, `homologateRegistration`.

- [ ] Write tests covering missing documents, minor without guardian, duplicate stage registration and category approval.
- [ ] Implement tables, unique constraints and transitions.
- [ ] Verify that homologation is blocked until both sporting and financial approval are true.
- [ ] Commit with `feat: add registration workflows`.

### Task 5: Implement category request and mid-season transfer

**Files:**
- Create: `supabase/migrations/202607180014_category_changes.sql`
- Create: `packages/database/src/repositories/category-changes.ts`
- Create: `packages/database/src/services/category-change-simulation.ts`
- Test: `packages/database/src/services/category-change-simulation.test.ts`

**Interfaces:**
- Produces: `simulateCategoryChange`, `approveCategoryChange`, `applyCategoryChange`.

- [ ] Write tests for preserve, zero, proportional conversion and historical-only modes.
- [ ] Implement simulation output with affected standings and effective stage.
- [ ] Verify audit events and immutable prior category history.
- [ ] Commit with `feat: add category change governance`.

### Task 6: Implement PIX charges and manual review

**Files:**
- Create: `supabase/migrations/202607180015_payments.sql`
- Create: `packages/payments/src/charges.ts`
- Create: `packages/payments/src/review.ts`
- Create: `apps/plataforma/app/(driver)/payments/[chargeId]/page.tsx`
- Create: `apps/plataforma/app/(finance)/payments/page.tsx`
- Test: `packages/payments/src/review.test.ts`

**Interfaces:**
- Produces: `createCharge`, `submitReceipt`, `approvePayment`, `rejectPayment`.

- [ ] Test underpayment, overpayment, duplicate receipt hash and expired reservation.
- [ ] Implement immutable original amount plus adjustment ledger.
- [ ] Add private receipt storage and reviewer UI.
- [ ] Verify financial approval updates the registration without auto-homologating it.
- [ ] Commit with `feat: add manual pix validation`.

### Task 7: Implement credit ledger and cancellation policy

**Files:**
- Create: `supabase/migrations/202607180016_credits_refunds.sql`
- Create: `packages/payments/src/credits.ts`
- Create: `packages/payments/src/cancellations.ts`
- Test: `packages/payments/src/credits.test.ts`
- Test: `packages/payments/src/cancellations.test.ts`

**Interfaces:**
- Produces: `grantCredit`, `reserveCredit`, `consumeCredit`, `releaseCredit`, `requestCancellation`, `recordRefund`.

- [ ] Test full, partial and mixed credit/PIX payment.
- [ ] Test guardian transfer exception and default non-transferability.
- [ ] Implement configurable cancellation bands and manual refund proof.
- [ ] Verify ledger sum invariants.
- [ ] Commit with `feat: add credits cancellations and refunds`.

### Task 8: Implement check-in and QR verification

**Files:**
- Create: `supabase/migrations/202607180017_checkin.sql`
- Create: `packages/database/src/repositories/checkin.ts`
- Create: `apps/plataforma/app/(operations)/checkin/page.tsx`
- Create: `apps/plataforma/e2e/checkin.spec.ts`

**Interfaces:**
- Produces: `checkInRegistration`, `markLate`, `markAbsent`, `verifyRegistrationQr`.

- [ ] Write E2E tests for name search, QR lookup and blocked registration.
- [ ] Implement check-in audit and briefing attendance.
- [ ] Verify responsive tablet workflow.
- [ ] Commit with `feat: add event check-in`.

### Task 9: Run core operations release gate

- [ ] Run:

```bash
pnpm --filter @udk/database test
pnpm --filter @udk/payments test
pnpm --filter @udk/plataforma test:e2e --grep "registration|payment|check-in"
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands exit 0.
