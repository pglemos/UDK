import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

const styleFiles = [
  "app/cinema-core.css",
  "app/cinema-home.css",
  "app/cinema-pages.css",
  "app/cinema-responsive.css",
];

describe("UDK cinematic public experience", () => {
  it("uses one compact cinematic stylesheet system", () => {
    const imports = read("app/race.css");
    for (const file of styleFiles) {
      expect(imports).toContain(file.replace("app/", "./"));
      expect(fs.existsSync(path.join(appRoot, file)), file).toBe(true);
    }
    expect(imports).not.toContain("tg-core-");
    expect(imports).not.toContain("tg-pages-");
  });

  it("ships the immersive shell and official brand", () => {
    const header = read("components/race/race-header.tsx");
    const shell = read("components/race/race-shell.tsx");
    const motion = read("components/race/cinematic-motion.tsx");

    expect(header).toContain("cinema-menu-media");
    expect(header).toContain("aria-label=\"Abrir menu\"");
    expect(header).toContain("OfficialLogo");
    expect(shell).toContain("CinematicRouteCurtain");
    expect(shell).toContain("CinematicPointer");
    expect(shell).toContain("CinematicIntro");
    expect(motion).toContain("cinema-route-curtain");
  });

  it("builds the complete home narrative", () => {
    const home = read("app/page.tsx");
    for (const marker of [
      "cinema-home-hero",
      "cinema-manifesto",
      "cinema-season",
      "cinema-proof",
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
    expect(home).toContain("não espera.");
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
    const responsive = read("app/cinema-responsive.css");

    expect(results).toContain("homologação");
    expect(news).toContain("EditorialEmpty");
    expect(responsive).toContain("prefers-reduced-motion: reduce");
    expect(responsive).toContain("max-width: 900px");
    expect(responsive).toContain("max-width: 640px");
  });
});
