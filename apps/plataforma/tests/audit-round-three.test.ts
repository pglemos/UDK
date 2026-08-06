import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const repositoryRoot = path.resolve(appRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");
const readRepositoryFile = (file: string) => fs.readFileSync(path.join(repositoryRoot, file), "utf8");

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
    expect(editorial).toContain("const source = driver.avatarUrl ?? fallback.src");
    expect(editorial).toContain("src={source}");
    expect(editorial).toContain("objectPosition: driver.avatarUrl ?");
    expect(editorial).not.toContain('className="driver-fallback-photo"');
    expect(ui).toContain("driverVisual(driver.number || 0)");
  });

  it("uses the same visual fallback in the standings podium", () => {
    const standings = read("app/classificacao/page.tsx");

    expect(standings).toContain('import Image from "next/image"');
    expect(standings).toContain("driverVisual(index)");
    expect(standings).toContain("tg-standing-podium-fallback");
  });

  it("locks poster media dimensions after every earlier visual override", () => {
    const race = read("app/race.css");
    const css = read("app/audit-round-three.css");

    expect(race).toContain('@import "./audit-round-three.css";');
    expect(race.indexOf("audit-round-three.css")).toBeGreaterThan(race.indexOf("audit-round-two.css"));
    expect(css).toContain(".cinema-driver-poster-media,");
    expect(css).toContain("position: absolute !important");
    expect(css).toContain("inset: 0 !important");
    expect(css).toContain("height: 100% !important");
    expect(css).toContain("min-height: 100% !important");
    expect(css).toContain(".tg-standing-podium-fallback img");
    expect(css).toContain(".race-driver-visual.is-fallback img");
  });

  it("renders a deterministic countdown shell before the client clock starts", () => {
    const motion = read("components/race/motion.tsx");

    expect(motion).toContain("useState<CountdownValue | null>(null)");
    expect(motion).toContain("if (!target || value === null)");
    expect(motion).not.toContain("useState<CountdownValue>(() =>");
  });

  it("rejects invalid natural image dimensions", () => {
    const audit = readRepositoryFile(".github/scripts/capture-visual-audit.mjs");

    expect(audit).toContain("item.naturalWidth < 2");
    expect(audit).toContain("item.naturalHeight < 2");
  });

  it("audits official imagery and the poster-backed Home video", () => {
    const audit = readRepositoryFile(".github/scripts/capture-visual-audit.mjs");

    expect(audit).toContain('document.querySelectorAll("video")');
    expect(audit).toContain("readyState");
    expect(audit).toContain("networkState");
    expect(audit).toContain("videoFailures");
    expect(audit).toContain("poster");
    expect(audit).toContain('url.includes("/media/official/")');
    expect(audit).toContain("media%2Fofficial");
  });

  it("fails browser audits on page, console and official media request errors", () => {
    const audit = readRepositoryFile(".github/scripts/capture-visual-audit.mjs");

    expect(audit).toContain('page.on("console"');
    expect(audit).toContain('message.type() === "error"');
    expect(audit).toContain("consoleErrors");
    expect(audit).toContain("pageErrors.length || consoleErrors.length || requestFailures.length");
    expect(audit).toContain("runtimeFailures");
  });

  it("persists capture diagnostics even when an individual route throws", () => {
    const audit = readRepositoryFile(".github/scripts/capture-visual-audit.mjs");

    expect(audit).toContain("captureFailures");
    expect(audit).toContain('type: "capture"');
    expect(audit).toContain("finally");
    expect(audit).toContain("await page.close()");
    expect(audit).toContain("writeDiagnostics");
    expect(audit).toContain(
      "failures: [...mediaFailures, ...videoFailures, ...runtimeFailures, ...captureFailures]",
    );
  });
});
