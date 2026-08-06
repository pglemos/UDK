import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function source(path: string): string {
  return readFileSync(`${root}/${path}`, "utf8");
}

const genericHosts = [
  "images.unsplash.com",
  "source.unsplash.com",
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
  });

  it("filters generic media before rendering news and driver imagery", () => {
    const visualAssets = source("lib/visual-assets.ts");
    const home = source("app/page.tsx");
    const news = source("app/noticias/page.tsx");
    const article = source("app/noticias/[slug]/page.tsx");
    const standings = source("app/classificacao/page.tsx");
    const driverProfile = source("app/pilotos/[slug]/page.tsx");
    const primitives = source("components/race/editorial-primitives.tsx");

    for (const host of genericHosts) {
      expect(visualAssets).toContain(host);
    }

    for (const file of [home, news, article, standings, driverProfile, primitives]) {
      expect(file).toContain("resolveVisualSource");
    }
  });
});
