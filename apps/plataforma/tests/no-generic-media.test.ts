import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function source(path: string): string {
  return readFileSync(`${root}/${path}`, "utf8");
}

// Keep stock-photo hosts blocked at fallback, database, rendering, and metadata boundaries.
const genericHosts = [
  "images.unsplash.com",
  "source.unsplash.com",
  "unsplash.com",
  "images.pexels.com",
  "pexels.com",
  "cdn.pixabay.com",
  "pixabay.com",
  "picsum.photos",
  "loremflickr.com",
];

describe("official media only", () => {
  it("does not keep generic stock-photo URLs in public fallback content", () => {
    const fallbackContent = source("lib/public-content-fallbacks.ts");

    for (const host of genericHosts) {
      expect(fallbackContent).not.toContain(host);
    }

    expect(fallbackContent).toContain('/media/official/news/news-01.webp');
    expect(fallbackContent).toContain('/media/official/news/news-02.webp');
    expect(fallbackContent).toContain('/media/official/news/news-03.webp');
    expect(fallbackContent).toContain('/media/official/stages/stage-05.webp');
  });

  it("sanitizes generic media before content reaches public pages", () => {
    const mediaPolicy = source("lib/media-policy.ts");
    const publicContent = source("lib/public-content.ts");
    const visualAssets = source("lib/visual-assets.ts");

    for (const host of genericHosts) {
      expect(mediaPolicy).toContain(host);
    }

    expect(publicContent).toContain("sanitizePublicMediaSource");
    expect(publicContent).toContain("coverImageUrl: sanitizePublicMediaSource");
    expect(visualAssets).toContain("isGenericMediaSource");
  });

  it("uses official fallbacks for driver cards, podiums, and profiles", () => {
    const standings = source("app/classificacao/page.tsx");
    const driverProfile = source("app/pilotos/[slug]/page.tsx");
    const primitives = source("components/race/editorial-primitives.tsx");

    for (const file of [standings, driverProfile, primitives]) {
      expect(file).toContain("resolveVisualSource");
    }

    expect(driverProfile).toContain("portraitFallback");
    expect(driverProfile).toContain("premiumVisuals.manifesto");
  });
});
