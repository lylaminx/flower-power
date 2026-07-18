import { beforeEach, describe, expect, it, vi } from "vitest";

const { getFlower } = vi.hoisted(() => ({ getFlower: vi.fn() }));
vi.mock("@/lib/flower-repository", () => ({ getFlower }));

import { GET } from "@/app/api/flowers/[id]/route";

const id = "d7879e45-6134-4b27-934c-99f58cd10948";

describe("/api/flowers/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a complete saved flower", async () => {
    const flower = { id, name: "Cosmos study", settings: { seed: 42 } };
    getFlower.mockResolvedValue(flower);

    const response = await GET(
      new Request(`http://localhost/api/flowers/${id}`),
      {
        params: { id },
      },
    );

    expect(response.status).toBe(200);
    expect(getFlower).toHaveBeenCalledWith(id);
    await expect(response.json()).resolves.toEqual({ flower });
  });

  it("rejects a malformed id", async () => {
    const response = await GET(
      new Request("http://localhost/api/flowers/nope"),
      {
        params: { id: "nope" },
      },
    );
    expect(response.status).toBe(400);
    expect(getFlower).not.toHaveBeenCalled();
  });

  it("returns 404 when the flower is missing", async () => {
    getFlower.mockResolvedValue(null);
    const response = await GET(
      new Request(`http://localhost/api/flowers/${id}`),
      {
        params: { id },
      },
    );
    expect(response.status).toBe(404);
  });

  it("returns 503 when persistence fails", async () => {
    getFlower.mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await GET(
      new Request(`http://localhost/api/flowers/${id}`),
      {
        params: { id },
      },
    );
    expect(response.status).toBe(503);
  });
});
