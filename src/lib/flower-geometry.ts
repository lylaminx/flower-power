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

function insertGeometryIntoCache(
  key: string,
  geometry: THREE.BufferGeometry,
) {
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

function getCachedGeometry(
  key: string,
  build: () => THREE.BufferGeometry,
) {
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
    case "obovate":
      return ellipse * THREE.MathUtils.lerp(0.58, 1.18, towardTip);
    case "fan":
      return ellipse * THREE.MathUtils.lerp(0.42, 1.28, towardTip);
    case "lanceolate":
      return (
        Math.pow(Math.sin(Math.PI * clampedT), 0.92) *
        (0.88 + Math.sin(Math.PI * clampedT) * 0.12)
      );
    case "spatulate":
      return ellipse * THREE.MathUtils.lerp(0.34, 1.22, towardTip * towardTip);
    default:
      return ellipse;
  }
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
  twist = 0.5,
  baseWidth = 1,
  spots = 0,
  guideStrength = 0,
  markingSeed = 0,
  asymmetry = 0,
  edgeWear = 0,
  outline = "elliptic",
  longitudinalCurve = 0,
  lateralCup = 1,
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
  twist?: number;
  baseWidth?: number;
  spots?: number;
  guideStrength?: number;
  markingSeed?: number;
  asymmetry?: number;
  edgeWear?: number;
  outline?: PetalOutline;
  longitudinalCurve?: number;
  lateralCup?: number;
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
    twist,
    baseWidth,
    spots,
    guideStrength,
    markingSeed,
    asymmetry,
    edgeWear,
    outline,
    longitudinalCurve,
    lateralCup,
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
  twist = 0.5,
  baseWidth = 1,
  spots = 0,
  guideStrength = 0,
  markingSeed = 0,
  asymmetry = 0,
  edgeWear = 0,
  outline = "elliptic",
  longitudinalCurve = 0,
  lateralCup = 1,
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
  twist?: number;
  baseWidth?: number;
  spots?: number;
  guideStrength?: number;
  markingSeed?: number;
  asymmetry?: number;
  edgeWear?: number;
  outline?: PetalOutline;
  longitudinalCurve?: number;
  lateralCup?: number;
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
    twist,
    baseWidth,
    spots,
    guideStrength,
    markingSeed,
    asymmetry,
    edgeWear,
    outline,
    longitudinalCurve,
    lateralCup,
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

  for (let face = 0; face < 2; face += 1) {
    for (let row = 0; row <= lengthSegments; row += 1) {
      const t = row / lengthSegments;
      const roundedWidth = getPetalOutlineWidth(t, profile, outline);
      const ruffle =
        1 +
        edgeRuffle *
          (Math.sin(t * Math.PI * 17) + Math.sin(t * Math.PI * 31)) *
          0.5;
      const basalWidth = 0.045 * baseWidth * (1 - t) * (1 - t);
      const halfWidth = width * (basalWidth + roundedWidth * 0.5) * ruffle;

      for (let column = 0; column <= widthSegments; column += 1) {
        const across = (column / widthSegments) * 2 - 1;
        const edgeCup =
          across * across * 0.085 * lateralCup * Math.sin(Math.PI * t);
        const centerFold =
          (1 - across * across) * 0.07 * fold * Math.sin(Math.PI * t);
        const bladeTwist = across * t * t * twist * 0.11;
        const tipNotch =
          notch *
          Math.exp(-Math.pow(across / 0.27, 2)) *
          Math.pow(Math.max(0, (t - 0.76) / 0.24), 2);
        const vein = Math.exp(-Math.pow(across / 0.12, 2));
        const basalTone = THREE.MathUtils.lerp(
          baseDarkening,
          1,
          THREE.MathUtils.smoothstep(t, 0.05, 0.46),
        );
        const edgeWeight = Math.pow(Math.abs(across), 5);
        const edgeRipple =
          edgeRuffle *
          edgeWeight *
          Math.sin(t * Math.PI * 43 + (across > 0 ? 1.7 : 0.2));
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
        const localThickness =
          thickness *
          (0.18 + Math.pow(Math.sin(Math.PI * t), 0.45) * 0.82) *
          (0.16 + (1 - Math.pow(Math.abs(across), 5)) * 0.84);
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
              const spot = spotNoise > 1 - spots * 0.16 && t > 0.18 ? 0.62 : 1;
              return (
                basalTone *
                (0.95 + vein * 0.05 + seededRandom(row * 31 + column) * 0.025) *
                guide *
                spot
              );
            })(),
          );

        positions.push(
          across *
            halfWidth *
            (1 + Math.sign(across) * asymmetry * Math.sin(Math.PI * t)),
          t * lift +
            t * t * curl * 0.3 +
            edgeCup +
            centerFold +
            surfaceOffset +
            edgeRipple * 0.025 +
            surfaceWave +
            Math.sin(Math.PI * t) * t * longitudinalCurve * 0.18,
          t * length -
            tipNotch -
            wornEdge * 0.16 +
            bladeTwist +
            edgeRipple * 0.018 +
            lateralWave,
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
      const baseRadius = THREE.MathUtils.lerp(throatRadius, mouthRadius, flare);
      const surfaceRadius = Math.max(
        0.01,
        baseRadius - (face === 0 ? 0 : thickness * (0.35 + t * 0.65)),
      );

      for (let segment = 0; segment <= radialSegments; segment += 1) {
        const around = segment / radialSegments;
        const angle = around * Math.PI * 2;
        const rimEnvelope = Math.pow(t, 9);
        const lobeWave = Math.cos(angle * lobes + phase);
        const rimRadius = surfaceRadius * (1 + rimEnvelope * lobeWave * 0.055);
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
      return (
        Math.pow(baseTaper, 0.42) *
        (1.08 - clampedT * 0.28) *
        (0.9 + Math.exp(-Math.pow((clampedT - 0.18) / 0.16, 2)) * 0.16)
      );
    default:
      return Math.pow(baseTaper, 0.72);
  }
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
) {
  const cacheKey = getLeafGeometryCacheKey(
    width,
    seed,
    shape,
    serrationStrength,
    curl,
    asymmetry,
  );

  return getCachedGeometry(cacheKey, () => {
  const geometry = new THREE.BufferGeometry();
  const rows = 16;
  const columns = 6;
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    const taper = getLeafOutlineWidth(t, shape);
    const lobes =
      shape === "lobed"
        ? 0.76 + Math.pow(Math.abs(Math.sin(t * Math.PI * 4.5)), 0.7) * 0.3
        : 1;
    const serration = 1 + Math.sin(t * Math.PI * 12) * serrationStrength;
    for (let column = 0; column <= columns; column += 1) {
      const across = (column / columns) * 2 - 1;
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
        t * 1.35,
        Math.sin(Math.PI * t) * (0.055 + curl * 0.13) +
          across * across * (0.018 + curl * 0.055) +
          (seededRandom(seed + row) - 0.5) * 0.012,
      );
      const ageVariation = seededRandom(seed + row * 17 + column * 37);
      const edgeShade = Math.abs(across) * 0.045;
      const shade = THREE.MathUtils.clamp(
        0.9 + t * 0.1 + (ageVariation - 0.5) * 0.035 - edgeShade,
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
  geometry.computeVertexNormals();
  return geometry;
  });
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
  const radialSegments = 12;
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
        Math.cos(angle * 5 + seededRandom(seed) * Math.PI * 2) * ribbing * 0.08;
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

export function getLeafGeometryCacheKey(
  width: number,
  seed: number,
  shape: LeafShape = "ovate",
  serrationStrength = 0.07,
  curl = 0.35,
  asymmetry = 0,
) {
  return ["leaf", width, seed, shape, serrationStrength, curl, asymmetry].join(
    "|",
  );
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
    curve.points.map((point) => [point.x, point.y, point.z].join(",")).join(";"),
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
) {
  return Array.from({ length: pairCount }, (_, pair) => {
    const centerT = 0.28 + ((pair + 1) / (pairCount + 1)) * 0.44;
    return ([1, -1] as const).map((side) => {
      const t = THREE.MathUtils.clamp(centerT - side * 0.026, 0.25, 0.78);
      return { side, t, point: curve.getPointAt(t) };
    });
  }).flat();
}
