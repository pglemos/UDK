import { describe, expect, it } from "vitest";
import { moduleConfigs } from "./module-config";
import { moduleDescriptions } from "./module-descriptions";

describe("moduleDescriptions", () => {
  it("acompanha a descrição de cada módulo configurado", () => {
    for (const config of moduleConfigs) expect(moduleDescriptions[config.key]).toBe(config.description);
    expect(Object.keys(moduleDescriptions).length).toBe(moduleConfigs.length);
  });
});
