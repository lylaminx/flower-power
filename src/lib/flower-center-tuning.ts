import type { FlowerPreset } from "./flower-store";
import type { CenterArchitecture, FlowerSpecies } from "./flower-species";
import * as THREE from "three";

export function getAntherGrooveColor(
  antherColor: THREE.ColorRepresentation,
  pollenColor: THREE.ColorRepresentation,
  isLily: boolean,
) {
  const anther = new THREE.Color(antherColor);
  return isLily
    ? anther.lerp(new THREE.Color("#4e2d1d"), 0.58).multiplyScalar(0.78)
    : anther.lerp(new THREE.Color(pollenColor), 0.3).multiplyScalar(0.62);
}

export function getAntherRoughness(moisture: number, isLily: boolean) {
  const clampedMoisture = THREE.MathUtils.clamp(moisture, 0, 1);
  return isLily
    ? THREE.MathUtils.lerp(0.9, 0.76, clampedMoisture)
    : THREE.MathUtils.lerp(0.96, 0.82, clampedMoisture);
}

export function getPollenGrainsPerStamen(
  quality: "draft" | "high" | "ultra",
  isLily: boolean,
) {
  if (isLily) return quality === "draft" ? 5 : quality === "ultra" ? 28 : 18;
  return quality === "draft" ? 1 : quality === "ultra" ? 5 : 3;
}

export function getFilamentSegmentCount(
  quality: "draft" | "high" | "ultra",
  isColumn: boolean,
  isLily: boolean,
) {
  if (quality === "draft" || isColumn) return 1;
  if (isLily) return quality === "ultra" ? 12 : 8;
  return 2;
}

export function getLilyStamenVariation(seed: number, index: number) {
  const random = (salt: number) => {
    const value = Math.sin(seed * 12.9898 + index * 78.233 + salt) * 43758.5453;
    return value - Math.floor(value);
  };

  return {
    angleOffset: (random(11.7) - 0.5) * 0.07,
    radiusScale: THREE.MathUtils.lerp(0.96, 1.04, random(29.3)),
    lengthScale: THREE.MathUtils.lerp(0.94, 1.06, random(47.9)),
    leanOffset: (random(71.1) - 0.5) * 0.012,
  };
}

export function getRoseStamenVariation(seed: number, index: number) {
  const random = (salt: number) => {
    const value = Math.sin(seed * 12.9898 + index * 78.233 + salt) * 43758.5453;
    return value - Math.floor(value);
  };

  return {
    angleOffset: (random(17.3) - 0.5) * 0.22,
    radialSeat: THREE.MathUtils.lerp(0.18, 0.82, random(31.9)),
    lengthScale: THREE.MathUtils.lerp(0.78, 1.16, random(53.7)),
    leanOffset: (random(79.1) - 0.5) * 0.03,
    antherScale: THREE.MathUtils.lerp(0.88, 1.1, random(117.3)),
    antherTilt: THREE.MathUtils.lerp(0.18, 0.34, random(131.9)),
    antherYaw: (random(149.7) - 0.5) * 0.3,
  };
}

export function getRoseFreeStyleCount(quality: "draft" | "high" | "ultra") {
  return quality === "draft" ? 5 : quality === "ultra" ? 12 : 8;
}

export function getRoseFreeStyleVariation(seed: number, index: number) {
  const random = (salt: number) => {
    const value = Math.sin(seed * 9.137 + index * 63.731 + salt) * 43758.5453;
    return value - Math.floor(value);
  };

  return {
    angleOffset: (random(13.9) - 0.5) * 0.2,
    radialSeat: THREE.MathUtils.lerp(0.05, 0.16, random(31.3)),
    lengthScale: THREE.MathUtils.lerp(0.52, 0.76, random(47.7)),
    lean: (random(71.5) - 0.5) * 0.1,
    stigmaScale: THREE.MathUtils.lerp(0.82, 1.16, random(89.1)),
  };
}

export function getPoppyStamenVariation(
  seed: number,
  index: number,
  stamenCount = 42,
) {
  const random = (salt: number) => {
    const value = Math.sin(seed * 12.9898 + index * 78.233 + salt) * 43758.5453;
    return value - Math.floor(value);
  };

  const safeCount = Math.max(1, Math.round(stamenCount));
  const normalizedAngle = (index / safeCount) * Math.PI * 2;
  // Living poppy stamens form loose local fans and openings rather than a
  // perfectly sampled ring. Low-frequency, seed-dependent angular warping
  // creates those clusters while the small individual jitter prevents rows.
  const clusterPhase = random(5.3) * Math.PI * 2;
  const clusterWarp =
    Math.sin(normalizedAngle * 3 + clusterPhase) * 0.034 +
    Math.sin(normalizedAngle * 5 - clusterPhase * 0.7) * 0.014;
  const radialDrift = Math.sin(normalizedAngle * 4 + clusterPhase) * 0.035;

  return {
    angleOffset: clusterWarp + (random(13.1) - 0.5) * 0.064,
    radialSeat: THREE.MathUtils.clamp(
      THREE.MathUtils.lerp(0.48, 0.8, random(37.7)) + radialDrift,
      0.46,
      0.82,
    ),
    lengthScale: THREE.MathUtils.lerp(0.74, 1.22, random(59.3)),
    leanOffset: (random(73.9) - 0.5) * 0.018,
    curveScale: THREE.MathUtils.lerp(0.78, 1.22, random(81.5)),
    lateralCurve: (random(86.3) - 0.5) * 0.018,
    antherScale: THREE.MathUtils.lerp(0.78, 1.12, random(91.7)),
    antherTilt: THREE.MathUtils.lerp(0.12, 0.38, random(109.1)),
    antherYaw: (random(127.9) - 0.5) * 0.56,
  };
}

export function shouldRenderCenterBody(architecture: CenterArchitecture) {
  return architecture !== "column";
}

export function getReproductiveRadiusScale(preset: FlowerPreset) {
  // Rosa rugosa's broad stamen ring is an identifying feature. Scale the true
  // reproductive whorl independently so the supporting hypanthial lining can
  // remain compact beneath it.
  return preset === "Rose" ? 1.45 : 1;
}

export const orchidColumnSilhouette = [
  [0, -0.55],
  [0.035, -0.5],
  [0.06, -0.32],
  [0.09, -0.04],
  [0.155, 0.24],
  [0.135, 0.42],
  [0.065, 0.54],
  [0, 0.58],
] as const;

export const orchidColumnHood = {
  depth: 0.1,
  bevelSize: 0.012,
  bevelThickness: 0.018,
} as const;

export const orchidColumnPose = {
  tilt: -0.3,
  forwardOffsetScale: 0.44,
  verticalOffsetScale: -0.14,
  widthScale: 1.9,
  depthScale: 0.82,
  lengthScale: 0.98,
} as const;

export const orchidPolliniumPose = {
  separationScale: 0.036,
  widthScale: 0.068,
  heightScale: 0.082,
  depthScale: 0.04,
  warmColorMix: 0.62,
} as const;

export type CenterTuning = {
  radiusScale: number;
  heightScale: number;
  densityScale: number;
  sizeScale: number;
  spreadScale: number;
  floretCountScale: number;
  floretSizeScale: number;
  seedpodPitScale: number;
  seedpodPitDepthScale: number;
  stamenCountScale: number;
  stamenLengthScale: number;
  filamentSpreadScale: number;
  filamentRadiusScale: number;
  antherSizeScale: number;
  antherWidthScale: number;
  antherDepthScale: number;
  stigmaSizeScale: number;
  styleLengthScale: number;
  ovaryScale: number;
  ovaryWidthScale: number;
  ovaryHeightScale: number;
  displayColorMix: number;
};

export function getHeroCenterTuning(
  preset: FlowerPreset,
  structure: FlowerSpecies,
  architecture: CenterArchitecture,
): CenterTuning {
  const base: CenterTuning = {
    radiusScale: 1,
    heightScale: 1,
    densityScale: 1,
    sizeScale: 1,
    spreadScale: 1,
    floretCountScale: 1,
    floretSizeScale: 1,
    seedpodPitScale: 1,
    seedpodPitDepthScale: 1,
    stamenCountScale: 1,
    stamenLengthScale: 1,
    filamentSpreadScale: 1,
    filamentRadiusScale: 1,
    antherSizeScale: 1,
    antherWidthScale: 1,
    antherDepthScale: 1,
    stigmaSizeScale: 1,
    styleLengthScale: 1,
    ovaryScale: 1,
    ovaryWidthScale: 1,
    ovaryHeightScale: 1,
    displayColorMix: 0.5,
  };

  switch (preset) {
    case "Rose":
      return {
        ...base,
        // Rose's small shared center was being swallowed by the broad petal
        // bases, leaving a hollow-looking magenta bowl. Give the pale boss and
        // stamen ring a readable footprint without turning it into a mound.
        radiusScale: 1.04,
        heightScale: 0.88,
        densityScale: 1.08,
        sizeScale: 1,
        spreadScale: 1.04,
        floretCountScale: 0.9,
        floretSizeScale: 0.88,
        stamenCountScale: 1.62,
        stamenLengthScale: 1.1,
        // Species roses carry a dense upright stamen mass. Keep the filaments
        // fine and the paired anther lobes small enough to avoid a radial cage.
        filamentSpreadScale: 4,
        filamentRadiusScale: 0.5,
        antherSizeScale: 0.4,
        antherWidthScale: 0.85,
        antherDepthScale: 0.8,
        stigmaSizeScale: 0.92,
        styleLengthScale: 0.92,
        ovaryScale: 0.86,
        displayColorMix: 0.28,
      };
    case "Poppy":
      return {
        ...base,
        radiusScale: 1.08,
        heightScale: 0.82,
        densityScale: 1.1,
        sizeScale: 1,
        spreadScale: 1.06,
        floretCountScale: 0.94,
        floretSizeScale: 0.92,
        stamenCountScale: 1.16,
        // Papaver rhoeas has a dense but fine halo around the broad capsule.
        // Shorter, slimmer anthers keep the ring from reading as black spikes.
        stamenLengthScale: 0.82,
        filamentSpreadScale: 0.9,
        filamentRadiusScale: 0.36,
        antherSizeScale: 0.8,
        antherWidthScale: 0.76,
        antherDepthScale: 0.7,
        stigmaSizeScale: 0.96,
        styleLengthScale: 0.12,
        ovaryScale: 1.04,
        ovaryWidthScale: 0.96,
        ovaryHeightScale: 1.52,
        displayColorMix: 0.18,
      };
    case "Lily":
      return {
        ...base,
        radiusScale: 0.8,
        heightScale: 0.9,
        densityScale: 0.92,
        sizeScale: 0.92,
        spreadScale: 0.9,
        floretCountScale: 1,
        floretSizeScale: 0.88,
        stamenCountScale: 0.96,
        // Lily stamens project well beyond the throat and terminate in large,
        // pollen-heavy anthers. The shared radial defaults are intentionally
        // compact and otherwise disappear inside the six tepals.
        stamenLengthScale: 5.2,
        filamentSpreadScale: 18,
        filamentRadiusScale: 1.75,
        antherSizeScale: 1.65,
        antherWidthScale: 1.2,
        antherDepthScale: 0.58,
        stigmaSizeScale: 0.98,
        // The generic pistil equation is designed for compact radial centers.
        // Lily's single style rises through the six long stamens and needs a
        // species-scale correction to remain visible within their anther ring.
        styleLengthScale: 2.15,
        ovaryScale: 0.9,
        ovaryWidthScale: 0.82,
        ovaryHeightScale: 1.68,
        displayColorMix: 0.48,
      };
    case "Sunflower":
      return {
        ...base,
        radiusScale: 1.04,
        heightScale: 0.76,
        densityScale: 1.22,
        sizeScale: 1.08,
        // Species-form sunflower disks are a near-continuous field of tubular
        // florets. The former wide spread and small crowns exposed too much
        // receptacle, making the macro read as pegs inserted into a plate.
        spreadScale: 1.03,
        floretCountScale: 1.16,
        floretSizeScale: 1.12,
        seedpodPitScale: 0.88,
        seedpodPitDepthScale: 0.82,
        stamenCountScale: 1.08,
        stamenLengthScale: 0.88,
        antherSizeScale: 0.96,
        stigmaSizeScale: 0.94,
        styleLengthScale: 0.88,
        ovaryScale: 1.08,
        displayColorMix: 0.66,
      };
    case "Orchid":
      return {
        ...base,
        radiusScale: 0.76,
        heightScale: 1.08,
        densityScale: 0.84,
        sizeScale: 0.92,
        spreadScale: 0.76,
        floretCountScale: architecture === "column" ? 0.5 : 0.72,
        floretSizeScale: 0.84,
        stamenCountScale: 0.7,
        stamenLengthScale: 0.82,
        filamentSpreadScale: 0.48,
        antherSizeScale: 0.88,
        stigmaSizeScale: 0.96,
        styleLengthScale: 1.08,
        ovaryScale: 0.76,
        displayColorMix: 0.34,
      };
    case "Lotus":
      return {
        ...base,
        radiusScale: 1.08,
        heightScale: 1.12,
        densityScale: 1.04,
        sizeScale: 1,
        spreadScale: 0.92,
        floretCountScale: 0.96,
        floretSizeScale: 1,
        seedpodPitScale: 0.82,
        seedpodPitDepthScale: 1.08,
        stamenCountScale: 1,
        stamenLengthScale: 0.86,
        filamentSpreadScale: 1.18,
        antherSizeScale: 0.9,
        stigmaSizeScale: 0.88,
        styleLengthScale: 0.82,
        ovaryScale: 1.14,
        displayColorMix: 0.52,
      };
    default:
      return base;
  }
}
export const poppyStigmaDisk = {
  radiusScale: 0.44,
  thicknessScale: 0.07,
  verticalOffset: -0.012,
  lobeCount: 10,
  rimLobeAmplitude: 0.035,
  rayRadiusScale: 0.19,
  rayLengthScale: 0.38,
  rayWidth: 0.006,
  rayDepth: 0.0012,
  crownOffset: 0.014,
} as const;

export const poppyStamenSurface = {
  antherLengthScale: 0.54,
  pollenScale: 0.5,
} as const;
