import { describe, expect, it } from "vitest";
import { authModeForPath, passwordRecoveryRedirect, registrationDestination } from "./auth-mode";

describe("unified authentication routes", () => {
  it("maps dedicated routes to explicit authentication modes", () => {
    expect(authModeForPath("/login")).toBe("signin");
    expect(authModeForPath("/login?cadastro=1")).toBe("signup");
    expect(authModeForPath("/recuperar-senha")).toBe("reset");
    expect(authModeForPath("/nova-senha")).toBe("recovery");
  });

  it("keeps password recovery on the unified application origin", () => {
    expect(passwordRecoveryRedirect("https://udk-ultras-kart.vercel.app/"))
      .toBe("https://udk-ultras-kart.vercel.app/nova-senha");
  });

  it("sends authenticated registration visitors to the panel and guests to signup", () => {
    expect(registrationDestination(true)).toBe("/painel/inscricoes");
    expect(registrationDestination(false)).toBe("/login?cadastro=1");
  });
});
