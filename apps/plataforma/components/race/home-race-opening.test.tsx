import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeRaceOpening, type OpeningDriver } from "./home-race-opening";

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
  it("renders real pilot links and reserves the movie for explicit playback", () => {
    const html = renderToStaticMarkup(<HomeRaceOpening drivers={drivers} />);
    expect(html).toContain("/pilotos/arthur-henrique");
    expect(html).toContain("/pilotos/marcos-felipe");
    expect(html).not.toContain("/pilotos/andre-felisberto");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Assistir ao filme");
    expect(html).toContain("<dialog");
    expect(html).not.toContain('src="/media/official/home/ultras-opening.mp4"');
    expect(html).not.toContain("autoPlay");
  });

  it("keeps the pilots directory reachable when no roster is published", () => {
    const html = renderToStaticMarkup(<HomeRaceOpening drivers={[]} />);
    expect(html).toContain('href="/pilotos"');
    expect(html).not.toContain("Próximos pilotos");
  });
});
