import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..");
const repositoryRoot = path.resolve(appRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(appRoot, file), "utf8");
const readRepositoryFile = (file: string) =>
  fs.readFileSync(path.join(repositoryRoot, file), "utf8");

describe("third visual audit safeguards", () => {
  it("keeps data page headings focused on the page content", () => {
    const ui = read("components/race/ui.tsx");

    expect(ui).not.toContain("pageHeroVisual(index)");
    expect(ui).toContain("<h1>{title}</h1>");
    expect(ui).not.toContain("src={premiumVisuals.race.src}");
  });

  it("renders an honest photo placeholder when a driver has no published portrait", () => {
    const editorial = read("components/race/editorial-primitives.tsx");
    const ui = read("components/race/ui.tsx");

    expect(editorial).toContain("driverVisual(index)");
    expect(editorial).toContain("resolveVisualSource(driver.avatarUrl, fallback)");
    expect(editorial).toContain("hasPublishedPortrait");
    expect(editorial).toContain('import { DriverPlaceholder } from "./driver-placeholder"');
    expect(editorial).toContain("<DriverPlaceholder name={driver.name} />");
    expect(editorial).not.toContain('className="driver-fallback-photo"');
    expect(ui).toContain("driverVisual(driver.number ?? 0)");
    expect(ui).toContain("<DriverPlaceholder name={driver.name}");
  });

  it("keeps one authoritative standings table without a redundant leader block", () => {
    const standings = read("app/classificacao/page.tsx");

    expect(standings).toContain(
      'getStandingsPage({ page: 1, pageSize: 1, category, sort: "points" })',
    );
    expect(standings).toContain("leader.items[0]?.points");
    expect(standings).toContain("driver.rankingPosition");
    expect(standings).not.toContain('className="tg-standing-leaders"');
    expect(standings).not.toContain("leaders.items.slice(0, 3)");
    expect(standings).not.toContain('import Image from "next/image"');
  });

  it("reserves real dimensions for portraits and their honest placeholders", () => {
    const css = read("app/race.css");
    expect(css).toContain(".cinema-driver-poster-media");
    expect(css).toContain("height: 230px");
    expect(css).toContain("height: 170px");
    expect(css).toContain(".race-driver-visual");
  });

  it("locks the profile hero fill surface and shared touch targets", () => {
    const css = read("app/race.css");
    expect(css).toContain(".tg-driver-profile-media");
    expect(css).toContain(".race-password-toggle");
    expect(css).toContain("min-height: 44px");
    expect(css).toContain("min-width: 44px");
    expect(css).toContain(".udk-data-table td:last-child > a");
  });

  it("gives the cinematic news cover a deterministic fill containing block", () => {
    const css = read("app/race.css");
    expect(css).toContain(".tg-article-cover");
    expect(css).toContain("position: relative");
    expect(css).toContain("height: clamp(250px, 40vw, 550px)");
  });

  it("keeps the mobile menu out of the accessibility tree while closed", () => {
    const header = read("components/race/race-header.tsx");
    expect(header).toContain('role="dialog"');
    expect(header).toContain('aria-modal="true"');
    expect(header).toContain("inert={!open}");
    expect(header).toContain('document.querySelectorAll<HTMLElement>(".race-site > *")');
    expect(header).toContain('element.setAttribute("inert", "")');
    expect(header).toContain('element.removeAttribute("inert")');
    expect(header).toContain("onPointerDown={(event) => event.preventDefault()}");
    expect(header).toContain("autoFocus={open}");
    expect(header).toContain("element.focus({ preventScroll: true })");
    expect(header).toContain("requestAnimationFrame");
    expect(header).toContain("setTimeout(focusClose, 120)");
    expect(header).toContain("const focusTrigger = useCallback");
  });

  it("does not block the initial route with a long cinematic curtain", () => {
    const shell = read("components/race/race-shell.tsx");
    expect(shell).not.toContain("CinematicIntro");
    expect(shell).not.toContain("CinematicRouteCurtain");
    expect(shell).not.toContain("CinematicPointer");
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

  it("uses bundled Chromium by default and an explicit workflow channel override", () => {
    const audit = readRepositoryFile(".github/scripts/capture-visual-audit.mjs");
    const workflow = readRepositoryFile(".github/workflows/visual-audit.yml");

    expect(audit).toContain("const browserChannel = process.env.VISUAL_AUDIT_BROWSER_CHANNEL;");
    expect(audit).not.toContain('?? "chrome"');
    expect(audit).toContain("...(browserChannel ? { channel: browserChannel } : {})");
    expect(workflow).toContain("VISUAL_AUDIT_BROWSER_CHANNEL: chrome");
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
