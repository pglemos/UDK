import { describe, expect, it } from "vitest";
import { AUTH_ROUTES, PROTECTED_PREFIXES, PUBLIC_ROUTES } from "./route-manifest";

describe("single application route manifest", () => {
  it("contains every approved public route", () => {
    expect(PUBLIC_ROUTES).toEqual([
      "/",
      "/classificacao",
      "/calendario",
      "/resultados",
      "/pilotos",
      "/pilotos/[slug]",
      "/regulamento",
      "/noticias",
      "/patrocinadores",
      "/inscricao",
    ]);
  });

  it("separates authentication and protected surfaces", () => {
    expect(AUTH_ROUTES).toEqual(["/login", "/recuperar-senha", "/nova-senha"]);
    expect(PROTECTED_PREFIXES).toEqual(["/painel"]);
  });
});
