import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dependabotConfig = readFileSync(
  new URL("../../../.github/dependabot.yml", import.meta.url),
  "utf8",
);

describe("Dependabot configuration", () => {
  it("does not require repository labels that are not provisioned", () => {
    expect(dependabotConfig).not.toMatch(/labels:\s*\n\s*-\s*dependencies/);
  });
});
