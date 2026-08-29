import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  getAquaticScapeMicroNormalSlope,
  getAquaticPetalMicroNormalSlope,
  getSeedMicroNormalSlope,
  getPitMicroNormalSlope,
  getReceptacleMicroNormalSlope,
  getDiskFloretMicroNormalSlope,
  getBotanicalAgeTexture,
  getAntherMaterialVariant,
  getBotanicalMaterialTexture,
  getCalyxBodyMaterialVariant,
  getCalyxBladeMaterialVariant,
  getRoseCalyxMicroNormalSlope,
  getStemMaterialVariant,
  getPetioleMaterialVariant,
  getOvaryMaterialVariant,
  getGlaucousStemMicroNormalSlope,
  getFleshyPetalVascularField,
  getFleshyPetalCuticleVariation,
  getFleshyPetalLaminaVariation,
  getFleshyPetalMicroNormalSlope,
  getMonocotStemMicroNormalSlope,
  getInvolucreMicroNormalSlope,
  getLilyAntherMicroNormalSlope,
  getLilyTepalMarginPigment,
  getLilyTepalMarginWeathering,
  getOrchidSpikeMicroNormalSlope,
  getCoarseStemMicroNormalSlope,
  getCoarseLeafMicroNormalSlope,
  getGlaucousLeafMicroNormalSlope,
  getLigulatePetalMicroNormalSlope,
  getLigulatePetalLaminaCellField,
  getLigulatePetalPigmentField,
  getLilyTepalMicroNormalSlope,
  getRoseLeafMicroNormalSlope,
  getMonocotLeafMicroNormalSlope,
  getPeltateLeafMicroNormalSlope,
  getPaperyMicroNormalSlope,
  getPaperyMembraneVariation,
  getPaperyVascularField,
  getPeltateVascularField,
  getOrchidTepalVascularField,
  getSepalMicroNormalSlope,
  getVelamenMicroNormalSlope,
  getPetalSpotCenters,
  getWoodyStemMicroNormalSlope,
  getBotanicalTexture,
  getPetalAlbedoTexture,
} from "@/lib/botanical-textures";

describe("botanical textures", () => {
  it.each(["petal", "leaf", "stem", "center"] as const)(
    "creates a reusable %s data texture",
    (surface) => {
      const texture = getBotanicalTexture(surface);

      expect(texture.image.width).toBe(128);
      expect(texture.image.height).toBe(128);
      expect(texture.version).toBeGreaterThan(0);
      expect(getBotanicalTexture(surface)).toBe(texture);
    },
  );

  it("uses a denser repeat for fibrous stems", () => {
    const stem = getBotanicalTexture("stem");
    const petal = getBotanicalTexture("petal");

    expect(stem.repeat.x).toBeGreaterThan(petal.repeat.x);
    expect(stem.repeat.y).toBeGreaterThan(petal.repeat.y);
  });

  it("maps one continuous anatomical texture across petals and leaves", () => {
    const petal = getBotanicalMaterialTexture("petal", "thickness");
    const leaf = getBotanicalTexture("leaf");
    const center = getBotanicalTexture("center");

    expect(petal.repeat.toArray()).toEqual([1, 1]);
    expect(leaf.repeat.toArray()).toEqual([1, 1]);
    expect(petal.wrapT).toBe(THREE.ClampToEdgeWrapping);
    expect(leaf.wrapT).toBe(THREE.ClampToEdgeWrapping);
    expect(center.repeat.toArray()).toEqual([2, 2]);
  });

  it("creates and caches tier-specific texture resolutions", () => {
    const draft = getBotanicalTexture("petal", 64);
    const ultra = getBotanicalTexture("petal", 256);

    expect(draft.image.width).toBe(64);
    expect(ultra.image.width).toBe(256);
    expect(draft).not.toBe(ultra);
    expect(getBotanicalTexture("petal", 64)).toBe(draft);
  });

  it.each(["roughness", "thickness", "backscatter", "moisture"] as const)(
    "creates a reusable RGBA %s map with a green channel",
    (map) => {
      const texture = getBotanicalMaterialTexture("petal", map);
      const data = texture.image.data as Uint8Array;

      expect(texture.image.width).toBe(128);
      expect(data).toHaveLength(128 * 128 * 4);
      expect(data[0]).toBe(data[1]);
      expect(getBotanicalMaterialTexture("petal", map)).toBe(texture);
    },
  );

  it("encodes reusable tangent-space micro normals", () => {
    const texture = getBotanicalMaterialTexture("petal", "microNormal");
    const data = texture.image.data as Uint8Array;

    expect(data[2]).toBeGreaterThan(200);
    expect(
      data.some((channel, index) => index % 4 === 0 && channel !== 128),
    ).toBe(true);
    expect(getBotanicalMaterialTexture("petal", "microNormal")).toBe(texture);
  });

  it("gives papery petals irregular directional crease normals", () => {
    const slope = getPaperyMicroNormalSlope(0.37, 0.56);
    const repeated = getPaperyMicroNormalSlope(0.37, 0.56);
    const attachment = getPaperyMicroNormalSlope(0.37, 0);
    const texture = getBotanicalMaterialTexture(
      "petal",
      "microNormal",
      128,
      "papery",
    );

    expect(slope).toEqual(repeated);
    expect(Math.abs(slope.x)).toBeLessThan(0.34);
    expect(Math.abs(slope.y)).toBeLessThan(0.44);
    expect(attachment.x).toBeCloseTo(0);
    expect(attachment.y).toBeCloseTo(0);
    expect(texture).not.toBe(
      getBotanicalMaterialTexture("petal", "microNormal"),
    );
  });

  it("gives lotus petals restrained aquatic normal breakup", () => {
    const slope = getAquaticPetalMicroNormalSlope(0.37, 0.56);
    const edge = getAquaticPetalMicroNormalSlope(0.02, 0.56);
    const attachment = getAquaticPetalMicroNormalSlope(0.37, 0);
    const tip = getAquaticPetalMicroNormalSlope(0.37, 1);
    const normal = getBotanicalMaterialTexture(
      "petal",
      "microNormal",
      128,
      "lotus",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.04);
    expect(Math.abs(slope.y)).toBeLessThan(0.04);
    expect(edge.x).not.toBeCloseTo(slope.x, 3);
    expect(attachment.x).toBeCloseTo(0);
    expect(attachment.y).toBeCloseTo(0);
    expect(tip.x).toBeCloseTo(0);
    expect(tip.y).toBeCloseTo(0);
    expect(normal).not.toBe(
      getBotanicalMaterialTexture("petal", "microNormal"),
    );
  });

  it("gives lily anthers restrained longitudinal pollen-sac texture", () => {
    const slope = getLilyAntherMicroNormalSlope(0.37, 0.56);
    const tip = getLilyAntherMicroNormalSlope(0.37, 1);
    const normal = getBotanicalMaterialTexture(
      "center",
      "microNormal",
      128,
      "anther",
    );
    const roughness = getBotanicalMaterialTexture(
      "center",
      "roughness",
      128,
      "anther",
    );

    expect(getAntherMaterialVariant("Lily")).toBe("anther");
    expect(getAntherMaterialVariant("Sunflower")).toBe("disk");
    expect(getAntherMaterialVariant("Rose")).toBe("default");
    expect(Math.abs(slope.x)).toBeLessThan(0.065);
    expect(Math.abs(slope.y)).toBeLessThan(0.04);
    expect(tip.x).toBeCloseTo(0);
    expect(tip.y).toBeCloseTo(0);
    expect(normal).not.toBe(
      getBotanicalMaterialTexture("center", "microNormal"),
    );
    expect(roughness).not.toBe(
      getBotanicalMaterialTexture("center", "roughness"),
    );
  });

  it("gives rose canes longitudinal woody grain and rough lenticels", () => {
    const slope = getWoodyStemMicroNormalSlope(0.37, 0.56);
    const woodyNormal = getBotanicalMaterialTexture(
      "stem",
      "microNormal",
      128,
      "woody",
    );
    const woodyRoughness = getBotanicalMaterialTexture(
      "stem",
      "roughness",
      128,
      "woody",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.17);
    expect(Math.abs(slope.y)).toBeLessThan(0.28);
    expect(woodyNormal).not.toBe(
      getBotanicalMaterialTexture("stem", "microNormal"),
    );
    expect(woodyRoughness).not.toBe(
      getBotanicalMaterialTexture("stem", "roughness"),
    );
  });

  it("gives rose calyx bodies compact longitudinal receptacle tissue", () => {
    const slope = getRoseCalyxMicroNormalSlope(0.37, 0.56);
    const base = getRoseCalyxMicroNormalSlope(0.37, 0);
    const normal = getBotanicalMaterialTexture(
      "stem",
      "microNormal",
      128,
      "calyx",
    );
    const roughness = getBotanicalMaterialTexture(
      "stem",
      "roughness",
      128,
      "calyx",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.06);
    expect(Math.abs(slope.y)).toBeLessThan(0.05);
    expect(base.x).toBeCloseTo(0);
    expect(base.y).toBeCloseTo(0);
    expect(normal).not.toBe(getBotanicalMaterialTexture("stem", "microNormal"));
    expect(roughness).not.toBe(
      getBotanicalMaterialTexture("stem", "roughness"),
    );
  });

  it("gives fleshy rose petals shallow vascular normal relief", () => {
    const slope = getFleshyPetalMicroNormalSlope(0.67, 0.5);
    const mirrored = getFleshyPetalMicroNormalSlope(0.33, 0.5);
    const attachment = getFleshyPetalMicroNormalSlope(0.67, 0);
    const samples = Array.from({ length: 15 }, (_, row) =>
      Array.from({ length: 15 }, (_, column) =>
        getFleshyPetalMicroNormalSlope(column / 14, row / 14),
      ),
    ).flat();
    const normal = getBotanicalMaterialTexture(
      "petal",
      "microNormal",
      128,
      "veined",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.1);
    expect(Math.abs(slope.y)).toBeLessThan(0.08);
    expect(Math.max(...samples.map(({ x }) => Math.abs(x)))).toBeLessThan(0.12);
    expect(Math.max(...samples.map(({ y }) => Math.abs(y)))).toBeLessThan(0.1);
    expect(mirrored.x).not.toBeCloseTo(-slope.x, 4);
    expect(mirrored.y).not.toBeCloseTo(slope.y, 4);
    expect(attachment.x).toBeCloseTo(0);
    expect(attachment.y).toBeCloseTo(0);
    expect(normal).not.toBe(
      getBotanicalMaterialTexture("petal", "microNormal"),
    );
  });

  it("adds bounded tertiary vasculature and cuticle breakup to Rose petals", () => {
    const branch = getFleshyPetalVascularField(0.691, 0.55);
    const besideBranch = getFleshyPetalVascularField(0.67, 0.55);
    const cuticle = Array.from({ length: 81 }, (_, index) =>
      getFleshyPetalCuticleVariation(index / 80, 0.54),
    );

    expect(branch).toBeGreaterThan(besideBranch);
    expect(Math.max(...cuticle)).toBeLessThanOrEqual(1);
    expect(Math.min(...cuticle)).toBeGreaterThanOrEqual(-1);
    expect(getFleshyPetalCuticleVariation(0.5, 0)).toBeCloseTo(0);
    expect(getFleshyPetalCuticleVariation(0.5, 1)).toBeCloseTo(0);
  });

  it("shares bounded mesoscopic Rose lamina variation across material maps", () => {
    const lamina = Array.from({ length: 81 }, (_, index) =>
      getFleshyPetalLaminaVariation(index / 80, 0.54),
    );

    expect(Math.max(...lamina)).toBeLessThanOrEqual(1);
    expect(Math.min(...lamina)).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...lamina) - Math.min(...lamina)).toBeGreaterThan(0.5);
    expect(getFleshyPetalLaminaVariation(0.5, 0)).toBeCloseTo(0);
    expect(getFleshyPetalLaminaVariation(0.5, 1)).toBeCloseTo(0);
  });

  it("gives sunflower stems coarse fibers and trichome-socket relief", () => {
    const slope = getCoarseStemMicroNormalSlope(0.37, 0.56);
    const coarseNormal = getBotanicalMaterialTexture(
      "stem",
      "microNormal",
      128,
      "coarse",
    );
    const coarseRoughness = getBotanicalMaterialTexture(
      "stem",
      "roughness",
      128,
      "coarse",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.18);
    expect(Math.abs(slope.y)).toBeLessThan(0.25);
    expect(coarseNormal).not.toBe(
      getBotanicalMaterialTexture("stem", "microNormal"),
    );
    expect(coarseNormal).not.toBe(
      getBotanicalMaterialTexture("stem", "microNormal", 128, "woody"),
    );
    expect(coarseRoughness).not.toBe(
      getBotanicalMaterialTexture("stem", "roughness"),
    );
  });

  it("gives sunflower leaves coarse midrib and edge tissue", () => {
    const normal = getBotanicalMaterialTexture(
      "leaf",
      "thickness",
      128,
      "coarse",
    );
    const roughness = getBotanicalMaterialTexture(
      "leaf",
      "roughness",
      128,
      "coarse",
    );
    const defaultThickness = getBotanicalMaterialTexture("leaf", "thickness");
    const data = normal.image.data as Uint8Array;
    const channelAt = (u: number, v: number) =>
      data[(Math.round(v * 127) * 128 + Math.round(u * 127)) * 4 + 1];

    expect(normal).not.toBe(defaultThickness);
    expect(roughness).not.toBe(
      getBotanicalMaterialTexture("leaf", "roughness"),
    );
    expect(channelAt(0.5, 0.5)).toBeGreaterThan(channelAt(0.42, 0.5));
  });

  it("gives coarse sunflower leaves restrained fiber normals", () => {
    const slope = getCoarseLeafMicroNormalSlope(0.37, 0.56);
    const bump = getBotanicalTexture("leaf", 128, "coarse");
    const normal = getBotanicalMaterialTexture(
      "leaf",
      "microNormal",
      128,
      "coarse",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.1);
    expect(Math.abs(slope.y)).toBeLessThan(0.08);
    expect(bump).toBe(getBotanicalTexture("leaf", 128, "coarse"));
    expect(bump).not.toBe(getBotanicalTexture("leaf", 128));
    expect(normal).not.toBe(getBotanicalMaterialTexture("leaf", "microNormal"));
  });

  it("gives lily tepals bounded longitudinal fibers with quiet endpoints", () => {
    const slope = getLilyTepalMicroNormalSlope(0.37, 0.56);
    const repeated = getLilyTepalMicroNormalSlope(0.37, 0.56);
    const attachment = getLilyTepalMicroNormalSlope(0.37, 0);
    const tip = getLilyTepalMicroNormalSlope(0.37, 1);
    const normal = getBotanicalMaterialTexture(
      "petal",
      "microNormal",
      256,
      "parallel",
    );

    expect(slope).toEqual(repeated);
    expect(Math.abs(slope.x)).toBeGreaterThan(0.01);
    expect(Math.abs(slope.x)).toBeLessThan(0.08);
    expect(Math.abs(slope.y)).toBeLessThan(0.03);
    expect(attachment).toEqual({ x: 0, y: 0 });
    expect(tip.x).toBeCloseTo(0);
    expect(tip.y).toBeCloseTo(0);
    expect(normal).not.toBe(
      getBotanicalMaterialTexture("petal", "microNormal", 256),
    );
  });

  it("gives poppy leaves restrained glaucous wax-bloom tissue", () => {
    const slope = getGlaucousLeafMicroNormalSlope(0.37, 0.56);
    const normal = getBotanicalMaterialTexture(
      "leaf",
      "microNormal",
      128,
      "glaucous",
    );
    const roughness = getBotanicalMaterialTexture(
      "leaf",
      "roughness",
      128,
      "glaucous",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.06);
    expect(Math.abs(slope.y)).toBeLessThan(0.04);
    expect(normal).not.toBe(getBotanicalMaterialTexture("leaf", "microNormal"));
    expect(roughness).not.toBe(
      getBotanicalMaterialTexture("leaf", "roughness"),
    );
  });

  it("gives rose leaflets pinnate vascular material continuity", () => {
    const slope = getRoseLeafMicroNormalSlope(0.37, 0.56);
    const normal = getBotanicalMaterialTexture(
      "leaf",
      "microNormal",
      128,
      "veined",
    );
    const thickness = getBotanicalMaterialTexture(
      "leaf",
      "thickness",
      128,
      "veined",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.08);
    expect(Math.abs(slope.y)).toBeLessThan(0.08);
    expect(normal).not.toBe(getBotanicalMaterialTexture("leaf", "microNormal"));
    expect(thickness).not.toBe(
      getBotanicalMaterialTexture("leaf", "thickness"),
    );
  });

  it("gives lily leaves restrained parallel epidermal normals", () => {
    const slope = getMonocotLeafMicroNormalSlope(0.37, 0.56);
    const normal = getBotanicalMaterialTexture(
      "leaf",
      "microNormal",
      128,
      "parallel",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.06);
    expect(Math.abs(slope.y)).toBeLessThan(0.04);
    expect(normal).not.toBe(getBotanicalMaterialTexture("leaf", "microNormal"));
  });

  it("gives lotus pads restrained radial vascular normals", () => {
    const slope = getPeltateLeafMicroNormalSlope(0.72, 0.5);
    const center = getPeltateLeafMicroNormalSlope(0.5, 0.5);
    const normal = getBotanicalMaterialTexture(
      "leaf",
      "microNormal",
      128,
      "peltate",
    );

    expect(Math.abs(slope.x)).toBeGreaterThan(Math.abs(slope.y));
    expect(center.x).toBeCloseTo(0);
    expect(center.y).toBeCloseTo(0);
    expect(normal).not.toBe(getBotanicalMaterialTexture("leaf", "microNormal"));
  });

  it("gives lotus scapes restrained axial hydrated tissue", () => {
    const slope = getAquaticScapeMicroNormalSlope(0.37, 0.56);
    const aquaticNormal = getBotanicalMaterialTexture(
      "stem",
      "microNormal",
      128,
      "aquatic",
    );
    const aquaticRoughness = getBotanicalMaterialTexture(
      "stem",
      "roughness",
      128,
      "aquatic",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.1);
    expect(Math.abs(slope.y)).toBeLessThan(0.05);
    expect(getInvolucreMicroNormalSlope(0.38, 0.56)).not.toEqual(slope);
    expect(aquaticNormal).not.toBe(
      getBotanicalMaterialTexture("stem", "microNormal"),
    );
    expect(aquaticNormal).not.toBe(
      getBotanicalMaterialTexture("stem", "microNormal", 128, "coarse"),
    );
    expect(aquaticRoughness).not.toBe(
      getBotanicalMaterialTexture("stem", "roughness"),
    );
  });

  it("routes hero support tissues to species-specific material variants", () => {
    expect(getStemMaterialVariant("Rose")).toBe("woody");
    expect(getStemMaterialVariant("Sunflower")).toBe("coarse");
    expect(getStemMaterialVariant("Lotus")).toBe("aquatic");
    expect(getStemMaterialVariant("Poppy")).toBe("glaucous");
    expect(getStemMaterialVariant("Lily")).toBe("monocot");
    expect(getStemMaterialVariant("Orchid")).toBe("spike");
    expect(getPetioleMaterialVariant("Rose")).toBe("default");
    expect(getPetioleMaterialVariant("Sunflower")).toBe("coarse");
    expect(getPetioleMaterialVariant("Lotus")).toBe("aquatic");
    expect(getPetioleMaterialVariant("Poppy")).toBe("glaucous");
    expect(getPetioleMaterialVariant("Lily")).toBe("monocot");
    expect(getPetioleMaterialVariant("Orchid")).toBe("spike");
    expect(getCalyxBodyMaterialVariant("Sunflower")).toBe("coarse");
    expect(getCalyxBodyMaterialVariant("Rose")).toBe("calyx");
    expect(getCalyxBladeMaterialVariant("Rose")).toBe("sepal");
    expect(getCalyxBladeMaterialVariant("Sunflower")).toBe("involucre");
    expect(getCalyxBladeMaterialVariant("Poppy")).toBe("glaucous");
    expect(getOvaryMaterialVariant("Lily")).toBe("monocot");
    expect(getOvaryMaterialVariant("Poppy")).toBe("default");
  });

  it("gives sunflower involucre bracts coarse axial tissue", () => {
    const slope = getInvolucreMicroNormalSlope(0.37, 0.56);
    const base = getInvolucreMicroNormalSlope(0.37, 0);
    const tip = getInvolucreMicroNormalSlope(0.37, 1);
    const normal = getBotanicalMaterialTexture(
      "leaf",
      "microNormal",
      128,
      "involucre",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.08);
    expect(Math.abs(slope.y)).toBeLessThan(0.04);
    expect(Math.abs(base.x) + Math.abs(base.y)).toBe(0);
    expect(Math.abs(tip.x) + Math.abs(tip.y)).toBe(0);
    expect(normal).not.toBe(getBotanicalMaterialTexture("leaf", "microNormal"));
  });

  it("gives orchid spikes a smooth tensioned epidermis", () => {
    const slope = getOrchidSpikeMicroNormalSlope(0.37, 0.56);
    const spikeNormal = getBotanicalMaterialTexture(
      "stem",
      "microNormal",
      128,
      "spike",
    );
    const spikeRoughness = getBotanicalMaterialTexture(
      "stem",
      "roughness",
      128,
      "spike",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.04);
    expect(Math.abs(slope.y)).toBeLessThan(0.013);
    expect(spikeNormal).not.toBe(
      getBotanicalMaterialTexture("stem", "microNormal"),
    );
    expect(spikeRoughness).not.toBe(
      getBotanicalMaterialTexture("stem", "roughness"),
    );
  });

  it("gives lily stems fine longitudinal monocot epidermis", () => {
    const slope = getMonocotStemMicroNormalSlope(0.37, 0.56);
    const monocotNormal = getBotanicalMaterialTexture(
      "stem",
      "microNormal",
      128,
      "monocot",
    );
    const monocotRoughness = getBotanicalMaterialTexture(
      "stem",
      "roughness",
      128,
      "monocot",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.05);
    expect(Math.abs(slope.y)).toBeLessThan(0.02);
    expect(monocotNormal).not.toBe(
      getBotanicalMaterialTexture("stem", "microNormal"),
    );
    expect(monocotRoughness).not.toBe(
      getBotanicalMaterialTexture("stem", "roughness"),
    );
  });

  it("gives poppy supports fine glaucous wax-bloom breakup", () => {
    const slope = getGlaucousStemMicroNormalSlope(0.37, 0.56);
    const glaucousNormal = getBotanicalMaterialTexture(
      "stem",
      "microNormal",
      128,
      "glaucous",
    );
    const glaucousRoughness = getBotanicalMaterialTexture(
      "stem",
      "roughness",
      128,
      "glaucous",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.07);
    expect(Math.abs(slope.y)).toBeLessThan(0.04);
    expect(glaucousNormal).not.toBe(
      getBotanicalMaterialTexture("stem", "microNormal"),
    );
    expect(glaucousRoughness).not.toBe(
      getBotanicalMaterialTexture("stem", "roughness"),
    );
  });

  it("gives rose sepals longitudinal relief and thin-tip anatomy", () => {
    const slope = getSepalMicroNormalSlope(0.37, 0.56);
    const attachment = getSepalMicroNormalSlope(0.37, 0);
    const tip = getSepalMicroNormalSlope(0.37, 1);
    const normal = getBotanicalMaterialTexture(
      "leaf",
      "microNormal",
      128,
      "sepal",
    );
    const thickness = getBotanicalMaterialTexture(
      "leaf",
      "thickness",
      128,
      "sepal",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.08);
    expect(Math.abs(slope.y)).toBeLessThan(0.06);
    expect(attachment.x).toBeCloseTo(0);
    expect(attachment.y).toBeCloseTo(0);
    expect(tip.x).toBeCloseTo(0);
    expect(tip.y).toBeCloseTo(0);
    expect(normal).not.toBe(getBotanicalMaterialTexture("leaf", "microNormal"));
    expect(thickness).not.toBe(
      getBotanicalMaterialTexture("leaf", "thickness"),
    );
  });

  it("gives orchid velamen restrained porous longitudinal relief", () => {
    const slope = getVelamenMicroNormalSlope(0.37, 0.56);
    const normal = getBotanicalMaterialTexture(
      "stem",
      "microNormal",
      128,
      "velamen",
    );
    const roughness = getBotanicalMaterialTexture(
      "stem",
      "roughness",
      128,
      "velamen",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.13);
    expect(Math.abs(slope.y)).toBeLessThan(0.07);
    expect(normal).not.toBe(getBotanicalMaterialTexture("stem", "microNormal"));
    expect(normal).not.toBe(
      getBotanicalMaterialTexture("stem", "microNormal", 128, "coarse"),
    );
    expect(roughness).not.toBe(
      getBotanicalMaterialTexture("stem", "roughness"),
    );
  });

  it("gives broad orchid tepals softly diverging vascular thickness", () => {
    const center = getOrchidTepalVascularField(0.5, 0.5);
    const branch = getOrchidTepalVascularField(0.725, 0.5);
    const membrane = getOrchidTepalVascularField(0.66, 0.5);
    const thickness = getBotanicalMaterialTexture(
      "petal",
      "thickness",
      128,
      "orchid",
    );
    const backscatter = getBotanicalMaterialTexture(
      "petal",
      "backscatter",
      128,
      "orchid",
    );

    expect(center).toBeGreaterThan(0.7);
    expect(branch).toBeGreaterThan(membrane);
    expect(getOrchidTepalVascularField(0.5, 0)).toBeCloseTo(0);
    expect(getOrchidTepalVascularField(0.5, 1)).toBeCloseTo(0);
    expect(thickness).not.toBe(
      getBotanicalMaterialTexture("petal", "thickness"),
    );
    expect(backscatter).not.toBe(
      getBotanicalMaterialTexture("petal", "backscatter"),
    );
  });

  it("aligns lotus pad thickness and roughness with radial vasculature", () => {
    const vascular = getPeltateVascularField(0.75, 0.5);
    const interveinal = getPeltateVascularField(0.73, 0.58);
    const thickness = getBotanicalMaterialTexture(
      "leaf",
      "thickness",
      128,
      "peltate",
    );
    const roughness = getBotanicalMaterialTexture(
      "leaf",
      "roughness",
      128,
      "peltate",
    );

    expect(vascular).toBeGreaterThan(interveinal);
    expect(getPeltateVascularField(0.5, 0.5)).toBeCloseTo(0);
    expect(getPeltateVascularField(1, 0.5)).toBeCloseTo(0);
    expect(thickness).not.toBe(
      getBotanicalMaterialTexture("leaf", "thickness"),
    );
    expect(roughness).not.toBe(
      getBotanicalMaterialTexture("leaf", "roughness"),
    );
  });

  it("gives monocot leaves parallel vascular thickness and roughness", () => {
    const thickness = getBotanicalMaterialTexture(
      "leaf",
      "thickness",
      128,
      "parallel",
    );
    const roughness = getBotanicalMaterialTexture(
      "leaf",
      "roughness",
      128,
      "parallel",
    );
    const thicknessData = thickness.image.data as Uint8Array;
    const roughnessData = roughness.image.data as Uint8Array;
    const channelAt = (data: Uint8Array, u: number) =>
      data[(64 * 128 + Math.round(u * 127)) * 4 + 1];

    expect(channelAt(thicknessData, 0.5)).toBeGreaterThan(
      channelAt(thicknessData, 0.57),
    );
    expect(channelAt(roughnessData, 0.5)).toBeLessThan(
      channelAt(roughnessData, 0.57),
    );
    expect(thickness).not.toBe(
      getBotanicalMaterialTexture("leaf", "thickness"),
    );
    expect(roughness).not.toBe(
      getBotanicalMaterialTexture("leaf", "roughness"),
    );
  });

  it("makes petal veins thicker than the nearby tissue", () => {
    const texture = getBotanicalMaterialTexture("petal", "thickness");
    const data = texture.image.data as Uint8Array;
    const y = 64;
    const channelAt = (x: number) => data[(y * 128 + x) * 4 + 1];

    expect(channelAt(64)).toBeGreaterThan(channelAt(42));
  });

  it("drives petal backscatter toward thin margins and away from veins", () => {
    const texture = getBotanicalMaterialTexture("petal", "backscatter");
    const data = texture.image.data as Uint8Array;
    const y = 64;
    const channelAt = (x: number) => data[(y * 128 + x) * 4 + 1];

    expect(channelAt(2)).toBeGreaterThan(channelAt(42));
    expect(channelAt(42)).toBeGreaterThan(channelAt(64));
  });

  it("gives papery petals stronger vein-to-membrane thickness contrast", () => {
    const regular = getBotanicalMaterialTexture("petal", "thickness");
    const papery = getBotanicalMaterialTexture(
      "petal",
      "thickness",
      128,
      "papery",
    );
    const contrast = (texture: THREE.DataTexture) => {
      const data = texture.image.data as Uint8Array;
      const values = Array.from(data).filter((_, index) => index % 4 === 1);
      return Math.max(...values) - Math.min(...values);
    };

    expect(papery).not.toBe(regular);
    expect(contrast(papery)).toBeGreaterThan(contrast(regular));
  });

  it("fans papery vascular ribs outward from the petal attachment", () => {
    const primary = getPaperyVascularField(0.67, 0.5);
    const mirrored = getPaperyVascularField(0.33, 0.5);

    expect(primary).toBeGreaterThan(getPaperyVascularField(0.61, 0.5));
    expect(mirrored).toBeCloseTo(primary);
    expect(getPaperyVascularField(0.67, 0)).toBeCloseTo(0);
    expect(getPaperyVascularField(0.79, 1)).toBeCloseTo(0);
  });

  it("keeps poppy pigment spots in the basal attachment zone", () => {
    const spots = getPetalSpotCenters(2718, 0.25, "poppy");

    expect(spots.length).toBeGreaterThan(0);
    expect(Math.max(...spots.map((spot) => spot.v))).toBeLessThanOrEqual(0.22);
  });

  it("adds vascular absorption and broad living pigment to poppy petal albedo", () => {
    const texture = getPetalAlbedoTexture(
      0,
      2718,
      0,
      0,
      128,
      undefined,
      undefined,
      "poppy",
    );
    const data = texture.image.data as Uint8Array;
    const sample = (u: number, v: number, channel: number) => {
      const x = Math.round(u * 127);
      const y = Math.round(v * 127);
      return data[(y * 128 + x) * 4 + channel];
    };

    expect(sample(0.67, 0.5, 1)).toBeLessThan(sample(0.61, 0.5, 1));
    expect(sample(0.67, 0.5, 1)).toBeGreaterThan(210);
  });

  it("adds restrained vascular and mottled pigment to rose petal albedo", () => {
    const texture = getPetalAlbedoTexture(
      0,
      1847,
      0,
      0,
      128,
      undefined,
      undefined,
      "rose",
    );
    const repeated = getPetalAlbedoTexture(
      0,
      1847,
      0,
      0,
      128,
      undefined,
      undefined,
      "rose",
    );
    const data = texture.image.data as Uint8Array;
    const green = Array.from({ length: 56 }, (_, index) => {
      const x = 36 + index;
      return data[(64 * 128 + x) * 4 + 1];
    });

    expect(texture).toBe(repeated);
    expect(Math.max(...green) - Math.min(...green)).toBeGreaterThan(5);
    expect(Math.max(...green) - Math.min(...green)).toBeLessThan(30);
  });

  it("adds subtle longitudinal pigment hierarchy to sunflower ray albedo", () => {
    const center = getLigulatePetalPigmentField(0.5, 0.52, 1847);
    const interveinal = getLigulatePetalPigmentField(0.39, 0.52, 1847);
    const base = getLigulatePetalPigmentField(0.5, 0, 1847);
    const texture = getPetalAlbedoTexture(
      0,
      1847,
      0,
      0,
      128,
      undefined,
      undefined,
      "ligulate",
    );
    const data = texture.image.data as Uint8Array;
    const sample = (u: number, v: number, channel: number) => {
      const x = Math.round(u * 127);
      const y = Math.round(v * 127);
      return data[(y * 128 + x) * 4 + channel];
    };

    expect(center.vascular).toBeGreaterThan(interveinal.vascular);
    expect(base.vascular).toBeCloseTo(0);
    expect(sample(0.5, 0.52, 1)).toBeLessThan(sample(0.39, 0.52, 1));
    expect(sample(0.5, 0.52, 1)).toBeGreaterThan(230);
  });

  it("embeds papery vascular relief into the micro-normal", () => {
    const onVein = getPaperyMicroNormalSlope(0.67, 0.5);
    const offVein = getPaperyMicroNormalSlope(0.61, 0.5);

    expect(onVein.x).not.toBeCloseTo(offVein.x);
    expect(onVein.y).not.toBeCloseTo(offVein.y);
  });

  it("keeps papery vascular paths organic and membrane thickness broad", () => {
    const straightMidPath = (v: number) => 0.5 + 0.045 + v * 0.25;
    const earlyPeak = getPaperyVascularField(straightMidPath(0.28), 0.28);
    const earlyOffset = getPaperyVascularField(
      straightMidPath(0.28) + 0.008,
      0.28,
    );
    const latePeak = getPaperyVascularField(straightMidPath(0.66), 0.66);
    const lateOffset = getPaperyVascularField(
      straightMidPath(0.66) + 0.008,
      0.66,
    );

    expect(Math.sign(earlyPeak - earlyOffset)).not.toBe(
      Math.sign(latePeak - lateOffset),
    );
    expect(getPaperyMembraneVariation(0.24, 0.47)).not.toBeCloseTo(
      getPaperyMembraneVariation(0.42, 0.47),
    );
    expect(
      Math.abs(getPaperyMembraneVariation(0.24, 0.47)),
    ).toBeLessThanOrEqual(1);
    expect(getPaperyMembraneVariation(0.24, 0)).toBeCloseTo(0);
    expect(getPaperyMembraneVariation(0.24, 1)).toBeCloseTo(0);
  });

  it("keeps poppy vascular ribs darker than membrane in backscatter", () => {
    const texture = getBotanicalMaterialTexture(
      "petal",
      "backscatter",
      128,
      "papery",
    );
    const data = texture.image.data as Uint8Array;
    const channelAt = (u: number) =>
      data[(64 * 128 + Math.round(u * 127)) * 4 + 1];

    expect(channelAt(0.67)).toBeLessThan(channelAt(0.61));
  });

  it("keeps poppy backscatter contrast above the generic petal field", () => {
    const papery = getBotanicalMaterialTexture(
      "petal",
      "backscatter",
      128,
      "papery",
    );
    const contrast = (texture: THREE.DataTexture) => {
      const data = texture.image.data as Uint8Array;
      const values = Array.from(data).filter((_, index) => index % 4 === 1);
      return Math.max(...values) - Math.min(...values);
    };

    expect(contrast(papery)).toBeGreaterThan(140);
  });

  it("breaks papery highlights across creases while retaining smoother veins", () => {
    const regular = getBotanicalMaterialTexture("petal", "roughness");
    const papery = getBotanicalMaterialTexture(
      "petal",
      "roughness",
      128,
      "papery",
    );
    const data = papery.image.data as Uint8Array;
    const channelAt = (u: number, v: number) =>
      data[(Math.round(v * 127) * 128 + Math.round(u * 127)) * 4 + 1];
    const samples = [0.18, 0.29, 0.41, 0.57, 0.72, 0.84].map((u) =>
      channelAt(u, 0.58),
    );

    expect(papery).not.toBe(regular);
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(24);
    expect(channelAt(0.67, 0.5)).toBeLessThan(channelAt(0.61, 0.5));
  });

  it("preserves fine vascular contrast in fleshy veined petals", () => {
    const regular = getBotanicalMaterialTexture("petal", "thickness");
    const veined = getBotanicalMaterialTexture(
      "petal",
      "thickness",
      128,
      "veined",
    );
    const data = (texture: THREE.DataTexture) =>
      texture.image.data as Uint8Array;
    const channelAt = (texture: THREE.DataTexture, x: number, y: number) =>
      data(texture)[(y * 128 + x) * 4 + 1];

    expect(veined).not.toBe(regular);
    expect(
      channelAt(veined, 64, 64) - channelAt(veined, 42, 64),
    ).toBeGreaterThan(channelAt(regular, 64, 64) - channelAt(regular, 42, 64));
  });

  it("aligns rose roughness with softly diverging fleshy vasculature", () => {
    const branch = getFleshyPetalVascularField(0.635, 0.5);
    const membrane = getFleshyPetalVascularField(0.58, 0.5);
    const regular = getBotanicalMaterialTexture("petal", "roughness");
    const veined = getBotanicalMaterialTexture(
      "petal",
      "roughness",
      128,
      "veined",
    );
    const data = veined.image.data as Uint8Array;
    const channelAt = (u: number, v: number) =>
      data[(Math.round(v * 127) * 128 + Math.round(u * 127)) * 4 + 1];

    expect(branch).toBeGreaterThan(membrane);
    expect(getFleshyPetalVascularField(0.635, 0)).toBeCloseTo(0);
    expect(getFleshyPetalVascularField(0.83, 1)).toBeCloseTo(0);
    expect(veined).not.toBe(regular);
    expect(channelAt(0.635, 0.5)).toBeLessThan(channelAt(0.58, 0.5));
  });

  it("aligns sunflower ray roughness with ligulate vascular bands", () => {
    const regular = getBotanicalMaterialTexture("petal", "roughness");
    const ligulate = getBotanicalMaterialTexture(
      "petal",
      "roughness",
      128,
      "ligulate",
    );
    const data = ligulate.image.data as Uint8Array;
    const channelAt = (u: number, v: number) =>
      data[(Math.round(v * 127) * 128 + Math.round(u * 127)) * 4 + 1];

    expect(ligulate).not.toBe(regular);
    expect(channelAt(0.5, 0.5)).toBeLessThan(channelAt(0.42, 0.5));
    expect(channelAt(0.28, 0.5)).toBeLessThan(channelAt(0.36, 0.5));
    expect(
      Math.abs(channelAt(0.36, 0.28) - channelAt(0.36, 0.72)),
    ).toBeLessThan(18);
    expect(channelAt(0.5, 0.86)).toBeGreaterThan(channelAt(0.5, 0.58));
    expect(channelAt(0.04, 0.58)).toBeGreaterThan(channelAt(0.5, 0.58));
  });

  it("gives sunflower rays shallow three-band normal relief", () => {
    const slope = getLigulatePetalMicroNormalSlope(0.37, 0.56);
    const repeated = getLigulatePetalMicroNormalSlope(0.37, 0.56);
    const neighboringTissue = getLigulatePetalMicroNormalSlope(0.41, 0.56);
    const normal = getBotanicalMaterialTexture(
      "petal",
      "microNormal",
      128,
      "ligulate",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.1);
    expect(Math.abs(slope.y)).toBeLessThan(0.04);
    expect(slope).toEqual(repeated);
    expect(Math.abs(slope.x - neighboringTissue.x)).toBeGreaterThan(0.001);
    expect(getLigulatePetalMicroNormalSlope(0.37, 0).x).toBeCloseTo(0);
    expect(getLigulatePetalMicroNormalSlope(0.37, 1).y).toBeCloseTo(0);
    expect(normal).not.toBe(
      getBotanicalMaterialTexture("petal", "microNormal"),
    );
  });

  it("replaces generic radiating bump veins with ligulate parallel bands", () => {
    const generic = getBotanicalTexture("petal", 128);
    const ligulate = getBotanicalTexture("petal", 128, "ligulate");
    const data = ligulate.image.data as Uint8Array;
    const channelAt = (u: number, v: number) =>
      data[Math.round(v * 127) * 128 + Math.round(u * 127)];

    expect(ligulate).toBe(getBotanicalTexture("petal", 128, "ligulate"));
    expect(ligulate).not.toBe(generic);
    expect(channelAt(0.5, 0.5)).toBeGreaterThan(channelAt(0.4, 0.5));
    expect(channelAt(0.28, 0.5)).toBeGreaterThan(channelAt(0.4, 0.5));
    expect(channelAt(0.72, 0.5)).toBeGreaterThan(channelAt(0.6, 0.5));
    expect(Math.abs(channelAt(0.5, 0.3) - channelAt(0.5, 0.7))).toBeLessThan(
      22,
    );
    expect(channelAt(0.5, 0)).toBeLessThan(channelAt(0.5, 0.5));
  });

  it("keeps ligulate tip and margin weathering shallow and localized", () => {
    const body = getLigulatePetalPigmentField(0.5, 0.55, 5772);
    const tip = getLigulatePetalPigmentField(0.5, 0.9, 5772);
    const margin = getLigulatePetalPigmentField(0.03, 0.55, 5772);
    const base = getLigulatePetalPigmentField(0.5, 0, 5772);

    expect(body.tip).toBeLessThan(0.01);
    expect(tip.tip).toBeGreaterThan(0.5);
    expect(margin.margin).toBeGreaterThan(0.4);
    expect(base.margin).toBeCloseTo(0);
    expect(tip.tip).toBeLessThanOrEqual(1);
    expect(margin.margin).toBeLessThanOrEqual(1);
  });

  it("aligns orchid tepal roughness with diverging vascular paths", () => {
    const regular = getBotanicalMaterialTexture("petal", "roughness");
    const orchid = getBotanicalMaterialTexture(
      "petal",
      "roughness",
      128,
      "orchid",
    );
    const data = orchid.image.data as Uint8Array;
    const channelAt = (u: number, v: number) =>
      data[(Math.round(v * 127) * 128 + Math.round(u * 127)) * 4 + 1];

    expect(orchid).not.toBe(regular);
    expect(channelAt(0.5, 0.5)).toBeLessThan(channelAt(0.66, 0.5));
    expect(channelAt(0.72, 0.5)).toBeLessThan(channelAt(0.66, 0.5));
    expect(
      Math.abs(channelAt(0.66, 0.24) - channelAt(0.66, 0.76)),
    ).toBeLessThan(20);
  });

  it("gives lotus petals hydrated margins and broad low-frequency breakup", () => {
    const regular = getBotanicalMaterialTexture("petal", "roughness");
    const lotus = getBotanicalMaterialTexture(
      "petal",
      "roughness",
      128,
      "lotus",
    );
    const data = lotus.image.data as Uint8Array;
    const channelAt = (u: number, v: number) =>
      data[(Math.round(v * 127) * 128 + Math.round(u * 127)) * 4 + 1];

    expect(lotus).not.toBe(regular);
    expect(channelAt(0.02, 0.5)).toBeLessThan(channelAt(0.18, 0.5));
    expect(channelAt(0.5, 0.5)).toBeLessThan(channelAt(0.42, 0.5));
    expect(
      Math.abs(channelAt(0.42, 0.24) - channelAt(0.42, 0.76)),
    ).toBeLessThan(20);
  });

  it("aligns lotus petal thickness with hydrated edge and tip taper", () => {
    const regular = getBotanicalMaterialTexture("petal", "thickness");
    const lotus = getBotanicalMaterialTexture(
      "petal",
      "thickness",
      128,
      "lotus",
    );
    const data = lotus.image.data as Uint8Array;
    const channelAt = (u: number, v: number) =>
      data[(Math.round(v * 127) * 128 + Math.round(u * 127)) * 4 + 1];

    expect(lotus).not.toBe(regular);
    expect(channelAt(0.02, 0.5)).toBeLessThan(channelAt(0.18, 0.5));
    expect(channelAt(0.5, 0.98)).not.toBe(channelAt(0.5, 0.5));
    expect(channelAt(0.5, 0.02)).not.toBe(channelAt(0.5, 0.5));
  });

  it("keeps lotus backscatter tied to its hydrated thickness anatomy", () => {
    const regular = getBotanicalMaterialTexture("petal", "backscatter");
    const lotus = getBotanicalMaterialTexture(
      "petal",
      "backscatter",
      128,
      "lotus",
    );
    const data = lotus.image.data as Uint8Array;
    const channelAt = (u: number, v: number) =>
      data[(Math.round(v * 127) * 128 + Math.round(u * 127)) * 4 + 1];

    expect(lotus).not.toBe(regular);
    expect(channelAt(0.02, 0.5)).toBeGreaterThan(channelAt(0.18, 0.5));
    expect(channelAt(0.5, 0.5)).not.toBe(channelAt(0.5, 0.02));
  });

  it("gives lotus petal clearcoat a restrained aquatic moisture field", () => {
    const regular = getBotanicalMaterialTexture("petal", "moisture");
    const lotus = getBotanicalMaterialTexture(
      "petal",
      "moisture",
      128,
      "lotus",
    );
    const data = lotus.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(lotus).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(50);
    expect(Math.max(...values)).toBeLessThan(210);
  });

  it("gives papery petals a restrained low-droplet moisture field", () => {
    const regular = getBotanicalMaterialTexture("petal", "moisture");
    const papery = getBotanicalMaterialTexture(
      "petal",
      "moisture",
      128,
      "papery",
    );
    const data = papery.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(papery).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(55);
    expect(Math.max(...values)).toBeLessThan(180);
  });

  it("gives fleshy rose petals a broad hydrated moisture field", () => {
    const regular = getBotanicalMaterialTexture("petal", "moisture");
    const rose = getBotanicalMaterialTexture(
      "petal",
      "moisture",
      128,
      "veined",
    );
    const data = rose.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(rose).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(45);
    expect(Math.max(...values)).toBeLessThan(190);
  });

  it("gives lily tepals a restrained parallel-tissue moisture field", () => {
    const regular = getBotanicalMaterialTexture("petal", "moisture");
    const lily = getBotanicalMaterialTexture(
      "petal",
      "moisture",
      128,
      "parallel",
    );
    const data = lily.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(lily).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(45);
    expect(Math.max(...values)).toBeLessThan(180);
  });

  it("gives sunflower rays a restrained ligulate moisture field", () => {
    const regular = getBotanicalMaterialTexture("petal", "moisture");
    const ligulate = getBotanicalMaterialTexture(
      "petal",
      "moisture",
      128,
      "ligulate",
    );
    const data = ligulate.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(ligulate).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(45);
    expect(Math.max(...values)).toBeLessThan(175);
  });

  it("gives sunflower disk crowns a restrained moisture field", () => {
    const regular = getBotanicalMaterialTexture("center", "moisture");
    const disk = getBotanicalMaterialTexture("center", "moisture", 128, "disk");
    const data = disk.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(disk).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(75);
    expect(Math.max(...values)).toBeLessThan(150);
  });

  it("gives lotus leaves a restrained hydrophobic moisture field", () => {
    const regular = getBotanicalMaterialTexture("leaf", "moisture");
    const lotus = getBotanicalMaterialTexture("leaf", "moisture", 128, "lotus");
    const data = lotus.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(lotus).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(55);
    expect(Math.max(...values)).toBeLessThan(230);
  });

  it("gives sunflower leaves a restrained coarse moisture field", () => {
    const regular = getBotanicalMaterialTexture("leaf", "moisture");
    const coarse = getBotanicalMaterialTexture(
      "leaf",
      "moisture",
      128,
      "coarse",
    );
    const data = coarse.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(coarse).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(50);
    expect(Math.max(...values)).toBeLessThan(200);
  });

  it("gives poppy leaves a restrained glaucous moisture field", () => {
    const regular = getBotanicalMaterialTexture("leaf", "moisture");
    const glaucous = getBotanicalMaterialTexture(
      "leaf",
      "moisture",
      128,
      "glaucous",
    );
    const data = glaucous.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(glaucous).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(55);
    expect(Math.max(...values)).toBeLessThan(180);
  });

  it("gives orchid leaves a restrained velamen moisture field", () => {
    const regular = getBotanicalMaterialTexture("leaf", "moisture");
    const velamen = getBotanicalMaterialTexture(
      "leaf",
      "moisture",
      128,
      "velamen",
    );
    const data = velamen.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(velamen).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(50);
    expect(Math.max(...values)).toBeLessThan(190);
  });

  it("gives rose leaflets a restrained veined moisture field", () => {
    const regular = getBotanicalMaterialTexture("leaf", "moisture");
    const veined = getBotanicalMaterialTexture(
      "leaf",
      "moisture",
      128,
      "veined",
    );
    const data = veined.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(veined).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(45);
    expect(Math.max(...values)).toBeLessThan(195);
  });

  it("gives lotus developing seeds a restrained matte grain", () => {
    const regular = getBotanicalMaterialTexture("center", "roughness");
    const seed = getBotanicalMaterialTexture(
      "center",
      "roughness",
      128,
      "seed",
    );
    const data = seed.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(seed).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(160);
    expect(Math.max(...values)).toBeLessThan(245);
  });

  it("gives developing seeds low-amplitude organic normals", () => {
    const slope = getSeedMicroNormalSlope(0.37, 0.56);
    const normal = getBotanicalMaterialTexture(
      "center",
      "microNormal",
      128,
      "seed",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.02);
    expect(Math.abs(slope.y)).toBeLessThan(0.02);
    expect(normal).not.toBe(
      getBotanicalMaterialTexture("center", "microNormal"),
    );
  });

  it("gives lotus carpel pits restrained warm wall roughness", () => {
    const regular = getBotanicalMaterialTexture("center", "roughness");
    const pit = getBotanicalMaterialTexture("center", "roughness", 128, "pit");
    const data = pit.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(pit).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(175);
    expect(Math.max(...values)).toBeLessThan(235);
  });

  it("gives lotus carpel pits low-amplitude wall normals", () => {
    const slope = getPitMicroNormalSlope(0.37, 0.56);
    const rim = getPitMicroNormalSlope(0.37, 0);
    const center = getPitMicroNormalSlope(0.37, 1);
    const normal = getBotanicalMaterialTexture(
      "center",
      "microNormal",
      128,
      "pit",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.025);
    expect(Math.abs(slope.y)).toBeLessThan(0.025);
    expect(rim.x).toBeCloseTo(0);
    expect(rim.y).toBeCloseTo(0);
    expect(center.x).toBeCloseTo(0);
    expect(center.y).toBeCloseTo(0);
    expect(normal).not.toBe(
      getBotanicalMaterialTexture("center", "microNormal"),
    );
  });

  it("gives the lotus receptacle a restrained living-tissue roughness", () => {
    const regular = getBotanicalMaterialTexture("center", "roughness");
    const receptacle = getBotanicalMaterialTexture(
      "center",
      "roughness",
      128,
      "receptacle",
    );
    const data = receptacle.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(receptacle).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(165);
    expect(Math.max(...values)).toBeLessThan(230);
  });

  it("gives the lotus receptacle low-amplitude body normals", () => {
    const slope = getReceptacleMicroNormalSlope(0.37, 0.56);
    const normal = getBotanicalMaterialTexture(
      "center",
      "microNormal",
      128,
      "receptacle",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.02);
    expect(Math.abs(slope.y)).toBeLessThan(0.02);
    expect(normal).not.toBe(
      getBotanicalMaterialTexture("center", "microNormal"),
    );
  });

  it("gives sunflower disk florets restrained crown normals", () => {
    const slope = getDiskFloretMicroNormalSlope(0.37, 0.56);
    const normal = getBotanicalMaterialTexture(
      "center",
      "microNormal",
      128,
      "disk",
    );

    expect(Math.abs(slope.x)).toBeLessThan(0.02);
    expect(Math.abs(slope.y)).toBeLessThan(0.02);
    expect(normal).not.toBe(
      getBotanicalMaterialTexture("center", "microNormal"),
    );
  });

  it("gives sunflower disk florets a softly matte crown roughness", () => {
    const regular = getBotanicalMaterialTexture("center", "roughness");
    const disk = getBotanicalMaterialTexture(
      "center",
      "roughness",
      128,
      "disk",
    );
    const data = disk.image.data as Uint8Array;
    const values = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(disk).not.toBe(regular);
    expect(Math.min(...values)).toBeGreaterThan(175);
    expect(Math.max(...values)).toBeLessThan(235);
  });

  it("keeps monocot petal thickness veins parallel along the blade", () => {
    const parallel = getBotanicalMaterialTexture(
      "petal",
      "thickness",
      128,
      "parallel",
    );
    const data = parallel.image.data as Uint8Array;
    const channelAt = (x: number, y: number) => data[(y * 128 + x) * 4 + 1];

    expect(channelAt(43, 64)).toBeGreaterThan(channelAt(53, 64));
    expect(channelAt(43, 32) - channelAt(53, 32)).toBeCloseTo(
      channelAt(43, 96) - channelAt(53, 96),
      0,
    );
  });

  it("aligns lily tepal roughness with its parallel vascular ribs", () => {
    const regular = getBotanicalMaterialTexture("petal", "roughness");
    const parallel = getBotanicalMaterialTexture(
      "petal",
      "roughness",
      128,
      "parallel",
    );
    const data = parallel.image.data as Uint8Array;
    const channelAt = (u: number, v: number) =>
      data[(Math.round(v * 127) * 128 + Math.round(u * 127)) * 4 + 1];

    expect(parallel).not.toBe(regular);
    expect(channelAt(0.34, 0.5)).toBeLessThan(channelAt(0.41, 0.5));
    expect(channelAt(0.66, 0.5)).toBeLessThan(channelAt(0.59, 0.5));
    expect(
      Math.abs(channelAt(0.41, 0.25) - channelAt(0.41, 0.75)),
    ).toBeLessThan(18);
  });

  it("gives the Orchid labellum a granular callus-aware roughness field", () => {
    const tepal = getBotanicalMaterialTexture(
      "petal",
      "roughness",
      64,
      "orchid",
    );
    const lip = getBotanicalMaterialTexture(
      "petal",
      "roughness",
      64,
      "orchidLip",
    );
    expect(lip).not.toBe(tepal);
    expect(lip.image.data).not.toEqual(tepal.image.data);

    const tepalThickness = getBotanicalMaterialTexture(
      "petal",
      "thickness",
      64,
      "orchid",
    );
    const lipThickness = getBotanicalMaterialTexture(
      "petal",
      "thickness",
      64,
      "orchidLip",
    );
    expect(lipThickness.image.data).not.toEqual(tepalThickness.image.data);

    const tepalNormal = getBotanicalMaterialTexture(
      "petal",
      "microNormal",
      64,
      "orchid",
    );
    const lipNormal = getBotanicalMaterialTexture(
      "petal",
      "microNormal",
      64,
      "orchidLip",
    );
    expect(lipNormal.image.data).not.toEqual(tepalNormal.image.data);
  });

  it("creates deterministic age maps with stronger edge discoloration", () => {
    const texture = getBotanicalAgeTexture("petal", 0.8, 42);
    const data = texture.image.data as Uint8Array;
    const channelAt = (x: number, y: number, channel: number) =>
      data[(y * 128 + x) * 4 + channel];

    expect(channelAt(0, 64, 2)).toBeLessThan(channelAt(64, 64, 2));
    expect(getBotanicalAgeTexture("petal", 0.8, 42)).toBe(texture);
    expect(getBotanicalAgeTexture("petal", 0.8, 43)).not.toBe(texture);
  });

  it("keeps new tissue neutral", () => {
    const data = getBotanicalAgeTexture("leaf", 0, 9).image.data as Uint8Array;

    expect(new Set(data.filter((_, index) => index % 4 !== 3))).toEqual(
      new Set([255]),
    );
  });

  it("models three longitudinal thickness veins across ligulate rays", () => {
    const texture = getBotanicalMaterialTexture(
      "petal",
      "thickness",
      128,
      "ligulate",
    );
    const data = texture.image.data as Uint8Array;
    const channelAt = (u: number) =>
      data[(72 * 128 + Math.round(u * 127)) * 4 + 1];

    expect(channelAt(0.5)).toBeGreaterThan(channelAt(0.4));
    expect(channelAt(0.28)).toBeGreaterThan(channelAt(0.4));
    expect(channelAt(0.72)).toBeGreaterThan(channelAt(0.6));
  });

  it("adds bounded interveinal cellular optical depth to ligulate rays", () => {
    const bodySamples = Array.from({ length: 18 }, (_, index) =>
      getLigulatePetalLaminaCellField(0.36 + index * 0.016, 0.54),
    );
    const texture = getBotanicalMaterialTexture(
      "petal",
      "thickness",
      128,
      "ligulate",
    );
    const data = texture.image.data as Uint8Array;
    const channelAt = (u: number, v: number) =>
      data[(Math.round(v * 127) * 128 + Math.round(u * 127)) * 4 + 1];
    const interveinalSamples = Array.from({ length: 18 }, (_, index) =>
      channelAt(0.39, 0.36 + index * 0.016),
    );

    expect(Math.max(...bodySamples) - Math.min(...bodySamples)).toBeGreaterThan(
      0.12,
    );
    expect(bodySamples.every((sample) => Math.abs(sample) <= 1)).toBe(true);
    expect(getLigulatePetalLaminaCellField(0.4, 0)).toBeCloseTo(0);
    expect(getLigulatePetalLaminaCellField(0.4, 1)).toBeCloseTo(0);
    expect(
      Math.max(...interveinalSamples) - Math.min(...interveinalSamples),
    ).toBeGreaterThan(8);
    expect(
      Math.max(...interveinalSamples) - Math.min(...interveinalSamples),
    ).toBeLessThan(34);
  });

  it("creates deterministic UV-space petal spots and nectar guides", () => {
    const plain = getPetalAlbedoTexture(0, 42, 0, 0);
    const marked = getPetalAlbedoTexture(0, 42, 0.8, 0.9);
    const repeated = getPetalAlbedoTexture(0, 42, 0.8, 0.9);
    const plainData = plain.image.data as Uint8Array;
    const markedData = marked.image.data as Uint8Array;
    const centerBase = plainData[(8 * 128 + 64) * 4 + 1];
    const centerGuide = markedData[(8 * 128 + 64) * 4 + 1];

    expect(marked).toBe(repeated);
    expect(marked).not.toBe(plain);
    expect(centerGuide).toBeLessThan(centerBase);
    expect(markedData).not.toEqual(plainData);
  });

  it("compensates lily freckles for the long blade UV aspect ratio", () => {
    const spots = getPetalSpotCenters(3141, 0.76, "lily");
    const repeated = getPetalSpotCenters(3141, 0.76, "lily");

    expect(spots).toEqual(repeated);
    expect(spots.length).toBeGreaterThan(25);
    expect(spots.every(({ v }) => v >= 0.14 && v <= 0.57)).toBe(true);
    expect(spots.every(({ radiusU, radiusV }) => radiusU > radiusV)).toBe(true);
    expect(spots.every(({ radiusU, radiusV }) => radiusV / radiusU < 0.4)).toBe(
      true,
    );
  });

  it("adds seed-stable Lily margin pigment away from attachment and tip", () => {
    const edge = getLilyTepalMarginPigment(0.02, 0.5, 3141);
    const repeated = getLilyTepalMarginPigment(0.02, 0.5, 3141);
    const center = getLilyTepalMarginPigment(0.5, 0.5, 3141);
    const attachment = getLilyTepalMarginPigment(0.02, 0, 3141);
    const tip = getLilyTepalMarginPigment(0.02, 1, 3141);

    expect(edge).toBe(repeated);
    expect(edge).toBeGreaterThan(0.2);
    expect(edge).toBeLessThanOrEqual(1);
    expect(center).toBe(0);
    expect(attachment).toBe(0);
    expect(tip).toBe(0);
  });

  it("breaks Lily margin weathering into sparse bounded patches", () => {
    const edge = Array.from({ length: 81 }, (_, index) =>
      getLilyTepalMarginWeathering(0.01, index / 80, 3141),
    );
    const repeated = Array.from({ length: 81 }, (_, index) =>
      getLilyTepalMarginWeathering(0.01, index / 80, 3141),
    );
    const center = Array.from({ length: 81 }, (_, index) =>
      getLilyTepalMarginWeathering(0.5, index / 80, 3141),
    );
    const active = edge.filter((value) => value > 0.08);

    expect(edge).toEqual(repeated);
    expect(Math.max(...edge)).toBeGreaterThan(0.15);
    expect(Math.max(...edge)).toBeLessThanOrEqual(0.72);
    expect(active.length).toBeGreaterThan(4);
    expect(active.length).toBeLessThan(55);
    expect(center.every((value) => value === 0)).toBe(true);
    expect(edge[0]).toBe(0);
    expect(edge.at(-1)).toBe(0);
  });

  it("adds restrained seed-stable tissue variation to lily tepals", () => {
    const texture = getPetalAlbedoTexture(
      0,
      3141,
      0,
      0,
      256,
      "#8d4a2b",
      undefined,
      "lily",
    );
    const repeated = getPetalAlbedoTexture(
      0,
      3141,
      0,
      0,
      256,
      "#8d4a2b",
      undefined,
      "lily",
    );
    const data = texture.image.data as Uint8Array;
    const interiorRed = Array.from({ length: 48 }, (_, index) => {
      const x = 72 + index * 2;
      return data[(128 * 256 + x) * 4];
    });
    const range = Math.max(...interiorRed) - Math.min(...interiorRed);

    expect(texture).toBe(repeated);
    expect(range).toBeGreaterThan(3);
    expect(range).toBeLessThan(14);
  });

  it("reserves warm callus pigment from the orchid nectar-guide field", () => {
    const texture = getPetalAlbedoTexture(
      0,
      17,
      0,
      0.9,
      128,
      "#a44082",
      "#d29436",
    );
    const data = texture.image.data as Uint8Array;
    const offset = (Math.round(0.4 * 127) * 128 + Math.round(0.42 * 127)) * 4;

    expect(data[offset]).toBeGreaterThan(data[offset + 1]);
    expect(data[offset + 1]).toBeGreaterThan(data[offset + 2]);
  });
});
