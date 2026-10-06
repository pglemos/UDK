import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

describe("UDK cinematic public experience", () => {
  it("uses one compact cinematic stylesheet system", () => {
    const styles = read("app/race.css");
    const layout = read("app/layout.tsx");
    expect(styles).not.toContain("@import");
    expect(layout.match(/import ".\/race.css"/g)).toHaveLength(1);
    expect(styles).toContain(".race-header");
    expect(styles).toContain(".tg-mobile-standing-list");
  });

  it("ships the immersive shell and official brand", () => {
    const header = read("components/race/race-header.tsx");
    const shell = read("components/race/race-shell.tsx");
    const motion = read("components/race/cinematic-motion.tsx");

    expect(header).toContain("cinema-menu-media");
    expect(header).toContain('aria-label="Abrir menu"');
    expect(header).toContain("OfficialLogo");
    expect(shell).not.toContain("CinematicRouteCurtain");
    expect(shell).not.toContain("CinematicPointer");
    expect(shell).not.toContain("CinematicIntro");
    expect(motion).toContain("cinema-route-curtain");
  });

  it("keeps the race opening and season data available", () => {
    const home = read("app/page.tsx");
    for (const marker of [
      "cinema-home-hero",
      "udk-home-opening",
      "udk-race-ticket",
      "udk-season-board",
      "cinema-season",
      "cinema-ranking",
      "cinema-news",
      "cinema-sponsors",
    ]) {
      expect(home).toContain(marker);
    }
    expect(home).toContain("ULTRAS");
    expect(home).toContain("DO KART");
    expect(home).not.toContain("A pista não espera");
  });

  it("keeps all public routes in the shared shell", () => {
    const pages = [
      "app/calendario/page.tsx",
      "app/classificacao/page.tsx",
      "app/resultados/page.tsx",
      "app/pilotos/page.tsx",
      "app/pilotos/[slug]/page.tsx",
      "app/noticias/page.tsx",
      "app/noticias/[slug]/page.tsx",
      "app/regulamento/page.tsx",
      "app/inscricao/page.tsx",
    ];

    for (const page of pages) {
      const source = read(page);
      expect(source).toContain("RaceShell");
      expect(source).not.toContain("Lorem ipsum");
    }
  });

  it("preserves honest empty states and reduced motion", () => {
    const results = read("app/resultados/page.tsx");
    const news = read("app/noticias/page.tsx");
    const responsive = read("app/race.css");

    expect(results).toContain("homologação");
    expect(news).toContain("EditorialEmpty");
    expect(responsive).toContain("prefers-reduced-motion: reduce");
    expect(responsive).toContain("max-width: 1000px");
    expect(responsive).toContain("max-width: 760px");
  });
});
