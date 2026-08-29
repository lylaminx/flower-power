import * as THREE from "three";
import { getLabellumCallusField } from "./flower-geometry";

export type BotanicalSurface = "petal" | "leaf" | "stem" | "center";
export type BotanicalMaterialMap =
  "roughness" | "thickness" | "backscatter" | "microNormal" | "moisture";
export type BotanicalMaterialVariant =
  | "default"
  | "papery"
  | "veined"
  | "parallel"
  | "ligulate"
  | "woody"
  | "peltate"
  | "coarse"
  | "aquatic"
  | "glaucous"
  | "monocot"
  | "spike"
  | "sepal"
  | "involucre"
  | "velamen"
  | "orchid"
  | "orchidLip"
  | "anther"
  | "calyx"
  | "lotus"
  | "seed"
  | "pit"
  | "receptacle"
  | "disk";
export type PetalMarkingVariant =
  "default" | "lily" | "poppy" | "rose" | "ligulate";

export function getStemMaterialVariant(
  preset: string,
): BotanicalMaterialVariant {
  if (preset === "Rose") return "woody";
  if (preset === "Sunflower") return "coarse";
  if (preset === "Lotus") return "aquatic";
  if (preset === "Poppy") return "glaucous";
  if (preset === "Lily") return "monocot";
  if (preset === "Orchid") return "spike";
  return "default";
}

export function getPetioleMaterialVariant(
  preset: string,
): BotanicalMaterialVariant {
  if (preset === "Sunflower") return "coarse";
  if (preset === "Lotus") return "aquatic";
  if (preset === "Poppy") return "glaucous";
  if (preset === "Lily") return "monocot";
  if (preset === "Orchid") return "spike";
  return "default";
}

export function getCalyxBodyMaterialVariant(
  preset: string,
): BotanicalMaterialVariant {
  if (preset === "Rose") return "calyx";
  return preset === "Sunflower" ? "coarse" : "default";
}

export function getCalyxBladeMaterialVariant(
  preset: string,
): BotanicalMaterialVariant {
  if (preset === "Rose") return "sepal";
  if (preset === "Sunflower") return "involucre";
  if (preset === "Poppy") return "glaucous";
  return "default";
}

export function getOvaryMaterialVariant(
  preset: string,
): BotanicalMaterialVariant {
  return preset === "Lily" ? "monocot" : "default";
}

export function getAntherMaterialVariant(
  preset: string,
): BotanicalMaterialVariant {
  if (preset === "Lily") return "anther";
  if (preset === "Sunflower") return "disk";
  return "default";
}

const textures = new Map<string, THREE.DataTexture>();
const materialTextures = new Map<string, THREE.DataTexture>();
const ageTextures = new Map<string, THREE.DataTexture>();

function configureBotanicalUvSampling(
  texture: THREE.DataTexture,
  surface: BotanicalSurface,
) {
  if (surface === "stem") {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 6);
  } else if (surface === "center") {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
  } else {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
  }
}

function proceduralNoise(x: number, y: number, frequency = 1) {
  const value =
    Math.sin(x * 12.9898 * frequency + y * 78.233 * frequency) * 43758.5453;
  return value - Math.floor(value);
}

export function getPeltateVascularField(u: number, v: number) {
  const x = u * 2 - 1;
  const y = v * 2 - 1;
  const radius = Math.min(1, Math.hypot(x, y));
  const angle = Math.atan2(y, x);
  const primary = Math.pow(Math.max(0, Math.cos(angle * 12)), 22);
  const secondary = Math.pow(Math.max(0, Math.cos(angle * 24 + 0.18)), 34);
  const radialFade = Math.sin(radius * Math.PI);
  return radialFade * (primary * 0.82 + secondary * 0.2);
}

export function getOrchidTepalVascularField(u: number, v: number) {
  const across = Math.abs(u - 0.5);
  const envelope =
    THREE.MathUtils.smoothstep(v, 0.04, 0.2) *
    (1 - THREE.MathUtils.smoothstep(v, 0.82, 0.98));
  const center = Math.exp(-Math.pow(across / 0.038, 2));
  const innerPath = 0.055 + v * 0.15;
  const outerPath = 0.1 + v * 0.27;
  const inner = Math.exp(-Math.pow((across - innerPath) / 0.026, 2));
  const outer = Math.exp(-Math.pow((across - outerPath) / 0.032, 2));
  return THREE.MathUtils.clamp(
    envelope * (center * 0.78 + inner * 0.5 + outer * 0.38),
    0,
    1,
  );
}

export function getPaperyVascularField(u: number, v: number) {
  const across = Math.abs(THREE.MathUtils.clamp(u, 0, 1) - 0.5);
  const along = THREE.MathUtils.clamp(v, 0, 1);
  const attachmentFade = THREE.MathUtils.smoothstep(along, 0.035, 0.18);
  const distalFade = 1 - THREE.MathUtils.smoothstep(along, 0.86, 1);
  const vein = (center: number, width: number, strength: number) =>
    Math.exp(-Math.pow((across - center) / width, 2)) * strength;
  // Poppy ribs fan from the attachment, but living veins do not follow the
  // perfectly straight ruled paths that make a procedural map read as cloth.
  // Keep the deviations broad and shared by each mirrored half of the blade.
  const broadWander = Math.sin(along * Math.PI * 2.15 + 0.4) * 0.008;
  const fineWander = Math.sin(along * Math.PI * 4.3 + 1.2) * 0.0035;
  const primaryPath = 0.045 + along * 0.25 + broadWander;
  const secondaryPath = 0.025 + along * 0.38 - broadWander * 0.55 + fineWander;
  const distalBranch =
    primaryPath +
    THREE.MathUtils.smoothstep(along, 0.34, 0.78) * (0.075 + fineWander * 1.4);

  return THREE.MathUtils.clamp(
    (vein(primaryPath, 0.018, 0.82) +
      vein(secondaryPath, 0.015, 0.52) +
      vein(distalBranch, 0.014, 0.38)) *
      attachmentFade *
      distalFade,
    0,
    1,
  );
}

export function getPaperyMembraneVariation(u: number, v: number) {
  const across = THREE.MathUtils.clamp(u, 0, 1);
  const along = THREE.MathUtils.clamp(v, 0, 1);
  const envelope =
    THREE.MathUtils.smoothstep(along, 0.02, 0.14) *
    (1 - THREE.MathUtils.smoothstep(along, 0.88, 1));
  const broad =
    Math.sin(across * 8.1 + Math.sin(along * 5.3) * 0.8) *
    Math.sin(along * 7.4 - across * 2.6);
  const softPatch = Math.sin(across * 3.7 - along * 5.1 + 0.9);
  return (broad * 0.68 + softPatch * 0.32) * envelope;
}

export function getFleshyPetalVascularField(u: number, v: number) {
  const across = Math.abs(THREE.MathUtils.clamp(u, 0, 1) - 0.5);
  const along = THREE.MathUtils.clamp(v, 0, 1);
  const envelope =
    THREE.MathUtils.smoothstep(along, 0.025, 0.16) *
    (1 - THREE.MathUtils.smoothstep(along, 0.9, 1));
  const wander = Math.sin(along * Math.PI * 3.2 + 0.45) * 0.004;
  const innerPath = 0.035 + along * 0.2 + wander;
  const outerPath = 0.075 + along * 0.33 - wander * 0.72;
  const vein = (path: number, width: number, strength: number) =>
    Math.exp(-Math.pow((across - path) / width, 2)) * strength;
  const branches = [0.2, 0.38, 0.56].reduce((sum, origin, index) => {
    const progress = Math.max(0, along - origin);
    const branchEnvelope =
      THREE.MathUtils.smoothstep(along, origin, origin + 0.055) *
      (1 - THREE.MathUtils.smoothstep(along, origin + 0.22, origin + 0.34));
    const source = 0.035 + origin * 0.2;
    const path =
      source +
      progress * (0.48 + index * 0.055) +
      Math.sin(progress * Math.PI * 5.2 + index * 1.7) * 0.003;
    return sum + vein(path, 0.011 + index * 0.001, 0.25) * branchEnvelope;
  }, 0);
  return THREE.MathUtils.clamp(
    envelope *
      (vein(innerPath, 0.022, 0.68) + vein(outerPath, 0.027, 0.42) + branches),
    0,
    1,
  );
}

export function getFleshyPetalCuticleVariation(u: number, v: number) {
  const across = THREE.MathUtils.clamp(u, 0, 1);
  const along = THREE.MathUtils.clamp(v, 0, 1);
  const envelope =
    THREE.MathUtils.smoothstep(along, 0.025, 0.15) *
    (1 - THREE.MathUtils.smoothstep(along, 0.88, 1));
  const broad =
    Math.sin(across * 8.7 + Math.sin(along * 5.4)) *
    Math.sin(along * 7.9 - across * 2.8);
  const cellular =
    Math.sin(across * 39 + along * 11.3) * Math.sin(along * 43 - across * 8.6);
  return envelope * (broad * 0.74 + cellular * 0.26);
}

export function getFleshyPetalLaminaVariation(u: number, v: number) {
  const across = THREE.MathUtils.clamp(u, 0, 1);
  const along = THREE.MathUtils.clamp(v, 0, 1);
  const envelope =
    THREE.MathUtils.smoothstep(along, 0.025, 0.15) *
    (1 - THREE.MathUtils.smoothstep(along, 0.88, 1));
  const lateralWarp = Math.sin(along * 11.7 + across * 3.1) * 0.42;
  const longitudinalWarp = Math.sin(across * 14.3 - along * 2.7) * 0.36;
  const areoles =
    Math.sin(across * 24.7 + lateralWarp) *
    Math.sin(along * 28.9 + longitudinalWarp);
  const nestedTissue =
    Math.sin(across * 13.1 - along * 8.3 + 0.7) *
    Math.sin(along * 17.9 + across * 5.6 - 0.4);
  const vascularQuieting = THREE.MathUtils.lerp(
    1,
    0.46,
    getFleshyPetalVascularField(across, along),
  );
  return envelope * vascularQuieting * (areoles * 0.68 + nestedTissue * 0.32);
}

export function getPaperyMicroNormalSlope(u: number, v: number) {
  const across = THREE.MathUtils.clamp(u, 0, 1);
  const along = THREE.MathUtils.clamp(v, 0, 1);
  const attachmentEnvelope = Math.pow(Math.sin(Math.PI * along), 0.48);
  const wandering = Math.sin(across * 13.7) * 1.15;
  const diagonal = along * 67 + across * 31 + wandering;
  const crossCrease = along * 39 - across * 73 + Math.sin(along * 12.3);
  const fineFold = along * 113 + across * 19 - Math.sin(across * 21.1);
  const vascularStep = 0.004;
  const vascularDx =
    getPaperyVascularField(across + vascularStep, along) -
    getPaperyVascularField(across - vascularStep, along);
  const vascularDy =
    getPaperyVascularField(across, along + vascularStep) -
    getPaperyVascularField(across, along - vascularStep);

  return {
    x:
      (Math.sin(diagonal) * 0.17 +
        Math.sin(crossCrease) * 0.105 +
        Math.sin(fineFold) * 0.055) *
        attachmentEnvelope +
      vascularDx * 0.52,
    y:
      (Math.cos(diagonal) * 0.27 +
        Math.cos(crossCrease) * 0.075 +
        Math.cos(fineFold) * 0.09) *
        attachmentEnvelope +
      vascularDy * 0.52,
  };
}

export function getLilyAntherMicroNormalSlope(u: number, v: number) {
  const axialEnvelope = Math.pow(Math.sin(Math.PI * v), 0.35);
  return {
    x:
      (Math.sin(u * Math.PI * 18 + Math.sin(v * 9.3)) * 0.045 +
        Math.sin(u * Math.PI * 41 - v * 5.2) * 0.018) *
      axialEnvelope,
    y:
      (Math.cos(v * Math.PI * 23 + u * 3.1) * 0.026 +
        Math.sin(v * Math.PI * 47 - u * 2.4) * 0.012) *
      axialEnvelope,
  };
}

export function getFleshyPetalMicroNormalSlope(u: number, v: number) {
  const across = Math.abs(THREE.MathUtils.clamp(u, 0, 1) - 0.5);
  const along = THREE.MathUtils.clamp(v, 0, 1);
  const envelope =
    THREE.MathUtils.smoothstep(along, 0.025, 0.16) *
    (1 - THREE.MathUtils.smoothstep(along, 0.88, 1));
  const vascularStep = 0.004;
  const vascularDx =
    getFleshyPetalVascularField(u + vascularStep, along) -
    getFleshyPetalVascularField(u - vascularStep, along);
  const vascularDy =
    getFleshyPetalVascularField(u, along + vascularStep) -
    getFleshyPetalVascularField(u, along - vascularStep);
  const laminaStep = 0.006;
  const laminaDx =
    getFleshyPetalLaminaVariation(u + laminaStep, along) -
    getFleshyPetalLaminaVariation(u - laminaStep, along);
  const laminaDy =
    getFleshyPetalLaminaVariation(u, along + laminaStep) -
    getFleshyPetalLaminaVariation(u, along - laminaStep);
  const side = u < 0.5 ? -1 : 1;
  const cellularPhase = across * 176 + along * 31;
  const crossGrainPhase = across * 83 - along * 57;
  return {
    x:
      side *
        envelope *
        (Math.sin(cellularPhase) * 0.021 + Math.sin(crossGrainPhase) * 0.014) +
      vascularDx * 0.36 +
      laminaDx * 0.085,
    y:
      envelope *
        (Math.cos(cellularPhase) * 0.018 + Math.cos(crossGrainPhase) * 0.012) +
      vascularDy * 0.36 +
      laminaDy * 0.085,
  };
}

export function getWoodyStemMicroNormalSlope(u: number, v: number) {
  const longitudinalGrain = Math.sin(u * 42 + Math.sin(v * 7.3)) * 0.105;
  const shallowFissure = Math.sin(u * 17 - v * 13.5) * 0.055;
  const lenticelBreak =
    Math.pow(Math.abs(Math.sin(v * 31 + u * 9)), 22) * 0.075;
  return {
    x: longitudinalGrain + shallowFissure,
    y: Math.cos(v * 18 + Math.sin(u * 8.1)) * 0.2 + lenticelBreak,
  };
}

export function getCoarseStemMicroNormalSlope(u: number, v: number) {
  const longitudinalFiber = Math.sin(u * 55 + Math.sin(v * 11)) * 0.12;
  const crossBreak = Math.cos(v * 24 - u * 8.5) * 0.055;
  const trichomeSocket =
    Math.pow(Math.abs(Math.sin(u * 19 + v * 37)), 30) * 0.09;
  return {
    x: longitudinalFiber + crossBreak,
    y: Math.sin(v * 29 + u * 7) * 0.155 + trichomeSocket,
  };
}

export function getAquaticScapeMicroNormalSlope(u: number, v: number) {
  const axialFiber = Math.sin(u * 38 + Math.sin(v * 4.2) * 0.7) * 0.052;
  const hydratedCell = Math.sin(v * 16 - u * 5.5) * 0.018;
  const broadUndulation = Math.cos(u * 11 + v * 2.8) * 0.014;
  return {
    x: axialFiber + broadUndulation,
    y: hydratedCell + broadUndulation * 0.45,
  };
}

export function getGlaucousStemMicroNormalSlope(u: number, v: number) {
  const axialTissue = Math.sin(u * 31 + Math.sin(v * 5.4)) * 0.045;
  const waxBloom =
    Math.sin(u * 17 + v * 23) * Math.sin(v * 11 - u * 13) * 0.022;
  return {
    x: axialTissue + waxBloom,
    y: Math.cos(v * 18 - u * 4.5) * 0.024 + waxBloom * 0.55,
  };
}

export function getMonocotStemMicroNormalSlope(u: number, v: number) {
  const axialStriation = Math.sin(u * 44 + Math.sin(v * 3.8) * 0.45) * 0.042;
  const epidermalCell = Math.cos(v * 21 - u * 3.2) * 0.016;
  return {
    x: axialStriation,
    y: epidermalCell,
  };
}

export function getOrchidSpikeMicroNormalSlope(u: number, v: number) {
  const axialEpidermis = Math.sin(u * 36 + Math.sin(v * 4.6) * 0.38) * 0.034;
  const softCell = Math.cos(v * 15 - u * 2.8) * 0.012;
  return {
    x: axialEpidermis,
    y: softCell,
  };
}

export function getSepalMicroNormalSlope(u: number, v: number) {
  const attachmentFade = THREE.MathUtils.smoothstep(v, 0.02, 0.18);
  const tipFade = 1 - THREE.MathUtils.smoothstep(v, 0.78, 1);
  const vascular = Math.sin(u * 34 + Math.sin(v * 8)) * 0.075;
  const longitudinalCell = Math.cos(v * 62 + u * 5.5) * 0.055;
  return {
    x: vascular * attachmentFade * tipFade,
    y: longitudinalCell * attachmentFade * tipFade,
  };
}

export function getRoseCalyxMicroNormalSlope(u: number, v: number) {
  const shoulderEnvelope = THREE.MathUtils.smoothstep(v, 0.02, 0.16);
  const tipFade = 1 - THREE.MathUtils.smoothstep(v, 0.82, 1);
  const envelope = shoulderEnvelope * tipFade;
  return {
    x: Math.sin(u * 24 + Math.sin(v * 6.4)) * 0.052 * envelope,
    y: Math.cos(v * 31 + u * 4.2) * 0.044 * envelope,
  };
}

export function getCoarseLeafMicroNormalSlope(u: number, v: number) {
  const midrib = Math.exp(-Math.pow((u - 0.5) / 0.055, 2));
  const envelope =
    Math.pow(Math.sin(THREE.MathUtils.clamp(v, 0, 1) * Math.PI), 0.42) *
    THREE.MathUtils.smoothstep(Math.min(u, 1 - u), 0.025, 0.16);
  const broadX =
    proceduralNoise(u * 31 + 0.47, v * 37, 0.41) -
    proceduralNoise(u * 31 - 0.47, v * 37, 0.41);
  const broadY =
    proceduralNoise(u * 31, v * 37 + 0.47, 0.41) -
    proceduralNoise(u * 31, v * 37 - 0.47, 0.41);
  const fineX =
    proceduralNoise(u * 79 + 0.31, v * 83, 0.73) -
    proceduralNoise(u * 79 - 0.31, v * 83, 0.73);
  const fineY =
    proceduralNoise(u * 79, v * 83 + 0.31, 0.73) -
    proceduralNoise(u * 79, v * 83 - 0.31, 0.73);
  return {
    x: (broadX * 0.034 + fineX * 0.014) * envelope + midrib * 0.028,
    y: (broadY * 0.04 + fineY * 0.016) * envelope + midrib * 0.016,
  };
}

export function getGlaucousLeafMicroNormalSlope(u: number, v: number) {
  const bloom = Math.sin(u * Math.PI * 17 + Math.sin(v * 5.6)) * 0.028;
  const broad = Math.cos(v * 19 - u * 3.8) * 0.022;
  return {
    x: bloom + broad,
    y: Math.sin(v * 27 + u * 4.1) * 0.034,
  };
}

export function getLigulatePetalMicroNormalSlope(u: number, v: number) {
  const center = Math.exp(-Math.pow((u - 0.5) / 0.045, 2));
  const lateral =
    Math.exp(-Math.pow((u - 0.28) / 0.055, 2)) +
    Math.exp(-Math.pow((u - 0.72) / 0.055, 2));
  const envelope = Math.pow(Math.sin(Math.PI * v), 0.4);
  const marginFade = THREE.MathUtils.smoothstep(
    Math.min(u, 1 - u),
    0.025,
    0.14,
  );
  const cellularEnvelope = envelope * marginFade;
  const cellularX =
    (proceduralNoise(u * 73 + 0.61, v * 89, 0.37) -
      proceduralNoise(u * 73 - 0.61, v * 89, 0.37)) *
    0.009;
  const cellularY =
    (proceduralNoise(u * 151, v * 137 + 0.53, 0.71) -
      proceduralNoise(u * 151, v * 137 - 0.53, 0.71)) *
    0.007;
  return {
    x:
      (center * 0.042 + lateral * 0.026) * envelope +
      cellularX * cellularEnvelope,
    y:
      Math.sin(v * Math.PI * 26 + u * 2.4) * 0.028 * envelope +
      cellularY * cellularEnvelope,
  };
}

export function getLigulatePetalPigmentField(
  u: number,
  v: number,
  seed: number,
) {
  const center = Math.exp(-Math.pow((u - 0.5) / 0.052, 2));
  const lateral =
    Math.exp(-Math.pow((u - 0.28) / 0.064, 2)) +
    Math.exp(-Math.pow((u - 0.72) / 0.064, 2));
  const bladeEnvelope =
    THREE.MathUtils.smoothstep(v, 0.035, 0.16) *
    (1 - THREE.MathUtils.smoothstep(v, 0.86, 0.99));
  const broadMottle =
    proceduralNoise(u * 13 + seed * 0.17, v * 17 - seed * 0.11, 0.38) - 0.5;
  const fineGrain =
    proceduralNoise(u * 43 - seed * 0.07, v * 47 + seed * 0.13, 0.67) - 0.5;
  const tipEnvelope =
    THREE.MathUtils.smoothstep(v, 0.76, 0.94) *
    (1 - THREE.MathUtils.smoothstep(v, 0.96, 1));
  const marginEnvelope =
    (1 - THREE.MathUtils.smoothstep(Math.min(u, 1 - u), 0.012, 0.075)) *
    THREE.MathUtils.smoothstep(v, 0.12, 0.3) *
    (1 - THREE.MathUtils.smoothstep(v, 0.82, 0.98));
  const edgeNoise =
    proceduralNoise(u * 59 + seed * 0.23, v * 61 - seed * 0.19, 0.52) - 0.5;

  return {
    vascular: (center * 0.72 + lateral * 0.46) * bladeEnvelope,
    tissue: (broadMottle * 0.72 + fineGrain * 0.28) * bladeEnvelope,
    tip: tipEnvelope * (0.72 + edgeNoise * 0.28),
    margin: marginEnvelope * (0.68 + edgeNoise * 0.32),
  };
}

export function getLigulatePetalLaminaCellField(u: number, v: number) {
  const across = THREE.MathUtils.clamp(u, 0, 1);
  const along = THREE.MathUtils.clamp(v, 0, 1);
  const endpointEnvelope =
    THREE.MathUtils.smoothstep(along, 0.045, 0.18) *
    (1 - THREE.MathUtils.smoothstep(along, 0.84, 0.98));
  const marginEnvelope = THREE.MathUtils.smoothstep(
    Math.min(across, 1 - across),
    0.025,
    0.13,
  );
  const center = Math.exp(-Math.pow((across - 0.5) / 0.052, 2));
  const lateral =
    Math.exp(-Math.pow((across - 0.28) / 0.06, 2)) +
    Math.exp(-Math.pow((across - 0.72) / 0.06, 2));
  const vascularQuieting = THREE.MathUtils.lerp(
    1,
    0.42,
    THREE.MathUtils.clamp(center * 0.72 + lateral * 0.46, 0, 1),
  );
  // Broad, staggered lamina cells alter optical depth without introducing
  // costly per-fragment noise or a screen-space pattern. The asymmetric phase
  // prevents a regular woven-grid appearance at macro distance.
  const elongated =
    Math.sin(across * 43.7 + Math.sin(along * 17.3) * 0.72) *
    Math.sin(along * 68.9 - across * 5.4);
  const staggered =
    Math.sin(across * 27.1 + along * 9.7 + 1.13) *
    Math.sin(along * 41.3 - across * 11.2 + 0.47);
  return (
    (elongated * 0.68 + staggered * 0.32) *
    endpointEnvelope *
    marginEnvelope *
    vascularQuieting
  );
}

export function getLilyTepalMicroNormalSlope(u: number, v: number) {
  const attachmentFade = THREE.MathUtils.smoothstep(v, 0.035, 0.16);
  const tipFade = 1 - THREE.MathUtils.smoothstep(v, 0.84, 1);
  const envelope = attachmentFade * tipFade;
  const broadFibers =
    Math.sin(u * Math.PI * 11.5 + Math.sin(v * 5.2) * 0.85) * 0.052;
  const fineFibers = Math.sin(u * Math.PI * 27.3 - v * 4.1) * 0.021;
  const crossGrain = Math.sin(v * Math.PI * 17 + u * 6.2) * 0.024;
  return {
    x: (broadFibers + fineFibers) * envelope,
    y: crossGrain * envelope,
  };
}

export function getRoseLeafMicroNormalSlope(u: number, v: number) {
  const midrib = Math.exp(-Math.pow((u - 0.5) / 0.05, 2));
  const lateral = Math.sin(v * 22 + Math.abs(u - 0.5) * 18) * 0.028;
  return {
    x: lateral + midrib * 0.032,
    y: Math.cos(v * 29 - u * 5.4) * 0.05 + midrib * 0.02,
  };
}

export function getMonocotLeafMicroNormalSlope(u: number, v: number) {
  const parallel = Math.sin(u * Math.PI * 17 + Math.sin(v * 4.4)) * 0.026;
  const fine = Math.sin(u * Math.PI * 43 - v * 3.2) * 0.012;
  return {
    x: parallel + fine,
    y: Math.cos(v * 21 + u * 2.8) * 0.028,
  };
}

export function getPeltateLeafMicroNormalSlope(u: number, v: number) {
  const x = u * 2 - 1;
  const y = v * 2 - 1;
  const radius = Math.min(1, Math.hypot(x, y));
  const radialEnvelope = Math.sin(radius * Math.PI);
  const radial = radialEnvelope * 0.032;
  return {
    x: x * radial,
    y: y * radial,
  };
}

export function getAquaticPetalMicroNormalSlope(u: number, v: number) {
  const broad =
    Math.sin(u * 8.4 + Math.sin(v * 4.7)) * Math.sin(v * 10.2 - u * 2.4);
  const margin = Math.min(u, 1 - u);
  const edge = 1 - THREE.MathUtils.smoothstep(margin, 0, 0.22);
  const tissueEnvelope =
    THREE.MathUtils.smoothstep(v, 0.02, 0.14) *
    (1 - THREE.MathUtils.smoothstep(v, 0.86, 1));
  return {
    x: (broad * 0.018 + edge * Math.sin(v * 17) * 0.012) * tissueEnvelope,
    y: Math.cos(v * 19 + u * 3.5) * 0.022 * tissueEnvelope,
  };
}

export function getOrchidLabellumMicroNormalSlope(u: number, v: number) {
  const step = 0.018;
  const callus = (across: number, t: number) =>
    getLabellumCallusField(across * 2 - 1, t, 6180);
  const x = (callus(u + step, v) - callus(u - step, v)) / (step * 2);
  const y = (callus(u, v + step) - callus(u, v - step)) / (step * 2);
  return { x: x * 0.16, y: y * 0.12 };
}

export function getSeedMicroNormalSlope(u: number, v: number) {
  return {
    x: Math.sin(u * 18.5 + Math.sin(v * 5.2)) * 0.012,
    y: Math.cos(v * 21 - u * 3.1) * 0.014,
  };
}

export function getPitMicroNormalSlope(u: number, v: number) {
  const wallEnvelope =
    THREE.MathUtils.smoothstep(v, 0.04, 0.18) *
    (1 - THREE.MathUtils.smoothstep(v, 0.82, 0.98));
  return {
    x: Math.sin(u * 12.8 + Math.sin(v * 4.1)) * 0.018 * wallEnvelope,
    y: Math.cos(v * 16.2 - u * 2.4) * 0.016 * wallEnvelope,
  };
}

export function getReceptacleMicroNormalSlope(u: number, v: number) {
  return {
    x: Math.sin(u * 9.2 + Math.sin(v * 3.6)) * 0.014,
    y: Math.cos(v * 13.1 - u * 2.2) * 0.012,
  };
}

export function getDiskFloretMicroNormalSlope(u: number, v: number) {
  return {
    x: Math.sin(u * 15.4 + Math.sin(v * 4.2)) * 0.016,
    y: Math.cos(v * 18.6 - u * 2.8) * 0.014,
  };
}

export function getInvolucreMicroNormalSlope(u: number, v: number) {
  const envelope =
    THREE.MathUtils.smoothstep(v, 0.02, 0.16) *
    (1 - THREE.MathUtils.smoothstep(v, 0.82, 1));
  const finePubescenceX = Math.sin(u * 118 + v * 17.3) * 0.018;
  const finePubescenceY = Math.cos(v * 103 - u * 13.7) * 0.012;
  return {
    x:
      (Math.sin(u * 32 + Math.sin(v * 7.2)) * 0.072 + finePubescenceX) *
      envelope,
    y: (Math.cos(v * 37 - u * 8) * 0.032 + finePubescenceY) * envelope,
  };
}

export function getVelamenMicroNormalSlope(u: number, v: number) {
  const longitudinalCell = Math.sin(u * 46 + Math.sin(v * 9.5)) * 0.085;
  const porousBreak = Math.cos(v * 34 - u * 6.5) * 0.045;
  const hydrationPatch =
    Math.sin(u * 13 + v * 17) * Math.sin(v * 11 - u * 8) * 0.035;
  return {
    x: longitudinalCell + hydrationPatch,
    y: porousBreak + hydrationPatch * 0.6,
  };
}

/** Creates a color multiplier for edge oxidation, bruises, and tiny blemishes. */
export function getBotanicalAgeTexture(
  surface: Extract<BotanicalSurface, "petal" | "leaf">,
  age: number,
  seed: number,
  resolution = 128,
) {
  return getBotanicalAlbedoTexture(surface, age, seed, 0, 0, resolution);
}

/** Adds seed-specific UV-space spots and nectar guides to petal aging detail. */
export function getPetalAlbedoTexture(
  age: number,
  seed: number,
  spots: number,
  guideStrength: number,
  resolution = 128,
  markingColor?: string,
  callusColor?: string,
  markingVariant: PetalMarkingVariant = "default",
) {
  return getBotanicalAlbedoTexture(
    "petal",
    age,
    seed,
    THREE.MathUtils.clamp(spots, 0, 1),
    THREE.MathUtils.clamp(guideStrength, 0, 1),
    resolution,
    markingColor,
    callusColor,
    markingVariant,
  );
}

export function getPetalSpotCenters(
  seed: number,
  spots: number,
  variant: PetalMarkingVariant = "default",
) {
  const spotStep = Math.round(THREE.MathUtils.clamp(spots, 0, 1) * 24) / 24;
  return Array.from({ length: Math.round(spotStep * 42) }, (_, index) => {
    const radius =
      0.012 + proceduralNoise(seed + index * 7, index + 19, 0.83) * 0.022;
    return {
      u: 0.16 + proceduralNoise(seed + index * 17, index + 3, 0.71) * 0.68,
      v:
        variant === "lily"
          ? 0.14 + proceduralNoise(seed - index * 29, index + 11, 0.43) * 0.43
          : variant === "poppy"
            ? 0.06 + proceduralNoise(seed - index * 29, index + 11, 0.43) * 0.16
            : 0.16 +
              proceduralNoise(seed - index * 29, index + 11, 0.43) * 0.62,
      // Lily texture V spans a blade several times longer than texture U spans
      // its width. Compress the UV-space V radius so the projected markings
      // become irregular freckles instead of longitudinal brush strokes.
      radiusU: variant === "lily" ? radius * 1.08 : radius,
      radiusV: variant === "lily" ? radius * 0.42 : radius,
    };
  });
}

export function getLilyTepalMarginPigment(u: number, v: number, seed: number) {
  const marginDistance = Math.min(u, 1 - u);
  const margin = 1 - THREE.MathUtils.smoothstep(marginDistance, 0.012, 0.12);
  const bladeEnvelope =
    THREE.MathUtils.smoothstep(v, 0.08, 0.22) *
    (1 - THREE.MathUtils.smoothstep(v, 0.82, 0.98));
  const irregularity = THREE.MathUtils.lerp(
    0.38,
    1,
    proceduralNoise(u * 257 + seed * 0.19, v * 263 - seed * 0.13, 0.27),
  );
  return THREE.MathUtils.clamp(margin * bladeEnvelope * irregularity, 0, 1);
}

export function getLilyTepalMarginWeathering(
  u: number,
  v: number,
  seed: number,
) {
  const marginDistance = Math.min(u, 1 - u);
  const margin = 1 - THREE.MathUtils.smoothstep(marginDistance, 0.006, 0.065);
  const bladeEnvelope =
    THREE.MathUtils.smoothstep(v, 0.14, 0.28) *
    (1 - THREE.MathUtils.smoothstep(v, 0.76, 0.94));
  const broad = proceduralNoise(
    u * 431 + seed * 0.23,
    v * 389 - seed * 0.17,
    0.37,
  );
  const fine = proceduralNoise(
    u * 997 - seed * 0.11,
    v * 853 + seed * 0.29,
    0.61,
  );
  const brokenPatches = THREE.MathUtils.smoothstep(
    broad * 0.72 + fine * 0.28,
    0.56,
    0.84,
  );

  return THREE.MathUtils.clamp(
    margin * bladeEnvelope * brokenPatches * 0.72,
    0,
    0.72,
  );
}

function getBotanicalAlbedoTexture(
  surface: Extract<BotanicalSurface, "petal" | "leaf">,
  age: number,
  seed: number,
  spots: number,
  guideStrength: number,
  resolution: number,
  markingColor?: string,
  callusColor?: string,
  markingVariant: PetalMarkingVariant = "default",
) {
  const normalizedAge = THREE.MathUtils.clamp(age, 0, 1);
  const ageStep = Math.round(normalizedAge * 32) / 32;
  const spotStep = Math.round(spots * 24) / 24;
  const guideStep = Math.round(guideStrength * 24) / 24;
  const size = THREE.MathUtils.clamp(Math.round(resolution), 32, 512);
  const key = `${surface}:${ageStep}:${Math.round(seed)}:${spotStep}:${guideStep}:${size}:${markingColor ?? "default"}:${callusColor ?? "none"}:${markingVariant}`;
  const cached = ageTextures.get(key);
  if (cached) return cached;

  const spotCenters = getPetalSpotCenters(seed, spotStep, markingVariant);

  const data = new Uint8Array(size * size * 4);
  const markingTint = markingColor ? new THREE.Color(markingColor) : undefined;
  const callusTint = callusColor ? new THREE.Color(callusColor) : undefined;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / (size - 1);
      const v = y / (size - 1);
      const edgeDistance = Math.min(u, 1 - u, v, 1 - v);
      const edgeOxidation =
        (1 - THREE.MathUtils.smoothstep(edgeDistance, 0.008, 0.15)) * ageStep;
      const field = proceduralNoise(x + seed * 0.17, y - seed * 0.11, 0.16);
      const bruise =
        THREE.MathUtils.smoothstep(field, 0.82, 0.97) *
        THREE.MathUtils.smoothstep(v, 0.08, 0.78) *
        ageStep;
      const speck =
        proceduralNoise(x + seed, y + seed, 0.71) > 0.992 ? ageStep * 0.75 : 0;
      const damage = THREE.MathUtils.clamp(
        edgeOxidation * 0.75 + bruise * 0.62 + speck,
        0,
        1,
      );
      const guide =
        guideStep *
        Math.exp(-Math.pow((u - 0.5) / (0.055 + v * 0.11), 2)) *
        (1 - THREE.MathUtils.smoothstep(v, 0.3, 0.92));
      const spotMask = spotCenters.reduce((strongest, spot) => {
        const distance = Math.hypot(
          (u - spot.u) / spot.radiusU,
          (v - spot.v) / spot.radiusV,
        );
        return Math.max(
          strongest,
          1 - THREE.MathUtils.smoothstep(distance, 0.55, 1),
        );
      }, 0);
      const marking = THREE.MathUtils.clamp(guide * 0.72 + spotMask, 0, 1);
      const lilyMarginPigment =
        markingVariant === "lily" ? getLilyTepalMarginPigment(u, v, seed) : 0;
      const lilyMarginWeathering =
        markingVariant === "lily"
          ? getLilyTepalMarginWeathering(u, v, seed)
          : 0;
      const lilyPigmentHalo =
        markingVariant === "lily"
          ? THREE.MathUtils.smoothstep(marking, 0.015, 0.22) *
            (1 - THREE.MathUtils.smoothstep(marking, 0.42, 0.82))
          : 0;
      const offset = (y * size + x) * 4;
      const lilyTissueVariation =
        markingVariant === "lily"
          ? (proceduralNoise(x + seed * 0.31, y - seed * 0.27, 0.34) - 0.5) *
              7 +
            Math.sin(u * Math.PI * 34 + proceduralNoise(seed, y, 0.18) * 2) *
              1.6
          : 0;
      const roseTissueVariation =
        markingVariant === "rose"
          ? (() => {
              const vascular = getFleshyPetalVascularField(u, v);
              const lamina = getFleshyPetalLaminaVariation(u, v);
              const endpointEnvelope =
                THREE.MathUtils.smoothstep(v, 0.025, 0.16) *
                (1 - THREE.MathUtils.smoothstep(v, 0.92, 1));
              const broadMottle =
                (proceduralNoise(
                  x * 0.23 + seed * 0.31,
                  y * 0.23 - seed * 0.27,
                  0.34,
                ) -
                  0.5) *
                17;
              // Use two restrained, seed-stable noise scales instead of a
              // repeating sinusoid. The latter can read as decorative
              // striping at macro distance, while real rose lamina has a
              // softer cellular breakup that follows the petal surface.
              const laminaGrain =
                (proceduralNoise(
                  u * 19 + seed * 0.17,
                  v * 19 - seed * 0.13,
                  0.72,
                ) -
                  0.5) *
                  5.2 +
                (proceduralNoise(
                  u * 47 - seed * 0.07,
                  v * 47 + seed * 0.11,
                  0.31,
                ) -
                  0.5) *
                  1.8;
              return (
                broadMottle * endpointEnvelope +
                laminaGrain * endpointEnvelope -
                vascular * 15 +
                lamina * 7.5
              );
            })()
          : 0;
      const ligulatePigment =
        markingVariant === "ligulate"
          ? getLigulatePetalPigmentField(u, v, seed)
          : { vascular: 0, tissue: 0, tip: 0, margin: 0 };

      if (surface === "petal") {
        if (markingTint) {
          const pigment = THREE.MathUtils.smoothstep(marking, 0.06, 0.72);
          data[offset] = Math.round(
            THREE.MathUtils.lerp(
              THREE.MathUtils.clamp(
                255 -
                  damage * 42 +
                  lilyTissueVariation -
                  lilyMarginPigment * 3 -
                  lilyMarginWeathering * 16 -
                  lilyPigmentHalo * 5,
                0,
                255,
              ),
              markingTint.r * 255,
              pigment,
            ),
          );
          data[offset + 1] = Math.round(
            THREE.MathUtils.lerp(
              THREE.MathUtils.clamp(
                255 -
                  damage * 82 +
                  lilyTissueVariation * 0.82 -
                  lilyMarginPigment * 7 -
                  lilyMarginWeathering * 30 -
                  lilyPigmentHalo * 9,
                0,
                255,
              ),
              markingTint.g * 255,
              pigment,
            ),
          );
          data[offset + 2] = Math.round(
            THREE.MathUtils.lerp(
              THREE.MathUtils.clamp(
                255 -
                  damage * 105 +
                  lilyTissueVariation * 0.62 -
                  lilyMarginPigment * 10 -
                  lilyMarginWeathering * 38 -
                  lilyPigmentHalo * 7,
                0,
                255,
              ),
              markingTint.b * 255,
              pigment,
            ),
          );
        } else {
          data[offset] = Math.round(
            THREE.MathUtils.clamp(
              255 - damage * 42 - marking * 24 + roseTissueVariation * 0.62,
              0,
              255,
            ),
          );
          data[offset + 1] = Math.round(
            THREE.MathUtils.clamp(
              255 - damage * 82 - marking * 68 + roseTissueVariation * 1.08,
              0,
              255,
            ),
          );
          data[offset + 2] = Math.round(
            THREE.MathUtils.clamp(
              255 - damage * 105 - marking * 46 + roseTissueVariation * 0.86,
              0,
              255,
            ),
          );
        }
        if (callusTint) {
          const callus = getLabellumCallusField(u * 2 - 1, v, seed);
          const tissueMottle = THREE.MathUtils.lerp(
            0.72,
            1,
            proceduralNoise(x + seed * 0.41, y - seed * 0.23, 0.28),
          );
          const pigment =
            THREE.MathUtils.smoothstep(callus, 0.035, 0.9) *
            tissueMottle *
            0.78;
          data[offset] = Math.round(
            THREE.MathUtils.lerp(data[offset], callusTint.r * 255, pigment),
          );
          data[offset + 1] = Math.round(
            THREE.MathUtils.lerp(data[offset + 1], callusTint.g * 255, pigment),
          );
          data[offset + 2] = Math.round(
            THREE.MathUtils.lerp(data[offset + 2], callusTint.b * 255, pigment),
          );
        }
        if (markingVariant === "poppy") {
          const vascular = getPaperyVascularField(u, v);
          const membrane = getPaperyMembraneVariation(u, v);
          const pigmentPhase =
            proceduralNoise(seed + 9_731, seed * 0.37) * Math.PI * 2;
          const pigmentEnvelope =
            THREE.MathUtils.smoothstep(v, 0.035, 0.18) *
            (1 - THREE.MathUtils.smoothstep(v, 0.86, 1));
          const broadPigment =
            (0.5 +
              Math.sin((u * 2 - 1) * 3.8 + v * 4.7 + pigmentPhase) * 0.3 +
              Math.sin((u * 2 - 1) * 7.1 - v * 3.2 + pigmentPhase * 0.61) *
                0.2) *
            pigmentEnvelope;
          data[offset] = Math.round(
            THREE.MathUtils.clamp(
              data[offset] - vascular * 10 - broadPigment * 8 + membrane * 3,
              0,
              255,
            ),
          );
          data[offset + 1] = Math.round(
            THREE.MathUtils.clamp(
              data[offset + 1] -
                vascular * 18 -
                broadPigment * 24 +
                membrane * 3,
              0,
              255,
            ),
          );
          data[offset + 2] = Math.round(
            THREE.MathUtils.clamp(
              data[offset + 2] -
                vascular * 15 -
                broadPigment * 19 +
                membrane * 2,
              0,
              255,
            ),
          );
        }
        if (markingVariant === "ligulate") {
          data[offset] = Math.round(
            THREE.MathUtils.clamp(
              data[offset] +
                ligulatePigment.tissue * 8 -
                ligulatePigment.vascular * 4,
              0,
              255,
            ),
          );
          data[offset + 1] = Math.round(
            THREE.MathUtils.clamp(
              data[offset + 1] +
                ligulatePigment.tissue * 13 -
                ligulatePigment.vascular * 12,
              0,
              255,
            ),
          );
          data[offset + 2] = Math.round(
            THREE.MathUtils.clamp(
              data[offset + 2] +
                ligulatePigment.tissue * 6 -
                ligulatePigment.vascular * 9,
              0,
              255,
            ),
          );
          data[offset] = Math.round(
            THREE.MathUtils.clamp(
              data[offset] +
                ligulatePigment.tip * 3 +
                ligulatePigment.margin * 1.5,
              0,
              255,
            ),
          );
          data[offset + 1] = Math.round(
            THREE.MathUtils.clamp(
              data[offset + 1] +
                ligulatePigment.tip * 1 -
                ligulatePigment.margin * 2,
              0,
              255,
            ),
          );
          data[offset + 2] = Math.round(
            THREE.MathUtils.clamp(
              data[offset + 2] - ligulatePigment.tip * 2,
              0,
              255,
            ),
          );
        }
      } else {
        data[offset] = Math.round(255 - damage * 38);
        data[offset + 1] = Math.round(255 - damage * 74);
        data[offset + 2] = Math.round(255 - damage * 128);
      }
      data[offset + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  ageTextures.set(key, texture);
  return texture;
}

/**
 * Material maps share the same UV-space anatomy as the bump textures. This
 * keeps veins, softer tissue, and translucent margins visually connected.
 */
export function getBotanicalMaterialTexture(
  surface: BotanicalSurface,
  map: BotanicalMaterialMap,
  resolution = 128,
  variant: BotanicalMaterialVariant = "default",
) {
  const size = THREE.MathUtils.clamp(Math.round(resolution), 32, 512);
  const key = `${surface}:${map}:${size}:${variant}`;
  const cached = materialTextures.get(key);
  if (cached) return cached;

  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / (size - 1);
      const v = y / (size - 1);
      const margin = Math.min(u, 1 - u);
      const centerVein = Math.exp(-Math.pow((u - 0.5) / 0.045, 2));
      const sideVeins =
        Math.pow(Math.abs(Math.sin(v * 40 + Math.abs(u - 0.5) * 17)), 25) * v;
      const noise = proceduralNoise(x, y) - 0.5;
      let value: number;

      if (map === "microNormal") {
        const cellFrequency = surface === "petal" ? 78 : 96;
        const strength = surface === "stem" ? 0.2 : 0.34;
        const authoredSlope =
          surface === "petal" && variant === "papery"
            ? getPaperyMicroNormalSlope(u, v)
            : surface === "petal" && variant === "veined"
              ? getFleshyPetalMicroNormalSlope(u, v)
              : surface === "petal" && variant === "parallel"
                ? getLilyTepalMicroNormalSlope(u, v)
                : surface === "petal" && variant === "ligulate"
                  ? getLigulatePetalMicroNormalSlope(u, v)
                  : surface === "petal" && variant === "lotus"
                    ? getAquaticPetalMicroNormalSlope(u, v)
                    : surface === "petal" && variant === "orchidLip"
                      ? getOrchidLabellumMicroNormalSlope(u, v)
                      : surface === "center" && variant === "seed"
                        ? getSeedMicroNormalSlope(u, v)
                        : surface === "center" && variant === "pit"
                          ? getPitMicroNormalSlope(u, v)
                          : surface === "center" && variant === "receptacle"
                            ? getReceptacleMicroNormalSlope(u, v)
                            : surface === "center" && variant === "disk"
                              ? getDiskFloretMicroNormalSlope(u, v)
                              : surface === "center" && variant === "anther"
                                ? getLilyAntherMicroNormalSlope(u, v)
                                : surface === "leaf" && variant === "sepal"
                                  ? getSepalMicroNormalSlope(u, v)
                                  : surface === "leaf" && variant === "coarse"
                                    ? getCoarseLeafMicroNormalSlope(u, v)
                                    : surface === "leaf" && variant === "veined"
                                      ? getRoseLeafMicroNormalSlope(u, v)
                                      : surface === "leaf" &&
                                          variant === "parallel"
                                        ? getMonocotLeafMicroNormalSlope(u, v)
                                        : surface === "leaf" &&
                                            variant === "peltate"
                                          ? getPeltateLeafMicroNormalSlope(u, v)
                                          : surface === "leaf" &&
                                              variant === "glaucous"
                                            ? getGlaucousLeafMicroNormalSlope(
                                                u,
                                                v,
                                              )
                                            : surface === "leaf" &&
                                                variant === "involucre"
                                              ? getInvolucreMicroNormalSlope(
                                                  u,
                                                  v,
                                                )
                                              : surface === "stem" &&
                                                  variant === "woody"
                                                ? getWoodyStemMicroNormalSlope(
                                                    u,
                                                    v,
                                                  )
                                                : surface === "stem" &&
                                                    variant === "coarse"
                                                  ? getCoarseStemMicroNormalSlope(
                                                      u,
                                                      v,
                                                    )
                                                  : surface === "stem" &&
                                                      variant === "aquatic"
                                                    ? getAquaticScapeMicroNormalSlope(
                                                        u,
                                                        v,
                                                      )
                                                    : surface === "stem" &&
                                                        variant === "glaucous"
                                                      ? getGlaucousStemMicroNormalSlope(
                                                          u,
                                                          v,
                                                        )
                                                      : surface === "stem" &&
                                                          variant === "monocot"
                                                        ? getMonocotStemMicroNormalSlope(
                                                            u,
                                                            v,
                                                          )
                                                        : surface === "stem" &&
                                                            variant === "spike"
                                                          ? getOrchidSpikeMicroNormalSlope(
                                                              u,
                                                              v,
                                                            )
                                                          : surface ===
                                                                "stem" &&
                                                              variant ===
                                                                "velamen"
                                                            ? getVelamenMicroNormalSlope(
                                                                u,
                                                                v,
                                                              )
                                                            : surface ===
                                                                  "stem" &&
                                                                variant ===
                                                                  "calyx"
                                                              ? getRoseCalyxMicroNormalSlope(
                                                                  u,
                                                                  v,
                                                                )
                                                              : null;
        const nx = authoredSlope
          ? authoredSlope.x
          : Math.sin(u * cellFrequency + Math.sin(v * 19)) * strength +
            (proceduralNoise(x + 1, y) - proceduralNoise(x - 1, y)) * 0.18;
        const ny = authoredSlope
          ? authoredSlope.y
          : Math.cos(v * cellFrequency * 0.72 + Math.sin(u * 23)) * strength +
            (proceduralNoise(x, y + 1) - proceduralNoise(x, y - 1)) * 0.18;
        const normal = new THREE.Vector3(-nx, -ny, 1).normalize();
        const offset = (y * size + x) * 4;
        data[offset] = Math.round((normal.x * 0.5 + 0.5) * 255);
        data[offset + 1] = Math.round((normal.y * 0.5 + 0.5) * 255);
        data[offset + 2] = Math.round((normal.z * 0.5 + 0.5) * 255);
        data[offset + 3] = 255;
        continue;
      }

      if (map === "thickness" || map === "backscatter") {
        if (surface === "petal") {
          const edgeTaper = THREE.MathUtils.smoothstep(margin, 0, 0.16);
          const tipTaper = THREE.MathUtils.smoothstep(1 - v, 0, 0.24);
          const ligulateSideVeins =
            Math.exp(-Math.pow((u - 0.28) / 0.052, 2)) +
            Math.exp(-Math.pow((u - 0.72) / 0.052, 2));
          const parallelVeins = [0.18, 0.34, 0.5, 0.66, 0.82].reduce(
            (sum, center) => sum + Math.exp(-Math.pow((u - center) / 0.026, 2)),
            0,
          );
          value =
            variant === "papery"
              ? 30 +
                edgeTaper * 48 +
                (1 - tipTaper) * 24 +
                centerVein * 128 +
                getPaperyVascularField(u, v) * 96 +
                getPaperyMembraneVariation(u, v) * 26
              : variant === "veined"
                ? 56 +
                  edgeTaper * 62 +
                  (1 - tipTaper) * 28 +
                  centerVein * 96 +
                  getFleshyPetalVascularField(u, v) * 58 +
                  getFleshyPetalCuticleVariation(u, v) * 6 +
                  getFleshyPetalLaminaVariation(u, v) * 9
                : variant === "parallel"
                  ? 46 +
                    edgeTaper * 58 +
                    (1 - tipTaper) * 26 +
                    parallelVeins * 34
                  : variant === "ligulate"
                    ? 42 +
                      edgeTaper * 52 +
                      (1 - tipTaper) * 24 +
                      centerVein * 104 +
                      ligulateSideVeins * 68 +
                      getLigulatePetalLaminaCellField(u, v) * 14
                    : variant === "orchid"
                      ? 58 +
                        edgeTaper * 72 +
                        (1 - tipTaper) * 24 +
                        getOrchidTepalVascularField(u, v) * 96
                      : variant === "orchidLip"
                        ? 74 +
                          edgeTaper * 58 +
                          (1 - tipTaper) * 20 -
                          THREE.MathUtils.smoothstep(
                            getLabellumCallusField(u * 2 - 1, v, 6180),
                            0.04,
                            0.78,
                          ) *
                            26
                        : variant === "lotus"
                          ? 64 +
                            edgeTaper * 72 +
                            (1 - tipTaper) * 30 +
                            centerVein * 56 +
                            Math.sin(u * 8.6 + Math.sin(v * 5.8)) *
                              Math.sin(v * 9.1 - u * 2.1) *
                              10
                          : 70 +
                            edgeTaper * 78 +
                            (1 - tipTaper) * 38 +
                            centerVein * 74;
        } else if (surface === "center" && variant === "seed") {
          const seedGrain =
            Math.sin(u * 13.2 + Math.sin(v * 4.8)) *
            Math.sin(v * 15.4 - u * 2.7);
          value = 218 + seedGrain * 8 + noise * 6;
        } else if (surface === "center" && variant === "pit") {
          const wallGrain =
            Math.sin(u * 10.4 + Math.sin(v * 6.1)) *
            Math.sin(v * 12.6 - u * 3.2);
          value = 204 + wallGrain * 10 + noise * 7;
        } else if (surface === "center" && variant === "receptacle") {
          const bodyGrain =
            Math.sin(u * 7.2 + Math.sin(v * 3.8)) * Math.sin(v * 8.8 - u * 2.1);
          value = 196 + bodyGrain * 7 + noise * 6;
        } else if (surface === "center" && variant === "disk") {
          const crownGrain =
            Math.sin(u * 11.6 + Math.sin(v * 4.4)) *
            Math.sin(v * 13.2 - u * 2.6);
          const crownEnvelope =
            THREE.MathUtils.smoothstep(v, 0.04, 0.2) *
            (1 - THREE.MathUtils.smoothstep(v, 0.82, 0.98));
          value = 204 + crownGrain * 9 * crownEnvelope + noise * 7;
        } else if (surface === "leaf") {
          const edgeTaper = THREE.MathUtils.smoothstep(margin, 0, 0.12);
          const parallelLeafVeins = [0.2, 0.35, 0.5, 0.65, 0.8].reduce(
            (sum, center) => sum + Math.exp(-Math.pow((u - center) / 0.024, 2)),
            0,
          );
          value =
            variant === "peltate"
              ? 86 +
                edgeTaper * 62 +
                getPeltateVascularField(u, v) * 92 +
                noise * 8
              : variant === "coarse"
                ? 94 +
                  edgeTaper * 72 +
                  centerVein * 76 +
                  sideVeins * 34 +
                  noise * 9
                : variant === "veined"
                  ? 92 +
                    edgeTaper * 72 +
                    centerVein * 90 +
                    sideVeins * 36 +
                    noise * 8
                  : variant === "glaucous"
                    ? 88 + edgeTaper * 58 + centerVein * 58 + noise * 8
                    : variant === "parallel"
                      ? 84 + edgeTaper * 68 + parallelLeafVeins * 62 + noise * 7
                      : variant === "sepal"
                        ? 78 +
                          edgeTaper * 64 +
                          centerVein * 88 +
                          parallelLeafVeins * 26 +
                          (1 - THREE.MathUtils.smoothstep(v, 0.72, 1)) * 18
                        : 92 +
                          edgeTaper * 72 +
                          centerVein * 82 +
                          sideVeins * 28;
        } else {
          value = 210 + noise * 12;
        }
        if (map === "backscatter") {
          value = surface === "petal" ? 245 - value * 0.72 : 0;
        }
      } else if (map === "moisture") {
        const broadPatches =
          Math.sin(u * 9.7 + Math.sin(v * 7.1)) * Math.sin(v * 12.3 - u * 4.2);
        const droplets = Math.pow(proceduralNoise(x, y, 0.37), 20);
        const parallelHydration =
          Math.sin(u * Math.PI * 10 + v * 1.8) *
          (0.45 + 0.55 * THREE.MathUtils.smoothstep(v, 0.08, 0.28));
        value =
          surface === "petal" && variant === "lotus"
            ? 92 + broadPatches * 26 + droplets * 74 + noise * 8
            : surface === "petal" && variant === "papery"
              ? 88 +
                (broadPatches * 22 + droplets * 42) *
                  (THREE.MathUtils.smoothstep(v, 0.03, 0.14) *
                    (1 - THREE.MathUtils.smoothstep(v, 0.86, 1))) +
                noise * 7
              : surface === "petal" && variant === "veined"
                ? 86 +
                  (broadPatches * 30 + droplets * 62) *
                    (THREE.MathUtils.smoothstep(v, 0.03, 0.14) *
                      (1 - THREE.MathUtils.smoothstep(v, 0.86, 1))) +
                  getFleshyPetalCuticleVariation(u, v) * 8 +
                  noise * 8
                : surface === "petal" && variant === "parallel"
                  ? 84 +
                    (broadPatches * 24 + droplets * 52) *
                      (THREE.MathUtils.smoothstep(v, 0.03, 0.14) *
                        (1 - THREE.MathUtils.smoothstep(v, 0.86, 1))) +
                    parallelHydration * 10 +
                    noise * 7
                  : surface === "petal" && variant === "ligulate"
                    ? 86 +
                      (broadPatches * 18 + droplets * 34) *
                        (THREE.MathUtils.smoothstep(v, 0.03, 0.14) *
                          (1 - THREE.MathUtils.smoothstep(v, 0.86, 1))) +
                      noise * 7
                    : surface === "leaf" && variant === "lotus"
                      ? 96 +
                        (broadPatches * 20 + droplets * 104) *
                          (THREE.MathUtils.smoothstep(v, 0.03, 0.14) *
                            (1 - THREE.MathUtils.smoothstep(v, 0.86, 1))) +
                        noise * 8
                      : surface === "leaf" && variant === "coarse"
                        ? 90 +
                          (broadPatches * 24 + droplets * 64) *
                            (THREE.MathUtils.smoothstep(v, 0.03, 0.14) *
                              (1 - THREE.MathUtils.smoothstep(v, 0.86, 1))) +
                          noise * 8
                        : surface === "leaf" && variant === "glaucous"
                          ? 94 +
                            (broadPatches * 18 + droplets * 38) *
                              (THREE.MathUtils.smoothstep(v, 0.03, 0.14) *
                                (1 - THREE.MathUtils.smoothstep(v, 0.86, 1))) +
                            noise * 7
                          : surface === "leaf" && variant === "velamen"
                            ? 90 +
                              (broadPatches * 18 + droplets * 46) *
                                (THREE.MathUtils.smoothstep(v, 0.03, 0.14) *
                                  (1 -
                                    THREE.MathUtils.smoothstep(v, 0.86, 1))) +
                              noise * 7
                            : surface === "center" && variant === "disk"
                              ? 104 +
                                broadPatches * 16 +
                                droplets * 24 +
                                noise * 6
                              : surface === "leaf" && variant === "veined"
                                ? 88 +
                                  (broadPatches * 26 + droplets * 58) *
                                    (THREE.MathUtils.smoothstep(v, 0.03, 0.14) *
                                      (1 -
                                        THREE.MathUtils.smoothstep(
                                          v,
                                          0.86,
                                          1,
                                        ))) +
                                  noise * 8
                                : 78 +
                                  broadPatches * 38 +
                                  droplets * 150 +
                                  noise * 12;
      } else if (surface === "petal") {
        // Silky veins reflect more cleanly while cell-rich margins scatter light.
        if (variant === "papery") {
          const creaseSlope = getPaperyMicroNormalSlope(u, v);
          const creaseEnergy = THREE.MathUtils.clamp(
            Math.hypot(creaseSlope.x, creaseSlope.y) / 0.34,
            0,
            1,
          );
          const vascular = getPaperyVascularField(u, v);
          const membrane = getPaperyMembraneVariation(u, v);
          value =
            176 +
            creaseEnergy * 48 +
            membrane * 14 -
            centerVein * 24 -
            vascular * 22 +
            noise * 12;
        } else if (variant === "parallel") {
          const parallelVeins = [0.18, 0.34, 0.5, 0.66, 0.82].reduce(
            (sum, center) => sum + Math.exp(-Math.pow((u - center) / 0.026, 2)),
            0,
          );
          const axialGrain =
            Math.sin(u * Math.PI * 26 + Math.sin(v * 8.2) * 0.7) * 5;
          value = 198 - parallelVeins * 22 + axialGrain + noise * 8;
        } else if (variant === "ligulate") {
          const sideVeins =
            Math.exp(-Math.pow((u - 0.28) / 0.052, 2)) +
            Math.exp(-Math.pow((u - 0.72) / 0.052, 2));
          const distalTipWeathering =
            THREE.MathUtils.smoothstep(v, 0.74, 0.9) *
            (1 - THREE.MathUtils.smoothstep(v, 0.9, 1));
          const lateralMarginWeathering =
            THREE.MathUtils.smoothstep(margin, 0, 0.16) *
            (1 - THREE.MathUtils.smoothstep(v, 0.82, 0.98));
          const rayGrain =
            Math.sin(v * Math.PI * 18 + u * 4.2) * 4 +
            Math.sin(v * Math.PI * 37 - u * 2.1) * 2;
          value =
            194 -
            centerVein * 26 -
            sideVeins * 18 +
            distalTipWeathering * 7 +
            lateralMarginWeathering * 4 +
            rayGrain +
            noise * 8;
        } else if (variant === "veined") {
          const vascular = getFleshyPetalVascularField(u, v);
          const cuticleVariation = getFleshyPetalCuticleVariation(u, v);
          const laminaVariation = getFleshyPetalLaminaVariation(u, v);
          value =
            186 -
            centerVein * 30 -
            vascular * 20 +
            cuticleVariation * 22 +
            laminaVariation * 13 +
            Math.sin(u * 8.8 + Math.sin(v * 5.1)) * 3.5 +
            noise * 8;
        } else if (variant === "orchid") {
          const vascular = getOrchidTepalVascularField(u, v);
          const satinBreakup =
            Math.sin(u * 9.2 + Math.sin(v * 4.1)) * Math.sin(v * 8.4 - u * 2.6);
          value = 202 - vascular * 24 + satinBreakup * 7 + noise * 8;
        } else if (variant === "orchidLip") {
          const callus = getLabellumCallusField(u * 2 - 1, v, 6180);
          const granularTissue =
            Math.sin(u * 18.4 + Math.sin(v * 6.2)) *
            Math.sin(v * 21.1 - u * 3.7);
          value =
            176 -
            THREE.MathUtils.smoothstep(callus, 0.04, 0.78) * 28 +
            granularTissue * 8 +
            noise * 10;
        } else if (variant === "lotus") {
          const hydratedMargin = 1 - THREE.MathUtils.smoothstep(margin, 0, 0.2);
          const broadHydration =
            Math.sin(u * 8.6 + Math.sin(v * 5.8)) * Math.sin(v * 9.1 - u * 2.1);
          value =
            188 -
            hydratedMargin * 14 -
            centerVein * 18 +
            broadHydration * 7 +
            noise * 7;
        } else {
          value = 190 - centerVein * 42 - sideVeins * 18 + noise * 18;
        }
      } else if (surface === "leaf") {
        const parallelLeafVeins = [0.2, 0.35, 0.5, 0.65, 0.8].reduce(
          (sum, center) => sum + Math.exp(-Math.pow((u - center) / 0.024, 2)),
          0,
        );
        value =
          variant === "peltate"
            ? 188 - getPeltateVascularField(u, v) * 24 + noise * 14
            : variant === "coarse"
              ? 202 - centerVein * 24 - sideVeins * 18 + noise * 12
              : variant === "veined"
                ? 198 -
                  centerVein * 30 -
                  sideVeins * 24 +
                  Math.sin(u * 7.8 + Math.sin(v * 4.1)) * 4 +
                  noise * 10
                : variant === "glaucous"
                  ? 224 -
                    centerVein * 18 +
                    Math.sin(v * 13 - u * 4) * 5 +
                    noise * 7
                  : variant === "parallel"
                    ? 196 - parallelLeafVeins * 22 + noise * 14
                    : variant === "sepal"
                      ? 212 -
                        centerVein * 22 -
                        parallelLeafVeins * 12 +
                        noise * 12
                      : variant === "involucre"
                        ? 224 -
                          centerVein * 16 +
                          Math.abs(Math.sin(u * Math.PI * 10 + v)) * 7 +
                          noise * 9
                        : 205 - centerVein * 30 - sideVeins * 22 + noise * 24;
      } else if (surface === "stem") {
        value =
          variant === "woody"
            ? 226 +
              Math.abs(Math.sin(u * Math.PI * 12)) * 14 +
              Math.pow(Math.abs(Math.sin(v * 47 + u * 9)), 28) * 16 +
              noise * 10
            : variant === "coarse"
              ? 218 +
                Math.abs(Math.sin(u * Math.PI * 15 + v * 2.4)) * 13 +
                Math.pow(Math.abs(Math.sin(u * 19 + v * 37)), 30) * 17 +
                noise * 12
              : variant === "aquatic"
                ? 194 +
                  Math.abs(Math.sin(u * Math.PI * 9 + v * 0.7)) * 7 +
                  Math.sin(v * 13 - u * 4) * 4 +
                  noise * 6
                : variant === "glaucous"
                  ? 226 +
                    Math.abs(Math.sin(u * Math.PI * 8 + v * 0.9)) * 5 +
                    Math.sin(u * 17 + v * 23) * Math.sin(v * 11 - u * 13) * 6 +
                    noise * 5
                  : variant === "monocot"
                    ? 211 +
                      Math.abs(Math.sin(u * Math.PI * 11 + v * 0.5)) * 6 +
                      Math.cos(v * 17 - u * 3) * 3 +
                      noise * 5
                    : variant === "spike"
                      ? 204 +
                        Math.abs(Math.sin(u * Math.PI * 9 + v * 0.45)) * 5 +
                        Math.cos(v * 13 - u * 2.5) * 2 +
                        noise * 4
                      : variant === "velamen"
                        ? 232 +
                          Math.abs(Math.sin(u * Math.PI * 11 + v * 1.8)) * 9 +
                          Math.sin(v * 21 - u * 7) * 5 +
                          noise * 8
                        : variant === "calyx"
                          ? 208 +
                            Math.abs(Math.sin(u * Math.PI * 12 + v * 1.8)) * 9 +
                            Math.cos(v * 21 - u * 3.5) * 5 +
                            noise * 7
                          : 214 + Math.sin(u * Math.PI * 18) * 15 + noise * 18;
      } else {
        value =
          variant === "anther"
            ? 218 +
              Math.abs(Math.sin(u * Math.PI * 18 + v * 1.7)) * 12 +
              noise * 8
            : 225 - proceduralNoise(x, y, 2.4) * 48;
      }

      const channel = THREE.MathUtils.clamp(Math.round(value), 0, 255);
      const offset = (y * size + x) * 4;
      data[offset] = channel;
      data[offset + 1] = channel;
      data[offset + 2] = channel;
      data[offset + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  configureBotanicalUvSampling(texture, surface);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  materialTextures.set(key, texture);
  return texture;
}

export function getBotanicalTexture(
  surface: BotanicalSurface,
  resolution = 128,
  variant: BotanicalMaterialVariant = "default",
) {
  const size = THREE.MathUtils.clamp(Math.round(resolution), 32, 512);
  const key = `${surface}:${size}:${variant}`;
  const cached = textures.get(key);
  if (cached) return cached;

  const data = new Uint8Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / (size - 1);
      const v = y / (size - 1);
      const noise = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const fineNoise = Math.sin(x * 43.17 + y * 19.61) * 15731.743;
      const grain =
        (noise - Math.floor(noise) - 0.5) * 13 +
        (fineNoise - Math.floor(fineNoise) - 0.5) * 6;
      let value = 128 + grain;

      if (surface === "petal") {
        if (variant === "ligulate") {
          const bladeEnvelope =
            THREE.MathUtils.smoothstep(v, 0.035, 0.16) *
            (1 - THREE.MathUtils.smoothstep(v, 0.86, 0.99));
          const centerVein = Math.exp(-Math.pow((u - 0.5) / 0.042, 2)) * 34;
          const sideVeins =
            (Math.exp(-Math.pow((u - 0.28) / 0.052, 2)) +
              Math.exp(-Math.pow((u - 0.72) / 0.052, 2))) *
            22;
          const broadCells =
            (proceduralNoise(u * 29 + 0.37, v * 41 - 0.19, 0.43) - 0.5) * 12;
          const fineCells =
            (proceduralNoise(u * 83 - 0.23, v * 97 + 0.31, 0.71) - 0.5) * 5;
          value +=
            (centerVein + sideVeins + broadCells + fineCells) * bladeEnvelope;
        } else {
          const centerVein = Math.exp(-Math.pow((u - 0.5) / 0.035, 2)) * 48;
          const radiatingVeins =
            Math.pow(Math.abs(Math.sin(((u - 0.5) * 34) / (0.35 + v))), 22) *
            13 *
            v;
          const fineVeins =
            Math.pow(Math.abs(Math.sin((u - 0.5) * 48 + v * 8)), 18) * 18;
          const cells = Math.sin(u * 145 + Math.sin(v * 37)) * 2.5;
          value += centerVein + fineVeins * v + radiatingVeins + cells;
        }
      } else if (surface === "leaf") {
        const centerVein = Math.exp(-Math.pow((u - 0.5) / 0.028, 2)) * 62;
        if (variant === "coarse") {
          const broadCells =
            (proceduralNoise(u * 23 + 0.41, v * 29 - 0.17, 0.37) - 0.5) * 14;
          const fineCells =
            (proceduralNoise(u * 71 - 0.23, v * 79 + 0.31, 0.69) - 0.5) * 6;
          const bladeEnvelope = Math.pow(Math.sin(v * Math.PI), 0.42);
          value += centerVein * 0.72 + (broadCells + fineCells) * bladeEnvelope;
        } else {
          const sideVeins =
            Math.pow(Math.abs(Math.sin(v * 42 + Math.abs(u - 0.5) * 16)), 24) *
            34;
          const reticulation = Math.sin(u * 70 + v * 46) * 3;
          const chlorophyllMottle =
            Math.sin(u * 11 + Math.sin(v * 8)) * 5 +
            Math.sin(v * 17 + u * 6) * 3;
          const stomata =
            Math.pow(Math.abs(Math.sin(u * 96) * Math.sin(v * 84)), 24) * 10;
          value +=
            centerVein + sideVeins + reticulation + chlorophyllMottle + stomata;
        }
      } else if (surface === "stem") {
        const lenticel =
          Math.pow(Math.abs(Math.sin(u * 37 + v * 11)), 30) *
          Math.pow(Math.abs(Math.sin(v * 61)), 22) *
          22;
        value +=
          Math.sin(u * Math.PI * 18) * 12 +
          Math.sin(v * Math.PI * 5) * 4 +
          Math.pow(Math.abs(Math.sin(u * Math.PI * 7)), 12) * 12 +
          lenticel;
      } else {
        value +=
          Math.sin(u * Math.PI * 28) * Math.sin(v * Math.PI * 24) * 14 +
          Math.pow(Math.abs(Math.sin(u * 53 + v * 47)), 16) * 20;
      }

      data[y * size + x] = THREE.MathUtils.clamp(Math.round(value), 0, 255);
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
  configureBotanicalUvSampling(texture, surface);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  textures.set(key, texture);
  return texture;
}
