import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const required = [
  "public/brand/udk-logo-negativa.png",
  "public/icons/udk-avatar-512.png",
  "public/media/udk-race-hero.webp",
];

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("official UDK identity", () => {
  it("publishes the approved logo, avatar and race hero", () => {
    required.forEach((path) => expect(existsSync(path), path).toBe(true));
    expect(sha256("public/icons/udk-avatar-512.png")).toBe("15997ebc97457e085d23007ead2e18f7e266b99948fecf047746ce0d7642c382");
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
    const css = ["app/race-core.css", "app/race-components.css", "app/race-responsive.css"].map((path) => readFileSync(path, "utf8")).join("\n");
    expect(logo).toContain("/brand/udk-logo-negativa.png");
    expect(css).toContain("#00d9ff");
  });
});
