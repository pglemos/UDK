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
  query.then = (resolve: (value: QueryResponse) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(response).then(resolve, reject);
  return query as {
    select: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    range: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    ilike: ReturnType<typeof vi.fn>;
    then: (resolve: (value: QueryResponse) => unknown, reject?: (reason: unknown) => unknown) => Promise<unknown>;
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

    expect(query.range).toHaveBeenCalledWith(2, 3);
    expect(result.items.map((driver) => driver.slug)).toEqual(["driver-3", "driver-4"]);
    expect(result.meta).toMatchObject({ page: 2, pageSize: 2, totalItems: 8, totalPages: 4 });
  });

  it("does not paginate Supabase driver listings a second time", async () => {
    const query = createQuery({ data: pageTwoRows, count: 8, error: null });
    mockedPublicSupabaseClient.mockReturnValue({ from: vi.fn(() => query) } as never);

    const result = await getDriversPage({ page: 2, pageSize: 2, sort: "position" });

    expect(query.range).toHaveBeenCalledWith(2, 3);
    expect(result.items.map((driver) => driver.slug)).toEqual(["driver-3", "driver-4"]);
  });

  it("never replaces a configured Supabase failure with believable fallback championship data", async () => {
    const standingsQuery = createQuery({ data: null, count: null, error: new Error("database unavailable") });
    mockedPublicSupabaseClient.mockReturnValue({ from: vi.fn(() => standingsQuery) } as never);

    const standings = await getStandingsPage({ page: 1, pageSize: 10 });
    expect(standings.items).toEqual([]);

    const driversQuery = createQuery({ data: null, count: null, error: new Error("database unavailable") });
    mockedPublicSupabaseClient.mockReturnValue({ from: vi.fn(() => driversQuery) } as never);

    const drivers = await getDriversPage({ page: 1, pageSize: 10 });
    expect(drivers.items).toEqual([]);
  });
});
