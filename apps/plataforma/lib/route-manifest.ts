export const PUBLIC_ROUTES = [
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
] as const;

export const AUTH_ROUTES = ["/login", "/recuperar-senha", "/nova-senha"] as const;
export const PROTECTED_PREFIXES = ["/painel"] as const;
