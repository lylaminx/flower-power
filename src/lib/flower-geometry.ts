import * as THREE from "three";
import type {
  BloomArchitecture,
  InflorescenceArchitecture,
  LeafShape,
  PetalArrangement,
  PetalOutline,
  PetalRole,
} from "./flower-species";

export function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

const goldenAngle = Math.PI * (3 - Math.sqrt(5));
const geometryCache = new Map<string, THREE.BufferGeometry>();
const maxCachedGeometries = 96;

export function createInflorescencePlacements({
  architecture,
  count,
  spacing,
  spread,
  seed,
}: {
  architecture: Exclude<InflorescenceArchitecture, "solitary">;
  count: number;
  spacing: number;
  spread: number;
  seed: number;
}) {
  const safeCount = Math.max(1, Math.min(12, Math.round(count)));

  return Array.from({ length: safeCount }, (_, index) => {
    const random = seededRandom(seed + index * 347);
    const secondary = seededRandom(seed + index * 761);
    if (architecture === "spike") {
      const side = index % 2 === 0 ? 1 : -1;
      const maturity =
        safeCount <= 1
          ? 1
          : THREE.MathUtils.smoothstep(index, 0, safeCount - 1);
      return {
        position: [
          side * spread * THREE.MathUtils.lerp(0.58, 0.9, random),
          -index * spacing,
          (secondary - 0.5) * spread * 0.42,
        ] as [number, number, number],
        rotation: [
          0.72 + (secondary - 0.5) * 0.12,
          side * THREE.MathUtils.lerp(0.42, 0.7, random),
          side * -0.42,
        ] as [number, number, number],
        scale: THREE.MathUtils.lerp(0.68, 0.96, index / safeCount),
        maturity,
        seedOffset: (index + 1) * 10_003,
      };
    }

    const progress = (index + 0.5) / safeCount;
    const angle = index * goldenAngle + seededRandom(seed) * Math.PI * 2;
    const radius = Math.sqrt(progress) * spread;
    return {
      position: [
        Math.cos(angle) * radius,
        -Math.abs(Math.sin(angle)) * spacing - progress * spacing * 0.4,
        Math.sin(angle) * radius * 0.62,
      ] as [number, number, number],
      rotation: [
        0.72 + (secondary - 0.5) * 0.2,
        -angle + Math.PI * 0.5,
        (random - 0.5) * 0.32,
      ] as [number, number, number],
      scale: THREE.MathUtils.lerp(0.62, 0.78, random),
      maturity: THREE.MathUtils.lerp(0.74, 1, secondary),
      seedOffset: (index + 1) * 10_003,
    };
  });
}

export function createPetalPlacement({
  index,
  count,
  layerIndex,
  layerCount,
  layerOffset,
  seed,
  variation,
  arrangement = "radial",
  receptacleRadius = 0,
  innerCompression = 0,
  overlapJitter = 0.2,
  role = "petal",
}: {
  index: number;
  count: number;
  layerIndex: number;
  layerCount: number;
  layerOffset: number;
  seed: number;
  variation: number;
  arrangement?: PetalArrangement;
  receptacleRadius?: number;
  innerCompression?: number;
  overlapJitter?: number;
  role?: PetalRole;
}) {
  const safeCount = Math.max(1, count);
  const spacing = (Math.PI * 2) / safeCount;
  const random = seededRandom(seed + index * 193 + layerIndex * 977);
  const secondary = seededRandom(seed + index * 389 + layerIndex * 571);
  const layerDepth = layerCount <= 1 ? 0 : layerIndex / (layerCount - 1);
  const bilateralAngles: Record<PetalRole, readonly number[]> = {
    sepal: [-Math.PI * 0.68, Math.PI, Math.PI * 0.68],
    petal: [-Math.PI * 0.5, Math.PI * 0.5],
    lip: [0],
    ray: [0],
  };
  const roleAngles = bilateralAngles[role];
  const baseAngle =
    arrangement === "phyllotactic"
      ? index * goldenAngle + layerIndex * goldenAngle * 0.618
      : arrangement === "bilateral"
        ? roleAngles[index % roleAngles.length]
        : (index + layerOffset) * spacing;
  const angularJitter =
    (random - 0.5) *
    spacing *
    overlapJitter *
    THREE.MathUtils.clamp(0.45 + variation, 0.45, 1) *
    (arrangement === "bilateral" ? 0.22 : 1);
  const radialOffset =
    receptacleRadius *
    (1 - layerDepth * innerCompression) *
    THREE.MathUtils.lerp(0.94, 1.06, secondary);

  return {
    angle: baseAngle + angularJitter,
    radialOffset,
    roll: (secondary - 0.5) * variation * 0.16,
    scale:
      1 -
      layerDepth * innerCompression * 0.08 +
      (random - 0.5) * variation * 0.025,
  };
}

function insertGeometryIntoCache(key: string, geometry: THREE.BufferGeometry) {
  const existing = geometryCache.get(key);
  if (existing && existing !== geometry) {
    geometryCache.delete(key);
    existing.dispose();
  }
  geometryCache.set(key, geometry);
  if (geometryCache.size > maxCachedGeometries) {
    const oldestKey = geometryCache.keys().next().value as string | undefined;
    if (oldestKey) {
      const oldest = geometryCache.get(oldestKey);
      geometryCache.delete(oldestKey);
      oldest?.dispose();
    }
  }
}

export function primeGeometryCache(
  key: string,
  geometry: THREE.BufferGeometry,
) {
  insertGeometryIntoCache(key, geometry);
}

function getCachedGeometry(key: string, build: () => THREE.BufferGeometry) {
  const cached = geometryCache.get(key);
  if (cached) {
    geometryCache.delete(key);
    geometryCache.set(key, cached);
    return cached;
  }
  const geometry = build();
  insertGeometryIntoCache(key, geometry);
  return geometry;
}

export function getPetalOutlineWidth(
  t: number,
  profile: number,
  outline: PetalOutline = "elliptic",
) {
  const clampedT = THREE.MathUtils.clamp(t, 0, 1);
  const ellipse = Math.pow(Math.sin(Math.PI * clampedT), profile);
  const towardTip = THREE.MathUtils.smoothstep(clampedT, 0.08, 0.78);

  switch (outline) {
    case "labellum": {
      // Rounded lateral shoulders hold their width briefly before easing into
      // the waist; a single Gaussian produced a broad triangular flare.
      const lateralLobes =
        THREE.MathUtils.smoothstep(clampedT, 0.035, 0.2) *
        (1 - THREE.MathUtils.smoothstep(clampedT, 0.32, 0.54));
      const medianLobe =
        THREE.MathUtils.smoothstep(clampedT, 0.48, 0.62) *
        Math.pow(
          Math.sin(
            Math.PI * THREE.MathUtils.clamp((clampedT - 0.48) / 0.52, 0, 1),
          ),
          0.72,
        );
      const attachedThroat =
        0.24 * (1 - THREE.MathUtils.smoothstep(clampedT, 0.4, 0.64));
      return Math.max(
        0,
        lateralLobes * 0.69 + medianLobe * 0.42 + attachedThroat * 0.5,
      );
    }
    case "obovate":
      return ellipse * THREE.MathUtils.lerp(0.58, 1.18, towardTip);
    case "rugosa": {
      const obovate = ellipse * THREE.MathUtils.lerp(0.58, 1.18, towardTip);
      const broadDistalMargin =
        THREE.MathUtils.smoothstep(clampedT, 0.72, 0.98) * 0.88;
      return Math.max(obovate, broadDistalMargin);
    }
    case "fan":
      return ellipse * THREE.MathUtils.lerp(0.42, 1.28, towardTip);
    case "lanceolate": {
      const blade =
        Math.pow(Math.sin(Math.PI * clampedT), 0.92) *
        (0.88 + Math.sin(Math.PI * clampedT) * 0.12);
      // A living Lily tepal ends in a minute rolled point, not a row of
      // vertices collapsed onto one mathematical coordinate.
      const livingTip = THREE.MathUtils.smoothstep(clampedT, 0.88, 1) * 0.024;
      return Math.max(blade, livingTip);
    }
    case "spatulate":
      return ellipse * THREE.MathUtils.lerp(0.34, 1.22, towardTip * towardTip);
    case "ray": {
      const basalExpansion = THREE.MathUtils.smoothstep(clampedT, 0.015, 0.2);
      const distalTaper = THREE.MathUtils.lerp(
        1,
        0.74,
        THREE.MathUtils.smoothstep(clampedT, 0.72, 1),
      );
      return basalExpansion * distalTaper;
    }
    default:
      return ellipse;
  }
}

export function getPetalLateralCupEnvelope(
  t: number,
  outline: PetalOutline = "elliptic",
) {
  const clampedT = THREE.MathUtils.clamp(t, 0, 1);
  if (outline !== "labellum") return Math.sin(Math.PI * clampedT);

  // Keep the attached throat cupped, relax the broad lateral shoulders so
  // they face the viewer, then restore curvature through the median lobe.
  const shoulderRelaxation =
    1 -
    0.58 *
      THREE.MathUtils.smoothstep(clampedT, 0.1, 0.24) *
      (1 - THREE.MathUtils.smoothstep(clampedT, 0.42, 0.58));
  return Math.sin(Math.PI * clampedT) * shoulderRelaxation;
}

export function getLigulateApexRecession(
  across: number,
  t: number,
  notch: number,
) {
  const distal = Math.pow(
    THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(t, 0, 1), 0.76, 1),
    2,
  );
  const leftSinus = Math.exp(-Math.pow((across + 0.31) / 0.13, 2));
  const rightSinus = Math.exp(-Math.pow((across - 0.31) / 0.13, 2));
  return notch * (leftSinus + rightSinus) * distal;
}

export function getLabellumCallusField(across: number, t: number, seed = 0) {
  const longitudinal = Math.exp(-Math.pow((t - 0.4) / 0.072, 2));
  const leftLobe = Math.exp(-Math.pow((across + 0.16) / 0.15, 2));
  const rightLobe = Math.exp(-Math.pow((across - 0.16) / 0.15, 2));
  const pairedCallus = longitudinal * Math.max(leftLobe, rightLobe);
  const medianKeel =
    Math.exp(-Math.pow(across / 0.065, 2)) *
    THREE.MathUtils.smoothstep(t, 0.39, 0.44) *
    (1 - THREE.MathUtils.smoothstep(t, 0.55, 0.63)) *
    0.62;
  const irregularity =
    0.86 +
    0.14 * Math.sin(across * 23 + t * 41 + seededRandom(seed + 907) * 6.2);
  return THREE.MathUtils.clamp(
    Math.max(pairedCallus, medianKeel) * irregularity,
    0,
    1,
  );
}

export function getPaperyPetalVeinStrength(across: number, t: number) {
  const clampedT = THREE.MathUtils.clamp(t, 0, 1);
  const envelope = Math.pow(Math.sin(Math.PI * clampedT), 0.55);
  const center = Math.exp(-Math.pow(across / 0.055, 2));
  const branchCenter = 0.22 + Math.sin(clampedT * 8.4) * 0.055;
  const branches =
    Math.exp(-Math.pow((Math.abs(across) - branchCenter) / 0.045, 2)) *
    THREE.MathUtils.smoothstep(clampedT, 0.08, 0.26) *
    (1 - THREE.MathUtils.smoothstep(clampedT, 0.78, 0.98));
  return THREE.MathUtils.clamp(
    (center * 0.72 + branches * 0.58) * envelope,
    0,
    1,
  );
}

export function getPaperyPetalCrinkle(
  across: number,
  t: number,
  seed = 0,
  phase = 0,
) {
  const clampedT = THREE.MathUtils.clamp(t, 0, 1);
  const envelope = Math.pow(Math.sin(Math.PI * clampedT), 0.62);
  const frequencyDrift = seededRandom(seed + 1201);
  const lateralDrift = seededRandom(seed + 1877);
  const creasePosition = 0.28 + seededRandom(seed + 2089) * 0.42;
  const amplitudeDrift =
    0.68 +
    Math.sin(
      clampedT * Math.PI * (2.8 + frequencyDrift * 1.7) +
        across * 2.9 +
        phase * 0.37,
    ) *
      0.24;
  const warpedT =
    clampedT +
    Math.sin(across * (4.6 + lateralDrift * 2.8) + phase) * 0.018 +
    Math.sin(clampedT * 13.2 + across * 3.4 + phase * 0.6) * 0.012;
  const primary =
    Math.sin(
      warpedT * Math.PI * (10.8 + frequencyDrift * 4.8) +
        across * (5.1 + lateralDrift * 4.6) +
        phase,
    ) * 0.0165;
  const secondary =
    Math.sin(
      warpedT * Math.PI * (18.2 + lateralDrift * 5.4) -
        across * (9.4 + frequencyDrift * 5.8) -
        phase * 0.63,
    ) * 0.0075;
  const localCrossCrease =
    Math.exp(
      -Math.pow((clampedT - creasePosition - across * 0.035) / 0.055, 2),
    ) *
    Math.sin(across * Math.PI * (2.2 + lateralDrift * 1.8) + phase * 0.45) *
    0.012;
  const distalEnvelope =
    THREE.MathUtils.smoothstep(clampedT, 0.34, 0.68) *
    (1 - THREE.MathUtils.smoothstep(clampedT, 0.92, 1));
  const lateralMicroPleat =
    Math.sin(
      across * Math.PI * (7.2 + lateralDrift * 2.4) +
        clampedT * (8.6 + frequencyDrift * 3.2) +
        phase * 0.73,
    ) *
    Math.sin(clampedT * Math.PI * 5.7 - across * 2.1) *
    distalEnvelope *
    0.0115;
  return (
    envelope * ((primary + secondary) * amplitudeDrift + localCrossCrease) +
    lateralMicroPleat
  );
}

export function getPaperyPetalPigmentVariation(
  across: number,
  t: number,
  seed = 0,
) {
  const clampedAcross = THREE.MathUtils.clamp(across, -1, 1);
  const clampedT = THREE.MathUtils.clamp(t, 0, 1);
  const envelope =
    THREE.MathUtils.smoothstep(clampedT, 0.035, 0.16) *
    (1 - THREE.MathUtils.smoothstep(clampedT, 0.9, 1));
  const phase = seededRandom(seed + 2_413) * Math.PI * 2;
  const broad = Math.sin(clampedAcross * 3.4 + clampedT * 5.2 + phase);
  const crossing = Math.sin(
    clampedAcross * 7.1 - clampedT * 8.3 + phase * 0.63,
  );
  const diffusePatch = Math.sin(
    clampedAcross * 1.8 + clampedT * 3.1 - phase * 0.41,
  );
  return envelope * (broad * 0.52 + crossing * 0.22 + diffusePatch * 0.26);
}

export function getRayLongitudinalVeinStrength(across: number, t: number) {
  const clampedAcross = THREE.MathUtils.clamp(across, -1, 1);
  const clampedT = THREE.MathUtils.clamp(t, 0, 1);
  const vein = (center: number, width: number, strength: number) =>
    Math.exp(-Math.pow((clampedAcross - center) / width, 2)) * strength;
  const longitudinalField =
    vein(0, 0.055, 1) + vein(-0.42, 0.07, 0.62) + vein(0.42, 0.07, 0.62);
  const basalFade = THREE.MathUtils.smoothstep(clampedT, 0.04, 0.2);
  const distalFade =
    1 - THREE.MathUtils.smoothstep(clampedT, 0.82, 0.995) * 0.45;
  return longitudinalField * basalFade * distalFade;
}

export function getPetalGeometryCacheKey({
  length,
  width,
  curl,
  lift,
  baseColor,
  tipColor,
  notch,
  profile,
  edgeRuffle = 0,
  baseDarkening = 0.85,
  waviness = 0,
  wavePhase = 0,
  thicknessScale = 1,
  fold = 0.5,
  pleatStrength = 0,
  twist = 0.5,
  baseWidth = 1,
  spots = 0,
  guideStrength = 0,
  markingSeed = 0,
  asymmetry = 0,
  edgeWear = 0,
  edgeIrregularity = 0,
  outline = "elliptic",
  longitudinalCurve = 0,
  tipReflex = 0,
  lateralCup = 1,
  tissueVariant = "default",
  lengthSegments = 18,
  widthSegments = 8,
}: {
  length: number;
  width: number;
  curl: number;
  lift: number;
  baseColor: string;
  tipColor: string;
  notch: number;
  profile: number;
  edgeRuffle?: number;
  baseDarkening?: number;
  waviness?: number;
  wavePhase?: number;
  thicknessScale?: number;
  fold?: number;
  pleatStrength?: number;
  twist?: number;
  baseWidth?: number;
  spots?: number;
  guideStrength?: number;
  markingSeed?: number;
  asymmetry?: number;
  edgeWear?: number;
  edgeIrregularity?: number;
  outline?: PetalOutline;
  longitudinalCurve?: number;
  tipReflex?: number;
  lateralCup?: number;
  tissueVariant?: "default" | "papery" | "veined" | "parallel" | "ligulate";
  lengthSegments?: number;
  widthSegments?: number;
}) {
  return [
    "petal",
    length,
    width,
    curl,
    lift,
    baseColor,
    tipColor,
    notch,
    profile,
    edgeRuffle,
    baseDarkening,
    waviness,
    wavePhase,
    thicknessScale,
    fold,
    pleatStrength,
    twist,
    baseWidth,
    spots,
    guideStrength,
    markingSeed,
    asymmetry,
    edgeWear,
    edgeIrregularity,
    outline,
    longitudinalCurve,
    tipReflex,
    lateralCup,
    tissueVariant,
    lengthSegments,
    widthSegments,
  ].join("|");
}

export function createPetalGeometry({
  length,
  width,
  curl,
  lift,
  baseColor,
  tipColor,
  notch,
  profile,
  edgeRuffle = 0,
  baseDarkening = 0.85,
  waviness = 0,
  wavePhase = 0,
  thicknessScale = 1,
  fold = 0.5,
  pleatStrength = 0,
  twist = 0.5,
  baseWidth = 1,
  spots = 0,
  guideStrength = 0,
  markingSeed = 0,
  asymmetry = 0,
  edgeWear = 0,
  edgeIrregularity = 0,
  outline = "elliptic",
  longitudinalCurve = 0,
  tipReflex = 0,
  lateralCup = 1,
  tissueVariant = "default",
  lengthSegments = 18,
  widthSegments = 8,
}: {
  length: number;
  width: number;
  curl: number;
  lift: number;
  baseColor: string;
  tipColor: string;
  notch: number;
  profile: number;
  edgeRuffle?: number;
  baseDarkening?: number;
  waviness?: number;
  wavePhase?: number;
  thicknessScale?: number;
  fold?: number;
  pleatStrength?: number;
  twist?: number;
  baseWidth?: number;
  spots?: number;
  guideStrength?: number;
  markingSeed?: number;
  asymmetry?: number;
  edgeWear?: number;
  edgeIrregularity?: number;
  outline?: PetalOutline;
  longitudinalCurve?: number;
  tipReflex?: number;
  lateralCup?: number;
  tissueVariant?: "default" | "papery" | "veined" | "parallel" | "ligulate";
  lengthSegments?: number;
  widthSegments?: number;
}) {
  const cacheKey = getPetalGeometryCacheKey({
    length,
    width,
    curl,
    lift,
    baseColor,
    tipColor,
    notch,
    profile,
    edgeRuffle,
    baseDarkening,
    waviness,
    wavePhase,
    thicknessScale,
    fold,
    pleatStrength,
    twist,
    baseWidth,
    spots,
    guideStrength,
    markingSeed,
    asymmetry,
    edgeWear,
    edgeIrregularity,
    outline,
    longitudinalCurve,
    tipReflex,
    lateralCup,
    tissueVariant,
    lengthSegments,
    widthSegments,
  });

  return getCachedGeometry(cacheKey, () => {
    const geometry = new THREE.BufferGeometry();
    const faceSize = (lengthSegments + 1) * (widthSegments + 1);
    const thickness = Math.max(0.004, width * 0.025 * thicknessScale);
    const positions: number[] = [];
    const colors: number[] = [];
    const uvs: number[] = [];
    const frontIndices: number[] = [];
    const backIndices: number[] = [];
    const edgeIndices: number[] = [];
    const from = new THREE.Color(baseColor).multiplyScalar(0.9);
    const to = new THREE.Color(tipColor);
    const leftEdgePhase = seededRandom(markingSeed + 4_091) * Math.PI * 2;
    const rightEdgePhase = seededRandom(markingSeed + 8_191) * Math.PI * 2;
    const rugosaMarginPhase = seededRandom(markingSeed + 12_277) * Math.PI * 2;
    const warmPaperyTone = new THREE.Color("#e64832");

    for (let face = 0; face < 2; face += 1) {
      for (let row = 0; row <= lengthSegments; row += 1) {
        const t = row / lengthSegments;
        const roundedWidth = getPetalOutlineWidth(t, profile, outline);
        // Margin ruffles should read as broad organic undulation. Applying the
        // old 17/31-cycle signal directly to blade width produced a saw-tooth
        // silhouette even with dense tessellation. Fine crinkling belongs in
        // the out-of-plane edge displacement below.
        const marginUndulation =
          1 +
          edgeRuffle *
            (Math.sin(t * Math.PI * 3.7 + leftEdgePhase * 0.18) +
              Math.sin(t * Math.PI * 7.3 + rightEdgePhase * 0.14)) *
            0.06;
        const basalWidth = 0.045 * baseWidth * (1 - t) * (1 - t);
        const halfWidth =
          width * (basalWidth + roundedWidth * 0.5) * marginUndulation;

        for (let column = 0; column <= widthSegments; column += 1) {
          const across = (column / widthSegments) * 2 - 1;
          const edgeCup =
            across *
            across *
            0.085 *
            lateralCup *
            getPetalLateralCupEnvelope(t, outline);
          const centerFold =
            (1 - across * across) * 0.07 * fold * Math.sin(Math.PI * t);
          const pleatWave = Math.sin(across * Math.PI * 4.5 + wavePhase * 0.24);
          const longitudinalPleats =
            pleatStrength *
            pleatWave *
            (0.72 + Math.abs(pleatWave) * 0.28) *
            Math.pow(Math.sin(Math.PI * t), 0.72) *
            THREE.MathUtils.lerp(0.45, 1, t) *
            0.04;
          const paperCreases =
            pleatStrength *
            Math.sin(across * Math.PI * 5.5 - wavePhase * 0.17) *
            Math.sin(t * Math.PI * 5.8 + across * 1.8) *
            Math.pow(Math.sin(Math.PI * t), 0.58) *
            0.007;
          const finePaperCrinkles =
            pleatStrength > 1
              ? pleatStrength *
                getPaperyPetalCrinkle(across, t, markingSeed, wavePhase)
              : 0;
          const parallelTepalRelief =
            tissueVariant === "parallel"
              ? (Math.sin(across * Math.PI * 5.4 + Math.sin(t * 5.1) * 0.42) *
                  0.68 +
                  Math.sin(across * Math.PI * 11.2 - t * 4.3) * 0.32) *
                THREE.MathUtils.smoothstep(t, 0.045, 0.16) *
                (1 - THREE.MathUtils.smoothstep(t, 0.82, 1)) *
                (1 - THREE.MathUtils.smoothstep(Math.abs(across), 0.72, 1)) *
                width *
                0.0045
              : 0;
          const ligulateRelief =
            tissueVariant === "ligulate"
              ? (Math.sin(across * Math.PI * 3.15 + t * 0.7) * 0.7 +
                  Math.sin(across * Math.PI * 6.3 - t * 1.1) * 0.3) *
                THREE.MathUtils.smoothstep(t, 0.04, 0.18) *
                (1 - THREE.MathUtils.smoothstep(t, 0.84, 1)) *
                (1 - THREE.MathUtils.smoothstep(Math.abs(across), 0.78, 1)) *
                width *
                0.006
              : 0;
          const bladeTwist = across * t * t * twist * 0.11;
          const tipNotch =
            tissueVariant === "ligulate"
              ? getLigulateApexRecession(across, t, notch)
              : notch *
                Math.exp(-Math.pow(across / 0.27, 2)) *
                Math.pow(Math.max(0, (t - 0.76) / 0.24), 2);
          const rugosaShoulderInset =
            outline === "rugosa"
              ? Math.pow(Math.abs(across), 2.35) *
                THREE.MathUtils.smoothstep(t, 0.76, 1) *
                length *
                0.12
              : 0;
          const rugosaFreeEdgeDrift =
            outline === "rugosa"
              ? THREE.MathUtils.smoothstep(t, 0.72, 1) *
                length *
                (Math.sin(across * Math.PI * 1.35 + rugosaMarginPhase) * 0.018 +
                  Math.sin(across * Math.PI * 2.7 + rugosaMarginPhase * 0.61) *
                    0.007)
              : 0;
          const vein = Math.exp(-Math.pow(across / 0.12, 2));
          const rayVeins =
            outline === "ray" ? getRayLongitudinalVeinStrength(across, t) : 0;
          const paperyVeins =
            pleatStrength > 1 ? getPaperyPetalVeinStrength(across, t) : 0;
          const paperyPigment =
            pleatStrength > 1
              ? getPaperyPetalPigmentVariation(across, t, markingSeed)
              : 0;
          const fleshyVeins =
            tissueVariant === "veined"
              ? (() => {
                  const normalizedAcross = Math.abs(across) * 0.5;
                  const envelope =
                    THREE.MathUtils.smoothstep(t, 0.025, 0.16) *
                    (1 - THREE.MathUtils.smoothstep(t, 0.88, 1));
                  const inner = Math.exp(
                    -Math.pow(
                      (normalizedAcross - (0.035 + t * 0.2)) / 0.026,
                      2,
                    ),
                  );
                  const outer = Math.exp(
                    -Math.pow(
                      (normalizedAcross - (0.075 + t * 0.33)) / 0.032,
                      2,
                    ),
                  );
                  return envelope * (inner * 0.68 + outer * 0.42);
                })()
              : 0;
          const labellumCallus =
            outline === "labellum"
              ? getLabellumCallusField(across, t, markingSeed)
              : 0;
          const basalTone = THREE.MathUtils.lerp(
            baseDarkening,
            1,
            THREE.MathUtils.smoothstep(t, 0.05, 0.46),
          );
          const edgeWeight = Math.pow(Math.abs(across), 5);
          const edgePhase = across < 0 ? leftEdgePhase : rightEdgePhase;
          const naturalEdgeVariation =
            1 +
            edgeIrregularity *
              edgeWeight *
              Math.sin(Math.PI * t) *
              (Math.sin(t * Math.PI * 5.3 + edgePhase) * 0.026 +
                Math.sin(t * Math.PI * 11.7 + edgePhase * 0.63) * 0.011);
          const parallelMarginCharacter =
            tissueVariant === "parallel"
              ? 1 +
                edgeWeight *
                  THREE.MathUtils.smoothstep(t, 0.12, 0.3) *
                  (1 - THREE.MathUtils.smoothstep(t, 0.9, 1)) *
                  (Math.sin(t * Math.PI * 4.7 + edgePhase * 0.73) * 0.018 +
                    Math.sin(t * Math.PI * 9.1 - edgePhase * 0.41) * 0.007)
              : 1;
          const parallelTipDrift =
            tissueVariant === "parallel"
              ? THREE.MathUtils.smoothstep(t, 0.7, 1) *
                width *
                (Math.sin(leftEdgePhase * 0.61 + rightEdgePhase * 0.37) *
                  0.012 +
                  Math.sin(rightEdgePhase - leftEdgePhase * 0.28) * 0.005)
              : 0;
          const ligulateMarginDrift =
            tissueVariant === "ligulate"
              ? edgeWeight *
                Math.pow(Math.sin(Math.PI * t), 0.7) *
                width *
                (Math.sin(t * Math.PI * 4.1 + edgePhase) * 0.018 +
                  Math.sin(t * Math.PI * 8.3 - edgePhase * 0.47) * 0.006)
              : 0;
          const edgeRipple =
            edgeRuffle *
            edgeWeight *
            Math.sin(t * Math.PI * 43 + (across > 0 ? 1.7 : 0.2));
          const fleshyMarginTension =
            tissueVariant === "veined"
              ? edgeIrregularity *
                1.6 *
                edgeWeight *
                Math.pow(Math.sin(Math.PI * t), 0.72) *
                width *
                (Math.sin(t * Math.PI * 3.4 + edgePhase) * 0.024 +
                  Math.sin(t * Math.PI * 6.8 - edgePhase * 0.4) * 0.008)
              : 0;
          const wornEdge =
            edgeWear *
            Math.pow(Math.abs(across), 8) *
            Math.pow(Math.sin(Math.PI * t), 0.4) *
            (0.35 + seededRandom(markingSeed + row * 97 + column * 53) * 0.65);
          const waveEnvelope = Math.pow(t, 0.7) * Math.sin(Math.PI * t);
          const surfaceWave =
            waviness *
            waveEnvelope *
            (Math.sin(t * Math.PI * 5.2 + across * 2.4 + wavePhase) * 0.045 +
              Math.sin(t * Math.PI * 9.4 - across * 4.1 + wavePhase * 0.7) *
                0.018);
          const lateralWave =
            waviness *
            Math.pow(t, 1.25) *
            Math.sin(across * Math.PI * 1.5 + t * 7 + wavePhase) *
            0.035;
          const reflex =
            tipReflex *
            Math.pow(THREE.MathUtils.smoothstep(t, 0.34, 1), 1.35) *
            (0.84 + (1 - across * across) * 0.16);
          // A recurved tepal turns back along its length; dropping the entire
          // reflex value into Y made Lily tips hinge sharply downward. Keep a
          // modest vertical fall while folding the distal section back toward
          // the attachment in the longitudinal axis.
          const verticalReflex = reflex * 0.46;
          const longitudinalReflex = reflex * 0.28;
          const localThickness =
            thickness *
            (0.18 + Math.pow(Math.sin(Math.PI * t), 0.45) * 0.82) *
            // Living petal margins taper strongly, but not to a razor edge.
            // The old 0.16 floor collapsed to a dark single-pixel line in
            // lateral hero views and made overlapping blades visibly
            // intersect. Preserve a thin, light-catching rim while keeping
            // the central lamina substantially thicker.
            (0.24 + (1 - Math.pow(Math.abs(across), 5)) * 0.76);
          const surfaceOffset =
            (face === 0 ? 0.5 : -0.5) * Math.max(0.0005, localThickness);
          const color = from
            .clone()
            .lerp(to, Math.pow(t, 1.55))
            .multiplyScalar(
              (() => {
                const guide =
                  1 -
                  guideStrength *
                    Math.exp(-Math.pow(across / 0.34, 2)) *
                    Math.pow(1 - t, 2) *
                    0.45;
                const spotNoise = seededRandom(
                  markingSeed + row * 71 + column * 137,
                );
                const spot =
                  spotNoise > 1 - spots * 0.16 && t > 0.18 ? 0.62 : 1;
                return (
                  basalTone *
                  (0.95 +
                    vein * 0.05 +
                    paperyVeins *
                      (tissueVariant === "papery" ? -0.055 : 0.065) +
                    paperyPigment * 0.135 +
                    fleshyVeins * 0.045 +
                    rayVeins * 0.035 +
                    seededRandom(row * 31 + column) * 0.025) *
                  guide *
                  spot
                );
              })(),
            )
            .lerp(warmPaperyTone, Math.max(0, paperyPigment) * 0.12)
            .lerp(new THREE.Color("#d29436"), labellumCallus * 0.94);

          positions.push(
            across *
              halfWidth *
              naturalEdgeVariation *
              parallelMarginCharacter *
              (1 + Math.sign(across) * asymmetry * Math.sin(Math.PI * t)) +
              parallelTipDrift,
            t * lift +
              t * t * curl * 0.3 +
              edgeCup +
              centerFold +
              longitudinalPleats +
              paperCreases +
              finePaperCrinkles +
              parallelTepalRelief * (face === 0 ? 1 : -0.32) +
              ligulateRelief * (face === 0 ? 1 : -0.3) +
              paperyVeins * width * 0.006 * (face === 0 ? 1 : -0.3) +
              fleshyVeins * width * 0.0045 * (face === 0 ? 1 : -0.24) +
              labellumCallus * width * 0.04 * (face === 0 ? 1 : 0.08) +
              surfaceOffset +
              rayVeins *
                width *
                0.006 *
                thicknessScale *
                (face === 0 ? 1 : -0.42) +
              fleshyMarginTension +
              ligulateMarginDrift +
              edgeRipple * 0.025 +
              surfaceWave +
              Math.sin(Math.PI * t) * t * longitudinalCurve * 0.18 -
              verticalReflex,
            t * length -
              rugosaShoulderInset -
              rugosaFreeEdgeDrift -
              wornEdge * 0.16 +
              bladeTwist +
              paperCreases * 0.34 +
              finePaperCrinkles * 0.3 +
              edgeRipple * 0.018 +
              lateralWave -
              longitudinalReflex -
              tipNotch,
          );
          colors.push(color.r, color.g, color.b);
          uvs.push(column / widthSegments, t);
        }
      }
    }

    for (let row = 0; row < lengthSegments; row += 1) {
      for (let column = 0; column < widthSegments; column += 1) {
        const front = row * (widthSegments + 1) + column;
        const back = front + faceSize;
        const nextFront = front + widthSegments + 1;
        const nextBack = back + widthSegments + 1;
        frontIndices.push(
          front,
          nextFront,
          front + 1,
          front + 1,
          nextFront,
          nextFront + 1,
        );
        backIndices.push(
          back,
          back + 1,
          nextBack,
          back + 1,
          nextBack + 1,
          nextBack,
        );
      }
    }

    const boundary: number[] = [];
    for (let column = 0; column <= widthSegments; column += 1)
      boundary.push(column);
    for (let row = 1; row <= lengthSegments; row += 1)
      boundary.push(row * (widthSegments + 1) + widthSegments);
    for (let column = widthSegments - 1; column >= 0; column -= 1)
      boundary.push(lengthSegments * (widthSegments + 1) + column);
    for (let row = lengthSegments - 1; row > 0; row -= 1)
      boundary.push(row * (widthSegments + 1));

    boundary.forEach((current, index) => {
      const next = boundary[(index + 1) % boundary.length];
      edgeIndices.push(
        current,
        current + faceSize,
        next,
        next,
        current + faceSize,
        next + faceSize,
      );
    });

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    const indices = [...frontIndices, ...backIndices, ...edgeIndices];
    geometry.setIndex(indices);
    geometry.addGroup(0, frontIndices.length, 0);
    geometry.addGroup(frontIndices.length, backIndices.length, 1);
    geometry.addGroup(
      frontIndices.length + backIndices.length,
      edgeIndices.length,
      2,
    );
    geometry.computeVertexNormals();
    geometry.computeTangents();
    return geometry;
  });
}

export function createFusedCorollaGeometry({
  architecture,
  length,
  throatRadius,
  mouthRadius,
  lobes,
  baseColor,
  tipColor,
  thicknessScale = 1,
  seed = 0,
  rows = 20,
  radialSegments = 48,
}: {
  architecture: Extract<BloomArchitecture, "bell" | "trumpet">;
  length: number;
  throatRadius: number;
  mouthRadius: number;
  lobes: number;
  baseColor: string;
  tipColor: string;
  thicknessScale?: number;
  seed?: number;
  rows?: number;
  radialSegments?: number;
}) {
  const cacheKey = getFusedCorollaGeometryCacheKey({
    architecture,
    length,
    throatRadius,
    mouthRadius,
    lobes,
    baseColor,
    tipColor,
    thicknessScale,
    seed,
    rows,
    radialSegments,
  });

  return getCachedGeometry(cacheKey, () => {
    const geometry = new THREE.BufferGeometry();
    const ringSize = radialSegments + 1;
    const faceSize = (rows + 1) * ringSize;
    const thickness = Math.max(0.006, 0.018 * thicknessScale);
    const positions: number[] = [];
    const colors: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const base = new THREE.Color(baseColor).multiplyScalar(0.82);
    const tip = new THREE.Color(tipColor);
    const phase = seededRandom(seed) * Math.PI * 2;

    for (let face = 0; face < 2; face += 1) {
      for (let row = 0; row <= rows; row += 1) {
        const t = row / rows;
        const flare =
          architecture === "bell"
            ? THREE.MathUtils.smoothstep(t, 0.28, 1)
            : Math.pow(t, 1.55);
        const baseRadius = THREE.MathUtils.lerp(
          throatRadius,
          mouthRadius,
          flare,
        );
        const surfaceRadius = Math.max(
          0.01,
          baseRadius - (face === 0 ? 0 : thickness * (0.35 + t * 0.65)),
        );

        for (let segment = 0; segment <= radialSegments; segment += 1) {
          const around = segment / radialSegments;
          const angle = around * Math.PI * 2;
          const rimEnvelope = Math.pow(t, 9);
          const lobeWave = Math.cos(angle * lobes + phase);
          const rimRadius =
            surfaceRadius * (1 + rimEnvelope * lobeWave * 0.055);
          const rimLength =
            rimEnvelope * (0.035 + mouthRadius * 0.035) * lobeWave;
          const organic =
            rimEnvelope *
            (seededRandom(seed + segment * 73) - 0.5) *
            mouthRadius *
            0.018;

          positions.push(
            Math.cos(angle) * rimRadius,
            length * t + rimLength + organic,
            Math.sin(angle) * rimRadius,
          );
          const color = base.clone().lerp(tip, Math.pow(t, 0.8));
          colors.push(color.r, color.g, color.b);
          uvs.push(around, t);
        }
      }
    }

    for (let row = 0; row < rows; row += 1) {
      for (let segment = 0; segment < radialSegments; segment += 1) {
        const front = row * ringSize + segment;
        const nextFront = front + ringSize;
        const back = front + faceSize;
        const nextBack = back + ringSize;
        indices.push(
          front,
          front + 1,
          nextFront,
          front + 1,
          nextFront + 1,
          nextFront,
          back,
          nextBack,
          back + 1,
          back + 1,
          nextBack,
          nextBack + 1,
        );
      }
    }

    for (const row of [0, rows]) {
      for (let segment = 0; segment < radialSegments; segment += 1) {
        const front = row * ringSize + segment;
        const back = front + faceSize;
        indices.push(front, back, front + 1, front + 1, back, back + 1);
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeTangents();
    return geometry;
  });
}

export function getLeafOutlineWidth(t: number, shape: LeafShape = "ovate") {
  const clampedT = THREE.MathUtils.clamp(t, 0, 1);
  const baseTaper = Math.sin(Math.PI * clampedT);

  switch (shape) {
    case "linear":
      return Math.pow(baseTaper, 0.28) * (0.72 + clampedT * 0.16);
    case "lance":
      return Math.pow(baseTaper, 0.48) * (0.76 + clampedT * 0.22);
    case "cordate":
      return Math.max(
        Math.pow(baseTaper, 0.42) *
          (1.08 - clampedT * 0.28) *
          (0.9 + Math.exp(-Math.pow((clampedT - 0.18) / 0.16, 2)) * 0.16),
        0.34 * Math.exp(-Math.pow(clampedT / 0.13, 2)),
      );
    case "peltate":
      return Math.sqrt(Math.max(0, 1 - Math.pow(clampedT * 2 - 1, 2)));
    default:
      return Math.pow(baseTaper, 0.72);
  }
}

export function getPinnatifidLobeEnvelope(t: number) {
  const clampedT = THREE.MathUtils.clamp(t, 0, 1);
  const warpedT =
    clampedT +
    Math.sin(clampedT * Math.PI * 3.1) * 0.025 +
    Math.sin(clampedT * Math.PI * 7.3) * 0.012;
  const lobeWave = Math.abs(Math.sin(warpedT * Math.PI * 4.65));
  // Papaver rhoeas is deeply pinnatifid but still carries one continuous
  // blade. A phase-warped rhythm prevents a chain of identical leaflets, and
  // the slightly broader floor preserves narrow lamina through each sinus.
  return 0.32 + Math.pow(lobeWave, 0.72) * 0.68;
}

export function getRugoseLeafSurfaceRelief(
  across: number,
  t: number,
  seed: number,
) {
  const clampedT = THREE.MathUtils.clamp(t, 0, 1);
  const lateralPosition = THREE.MathUtils.clamp(Math.abs(across), 0, 1);
  const endpointEnvelope =
    THREE.MathUtils.smoothstep(clampedT, 0.035, 0.16) *
    (1 - THREE.MathUtils.smoothstep(clampedT, 0.86, 1));
  const marginEnvelope = THREE.MathUtils.smoothstep(
    1 - lateralPosition,
    0.04,
    0.32,
  );
  const midribFade = THREE.MathUtils.smoothstep(lateralPosition, 0.035, 0.16);
  const phase = seededRandom(seed + 9029) * Math.PI * 2;
  const broadPucker =
    Math.sin(clampedT * Math.PI * 13 + lateralPosition * 8.2 + phase) *
    Math.cos(lateralPosition * Math.PI * 4.6 - clampedT * 7.1 + phase * 0.63);
  const finePucker = Math.sin(
    clampedT * Math.PI * 23 - lateralPosition * 13.4 + phase * 1.31,
  );

  return (
    endpointEnvelope *
    marginEnvelope *
    midribFade *
    (broadPucker * 0.72 + finePucker * 0.28)
  );
}

export function getCordateBasalSinusOffset(across: number, t: number) {
  const longitudinalFade =
    1 - THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(t, 0, 1), 0.015, 0.2);
  const lateralPosition = THREE.MathUtils.clamp(Math.abs(across), 0, 1);
  const lateralFade = Math.pow(Math.cos(lateralPosition * Math.PI * 0.5), 2);
  return 0.115 * longitudinalFade * lateralFade;
}

export function getPeltateRadialVein(
  across: number,
  longitudinalPosition: number,
) {
  const taper = getLeafOutlineWidth(longitudinalPosition, "peltate");
  const x = across * taper;
  const y = longitudinalPosition * 2 - 1;
  const radius = Math.hypot(x, y);
  const angle = Math.atan2(y, x);
  return (
    Math.pow(Math.max(0, Math.cos(angle * 12)), 18) *
    Math.sin(Math.PI * Math.min(1, radius))
  );
}

export function getPeltateDropletVertexIndex(
  dropletIndex: number,
  seed: number,
  radialSegments = 20,
  perimeterSegments = 96,
) {
  const safeRadialSegments = Math.max(6, Math.round(radialSegments));
  const safePerimeterSegments = Math.max(12, Math.round(perimeterSegments));
  const minRing = Math.max(2, Math.round(safeRadialSegments * 0.16));
  const maxRing = Math.max(minRing, Math.round(safeRadialSegments * 0.88));
  const ring = Math.min(
    maxRing,
    minRing +
      Math.floor(
        seededRandom(seed + dropletIndex * 431 + 17) * (maxRing - minRing + 1),
      ),
  );
  const segment = Math.min(
    safePerimeterSegments - 1,
    Math.floor(
      seededRandom(seed + dropletIndex * 619 + 53) * safePerimeterSegments,
    ),
  );
  return 1 + (ring - 1) * safePerimeterSegments + segment;
}

export function getFusedCorollaGeometryCacheKey({
  architecture,
  length,
  throatRadius,
  mouthRadius,
  lobes,
  baseColor,
  tipColor,
  thicknessScale = 1,
  seed = 0,
  rows = 20,
  radialSegments = 48,
}: {
  architecture: Extract<BloomArchitecture, "bell" | "trumpet">;
  length: number;
  throatRadius: number;
  mouthRadius: number;
  lobes: number;
  baseColor: string;
  tipColor: string;
  thicknessScale?: number;
  seed?: number;
  rows?: number;
  radialSegments?: number;
}) {
  return [
    "fusedCorolla",
    architecture,
    length,
    throatRadius,
    mouthRadius,
    lobes,
    baseColor,
    tipColor,
    thicknessScale,
    seed,
    rows,
    radialSegments,
  ].join("|");
}

export function createLeafVeinNetwork(
  width: number,
  shape: LeafShape = "ovate",
  density = 1,
  seed = 0,
) {
  const veinCount = Math.max(2, Math.min(12, Math.round(7 * density)));
  const laterals: THREE.QuadraticBezierCurve3[] = [];
  const branches: THREE.QuadraticBezierCurve3[] = [];

  for (let index = 0; index < veinCount; index += 1) {
    const t = 0.12 + ((index + 1) / (veinCount + 1)) * 0.76;
    const y = t * 1.35;
    const reach = getLeafOutlineWidth(t, shape) * width * 0.86;
    for (const direction of [-1, 1] as const) {
      const irregularity =
        0.94 + seededRandom(seed + index * 101 + direction * 17) * 0.1;
      const end = new THREE.Vector3(
        direction * reach * irregularity,
        y + 0.1,
        0.043,
      );
      const lateral = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, y, 0.052),
        new THREE.Vector3(direction * reach * 0.48, y + 0.075, 0.065),
        end,
      );
      laterals.push(lateral);

      const branchStart = lateral.getPoint(0.58);
      branches.push(
        new THREE.QuadraticBezierCurve3(
          branchStart,
          branchStart
            .clone()
            .add(new THREE.Vector3(direction * reach * 0.16, 0.07, 0.003)),
          new THREE.Vector3(
            direction * reach * irregularity * 0.92,
            y + 0.19,
            0.042,
          ),
        ),
      );
    }
  }

  return { laterals, branches };
}

export function createLeafGeometry(
  width: number,
  seed: number,
  shape: LeafShape = "ovate",
  serrationStrength = 0.07,
  curl = 0.35,
  asymmetry = 0,
  veinRelief = 0,
  tessellationScale = 1,
  surfaceVariant: "default" | "rugose" | "coarse" = "default",
) {
  const cacheKey = getLeafGeometryCacheKey(
    width,
    seed,
    shape,
    serrationStrength,
    curl,
    asymmetry,
    veinRelief,
    tessellationScale,
    surfaceVariant,
  );

  return getCachedGeometry(cacheKey, () => {
    const geometry = new THREE.BufferGeometry();
    // A peltate blade exposes almost its entire perimeter in the hero views.
    // Give that circular outline enough samples to remain smooth at 1024px;
    // ordinary leaves keep the lighter grid because their tapered tips and
    // lateral margins do not need the same angular resolution.
    const qualityScale = THREE.MathUtils.clamp(tessellationScale, 0.75, 2);
    const rows =
      shape === "peltate"
        ? Math.round(96 * qualityScale)
        : surfaceVariant === "rugose" || surfaceVariant === "coarse"
          ? Math.round(56 * qualityScale)
          : Math.round((veinRelief > 0 ? 36 : 28) * qualityScale);
    const columns = Math.round(
      (shape === "peltate" ? 16 : veinRelief > 0 ? 20 : 12) * qualityScale,
    );
    const positions: number[] = [];
    const colors: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    if (shape === "peltate") {
      const radialSegments = Math.max(12, Math.round(20 * qualityScale));
      const perimeterSegments = rows;
      const centerY = 0.675;
      const perimeter: number[] = [];

      positions.push(0, centerY, -0.052);
      colors.push(0.98, 0.98, 0.98);
      uvs.push(0.5, 0.5);

      for (let ring = 1; ring <= radialSegments; ring += 1) {
        const radius = ring / radialSegments;
        for (let segment = 0; segment < perimeterSegments; segment += 1) {
          const angle = (segment / perimeterSegments) * Math.PI * 2;
          const edge =
            ring === radialSegments
              ? 1 +
                Math.sin(angle * 5 + seededRandom(seed + 101) * Math.PI * 2) *
                  0.007
              : 1;
          const radialVein =
            Math.pow(Math.max(0, Math.cos(angle * 12)), 18) *
            Math.sin(Math.PI * radius);
          const x = Math.cos(angle) * width * radius * edge;
          const y = centerY + Math.sin(angle) * centerY * radius * edge;
          const centerDepression = 0.055 * Math.exp(-Math.pow(radius / 0.2, 2));
          const bowl = radius * radius * (0.024 + curl * 0.032);
          const ripple =
            Math.sin(angle * 5 + radius * Math.PI * 2) *
            0.006 *
            radius *
            radius;
          const z =
            bowl -
            centerDepression +
            ripple +
            radialVein * 0.011 +
            asymmetry * Math.cos(angle) * radius * 0.018;
          const ageVariation = seededRandom(seed + ring * 131 + segment * 37);
          const shade = THREE.MathUtils.clamp(
            0.92 +
              (ageVariation - 0.5) * 0.022 +
              radialVein * 0.065 -
              radius * 0.025,
            0.82,
            1,
          );

          positions.push(x, y, z);
          colors.push(shade, shade, shade);
          uvs.push(
            0.5 + Math.cos(angle) * radius * 0.5,
            0.5 + Math.sin(angle) * radius * 0.5,
          );
          if (ring === radialSegments) {
            perimeter.push(positions.length / 3 - 1);
          }
        }
      }

      for (let segment = 0; segment < perimeterSegments; segment += 1) {
        indices.push(0, 1 + segment, 1 + ((segment + 1) % perimeterSegments));
      }
      for (let ring = 1; ring < radialSegments; ring += 1) {
        const innerStart = 1 + (ring - 1) * perimeterSegments;
        const outerStart = 1 + ring * perimeterSegments;
        for (let segment = 0; segment < perimeterSegments; segment += 1) {
          const next = (segment + 1) % perimeterSegments;
          indices.push(
            innerStart + segment,
            outerStart + segment,
            innerStart + next,
            innerStart + next,
            outerStart + segment,
            outerStart + next,
          );
        }
      }

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3),
      );
      geometry.setIndex(indices);
      geometry.userData.leafGrid = {
        rows: perimeterSegments,
        columns: radialSegments,
      };
      geometry.userData.leafPerimeter = perimeter;
      geometry.computeVertexNormals();
      return geometry;
    }

    for (let row = 0; row <= rows; row += 1) {
      const t = row / rows;
      const taper = getLeafOutlineWidth(t, shape);
      const lobes =
        shape === "pinnatifid"
          ? getPinnatifidLobeEnvelope(t)
          : shape === "lobed"
            ? 0.76 + Math.pow(Math.abs(Math.sin(t * Math.PI * 4.5)), 0.7) * 0.3
            : 1;
      const serrationFrequency = surfaceVariant === "rugose" ? 20 : 12;
      const serration =
        1 + Math.sin(t * Math.PI * serrationFrequency) * serrationStrength;
      const longitudinalCharacter =
        surfaceVariant === "rugose"
          ? Math.sin(
              t * Math.PI * 5.4 + seededRandom(seed + 451) * Math.PI * 2,
            ) * 0.0025
          : (seededRandom(seed + row) - 0.5) * 0.012;
      for (let column = 0; column <= columns; column += 1) {
        const across = (column / columns) * 2 - 1;
        const integratedVein = getPinnateLeafVeinRelief(across, t);
        const sideCharacter =
          1 +
          (seededRandom(seed + row * 23 + (across > 0 ? 101 : 211)) - 0.5) *
            0.055;
        const edgeIrregularity =
          1 -
          Math.pow(Math.abs(across), 7) * seededRandom(seed + row * 41) * 0.035;
        positions.push(
          across *
            width *
            taper *
            lobes *
            serration *
            sideCharacter *
            edgeIrregularity *
            (1 + Math.sign(across) * asymmetry * Math.sin(Math.PI * t)),
          t * 1.35 +
            (shape === "cordate" ? getCordateBasalSinusOffset(across, t) : 0),
          Math.sin(Math.PI * t) * (0.055 + curl * 0.13) +
            across * across * (0.018 + curl * 0.055) +
            longitudinalCharacter +
            // Keep integrated vascular relief subordinate to the explicit
            // branching vein network. A stronger displacement turned the
            // repeated lateral paths into broad diagonal corrugations.
            integratedVein * veinRelief * 0.0045 +
            (surfaceVariant === "rugose"
              ? getRugoseLeafSurfaceRelief(across, t, seed) * 0.0065
              : surfaceVariant === "coarse"
                ? getCoarseLeafLaminaVariation(across, t, seed) * 0.0045
                : 0),
        );
        const ageVariation = seededRandom(seed + row * 17 + column * 37);
        const edgeShade = Math.abs(across) * 0.045;
        const coarseLamina =
          surfaceVariant === "coarse"
            ? getCoarseLeafLaminaVariation(across, t, seed)
            : 0;
        const shade = THREE.MathUtils.clamp(
          0.9 +
            t * 0.1 +
            (ageVariation - 0.5) * 0.035 -
            edgeShade +
            integratedVein * veinRelief * 0.035 +
            coarseLamina * 0.045,
          0.78,
          1,
        );
        colors.push(shade, shade, shade);
        uvs.push(column / columns, t);
      }
    }

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const current = row * (columns + 1) + column;
        const next = current + columns + 1;
        indices.push(current, next, current + 1, current + 1, next, next + 1);
      }
    }
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.userData.leafGrid = { rows, columns };
    geometry.computeVertexNormals();
    return geometry;
  });
}

export function getCoarseLeafLaminaVariation(
  across: number,
  t: number,
  seed: number,
) {
  const x = THREE.MathUtils.clamp(across, -1, 1);
  const along = THREE.MathUtils.clamp(t, 0, 1);
  const bladeEnvelope =
    Math.pow(Math.sin(along * Math.PI), 0.48) *
    THREE.MathUtils.smoothstep(1 - Math.abs(x), 0.04, 0.3);
  const midribQuieting = 1 - Math.exp(-Math.pow(x / 0.12, 2)) * 0.82;
  const valueNoise = (sampleX: number, sampleY: number, salt: number) => {
    const x0 = Math.floor(sampleX);
    const y0 = Math.floor(sampleY);
    const fx = THREE.MathUtils.smoothstep(sampleX - x0, 0, 1);
    const fy = THREE.MathUtils.smoothstep(sampleY - y0, 0, 1);
    const sample = (ix: number, iy: number) =>
      seededRandom(seed + salt + ix * 92_821 + iy * 68_917) * 2 - 1;
    const lower = THREE.MathUtils.lerp(sample(x0, y0), sample(x0 + 1, y0), fx);
    const upper = THREE.MathUtils.lerp(
      sample(x0, y0 + 1),
      sample(x0 + 1, y0 + 1),
      fx,
    );
    return THREE.MathUtils.lerp(lower, upper, fy);
  };
  const broad = valueNoise((x + 1) * 2.4, along * 4.8, 9_271);
  const mesophyll = valueNoise((x + 1) * 5.7, along * 10.9, 17_311);
  return (broad * 0.7 + mesophyll * 0.3) * bladeEnvelope * midribQuieting;
}

export function getPinnateLeafVeinRelief(across: number, t: number) {
  const bladeFade = Math.sin(THREE.MathUtils.clamp(t, 0, 1) * Math.PI);
  const marginFade = THREE.MathUtils.smoothstep(1 - Math.abs(across), 0, 0.28);
  const midrib = Math.exp(-Math.pow(across / 0.075, 2));
  let laterals = 0;
  for (let index = 0; index < 7; index += 1) {
    const origin = 0.14 + index * 0.105;
    const path = origin + Math.abs(across) * (0.16 + index * 0.006);
    laterals = Math.max(laterals, Math.exp(-Math.pow((t - path) / 0.018, 2)));
  }
  return bladeFade * (midrib * 0.9 + laterals * marginFade * 0.42);
}

export function createLeafMarginGeometry(
  leafGeometry: THREE.BufferGeometry,
  thickness = 0.0035,
) {
  return getCachedGeometry(
    ["leafMargin", leafGeometry.uuid, thickness].join("|"),
    () => {
      const positions = leafGeometry.getAttribute("position");
      const perimeterIndices = leafGeometry.userData.leafPerimeter as
        number[] | undefined;
      const grid = leafGeometry.userData.leafGrid as
        { rows?: number; columns?: number } | undefined;
      const rows = grid?.rows ?? 28;
      const columns = grid?.columns ?? 12;
      const rowWidth = columns + 1;
      const perimeter: THREE.Vector3[] = [];

      if (perimeterIndices) {
        for (const index of perimeterIndices) {
          perimeter.push(
            new THREE.Vector3().fromBufferAttribute(positions, index),
          );
        }
      } else {
        for (let row = 0; row <= rows; row += 1) {
          perimeter.push(
            new THREE.Vector3().fromBufferAttribute(positions, row * rowWidth),
          );
        }
        for (let row = rows; row >= 0; row -= 1) {
          perimeter.push(
            new THREE.Vector3().fromBufferAttribute(
              positions,
              row * rowWidth + columns,
            ),
          );
        }
        for (let column = columns - 1; column > 0; column -= 1) {
          perimeter.push(
            new THREE.Vector3().fromBufferAttribute(positions, column),
          );
        }
      }

      const curve = new THREE.CatmullRomCurve3(perimeter, true, "centripetal");
      return new THREE.TubeGeometry(
        curve,
        perimeterIndices ? 96 : 68,
        thickness,
        5,
        true,
      );
    },
  );
}

export function createTaperedStem(
  curve: THREE.CatmullRomCurve3,
  thickness = 1,
  taper = 0.38,
  eccentricity = 0,
  ribbing = 0,
  seed = 0,
) {
  const cacheKey = getStemGeometryCacheKey(
    curve,
    thickness,
    taper,
    eccentricity,
    ribbing,
    seed,
  );

  return getCachedGeometry(cacheKey, () => {
    const geometry = new THREE.BufferGeometry();
    const segments = 72;
    const radialSegments = 16;
    const frames = curve.computeFrenetFrames(segments, false);
    const positions: number[] = [];
    const colors: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let segment = 0; segment <= segments; segment += 1) {
      const t = segment / segments;
      const point = curve.getPointAt(t);
      const baseRadius = 0.076 * thickness;
      const radius =
        THREE.MathUtils.lerp(baseRadius, baseRadius * (1 - taper), t) *
        (1 + Math.sin(t * 31) * 0.025);
      for (let ring = 0; ring < radialSegments; ring += 1) {
        const angle = (ring / radialSegments) * Math.PI * 2;
        const ribScale =
          1 +
          Math.cos(angle * 5 + seededRandom(seed) * Math.PI * 2) *
            ribbing *
            0.08;
        const offset = frames.normals[segment]
          .clone()
          .multiplyScalar(
            Math.cos(angle) * radius * (1 + eccentricity) * ribScale,
          )
          .add(
            frames.binormals[segment]
              .clone()
              .multiplyScalar(
                Math.sin(angle) * radius * (1 - eccentricity) * ribScale,
              ),
          );
        positions.push(
          point.x + offset.x,
          point.y + offset.y,
          point.z + offset.z,
        );
        const longitudinal = 0.9 + Math.sin(angle * 5 + t * 9) * 0.025;
        const growthTone = THREE.MathUtils.lerp(0.84, 1, t) * longitudinal;
        colors.push(growthTone, growthTone, growthTone);
        uvs.push(ring / radialSegments, t);
      }
    }

    for (let segment = 0; segment < segments; segment += 1) {
      for (let ring = 0; ring < radialSegments; ring += 1) {
        const nextRing = (ring + 1) % radialSegments;
        const current = segment * radialSegments + ring;
        const next = (segment + 1) * radialSegments + ring;
        indices.push(current, next, segment * radialSegments + nextRing);
        indices.push(
          segment * radialSegments + nextRing,
          next,
          (segment + 1) * radialSegments + nextRing,
        );
      }
    }
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  });
}

export function createPetioleGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  baseRadius = 0.022,
  shaftRadius = 0.012,
  bladeFlare = 0.006,
  segments = 14,
  radialSegments = 7,
) {
  const safeSegments = Math.max(6, Math.round(segments));
  const safeRadialSegments = Math.max(5, Math.round(radialSegments));
  const cacheKey = [
    "petiole",
    curve
      .getPoints(4)
      .map((point) => [point.x, point.y, point.z].join(","))
      .join(";"),
    baseRadius,
    shaftRadius,
    bladeFlare,
    safeSegments,
    safeRadialSegments,
  ].join("|");

  return getCachedGeometry(cacheKey, () => {
    const geometry = new THREE.BufferGeometry();
    const frames = curve.computeFrenetFrames(safeSegments, false);
    const positions: number[] = [];
    const colors: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let segment = 0; segment <= safeSegments; segment += 1) {
      const t = segment / safeSegments;
      const point = curve.getPointAt(t);
      const terminalFlare = THREE.MathUtils.smoothstep(t, 0.72, 1) * bladeFlare;
      const radius =
        THREE.MathUtils.lerp(baseRadius, shaftRadius, Math.sqrt(t)) +
        terminalFlare;

      for (let ring = 0; ring < safeRadialSegments; ring += 1) {
        const angle = (ring / safeRadialSegments) * Math.PI * 2;
        const offset = frames.normals[segment]
          .clone()
          .multiplyScalar(Math.cos(angle) * radius)
          .addScaledVector(frames.binormals[segment], Math.sin(angle) * radius);
        positions.push(
          point.x + offset.x,
          point.y + offset.y,
          point.z + offset.z,
        );
        const growthTone = THREE.MathUtils.clamp(
          THREE.MathUtils.lerp(0.9, 1, t) *
            (1 + Math.cos(angle * 3 + t * 4.2) * 0.012),
          0.88,
          1,
        );
        colors.push(growthTone, growthTone, growthTone);
        uvs.push(ring / radialSegments, t);
      }
    }

    for (let segment = 0; segment < safeSegments; segment += 1) {
      for (let ring = 0; ring < safeRadialSegments; ring += 1) {
        const nextRing = (ring + 1) % safeRadialSegments;
        const current = segment * safeRadialSegments + ring;
        const next = current + safeRadialSegments;
        indices.push(current, next, segment * safeRadialSegments + nextRing);
        indices.push(
          segment * safeRadialSegments + nextRing,
          next,
          next + nextRing - ring,
        );
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  });
}

export function getLeafGeometryCacheKey(
  width: number,
  seed: number,
  shape: LeafShape = "ovate",
  serrationStrength = 0.07,
  curl = 0.35,
  asymmetry = 0,
  veinRelief = 0,
  tessellationScale = 1,
  surfaceVariant: "default" | "rugose" | "coarse" = "default",
) {
  return [
    "leaf",
    width,
    seed,
    shape,
    serrationStrength,
    curl,
    asymmetry,
    veinRelief,
    tessellationScale,
    surfaceVariant,
  ].join("|");
}

export function getStemGeometryCacheKey(
  curve: THREE.CatmullRomCurve3,
  thickness = 1,
  taper = 0.38,
  eccentricity = 0,
  ribbing = 0,
  seed = 0,
) {
  return [
    "stem",
    curve.points
      .map((point) => [point.x, point.y, point.z].join(","))
      .join(";"),
    thickness,
    taper,
    eccentricity,
    ribbing,
    seed,
  ].join("|");
}

export function createLeafAttachments(
  curve: THREE.CatmullRomCurve3,
  pairCount: number,
  startT = 0.28,
  endT = 0.72,
  arrangement: "opposite" | "alternate" | "spiral" = "opposite",
) {
  return Array.from({ length: pairCount }, (_, pair) => {
    const centerT = startT + ((pair + 1) / (pairCount + 1)) * (endT - startT);
    const sides =
      arrangement === "spiral"
        ? ([1] as const)
        : arrangement === "alternate"
          ? ([pair % 2 === 0 ? 1 : -1] as const)
          : ([1, -1] as const);
    return sides.map((side) => {
      const t = THREE.MathUtils.clamp(centerT - side * 0.026, 0.02, 0.9);
      return {
        side,
        azimuth: arrangement === "spiral" ? pair * goldenAngle : 0,
        t,
        point: curve.getPointAt(t),
        tangent: curve.getTangentAt(t).normalize(),
      };
    });
  }).flat();
}

export function createStemPricklePlacements(
  curve: THREE.CatmullRomCurve3,
  count: number,
  seed: number,
  surfaceOffset = 0.058,
) {
  const safeCount = Math.max(0, Math.round(count));
  const up = new THREE.Vector3(0, 1, 0);
  const fallback = new THREE.Vector3(1, 0, 0);

  return Array.from({ length: safeCount }, (_, index) => {
    const t = 0.12 + ((index + 0.5) / safeCount) * 0.74;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, up);
    if (normal.lengthSq() < 0.001) normal.crossVectors(tangent, fallback);
    normal.normalize();
    const binormal = new THREE.Vector3()
      .crossVectors(tangent, normal)
      .normalize();
    const angle =
      index * 2.399963 + seededRandom(seed + index * 173) * Math.PI * 0.72;
    const radial = normal
      .multiplyScalar(Math.cos(angle))
      .addScaledVector(binormal, Math.sin(angle))
      .normalize();
    const direction = radial
      .clone()
      .addScaledVector(tangent, -0.32)
      .normalize();

    return {
      position: point.clone().addScaledVector(radial, surfaceOffset),
      direction,
      scale: THREE.MathUtils.lerp(
        0.82,
        1.18,
        seededRandom(seed + index * 271 + 59),
      ),
    };
  });
}

export function createRosePrickleGeometry(
  radialSegments = 7,
  heightSegments = 5,
) {
  const safeRadialSegments = Math.max(5, Math.round(radialSegments));
  const safeHeightSegments = Math.max(3, Math.round(heightSegments));
  const positions: number[] = [];
  const indices: number[] = [];

  for (let ring = 0; ring <= safeHeightSegments; ring += 1) {
    const t = ring / safeHeightSegments;
    const radius = Math.pow(1 - t, 1.28);
    const centerX = -0.18 * t * t;
    for (let side = 0; side < safeRadialSegments; side += 1) {
      const angle = (side / safeRadialSegments) * Math.PI * 2;
      positions.push(
        centerX + Math.cos(angle) * radius,
        t,
        Math.sin(angle) * radius * 0.72,
      );
    }
  }

  for (let ring = 0; ring < safeHeightSegments; ring += 1) {
    for (let side = 0; side < safeRadialSegments; side += 1) {
      const nextSide = (side + 1) % safeRadialSegments;
      const lower = ring * safeRadialSegments + side;
      const lowerNext = ring * safeRadialSegments + nextSide;
      const upper = (ring + 1) * safeRadialSegments + side;
      const upperNext = (ring + 1) * safeRadialSegments + nextSide;
      indices.push(lower, upper, lowerNext, lowerNext, upper, upperNext);
    }
  }

  const baseCenter = positions.length / 3;
  positions.push(0, 0, 0);
  for (let side = 0; side < safeRadialSegments; side += 1) {
    indices.push(baseCenter, (side + 1) % safeRadialSegments, side);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createOrchidSpikeBractGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-0.34, 0.08, -0.42, 0.42, -0.2, 0.72);
  shape.bezierCurveTo(-0.1, 0.88, -0.035, 0.97, 0, 1);
  shape.bezierCurveTo(0.035, 0.97, 0.1, 0.88, 0.2, 0.72);
  shape.bezierCurveTo(0.42, 0.42, 0.34, 0.08, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    steps: 1,
    curveSegments: 8,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.035,
    bevelThickness: 0.025,
  });
  geometry.translate(0, 0, -0.05);
  geometry.computeVertexNormals();
  return geometry;
}

export function createTaperedFilamentGeometry(radialSegments = 10) {
  const safeRadialSegments = Math.max(8, Math.round(radialSegments));
  const geometry = new THREE.CylinderGeometry(
    0.82,
    1,
    1,
    safeRadialSegments,
    2,
    false,
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function createLilyAntherGeometry(radialSegments = 12) {
  const profile = [
    new THREE.Vector2(0, -1.7),
    new THREE.Vector2(0.55, -1.48),
    new THREE.Vector2(0.88, -1.05),
    new THREE.Vector2(1, -0.42),
    new THREE.Vector2(0.96, 0.28),
    new THREE.Vector2(0.76, 0.92),
    new THREE.Vector2(0.42, 1.45),
    new THREE.Vector2(0, 1.7),
  ];
  const geometry = new THREE.LatheGeometry(
    profile,
    Math.max(8, Math.round(radialSegments)),
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function createRoseAntherGeometry(radialSegments = 12) {
  const profile = [
    new THREE.Vector2(0, -1.5),
    new THREE.Vector2(0.58, -1.34),
    new THREE.Vector2(0.9, -0.84),
    new THREE.Vector2(1, -0.18),
    new THREE.Vector2(0.86, 0.5),
    new THREE.Vector2(0.52, 1.08),
    new THREE.Vector2(0, 1.38),
  ];
  const geometry = new THREE.LatheGeometry(
    profile,
    Math.max(8, Math.round(radialSegments)),
  );
  const position = geometry.getAttribute("position");
  for (let index = 0; index < position.count; index += 1) {
    const y = position.getY(index);
    const normalized = THREE.MathUtils.clamp((y + 1.5) / 2.88, 0, 1);
    // Rosa anther sacs are short, tapered, and often gently incurved rather
    // than straight pills. Bow the axis without introducing a segmented hook.
    const axialBow = Math.sin(normalized * Math.PI) * 0.14 + normalized * 0.05;
    position.setX(index, position.getX(index) + axialBow);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function createLilyStigmaGeometry(radialSegments = 36) {
  const geometry = new THREE.CylinderGeometry(
    0.92,
    1,
    0.55,
    Math.max(18, Math.round(radialSegments)),
    2,
    false,
  );
  const position = geometry.getAttribute("position");
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);
    const radius = Math.hypot(x, z);
    if (radius < 0.001) continue;
    const angle = Math.atan2(z, x);
    const lobeRadius = 0.86 + Math.cos(angle * 3) * 0.14;
    position.setX(index, (x / radius) * radius * lobeRadius);
    position.setZ(index, (z / radius) * radius * lobeRadius);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function createLilyStyleGeometry(radialSegments = 14) {
  const geometry = new THREE.CylinderGeometry(
    0.78,
    1,
    1,
    Math.max(10, Math.round(radialSegments)),
    4,
    false,
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function createLotusCarpelPitGeometry(radialSegments = 16) {
  const profile = [
    new THREE.Vector2(0, -0.42),
    new THREE.Vector2(0.42, -0.31),
    new THREE.Vector2(0.78, -0.11),
    new THREE.Vector2(1, 0.24),
    new THREE.Vector2(0, 0.16),
  ];
  const geometry = new THREE.LatheGeometry(
    profile,
    Math.max(10, Math.round(radialSegments)),
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function createLilyOvaryGeometry() {
  const geometry = new THREE.SphereGeometry(1, 24, 16);
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const radius = Math.hypot(x, z);
    if (radius <= Number.EPSILON) continue;
    const angle = Math.atan2(z, x);
    const lobeEnvelope = Math.pow(Math.max(0, 1 - y * y), 0.72);
    const radialScale = 1 + Math.cos(angle * 3) * 0.065 * lobeEnvelope;
    position.setXYZ(index, x * radialScale, y, z * radialScale);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function createRoseStipuleGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-0.035, 0.07, -0.042, 0.19, -0.008, 0.27);
  shape.bezierCurveTo(0.025, 0.2, 0.03, 0.08, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    steps: 1,
    curveSegments: 8,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.002,
    bevelThickness: 0.002,
  });
  geometry.translate(0, 0, -0.006);
  geometry.computeVertexNormals();
  return geometry;
}

export function createRoseCalyxCupGeometry(radius = 1) {
  const safeRadius = Math.max(0.001, radius);
  const profile = [
    [0, -0.58],
    [0.42, -0.48],
    [0.78, -0.27],
    [1, 0.04],
    [0.82, 0.34],
    [0.34, 0.53],
    [0, 0.58],
  ].map(
    ([profileRadius, y]) =>
      new THREE.Vector2(profileRadius * safeRadius, y * safeRadius),
  );
  const geometry = new THREE.LatheGeometry(profile, 64);
  geometry.computeVertexNormals();
  return geometry;
}

export function createRoseHypanthiumLiningGeometry() {
  const geometry = new THREE.SphereGeometry(1, 64, 24);
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const radial = Math.hypot(x, z);
    if (radial <= Number.EPSILON) {
      position.setY(index, y > 0 ? y * 0.92 : y);
      continue;
    }
    const angle = Math.atan2(z, x);
    const shoulderEnvelope = Math.pow(Math.max(0, 1 - y * y), 0.62);
    const rimVariation =
      Math.sin(angle * 7 + 0.35) * 0.022 + Math.sin(angle * 11 - 0.8) * 0.011;
    const radialScale = 1 + rimVariation * shoulderEnvelope;
    const topSoftening =
      y > 0 ? Math.pow(Math.max(0, 1 - radial), 1.4) * 0.08 : 0;
    position.setXYZ(
      index,
      x * radialScale,
      y * (1 - topSoftening),
      z * radialScale,
    );
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function createPoppyReceptacleGeometry(radius = 1) {
  const safeRadius = Math.max(0.001, radius);
  // A mature Papaver flower has already shed its two sepals. What remains
  // below the petal bases is a small, continuous, obconic receptacle rather
  // than a spherical calyx body.
  const profile = [
    [0, -0.62],
    [0.22, -0.59],
    [0.42, -0.43],
    [0.72, -0.16],
    [1, 0.08],
    [0.92, 0.22],
    [0.52, 0.29],
    [0, 0.3],
  ].map(
    ([profileRadius, y]) =>
      new THREE.Vector2(profileRadius * safeRadius, y * safeRadius),
  );
  const geometry = new THREE.LatheGeometry(profile, 28);
  geometry.computeVertexNormals();
  return geometry;
}

export function createSunflowerReceptacleGeometry(radius = 1) {
  const safeRadius = Math.max(0.001, radius);
  const profile = [
    [0, -0.58],
    [0.16, -0.55],
    [0.44, -0.43],
    [0.76, -0.2],
    [0.94, -0.01],
    [0.74, 0.1],
    [0, 0.13],
  ].map(
    ([profileRadius, y]) =>
      new THREE.Vector2(profileRadius * safeRadius, y * safeRadius),
  );
  const geometry = new THREE.LatheGeometry(profile, 32);
  geometry.computeVertexNormals();
  return geometry;
}

export function createStemSurfacePlacements(
  curve: THREE.CatmullRomCurve3,
  count: number,
  seed: number,
  startT = 0.1,
  endT = 0.9,
) {
  const safeCount = Math.max(0, Math.round(count));
  const up = new THREE.Vector3(0, 1, 0);
  const fallback = new THREE.Vector3(1, 0, 0);

  return Array.from({ length: safeCount }, (_, index) => {
    const evenlySpacedT =
      startT + ((index + 0.5) / safeCount) * (endT - startT);
    const spacingJitter =
      (seededRandom(seed + index * 193 + 17) - 0.5) *
      ((endT - startT) / safeCount) *
      0.58;
    const t = THREE.MathUtils.clamp(
      evenlySpacedT + spacingJitter,
      startT,
      endT,
    );
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, up);
    if (normal.lengthSq() < 0.001) normal.crossVectors(tangent, fallback);
    normal.normalize();
    const binormal = new THREE.Vector3()
      .crossVectors(tangent, normal)
      .normalize();
    const angle =
      index * 2.399963 + seededRandom(seed + index * 283 + 71) * Math.PI * 0.8;
    const radial = normal
      .multiplyScalar(Math.cos(angle))
      .addScaledVector(binormal, Math.sin(angle))
      .normalize();

    return {
      t,
      position: point,
      tangent,
      radial,
      scale: THREE.MathUtils.lerp(
        0.82,
        1.18,
        seededRandom(seed + index * 347 + 113),
      ),
    };
  });
}

export function getAerialRootTipPose(
  curve: THREE.CatmullRomCurve3,
  radius: number,
) {
  const safeRadius = Math.max(0.001, radius);
  const direction = curve.getTangentAt(1).normalize();
  return {
    position: curve.getPointAt(1).addScaledVector(direction, safeRadius * 0.55),
    direction,
    radialScale: safeRadius * 0.82,
    lengthScale: safeRadius * 1.85,
  };
}

export function createPollenClusterPlacements(
  stamenCount: number,
  grainsPerAnther: number,
  seed: number,
) {
  const safeStamenCount = Math.max(0, Math.round(stamenCount));
  const safeGrainCount = Math.max(0, Math.round(grainsPerAnther));

  return Array.from(
    { length: safeStamenCount * safeGrainCount },
    (_, index) => {
      const stamenIndex = Math.floor(index / safeGrainCount);
      const grainIndex = index % safeGrainCount;
      const angle =
        grainIndex * 2.399963 +
        seededRandom(seed + stamenIndex * 397 + grainIndex * 89) * 0.9;
      const elevation =
        (seededRandom(seed + stamenIndex * 521 + grainIndex * 137 + 31) - 0.5) *
        1.2;
      const radial =
        0.0065 *
        THREE.MathUtils.lerp(
          0.72,
          1.18,
          seededRandom(seed + stamenIndex * 613 + grainIndex * 173 + 67),
        );

      return {
        stamenIndex,
        lobeSide: grainIndex % 2 === 0 ? -1 : 1,
        offset: new THREE.Vector3(
          Math.cos(angle) * radial,
          Math.sin(elevation) * radial * 0.7 + 0.009,
          Math.sin(angle) * radial,
        ),
        scale: THREE.MathUtils.lerp(
          0.72,
          1.12,
          seededRandom(seed + stamenIndex * 719 + grainIndex * 211 + 103),
        ),
      };
    },
  );
}

export function distributeRosePollenOffset(
  offset: THREE.Vector3,
  grainIndex: number,
  grainCount: number,
  seed: number,
) {
  const safeCount = Math.max(1, Math.round(grainCount));
  const progress = safeCount === 1 ? 0.5 : grainIndex / (safeCount - 1);
  const axialJitter =
    (seededRandom(seed + grainIndex * 307 + 43) - 0.5) * 0.003;
  return new THREE.Vector3(
    offset.x * 0.58,
    THREE.MathUtils.lerp(-0.009, 0.008, progress) + axialJitter,
    offset.z * 0.52,
  );
}

export function orientPollenOffsetToAnther(
  offset: THREE.Vector3,
  angle: number,
  lobeSide: number,
  lobeSeparation: number,
  depthScale = 1,
) {
  return offset
    .clone()
    .setZ(offset.z * THREE.MathUtils.clamp(depthScale, 0.1, 1))
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), -angle)
    .add(
      new THREE.Vector3(
        Math.cos(angle + Math.PI / 2) * lobeSeparation * lobeSide,
        0,
        Math.sin(angle + Math.PI / 2) * lobeSeparation * lobeSide,
      ),
    );
}

export function distributeLilyPollenOffset(
  offset: THREE.Vector3,
  grainIndex: number,
  grainCount: number,
  seed: number,
) {
  const safeCount = Math.max(1, Math.round(grainCount));
  const safeIndex = THREE.MathUtils.clamp(
    Math.round(grainIndex),
    0,
    safeCount - 1,
  );
  const progress =
    (safeIndex +
      THREE.MathUtils.lerp(0.28, 0.72, seededRandom(seed + safeIndex * 193))) /
    safeCount;

  return new THREE.Vector3(
    offset.x * 0.48,
    THREE.MathUtils.lerp(-0.016, 0.018, progress),
    offset.z * 0.44,
  );
}
