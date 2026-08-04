import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

describe("UDK Twice + The Grind direction contracts", () => {
  it("keeps the immersive global shell and official brand", () => {
    const header = read("components/race/race-header.tsx");
    const shell = read("components/race/race-shell.tsx");

    expect(header).toContain("cinema-menu-media");
    expect(header).toContain("aria-label=\"Abrir menu\"");
    expect(header).toContain("Entrar no grid");
    expect(shell).toContain("CinematicRouteCurtain");
    expect(shell).toContain("CinematicPointer");
    expect(shell).toContain("OfficialLogo");
  });

  it("builds the complete cinematic home narrative", () => {
    const home = read("app/page.tsx");
    for (const marker of [
      "cinema-home-hero",
      "cinema-manifesto",
      "cinema-season",
      "cinema-ranking",
      "cinema-drivers",
      "cinema-community",
      "cinema-news",
      "cinema-sponsors",
      "cinema-final-cta",
    ]) {
      expect(home).toContain(marker);
    }
    expect(home).toContain("A pista");
    expect(home).toContain("não espera");
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
    const responsive = read("app/cinema-responsive.css");
    expect(responsive).toContain("@media (max-width: 1180px)");
    expect(responsive).toContain("@media (max-width: 900px)");
    expect(responsive).toContain("@media (max-width: 640px)");
    expect(responsive).toContain("prefers-reduced-motion: reduce");
  });
});
