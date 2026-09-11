import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./public-supabase", () => ({
  publicSupabaseClient: vi.fn(),
}));

import { getDriversPage, getStandingsPage } from "./public-data";
import { publicSupabaseClient } from "./public-supabase";

type QueryResponse = {
  data: Record<string, unknown>[] | null;
  count: number | null;
  error: unknown;
};

function createQuery(response: QueryResponse) {
  const query: Record<string, unknown> = {};
  for (const method of ["select", "order", "range", "eq", "ilike"]) {
    query[method] = vi.fn(() => query);
  }
  query.then = (
    resolve: (value: QueryResponse) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise.resolve(response).then(resolve, reject);
  return query as {
    select: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    range: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    ilike: ReturnType<typeof vi.fn>;
    then: (
      resolve: (value: QueryResponse) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise<unknown>;
  };
}

const pageTwoRows = [
  {
    id: "driver-3",
    slug: "driver-3",
    name: "Piloto 3",
    full_name: "Piloto 3",
    number: 3,
    category: "Ultras Rápidos",
    category_slug: "rapidos",
    category_color: "#F7F5F0",
    points: 80,
    gross_points: 80,
    position: 3,
  },
  {
    id: "driver-4",
    slug: "driver-4",
    name: "Piloto 4",
    full_name: "Piloto 4",
    number: 4,
    category: "Ultras Rápidos",
    category_slug: "rapidos",
    category_color: "#F7F5F0",
    points: 70,
    gross_points: 70,
    position: 4,
  },
];

describe("go-live public pagination", () => {
  const mockedPublicSupabaseClient = vi.mocked(publicSupabaseClient);

  beforeEach(() => {
    mockedPublicSupabaseClient.mockReset();
  });

  it("does not paginate Supabase standings a second time", async () => {
    const query = createQuery({ data: pageTwoRows, count: 8, error: null });
    mockedPublicSupabaseClient.mockReturnValue({ from: vi.fn(() => query) } as never);

    const result = await getStandingsPage({ page: 2, pageSize: 2, sort: "points" });

    expect(query.order).toHaveBeenCalledWith("points", { ascending: false });
    expect(query.order).toHaveBeenCalledWith("position", { ascending: true });
    expect(query.order).toHaveBeenCalledWith("id", { ascending: true });
    expect(query.range).toHaveBeenCalledWith(2, 3);
    expect(result.items.map((driver) => driver.slug)).toEqual(["driver-3", "driver-4"]);
    expect(result.items.map((driver) => driver.rankingPosition)).toEqual([3, 4]);
    expect(result.meta).toMatchObject({ page: 2, pageSize: 2, totalItems: 8, totalPages: 4 });
  });

  it("does not paginate Supabase driver listings a second time", async () => {
    const query = createQuery({ data: pageTwoRows, count: 8, error: null });
    mockedPublicSupabaseClient.mockReturnValue({ from: vi.fn(() => query) } as never);

    const result = await getDriversPage({ page: 2, pageSize: 2, sort: "position" });

    expect(query.order).toHaveBeenCalledWith("position", { ascending: true });
    expect(query.range).toHaveBeenCalledWith(2, 3);
    expect(result.items.map((driver) => driver.slug)).toEqual(["driver-3", "driver-4"]);
  });

  it("never replaces a configured Supabase failure with believable fallback championship data", async () => {
    const standingsQuery = createQuery({
      data: null,
      count: null,
      error: new Error("database unavailable"),
    });
    mockedPublicSupabaseClient.mockReturnValue({ from: vi.fn(() => standingsQuery) } as never);

    const standings = await getStandingsPage({ page: 1, pageSize: 10 });
    expect(standings.items).toEqual([]);

    const driversQuery = createQuery({
      data: null,
      count: null,
      error: new Error("database unavailable"),
    });
    mockedPublicSupabaseClient.mockReturnValue({ from: vi.fn(() => driversQuery) } as never);

    const drivers = await getDriversPage({ page: 1, pageSize: 10 });
    expect(drivers.items).toEqual([]);
  });

  it("keeps the classification podium and point gap anchored to the real category leaders on every page", () => {
    const pageSource = readFileSync(
      new URL("../app/classificacao/page.tsx", import.meta.url),
      "utf8",
    );

    expect(pageSource).toContain(
      'getStandingsPage({ page: 1, pageSize: 1, category, sort: "points" })',
    );
    expect(pageSource).toContain(
      "const leaderPoints = leader.items[0]?.points ?? standings.items[0]?.points ?? 0",
    );
    expect(pageSource).not.toMatch(/leaders\.items\.slice\(0, 3\)\.map/);
  });

  it("keeps the published category position when a search returns one driver", async () => {
    const query = createQuery({ data: [pageTwoRows[1]!], count: 1, error: null });
    mockedPublicSupabaseClient.mockReturnValue({ from: vi.fn(() => query) } as never);

    const result = await getStandingsPage({
      category: "rapidos",
      query: "Piloto 4",
      sort: "points",
    });

    expect(result.items[0]).toMatchObject({ slug: "driver-4", position: 4, rankingPosition: 4 });
    expect(result.meta.totalItems).toBe(1);
  });

  it("keeps the unfiltered general rank when searching across categories", async () => {
    const filteredQuery = createQuery({ data: [pageTwoRows[1]!], count: 1, error: null });
    const rankQuery = createQuery({
      data: [{ id: "driver-1" }, { id: "driver-2" }, { id: "driver-3" }, { id: "driver-4" }],
      count: 4,
      error: null,
    });
    const from = vi.fn().mockReturnValueOnce(filteredQuery).mockReturnValueOnce(rankQuery);
    mockedPublicSupabaseClient.mockReturnValue({ from } as never);

    const result = await getStandingsPage({ category: "geral", query: "Piloto 4", sort: "points" });

    expect(result.items[0]?.rankingPosition).toBe(4);
    expect(result.meta.totalItems).toBe(1);
    expect(rankQuery.ilike).not.toHaveBeenCalled();
    expect(rankQuery.order.mock.calls).toEqual([
      ["points", { ascending: false }],
      ["position", { ascending: true }],
      ["id", { ascending: true }],
    ]);
  });

  it("does not invent first place if the unfiltered rank lookup fails", async () => {
    const filteredQuery = createQuery({ data: [pageTwoRows[1]!], count: 1, error: null });
    const rankQuery = createQuery({ data: null, count: null, error: new Error("unavailable") });
    const from = vi.fn().mockReturnValueOnce(filteredQuery).mockReturnValueOnce(rankQuery);
    mockedPublicSupabaseClient.mockReturnValue({ from } as never);

    const result = await getStandingsPage({ query: "Piloto 4", sort: "points" });

    expect(result.items[0]?.rankingPosition).toBeNull();
    expect(result.items[0]?.points).toBe(70);
  });

  it("keeps general ranks stable through fallback search and pagination", async () => {
    mockedPublicSupabaseClient.mockReturnValue(null);
    const full = await getStandingsPage({ pageSize: 100, sort: "points" });
    const expected = full.items[3]!;
    const filtered = await getStandingsPage({ query: expected.name, sort: "points" });
    const page = await getStandingsPage({ page: 2, pageSize: 3, sort: "points" });

    expect(filtered.items.find((driver) => driver.id === expected.id)?.rankingPosition).toBe(4);
    expect(page.items[0]?.rankingPosition).toBe(4);
  });
});
