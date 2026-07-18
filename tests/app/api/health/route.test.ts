import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDatabasePool, query } = vi.hoisted(() => ({
  getDatabasePool: vi.fn(),
  query: vi.fn(),
}));

vi.mock("@/lib/database", () => ({ getDatabasePool }));

import { dynamic, GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDatabasePool.mockReturnValue({ query });
  });

  it("is always dynamically rendered", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("reports the database time when PostgreSQL responds", async () => {
    query.mockResolvedValue({
      rows: [{ current_time: "2026-07-17 10:15:00+00" }],
    });

    const response = await GET();

    expect(query).toHaveBeenCalledWith("SELECT now()::text AS current_time");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "healthy",
      database: "connected",
      databaseTime: "2026-07-17 10:15:00+00",
    });
  });

  it("returns 503 without exposing connection errors", async () => {
    const error = new Error("password authentication failed");
    query.mockRejectedValue(error);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "unhealthy",
      database: "disconnected",
    });
    expect(consoleError).toHaveBeenCalledWith("Health check failed", error);
  });
});
