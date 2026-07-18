import { describe, expect, it } from "vitest";
import { getModuleConfig, moduleConfigs } from "./module-config";

describe("module configuration", () => {
  it("uses unique module keys", () => {
    const keys = moduleConfigs.map((moduleConfig) => moduleConfig.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("declares a title column and at least one field for every module", () => {
    for (const moduleConfig of moduleConfigs) {
      expect(moduleConfig.titleColumn.length).toBeGreaterThan(0);
      expect(moduleConfig.fields.length).toBeGreaterThan(0);
    }
  });

  it("exposes every required championship operation", () => {
    const required = [
      "pilotos",
      "inscricoes",
      "documentos",
      "financeiro",
      "calendario",
      "resultados",
      "classificacao",
      "importacoes",
      "ocorrencias",
      "julgamentos",
      "recursos",
      "endurance",
      "stints",
      "conteudo",
      "patrocinadores",
      "notificacoes",
      "responsaveis",
      "termos",
      "aceites",
      "mudancas-categoria",
      "sessoes",
      "checkin",
      "karts",
      "pontuacao",
      "voltas",
      "evidencias",
      "membros-endurance",
      "campanhas",
      "versoes-conteudo",
      "usuarios-patrocinador",
      "permissoes",
    ];

    for (const key of required) {
      expect(getModuleConfig(key), `missing module ${key}`).toBeDefined();
    }
  });
});
