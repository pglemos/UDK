import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

describe("UDK visual quality regressions", () => {
  it("loads the editorial type system through next/font", () => {
    const layout = read("app/layout.tsx");
    const core = read("app/cinema-core.css");

    expect(layout).toContain('from "next/font/google"');
    expect(layout).toContain("Syne");
    expect(layout).toContain("Manrope");
    expect(layout).toContain("className={`${display.variable} ${body.variable}`}");
    expect(core).not.toContain("fonts.googleapis.com");
    expect(core).toContain("var(--font-display)");
    expect(core).toContain("var(--font-body)");
  });

  it("uses multiple high-resolution visual sources instead of the 713px fallback", () => {
    const assets = read("lib/visual-assets.ts");
    const home = read("app/page.tsx");
    const header = read("components/race/race-header.tsx");
    const primitives = read("components/race/editorial-primitives.tsx");

    expect(assets.match(/images\.unsplash\.com/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(assets).toContain("w=2400");
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
    expect(config).toContain('hostname: "images.unsplash.com"');
  });

  it("prevents headline and component clipping across viewports", () => {
    const refinement = read("app/visual-quality.css");

    expect(refinement).toContain("overflow-wrap: anywhere");
    expect(refinement).toContain("text-wrap: balance");
    expect(refinement).toContain("min-width: 0");
    expect(refinement).toContain("@media (max-width: 1120px)");
    expect(refinement).toContain("@media (max-width: 760px)");
    expect(refinement).toContain("@media (max-width: 460px)");
    expect(refinement).not.toContain("white-space: nowrap");
  });
});
