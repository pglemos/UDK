import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const visualAuditSource = readFileSync(
  new URL("../../../.github/scripts/capture-visual-audit.mjs", import.meta.url),
  "utf8",
);

describe("visual audit navigation", () => {
  it("rejects audited public routes that return an unsuccessful HTTP status", () => {
    expect(visualAuditSource).toContain("const navigationResponse = await page.goto");
    expect(visualAuditSource).toContain("!navigationResponse.ok()");
    expect(visualAuditSource).toContain("navigationResponse.status()");
  });
});
