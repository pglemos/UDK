import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

type MediaManifest = {
  assets: Array<{
    path: string;
    width: number;
    height: number;
  }>;
};

describe("UDK visual quality regressions", () => {
  it("loads the editorial type system through next/font", () => {
    const layout = read("app/layout.tsx");
    const styles = read("app/race.css");
    expect(layout).toContain('from "next/font/google"');
    expect(layout).toContain("Archivo");
    expect(layout).not.toMatch(/Manrope|Syne/);
    expect(styles).toContain("var(--font-archivo)");
    expect(styles).toContain("--font-inter: var(--font-archivo)");
  });

  it("uses multiple optimized official visual sources instead of a repeated fallback", () => {
    const assets = read("lib/visual-assets.ts");
    const manifest = JSON.parse(
      read("public/media/official/source-manifest.json"),
    ) as MediaManifest;
    const home = read("app/page.tsx");
    const header = read("components/race/race-header.tsx");
    const primitives = read("components/race/editorial-primitives.tsx");

    expect(assets.match(/\/media\/official\//g)?.length ?? 0).toBeGreaterThanOrEqual(20);
    expect(assets).toContain("/media/official/home/hero-desktop.webp");
    expect(assets).toContain("/media/official/drivers/fallback-01.webp");
    expect(assets).toContain("/media/official/stages/stage-02.webp");
    expect(assets).toContain("/media/official/news/news-03.webp");
    expect(manifest.assets.length).toBeGreaterThanOrEqual(24);
    expect(new Set(manifest.assets.map((asset) => asset.path)).size).toBe(manifest.assets.length);
    expect(
      manifest.assets.every(
        (asset) =>
          Math.max(asset.width, asset.height) >= 960 && Math.min(asset.width, asset.height) >= 720,
      ),
    ).toBe(true);
    expect(home).toContain("HomeHeroMediaLayer");
    expect(header).toContain("premiumVisuals.hero");
    expect(primitives).toContain("stageVisual");
    expect(home).not.toContain('src="/media/udk-race-hero.webp"');
  });

  it("optimizes public imagery with next/image", () => {
    const files = [
      "app/page.tsx",
      "components/race/race-header.tsx",
      "components/race/editorial-primitives.tsx",
    ];

    for (const file of files) {
      const source = read(file);
      expect(source).toContain('from "next/image"');
      expect(source).toContain("sizes=");
    }

    const config = read("next.config.ts");
    expect(config).toContain('formats: ["image/avif", "image/webp"]');
    expect(config).toContain("1920");
    expect(config).toContain('hostname: "images.unsplash.com"');
    expect(config).toContain("qualities: [82, 84, 86, 88, 90]");
    expect(config).toContain("turbopack:");
  });

  it("prevents headline and component clipping across viewports", () => {
    const styles = read("app/race.css");
    expect(styles).toContain("overflow-wrap: break-word");
    expect(styles).toContain("text-wrap: balance");
    expect(styles).toContain("min-width: 0");
    expect(styles).toContain("@media (max-width: 1200px)");
    expect(styles).toContain("@media (max-width: 1000px)");
    expect(styles).toContain("@media (max-width: 760px)");
  });
});
