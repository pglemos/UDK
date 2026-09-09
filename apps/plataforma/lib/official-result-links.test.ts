import { describe, expect, it } from "vitest";
import { officialResultPdf, officialResultPdfForResult } from "./official-result-links";

describe("official result PDFs", () => {
  it("maps each combined race to its single general PDF", () => {
    expect(officialResultPdfForResult("Endurance 1h")).toBe(officialResultPdf.endurance);
    expect(officialResultPdfForResult("Corrida 1 - Horário")).toBe(officialResultPdf.corrida1);
    expect(officialResultPdfForResult("Corrida 2 - Anti-horário")).toBe(officialResultPdf.corrida2);
    expect(officialResultPdfForResult("Super Pole")).toBeNull();
  });
});
