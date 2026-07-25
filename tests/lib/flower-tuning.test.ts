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
      attachmentStart: expect.any(Number),
      attachmentEnd: expect.any(Number),
      leafletPairs: expect.any(Number),
      leafArrangement: expect.any(String),
      leafShape:
        preset === "Orchid"
          ? "lance"
          : preset === "Lotus"
            ? "peltate"
            : species.leafShape,
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

  it("uses a short style beneath the poppy stigmatic disk", () => {
    expect(
      getHeroCenterTuning("Poppy", flowerSpecies.Poppy, "simple")
        .styleLengthScale,
    ).toBeLessThan(0.5);
  });

  it("splays lily stamens beyond compact flower centers", () => {
    const lily = getHeroCenterTuning("Lily", flowerSpecies.Lily, "simple");
    const poppy = getHeroCenterTuning("Poppy", flowerSpecies.Poppy, "simple");

    expect(lily.filamentSpreadScale).toBeGreaterThan(3);
    expect(lily.filamentSpreadScale).toBeGreaterThan(poppy.filamentSpreadScale);
  });

  it("adds prickles only to the rose hero stem", () => {
    expect(getHeroStemTuning("Rose", flowerSpecies.Rose)).toMatchObject({
      axillaryBudScale: 1.08,
      prickleDensity: 1,
      prickleSizeScale: 1.08,
    });
    expect(getHeroStemTuning("Poppy", flowerSpecies.Poppy).prickleDensity).toBe(
      0,
    );
    expect(
      getHeroStemTuning("Lotus", flowerSpecies.Lotus).axillaryBudScale,
    ).toBe(0);
  });

  it("adds aerial roots only to the orchid hero base", () => {
    expect(
      getHeroStemTuning("Orchid", flowerSpecies.Orchid).aerialRootCount,
    ).toBe(5);
    expect(getHeroStemTuning("Rose", flowerSpecies.Rose).aerialRootCount).toBe(
      0,
    );
  });

  it("adds restrained axillary shoots to branching hero habits", () => {
    expect(
      getHeroStemTuning("Rose", flowerSpecies.Rose).secondaryShootCount,
    ).toBe(1);
    expect(
      getHeroStemTuning("Sunflower", flowerSpecies.Sunflower)
        .secondaryShootScale,
    ).toBeLessThan(0.7);
    expect(
      getHeroStemTuning("Orchid", flowerSpecies.Orchid).secondaryShootCount,
    ).toBe(0);
  });

  it("drops poppy sepals while other hero calyces persist", () => {
    expect(
      getHeroStemTuning("Poppy", flowerSpecies.Poppy).sepalPersistence,
    ).toBe(0);
    expect(getHeroStemTuning("Rose", flowerSpecies.Rose).sepalPersistence).toBe(
      1,
    );
  });

  it("gives poppy buds a nodding growth posture", () => {
    expect(
      getHeroStemTuning("Poppy", flowerSpecies.Poppy).budNod,
    ).toBeGreaterThan(0.6);
    expect(getHeroStemTuning("Rose", flowerSpecies.Rose).budNod).toBe(0);
  });

  it("uses compound leaflets only for the rose hero foliage", () => {
    expect(getHeroLeafTuning("Rose", flowerSpecies.Rose).leafletPairs).toBe(2);
    expect(getHeroLeafTuning("Lily", flowerSpecies.Lily).leafletPairs).toBe(0);
  });

  it("gives thin poppy petals species-specific longitudinal pleats", () => {
    const layer = flowerSpecies.Poppy.layers[0];
    expect(
      getHeroPetalTuning("Poppy", flowerSpecies.Poppy, layer, 0, 1)
        .pleatStrength,
    ).toBeGreaterThan(0.8);
    expect(
      getHeroPetalTuning("Lily", flowerSpecies.Lily, layer, 0, 1).pleatStrength,
    ).toBe(0);
  });

  it("makes poppy petals caducous while persistent hero petals remain", () => {
    const poppyLayer = flowerSpecies.Poppy.layers[0];
    const roseLayer = flowerSpecies.Rose.layers[0];
    expect(
      getHeroPetalTuning("Poppy", flowerSpecies.Poppy, poppyLayer, 0, 1)
        .petalPersistence,
    ).toBeLessThan(0.1);
    expect(
      getHeroPetalTuning("Rose", flowerSpecies.Rose, roseLayer, 0, 1)
        .petalPersistence,
    ).toBe(1);
  });

  it("places orchid and lotus foliage near the stem base", () => {
    expect(getHeroLeafTuning("Orchid", flowerSpecies.Orchid)).toMatchObject({
      attachmentStart: 0.035,
      attachmentEnd: 0.085,
      leafShape: "lance",
    });
    expect(getHeroLeafTuning("Lotus", flowerSpecies.Lotus).attachmentEnd).toBe(
      0.13,
    );
    expect(getHeroLeafTuning("Lotus", flowerSpecies.Lotus).leafShape).toBe(
      "peltate",
    );
  });

  it("uses species-appropriate hero leaf venation", () => {
    expect(getHeroLeafTuning("Rose", flowerSpecies.Rose).venation).toBe(
      "pinnate",
    );
    expect(getHeroLeafTuning("Lily", flowerSpecies.Lily).venation).toBe(
      "parallel",
    );
    expect(getHeroLeafTuning("Orchid", flowerSpecies.Orchid).venation).toBe(
      "parallel",
    );
    expect(getHeroLeafTuning("Lotus", flowerSpecies.Lotus).venation).toBe(
      "radial",
    );
  });

  it("gives sunflower leaves a coarse trichome surface", () => {
    expect(
      getHeroLeafTuning("Sunflower", flowerSpecies.Sunflower).leafHairiness,
    ).toBe(1);
    expect(getHeroLeafTuning("Rose", flowerSpecies.Rose).leafHairiness).toBe(0);
  });

  it("uses alternate phyllotaxy for cauline hero leaves", () => {
    for (const preset of ["Rose", "Poppy", "Lily", "Sunflower"] as const) {
      expect(
        getHeroLeafTuning(preset, flowerSpecies[preset]).leafArrangement,
      ).toBe("alternate");
    }
    expect(
      getHeroLeafTuning("Orchid", flowerSpecies.Orchid).leafArrangement,
    ).toBe("opposite");
    expect(
      getHeroLeafTuning("Lotus", flowerSpecies.Lotus).leafArrangement,
    ).toBe("alternate");
  });
});
