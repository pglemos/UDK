import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

describe("responsive layout safeguards", () => {
  it("loads the final browser-audit stylesheet", () => {
    expect(read("app/race.css")).toContain('@import "./audit-fixes.css";');
  });

  it("keeps podium values and calendar links on readable lines", () => {
    const css = read("app/audit-fixes.css");
    expect(css).toContain(".tg-standing-podium-card > b");
    expect(css).toContain("white-space: nowrap");
    expect(css).toContain(".tg-calendar-stage > .tg-arrow-link");
  });

  it("keeps driver cards readable on dark media", () => {
    const css = read("app/audit-fixes.css");
    expect(css).toContain(".tg-driver-poster");
    expect(css).toContain("color: var(--cinema-white)");
  });

  it("uses verified stage visuals and resolves legacy placeholders", () => {
    const assets = read("lib/visual-assets.ts");
    const calendar = read("app/calendario/page.tsx");
    const primitives = read("components/race/editorial-primitives.tsx");

    expect(assets).toContain("photo-1505570554449-69ce7d4fa36b");
    expect(assets).toContain("photo-1560990816-bb30289c6611");
    expect(assets).not.toContain('src: "https://images.unsplash.com/photo-1752348512364-fac974d4d5b0');
    expect(assets).toContain('"photo-1752348512364-fac974d4d5b0"');
    expect(calendar).toContain("resolveVisualSource");
    expect(primitives).toContain("resolveVisualSource");
  });
});
