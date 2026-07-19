import { describe, expect, it } from "vitest";
import { flowerSpecies } from "@/lib/flower-species";

describe("flower structural families", () => {
  it("defines mirrored sepals, lateral petals, and a lip for Orchid", () => {
    const orchid = flowerSpecies.Orchid;

    expect(orchid.petalArrangement).toBe("bilateral");
    expect(orchid.centerArchitecture).toBe("column");
    expect(orchid.layers.map((layer) => layer.role)).toEqual([
      "sepal",
      "petal",
      "lip",
    ]);
    expect(orchid.layers[2].outline).toBe("fan");
  });

  it("defines ray petals around a composite Sunflower disk", () => {
    const sunflower = flowerSpecies.Sunflower;

    expect(sunflower.centerArchitecture).toBe("composite");
    expect(sunflower.layers.every((layer) => layer.role === "ray")).toBe(true);
    expect(sunflower.diskInnerColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(sunflower.diskOuterColor).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("uses composite disk anatomy for daisy-family flowers", () => {
    expect(flowerSpecies.Daisy.centerArchitecture).toBe("composite");
    expect(flowerSpecies.Cosmos.centerArchitecture).toBe("composite");
    expect(flowerSpecies.Daisy.pollenColor).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("defines reusable fused bell and trumpet corollas", () => {
    expect(flowerSpecies.Bluebell).toMatchObject({
      bloomArchitecture: "bell",
      corollaLobes: 6,
    });
    expect(flowerSpecies["Morning Glory"]).toMatchObject({
      bloomArchitecture: "trumpet",
      corollaLobes: 5,
    });
    expect(
      flowerSpecies["Morning Glory"].corollaMouthRadius ?? 0,
    ).toBeGreaterThan(flowerSpecies.Bluebell.corollaMouthRadius ?? 0);
  });

  it("defines reusable spike and cluster inflorescences", () => {
    expect(flowerSpecies.Gladiolus).toMatchObject({
      inflorescenceArchitecture: "spike",
      inflorescenceCount: 5,
    });
    expect(flowerSpecies.Rhododendron).toMatchObject({
      inflorescenceArchitecture: "cluster",
      inflorescenceCount: 5,
    });
  });

  it("defines contrasting reproductive anatomy for hero species", () => {
    expect(flowerSpecies.Lily).toMatchObject({
      stamenCount: 6,
      stigmaLobes: 3,
      ovaryPosition: "superior",
    });
    expect(flowerSpecies.Lily.styleLength ?? 0).toBeGreaterThan(1);
    expect(flowerSpecies.Sunflower.ovaryPosition).toBe("inferior");
    expect(flowerSpecies.Sunflower.calyxForm).toBe("bracted");
    expect(flowerSpecies.Lily.calyxForm).toBe("reflexed");
    expect(flowerSpecies.Orchid.pollenColor).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
