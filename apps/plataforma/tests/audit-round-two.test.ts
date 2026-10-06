import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");

describe("second full visual audit safeguards", () => {
  it("consolidates previously competing visual layers", () => {
    const race = read("app/race.css");
    expect(race).not.toContain("@import");
    expect(race).toContain(".race-search-field");
  });

  it("prevents the featured news title from overflowing its desktop column", () => {
    const css = read("app/race.css");
    expect(css).toContain(".tg-news-directory-feature > a");
    expect(css).toContain("grid-template-columns: 1.2fr 1fr");
    expect(css).toContain("min-width: 0");
    expect(css).toContain("overflow-wrap: break-word");
  });

  it("keeps category tabs and the regulation index readable on small screens", () => {
    const css = read("app/race.css");
    expect(css).toContain(".udk-category-tabs");
    expect(css).toContain(".tg-regulation-layout nav");
    expect(css).toContain("white-space: nowrap");
    expect(css).toContain("position: static");
  });

  it("uses the attached official UDK wordmarks instead of the legacy repository logo", () => {
    const logo = read("components/race/official-logo.tsx");
    const assets = read("lib/official-brand-assets.ts");
    const white = read("public/brand/udk-wordmark-white.svg");
    const dark = read("public/brand/udk-wordmark-dark.svg");

    expect(logo).toContain("officialBrandAssets");
    expect(assets).toContain("/brand/udk-wordmark-white.svg");
    expect(assets).toContain("/brand/udk-wordmark-dark.svg");
    expect(white).toContain('viewBox="0 0 2000 402"');
    expect(dark).toContain('viewBox="0 0 2000 402"');
    expect(logo).not.toContain("/brand/udk-logo-negativa.png");
  });

  it("renders only the official UDK wordmark in the header lockup", () => {
    const header = read("components/race/race-header.tsx");
    expect(header).toContain("<OfficialLogo");
    expect(header).toContain('variant="negative"');
    expect(header).not.toContain("race-brand-wordmark");
    expect(header).not.toContain("<strong>ULTRAS</strong>");
  });

  it("keeps the access logo in the layout flow above the heading", () => {
    const css = read("app/race.css");
    expect(css).toContain(".race-auth-visual > a:first-child img");
    expect(css).toContain(".race-auth-copy");
    expect(css).toContain("flex-direction: column");
    expect(css).toContain("justify-content: space-between");
  });
});
