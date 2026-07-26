import { describe, expect, it } from "vitest";
import { normalizePublicContent, normalizePublicSponsor, normalizePublicTerm } from "./public-content";

describe("public CMS data normalization", () => {
  it("normalizes only the public fields used by the portal", () => {
    expect(normalizePublicContent({ slug: "noticia-1", title: "Etapa aberta", content: { summary: "Inscrições abertas" }, published_at: "2026-07-25T12:00:00Z", internal_note: "private" })).toEqual({
      slug: "noticia-1",
      title: "Etapa aberta",
      summary: "Inscrições abertas",
      publishedAt: "2026-07-25T12:00:00Z",
    });
    expect(normalizePublicSponsor({ name: "Marca", slug: "marca", logo_url: "https://cdn/logo.png", website_url: "https://marca.example", tier: "master", secret: "hidden" })).toEqual({
      name: "Marca",
      slug: "marca",
      logoUrl: "https://cdn/logo.png",
      websiteUrl: "https://marca.example",
      tier: "master",
    });
    expect(normalizePublicTerm({ id: "term-1", title: "Regulamento", version: 3, content: "Regras oficiais", effective_at: "2026-07-01T00:00:00Z" })).toEqual({
      id: "term-1",
      title: "Regulamento",
      version: 3,
      content: "Regras oficiais",
      effectiveAt: "2026-07-01T00:00:00Z",
    });
  });
});
