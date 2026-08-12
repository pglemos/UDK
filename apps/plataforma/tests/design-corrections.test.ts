import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

describe("design audit corrections", () => {
  it("loads the production fixes stylesheet last (C1-C6, A4, A6-A15, D1-D15)", () => {
    const layout = read("app/layout.tsx");
    const fixes = read("app/udk-production-fixes.css");

    expect(layout).toContain('import "./udk-production-fixes.css";');
    expect(layout.indexOf("udk-production-fixes.css")).toBeGreaterThan(
      layout.indexOf("brand-racing-texture.css"),
    );
    expect(fixes).toContain(".udk-mobile-cta");
    expect(fixes).toContain("prefers-reduced-motion: reduce");
  });

  it("self-hosts the display and body fonts instead of fetching Google Fonts (A3)", () => {
    const layout = read("app/layout.tsx");

    expect(layout).toContain("Barlow_Condensed");
    expect(layout).toContain('variable: "--font-barlow"');
    expect(layout).toContain('variable: "--font-inter"');

    for (const sheet of ["app/globals.css", "app/cinema-core.css"]) {
      expect(read(sheet)).not.toContain("fonts.googleapis.com");
    }
    expect(read("app/cinema-core.css")).toContain("--cinema-display: var(--font-barlow)");
    expect(read("app/globals.css")).toContain("font-family: var(--font-inter)");
  });

  it("keeps the hamburger label accessible without showing the word (C3)", () => {
    const header = read("components/race/race-header.tsx");

    expect(header).toContain('<span className="sr-only">Menu</span>');
    expect(header).toContain('<Menu aria-hidden="true" size={24} />');
  });

  it("gives mobile a permanent path into the grid (C1)", () => {
    const shell = read("components/race/race-shell.tsx");

    expect(shell).toContain('className="udk-mobile-cta"');
    expect(shell).toContain('href="/inscricao"');
    expect(shell.indexOf("udk-mobile-cta")).toBeGreaterThan(shell.indexOf("</footer>"));
  });

  it("filters instantly with a debounced search field (C6)", () => {
    const field = read("components/race/search-field.tsx");
    const ui = read("components/race/ui.tsx");

    expect(field).toContain('"use client"');
    expect(field).toContain('type="search"');
    expect(field).toContain("router.replace");
    expect(field).toContain("debounceMs = 300");
    expect(field).toContain('params.delete("page")');
    expect(ui).toContain('export { SearchField } from "./search-field";');
  });

  it("calibrates the countdown against the server clock (A5)", () => {
    const motion = read("components/race/motion.tsx");

    expect(motion).toContain('fetch("/api/health"');
    expect(motion).toContain("SKEW_REFRESH_MS = 60_000");
    expect(motion).toContain("calculateCountdown(target, skewRef.current)");
    expect(motion).toContain("udk-countdown-live");
    expect(read("app/udk-production-fixes.css")).toContain(".udk-countdown-live");
  });

  it("animates the championship numbers on scroll and gives podiums context (D14, A14)", () => {
    const home = read("app/page.tsx");

    expect(home).toContain("CountUp");
    expect(home).toContain("<CountUp value={totalPodiums} />");
    expect(home).toContain("pódios entre {drivers.length}");
    expect(home).not.toContain("pódios acumulados");
    expect(read("components/race/motion.tsx")).toContain("IntersectionObserver");
  });

  it("leaves the existing responsive table treatment alone (C5)", () => {
    const fixes = read("app/udk-production-fixes.css");
    const responsive = read("app/cinema-responsive.css");

    // O tratamento de cards rótulo/valor é do cinema-responsive.css. Competir
    // com ele sobrepunha as células e deixava texto branco sobre fundo claro.
    expect(responsive).toContain("content: attr(data-label)");
    expect(fixes).not.toContain(".udk-data-table thead");
    expect(fixes).not.toContain("grid-template-columns: 34px 1fr auto");
    expect(fixes).not.toContain(".udk-data-table td:nth-child(2)");

    // A faixa de pódio sobrevive, mas sem fixar cor de texto ou de fundo:
    // a tabela ainda herda o tema claro do globals.css.
    expect(fixes).toContain("box-shadow: inset 3px 0 0 var(--udk-p1)");
    expect(fixes).not.toContain("background: rgba(255, 198, 75, .08)");
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
