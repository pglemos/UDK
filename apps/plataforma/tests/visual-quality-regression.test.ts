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
    const entry = read("app/race.css");
    const refinement = read("app/visual-quality.css");

    expect(layout).toContain('from "next/font/google"');
    expect(layout).toContain("Syne");
    expect(layout).toContain("Manrope");
    expect(layout).toContain('data-scroll-behavior="smooth"');
    expect(layout).toContain("className={`${display.variable} ${body.variable}`}");
    expect(entry).toContain('@import "./visual-quality.css";');
    expect(refinement).toContain("var(--font-display)");
    expect(refinement).toContain("var(--font-body)");
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
    expect(assets).toContain("/media/official/stages/stage-05.webp");
    expect(assets).toContain("/media/official/news/news-03.webp");
    expect(manifest.assets).toHaveLength(24);
    expect(new Set(manifest.assets.map((asset) => asset.path)).size).toBe(24);
    expect(
      manifest.assets.every(
        (asset) =>
          Math.max(asset.width, asset.height) >= 960 && Math.min(asset.width, asset.height) >= 720,
      ),
    ).toBe(true);
    expect(home).toContain("premiumVisuals");
    expect(header).toContain("menuVisuals");
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
    const refinement = read("app/visual-quality.css");

    expect(refinement).toContain("overflow-wrap: anywhere");
    expect(refinement).toContain("overflow-wrap: break-word");
    expect(refinement).toContain("text-wrap: balance");
    expect(refinement).toContain("min-width: 0");
    expect(refinement).toContain("@media (max-width: 1120px)");
    expect(refinement).toContain("@media (max-width: 760px)");
    expect(refinement).toContain("@media (max-width: 460px)");
    expect(refinement).not.toContain("white-space: nowrap");
  });
});
