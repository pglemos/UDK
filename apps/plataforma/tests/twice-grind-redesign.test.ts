import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

describe("UDK public surface contracts", () => {
  it("keeps the immersive global shell and official brand", () => {
    const header = read("components/race/race-header.tsx");
    const shell = read("components/race/race-shell.tsx");

    expect(header).toContain("cinema-menu-media");
    expect(header).toContain('aria-label="Abrir menu"');
    expect(header).toContain("Inscreva-se");
    expect(shell).not.toContain("CinematicRouteCurtain");
    expect(shell).not.toContain("CinematicPointer");
    expect(shell).toContain("OfficialLogo");
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
  });

  it("keeps all public routes inside the same editorial system", () => {
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

  it("does not fabricate official results or empty editorial content", () => {
    const results = read("app/resultados/page.tsx");
    const news = read("app/noticias/page.tsx");

    expect(results).toContain("homologação");
    expect(results).toContain("EditorialEmpty");
    expect(news).toContain("EditorialEmpty");
    expect(news).toContain("Nenhuma notícia oficial publicada");
  });

  it("ships responsive and reduced-motion coverage", () => {
    const responsive = read("app/race.css");
    expect(responsive).toContain("@media (max-width: 1200px)");
    expect(responsive).toContain("@media (max-width: 1000px)");
    expect(responsive).toContain("@media (max-width: 760px)");
    expect(responsive).toContain("prefers-reduced-motion: reduce");
  });
});
