# UDK Results and Sporting Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver reliable timing import, result versioning, scoring, standings, penalties, evidence, appeals and official notifications.

**Architecture:** Raw timing artifacts remain immutable. Parsed records create draft result versions. The scoring engine is a pure package; disciplinary decisions generate explicit sporting adjustments and new result/standing versions.

**Tech Stack:** TypeScript, PDF parsing adapters, PostgreSQL, Supabase Storage, Vitest, Playwright, Puppeteer.

## Global Constraints

- Never mutate or delete an original timing file.
- Every correction creates a new result version.
- Tie-break order is regulation-controlled.
- Missing tie-break rules block final homologation.
- Default appeal deadline is 30 minutes after provisional publication.

---

### Task 1: Add result ingestion schema and inbox adapter

**Files:**
- Create: `supabase/migrations/202607180020_result_ingestion.sql`
- Create: `packages/results-importer/src/inbox/types.ts`
- Create: `packages/results-importer/src/inbox/normalize-email.ts`
- Create: `packages/results-importer/src/storage/save-artifacts.ts`
- Test: `packages/results-importer/src/inbox/normalize-email.test.ts`

**Interfaces:**
- Produces: `normalizeInboundEmail`, `saveInboundArtifacts`.

- [ ] Test direct, forwarded and manually uploaded sources.
- [ ] Implement duplicate detection by message ID and artifact hash.
- [ ] Verify original metadata and attachments are immutable.
- [ ] Commit with `feat: add result ingestion pipeline`.

### Task 2: Implement timing report classification and parsing

**Files:**
- Create: `packages/results-importer/src/classify-report.ts`
- Create: `packages/results-importer/src/parsers/timing-official.ts`
- Create: `packages/results-importer/src/parsers/lap-to-lap.ts`
- Create: `packages/results-importer/test/fixtures/`
- Test: `packages/results-importer/src/parsers/timing-official.test.ts`
- Test: `packages/results-importer/src/parsers/lap-to-lap.test.ts`

**Interfaces:**
- Produces: `classifyReport`, `parseTimingOfficial`, `parseLapToLap`.

- [ ] Add anonymized fixture files and expected structured snapshots.
- [ ] Verify failing parser tests.
- [ ] Implement content-based classification independent of file name.
- [ ] Parse position, kart, driver, total time, best lap, gaps, laps and speeds.
- [ ] Verify snapshots and malformed-file errors.
- [ ] Commit with `feat: parse mylaps timing reports`.

### Task 3: Implement session pairing and driver matching

**Files:**
- Create: `packages/results-importer/src/pair-session-reports.ts`
- Create: `packages/results-importer/src/match-driver.ts`
- Test: `packages/results-importer/src/match-driver.test.ts`

**Interfaces:**
- Produces: `pairSessionReports`, `matchDriverCandidate`.

- [ ] Test truncated names, accents, reordered surnames and same kart numbers in different sessions.
- [ ] Implement confidence scoring using name, kart, position, laps, best lap and registered participants.
- [ ] Require review below the configured confidence threshold.
- [ ] Commit with `feat: match imported timing drivers`.

### Task 4: Add draft result review and versioning

**Files:**
- Create: `supabase/migrations/202607180021_results.sql`
- Create: `packages/database/src/repositories/results.ts`
- Create: `apps/plataforma/app/(organization)/results/imports/page.tsx`
- Create: `apps/plataforma/app/(organization)/results/[resultId]/review/page.tsx`
- Test: `packages/database/src/repositories/results.test.ts`

**Interfaces:**
- Produces: `createDraftResult`, `publishProvisional`, `homologateResult`, `rectifyResult`.

- [ ] Test immutable version lineage and publish-state transitions.
- [ ] Implement blocking validation for unmatched drivers and inconsistent lap totals.
- [ ] Add before/after diff for rectification.
- [ ] Commit with `feat: add versioned result review`.

### Task 5: Implement pure scoring engine

**Files:**
- Create: `packages/scoring-engine/src/types.ts`
- Create: `packages/scoring-engine/src/calculate-stage-points.ts`
- Create: `packages/scoring-engine/src/apply-discards.ts`
- Create: `packages/scoring-engine/src/apply-tiebreak.ts`
- Create: `packages/scoring-engine/src/calculate-standings.ts`
- Test: `packages/scoring-engine/src/*.test.ts`

**Interfaces:**
- Produces: `calculateStagePoints`, `applyDiscards`, `applyRegulationTiebreak`, `calculateStandings`.

- [ ] Write fixture tests for regular, Super Pole, Endurance, bonuses, penalties and two discards.
- [ ] Test that missing tie-break configuration returns a blocking error.
- [ ] Implement deterministic pure functions with no database access.
- [ ] Verify snapshot stability across repeated runs.
- [ ] Commit with `feat: add deterministic scoring engine`.

### Task 6: Add standings versions and public read model

**Files:**
- Create: `supabase/migrations/202607180022_standings.sql`
- Create: `packages/database/src/repositories/standings.ts`
- Create: `packages/database/src/services/recalculate-standings.ts`
- Test: `packages/database/src/services/recalculate-standings.test.ts`

**Interfaces:**
- Produces: `recalculateStandings`, `publishStandingsVersion`, `getPublicStandings`.

- [ ] Test provisional, homologated and rectified versions.
- [ ] Implement transactionally consistent result-to-standings recalculation.
- [ ] Verify no public reader sees an incomplete recalculation.
- [ ] Commit with `feat: add versioned standings`.

### Task 7: Implement occurrences, evidence and penalties

**Files:**
- Create: `supabase/migrations/202607180023_disciplinary.sql`
- Create: `packages/disciplinary/src/occurrences.ts`
- Create: `packages/disciplinary/src/evidence.ts`
- Create: `packages/disciplinary/src/penalties.ts`
- Create: `apps/plataforma/app/(operations)/occurrences/page.tsx`
- Create: `apps/plataforma/app/(committee)/cases/page.tsx`
- Test: `packages/disciplinary/src/penalties.test.ts`

**Interfaces:**
- Produces: `registerOccurrence`, `attachEvidence`, `applyPenalty`, `homologatePenalty`.

- [ ] Test marshal-authorized and committee-only penalty types.
- [ ] Test immediate, provisional, suspended and delayed effects.
- [ ] Implement evidence access levels and immutable hashes.
- [ ] Commit with `feat: add disciplinary case management`.

### Task 8: Implement protests, appeals and deadlines

**Files:**
- Create: `packages/disciplinary/src/appeals.ts`
- Create: `packages/disciplinary/src/deadlines.ts`
- Create: `apps/plataforma/app/(driver)/appeals/page.tsx`
- Create: `apps/plataforma/app/(committee)/appeals/[appealId]/page.tsx`
- Test: `packages/disciplinary/src/deadlines.test.ts`

**Interfaces:**
- Produces: `openAppealWindow`, `fileAppeal`, `reopenAppealWindow`, `decideAppeal`.

- [ ] Test exact 30-minute default boundary, custom duration and audited reopening.
- [ ] Test guardian filing for a minor.
- [ ] Implement decision effects that call result rectification rather than editing standings directly.
- [ ] Commit with `feat: add protest and appeal workflow`.

### Task 9: Implement critical notifications

**Files:**
- Create: `supabase/migrations/202607180024_notifications.sql`
- Create: `packages/notifications/src/templates.ts`
- Create: `packages/notifications/src/enqueue.ts`
- Create: `packages/notifications/src/worker.ts`
- Create: `apps/plataforma/app/(authenticated)/notifications/page.tsx`
- Test: `packages/notifications/src/worker.test.ts`

**Interfaces:**
- Produces: `enqueueNotification`, `deliverNotification`, `markRead`.

- [ ] Test mandatory versus optional preference behavior.
- [ ] Implement idempotency keys and retry-safe delivery.
- [ ] Verify result, penalty, appeal and rectification notifications.
- [ ] Commit with `feat: add critical notification delivery`.

### Task 10: Run results and governance release gate

```bash
pnpm --filter @udk/results-importer test
pnpm --filter @udk/scoring-engine test
pnpm --filter @udk/disciplinary test
pnpm --filter @udk/notifications test
pnpm --filter @udk/plataforma test:e2e --grep "result|penalty|appeal"
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands exit 0.
