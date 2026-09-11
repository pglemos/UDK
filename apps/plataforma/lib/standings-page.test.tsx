import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../components/race/race-shell", () => ({
  RaceShell: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../components/race/search-field", () => ({
  SearchField: () => <input name="q" aria-label="Buscar piloto" />,
}));
vi.mock("./public-data", async (importOriginal) => {
  const original = await importOriginal<typeof import("./public-data")>();
  const driver = original.normalizePublicDriver({
    id: "marcos",
    slug: "marcos-felipe",
    name: "Marcos Felipe",
    category: "Ultras Rápidos",
    category_slug: "rapidos",
    points: 100,
    gross_points: 100,
    position: 2,
  });
  return {
    ...original,
    getCategories: vi.fn(async () => [
      { slug: "rapidos", name: "Ultras Rápidos", color: "#00d9ff" },
    ]),
    getLatestResultPublication: vi.fn(async () => null),
    getStandingsPage: vi.fn(async ({ query, category }: { query?: string; category?: string }) => ({
      items: [
        { ...driver, points: query ? 100 : 125, rankingPosition: category === "rapidos" ? 2 : 7 },
      ],
      meta: original.buildPageMeta(1, 10, 1),
    })),
  };
});

import StandingsPage from "../app/classificacao/page";

describe("standings search rendering", () => {
  it.each([
    ["rapidos", 2],
    ["geral", 7],
  ])(
    "renders the preserved %s rank in both desktop and mobile summaries",
    async (category, rank) => {
      const page = await StandingsPage({
        searchParams: Promise.resolve({ categoria: category, q: "Marcos" }),
      });
      const html = renderToStaticMarkup(page);

      expect(html.match(new RegExp(`class="udk-rank rank-${rank}"`, "g"))).toHaveLength(2);
      expect(html).not.toContain('class="udk-rank rank-1"');
      expect(html).toContain("-25");
      expect(html).toContain("Limpar busca");
      expect(html).toContain("Diferença para o líder");
      expect(html.indexOf("tg-standing-table-wrap")).toBeLessThan(
        html.indexOf("Documentos oficiais"),
      );
    },
  );
});
