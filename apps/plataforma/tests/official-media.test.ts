import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

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

    expect(catalog).not.toContain("images.unsplash.com");
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
});
