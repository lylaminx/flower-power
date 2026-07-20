import { describe, expect, it } from "vitest";

import { getHeroCenterTuning } from "@/lib/flower-center-tuning";
import { getHeroLeafTuning } from "@/lib/flower-leaf-tuning";
import { getHeroPetalTuning } from "@/lib/flower-petal-tuning";
import { flowerSpecies, type PetalLayer } from "@/lib/flower-species";
import { getHeroStemTuning } from "@/lib/flower-stem-tuning";
import type { FlowerPreset } from "@/lib/flower-store";

const heroPresets: FlowerPreset[] = [
  "Rose",
  "Poppy",
  "Lily",
  "Sunflower",
  "Orchid",
  "Lotus",
];

describe("hero flower tuning", () => {
  it.each(heroPresets)("provides species-specific tuning for %s", (preset) => {
    const species = flowerSpecies[preset];
    const layer = species.layers[0];

    expect(
      getHeroCenterTuning(
        preset,
        species,
        species.centerArchitecture ?? "simple",
      ),
    ).toMatchObject({ radiusScale: expect.any(Number) });
    expect(getHeroLeafTuning(preset, species)).toMatchObject({
      leafShape: species.leafShape,
      leafWidthScale: expect.any(Number),
    });
    expect(
      getHeroPetalTuning(preset, species, layer, 0, species.layers.length),
    ).toMatchObject({ lengthScale: expect.any(Number) });
    expect(getHeroStemTuning(preset, species)).toMatchObject({
      calyxForm: expect.anything(),
      curveScale: expect.any(Number),
    });
  });

  it("retains neutral defaults for other presets", () => {
    const species = flowerSpecies.Daisy;
    const layer = species.layers[0];

    expect(getHeroCenterTuning("Daisy", species, "simple")).toMatchObject({
      radiusScale: 1,
      displayColorMix: 0.5,
    });
    expect(getHeroLeafTuning("Daisy", species)).toMatchObject({
      leafWidthScale: 1,
      leafShape: species.leafShape,
    });
    expect(getHeroPetalTuning("Daisy", species, layer, 0, 1)).toMatchObject({
      lengthScale: 1,
      widthScale: 1,
    });
    expect(getHeroStemTuning("Daisy", species)).toMatchObject({
      curveScale: 1,
      calyxForm: species.calyxForm,
      prickleDensity: 0,
    });
  });

  it.each([
    ["sepal", 0.9, 0.9],
    ["lip", 0.92, 1.18],
    ["ray", 1.05, 0.92],
  ] as const)("applies the %s petal role", (role, lengthScale, widthScale) => {
    const species = flowerSpecies.Daisy;
    const layer: PetalLayer = { ...species.layers[0], role };

    expect(getHeroPetalTuning("Daisy", species, layer, 0, 1)).toMatchObject({
      lengthScale,
      widthScale,
    });
  });

  it("applies orchid lip details and its column center", () => {
    const species = flowerSpecies.Orchid;
    const lip = species.layers.find((layer) => layer.role === "lip");

    expect(lip).toBeDefined();
    expect(
      getHeroPetalTuning("Orchid", species, lip!, 1, species.layers.length),
    ).toMatchObject({ foldBias: 0.08, lateralCupBias: 0.22 });
    expect(getHeroCenterTuning("Orchid", species, "column")).toMatchObject({
      floretCountScale: 0.5,
    });
  });

  it("adds prickles only to the rose hero stem", () => {
    expect(getHeroStemTuning("Rose", flowerSpecies.Rose)).toMatchObject({
      prickleDensity: 1,
      prickleSizeScale: 1.08,
    });
    expect(getHeroStemTuning("Poppy", flowerSpecies.Poppy).prickleDensity).toBe(
      0,
    );
  });
});
