import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const required = [
  "public/brand/udk-logo-negativa.png",
  "public/icons/udk-avatar-512.png",
  "public/media/udk-race-hero.webp",
];

function readPublicStyles(): string {
  return readdirSync("app")
    .filter((file) => /^tg-.*\.css$/.test(file))
    .sort()
    .map((file) => readFileSync(`app/${file}`, "utf8"))
    .join("\n");
}

describe("official UDK identity", () => {
  it("publishes the approved logo, avatar and race hero", () => {
    required.forEach((path) => expect(existsSync(path), path).toBe(true));
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

  it("keeps cyan in the interface without recoloring the official logo", () => {
    const logo = readFileSync("components/race/official-logo.tsx", "utf8");
    const css = readPublicStyles();

    expect(logo).toContain("/brand/udk-logo-negativa.png");
    expect(logo).toContain("/icons/udk-avatar-512.png");
    expect(css).toContain("#00d9ff");
    expect(logo).not.toMatch(/filter:|fill=.*00d9ff|stroke=.*00d9ff/i);
  });
});
