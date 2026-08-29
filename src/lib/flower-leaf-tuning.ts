import type { FlowerPreset } from "./flower-store";
import type { FlowerSpecies, LeafShape } from "./flower-species";
import * as THREE from "three";

export type LeafTuning = {
  leafWidthScale: number;
  leafLengthScale: number;
  petioleScale: number;
  petioleLift: number;
  droopBias: number;
  curlScale: number;
  serrationScale: number;
  veinDensityScale: number;
  asymmetryScale: number;
  attachmentScale: number;
  attachmentStart: number;
  attachmentEnd: number;
  attachmentShift: number;
  bladePitch: number;
  bladeRoll: number;
  bladeYaw: number;
  leafColorMix: number;
  leafGlossScale: number;
  leafHairiness: number;
  leafletPairs: number;
  leafArrangement: "opposite" | "alternate" | "spiral";
  venation: "pinnate" | "parallel" | "radial";
  leafShape?: LeafShape;
};

export function getCompoundLeafletPlacements(pairCount: number) {
  const safePairCount = Math.max(0, Math.round(pairCount));
  const pairedLeaflets = Array.from({ length: safePairCount }, (_, pair) => {
    const progress = (pair + 1) / (safePairCount + 1);
    const scale = 0.4 + Math.sin(progress * Math.PI) * 0.1;
    return ([-1, 1] as const).map((side) => ({
      side,
      y: 0.22 + pair * 0.26,
      scale: scale * (side < 0 ? 0.985 : 1.015),
      roll: side * -(0.82 + pair * 0.035),
    }));
  }).flat();
  return [
    ...pairedLeaflets,
    {
      side: 0,
      y: 0.22 + safePairCount * 0.26,
      scale: 0.43,
      roll: 0,
    },
  ];
}

export function getCompoundLeafletGeometrySeed(
  seed: number,
  attachmentT: number,
  side: number,
  leafletIndex: number,
) {
  return Math.round(
    seed + attachmentT * 3100 + side * 431 + leafletIndex * 577,
  );
}

export function getCompoundLeafletPoseVariation(
  seed: number,
  attachmentT: number,
  side: number,
  leafletIndex: number,
) {
  const organSeed = getCompoundLeafletGeometrySeed(
    seed,
    attachmentT,
    side,
    leafletIndex,
  );
  const random = (salt: number) => {
    const value = Math.sin(organSeed * 12.9898 + salt) * 43758.5453;
    return value - Math.floor(value);
  };

  return {
    heightOffset: (random(19.7) - 0.5) * 0.018,
    pitchOffset: (random(41.3) - 0.5) * 0.06,
    yawOffset: (random(67.1) - 0.5) * 0.07,
    rollOffset: (random(89.9) - 0.5) * 0.1,
    scale: THREE.MathUtils.lerp(0.98, 1.02, random(113.5)),
  };
}

export function getOrchidLeafFanOffset(attachmentT: number) {
  return Math.max(-1, Math.min(1, (attachmentT - 0.06) / 0.055));
}

export function getLeafBladeAttachmentOffset(
  petioleScale: number,
  compoundLeaf: boolean,
  peltateLeaf: boolean,
) {
  if (compoundLeaf) return 0.84;
  if (peltateLeaf) return -0.415;
  return 0.26 * petioleScale;
}

export function getLilyLeafSizeScale(attachmentT: number) {
  const t = THREE.MathUtils.clamp(attachmentT, 0, 1);
  const lowerTaper = THREE.MathUtils.lerp(
    0.68,
    1,
    THREE.MathUtils.smoothstep(t, 0.25, 0.44),
  );
  const upperTaper = THREE.MathUtils.lerp(
    1,
    0.62,
    THREE.MathUtils.smoothstep(t, 0.56, 0.78),
  );
  return lowerTaper * upperTaper;
}

export function getLilyLeafPoseVariation(seed: number, attachmentT: number) {
  const attachment = Math.round(
    THREE.MathUtils.clamp(attachmentT, 0, 1) * 1000,
  );
  const random = (salt: number) => {
    const value =
      Math.sin(seed * 12.9898 + attachment * 78.233 + salt) * 43758.5453;
    return value - Math.floor(value);
  };

  return {
    pitchOffset: (random(13.1) - 0.5) * 0.12,
    yawOffset: (random(37.7) - 0.5) * 0.12,
    rollOffset: (random(61.9) - 0.5) * 0.24,
  };
}

export function getPoppyLeafSizeScale(attachmentT: number) {
  const t = THREE.MathUtils.clamp(attachmentT, 0, 1);
  return THREE.MathUtils.lerp(
    1.12,
    0.58,
    THREE.MathUtils.smoothstep(t, 0.22, 0.78),
  );
}

export function getSunflowerLeafSizeScale(attachmentT: number) {
  const t = THREE.MathUtils.clamp(attachmentT, 0, 1);
  const lowerExpansion = THREE.MathUtils.lerp(
    0.86,
    1.05,
    THREE.MathUtils.smoothstep(t, 0.22, 0.44),
  );
  const upperTaper = THREE.MathUtils.lerp(
    1,
    0.68,
    THREE.MathUtils.smoothstep(t, 0.54, 0.8),
  );
  return lowerExpansion * upperTaper;
}

export function getSunflowerLeafPoseVariation(
  seed: number,
  attachmentT: number,
) {
  const attachment = Math.round(
    THREE.MathUtils.clamp(attachmentT, 0, 1) * 1000,
  );
  const random = (salt: number) => {
    const value =
      Math.sin(seed * 12.9898 + attachment * 78.233 + salt) * 43758.5453;
    return value - Math.floor(value);
  };

  return {
    pitchOffset: (random(23.9) - 0.5) * 0.09,
    yawOffset: (random(47.3) - 0.5) * 0.1,
    rollOffset: (random(73.7) - 0.5) * 0.14,
    curvatureScale: THREE.MathUtils.lerp(0.88, 1.18, random(97.1)),
  };
}

export function getIntegratedPinnateVeinRelief(preset: FlowerPreset) {
  if (preset === "Sunflower") return 1;
  if (preset === "Rose") return 0.72;
  if (preset === "Poppy") return 0.56;
  return 0;
}

export function getLeafSubsurfaceFill(
  preset: FlowerPreset,
  face: "front" | "back",
) {
  if (preset === "Poppy") return face === "back" ? 0.12 : 0.075;
  if (preset === "Lily") return face === "back" ? 0.09 : 0.06;
  if (preset === "Sunflower") return face === "back" ? 0.058 : 0.036;
  return 0;
}

export function getHeroLeafTuning(
  preset: FlowerPreset,
  structure: FlowerSpecies,
): LeafTuning {
  const base: LeafTuning = {
    leafWidthScale: 1,
    leafLengthScale: 1,
    petioleScale: 1,
    petioleLift: 0,
    droopBias: 0,
    curlScale: 1,
    serrationScale: 1,
    veinDensityScale: 1,
    asymmetryScale: 1,
    attachmentScale: 1,
    attachmentStart: 0.28,
    attachmentEnd: 0.72,
    attachmentShift: 0,
    bladePitch: 0,
    bladeRoll: 0,
    bladeYaw: 0,
    leafColorMix: 0.2,
    leafGlossScale: 1,
    leafHairiness: 0,
    leafletPairs: 0,
    leafArrangement: "opposite",
    venation: "pinnate",
    leafShape: structure.leafShape,
  };

  switch (preset) {
    case "Rose":
      return {
        ...base,
        leafWidthScale: 0.92,
        leafLengthScale: 0.88,
        petioleScale: 0.9,
        petioleLift: -0.01,
        droopBias: -0.04,
        curlScale: 0.84,
        serrationScale: 0.52,
        veinDensityScale: 1.12,
        asymmetryScale: 1.08,
        attachmentScale: 1.28,
        // Let the lowest compound leaf sit closer to the cane base so the
        // shrub reads as a young suckering rose instead of a bare single
        // flowering stalk, while keeping the upper crown open.
        attachmentStart: 0.12,
        attachmentEnd: 0.88,
        attachmentShift: -0.015,
        bladePitch: -0.02,
        bladeRoll: 0.04,
        bladeYaw: 0.04,
        leafColorMix: 0.18,
        leafGlossScale: 1.95,
        leafletPairs: 3,
        leafArrangement: "alternate",
      };
    case "Poppy":
      return {
        ...base,
        leafWidthScale: 0.78,
        leafLengthScale: 1.02,
        petioleScale: 0.84,
        droopBias: 0.08,
        curlScale: 1.06,
        serrationScale: 0.58,
        veinDensityScale: 0.96,
        asymmetryScale: 1.1,
        // Three sparse alternate leaves, including one lower attachment, give
        // the annual corn-poppy habit without turning the wiry stem bushy.
        attachmentScale: 1.12,
        attachmentStart: 0.18,
        attachmentEnd: 0.74,
        attachmentShift: 0.02,
        bladePitch: 0.02,
        bladeRoll: -0.05,
        bladeYaw: -0.03,
        leafColorMix: 0.1,
        leafGlossScale: 0.58,
        // Papaver rhoeas foliage is sparsely hispid, especially along the
        // blade and major veins. Keep this below the coarse Sunflower cover so
        // the fine hairs break the silhouette without becoming a fuzzy coat.
        leafHairiness: 0.62,
        leafArrangement: "alternate",
      };
    case "Lily":
      return {
        ...base,
        leafWidthScale: 0.64,
        leafLengthScale: 1.22,
        petioleScale: 0.18,
        petioleLift: 0,
        droopBias: 0.035,
        curlScale: 0.9,
        serrationScale: 0.82,
        veinDensityScale: 1.04,
        asymmetryScale: 0.9,
        attachmentScale: 1.02,
        attachmentShift: 0.01,
        bladePitch: 0.04,
        bladeRoll: -0.025,
        bladeYaw: 0,
        leafColorMix: 0.1,
        leafGlossScale: 1.08,
        leafArrangement: "spiral",
        venation: "parallel",
      };
    case "Sunflower":
      return {
        ...base,
        leafWidthScale: 1.1,
        leafLengthScale: 1.18,
        petioleScale: 1.12,
        petioleLift: -0.02,
        droopBias: 0.03,
        curlScale: 1.08,
        serrationScale: 1.02,
        veinDensityScale: 1.16,
        asymmetryScale: 1.04,
        attachmentScale: 1.04,
        attachmentShift: -0.01,
        bladePitch: 0.03,
        bladeRoll: 0.03,
        bladeYaw: 0.02,
        leafColorMix: 0.12,
        leafHairiness: 1,
        leafArrangement: "alternate",
      };
    case "Orchid":
      return {
        ...base,
        leafWidthScale: 0.92,
        leafLengthScale: 1.22,
        petioleScale: 0.28,
        petioleLift: -0.04,
        droopBias: -0.04,
        curlScale: 0.72,
        serrationScale: 0.7,
        veinDensityScale: 0.88,
        asymmetryScale: 0.84,
        attachmentScale: 0.88,
        attachmentStart: 0.035,
        attachmentEnd: 0.085,
        attachmentShift: 0.015,
        bladePitch: 0.02,
        bladeRoll: -0.28,
        bladeYaw: 0.03,
        leafColorMix: 0.08,
        leafGlossScale: 1.42,
        venation: "parallel",
        leafShape: "lance",
      };
    case "Lotus":
      return {
        ...base,
        leafWidthScale: 1.18,
        leafLengthScale: 1.06,
        petioleScale: 1,
        petioleLift: 0,
        droopBias: -0.03,
        curlScale: 0.9,
        serrationScale: 0.72,
        veinDensityScale: 0.92,
        asymmetryScale: 0.9,
        attachmentScale: 1,
        attachmentStart: 0.05,
        attachmentEnd: 0.13,
        attachmentShift: 0,
        bladePitch: 1.32,
        bladeRoll: 0.01,
        bladeYaw: -0.02,
        leafColorMix: 0.16,
        leafArrangement: "alternate",
        venation: "radial",
        leafShape: "peltate",
      };
    default:
      return base;
  }
}
