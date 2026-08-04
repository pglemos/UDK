import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const publicCss = [
  "../app/cinema-core.css",
  "../app/cinema-home.css",
  "../app/cinema-pages.css",
  "../app/cinema-responsive.css",
]
  .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
  .join("\n");

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map(
    (offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255,
  ) as [number, number, number];
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];
  const [red, green, blue] = linear;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05);
}

describe("UDK cinematic brand theme", () => {
  it("removes the retired lime accent and hard-coded lime derivatives", () => {
    expect(css).not.toMatch(/--lime(?:-dark)?/i);
    expect(css).not.toMatch(/#dafc08|#687700|#526000/i);
    expect(css).not.toMatch(/rgba\(218,\s*252,\s*8,/i);
    expect(css).not.toMatch(/rgba\(150,\s*174,\s*0,/i);
    expect(publicCss).not.toMatch(/\blime\b|#455000|#9db500|#657500|#eef5c0|#566400/i);
  });

  it("defines the approved cinematic palette and official cyan accent", () => {
    expect(publicCss).toContain("--cinema-black: #050607;");
    expect(publicCss).toContain("--cinema-white: #ffffff;");
    expect(publicCss).toContain("--cinema-paper: #f3f0e8;");
    expect(publicCss).toContain("--cinema-cyan: #00d9ff;");
    expect(publicCss).toContain("--cinema-cyan-deep: #006f82;");
  });

  it("keeps accessible contrast for primary and editorial surfaces", () => {
    expect(contrast("#00d9ff", "#050607")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#111315", "#f3f0e8")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#006f82", "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});
