import * as THREE from "three";

export type BotanicalSurface = "petal" | "leaf" | "stem" | "center";
export type BotanicalMaterialMap =
  "roughness" | "thickness" | "microNormal" | "moisture";

const textures = new Map<string, THREE.DataTexture>();
const materialTextures = new Map<string, THREE.DataTexture>();
const ageTextures = new Map<string, THREE.DataTexture>();

function proceduralNoise(x: number, y: number, frequency = 1) {
  const value =
    Math.sin(x * 12.9898 * frequency + y * 78.233 * frequency) * 43758.5453;
  return value - Math.floor(value);
}

/** Creates a color multiplier for edge oxidation, bruises, and tiny blemishes. */
export function getBotanicalAgeTexture(
  surface: Extract<BotanicalSurface, "petal" | "leaf">,
  age: number,
  seed: number,
  resolution = 128,
) {
  const normalizedAge = THREE.MathUtils.clamp(age, 0, 1);
  const ageStep = Math.round(normalizedAge * 32) / 32;
  const size = THREE.MathUtils.clamp(Math.round(resolution), 32, 512);
  const key = `${surface}:${ageStep}:${Math.round(seed)}:${size}`;
  const cached = ageTextures.get(key);
  if (cached) return cached;

  const data = new Uint8Array(size * size * 4);
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
      const offset = (y * size + x) * 4;

      if (surface === "petal") {
        data[offset] = Math.round(255 - damage * 42);
        data[offset + 1] = Math.round(255 - damage * 82);
        data[offset + 2] = Math.round(255 - damage * 105);
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
) {
  const size = THREE.MathUtils.clamp(Math.round(resolution), 32, 512);
  const key = `${surface}:${map}:${size}`;
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
        const nx =
          Math.sin(u * cellFrequency + Math.sin(v * 19)) * strength +
          (proceduralNoise(x + 1, y) - proceduralNoise(x - 1, y)) * 0.18;
        const ny =
          Math.cos(v * cellFrequency * 0.72 + Math.sin(u * 23)) * strength +
          (proceduralNoise(x, y + 1) - proceduralNoise(x, y - 1)) * 0.18;
        const normal = new THREE.Vector3(-nx, -ny, 1).normalize();
        const offset = (y * size + x) * 4;
        data[offset] = Math.round((normal.x * 0.5 + 0.5) * 255);
        data[offset + 1] = Math.round((normal.y * 0.5 + 0.5) * 255);
        data[offset + 2] = Math.round((normal.z * 0.5 + 0.5) * 255);
        data[offset + 3] = 255;
        continue;
      }

      if (map === "thickness") {
        if (surface === "petal") {
          const edgeTaper = THREE.MathUtils.smoothstep(margin, 0, 0.16);
          const tipTaper = THREE.MathUtils.smoothstep(1 - v, 0, 0.24);
          value = 70 + edgeTaper * 78 + (1 - tipTaper) * 38 + centerVein * 74;
        } else if (surface === "leaf") {
          const edgeTaper = THREE.MathUtils.smoothstep(margin, 0, 0.12);
          value = 92 + edgeTaper * 72 + centerVein * 82 + sideVeins * 28;
        } else {
          value = 210 + noise * 12;
        }
      } else if (map === "moisture") {
        const broadPatches =
          Math.sin(u * 9.7 + Math.sin(v * 7.1)) * Math.sin(v * 12.3 - u * 4.2);
        const droplets = Math.pow(proceduralNoise(x, y, 0.37), 20);
        value = 78 + broadPatches * 38 + droplets * 150 + noise * 12;
      } else if (surface === "petal") {
        // Silky veins reflect more cleanly while cell-rich margins scatter light.
        value = 190 - centerVein * 42 - sideVeins * 18 + noise * 18;
      } else if (surface === "leaf") {
        value = 205 - centerVein * 30 - sideVeins * 22 + noise * 24;
      } else if (surface === "stem") {
        value = 214 + Math.sin(u * Math.PI * 18) * 15 + noise * 18;
      } else {
        value = 225 - proceduralNoise(x, y, 2.4) * 48;
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
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(surface === "stem" ? 3 : 1, surface === "stem" ? 6 : 2);
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
) {
  const size = THREE.MathUtils.clamp(Math.round(resolution), 32, 512);
  const key = `${surface}:${size}`;
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
        const centerVein = Math.exp(-Math.pow((u - 0.5) / 0.035, 2)) * 48;
        const radiatingVeins =
          Math.pow(Math.abs(Math.sin(((u - 0.5) * 34) / (0.35 + v))), 22) *
          13 *
          v;
        const fineVeins =
          Math.pow(Math.abs(Math.sin((u - 0.5) * 48 + v * 8)), 18) * 18;
        const cells = Math.sin(u * 145 + Math.sin(v * 37)) * 2.5;
        value += centerVein + fineVeins * v + radiatingVeins + cells;
      } else if (surface === "leaf") {
        const centerVein = Math.exp(-Math.pow((u - 0.5) / 0.028, 2)) * 62;
        const sideVeins =
          Math.pow(Math.abs(Math.sin(v * 42 + Math.abs(u - 0.5) * 16)), 24) *
          34;
        const reticulation = Math.sin(u * 70 + v * 46) * 3;
        const chlorophyllMottle =
          Math.sin(u * 11 + Math.sin(v * 8)) * 5 + Math.sin(v * 17 + u * 6) * 3;
        const stomata =
          Math.pow(Math.abs(Math.sin(u * 96) * Math.sin(v * 84)), 24) * 10;
        value +=
          centerVein + sideVeins + reticulation + chlorophyllMottle + stomata;
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
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(surface === "stem" ? 3 : 1, surface === "stem" ? 6 : 2);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  textures.set(key, texture);
  return texture;
}
