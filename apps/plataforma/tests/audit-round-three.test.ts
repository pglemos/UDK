import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

describe("third visual audit safeguards", () => {
  it("assigns contextual hero artwork instead of repeating one image on every route", () => {
    const assets = read("lib/visual-assets.ts");
    const ui = read("components/race/ui.tsx");

    expect(assets).toContain("export function pageHeroVisual");
    expect(ui).toContain("pageHeroVisual(index)");
    expect(ui).not.toContain("src={premiumVisuals.race.src}");
  });

  it("renders a real racing visual when a driver has no uploaded portrait", () => {
    const assets = read("lib/visual-assets.ts");
    const editorial = read("components/race/editorial-primitives.tsx");
    const ui = read("components/race/ui.tsx");

    expect(assets).toContain("export function driverVisual");
    expect(editorial).toContain("driverVisual(index)");
    expect(editorial).toMatch(/driver\.avatarUrl[\s\S]*className="driver-fallback-photo"/);
    expect(editorial).toMatch(/className="driver-fallback-photo"[\s\S]{0,260}loading="eager"/);
    expect(ui).toContain("driverVisual(driver.number || 0)");
  });

  it("uses the same visual fallback in the standings podium", () => {
    const standings = read("app/classificacao/page.tsx");

    expect(standings).toContain('import Image from "next/image"');
    expect(standings).toContain("driverVisual(index)");
    expect(standings).toContain("tg-standing-podium-fallback");
  });

  it("loads final fallback styling after every earlier visual override", () => {
    const race = read("app/race.css");
    const css = read("app/audit-round-three.css");

    expect(race).toContain('@import "./audit-round-three.css";');
    expect(race.indexOf("audit-round-three.css")).toBeGreaterThan(race.indexOf("audit-round-two.css"));
    expect(css).toContain(".cinema-driver-fallback img");
    expect(css).toContain(".tg-standing-podium-fallback img");
    expect(css).toContain(".race-driver-visual.is-fallback img");
  });
});
