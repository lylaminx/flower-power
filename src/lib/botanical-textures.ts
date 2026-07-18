import * as THREE from "three";

export type BotanicalSurface = "petal" | "leaf" | "stem" | "center";

const textures = new Map<BotanicalSurface, THREE.DataTexture>();

export function getBotanicalTexture(surface: BotanicalSurface) {
  const cached = textures.get(surface);
  if (cached) return cached;

  const size = 128;
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
  textures.set(surface, texture);
  return texture;
}
