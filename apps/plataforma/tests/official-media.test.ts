import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const repositoryRoot = path.resolve(appRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");
const readRepositoryFile = (file: string) =>
  fs.readFileSync(path.join(repositoryRoot, file), "utf8");

const requiredAssets = [
  "public/media/official/home/hero-desktop.webp",
  "public/media/official/home/hero-mobile.webp",
  "public/media/official/home/hero-loop.mp4",
  "public/media/official/heroes/calendario.webp",
  "public/media/official/heroes/classificacao.webp",
  "public/media/official/heroes/resultados.webp",
  "public/media/official/heroes/pilotos.webp",
  "public/media/official/heroes/noticias.webp",
  "public/media/official/heroes/regulamento.webp",
  "public/media/official/heroes/inscricao.webp",
  "public/media/official/heroes/login.webp",
] as const;

describe("official UDK media", () => {
  it("ships every required derivative", () => {
    for (const asset of requiredAssets) {
      expect(fs.statSync(path.join(appRoot, asset)).size).toBeGreaterThan(1024);
    }
  });

  it("uses only local official media in the editorial catalog", () => {
    const catalog = read("lib/visual-assets.ts");

    expect(catalog).not.toContain("https://images.unsplash.com");
    expect(catalog).toContain('/media/official/home/hero-loop.mp4');
    expect(catalog).toContain('/media/official/heroes/resultados.webp');
  });

  it("keeps page heroes contextually distinct", () => {
    const catalog = read("lib/visual-assets.ts");
    const matches = [
      ...catalog.matchAll(/src: "(\/media\/official\/heroes\/[^"]+)"/g),
    ].map((match) => match[1]);

    expect(new Set(matches).size).toBeGreaterThanOrEqual(8);
  });

  it("loads one responsive poster for the motion-aware Home hero", () => {
    const component = read("components/race/home-hero-media.tsx");
    const home = read("app/page.tsx");
    const entry = read("app/race.css");
    const styles = read("app/official-media.css");

    expect(component).toContain('"use client"');
    expect(component).toContain("prefers-reduced-motion: reduce");
    expect(component).toContain("max-width: 767px");
    expect(component).toContain("<picture>");
    expect(component).toContain('<source media="(max-width: 767px)"');
    expect(component).toContain("srcSet={homeHeroMedia.mobile}");
    expect(component.match(/<img/g)?.length ?? 0).toBe(1);
    expect(component).not.toContain('from "next/image"');
    expect(component).toContain('fetchPriority="high"');
    expect(component).toContain("poster={homeHeroMedia.poster}");
    expect(component).toContain("muted");
    expect(component).toContain("playsInline");
    expect(component).toContain("onError");
    expect(home).toContain("<HomeHeroMediaLayer />");
    expect(entry).toContain('@import "./official-media.css";');
    expect(entry.indexOf("official-media.css")).toBeGreaterThan(
      entry.indexOf("audit-round-three.css"),
    );
    expect(styles).toContain('/media/official/heroes/login.webp');
  });

  it("documents the implemented 24-asset Home contract", () => {
    const design = readRepositoryFile(
      "docs/superpowers/specs/2026-08-06-official-media-integration-design.md",
    );

    expect(design).toContain("hero-desktop.webp");
    expect(design).toContain("hero-mobile.webp");
    expect(design).toContain("hero-loop.mp4");
    expect(design).not.toContain("hero-poster.webp");
  });
});
