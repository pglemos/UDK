import { describe, expect, it } from "vitest";
import { parseRegulationSections } from "./regulation-sections";

describe("regulation section headings", () => {
  it("keeps every title and rule when the published text starts with blank lines", () => {
    expect(
      parseRegulationSections(
        "\n\n  01. FORMATO DA TEMPORADA\nO campeonato possui 05 etapas.\n\n\n  02. DESCARTES\nOs 02 piores resultados são descartados.\n\n",
      ),
    ).toEqual([
      {
        id: "secao-1",
        heading: "01. FORMATO DA TEMPORADA",
        body: "O campeonato possui 05 etapas.",
      },
      { id: "secao-2", heading: "02. DESCARTES", body: "Os 02 piores resultados são descartados." },
    ]);
  });
});
