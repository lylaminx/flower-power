import { beforeEach, describe, expect, it, vi } from "vitest";
import { selectFlowerSettings } from "@/lib/flower-design";
import { useFlowerStore } from "@/lib/flower-store";

const { getDatabasePool, query } = vi.hoisted(() => ({
  getDatabasePool: vi.fn(),
  query: vi.fn(),
}));

vi.mock("@/lib/database", () => ({ getDatabasePool }));

const row = {
  id: "d7879e45-6134-4b27-934c-99f58cd10948",
  name: "Cosmos study",
  preset: "Cosmos",
  render_mode: "color",
  seed: 42,
  created_at: new Date("2026-07-17T12:00:00.000Z"),
  updated_at: new Date("2026-07-17T12:00:00.000Z"),
};

const detailRow = {
  ...row,
  petal_count: 12,
  petal_length: 1.65,
  petal_width: 0.62,
  petal_curl: 0.28,
  petal_waviness: 0.42,
  petal_thickness: 1.2,
  petal_fold: 0.65,
  petal_twist: -0.2,
  petal_ruffle: 1.4,
  petal_notch: 0.8,
  petal_vein_strength: 1.3,
  petal_base_width: 1.1,
  petal_age: 0.2,
  petal_spots: 0.35,
  petal_guide_strength: 0.5,
  bloom: 0.82,
  variation: 0.2,
  petal_color: "#d47a9a",
  petal_tip_color: "#f0b4c2",
  center_color: "#cf9b38",
  center_density: 1.35,
  center_size: 1.2,
  center_profile: 0.8,
  center_floret_size: 1.3,
  center_spread: 1.1,
  center_stamen_length: 1.4,
  center_anther_size: 0.9,
  center_stigma_size: 1.25,
  stem_color: "#355a39",
  background_color: "#ffffff",
  stem_curve: 0.18,
  stem_height: 1.1,
  stem_thickness: 1.2,
  stem_taper: 0.42,
  stem_node_count: 4,
  stem_hair_density: 0.7,
  leaf_density: 1.4,
  leaf_length: 1.2,
  leaf_width: 0.9,
  leaf_curl: 0.55,
  leaf_serration: 1.3,
  leaf_vein_density: 1.5,
  leaf_droop: 0.4,
  bloom_tilt: 0.2,
  bloom_turn: -0.5,
  light_intensity: 1.1,
  grid_enabled: false,
};

describe("flower repository", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getDatabasePool.mockReturnValue({ query });
  });

  it("creates the schema and saves normalized flower modules", async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [row] });
    const { saveFlower } = await import("@/lib/flower-repository");

    const saved = await saveFlower({
      name: " Cosmos study ",
      settings: selectFlowerSettings(useFlowerStore.getState()),
    });

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0][0]).toContain(
      "CREATE TABLE IF NOT EXISTS flower_designs",
    );
    expect(query.mock.calls[0][0]).toContain(
      "CREATE TABLE IF NOT EXISTS flower_varieties",
    );
    expect(query.mock.calls[0][0]).toContain(
      "('poinsettia', 'Poinsettia', 42)",
    );
    expect(query.mock.calls[1][0]).toContain("INSERT INTO flower_petals");
    expect(query.mock.calls[1][0]).toContain("INSERT INTO flower_scenes");
    expect(query.mock.calls[1][1]).toHaveLength(51);
    expect(query.mock.calls[1][1][0]).toBe("Cosmos study");
    expect(saved).toEqual({
      id: row.id,
      name: row.name,
      preset: row.preset,
      renderMode: row.render_mode,
      seed: row.seed,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    });
  });

  it("lists the newest saved flowers", async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [row] });
    const { listFlowers } = await import("@/lib/flower-repository");

    const flowers = await listFlowers();

    expect(query.mock.calls[1][0]).toContain(
      "ORDER BY created_at DESC LIMIT 100",
    );
    expect(flowers).toHaveLength(1);
    expect(flowers[0]).toMatchObject({ id: row.id, name: "Cosmos study" });
  });

  it("loads all modules for one saved flower", async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [detailRow] });
    const { getFlower } = await import("@/lib/flower-repository");

    const flower = await getFlower(row.id);

    expect(query.mock.calls[1][0]).toContain("JOIN flower_petals");
    expect(query.mock.calls[1][1]).toEqual([row.id]);
    expect(flower).toMatchObject({
      id: row.id,
      settings: {
        preset: "Cosmos",
        petalCount: 12,
        petalColor: "#d47a9a",
        petalWaviness: 0.42,
        petalThickness: 1.2,
        petalFold: 0.65,
        petalTwist: -0.2,
        petalRuffle: 1.4,
        petalNotch: 0.8,
        petalVeinStrength: 1.3,
        petalBaseWidth: 1.1,
        petalAge: 0.2,
        petalSpots: 0.35,
        petalGuideStrength: 0.5,
        backgroundColor: "#ffffff",
        centerDensity: 1.35,
        centerSize: 1.2,
        centerProfile: 0.8,
        centerFloretSize: 1.3,
        centerSpread: 1.1,
        centerStamenLength: 1.4,
        centerAntherSize: 0.9,
        centerStigmaSize: 1.25,
        stemHeight: 1.1,
        stemThickness: 1.2,
        stemTaper: 0.42,
        stemNodeCount: 4,
        stemHairDensity: 0.7,
        leafDensity: 1.4,
        leafLength: 1.2,
        leafWidth: 0.9,
        leafCurl: 0.55,
        leafSerration: 1.3,
        leafVeinDensity: 1.5,
        leafDroop: 0.4,
        bloomTilt: 0.2,
        bloomTurn: -0.5,
        grid: false,
      },
    });
  });

  it("returns null for a missing flower", async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const { getFlower } = await import("@/lib/flower-repository");
    await expect(getFlower(row.id)).resolves.toBeNull();
  });

  it("allows schema initialization to retry after a failure", async () => {
    query.mockRejectedValueOnce(new Error("database starting"));
    const { listFlowers } = await import("@/lib/flower-repository");

    await expect(listFlowers()).rejects.toThrow("database starting");

    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(listFlowers()).resolves.toEqual([]);
  });
});
