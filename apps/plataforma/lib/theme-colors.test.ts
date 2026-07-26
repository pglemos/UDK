import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

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

describe("UDK cyan brand theme", () => {
  it("removes the retired lime accent and hard-coded lime derivatives", () => {
    expect(css).not.toMatch(/--lime(?:-dark)?/i);
    expect(css).not.toMatch(/#dafc08|#687700|#526000/i);
    expect(css).not.toMatch(/rgba\(218,\s*252,\s*8,/i);
    expect(css).not.toMatch(/rgba\(150,\s*174,\s*0,/i);
  });

  it("defines the approved cyan design tokens", () => {
    expect(css).toContain("--cyan: #00d9ff;");
    expect(css).toContain("--cyan-hover: #32e5ff;");
    expect(css).toContain("--cyan-deep: #00687a;");
    expect(css).toContain("--cyan-glow: #004653;");
  });

  it("keeps accessible contrast for primary and text uses", () => {
    expect(contrast("#00d9ff", "#1c191f")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#00687a", "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});
