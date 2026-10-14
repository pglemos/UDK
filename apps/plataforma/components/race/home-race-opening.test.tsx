import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeRaceOpening, shouldAutoOpenFilm, type OpeningDriver } from "./home-race-opening";

const drivers: OpeningDriver[] = [
  {
    slug: "arthur-henrique",
    name: "Arthur",
    categorySlug: "rapidos",
    avatarUrl: "/arthur.webp",
    heroImageUrl: null,
  },
  {
    slug: "marcos-felipe",
    name: "Marcos Felipe",
    categorySlug: "rapidos",
    avatarUrl: "/marcos.webp",
    heroImageUrl: null,
  },
  {
    slug: "andre-felisberto",
    name: "André Felisberto",
    categorySlug: "insanos",
    avatarUrl: "/andre.webp",
    heroImageUrl: null,
  },
];

describe("film-inspired Home opening", () => {
  it("renders real pilot links and loads the movie only on the client", () => {
    const html = renderToStaticMarkup(<HomeRaceOpening drivers={drivers} />);
    expect(html).toContain("/pilotos/arthur-henrique");
    expect(html).toContain("/pilotos/marcos-felipe");
    expect(html).not.toContain("/pilotos/andre-felisberto");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Assistir ao filme");
    expect(html).toContain("<dialog");
    // o MP4 de 19 MB não vai no HTML: o navegador só baixa quando o filme abre
    expect(html).not.toContain('src="/media/official/home/ultras-opening.mp4"');
    expect(html).not.toContain("autoPlay");
  });

  it("keeps the pilots directory reachable when no roster is published", () => {
    const html = renderToStaticMarkup(<HomeRaceOpening drivers={[]} />);
    expect(html).toContain('href="/pilotos"');
    expect(html).not.toContain("Próximos pilotos");
  });
});

describe("film opens by itself when the site opens", () => {
  it("opens on the first visit of the session", () => {
    expect(shouldAutoOpenFilm({ reducedMotion: false, saveData: false, alreadySeen: false })).toBe(true);
  });

  it("does not open again in the same session", () => {
    expect(shouldAutoOpenFilm({ reducedMotion: false, saveData: false, alreadySeen: true })).toBe(false);
  });

  it("respects reduced motion and data saver", () => {
    expect(shouldAutoOpenFilm({ reducedMotion: true, saveData: false, alreadySeen: false })).toBe(false);
    expect(shouldAutoOpenFilm({ reducedMotion: false, saveData: true, alreadySeen: false })).toBe(false);
  });
});
