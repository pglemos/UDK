import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

describe("design audit corrections", () => {
  it("ships one responsive visual system without a patch cascade", () => {
    const layout = read("app/layout.tsx");
    const styles = read("app/race.css");
    expect(layout).toContain('import "./race.css";');
    expect(layout).not.toContain("udk-production-fixes.css");
    expect(styles).not.toContain("@import");
    expect(styles).toContain("prefers-reduced-motion: reduce");
  });

  it("self-hosts the display and body fonts instead of fetching Google Fonts (A3)", () => {
    const layout = read("app/layout.tsx");

    expect(layout).toContain("Archivo");
    expect(layout).toContain('variable: "--font-archivo"');

    for (const sheet of ["app/globals.css", "app/race.css"]) {
      expect(read(sheet)).not.toContain("fonts.googleapis.com");
    }
    expect(read("app/race.css")).toContain("--cinema-display: var(--font-archivo)");
    expect(read("app/globals.css")).toContain("font-family: var(--font-inter)");
  });

  it("keeps the menu button named on desktop and mobile", () => {
    const header = read("components/race/race-header.tsx");
    expect(header).toContain('aria-label={open ? "Fechar menu" : "Abrir menu"}');
    expect(header).toContain("<span>Menu</span>");
    expect(read("app/race.css")).toContain(".race-menu-trigger > span");
  });

  it("keeps registration reachable in the menu and home", () => {
    const header = read("components/race/race-header.tsx");
    const home = read("app/page.tsx");
    expect(header).toContain('href="/inscricao"');
    expect(header).toContain("race-mobile-menu-actions");
    expect(home).toContain("getStageAction(nextStage)");
    expect(home).toContain("href={nextStageAction.href}");
  });

  it("filters instantly with a debounced search field (C6)", () => {
    const field = read("components/race/search-field.tsx");
    const ui = read("components/race/ui.tsx");

    expect(field).toContain('"use client"');
    expect(field).toContain('type="search"');
    expect(field).toContain("router.replace");
    expect(field).toContain("debounceMs = 300");
    expect(field).toContain('params.delete("page")');
    expect(field).toContain('const searchParamValue = searchParams.get(name) ?? "";');
    expect(field).toContain("setValue(searchParamValue);");
    expect(field).toContain("value.trim() === searchParamValue.trim()");
    expect(ui).toContain('export { SearchField } from "./search-field";');
  });

  it("calibrates the countdown against the server clock (A5)", () => {
    const motion = read("components/race/motion.tsx");

    expect(motion).toContain('fetch("/api/health"');
    expect(motion).toContain("SKEW_REFRESH_MS = 60_000");
    expect(motion).toContain("calculateCountdown(target, skewRef.current)");
    expect(motion).toContain("udk-countdown-live");
    expect(read("app/race.css")).toContain(".udk-countdown-live");
  });

  it("publishes championship numbers immediately instead of showing temporary zeroes", () => {
    const motion = read("components/race/motion.tsx");
    expect(motion).toContain("value.toLocaleString");
    expect(motion).not.toContain("setDisplay(0)");
  });

  it("provides compact mobile results with expandable details", () => {
    const styles = read("app/race.css");
    const results = read("app/resultados/page.tsx");
    expect(styles).toContain(".tg-mobile-standing-list");
    expect(styles).toContain(".tg-desktop-standing-table-wrap");
    expect(styles).toContain(".tg-mobile-detail-grid");
    expect(results).toContain("tg-mobile-result-list");
    expect(results).toContain("<details>");
  });

  it("drops the stylesheets no route imports (A2, first step)", () => {
    const dead = [
      "app/race-core.css",
      "app/race-components.css",
      "app/tg-core-01.css",
      "app/tg-pages-01.css",
      "app/race-fidelity-home.css",
    ];

    for (const file of dead) {
      expect(fs.existsSync(path.join(appRoot, file))).toBe(false);
    }
  });
});
