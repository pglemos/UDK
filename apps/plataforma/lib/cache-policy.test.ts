import { describe, expect, it } from "vitest";
import { shouldCachePublicRequest } from "./cache-policy";

describe("single-app service worker cache policy", () => {
  it("allows only public GET navigation and static assets", () => {
    expect(shouldCachePublicRequest({ path: "/", method: "GET" })).toBe(true);
    expect(shouldCachePublicRequest({ path: "/classificacao", method: "GET" })).toBe(true);
    expect(shouldCachePublicRequest({ path: "/_next/static/app.js", method: "GET" })).toBe(true);
  });

  it("rejects authenticated, authentication, API and RSC requests", () => {
    expect(shouldCachePublicRequest({ path: "/painel", method: "GET" })).toBe(false);
    expect(shouldCachePublicRequest({ path: "/login", method: "GET" })).toBe(false);
    expect(shouldCachePublicRequest({ path: "/recuperar-senha", method: "GET" })).toBe(false);
    expect(shouldCachePublicRequest({ path: "/nova-senha", method: "GET" })).toBe(false);
    expect(shouldCachePublicRequest({ path: "/api/health", method: "GET" })).toBe(false);
    expect(shouldCachePublicRequest({ path: "/classificacao", method: "GET", isRsc: true })).toBe(false);
    expect(shouldCachePublicRequest({ path: "/", method: "POST" })).toBe(false);
  });
});
