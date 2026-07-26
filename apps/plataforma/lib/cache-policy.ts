export type PublicCacheRequest = {
  path: string;
  method: string;
  isRsc?: boolean;
};

const PRIVATE_PREFIXES = [
  "/painel",
  "/login",
  "/recuperar-senha",
  "/nova-senha",
  "/api",
];

export function shouldCachePublicRequest(request: PublicCacheRequest): boolean {
  if (request.method.toUpperCase() !== "GET" || request.isRsc) return false;
  if (PRIVATE_PREFIXES.some((prefix) => request.path === prefix || request.path.startsWith(`${prefix}/`))) {
    return false;
  }
  return request.path === "/" || request.path.startsWith("/_next/static/") || !request.path.startsWith("/_next/");
}
