import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const temporaryWorkflows = [
  new URL("../../../.github/workflows/apply-final-ui-review.yml", import.meta.url),
  new URL("../../../.github/workflows/finalize-final-ui-review.yml", import.meta.url),
  new URL("../../../.github/workflows/apply-twice-grind-redesign.yml", import.meta.url),
];

describe("repository cleanup", () => {
  it("does not ship temporary repair workflows", () => {
    for (const workflow of temporaryWorkflows) {
      expect(existsSync(workflow), `${workflow.pathname} must be removed`).toBe(false);
    }
  });
});
