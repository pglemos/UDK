import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const required = [
  "public/brand/udk-logo-negativa.svg",
  "public/brand/udk-logo-principal.svg",
  "public/brand/udk-marca-branca.svg",
  "public/icons/udk-avatar-512.png",
  "public/media/udk-race-hero.webp",
];

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("official UDK identity", () => {
  it("publishes the approved logo, mark, avatar and race hero", () => {
    required.forEach((path) => expect(existsSync(path), path).toBe(true));
    expect(sha256("public/brand/udk-logo-negativa.svg")).toBe(
      "1041461a1157862bf52ce796068e1cc128965f3f6fccf4ecacaf0424c258607a",
    );
    expect(sha256("public/brand/udk-marca-branca.svg")).toBe(
      "7c90e431f12b5df043e725383d17e70c0c3eca2edf56b8d49a1d8aaa5408ed86",
    );
  });

  it("removes the synthetic legacy mark from application sources", () => {
    const files = [
      "app/layout.tsx",
      "app/manifest.ts",
      "components/auth-screen.tsx",
      "components/race/official-logo.tsx",
      "public/offline.html",
      "public/sw.js",
    ];
    files.forEach((path) => expect(readFileSync(path, "utf8")).not.toContain("/udk.svg"));
  });

  it("keeps cyan as interface color instead of recoloring the logo", () => {
    const logo = readFileSync("components/race/official-logo.tsx", "utf8");
    const css = [
      "app/race-premium-core.css",
      "app/race-premium-pages.css",
      "app/race-premium-footer.css",
      "app/race-premium-responsive.css",
    ].map((path) => readFileSync(path, "utf8")).join("\n");

    expect(logo).toContain("/brand/udk-logo-negativa.svg");
    expect(css).toContain("#00d9ff");
    expect(logo).not.toMatch(/filter:|fill=.*00d9ff|stroke=.*00d9ff/i);
  });
});
