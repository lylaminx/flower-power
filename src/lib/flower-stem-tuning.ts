import type { FlowerPreset } from "./flower-store";
import * as THREE from "three";
import type { BotanicalMaterialVariant } from "./botanical-textures";
import type {
  CalyxForm,
  CenterArchitecture,
  FlowerSpecies,
} from "./flower-species";

export function shouldRenderExternalCalyx(
  centerArchitecture: CenterArchitecture | undefined,
  preset?: FlowerPreset,
) {
  return (
    centerArchitecture !== "column" && preset !== "Lily" && preset !== "Poppy"
  );
}

export function getCalyxRetention(opening: number, persistence: number) {
  return THREE.MathUtils.lerp(
    1,
    THREE.MathUtils.clamp(persistence, 0, 1),
    THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(opening, 0, 1), 0.3, 0.9),
  );
}

export function getOrchidInflorescenceStandOff(
  position: [number, number, number],
  maturity: number,
): [number, number, number] {
  const side = position[0] < 0 ? -1 : 1;
  return [
    position[0] + side * 0.16 * maturity,
    position[1],
    position[2] + 0.12 * maturity,
  ];
}

export function getOrchidInflorescenceBloomRotation(
  rotation: [number, number, number],
  position: [number, number, number],
  maturity: number,
  seed: number,
): [number, number, number] {
  const side = position[0] < 0 ? -1 : 1;
  const random = (salt: number) => stemNodeRandom(seed + salt);
  return [
    rotation[0] + (random(37) - 0.5) * 0.06,
    side * THREE.MathUtils.lerp(0.1, 0.18, maturity) +
      (random(71) - 0.5) * 0.08,
    side * THREE.MathUtils.lerp(-0.12, -0.2, maturity) +
      (random(109) - 0.5) * 0.06,
  ];
}

export function getLeafAttachmentFrame(tangent: THREE.Vector3, azimuth = 0) {
  const up = new THREE.Vector3(0, 1, 0);
  const frame = new THREE.Quaternion().setFromUnitVectors(
    up,
    tangent.clone().normalize(),
  );
  if (azimuth !== 0) {
    frame.multiply(new THREE.Quaternion().setFromAxisAngle(up, azimuth));
  }
  return frame;
}

export function getLeafAttachmentSwelling(bulgeScale: number) {
  const bulge = THREE.MathUtils.clamp(bulgeScale, 0.25, 1.25);
  return {
    offset: 0.045 * THREE.MathUtils.lerp(0.82, 1.08, bulge / 1.25),
    scale: [0.82 * bulge, 0.38 * bulge, 1.04 * bulge] as const,
  };
}

export type StemTuning = {
  curveScale: number;
  topBendX: number;
  topBendZ: number;
  headLoadBendX: number;
  budNod: number;
  bloomPitchBias: number;
  bloomYawBias: number;
  bloomRollBias: number;
  bloomScale: number;
  midBendX: number;
  midBendZ: number;
  stemHeightScale: number;
  stemThicknessScale: number;
  stemTaperScale: number;
  stemHairinessScale: number;
  stemNodeCountScale: number;
  stemNodeSpacingBias: number;
  stemNodeBulgeScale: number;
  attachmentSwellingScale: number;
  stemNodeIrregularity: number;
  stemScarScale: number;
  stemLenticelScale: number;
  axillaryBudScale: number;
  aerialRootCount: number;
  secondaryShootCount: number;
  secondaryShootScale: number;
  secondaryShootBudKind: "vegetative" | "poppy-floral";
  prickleDensity: number;
  prickleSizeScale: number;
  calyxForm?: CalyxForm;
  sepalSizeScale: number;
  sepalSpreadScale: number;
  sepalLengthScale: number;
  sepalPersistence: number;
  calyxLiftBias: number;
  calyxScaleX: number;
  calyxScaleY: number;
  calyxScaleZ: number;
};

function stemNodeRandom(value: number) {
  const raw = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

export function getStemNodeVariation(
  seed: number,
  index: number,
  irregularity: number,
) {
  const strength = Math.max(0, Math.min(1, irregularity));
  const spacing = stemNodeRandom(seed + index * 131 + 17) - 0.5;
  const radial = stemNodeRandom(seed + index * 197 + 43) - 0.5;
  const axial = stemNodeRandom(seed + index * 263 + 71) - 0.5;
  return {
    spacingOffset: spacing * strength * 0.045,
    radialScale: 1 + radial * strength * 0.34,
    axialScale: 1 + axial * strength * 0.24,
    azimuth: stemNodeRandom(seed + index * 307 + 101) * Math.PI * 2,
  };
}

export function getCalyxOrganVariation(
  preset: FlowerPreset,
  seed: number,
  index: number,
) {
  if (preset !== "Rose" && preset !== "Sunflower") {
    return {
      lengthScale: 1,
      widthScale: 1,
      tilt: 0,
      roll: 0,
      azimuth: 0,
      depthScale: 1,
    };
  }
  const sunflower = preset === "Sunflower";
  return {
    lengthScale:
      (sunflower ? 0.9 : 0.92) +
      stemNodeRandom(seed + index * 173 + 11) * (sunflower ? 0.2 : 0.16),
    widthScale:
      (sunflower ? 0.93 : 0.94) +
      stemNodeRandom(seed + index * 211 + 37) * (sunflower ? 0.14 : 0.12),
    tilt:
      (stemNodeRandom(seed + index * 257 + 61) - 0.5) *
      (sunflower ? 0.1 : 0.16),
    roll:
      (stemNodeRandom(seed + index * 293 + 89) - 0.5) *
      (sunflower ? 0.12 : 0.09),
    azimuth: sunflower
      ? (stemNodeRandom(seed + index * 337 + 107) - 0.5) * 0.07
      : 0,
    // Scaling the blade's local depth changes the strength of its authored
    // transverse cup without rebuilding a geometry for every phyllary.
    depthScale: sunflower
      ? 0.82 + stemNodeRandom(seed + index * 379 + 131) * 0.36
      : 1,
  };
}

export function getSunflowerPhyllaryWhorlTuning(whorl: number) {
  const layer = THREE.MathUtils.clamp(Math.round(whorl), 0, 2);
  return [
    {
      lengthScale: 1.14,
      widthScale: 0.78,
      tilt: 0.18,
      axialOffset: 0,
      angleOffsetScale: 0,
    },
    {
      lengthScale: 1,
      widthScale: 0.9,
      tilt: 0.02,
      axialOffset: 0.022,
      angleOffsetScale: 0.5,
    },
    {
      lengthScale: 0.84,
      widthScale: 1.02,
      tilt: -0.12,
      axialOffset: 0.044,
      angleOffsetScale: 0.25,
    },
  ][layer];
}

export function getCalyxAssemblyOffset(
  preset: FlowerPreset,
  fusedCorolla: boolean,
) {
  if (fusedCorolla) return -0.19;
  return preset === "Sunflower" ? 0 : -0.11;
}

export function getHeroStemTuning(
  preset: FlowerPreset,
  structure: FlowerSpecies,
): StemTuning {
  const base: StemTuning = {
    curveScale: 1,
    topBendX: 0,
    topBendZ: 0,
    headLoadBendX: 0,
    budNod: 0,
    bloomPitchBias: 0,
    bloomYawBias: 0,
    bloomRollBias: 0,
    bloomScale: 1,
    midBendX: 0,
    midBendZ: 0,
    stemHeightScale: 1,
    stemThicknessScale: 1,
    stemTaperScale: 1,
    stemHairinessScale: 1,
    stemNodeCountScale: 1,
    stemNodeSpacingBias: 0,
    stemNodeBulgeScale: 1,
    attachmentSwellingScale: 1,
    stemNodeIrregularity: 0.08,
    stemScarScale: 1,
    stemLenticelScale: 1,
    axillaryBudScale: 0.72,
    aerialRootCount: 0,
    secondaryShootCount: 0,
    secondaryShootScale: 1,
    secondaryShootBudKind: "vegetative",
    prickleDensity: 0,
    prickleSizeScale: 1,
    sepalSizeScale: 1,
    sepalSpreadScale: 1,
    sepalLengthScale: 1,
    sepalPersistence: 1,
    calyxLiftBias: 0,
    calyxScaleX: 1,
    calyxScaleY: 1,
    calyxScaleZ: 1,
    calyxForm: structure.calyxForm,
  };

  switch (preset) {
    case "Rose":
      return {
        ...base,
        curveScale: 0.82,
        topBendX: -0.02,
        midBendX: -0.03,
        stemHeightScale: 0.98,
        stemThicknessScale: 1.04,
        stemTaperScale: 0.96,
        stemHairinessScale: 1.16,
        // Compound leaves already provide the visible cane nodes. The generic
        // ornamental node meshes read as stacked collars on a woody rose.
        stemNodeCountScale: 0,
        stemNodeSpacingBias: -0.01,
        stemNodeBulgeScale: 0.58,
        attachmentSwellingScale: 0.72,
        stemLenticelScale: 1.1,
        axillaryBudScale: 0.82,
        secondaryShootCount: 2,
        secondaryShootScale: 1.55,
        // R. rugosa canes carry many short, relatively straight prickles
        // rather than a few oversized hybrid-tea hooks.
        prickleDensity: 2.8,
        prickleSizeScale: 0.72,
        bloomScale: 0.7,
        sepalSizeScale: 0.9,
        sepalSpreadScale: 1.1,
        sepalLengthScale: 1.42,
        calyxLiftBias: -0.04,
        calyxScaleX: 1.04,
        calyxScaleY: 0.92,
        calyxScaleZ: 1.04,
      };
    case "Poppy":
      return {
        ...base,
        curveScale: 0.72,
        topBendX: 0.02,
        budNod: 0.68,
        midBendX: 0.01,
        stemHeightScale: 1.02,
        stemThicknessScale: 0.84,
        stemTaperScale: 0.9,
        stemHairinessScale: 0.72,
        stemNodeCountScale: 0,
        stemNodeSpacingBias: 0.03,
        stemNodeBulgeScale: 0.86,
        attachmentSwellingScale: 0.28,
        stemLenticelScale: 0,
        // The dedicated secondary shoot already carries the Poppy floral bud.
        // A second generic bud at every leaf axil reads as an oval leaf blade.
        axillaryBudScale: 0,
        secondaryShootCount: 1,
        secondaryShootScale: 0.8,
        secondaryShootBudKind: "poppy-floral",
        sepalSizeScale: 0.88,
        sepalSpreadScale: 0.8,
        sepalLengthScale: 0.82,
        sepalPersistence: 0,
        calyxForm: "cupped",
        calyxLiftBias: -0.02,
        calyxScaleX: 0.9,
        calyxScaleY: 0.84,
        calyxScaleZ: 0.9,
      };
    case "Lily":
      return {
        ...base,
        curveScale: 0.9,
        topBendX: 0.01,
        topBendZ: -0.01,
        bloomPitchBias: 0.14,
        bloomYawBias: 0.1,
        bloomRollBias: -0.035,
        stemHeightScale: 1.08,
        stemThicknessScale: 0.9,
        stemTaperScale: 0.88,
        stemHairinessScale: 0,
        stemNodeCountScale: 0,
        stemNodeSpacingBias: -0.02,
        stemNodeBulgeScale: 0.82,
        stemLenticelScale: 0,
        axillaryBudScale: 0,
        sepalSizeScale: 1.02,
        sepalSpreadScale: 1,
        sepalLengthScale: 1.04,
        calyxForm: "reflexed",
        calyxLiftBias: 0.02,
        calyxScaleX: 0.72,
        calyxScaleY: 1.28,
        calyxScaleZ: 0.72,
      };
    case "Sunflower":
      return {
        ...base,
        curveScale: 0.62,
        topBendX: 0.03,
        topBendZ: -0.02,
        headLoadBendX: 0.18,
        stemHeightScale: 1.12,
        stemThicknessScale: 1.18,
        stemTaperScale: 0.92,
        stemHairinessScale: 1.36,
        // The eight leaf attachments already establish the real cauline nodes.
        // A second generic node series produced stacked collar-like rings.
        stemNodeCountScale: 0,
        stemNodeSpacingBias: -0.02,
        stemNodeBulgeScale: 0.88,
        attachmentSwellingScale: 0.58,
        stemNodeIrregularity: 0.32,
        stemScarScale: 0.22,
        stemLenticelScale: 0,
        axillaryBudScale: 0.94,
        secondaryShootCount: 1,
        secondaryShootScale: 0.62,
        sepalSizeScale: 1.08,
        sepalSpreadScale: 1.08,
        sepalLengthScale: 1.1,
        calyxForm: "bracted",
        calyxLiftBias: -0.03,
        calyxScaleX: 0.96,
        calyxScaleY: 0.9,
        calyxScaleZ: 0.96,
      };
    case "Orchid":
      return {
        ...base,
        curveScale: 1.04,
        topBendX: 0.12,
        topBendZ: 0.02,
        midBendX: 0.18,
        midBendZ: -0.04,
        stemHeightScale: 1.14,
        stemThicknessScale: 0.88,
        stemTaperScale: 0.84,
        stemHairinessScale: 0,
        stemNodeCountScale: 0.7,
        stemNodeSpacingBias: 0.05,
        stemNodeBulgeScale: 0.38,
        stemScarScale: 0,
        stemLenticelScale: 0,
        axillaryBudScale: 0,
        aerialRootCount: 5,
        sepalSizeScale: 0.94,
        sepalSpreadScale: 0.82,
        sepalLengthScale: 0.92,
        calyxLiftBias: 0.04,
        calyxScaleX: 0.92,
        calyxScaleY: 0.88,
        calyxScaleZ: 0.92,
      };
    case "Lotus":
      return {
        ...base,
        curveScale: 0.58,
        topBendX: -0.01,
        midBendX: 0,
        stemHeightScale: 1.04,
        stemThicknessScale: 0.9,
        stemTaperScale: 0.92,
        stemHairinessScale: 0,
        stemNodeCountScale: 0,
        stemNodeSpacingBias: 0.08,
        stemNodeBulgeScale: 0.78,
        stemLenticelScale: 0,
        axillaryBudScale: 0,
        sepalSizeScale: 1.02,
        sepalSpreadScale: 0.92,
        sepalLengthScale: 0.96,
        calyxLiftBias: 0.02,
        calyxScaleX: 0.98,
        calyxScaleY: 0.96,
        calyxScaleZ: 0.98,
      };
    default:
      return base;
  }
}

export function getSecondaryShootControlOffsets(
  kind: StemTuning["secondaryShootBudKind"],
  scale: number,
) {
  if (kind === "poppy-floral") {
    return [
      { outward: 0.12 * scale, upward: 0.08 * scale },
      { outward: 0.32 * scale, upward: 0.34 * scale },
      { outward: 0.44 * scale, upward: 0.42 * scale },
      { outward: 0.5 * scale, upward: 0.22 * scale },
    ];
  }
  return [
    { outward: 0.12 * scale, upward: 0.08 * scale },
    { outward: 0.31 * scale, upward: 0.25 * scale },
    { outward: 0.44 * scale, upward: 0.46 * scale },
  ];
}

export function getRoseBasalCaneControlOffsets(scale: number, index: number) {
  const sideSpread = index === 0 ? 1 : 0.9;
  return [
    { outward: 0.05 * scale * sideSpread, upward: 0.04 * scale },
    { outward: 0.17 * scale * sideSpread, upward: 0.42 * scale },
    { outward: 0.27 * scale * sideSpread, upward: 0.88 * scale },
    { outward: 0.34 * scale * sideSpread, upward: 1.28 * scale },
  ];
}

export function getSecondaryShootAzimuthOffset(
  kind: StemTuning["secondaryShootBudKind"],
) {
  return kind === "poppy-floral" ? -0.78 : 0;
}

export function getSecondaryShootMaterialVariant(
  kind: StemTuning["secondaryShootBudKind"],
  parentVariant: BotanicalMaterialVariant = "default",
) {
  return kind === "poppy-floral" ? ("glaucous" as const) : parentVariant;
}

export function getSecondaryShootHairCount(
  kind: StemTuning["secondaryShootBudKind"],
  parentVariant: BotanicalMaterialVariant = "default",
) {
  if (kind === "poppy-floral") return 7;
  return parentVariant === "coarse" ? 5 : 0;
}

export function getSecondaryShootPrickleCount(
  parentVariant: BotanicalMaterialVariant = "default",
  quality: "draft" | "high" | "ultra" = "high",
) {
  if (parentVariant !== "woody") return 0;
  return quality === "draft" ? 6 : quality === "ultra" ? 18 : 12;
}

export function getSecondaryShootLeafCount(
  parentVariant: BotanicalMaterialVariant = "default",
) {
  return parentVariant === "woody" ? 2 : 0;
}
