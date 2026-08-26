import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fallbackFederations, fallbackSponsors } from "../lib/public-content-fallbacks";
import { mergeOfficialSponsors } from "../lib/public-content";

const officialSlugs = [
  "firepit-brasil",
  "grupo-emtel",
  "grupo-do-carro",
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
    expect(fallbackSponsors.map((sponsor) => sponsor.slug).sort()).toEqual(
      [...officialSlugs].sort(),
    );
    expect(fallbackSponsors.some((sponsor) => sponsor.slug.includes("pvf"))).toBe(false);
    expect(fallbackSponsors.every((sponsor) => sponsor.tier === "Patrocinador oficial")).toBe(true);
    expect(fallbackSponsors.some((sponsor) => sponsor.slug === "akamig")).toBe(false);
    expect(fallbackSponsors.some((sponsor) => sponsor.slug === "guicosmos-tv")).toBe(false);
  });

  it("keeps federation entities outside the commercial sponsor roster", () => {
    expect(fallbackFederations.map((federation) => federation.slug)).toEqual(["akamig"]);
    expect(fallbackFederations[0]?.label).toBe("Federação parceira");
    expect(existsSync(publicFile("akamig.svg"))).toBe(true);
  });

  it("uses transparent presentation assets instead of embedded logo backgrounds", () => {
    expect(fallbackSponsors.find((sponsor) => sponsor.slug === "firepit-brasil")?.logoUrl).toBe(
      "/sponsors/firepit-brasil.svg",
    );
    expect(
      fallbackSponsors.find((sponsor) => sponsor.slug === "vintage-sao-francisco")?.logoUrl,
    ).toBe("/sponsors/vintage-sao-francisco.svg");
    expect(fallbackSponsors.find((sponsor) => sponsor.slug === "velho-oeste")?.logoUrl).toBe(
      "/sponsors/velho-oeste.png",
    );

    for (const asset of ["grupo-do-carro.svg", "vintage-sao-francisco.svg", "akamig.svg"]) {
      const source = sourceFile(`../public/sponsors/${asset}`);
      expect(source).not.toMatch(/<rect[^>]+fill=["']#(?:fff|ffffff|353535)["']/i);
    }
    expect(existsSync(publicFile("velho-oeste.png"))).toBe(true);
  });

  it("uses local logo assets and only approved Instagram destinations", () => {
    for (const sponsor of fallbackSponsors) {
      const assetName = sponsor.logoUrl.replace("/sponsors/", "");
      expect(assetName).toMatch(new RegExp(`^${sponsor.slug}\\.(svg|webp|png)$`));
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
    expect(page).toContain("fallbackFederations");
    expect(home).toContain("cinema-sponsor-list");
    expect(home).toContain("sponsor.logoUrl");
    expect(home).toContain("cinema-federation-list");
  });

  it("ships an idempotent migration and deterministic pgTAP roster coverage", () => {
    const migration = sourceFile("../../../supabase/migrations/202608060001_official_sponsors.sql");
    const followupMigration = sourceFile(
      "../../../supabase/migrations/20260811220000_official_sponsor_assets.sql",
    );
    const correctionMigration = sourceFile(
      "../../../supabase/migrations/202608250001_official_sponsor_roster_correction.sql",
    );
    const transparentAssetsMigration = sourceFile(
      "../../../supabase/migrations/202608250002_transparent_sponsor_assets.sql",
    );
    const databaseTest = sourceFile("../../../supabase/tests/official_sponsors.sql");

    expect(migration).toContain("pvf-transportes");
    expect(migration).toContain("on conflict (championship_id, slug) do update");
    expect(migration).toContain("Patrocinador oficial");
    expect(migration).toContain("sponsor.status = 'active'");
    expect(databaseTest).not.toContain("\\ir");
    expect(followupMigration).toContain("velho-oeste");
    expect(followupMigration).toContain("/sponsors/velho-oeste.svg");
    expect(correctionMigration).toContain("Grupo do Carro");
    expect(correctionMigration).toContain("grupo-do-carro");
    expect(correctionMigration).toContain("guicosmos-tv");
    expect(correctionMigration).toContain("akamig");
    expect(correctionMigration).toContain("status = 'archived'");
    expect(transparentAssetsMigration).toContain("/sponsors/firepit-brasil.svg");
    expect(transparentAssetsMigration).toContain("/sponsors/vintage-sao-francisco.svg");
    expect(transparentAssetsMigration).toContain("/sponsors/velho-oeste.png");
    expect(databaseTest).toContain("the official roster has exactly seven active sponsors");
    expect(databaseTest).toContain("the active sponsor roster contains no duplicate slugs");
    for (const slug of officialSlugs) {
      expect(correctionMigration).toContain(slug);
      expect(databaseTest).toContain(slug);
    }
  });
});
