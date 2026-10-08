import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const repositoryRoot = path.resolve(appRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");
const readRepositoryFile = (file: string) =>
  fs.readFileSync(path.join(repositoryRoot, file), "utf8");

const requiredAssets = [
  "public/media/official/home/race-original.png",
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
    expect(catalog).toContain("/media/official/home/hero-loop.mp4");
    expect(catalog).toContain("/media/official/heroes/resultados.webp");
  });

  it("keeps page heroes contextually distinct", () => {
    const catalog = read("lib/visual-assets.ts");
    const matches = [...catalog.matchAll(/src: "(\/media\/official\/heroes\/[^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(new Set(matches).size).toBeGreaterThanOrEqual(8);
  });

  it("traces the Home photograph to the original UDK source", () => {
    const manifest = JSON.parse(read("public/media/official/source-manifest.json"));
    const asset = manifest.assets.find(
      (entry: { path: string }) => entry.path === "/media/official/home/race-original.png",
    );
    const png = fs.readFileSync(path.join(appRoot, "public/media/official/home/race-original.png"));

    expect(asset.source).toBe("255A.mp4 @ 1.40s");
    expect(asset.sourceCommit).toBe("b85be62");
    expect(asset.transform).toContain("no AI generation");
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(asset.width);
    expect(png.readUInt32BE(20)).toBe(asset.height);
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
