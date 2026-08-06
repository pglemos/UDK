import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fallbackSponsors } from "../lib/public-content-fallbacks";
import { mergeOfficialSponsors } from "../lib/public-content";

const officialSlugs = [
  "akamig",
  "firepit-brasil",
  "grupo-emtel",
  "guicosmos-tv",
  "transfermix",
  "veste-custom-wear",
  "vintage-sao-francisco",
];

const publicFile = (name: string) =>
  fileURLToPath(new URL(`../public/sponsors/${name}`, import.meta.url));

const sourceFile = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

describe("official sponsor roster", () => {
  it("publishes the exact approved roster without PVF", () => {
    expect(fallbackSponsors.map((sponsor) => sponsor.slug).sort()).toEqual(officialSlugs);
    expect(fallbackSponsors.some((sponsor) => sponsor.slug.includes("pvf"))).toBe(false);
    expect(fallbackSponsors.every((sponsor) => sponsor.tier === "Patrocinador oficial")).toBe(true);
  });

  it("uses local SVG logos and Instagram destinations", () => {
    for (const sponsor of fallbackSponsors) {
      expect(sponsor.logoUrl).toBe(`/sponsors/${sponsor.slug}.svg`);
      expect(sponsor.websiteUrl).toMatch(/^https:\/\/www\.instagram\.com\/[A-Za-z0-9_.]+\/$/);
      expect(existsSync(publicFile(`${sponsor.slug}.svg`))).toBe(true);
    }
  });

  it("keeps canonical public data while accepting database rows by slug", () => {
    const merged = mergeOfficialSponsors([
      {
        name: "Nome antigo",
        slug: "grupo-emtel",
        logoUrl: "https://remote.invalid/logo.png",
        websiteUrl: "https://remote.invalid",
        tier: "legacy",
      },
      {
        name: "PVF Transportes",
        slug: "pvf-transportes",
        logoUrl: "/pvf.png",
        websiteUrl: "https://example.invalid",
        tier: "legacy",
      },
    ]);

    expect(merged).toEqual(fallbackSponsors);
    expect(merged.some((sponsor) => sponsor.slug === "pvf-transportes")).toBe(false);
  });

  it("renders logos, Instagram handles and safe external links", () => {
    const page = sourceFile("../app/patrocinadores/page.tsx");

    expect(page).toContain("instagramHandle");
    expect(page).toContain("sponsor.logoUrl");
    expect(page).toContain("sponsor.websiteUrl");
    expect(page).toContain('target="_blank"');
    expect(page).toContain('rel="noreferrer"');
  });

  it("ships migration and pgTAP coverage for two executions", () => {
    const migration = sourceFile("../../../supabase/migrations/202608060001_official_sponsors.sql");
    const databaseTest = sourceFile("../../../supabase/tests/official_sponsors.sql");

    expect(migration).toContain("pvf-transportes");
    expect(migration).toContain("on conflict (championship_id, slug) do update");
    expect(migration).toContain("Patrocinador oficial");
    expect(migration).toContain("sponsor.status = 'active'");
    expect(databaseTest.match(/\ir \.\.\/migrations\/202608060001_official_sponsors\.sql/g)).toHaveLength(2);
    expect(databaseTest).toContain("inactive historical sponsor records are preserved");
    expect(databaseTest).toContain("an approved soft-deleted sponsor is restored");
    for (const slug of officialSlugs) {
      expect(migration).toContain(slug);
      expect(databaseTest).toContain(slug);
    }
  });
});
