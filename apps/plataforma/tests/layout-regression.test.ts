import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

describe("responsive layout safeguards", () => {
  it("loads one authoritative public stylesheet after the operation controls", () => {
    const entry = read("app/race.css");
    const layout = read("app/layout.tsx");
    expect(entry).not.toContain("@import");
    expect(layout.indexOf("race.css")).toBeGreaterThan(layout.indexOf("pilot-crud.css"));
  });

  it("keeps ranking points and calendar links on readable lines", () => {
    const css = read("app/race.css");
    expect(css).toContain(".udk-leader-points small");
    expect(css).toContain(".tg-calendar-stage > a");
    expect(css).toContain("grid-column: 1/-1");
  });

  it("keeps driver cards readable on dark media", () => {
    const css = read("app/race.css");
    expect(css).toContain(".cinema-driver-poster");
    expect(css).toContain(".cinema-driver-poster-copy");
    expect(css).toContain("color: var(--cinema-ink)");
  });

  it("prevents the registration summary and mobile auth heading from clipping", () => {
    const css = read("app/race.css");
    expect(css).toContain(".race-registration-summary");
    expect(css).toContain(".race-auth-copy h2");
    expect(css).toContain("grid-template-columns: 1fr");
    expect(css).toContain("@media (max-width: 760px)");
  });

  it("uses verified official visuals and resolves legacy placeholders", () => {
    const assets = read("lib/visual-assets.ts");
    const calendar = read("app/calendario/page.tsx");
    const primitives = read("components/race/editorial-primitives.tsx");

    expect(assets).toContain("/media/official/stages/stage-01.webp");
    expect(assets).toContain("/media/official/stages/stage-05.webp");
    expect(assets).toContain("/media/official/heroes/calendario.webp");
    expect(assets).toContain("/media/official/drivers/fallback-01.webp");
    expect(assets).toContain("/media/official/news/news-01.webp");
    expect(assets).not.toContain("images.unsplash.com");
    expect(calendar).toContain("resolveVisualSource");
    // A10 — só o hero da rota carrega com prioridade; o resto é lazy.
    expect(calendar).toContain('loading="lazy"');
    expect(calendar).not.toContain('loading="eager"');
    expect(primitives).toContain("resolveVisualSource");
    expect(primitives).toContain('loading={featured ? undefined : "lazy"}');
    expect(primitives).toContain("priority={index === 0}");
  });
});
