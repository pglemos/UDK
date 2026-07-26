import { describe, expect, it } from "vitest";
import { dateTimeLocalToIso, isoToDateTimeLocal } from "./datetime";

describe("championship datetime conversion", () => {
  it("stores São Paulo wall time as UTC", () => {
    expect(dateTimeLocalToIso("2026-08-18T21:00", "America/Sao_Paulo")).toBe("2026-08-19T00:00:00.000Z");
  });

  it("restores UTC timestamps as São Paulo wall time", () => {
    expect(isoToDateTimeLocal("2026-08-19T00:00:00.000Z", "America/Sao_Paulo")).toBe("2026-08-18T21:00");
  });

  it("rejects malformed local values", () => {
    expect(() => dateTimeLocalToIso("not-a-date", "America/Sao_Paulo")).toThrow("Data e hora inválidas");
  });
});
