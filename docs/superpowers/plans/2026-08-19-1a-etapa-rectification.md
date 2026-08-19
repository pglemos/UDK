# 1ª Etapa Sporting Rectification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir de forma versionada a 1ª etapa UDK de 18/08/2026 conforme o resultado LapTime, a Super Pole, o volta a volta e o regulamento, incluindo bônus da melhor parada, correção de volta do Pedro Guilherme e penalizações desportivas.

**Architecture:** Preservar a versão 1 publicada e criar uma versão 2 `rectified` por categoria. O motor de pontuação passa a suportar bônus de melhor parada e desconto de pontos por penalidade, mantendo o resultado bruto do LapTime rastreável e registrando ajuste manual de voltas sem destruir a importação original.

**Tech Stack:** PostgreSQL/Supabase, pgTAP, Next.js 16/TypeScript, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-07-18-udk-platform-design.md`

## Global Constraints

- Preservar histórico e rastreabilidade: retificação cria nova versão.
- Não alterar o resultado bruto LapTime importado na versão 1.
- Pontuação Endurance segue P1 150, P2 145, P3 142, P4 140, P5 138, P6 137 e queda de 1 ponto por posição.
- Pole geral: André Felisberto, +1.
- Melhor volta geral: Arthur, 1:04.976, +1.
- Melhor parada válida: Lucas Rabelo, TV 05:00.007, +10.
- Pedro Guilherme: corrigir total oficial para 47 voltas sem inventar tempos individuais para as duas voltas unidas pelo sensor em 2:16.868.
- Bandeiras preta/branca registradas no relatório oficial devem ser persistidas como penalidade desportiva aplicável conforme o regulamento, com +5 s e -10 pontos.
- Resultado NC não recebe pontos-base de posição.

---

### Task 1: Regression tests for the complete rule application

**Files:**
- Create: `supabase/tests/first_stage_rectification.sql`

- [ ] Write pgTAP tests that require the new scoring fields, version 2 rectified results, Lucas Rabelo +10, Pedro Guilherme 47 laps, André +1 pole, Arthur +1 fastest lap, removal of the category-only pole bonus from Bernardo, and the championship-point deductions for black/white flags.
- [ ] Open a PR with only the tests and verify Supabase CI fails for the expected missing schema/rectification behavior.

### Task 2: Extend the scoring model

**Files:**
- Create: `supabase/migrations/202608190003_complete_1a_etapa_scoring.sql`
- Modify through migration only: `points_rules`, `result_entries`, scoring functions/triggers, public result-entry view.

- [ ] Add `best_pit_points` to `points_rules` and set Endurance to 10, regular to 0.
- [ ] Add `best_pit`, `penalty_points`, `timing_adjustment_laps`, and `sporting_note` to `result_entries`.
- [ ] Rebuild `apply_result_entry_points()` and `recalculate_result_points()` so total points are: classified position points + pole + fastest lap + best pit - penalty points.
- [ ] Include the new columns in `public_portal_result_entries`.

### Task 3: Create versioned rectification of 18/08/2026

**Files:**
- Same migration as Task 2.

- [ ] Fix the LapTime idempotency index so result versions can coexist.
- [ ] Create version 2 results with status `rectified`, preserving version 1.
- [ ] Copy all entries from version 1 into version 2 and apply only the documented sporting corrections.
- [ ] Set André Felisberto `pole=true`; set Bernardo (Rápidos) `pole=false` for scoring because the overall pole is André.
- [ ] Set Arthur `fastest_lap=true`.
- [ ] Set Lucas Rabelo `best_pit=true` with evidence `05:00.007`.
- [ ] Set Pedro Guilherme to 47 laps, `timing_adjustment_laps=1`, retaining the raw 2:16.868 lap in the original lap import and adding a sporting note.
- [ ] Persist black/white penalties with `penalty_ms=5000`, `penalty_points=10` and rows in `penalties` for Francisco Biulchi, Vitor Hugo, Rodrigo Boris, Pablo Fonseca, Wesley Cardoso, Fernando Godoy, Bráulio Bonoto and Toninho da Prata.
- [ ] Preserve existing -7-lap finishing positions from the official LapTime result; do not deduct those laps again.

### Task 4: Recalculate and publish corrected standings

**Files:**
- Same migration as Task 2.

- [ ] Generate the next standings version from the rectified results.
- [ ] Ensure public views select the latest standings/result versions.
- [ ] Verify expected headline points: Matteo 150, André 146, Lucas Rabelo 144, Arthur 151, Pedro Guilherme 131.

### Task 5: Surface the correction in the public application

**Files:**
- Modify: `apps/plataforma/lib/public-data.ts`
- Modify the result-detail UI used by `/resultados` if needed.
- Add/update Vitest coverage for normalization and labels.

- [ ] Expose best-pit bonus, penalty points and timing-adjustment note to the UI.
- [ ] Display a concise sporting breakdown without changing the raw LapTime evidence.
- [ ] Verify Pedro Guilherme shows 47 official laps and the correction note.

### Task 6: Full verification and deployment

- [ ] Run Supabase CI: migrations, pgTAP and DB lint.
- [ ] Run application CI: lint, typecheck, tests and build.
- [ ] Review PR diff and CodeRabbit/review comments.
- [ ] Merge only after all required checks are green.
- [ ] Apply migrations to production Supabase and confirm latest result/standings values with direct SQL.
- [ ] Confirm Vercel production deployment and public `/resultados` + `/classificacao` behavior.
