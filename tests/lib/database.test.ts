import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { poolConstructor } = vi.hoisted(() => ({
  poolConstructor: vi.fn(function MockPool(this: object, config: object) {
    Object.assign(this, { config, query: vi.fn() });
  }),
}));

vi.mock("pg", () => ({ Pool: poolConstructor }));

describe("getDatabasePool", () => {
  beforeEach(() => {
    vi.resetModules();
    poolConstructor.mockClear();
    process.env.DATABASE_URL = "postgresql://flower:test@database/flowerpower";
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("requires a database URL", async () => {
    delete process.env.DATABASE_URL;
    const { getDatabasePool } = await import("@/lib/database");

    expect(() => getDatabasePool()).toThrow("DATABASE_URL is not configured");
    expect(poolConstructor).not.toHaveBeenCalled();
  });

  it("constructs a configured connection pool", async () => {
    const { getDatabasePool } = await import("@/lib/database");

    getDatabasePool();

    expect(poolConstructor).toHaveBeenCalledWith({
      connectionString: "postgresql://flower:test@database/flowerpower",
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  });

  it("reuses the pool for subsequent calls", async () => {
    const { getDatabasePool } = await import("@/lib/database");

    const first = getDatabasePool();
    const second = getDatabasePool();

    expect(first).toBe(second);
    expect(poolConstructor).toHaveBeenCalledTimes(1);
  });
});
