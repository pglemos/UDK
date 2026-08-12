import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

describe("responsive layout safeguards", () => {
  it("loads the browser-audit stylesheets in final order", () => {
    const entry = read("app/race.css");
    expect(entry).toContain('@import "./audit-fixes.css";');
    expect(entry).toContain('@import "./final-audit-overrides.css";');
    expect(entry.indexOf("final-audit-overrides.css")).toBeGreaterThan(entry.indexOf("audit-fixes.css"));
  });

  it("keeps podium values and calendar links on readable lines", () => {
    const css = read("app/audit-fixes.css");
    expect(css).toContain(".tg-standing-podium-card > b");
    expect(css).toContain("white-space: nowrap");
    expect(css).toContain(".tg-calendar-stage > .tg-arrow-link");
  });

  it("keeps driver cards readable on dark media", () => {
    const css = read("app/audit-fixes.css");
    expect(css).toContain(".tg-driver-poster");
    expect(css).toContain("color: var(--cinema-white)");
  });

  it("prevents the registration summary and mobile auth heading from clipping", () => {
    const css = read("app/final-audit-overrides.css");
    expect(css).toContain(".race-registration-summary h2");
    expect(css).toContain(".race-auth-copy h1");
    expect(css).toContain("max-width: 100%");
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
