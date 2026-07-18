import { beforeEach, describe, expect, it, vi } from "vitest";
import { selectFlowerSettings } from "@/lib/flower-design";
import { useFlowerStore } from "@/lib/flower-store";

const { listFlowers, saveFlower } = vi.hoisted(() => ({
  listFlowers: vi.fn(),
  saveFlower: vi.fn(),
}));

vi.mock("@/lib/flower-repository", () => ({ listFlowers, saveFlower }));

import { GET, POST } from "@/app/api/flowers/route";

const summary = {
  id: "d7879e45-6134-4b27-934c-99f58cd10948",
  name: "Cosmos study",
  preset: "Cosmos",
  renderMode: "color",
  seed: 42,
  createdAt: "2026-07-17T12:00:00.000Z",
  updatedAt: "2026-07-17T12:00:00.000Z",
};

describe("/api/flowers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists saved flowers", async () => {
    listFlowers.mockResolvedValue([summary]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ flowers: [summary] });
  });

  it("saves a valid flower", async () => {
    const input = {
      name: "Cosmos study",
      settings: selectFlowerSettings(useFlowerStore.getState()),
    };
    saveFlower.mockResolvedValue(summary);

    const response = await POST(
      new Request("http://localhost/api/flowers", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );

    expect(response.status).toBe(201);
    expect(saveFlower).toHaveBeenCalledWith(input);
    await expect(response.json()).resolves.toEqual({ flower: summary });
  });

  it("rejects invalid flower data", async () => {
    const response = await POST(
      new Request("http://localhost/api/flowers", {
        method: "POST",
        body: JSON.stringify({ name: "Incomplete" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(saveFlower).not.toHaveBeenCalled();
  });

  it.each([
    ["GET", () => GET(), listFlowers],
    [
      "POST",
      () =>
        POST(
          new Request("http://localhost/api/flowers", {
            method: "POST",
            body: JSON.stringify({
              name: "Cosmos study",
              settings: selectFlowerSettings(useFlowerStore.getState()),
            }),
          }),
        ),
      saveFlower,
    ],
  ])("returns 503 when %s persistence fails", async (_, request, operation) => {
    operation.mockRejectedValue(new Error("database unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request();

    expect(response.status).toBe(503);
  });
});
