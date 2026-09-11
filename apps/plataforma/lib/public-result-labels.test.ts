import { describe, expect, it } from "vitest";
import {
  resultHeadingLabel,
  resultSessionLabel,
  resultStageLabel,
} from "./public-result-labels";

describe("public result labels", () => {
  const corrida = {
    title: "Resultado oficial - 2a etapa - Corrida 1 - Geral",
    stageTitle: "Etapa regular",
    stageSlug: "etapa-regular-72ee40f8",
    sessionName: "Corrida 1 - Horário",
  };

  it("normalizes the stage ordinal from the official title", () => {
    expect(resultStageLabel(corrida)).toBe("2ª etapa");
  });

  it("keeps a concise session label for indexes", () => {
    expect(resultSessionLabel(corrida)).toBe("Corrida 1");
  });

  it("combines stage and session for archive headings", () => {
    expect(resultHeadingLabel(corrida)).toBe("2ª etapa · Corrida 1");
  });

  it("falls back to the stage title when no ordinal exists", () => {
    expect(
      resultStageLabel({
        ...corrida,
        title: "Corrida 1",
        stageTitle: "Etapa regular",
      }),
    ).toBe("Etapa regular");
  });
});
