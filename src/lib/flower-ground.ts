import * as THREE from "three";

let gardenGroundTexture: THREE.DataTexture | null = null;
let aquaticWaterTexture: THREE.DataTexture | null = null;

export function createGardenBladeGeometry(segments = 6) {
  const safeSegments = Math.max(3, Math.round(segments));
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let segment = 0; segment <= safeSegments; segment += 1) {
    const t = segment / safeSegments;
    const halfWidth = THREE.MathUtils.lerp(0.03, 0.002, Math.pow(t, 1.25));
    const bend = Math.pow(t, 1.7) * 0.12;
    const depth = Math.sin(t * Math.PI) * 0.012;
    positions.push(-halfWidth + bend, t, depth, halfWidth + bend, t, depth);
    uvs.push(0, t, 1, t);
  }

  for (let segment = 0; segment < safeSegments; segment += 1) {
    const lower = segment * 2;
    const upper = lower + 2;
    indices.push(lower, lower + 1, upper, lower + 1, upper + 1, upper);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function getGardenGroundPlacements(count = 38) {
  const safeCount = Math.max(0, Math.round(count));
  return Array.from({ length: safeCount }, (_, index) => {
    const random = (salt: number) => {
      const value = Math.sin(index * 78.233 + salt) * 43758.5453;
      return value - Math.floor(value);
    };
    const angle = random(17.3) * Math.PI * 2;
    const radius = THREE.MathUtils.lerp(1.15, 6.4, Math.sqrt(random(31.9)));
    const z = Math.sin(angle) * radius;
    const foregroundScale = THREE.MathUtils.lerp(
      1,
      0.28,
      THREE.MathUtils.smoothstep(z, 0.5, 5),
    );
    return {
      position: [Math.cos(angle) * radius, -3.035, z] as [
        number,
        number,
        number,
      ],
      height: THREE.MathUtils.lerp(0.16, 0.46, random(53.7)) * foregroundScale,
      lean: (random(79.1) - 0.5) * 0.32,
      rotation: random(97.3) * Math.PI * 2,
      tone: Math.min(2, Math.floor(random(113.9) * 3)),
      bladeCount: 3 + Math.floor(random(127.1) * 3),
      spread: THREE.MathUtils.lerp(0.035, 0.07, random(139.7)),
      widthScale: THREE.MathUtils.lerp(0.72, 1.18, random(151.3)),
    };
  });
}

export function getGardenBackdropPlacements(count = 12) {
  const safeCount = Math.max(0, Math.round(count));
  return Array.from({ length: safeCount }, (_, index) => {
    const random = (salt: number) => {
      const value = Math.sin(index * 91.731 + salt) * 43758.5453;
      return value - Math.floor(value);
    };
    const side = random(13.7) < 0.5 ? -1 : 1;

    return {
      position: [
        side * THREE.MathUtils.lerp(1.18, 4.6, random(29.1)),
        -3.04,
        -THREE.MathUtils.lerp(1.4, 5.8, random(43.3)),
      ] as [number, number, number],
      height: THREE.MathUtils.lerp(1.15, 2.72, random(59.9)),
      lean: (random(71.5) - 0.5) * 0.28,
      rotation: random(83.1) * Math.PI * 2,
      tone: Math.min(2, Math.floor(random(101.7) * 3)),
      bladeCount: 4 + Math.floor(random(117.3) * 3),
      spread: THREE.MathUtils.lerp(0.05, 0.1, random(131.9)),
      widthScale: THREE.MathUtils.lerp(0.82, 1.28, random(149.5)),
    };
  });
}

export function getGardenGroundTexture() {
  if (gardenGroundTexture) return gardenGroundTexture;

  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const broad =
        Math.sin(x * 0.19 + Math.sin(y * 0.11)) * 0.5 +
        Math.cos(y * 0.23 - x * 0.07) * 0.32;
      const fine = Math.sin(x * 1.71 + y * 2.13) * 0.18;
      const grain =
        Math.sin(x * 3.7 - y * 2.9 + Math.sin(y * 0.17)) *
        Math.cos(y * 2.4 + x * 0.31) *
        0.08;
      const greenPatch = Math.max(0, Math.sin(x * 0.08 - y * 0.06) - 0.34);
      const offset = (y * size + x) * 4;
      data[offset] = Math.round(
        154 + broad * 14 + fine * 7 + grain * 6 - greenPatch * 8,
      );
      data[offset + 1] = Math.round(
        144 + broad * 12 + fine * 5 + grain * 5 + greenPatch * 14,
      );
      data[offset + 2] = Math.round(108 + broad * 9 + fine * 4 + grain * 4);
      data[offset + 3] = 255;
    }
  }

  gardenGroundTexture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
  );
  gardenGroundTexture.colorSpace = THREE.SRGBColorSpace;
  gardenGroundTexture.wrapS = THREE.RepeatWrapping;
  gardenGroundTexture.wrapT = THREE.RepeatWrapping;
  // Keep the procedural patch large enough that a photographic crop does not
  // reveal a regular carpet of repeated tiles beneath the plant.
  gardenGroundTexture.repeat.set(3, 3);
  gardenGroundTexture.needsUpdate = true;
  return gardenGroundTexture;
}

export function getAquaticWaterTexture() {
  if (aquaticWaterTexture) return aquaticWaterTexture;

  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const ripple =
        Math.sin(Math.hypot(x - 54, y - 62) * 0.42) * 0.5 +
        Math.sin(x * 0.17 + y * 0.11) * 0.28 +
        Math.cos(y * 0.23 - x * 0.09) * 0.22;
      const offset = (y * size + x) * 4;
      data[offset] = Math.round(87 + ripple * 7);
      data[offset + 1] = Math.round(132 + ripple * 10);
      data[offset + 2] = Math.round(136 + ripple * 11);
      data[offset + 3] = 255;
    }
  }

  aquaticWaterTexture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
  );
  aquaticWaterTexture.colorSpace = THREE.SRGBColorSpace;
  aquaticWaterTexture.wrapS = THREE.RepeatWrapping;
  aquaticWaterTexture.wrapT = THREE.RepeatWrapping;
  aquaticWaterTexture.repeat.set(2, 2);
  aquaticWaterTexture.needsUpdate = true;
  return aquaticWaterTexture;
}
