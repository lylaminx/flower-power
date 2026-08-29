import { describe, expect, it } from "vitest";
import * as THREE from "three";

import {
  getAntherGrooveColor,
  getAntherRoughness,
  getFilamentSegmentCount,
  getHeroCenterTuning,
  getReproductiveRadiusScale,
  getLilyStamenVariation,
  getPoppyStamenVariation,
  getPollenGrainsPerStamen,
  getRoseFreeStyleCount,
  getRoseFreeStyleVariation,
  getRoseStamenVariation,
  orchidColumnHood,
  orchidColumnPose,
  orchidColumnSilhouette,
  orchidPolliniumPose,
  poppyStamenSurface,
  poppyStigmaDisk,
  shouldRenderCenterBody,
} from "@/lib/flower-center-tuning";
import {
  getCompoundLeafletPlacements,
  getCompoundLeafletGeometrySeed,
  getCompoundLeafletPoseVariation,
  getLeafBladeAttachmentOffset,
  getLilyLeafPoseVariation,
  getLilyLeafSizeScale,
  getPoppyLeafSizeScale,
  getSunflowerLeafSizeScale,
  getSunflowerLeafPoseVariation,
  getHeroLeafTuning,
  getIntegratedPinnateVeinRelief,
  getLeafSubsurfaceFill,
  getOrchidLeafFanOffset,
} from "@/lib/flower-leaf-tuning";
import {
  getHeroPetalTuning,
  getLotusPetalMaterialTuning,
  getSunflowerRayMaterialTuning,
} from "@/lib/flower-petal-tuning";
import { flowerSpecies, type PetalLayer } from "@/lib/flower-species";
import {
  getCalyxOrganVariation,
  getCalyxAssemblyOffset,
  getSunflowerPhyllaryWhorlTuning,
  getCalyxRetention,
  getHeroStemTuning,
  getLeafAttachmentFrame,
  getLeafAttachmentSwelling,
  getSecondaryShootControlOffsets,
  getRoseBasalCaneControlOffsets,
  getSecondaryShootHairCount,
  getSecondaryShootPrickleCount,
  getSecondaryShootLeafCount,
  getSecondaryShootAzimuthOffset,
  getSecondaryShootMaterialVariant,
  getStemNodeVariation,
  getOrchidInflorescenceStandOff,
  getOrchidInflorescenceBloomRotation,
  shouldRenderExternalCalyx,
} from "@/lib/flower-stem-tuning";
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
  it("varies Lotus petal finish gently across protected and exposed layers", () => {
    const inner = getLotusPetalMaterialTuning(0, 3, 0);
    const outer = getLotusPetalMaterialTuning(2, 3, 2);

    expect(outer.roughnessOffset).toBeGreaterThan(inner.roughnessOffset);
    expect(outer.clearcoatRoughness).toBeGreaterThan(inner.clearcoatRoughness);
    expect(outer.clearcoatRoughness).toBeLessThan(0.7);
  });

  it("breaks exact repetition across sunflower ray finishes", () => {
    const first = getSunflowerRayMaterialTuning(0, 24, 0);
    const later = getSunflowerRayMaterialTuning(9, 24, 1);

    expect(later.roughnessOffset).not.toBe(first.roughnessOffset);
    expect(later.clearcoatRoughness).toBeGreaterThan(0.48);
    expect(later.clearcoatRoughness).toBeLessThan(0.6);
    expect(first.sheenStrength).toBeGreaterThan(0.07);
    expect(first.sheenStrength).toBeLessThan(0.09);
    expect(first.sheenRoughness).toBeGreaterThan(0.75);
    expect(first.emissiveIntensity).toBeLessThan(0.05);
    expect(later.emissiveIntensity).toBeGreaterThan(first.emissiveIntensity);
  });

  it("gives Rose petals a restrained outward tip reflex", () => {
    const species = flowerSpecies.Rose;
    const tuning = getHeroPetalTuning(
      "Rose",
      species,
      species.layers[0],
      0,
      species.layers.length,
    );

    expect(tuning.tipReflex).toBeGreaterThan(0.08);
    expect(tuning.tipReflex).toBeLessThan(0.2);
    expect(tuning.curlBias).toBeLessThan(0.1);
    expect(species.longitudinalCurve).toBeLessThan(0.25);
    expect(species.lateralCup).toBeLessThan(1.2);
  });

  it("keeps Lotus petal tips gently recurved across its layers", () => {
    const species = flowerSpecies.Lotus;
    const inner = getHeroPetalTuning("Lotus", species, species.layers[0], 0, 3);
    const outer = getHeroPetalTuning("Lotus", species, species.layers[2], 2, 3);

    expect(inner.tipReflex).toBeGreaterThan(0.1);
    expect(outer.tipReflex).toBeGreaterThan(0.1);
    expect(outer.tipReflex).toBeLessThan(inner.tipReflex);
  });

  it("keeps lily dehiscence furrows darker than pollen-covered anthers", () => {
    const anther = "#9b5428";
    const pollen = "#e4a13a";
    const lilyGroove = getAntherGrooveColor(anther, pollen, true);
    const sharedGroove = getAntherGrooveColor(anther, pollen, false);

    expect(lilyGroove.getHSL({ h: 0, s: 0, l: 0 }).l).toBeLessThan(
      new THREE.Color(anther).getHSL({ h: 0, s: 0, l: 0 }).l,
    );
    expect(lilyGroove.getHSL({ h: 0, s: 0, l: 0 }).l).toBeLessThan(
      sharedGroove.getHSL({ h: 0, s: 0, l: 0 }).l,
    );
  });

  it("keeps lily anthers matte while preserving macro highlight shape", () => {
    const dryLily = getAntherRoughness(0, true);
    const moistLily = getAntherRoughness(1, true);
    const shared = getAntherRoughness(0.5, false);

    expect(dryLily).toBeLessThan(0.92);
    expect(dryLily).toBeGreaterThan(0.85);
    expect(moistLily).toBeGreaterThan(0.7);
    expect(moistLily).toBeLessThan(dryLily);
    expect(getAntherRoughness(0.5, true)).toBeLessThan(shared);
  });

  it("flattens lily anther lobes into broad pollen-bearing sacs", () => {
    const lily = getHeroCenterTuning(
      "Lily",
      flowerSpecies.Lily,
      flowerSpecies.Lily.centerArchitecture ?? "simple",
    );
    const rose = getHeroCenterTuning(
      "Rose",
      flowerSpecies.Rose,
      flowerSpecies.Rose.centerArchitecture ?? "simple",
    );

    expect(lily.antherWidthScale).toBeGreaterThan(1.15);
    expect(lily.antherDepthScale).toBeLessThan(0.65);
    expect(rose.antherWidthScale).toBeLessThan(0.9);
    expect(rose.antherDepthScale).toBeLessThan(0.9);
  });

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

  it("keeps Poppy tissue papery without inflating it and exposes its center", () => {
    const species = flowerSpecies.Poppy;
    const petal = getHeroPetalTuning(
      "Poppy",
      species,
      species.layers[0],
      0,
      species.layers.length,
    );
    const center = getHeroCenterTuning(
      "Poppy",
      species,
      species.centerArchitecture ?? "simple",
    );

    expect(petal.pleatStrength).toBeGreaterThan(1);
    expect(petal.pleatStrength).toBeLessThan(1.2);
    expect(petal.surfaceReliefScale).toBeLessThan(1.8);
    expect(petal.widthScale).toBeGreaterThan(1.22);
    expect(petal.baseWidthScale).toBeGreaterThan(1.4);
    expect(petal.widthVariationScale).toBeLessThan(0.5);
    expect(petal.liftVariationScale).toBeLessThan(0.5);
    expect(petal.individualRollJitter).toBeLessThan(0.05);
    expect(center.radiusScale).toBeGreaterThan(1);
  });

  it("keeps Poppy stigma rays flat and spanning most of the disk radius", () => {
    expect(poppyStigmaDisk.radiusScale).toBeGreaterThan(0.4);
    expect(poppyStigmaDisk.radiusScale).toBeLessThan(0.47);
    expect(poppyStigmaDisk.thicknessScale).toBeLessThan(0.08);
    expect(poppyStigmaDisk.lobeCount).toBe(10);
    expect(poppyStigmaDisk.rimLobeAmplitude).toBeGreaterThan(0.02);
    expect(poppyStigmaDisk.rimLobeAmplitude).toBeLessThan(0.05);
    expect(poppyStigmaDisk.rayLengthScale).toBeGreaterThan(0.35);
    expect(poppyStigmaDisk.rayRadiusScale * 2).toBeCloseTo(
      poppyStigmaDisk.rayLengthScale,
    );
    expect(poppyStigmaDisk.rayDepth).toBeLessThan(poppyStigmaDisk.rayWidth);
    expect(poppyStigmaDisk.crownOffset).toBeGreaterThan(0.01);
  });

  it("keeps Poppy anthers fine and pollen granular rather than bead-like", () => {
    const tuning = getHeroCenterTuning("Poppy", flowerSpecies.Poppy, "simple");

    expect(tuning.antherWidthScale).toBeLessThan(0.8);
    expect(tuning.antherDepthScale).toBeLessThan(0.75);
    expect(poppyStamenSurface.antherLengthScale).toBeLessThan(0.6);
    expect(poppyStamenSurface.pollenScale).toBeLessThanOrEqual(0.5);
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
    ).toMatchObject({
      foldBias: 0.08,
      translucencyScale: 0.92,
      sheenScale: 0.88,
      widthScale: 0.86,
      baseWidthScale: 1.02,
      guideStrengthScale: 1.55,
      lateralCupBias: 0.38,
      longitudinalCurveBias: -0.22,
    });
    expect(
      getHeroPetalTuning("Orchid", species, species.layers[0], 0, 3),
    ).toMatchObject({
      thicknessScale: 0.72,
      translucencyScale: 1.34,
      sheenScale: 1.24,
      surfaceReliefScale: 0.92,
    });
    expect(getHeroCenterTuning("Orchid", species, "column")).toMatchObject({
      floretCountScale: 0.5,
    });
    expect(orchidColumnSilhouette).toHaveLength(8);
    expect(orchidColumnSilhouette[4][0]).toBeGreaterThan(
      orchidColumnSilhouette[1][0],
    );
    expect(orchidColumnSilhouette[0][0]).toBe(0);
    expect(orchidColumnSilhouette.at(-1)?.[0]).toBe(0);
    expect(orchidColumnHood.depth).toBeLessThan(0.15);
    expect(orchidColumnPose.tilt).toBeLessThan(0);
    expect(orchidColumnPose.forwardOffsetScale).toBeGreaterThan(0.4);
    expect(orchidColumnPose.verticalOffsetScale).toBeLessThan(-0.1);
    expect(orchidColumnPose.depthScale).toBeLessThan(
      orchidColumnPose.widthScale,
    );
    expect(orchidColumnPose.lengthScale).toBeLessThan(1);
    expect(orchidPolliniumPose.separationScale).toBeLessThan(
      orchidPolliniumPose.widthScale,
    );
    expect(orchidPolliniumPose.warmColorMix).toBeGreaterThan(0.5);
    expect(shouldRenderCenterBody("column")).toBe(false);
    expect(shouldRenderCenterBody("simple")).toBe(true);
    expect(shouldRenderCenterBody("seedpod")).toBe(true);
    expect(shouldRenderExternalCalyx("column")).toBe(false);
    expect(shouldRenderExternalCalyx("simple")).toBe(true);
    expect(shouldRenderExternalCalyx("simple", "Lily")).toBe(false);
    expect(shouldRenderExternalCalyx("simple", "Rose")).toBe(true);
  });

  it("gives Orchid white tepals a restrained distal reflex", () => {
    const species = flowerSpecies.Orchid;
    const tepal = species.layers[0];
    const lip = species.layers.find((layer) => layer.role === "lip")!;
    expect(
      getHeroPetalTuning("Orchid", species, tepal, 0, species.layers.length)
        .tipReflex,
    ).toBe(0.14);
    expect(
      getHeroPetalTuning("Orchid", species, lip, 1, species.layers.length)
        .tipReflex,
    ).toBe(0.08);
  });

  it("gives rose petals bounded individual seating for natural overlap", () => {
    const tuning = getHeroPetalTuning(
      "Rose",
      flowerSpecies.Rose,
      flowerSpecies.Rose.layers[0],
      0,
      flowerSpecies.Rose.layers.length,
    );

    expect(tuning.individualAngleJitter).toBeGreaterThanOrEqual(0.1);
    expect(tuning.individualAngleJitter).toBeLessThanOrEqual(0.13);
    expect(tuning.individualRollJitter).toBeGreaterThan(0.15);
    expect(tuning.individualLiftJitter).toBeGreaterThan(0.06);
    expect(tuning.widthVariationScale).toBeGreaterThan(1.2);
    expect(tuning.widthVariationScale).toBeLessThan(1.5);
    expect(tuning.baseWidthScale).toBeGreaterThan(1.1);
    expect(tuning.baseWidthScale).toBeLessThan(1.2);
    expect(tuning.placementRadialScale).toBeLessThan(0.8);
  });

  it("varies rose anther poses deterministically", () => {
    const variations = Array.from({ length: 48 }, (_, index) =>
      getRoseStamenVariation(1847, index),
    );

    expect(variations).toEqual(
      Array.from({ length: 48 }, (_, index) =>
        getRoseStamenVariation(1847, index),
      ),
    );
    expect(variations.every(({ antherScale }) => antherScale >= 0.88)).toBe(
      true,
    );
    expect(variations.every(({ antherScale }) => antherScale <= 1.1)).toBe(
      true,
    );
    expect(new Set(variations.map(({ antherYaw }) => antherYaw)).size).toBe(48);
  });

  it("keeps the rose center readable beneath broad petal bases", () => {
    const tuning = getHeroCenterTuning(
      "Rose",
      flowerSpecies.Rose,
      flowerSpecies.Rose.centerArchitecture ?? "simple",
    );

    expect(tuning.radiusScale).toBeGreaterThan(1);
    expect(tuning.sizeScale).toBeGreaterThanOrEqual(1);
    expect(tuning.spreadScale).toBeGreaterThan(1);
    expect(tuning.heightScale).toBeLessThan(1);
    expect(tuning.filamentSpreadScale).toBeGreaterThan(3);
    expect(tuning.filamentSpreadScale).toBeLessThan(5);
    expect(tuning.filamentRadiusScale).toBeLessThan(0.7);
    expect(tuning.antherSizeScale).toBeLessThan(0.5);
    expect(tuning.stamenCountScale).toBeGreaterThan(1.5);
  });

  it("widens the rose reproductive whorl without scaling shared centers", () => {
    expect(getReproductiveRadiusScale("Rose")).toBeCloseTo(1.45);
    expect(getReproductiveRadiusScale("Poppy")).toBe(1);
    expect(getReproductiveRadiusScale("Lily")).toBe(1);
  });

  it("uses a short style beneath the poppy stigmatic disk", () => {
    const tuning = getHeroCenterTuning("Poppy", flowerSpecies.Poppy, "simple");

    expect(tuning.styleLengthScale).toBeLessThan(0.2);
    expect(tuning.ovaryScale).toBeGreaterThan(1);
    expect(tuning.ovaryWidthScale).toBeLessThan(1);
    expect(tuning.ovaryHeightScale).toBeGreaterThan(1.45);
    expect(tuning.ovaryHeightScale).toBeLessThan(1.6);
  });

  it("omits caducous Poppy sepals from the mature external calyx", () => {
    expect(shouldRenderExternalCalyx("simple", "Poppy")).toBe(false);
    expect(shouldRenderExternalCalyx("simple", "Rose")).toBe(true);
  });

  it("splays lily stamens beyond compact flower centers", () => {
    const lily = getHeroCenterTuning("Lily", flowerSpecies.Lily, "simple");
    const poppy = getHeroCenterTuning("Poppy", flowerSpecies.Poppy, "simple");

    expect(lily.filamentSpreadScale).toBeGreaterThan(3);
    expect(lily.filamentSpreadScale).toBeGreaterThan(poppy.filamentSpreadScale);
    expect(lily.filamentRadiusScale).toBeGreaterThan(1.5);
    expect(lily.styleLengthScale).toBeGreaterThan(2);
    expect(lily.styleLengthScale).toBeLessThan(lily.stamenLengthScale * 0.5);
    expect(lily.ovaryHeightScale).toBeGreaterThan(1.5);
    expect(lily.ovaryWidthScale).toBeLessThan(0.9);
    expect(lily.ovaryHeightScale).toBeGreaterThan(lily.ovaryWidthScale * 2);
    expect(poppy.filamentRadiusScale).toBeLessThan(0.45);
    expect(poppy.stamenLengthScale).toBeLessThan(0.9);
    expect(getPollenGrainsPerStamen("draft", true)).toBe(5);
    expect(getPollenGrainsPerStamen("high", true)).toBe(18);
    expect(getPollenGrainsPerStamen("high", false)).toBe(3);
    expect(getPollenGrainsPerStamen("ultra", true)).toBe(28);
  });

  it("gives lily stamens bounded seed-stable individual posture", () => {
    const variations = Array.from({ length: 6 }, (_, index) =>
      getLilyStamenVariation(3141, index),
    );

    expect(variations).toEqual(
      Array.from({ length: 6 }, (_, index) =>
        getLilyStamenVariation(3141, index),
      ),
    );
    expect(new Set(variations.map(({ lengthScale }) => lengthScale)).size).toBe(
      6,
    );
    for (const variation of variations) {
      expect(Math.abs(variation.angleOffset)).toBeLessThanOrEqual(0.035);
      expect(variation.radiusScale).toBeGreaterThanOrEqual(0.96);
      expect(variation.radiusScale).toBeLessThanOrEqual(1.04);
      expect(variation.lengthScale).toBeGreaterThanOrEqual(0.94);
      expect(variation.lengthScale).toBeLessThanOrEqual(1.06);
      expect(Math.abs(variation.leanOffset)).toBeLessThanOrEqual(0.006);
    }
  });

  it("smooths long lily filaments at presentation quality", () => {
    expect(getFilamentSegmentCount("draft", false, true)).toBe(1);
    expect(getFilamentSegmentCount("high", false, true)).toBe(8);
    expect(getFilamentSegmentCount("ultra", false, true)).toBe(12);
    expect(getFilamentSegmentCount("high", false, false)).toBe(2);
    expect(getFilamentSegmentCount("ultra", true, true)).toBe(1);
  });

  it("breaks the poppy stamen halo into seed-stable irregular filaments", () => {
    const variations = Array.from({ length: 42 }, (_, index) =>
      getPoppyStamenVariation(2718, index),
    );

    expect(variations).toEqual(
      Array.from({ length: 42 }, (_, index) =>
        getPoppyStamenVariation(2718, index),
      ),
    );
    expect(new Set(variations.map(({ radialSeat }) => radialSeat)).size).toBe(
      42,
    );
    const angularGaps = variations.map(({ angleOffset }, index) => {
      const angle = (index / variations.length) * Math.PI * 2 + angleOffset;
      const nextIndex = (index + 1) % variations.length;
      const next =
        (nextIndex / variations.length) * Math.PI * 2 +
        variations[nextIndex].angleOffset;
      return nextIndex === 0 ? next + Math.PI * 2 - angle : next - angle;
    });
    expect(Math.max(...angularGaps) - Math.min(...angularGaps)).toBeGreaterThan(
      0.08,
    );
    for (const variation of variations) {
      expect(Math.abs(variation.angleOffset)).toBeLessThanOrEqual(0.085);
      expect(variation.curveScale).toBeGreaterThanOrEqual(0.78);
      expect(variation.curveScale).toBeLessThanOrEqual(1.22);
      expect(Math.abs(variation.lateralCurve)).toBeLessThanOrEqual(0.009);
      expect(variation.radialSeat).toBeGreaterThanOrEqual(0.46);
      expect(variation.radialSeat).toBeLessThanOrEqual(0.82);
      expect(variation.lengthScale).toBeGreaterThanOrEqual(0.74);
      expect(variation.lengthScale).toBeLessThanOrEqual(1.22);
      expect(Math.abs(variation.leanOffset)).toBeLessThanOrEqual(0.009);
      expect(variation.antherScale).toBeGreaterThanOrEqual(0.78);
      expect(variation.antherScale).toBeLessThanOrEqual(1.12);
      expect(variation.antherTilt).toBeGreaterThanOrEqual(0.12);
      expect(variation.antherTilt).toBeLessThanOrEqual(0.38);
      expect(Math.abs(variation.antherYaw)).toBeLessThanOrEqual(0.28);
    }
    expect(new Set(variations.map(({ antherYaw }) => antherYaw)).size).toBe(42);
  });

  it("distributes rugosa stamens continuously across the exposed center", () => {
    const variations = Array.from({ length: 48 }, (_, index) =>
      getRoseStamenVariation(1847, index),
    );

    expect(variations).toEqual(
      Array.from({ length: 48 }, (_, index) =>
        getRoseStamenVariation(1847, index),
      ),
    );
    expect(new Set(variations.map(({ radialSeat }) => radialSeat)).size).toBe(
      48,
    );
    for (const variation of variations) {
      expect(Math.abs(variation.angleOffset)).toBeLessThanOrEqual(0.11);
      expect(variation.radialSeat).toBeGreaterThanOrEqual(0.18);
      expect(variation.radialSeat).toBeLessThanOrEqual(0.82);
      expect(variation.lengthScale).toBeGreaterThanOrEqual(0.78);
      expect(variation.lengthScale).toBeLessThanOrEqual(1.16);
      expect(Math.abs(variation.leanOffset)).toBeLessThanOrEqual(0.015);
    }
  });

  it("builds a deterministic cluster of individually varied rugosa styles", () => {
    expect(getRoseFreeStyleCount("draft")).toBe(5);
    expect(getRoseFreeStyleCount("high")).toBe(8);
    expect(getRoseFreeStyleCount("ultra")).toBe(12);

    const variations = Array.from({ length: 14 }, (_, index) =>
      getRoseFreeStyleVariation(1847, index),
    );
    expect(variations).toEqual(
      Array.from({ length: 14 }, (_, index) =>
        getRoseFreeStyleVariation(1847, index),
      ),
    );
    expect(new Set(variations.map(({ radialSeat }) => radialSeat)).size).toBe(
      14,
    );
    for (const variation of variations) {
      expect(Math.abs(variation.angleOffset)).toBeLessThanOrEqual(0.1);
      expect(variation.radialSeat).toBeGreaterThanOrEqual(0.05);
      expect(variation.radialSeat).toBeLessThanOrEqual(0.16);
      expect(variation.lengthScale).toBeGreaterThanOrEqual(0.52);
      expect(variation.lengthScale).toBeLessThanOrEqual(0.76);
      expect(Math.abs(variation.lean)).toBeLessThanOrEqual(0.05);
      expect(variation.stigmaScale).toBeGreaterThanOrEqual(0.82);
      expect(variation.stigmaScale).toBeLessThanOrEqual(1.16);
    }
  });

  it("packs sunflower florets across the composite receptacle", () => {
    const sunflower = getHeroCenterTuning(
      "Sunflower",
      flowerSpecies.Sunflower,
      "composite",
    );

    expect(sunflower.spreadScale).toBeGreaterThan(1);
    expect(sunflower.floretCountScale).toBeGreaterThanOrEqual(1.15);
    expect(sunflower.floretSizeScale).toBeGreaterThan(1.1);
    expect(sunflower.floretSizeScale).toBeLessThan(1.16);
    expect(sunflower.spreadScale).toBeLessThan(1.06);
    expect(flowerSpecies.Sunflower.diskInnerColor).toBe("#d18a2f");
    expect(flowerSpecies.Sunflower.diskOuterColor).toBe("#95582a");
  });

  it("keeps the sunflower receptacle subordinate beneath the loaded head", () => {
    const sunflower = getHeroStemTuning("Sunflower", flowerSpecies.Sunflower);

    expect(sunflower.calyxScaleX).toBeLessThan(1);
    expect(sunflower.calyxScaleY).toBeLessThan(1);
    expect(sunflower.calyxScaleZ).toBeLessThan(1);
  });

  it("seats the sunflower calyx closer to the composite head", () => {
    expect(getCalyxAssemblyOffset("Sunflower", false)).toBeGreaterThan(
      getCalyxAssemblyOffset("Daisy", false),
    );
    expect(getCalyxAssemblyOffset("Sunflower", false)).toBe(0);
    expect(getCalyxAssemblyOffset("Sunflower", true)).toBeCloseTo(-0.19);
  });

  it("gives lily an oblique bloom and slender stem junction", () => {
    const tuning = getHeroStemTuning("Lily", flowerSpecies.Lily);

    expect(tuning.bloomPitchBias).toBeGreaterThan(0.1);
    expect(tuning.bloomYawBias).not.toBe(0);
    expect(tuning.calyxScaleX).toBeLessThan(0.8);
    expect(tuning.calyxScaleY).toBeGreaterThan(1.2);
    expect(tuning.calyxScaleZ).toBeLessThan(0.8);
    expect(tuning.stemHairinessScale).toBe(0);
    expect(tuning.stemNodeCountScale).toBe(0);
    expect(tuning.stemLenticelScale).toBe(0);
    expect(tuning.axillaryBudScale).toBe(0);
    expect(getHeroLeafTuning("Lily", flowerSpecies.Lily)).toMatchObject({
      leafArrangement: "spiral",
      venation: "parallel",
      petioleScale: 0.18,
      leafWidthScale: 0.64,
      leafLengthScale: 1.22,
      leafGlossScale: 1.08,
    });
    expect(flowerSpecies.Lily.leafPairs).toBe(6);
    expect(getLeafBladeAttachmentOffset(0.18, false, false)).toBeCloseTo(
      0.0468,
    );
    expect(getLeafBladeAttachmentOffset(0.18, true, false)).toBe(0.84);
    expect(getLeafBladeAttachmentOffset(0.18, false, true)).toBe(-0.415);
    expect(getLilyLeafSizeScale(0.5)).toBeGreaterThan(
      getLilyLeafSizeScale(0.28),
    );
    expect(getLilyLeafSizeScale(0.5)).toBeGreaterThan(
      getLilyLeafSizeScale(0.72),
    );
    expect(getLilyLeafSizeScale(0.5)).toBeCloseTo(1);
  });

  it("converges orchid spike blooms toward one display plane", () => {
    const left = getOrchidInflorescenceBloomRotation(
      [0.72, -0.62, 0.42],
      [-0.5, -1, 0.1],
      1,
      6180,
    );
    const right = getOrchidInflorescenceBloomRotation(
      [0.72, 0.62, -0.42],
      [0.5, -0.5, -0.1],
      1,
      6181,
    );

    expect(left).toEqual(
      getOrchidInflorescenceBloomRotation(
        [0.72, -0.62, 0.42],
        [-0.5, -1, 0.1],
        1,
        6180,
      ),
    );
    expect(left[1]).toBeLessThan(0);
    expect(right[1]).toBeGreaterThan(0);
    expect(Math.abs(left[1])).toBeLessThan(0.23);
    expect(Math.abs(right[1])).toBeLessThan(0.23);
    expect(Math.abs(left[2])).toBeLessThan(0.24);
    expect(Math.abs(right[2])).toBeLessThan(0.24);
  });

  it("lets the heavy sunflower head flex its upper internode", () => {
    const sunflower = getHeroStemTuning("Sunflower", flowerSpecies.Sunflower);
    const rose = getHeroStemTuning("Rose", flowerSpecies.Rose);

    expect(sunflower.headLoadBendX).toBeGreaterThan(0.16);
    expect(sunflower.headLoadBendX).toBeLessThan(0.22);
    expect(rose.headLoadBendX).toBe(0);
  });

  it("gives sunflower a full lower-heavy cauline leaf sequence", () => {
    expect(flowerSpecies.Sunflower.leafPairs).toBe(4);
    expect(getSunflowerLeafSizeScale(0.5)).toBeGreaterThan(
      getSunflowerLeafSizeScale(0.28),
    );
    expect(getSunflowerLeafSizeScale(0.5)).toBeGreaterThan(
      getSunflowerLeafSizeScale(0.72),
    );
    expect(getSunflowerLeafSizeScale(0.5)).toBeCloseTo(1.05);
  });

  it("gives sunflower leaves bounded individual posture", () => {
    const lower = getSunflowerLeafPoseVariation(5772, 0.32);
    const upper = getSunflowerLeafPoseVariation(5772, 0.69);

    expect(lower).toEqual(getSunflowerLeafPoseVariation(5772, 0.32));
    expect(lower).not.toEqual(upper);
    for (const pose of [lower, upper]) {
      expect(Math.abs(pose.pitchOffset)).toBeLessThanOrEqual(0.045);
      expect(Math.abs(pose.yawOffset)).toBeLessThanOrEqual(0.05);
      expect(Math.abs(pose.rollOffset)).toBeLessThanOrEqual(0.07);
      expect(pose.curvatureScale).toBeGreaterThanOrEqual(0.88);
      expect(pose.curvatureScale).toBeLessThanOrEqual(1.18);
    }
    expect(lower.curvatureScale).not.toBe(upper.curvatureScale);
  });

  it("gives spiral lily leaves bounded seed-stable pose variation", () => {
    const lower = getLilyLeafPoseVariation(3141, 0.34);
    const upper = getLilyLeafPoseVariation(3141, 0.67);

    expect(lower).toEqual(getLilyLeafPoseVariation(3141, 0.34));
    expect(lower).not.toEqual(upper);
    for (const pose of [lower, upper]) {
      expect(Math.abs(pose.pitchOffset)).toBeLessThanOrEqual(0.06);
      expect(Math.abs(pose.yawOffset)).toBeLessThanOrEqual(0.06);
      expect(Math.abs(pose.rollOffset)).toBeLessThanOrEqual(0.12);
    }
  });

  it("gives lotus petals luminous tissue and restrained radial folds", () => {
    const species = flowerSpecies.Lotus;
    const tuning = getHeroPetalTuning(
      "Lotus",
      species,
      species.layers[0],
      0,
      species.layers.length,
    );

    expect(tuning.translucencyScale).toBeGreaterThan(1);
    expect(tuning.surfaceReliefScale).toBeGreaterThan(1);
    expect(tuning.surfaceReliefScale).toBeLessThan(1.3);
    expect(tuning.thicknessScale).toBeGreaterThan(1);
    const inner = getHeroPetalTuning(
      "Lotus",
      species,
      species.layers[2],
      2,
      species.layers.length,
    );
    expect(inner.placementRadialScale).toBeGreaterThan(
      tuning.placementRadialScale,
    );
    expect(inner.placementLiftBias).toBeLessThan(tuning.placementLiftBias);
    expect(species.layers[2]).toMatchObject({
      count: 0.25,
      lift: 0.46,
      offset: 0.25,
    });
    expect(tuning.pleatStrength).toBeGreaterThan(0);
    expect(tuning.sheenScale).toBeLessThan(1);
  });

  it("keeps lotus seedpod pits smaller than the generic seedpod anatomy", () => {
    const tuning = getHeroCenterTuning("Lotus", flowerSpecies.Lotus, "seedpod");
    expect(tuning.seedpodPitScale).toBeLessThan(1);
    expect(tuning.seedpodPitDepthScale).toBeGreaterThan(1);
  });

  it("allocates enough poppy tessellation to resolve papery creases", () => {
    const species = flowerSpecies.Poppy;
    const tuning = getHeroPetalTuning(
      "Poppy",
      species,
      species.layers[0],
      0,
      species.layers.length,
    );

    expect(tuning.tessellationScale).toBeGreaterThan(1.3);
    expect(tuning.surfaceReliefScale).toBeGreaterThan(1.6);
    expect(tuning.surfaceReliefScale).toBeLessThan(1.8);
    expect(tuning.individualAngleJitter).toBeGreaterThan(0.08);
    expect(tuning.individualRollJitter).toBeGreaterThan(0.03);
    expect(tuning.individualRollJitter).toBeLessThan(0.05);
    expect(tuning.individualLiftJitter).toBeGreaterThan(0.01);
    expect(tuning.individualLiftJitter).toBeLessThan(0.02);
  });

  it("resolves fine relief without corduroy pleats on rugosa petals", () => {
    const species = flowerSpecies.Rose;
    const tuning = getHeroPetalTuning(
      "Rose",
      species,
      species.layers[0],
      0,
      species.layers.length,
    );

    expect(tuning.tessellationScale).toBeGreaterThan(1.2);
    expect(tuning.surfaceReliefScale).toBeGreaterThan(1.5);
    expect(tuning.pleatStrength).toBeGreaterThan(0.04);
    expect(tuning.pleatStrength).toBeLessThan(0.1);
  });

  it("keeps sunflower rays thin, matte, and transmissive", () => {
    const species = flowerSpecies.Sunflower;
    const tuning = getHeroPetalTuning(
      "Sunflower",
      species,
      species.layers[0],
      0,
      species.layers.length,
    );

    expect(tuning.thicknessScale).toBeLessThan(0.8);
    expect(tuning.translucencyScale).toBeGreaterThan(1.3);
    expect(tuning.sheenScale).toBeLessThan(0.8);
    expect(tuning.surfaceReliefScale).toBeGreaterThan(1.5);
    expect(tuning.surfaceReliefScale).toBeLessThan(1.7);
    expect(tuning.tessellationScale).toBeGreaterThan(1.2);
    expect(tuning.widthScale).toBeGreaterThan(0.68);
    expect(tuning.widthScale).toBeLessThan(0.78);
    expect(tuning.tipReflex).toBeGreaterThan(0.05);
    expect(tuning.tipReflex).toBeLessThan(0.2);
    expect(tuning.individualAngleJitter).toBeGreaterThan(0.04);
    expect(tuning.individualAngleJitter).toBeLessThan(0.08);
    expect(tuning.individualRollJitter).toBeGreaterThan(0.05);
  });

  it("gives Poppy papery petals a small free-edge reflex", () => {
    const species = flowerSpecies.Poppy;
    const tuning = getHeroPetalTuning(
      "Poppy",
      species,
      species.layers[0],
      0,
      species.layers.length,
    );

    expect(tuning.tipReflex).toBeGreaterThan(0.04);
    expect(tuning.tipReflex).toBeLessThan(0.12);
  });

  it("adds prickles only to the rose hero stem", () => {
    expect(getHeroStemTuning("Rose", flowerSpecies.Rose)).toMatchObject({
      axillaryBudScale: 0.82,
      bloomScale: 0.7,
      stemNodeCountScale: 0,
      stemNodeBulgeScale: 0.58,
      attachmentSwellingScale: 0.72,
      prickleDensity: 2.8,
      prickleSizeScale: 0.72,
      calyxScaleX: 1.04,
      calyxScaleZ: 1.04,
    });
    expect(getHeroStemTuning("Poppy", flowerSpecies.Poppy).prickleDensity).toBe(
      0,
    );
    expect(
      getHeroStemTuning("Lotus", flowerSpecies.Lotus).axillaryBudScale,
    ).toBe(0);
  });

  it("adds aerial roots only to the orchid hero base", () => {
    expect(getHeroStemTuning("Orchid", flowerSpecies.Orchid)).toMatchObject({
      aerialRootCount: 5,
      stemHairinessScale: 0,
      stemNodeCountScale: 0.7,
      stemNodeBulgeScale: 0.38,
      stemScarScale: 0,
      stemLenticelScale: 0,
      axillaryBudScale: 0,
    });
    expect(getHeroStemTuning("Rose", flowerSpecies.Rose).aerialRootCount).toBe(
      0,
    );
    expect(getHeroStemTuning("Rose", flowerSpecies.Rose).stemScarScale).toBe(1);
  });

  it("stands mature orchid blooms clear of the dark flowering axis", () => {
    const base: [number, number, number] = [0.4, -1.2, -0.05];
    const immature = getOrchidInflorescenceStandOff(base, 0);
    const mature = getOrchidInflorescenceStandOff(base, 1);

    expect(immature).toEqual(base);
    expect(mature[0]).toBeGreaterThan(base[0]);
    expect(mature[2]).toBeGreaterThan(base[2]);
  });

  it("adds restrained axillary shoots to branching hero habits", () => {
    expect(
      getHeroStemTuning("Rose", flowerSpecies.Rose).secondaryShootCount,
    ).toBe(2);
    expect(
      getHeroStemTuning("Rose", flowerSpecies.Rose).secondaryShootScale,
    ).toBeGreaterThan(1.4);
    expect(getSecondaryShootLeafCount("woody")).toBe(2);
    expect(getSecondaryShootLeafCount("coarse")).toBe(0);
    expect(
      getHeroStemTuning("Sunflower", flowerSpecies.Sunflower)
        .secondaryShootScale,
    ).toBeLessThan(0.7);
    expect(
      getHeroStemTuning("Orchid", flowerSpecies.Orchid).secondaryShootCount,
    ).toBe(0);
  });

  it("raises rose basal canes into a young suckering shrub silhouette", () => {
    const first = getRoseBasalCaneControlOffsets(1.55, 0);
    const second = getRoseBasalCaneControlOffsets(1.55, 1);

    expect(first).toHaveLength(4);
    expect(first[3].upward).toBeGreaterThan(1.9);
    expect(first[3].outward).toBeGreaterThan(0.5);
    expect(second[3].outward).toBeLessThan(first[3].outward);
    expect(
      first.every(
        (point, index) => index === 0 || point.upward > first[index - 1].upward,
      ),
    ).toBe(true);
  });

  it("continues rose prickles onto secondary woody canes", () => {
    expect(getSecondaryShootPrickleCount("woody", "draft")).toBe(6);
    expect(getSecondaryShootPrickleCount("woody", "high")).toBe(12);
    expect(getSecondaryShootPrickleCount("woody", "ultra")).toBe(18);
    expect(getSecondaryShootPrickleCount("coarse", "high")).toBe(0);
  });

  it("gives sunflower nodes stronger bounded natural variation", () => {
    const sunflower = getHeroStemTuning("Sunflower", flowerSpecies.Sunflower);
    const rose = getHeroStemTuning("Rose", flowerSpecies.Rose);
    const first = getStemNodeVariation(1847, 2, sunflower.stemNodeIrregularity);

    expect(sunflower.stemNodeIrregularity).toBeGreaterThan(
      rose.stemNodeIrregularity,
    );
    expect(first).toEqual(
      getStemNodeVariation(1847, 2, sunflower.stemNodeIrregularity),
    );
    expect(Math.abs(first.spacingOffset)).toBeLessThanOrEqual(0.0225);
    expect(first.radialScale).toBeGreaterThan(0.94);
    expect(first.radialScale).toBeLessThan(1.06);
    expect(first.axialScale).toBeGreaterThan(0.96);
    expect(first.axialScale).toBeLessThan(1.04);
    expect(sunflower.stemScarScale).toBeGreaterThan(0);
    expect(sunflower.stemScarScale).toBeLessThan(rose.stemScarScale);
    expect(sunflower.stemNodeCountScale).toBe(0);
    expect(sunflower.attachmentSwellingScale).toBeLessThan(0.7);
    expect(sunflower.stemNodeBulgeScale).toBeLessThan(1);
  });

  it("drops poppy sepals while other hero calyces persist", () => {
    expect(
      getHeroStemTuning("Poppy", flowerSpecies.Poppy).sepalPersistence,
    ).toBe(0);
    expect(getHeroStemTuning("Rose", flowerSpecies.Rose).sepalPersistence).toBe(
      1,
    );
  });

  it("keeps Rose sepals long and narrow around the persistent calyx", () => {
    const rose = getHeroStemTuning("Rose", flowerSpecies.Rose);

    expect(rose.sepalLengthScale).toBeGreaterThan(1.35);
    expect(rose.sepalSizeScale).toBeLessThan(0.95);
    expect(rose.sepalSpreadScale).toBeGreaterThan(1);
  });

  it("drops the mature poppy calyx body with its caducous sepals", () => {
    expect(getCalyxRetention(0, 0)).toBe(1);
    expect(getCalyxRetention(1, 0)).toBe(0);
    expect(getCalyxRetention(1, 1)).toBe(1);
    expect(getCalyxRetention(0.6, 0)).toBeGreaterThan(0);
    expect(getCalyxRetention(0.6, 0)).toBeLessThan(1);
  });

  it("gives rose sepals bounded deterministic individual variation", () => {
    const rose = Array.from({ length: 5 }, (_, index) =>
      getCalyxOrganVariation("Rose", 1847, index),
    );

    expect(rose).toEqual(
      Array.from({ length: 5 }, (_, index) =>
        getCalyxOrganVariation("Rose", 1847, index),
      ),
    );
    expect(new Set(rose.map(({ lengthScale }) => lengthScale)).size).toBe(5);
    expect(rose.every(({ lengthScale }) => lengthScale >= 0.92)).toBe(true);
    expect(rose.every(({ lengthScale }) => lengthScale <= 1.08)).toBe(true);
    expect(rose.every(({ widthScale }) => widthScale >= 0.94)).toBe(true);
    expect(rose.every(({ widthScale }) => widthScale <= 1.06)).toBe(true);
    expect(rose.some(({ tilt }) => Math.abs(tilt) > 0.04)).toBe(true);
    expect(getCalyxOrganVariation("Lily", 1847, 2)).toEqual({
      lengthScale: 1,
      widthScale: 1,
      tilt: 0,
      roll: 0,
      azimuth: 0,
      depthScale: 1,
    });
  });

  it("breaks exact repetition across the sunflower involucre", () => {
    const bracts = Array.from({ length: 10 }, (_, index) =>
      getCalyxOrganVariation("Sunflower", 1847, index),
    );

    expect(new Set(bracts.map(({ lengthScale }) => lengthScale)).size).toBe(10);
    expect(bracts.every(({ lengthScale }) => lengthScale >= 0.9)).toBe(true);
    expect(bracts.every(({ lengthScale }) => lengthScale <= 1.1)).toBe(true);
    expect(bracts.every(({ widthScale }) => widthScale >= 0.93)).toBe(true);
    expect(bracts.every(({ widthScale }) => widthScale <= 1.07)).toBe(true);
    expect(bracts.every(({ azimuth }) => Math.abs(azimuth) <= 0.035)).toBe(
      true,
    );
    expect(new Set(bracts.map(({ depthScale }) => depthScale)).size).toBe(10);
    expect(bracts.every(({ depthScale }) => depthScale >= 0.82)).toBe(true);
    expect(bracts.every(({ depthScale }) => depthScale <= 1.18)).toBe(true);
  });

  it("layers sunflower phyllaries into three distinct overlapping whorls", () => {
    const outer = getSunflowerPhyllaryWhorlTuning(0);
    const middle = getSunflowerPhyllaryWhorlTuning(1);
    const inner = getSunflowerPhyllaryWhorlTuning(2);

    expect(outer.lengthScale).toBeGreaterThan(middle.lengthScale);
    expect(middle.lengthScale).toBeGreaterThan(inner.lengthScale);
    expect(outer.widthScale).toBeLessThan(middle.widthScale);
    expect(middle.widthScale).toBeLessThan(inner.widthScale);
    expect(outer.tilt).toBeGreaterThan(middle.tilt);
    expect(middle.tilt).toBeGreaterThan(inner.tilt);
    expect(
      new Set([
        outer.angleOffsetScale,
        middle.angleOffsetScale,
        inner.angleOffsetScale,
      ]).size,
    ).toBe(3);
  });

  it("gives poppy buds a nodding growth posture", () => {
    const poppy = getHeroStemTuning("Poppy", flowerSpecies.Poppy);
    expect(poppy.budNod).toBeGreaterThan(0.6);
    expect(poppy.secondaryShootCount).toBe(1);
    expect(poppy.secondaryShootBudKind).toBe("poppy-floral");
    const offsets = getSecondaryShootControlOffsets(
      poppy.secondaryShootBudKind,
      poppy.secondaryShootScale,
    );
    expect(offsets.at(-1)?.upward).toBeLessThan(offsets.at(-2)?.upward ?? 0);
    expect(
      Math.abs(getSecondaryShootAzimuthOffset("poppy-floral")),
    ).toBeGreaterThan(0.7);
    expect(getSecondaryShootAzimuthOffset("vegetative")).toBe(0);
    expect(getHeroStemTuning("Rose", flowerSpecies.Rose).budNod).toBe(0);
    expect(
      getHeroStemTuning("Rose", flowerSpecies.Rose).secondaryShootBudKind,
    ).toBe("vegetative");
  });

  it("uses compound leaflets only for the rose hero foliage", () => {
    const rose = getHeroLeafTuning("Rose", flowerSpecies.Rose);

    expect(rose.leafletPairs).toBe(3);
    expect(rose.attachmentScale).toBeGreaterThan(1.2);
    expect(rose.attachmentEnd).toBeGreaterThan(0.85);
    expect(rose.serrationScale).toBeLessThan(0.6);
    expect(getHeroLeafTuning("Lily", flowerSpecies.Lily).leafletPairs).toBe(0);
  });

  it("uses a deeply pinnatifid blade only for poppy hero foliage", () => {
    const poppy = getHeroLeafTuning("Poppy", flowerSpecies.Poppy);
    expect(poppy.leafShape).toBe("pinnatifid");
    expect(poppy.serrationScale).toBeLessThan(0.7);
    expect(poppy.attachmentScale).toBeGreaterThan(1.1);
    expect(poppy.attachmentStart).toBeLessThan(0.2);
    expect(getHeroLeafTuning("Rose", flowerSpecies.Rose).leafShape).toBe(
      "ovate",
    );
  });

  it("tapers poppy leaves progressively toward the terminal bloom", () => {
    const lower = getPoppyLeafSizeScale(0.22);
    const middle = getPoppyLeafSizeScale(0.5);
    const upper = getPoppyLeafSizeScale(0.78);

    expect(lower).toBeCloseTo(1.12);
    expect(middle).toBeLessThan(lower);
    expect(middle).toBeGreaterThan(upper);
    expect(upper).toBeCloseTo(0.58);
    expect(getPoppyLeafSizeScale(-1)).toBeCloseTo(1.12);
    expect(getPoppyLeafSizeScale(2)).toBeCloseTo(0.58);
  });

  it("keeps poppy foliage matte beneath the papery flower", () => {
    expect(
      getHeroLeafTuning("Poppy", flowerSpecies.Poppy).leafGlossScale,
    ).toBeLessThan(0.65);
    expect(
      getHeroLeafTuning("Rose", flowerSpecies.Rose).leafGlossScale,
    ).toBeGreaterThan(1.5);
  });

  it("gives thin and coarse hero leaves restrained two-sided subsurface fill", () => {
    expect(getLeafSubsurfaceFill("Poppy", "front")).toBeGreaterThan(0);
    expect(getLeafSubsurfaceFill("Poppy", "back")).toBeGreaterThan(
      getLeafSubsurfaceFill("Poppy", "front"),
    );
    expect(getLeafSubsurfaceFill("Rose", "front")).toBe(0);
    expect(getLeafSubsurfaceFill("Lily", "front")).toBeGreaterThan(0);
    expect(getLeafSubsurfaceFill("Lily", "back")).toBeGreaterThan(
      getLeafSubsurfaceFill("Lily", "front"),
    );
    expect(getLeafSubsurfaceFill("Lily", "front")).toBeLessThanOrEqual(0.06);
    expect(getLeafSubsurfaceFill("Lily", "back")).toBeLessThanOrEqual(0.09);
    expect(getLeafSubsurfaceFill("Sunflower", "front")).toBeGreaterThan(0);
    expect(getLeafSubsurfaceFill("Sunflower", "back")).toBeGreaterThan(
      getLeafSubsurfaceFill("Sunflower", "front"),
    );
    expect(getLeafSubsurfaceFill("Sunflower", "back")).toBeLessThan(0.07);
  });

  it("integrates pinnate relief into rose and sunflower photo foliage", () => {
    expect(getIntegratedPinnateVeinRelief("Sunflower")).toBe(1);
    expect(getIntegratedPinnateVeinRelief("Rose")).toBeCloseTo(0.72);
    expect(getIntegratedPinnateVeinRelief("Poppy")).toBeCloseTo(0.56);
    expect(getIntegratedPinnateVeinRelief("Lily")).toBe(0);
  });

  it("keeps the lotus flower scape smooth and leafless", () => {
    const lotus = getHeroStemTuning("Lotus", flowerSpecies.Lotus);
    const sunflower = getHeroStemTuning("Sunflower", flowerSpecies.Sunflower);

    expect(lotus.stemHairinessScale).toBe(0);
    expect(lotus.stemNodeCountScale).toBe(0);
    expect(lotus.stemLenticelScale).toBe(0);
    expect(lotus.axillaryBudScale).toBe(0);
    expect(sunflower.stemHairinessScale).toBeGreaterThan(0);
    expect(sunflower.stemNodeCountScale).toBe(0);
    expect(sunflower.attachmentSwellingScale).toBeGreaterThan(0);
    expect(sunflower.stemLenticelScale).toBe(0);
    expect(
      getHeroStemTuning("Rose", flowerSpecies.Rose).stemLenticelScale,
    ).toBeGreaterThan(0);
  });

  it("keeps poppy stems herbaceous while retaining sparse hairs", () => {
    const poppy = getHeroStemTuning("Poppy", flowerSpecies.Poppy);

    expect(poppy.stemNodeCountScale).toBe(0);
    expect(poppy.stemLenticelScale).toBe(0);
    expect(poppy.stemHairinessScale).toBeGreaterThan(0);
    expect(poppy.secondaryShootCount).toBe(1);
    expect(poppy.secondaryShootBudKind).toBe("poppy-floral");
    expect(getSecondaryShootMaterialVariant(poppy.secondaryShootBudKind)).toBe(
      "glaucous",
    );
    expect(getSecondaryShootMaterialVariant("vegetative")).toBe("default");
    expect(getSecondaryShootMaterialVariant("vegetative", "woody")).toBe(
      "woody",
    );
    expect(getSecondaryShootMaterialVariant("vegetative", "coarse")).toBe(
      "coarse",
    );
    expect(getSecondaryShootHairCount(poppy.secondaryShootBudKind)).toBe(7);
    expect(getSecondaryShootHairCount("vegetative")).toBe(0);
    expect(getSecondaryShootHairCount("vegetative", "coarse")).toBe(5);
    expect(getSecondaryShootHairCount("vegetative", "woody")).toBe(0);
  });

  it("gives poppy foliage a sparse hispid surface", () => {
    const poppy = getHeroLeafTuning("Poppy", flowerSpecies.Poppy);
    const sunflower = getHeroLeafTuning("Sunflower", flowerSpecies.Sunflower);

    expect(poppy.leafHairiness).toBeGreaterThan(0);
    expect(poppy.leafHairiness).toBeLessThan(sunflower.leafHairiness);
  });

  it("sizes seven-part rose foliage around a dominant middle pair", () => {
    const leaflets = getCompoundLeafletPlacements(3);
    const pairScales = [0, 1, 2].map(
      (pair) => (leaflets[pair * 2].scale + leaflets[pair * 2 + 1].scale) / 2,
    );

    expect(leaflets).toHaveLength(7);
    expect(pairScales[1]).toBeGreaterThan(pairScales[0]);
    expect(pairScales[1]).toBeGreaterThan(pairScales[2]);
    expect(leaflets[1].scale).toBeGreaterThan(leaflets[0].scale);
    expect(leaflets.map(({ y }) => y)).toEqual([
      0.22, 0.22, 0.48, 0.48, 0.74, 0.74, 1,
    ]);
  });

  it("gives each compound rose leaflet a stable individual geometry seed", () => {
    const seeds = Array.from({ length: 7 }, (_, index) =>
      getCompoundLeafletGeometrySeed(1847, 0.42, 1, index),
    );

    expect(seeds).toEqual(
      Array.from({ length: 7 }, (_, index) =>
        getCompoundLeafletGeometrySeed(1847, 0.42, 1, index),
      ),
    );
    expect(new Set(seeds).size).toBe(7);
    expect(getCompoundLeafletGeometrySeed(1847, 0.42, -1, 0)).not.toBe(
      seeds[0],
    );
  });

  it("loosens mirrored rose leaflet poses within botanical bounds", () => {
    const poses = Array.from({ length: 6 }, (_, index) =>
      getCompoundLeafletPoseVariation(1847, 0.42, 1, index),
    );

    expect(poses).toEqual(
      Array.from({ length: 6 }, (_, index) =>
        getCompoundLeafletPoseVariation(1847, 0.42, 1, index),
      ),
    );
    expect(new Set(poses.map(({ rollOffset }) => rollOffset)).size).toBe(6);
    for (const pose of poses) {
      expect(Math.abs(pose.heightOffset)).toBeLessThanOrEqual(0.009);
      expect(Math.abs(pose.pitchOffset)).toBeLessThanOrEqual(0.03);
      expect(Math.abs(pose.yawOffset)).toBeLessThanOrEqual(0.035);
      expect(Math.abs(pose.rollOffset)).toBeLessThanOrEqual(0.05);
      expect(pose.scale).toBeGreaterThanOrEqual(0.98);
      expect(pose.scale).toBeLessThanOrEqual(1.02);
    }
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

  it("gives lily tepals a joined, cupped throat and strong distal reflex", () => {
    const outer = getHeroPetalTuning(
      "Lily",
      flowerSpecies.Lily,
      flowerSpecies.Lily.layers[0],
      0,
      flowerSpecies.Lily.layers.length,
    );
    const inner = getHeroPetalTuning(
      "Lily",
      flowerSpecies.Lily,
      flowerSpecies.Lily.layers[1],
      1,
      flowerSpecies.Lily.layers.length,
    );

    expect(outer.baseWidthScale).toBeGreaterThan(2);
    expect(outer.placementRadialScale).toBeLessThan(0.75);
    expect(outer.lateralCupBias).toBeGreaterThan(0.25);
    expect(outer.longitudinalCurveBias).toBeGreaterThan(0.25);
    expect(outer.tipReflex).toBeGreaterThan(0.65);
    expect(outer.edgeRuffleScale).toBeGreaterThan(0.85);
    expect(outer.edgeRuffleScale).toBeLessThan(1);
    expect(outer.tessellationScale).toBeGreaterThan(1.2);
    expect(outer.individualAngleJitter).toBeGreaterThan(0);
    expect(outer.individualAngleJitter).toBeGreaterThan(0.06);
    expect(outer.individualAngleJitter).toBeLessThan(0.09);
    expect(outer.individualRollJitter).toBeGreaterThan(
      outer.individualAngleJitter,
    );
    expect(outer.individualLiftJitter).toBeGreaterThan(0.03);
    expect(outer.individualLiftJitter).toBeLessThan(0.05);
    expect(outer.lengthScale).toBeGreaterThan(inner.lengthScale);
    expect(outer.widthScale).toBeLessThan(inner.widthScale);
    expect(outer.tipReflex).toBeGreaterThan(inner.tipReflex);
    expect(inner.lateralCupBias).toBeGreaterThan(outer.lateralCupBias);
  });

  it("keeps single rugosa petals softly folded instead of radially ribbed", () => {
    const rose = getHeroPetalTuning(
      "Rose",
      flowerSpecies.Rose,
      flowerSpecies.Rose.layers[0],
      0,
      1,
    );

    expect(rose.pleatStrength).toBeLessThan(0.1);
    expect(rose.foldBias).toBeLessThan(0.05);
    expect(rose.asymmetryScale).toBeGreaterThan(1);
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
      leafWidthScale: 0.92,
      leafGlossScale: 1.42,
      bladeRoll: -0.28,
    });
    expect(getHeroLeafTuning("Lotus", flowerSpecies.Lotus).attachmentEnd).toBe(
      0.13,
    );
    expect(getHeroLeafTuning("Lotus", flowerSpecies.Lotus).leafShape).toBe(
      "peltate",
    );
  });

  it("fans orchid crown leaves into distinct planes by attachment height", () => {
    expect(getOrchidLeafFanOffset(0.03)).toBeLessThan(0);
    expect(getOrchidLeafFanOffset(0.09)).toBeGreaterThan(0);
    expect(getOrchidLeafFanOffset(0.06)).toBeCloseTo(0);
  });

  it("keeps the orchid median lip compact within a separated spike", () => {
    const lip = flowerSpecies.Orchid.layers.find(
      (layer) => layer.role === "lip",
    );
    expect(lip).toMatchObject({
      length: 0.52,
      width: 0.62,
      outline: "labellum",
      lateralCup: 2.72,
    });
    expect(flowerSpecies.Orchid.inflorescenceSpread).toBe(0.56);
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

  it("uses species-specific phyllotaxy for cauline hero leaves", () => {
    for (const preset of ["Rose", "Poppy", "Sunflower"] as const) {
      expect(
        getHeroLeafTuning(preset, flowerSpecies[preset]).leafArrangement,
      ).toBe("alternate");
    }
    expect(getHeroLeafTuning("Lily", flowerSpecies.Lily).leafArrangement).toBe(
      "spiral",
    );
    expect(
      getHeroLeafTuning("Orchid", flowerSpecies.Orchid).leafArrangement,
    ).toBe("opposite");
    expect(
      getHeroLeafTuning("Lotus", flowerSpecies.Lotus).leafArrangement,
    ).toBe("alternate");
  });

  it("rotates stem attachment frames with spiral leaf azimuth", () => {
    const tangent = new THREE.Vector3(0, 1, 0);
    const azimuth = Math.PI * (3 - Math.sqrt(5));
    const radial = new THREE.Vector3(1, 0, 0);
    const neutralDirection = radial
      .clone()
      .applyQuaternion(getLeafAttachmentFrame(tangent));
    const spiralDirection = radial
      .clone()
      .applyQuaternion(getLeafAttachmentFrame(tangent, azimuth));

    expect(neutralDirection).toEqual(radial);
    expect(spiralDirection.dot(neutralDirection)).toBeCloseTo(
      Math.cos(azimuth),
    );
    expect(Math.abs(spiralDirection.z)).toBeGreaterThan(0.5);
  });

  it("scales leaf-attachment swellings with species stem anatomy", () => {
    const lily = getLeafAttachmentSwelling(
      getHeroStemTuning("Lily", flowerSpecies.Lily).stemNodeBulgeScale,
    );
    const sunflower = getLeafAttachmentSwelling(
      getHeroStemTuning("Sunflower", flowerSpecies.Sunflower)
        .stemNodeBulgeScale,
    );
    const orchid = getLeafAttachmentSwelling(
      getHeroStemTuning("Orchid", flowerSpecies.Orchid).stemNodeBulgeScale,
    );

    expect(lily.scale[0]).toBeLessThan(sunflower.scale[0]);
    expect(lily.scale[2]).toBeLessThan(sunflower.scale[2]);
    expect(orchid.scale[0]).toBeLessThan(lily.scale[0]);
    expect(lily.offset).toBeGreaterThan(0.035);
    expect(lily.offset).toBeLessThan(0.05);
  });
});
