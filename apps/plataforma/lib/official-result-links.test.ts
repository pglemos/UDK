import { describe, expect, it } from "vitest";
import { officialResultPdf, officialResultPdfForResult } from "./official-result-links";

describe("official result PDFs", () => {
  it("maps each combined race to its single general PDF", () => {
    expect(officialResultPdfForResult("Endurance 1h")).toBe(officialResultPdf.endurance);
    expect(officialResultPdfForResult("Corrida 1 - Horário")).toBe(officialResultPdf.corrida1);
    expect(officialResultPdfForResult("Corrida 2 - Anti-horário")).toBe(officialResultPdf.corrida2);
    expect(officialResultPdfForResult("Super Pole")).toBeNull();
  });

  it("keeps the third stage PDFs separate from the second stage", () => {
    expect(
      officialResultPdfForResult(
        "Corrida 1 - Horário",
        "Resultado oficial - 3a etapa - Corrida 1 - Geral",
      ),
    ).toBe(officialResultPdf.etapa3Corrida1);
    expect(
      officialResultPdfForResult(
        "Corrida 2 - Anti-horário",
        "Resultado oficial - 3ª etapa - Corrida 2 - Geral",
      ),
    ).toBe(officialResultPdf.etapa3Corrida2);
    expect(officialResultPdfForResult("Super Pole", "3ª etapa")).toBeNull();
  });
});
