import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { dependencies?: Record<string, string> };

describe("React runtime versions", () => {
  it("keeps react and react-dom on the same version", () => {
    expect(packageJson.dependencies?.["react-dom"]).toBe(packageJson.dependencies?.react);
  });
});
