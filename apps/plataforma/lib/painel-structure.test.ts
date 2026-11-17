import { describe, expect, it } from "vitest";
import { getModuleConfig } from "./module-config";
import {
  allModuleKeys,
  moduleHref,
  panelSections,
  resolveRoute,
  roleAccess,
  roleOrder,
  writableModulesByRole,
} from "./painel-structure";

// telas sob medida que não usam a configuração genérica de módulo
const customModules = new Set([
  "dashboard",
  "pilotos",
  "checkin",
  "karts",
  "voltas",
  "entradas-resultado",
  "resultados",
  "classificacao",
  "pontuacao",
  "conteudo",
  "patrocinadores",
  "campeonato",
  "relatorios",
  "equipe",
  "papeis",
]);

describe("estrutura do painel", () => {
  it("mantém o menu enxuto", () => {
    expect(panelSections.length).toBeLessThanOrEqual(10);
  });

  it("toda aba tem uma tela", () => {
    for (const section of panelSections)
      for (const tab of section.tabs)
        expect(customModules.has(tab.module) || Boolean(getModuleConfig(tab.module)), tab.module).toBe(true);
  });

  it("não repete módulo nem endereço", () => {
    const modules = panelSections.flatMap((section) => section.tabs.map((tab) => tab.module));
    expect(new Set(modules).size).toBe(modules.length);
    const hrefs = modules.map(moduleHref);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("resolve cada endereço para a aba certa", () => {
    for (const section of panelSections)
      for (const tab of section.tabs) {
        const route = resolveRoute(moduleHref(tab.module).split("/").filter(Boolean).slice(1));
        expect(route?.tab.module).toBe(tab.module);
      }
    expect(resolveRoute(undefined)?.tab.module).toBe("dashboard");
  });

  it("endereços antigos deixaram de existir", () => {
    for (const old of ["inscricoes", "aceites", "sessoes", "endurance", "stints", "permissoes", "entradas-resultado"])
      expect(resolveRoute([old])).toBeNull();
  });

  it("quem edita também vê, e todo módulo citado existe", () => {
    const known = new Set(allModuleKeys);
    for (const role of roleOrder) {
      for (const key of writableModulesByRole[role]) expect(roleAccess[role]).toContain(key);
      for (const key of roleAccess[role]) expect(known.has(key), `${role}: ${key}`).toBe(true);
    }
  });
});
