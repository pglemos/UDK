import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const repositoryRoot = path.resolve(appRoot, "../..");
const readApp = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");
const readRepo = (file: string) => fs.readFileSync(path.join(repositoryRoot, file), "utf8");

describe("UDK 2026 official championship rules", () => {
  it("versions the official scoring rules and best-six-of-eight discard calculation in PostgreSQL", () => {
    const migration = [
      "supabase/migrations/202608070001_2026_scoring_rules.sql",
      "supabase/migrations/202608070002_2026_standings_discards.sql",
      "supabase/migrations/202608070003_2026_public_standings_fields.sql",
      "supabase/migrations/202608070004_2026_public_regulation.sql",
      "supabase/migrations/202608070005_2026_automatic_result_points.sql",
    ].map(readRepo).join("\n");

    expect(migration).toContain("50");
    expect(migration).toContain("150");
    expect(migration).toContain("pole_points");
    expect(migration).toContain("fastest_lap_points");
    expect(migration).toContain("event_count - 6");
    expect(migration).toContain("least(2");
    expect(migration).toContain("coalesce(entry.points, 0)");
    expect(migration).toContain("Corrida 1 - Horário");
    expect(migration).toContain("Corrida 2 - Anti-horário");
    expect(migration).toContain("Endurance 1h");
    expect(migration).toContain("result_entries_auto_points");
    expect(migration).toContain("apply_result_entry_points");
    expect(migration).toContain("can_judge_season");
    expect(migration).toContain("create unique index if not exists");
    expect(migration).not.toContain("create unique index concurrently");
    expect(migration).toContain("standing.category_id is not distinct from driver.category_id");
  });

  it("publishes the corrected eight-result regulation without the old eight-regular-races wording", () => {
    const fallback = readApp("lib/public-content-fallbacks.ts");

    expect(fallback).toContain("08 resultados pontuáveis");
    expect(fallback).toContain("06 corridas regulares");
    expect(fallback).toContain("02 Endurances");
    expect(fallback).toContain("02 piores resultados");
    expect(fallback).toContain("cada corrida é um resultado pontuável independente");
    expect(fallback).not.toContain("08 corridas regulares");
  });

  it("exposes gross and discarded points to the public classification experience", () => {
    const publicData = readApp("lib/public-data.ts");
    const standingsPage = readApp("app/classificacao/page.tsx");

    expect(publicData).toContain("grossPoints");
    expect(publicData).toContain("discardedPoints");
    expect(standingsPage).toContain("grossPoints");
    expect(standingsPage).toContain("discardedPoints");
    expect(standingsPage).toContain("Melhores 6 de 8 resultados");
    expect(standingsPage).toContain("formatPoints");
    expect(standingsPage).toContain('driver.discardedPoints > 0 ? `-${formatPoints(driver.discardedPoints)}` : "—"');
  });

  it("loads the suit-inspired racing texture as a secondary identity layer without collapsing hero media", () => {
    const layout = readApp("app/layout.tsx");
    const texture = readApp("app/brand-racing-texture.css");

    expect(layout).toContain('import "./brand-racing-texture.css";');
    expect(texture).toContain("--udk-suit-teal");
    expect(texture).toContain("repeating-linear-gradient");
    expect(texture).toContain("mask-image");
    expect(texture).toContain(".tg-page-hero::after");
    expect(texture).toContain(".dashboard-grid::before");
    expect(texture).toContain(".tg-page-hero > .race-container");
    expect(texture).toContain("color: #59656a");
    expect(texture).not.toContain(".tg-page-hero > *,");
  });
});
