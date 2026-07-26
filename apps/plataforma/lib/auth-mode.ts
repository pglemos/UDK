export type AuthMode = "signin" | "signup" | "reset" | "recovery";

export function authModeForPath(value: string): AuthMode {
  const url = new URL(value, "https://udk.local");

  if (url.pathname === "/nova-senha") return "recovery";
  if (url.pathname === "/recuperar-senha") return "reset";
  if (url.pathname === "/login" && url.searchParams.get("cadastro") === "1") return "signup";
  return "signin";
}

export function passwordRecoveryRedirect(origin: string): string {
  return new URL("/nova-senha", origin).toString();
}

export function registrationDestination(hasSession: boolean): string {
  return hasSession ? "/painel/inscricoes" : "/login?cadastro=1";
}
