import * as THREE from "three";

export function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
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
}) {
  const geometry = new THREE.BufferGeometry();
  const lengthSegments = 18;
  const widthSegments = 8;
  const faceSize = (lengthSegments + 1) * (widthSegments + 1);
  const thickness = Math.max(0.004, width * 0.025 * thicknessScale);
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const from = new THREE.Color(baseColor).multiplyScalar(0.9);
  const to = new THREE.Color(tipColor);

  for (let face = 0; face < 2; face += 1) {
    const faceOffset = face === 0 ? thickness * 0.5 : -thickness * 0.5;
    for (let row = 0; row <= lengthSegments; row += 1) {
      const t = row / lengthSegments;
      const roundedWidth = Math.pow(Math.sin(Math.PI * t), profile);
      const ruffle =
        1 +
        edgeRuffle *
          (Math.sin(t * Math.PI * 17) + Math.sin(t * Math.PI * 31)) *
          0.5;
      const basalWidth = 0.045 * baseWidth * (1 - t) * (1 - t);
      const halfWidth = width * (basalWidth + roundedWidth * 0.5) * ruffle;

      for (let column = 0; column <= widthSegments; column += 1) {
        const across = (column / widthSegments) * 2 - 1;
        const edgeCup = across * across * 0.085 * Math.sin(Math.PI * t);
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
          across * halfWidth,
          t * lift +
            t * t * curl * 0.3 +
            edgeCup +
            centerFold +
            faceOffset +
            edgeRipple * 0.025 +
            surfaceWave,
          t * length - tipNotch + bladeTwist + edgeRipple * 0.018 + lateralWave,
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
      indices.push(
        front,
        nextFront,
        front + 1,
        front + 1,
        nextFront,
        nextFront + 1,
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
    indices.push(
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
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createLeafGeometry(
  width: number,
  seed: number,
  shape: "ovate" | "lance" | "linear" | "lobed" = "ovate",
  serrationStrength = 0.07,
  curl = 0.35,
) {
  const geometry = new THREE.BufferGeometry();
  const rows = 16;
  const columns = 6;
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    const baseTaper = Math.sin(Math.PI * t);
    const taper =
      shape === "linear"
        ? Math.pow(baseTaper, 0.28) * (0.72 + t * 0.16)
        : shape === "lance"
          ? Math.pow(baseTaper, 0.48) * (0.76 + t * 0.22)
          : Math.pow(baseTaper, 0.72);
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
          edgeIrregularity,
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
}

export function createTaperedStem(
  curve: THREE.CatmullRomCurve3,
  thickness = 1,
  taper = 0.38,
) {
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
      const offset = frames.normals[segment]
        .clone()
        .multiplyScalar(Math.cos(angle) * radius)
        .add(
          frames.binormals[segment]
            .clone()
            .multiplyScalar(Math.sin(angle) * radius),
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
