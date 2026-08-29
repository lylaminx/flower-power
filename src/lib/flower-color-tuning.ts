import * as THREE from "three";
import type { FlowerPreset } from "./flower-store";

export function getHeroPetalAttenuationDistance(
  preset: FlowerPreset,
  role?: string,
) {
  if (preset === "Orchid" && role === "lip") return 0.68;
  if (preset === "Orchid") return 0.86;
  if (preset === "Lily") return 1;
  if (preset === "Lotus") return 1.1;
  if (preset === "Sunflower" && role === "ray") return 1.05;
  if (preset === "Rose") return 1.1;
  if (preset === "Poppy") return 1;
  return 1.25;
}

export function getHeroPetalTransmissionFactor(
  preset: FlowerPreset,
  role?: string,
) {
  if (preset === "Poppy") return 0.42;
  if (preset === "Sunflower" && role === "ray") return 0.38;
  return 0.22;
}

export function getHeroPetalColorVariationScale(preset: FlowerPreset) {
  return preset === "Rose"
    ? 1.45
    : preset === "Poppy"
      ? 1.2
      : preset === "Orchid"
        ? 1.15
        : preset === "Sunflower"
          ? 1.12
          : preset === "Lily"
            ? 1.1
            : preset === "Lotus"
              ? 1.06
              : 1;
}

export function getHeroMainStemColor(
  preset: FlowerPreset,
  baseColor: THREE.ColorRepresentation,
) {
  const color = new THREE.Color(baseColor);
  return preset === "Rose"
    ? color.lerp(new THREE.Color("#806347"), 0.38)
    : preset === "Sunflower"
      ? color.lerp(new THREE.Color("#66864f"), 0.24)
      : preset === "Poppy"
        ? color.lerp(new THREE.Color("#829b8e"), 0.68)
        : preset === "Lotus"
          ? color.lerp(new THREE.Color("#718c68"), 0.22)
          : preset === "Orchid"
            ? color.lerp(new THREE.Color("#607158"), 0.18)
            : color;
}

export function getHeroPetioleColor(
  preset: FlowerPreset,
  baseColor: THREE.ColorRepresentation,
) {
  const color = new THREE.Color(baseColor);
  if (preset === "Lotus") {
    return color.lerp(new THREE.Color("#77936f"), 0.28);
  }
  if (preset === "Poppy") {
    return color.lerp(new THREE.Color("#829b8e"), 0.68);
  }
  if (preset === "Orchid") {
    return color.lerp(new THREE.Color("#607158"), 0.18);
  }
  if (preset === "Rose") {
    return color.lerp(new THREE.Color("#74a365"), 0.34);
  }
  if (preset === "Sunflower") {
    return color.lerp(new THREE.Color("#6b8952"), 0.26);
  }
  return color;
}

export function getHeroSupportTissueColor(
  preset: FlowerPreset,
  baseColor: THREE.ColorRepresentation,
  organ: "leaf" | "calyx",
) {
  const color = new THREE.Color(baseColor);
  if (preset === "Poppy" && organ === "leaf") {
    return color.lerp(new THREE.Color("#94aa91"), 0.72);
  }
  if (preset === "Lily" && organ === "leaf") {
    return color.lerp(new THREE.Color("#86a35c"), 0.56);
  }
  if (preset === "Sunflower") {
    return color.lerp(
      new THREE.Color(organ === "leaf" ? "#789a5d" : "#587746"),
      organ === "leaf" ? 0.52 : 0.22,
    );
  }
  if (preset !== "Rose") return color;
  return color.lerp(
    new THREE.Color(organ === "leaf" ? "#74a365" : "#668e55"),
    organ === "leaf" ? 0.34 : 0.24,
  );
}

export function getSunflowerLeafColorVariation(
  seed: number,
  attachmentT: number,
  side: number,
) {
  const attachment = Math.round(
    THREE.MathUtils.clamp(attachmentT, 0, 1) * 1000,
  );
  const random = (salt: number) => {
    const value =
      Math.sin(seed * 12.9898 + attachment * 78.233 + side * 37.719 + salt) *
      43758.5453;
    return value - Math.floor(value);
  };
  return {
    hueOffset: (random(19.7) - 0.5) * 0.018,
    saturationOffset: (random(43.1) - 0.5) * 0.05,
    lightnessOffset: (random(71.3) - 0.5) * 0.045,
  };
}

export function getSunflowerPhyllaryColor(
  baseColor: THREE.ColorRepresentation,
  whorl: number,
) {
  const base = getHeroSupportTissueColor("Sunflower", baseColor, "calyx");
  const normalizedWhorl = THREE.MathUtils.clamp(Math.round(whorl), 0, 2);
  const targets = ["#4f713e", "#668448", "#78934f"] as const;
  const mixes = [0.2, 0.3, 0.38] as const;
  return base.lerp(
    new THREE.Color(targets[normalizedWhorl]),
    mixes[normalizedWhorl],
  );
}
