import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

describe("second full visual audit safeguards", () => {
  it("loads the second audit stylesheet after every previous visual layer", () => {
    const race = read("app/race.css");
    expect(race).toContain('@import "./audit-round-two.css";');
    expect(race.indexOf('audit-round-two.css')).toBeGreaterThan(race.indexOf('final-audit-overrides.css'));
  });

  it("prevents the featured news title from overflowing its desktop column", () => {
    const css = read("app/audit-round-two.css");
    expect(css).toContain(".tg-news-directory-feature > a");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) minmax(430px, 0.82fr)");
    expect(css).toContain(".tg-news-directory-feature a > div:last-child");
    expect(css).toContain("min-width: 0");
    expect(css).toContain(".tg-news-directory-feature h2");
    expect(css).toContain("max-width: 100%");
  });

  it("keeps category tabs and the regulation index readable on small screens", () => {
    const css = read("app/audit-round-two.css");
    expect(css).toContain(".tg-category-tabs");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(css).toContain(".tg-regulation-layout > nav");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  });

  it("uses the attached official UDK wordmarks instead of the legacy repository logo", () => {
    const logo = read("components/race/official-logo.tsx");
    const assets = read("lib/official-brand-assets.ts");
    expect(logo).toContain("officialBrandAssets");
    expect(assets).toContain("data:image/png;base64,");
    expect(logo).not.toContain("/brand/udk-logo-negativa.png");
  });

  it("pins the official logo inside the authentication artwork", () => {
    const css = read("app/audit-round-two.css");
    expect(css).toContain(".race-auth-visual > a:first-child");
    expect(css).toContain("position: absolute");
    expect(css).toContain("z-index: 5");
  });
});
