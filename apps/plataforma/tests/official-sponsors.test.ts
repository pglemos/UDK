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
  "velho-oeste",
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

  it("uses local logo assets and only approved Instagram destinations", () => {
    for (const sponsor of fallbackSponsors) {
      const assetName = sponsor.logoUrl.replace("/sponsors/", "");
      expect(assetName).toMatch(new RegExp(`^${sponsor.slug}\\.(svg|webp)$`));
      expect(
        sponsor.websiteUrl === "" ||
          /^https:\/\/www\.instagram\.com\/[A-Za-z0-9_.]+\/$/.test(sponsor.websiteUrl),
      ).toBe(true);
      expect(existsSync(publicFile(assetName))).toBe(true);
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
    const home = sourceFile("../app/page.tsx");

    expect(page).toContain("instagramHandle");
    expect(page).toContain("sponsor.logoUrl");
    expect(page).toContain("sponsor.websiteUrl");
    // A10 — a grade de patrocinadores fica abaixo da dobra, carrega lazy.
    expect(page).toContain('loading="lazy"');
    expect(page).toContain('target="_blank"');
    expect(page).toContain('rel="noreferrer"');
    expect(home).toContain("cinema-sponsor-list");
    expect(home).toContain("sponsor.logoUrl");
  });

  it("ships an idempotent migration and deterministic pgTAP roster coverage", () => {
    const migration = sourceFile("../../../supabase/migrations/202608060001_official_sponsors.sql");
    const followupMigration = sourceFile(
      "../../../supabase/migrations/20260811220000_official_sponsor_assets.sql",
    );
    const databaseTest = sourceFile("../../../supabase/tests/official_sponsors.sql");

    expect(migration).toContain("pvf-transportes");
    expect(migration).toContain("on conflict (championship_id, slug) do update");
    expect(migration).toContain("Patrocinador oficial");
    expect(migration).toContain("sponsor.status = 'active'");
    expect(databaseTest).not.toContain("\\ir");
    expect(followupMigration).toContain("velho-oeste");
    expect(followupMigration).toContain("/sponsors/velho-oeste.svg");
    expect(databaseTest).toContain("the official roster has exactly eight active sponsors");
    expect(databaseTest).toContain("the active sponsor roster contains no duplicate slugs");
    for (const slug of officialSlugs) {
      expect(followupMigration).toContain(slug);
      expect(databaseTest).toContain(slug);
    }
  });
});
