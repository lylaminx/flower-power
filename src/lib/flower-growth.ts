import * as THREE from "three";

export type FlowerGrowthPhase =
  "bud" | "opening" | "fresh" | "mature" | "wilting";

export type FlowerGrowthState = {
  phase: FlowerGrowthPhase;
  openness: number;
  reproductiveMaturity: number;
  moisture: number;
  wilt: number;
  calyxRelease: number;
};

export type FlowerPhaseTuning = {
  petalOpenScale: number;
  petalLiftScale: number;
  petalSpreadScale: number;
  petalCurlScale: number;
  calyxOpenScale: number;
  centerExposureScale: number;
  moistureScale: number;
  wiltScale: number;
};

export function getFlowerPhaseTuning(
  phase: FlowerGrowthPhase,
): FlowerPhaseTuning {
  switch (phase) {
    case "bud":
      return {
        petalOpenScale: 0.42,
        petalLiftScale: 1.28,
        petalSpreadScale: 0.72,
        petalCurlScale: 0.92,
        calyxOpenScale: 0.72,
        centerExposureScale: 0.28,
        moistureScale: 1,
        wiltScale: 0.08,
      };
    case "opening":
      return {
        petalOpenScale: 0.72,
        petalLiftScale: 1.12,
        petalSpreadScale: 0.88,
        petalCurlScale: 0.98,
        calyxOpenScale: 0.88,
        centerExposureScale: 0.62,
        moistureScale: 0.94,
        wiltScale: 0.18,
      };
    case "fresh":
      return {
        petalOpenScale: 1,
        petalLiftScale: 1,
        petalSpreadScale: 1,
        petalCurlScale: 1,
        calyxOpenScale: 1,
        centerExposureScale: 1,
        moistureScale: 1,
        wiltScale: 0.28,
      };
    case "mature":
      return {
        petalOpenScale: 0.96,
        petalLiftScale: 0.98,
        petalSpreadScale: 1.02,
        petalCurlScale: 1.02,
        calyxOpenScale: 1.02,
        centerExposureScale: 1.02,
        moistureScale: 0.9,
        wiltScale: 0.42,
      };
    case "wilting":
      return {
        petalOpenScale: 0.82,
        petalLiftScale: 0.84,
        petalSpreadScale: 0.9,
        petalCurlScale: 1.12,
        calyxOpenScale: 1.04,
        centerExposureScale: 0.9,
        moistureScale: 0.72,
        wiltScale: 1,
      };
    default:
      return {
        petalOpenScale: 1,
        petalLiftScale: 1,
        petalSpreadScale: 1,
        petalCurlScale: 1,
        calyxOpenScale: 1,
        centerExposureScale: 1,
        moistureScale: 1,
        wiltScale: 1,
      };
  }
}

export function getFlowerGrowthState(
  bloom: number,
  age: number,
): FlowerGrowthState {
  const openness = THREE.MathUtils.clamp(bloom, 0, 1);
  const normalizedAge = THREE.MathUtils.clamp(age, 0, 1);
  const reproductiveMaturity =
    THREE.MathUtils.smoothstep(openness, 0.28, 0.78) *
    THREE.MathUtils.lerp(1, 0.72, normalizedAge);
  const wilt =
    THREE.MathUtils.smoothstep(normalizedAge, 0.48, 1) *
    THREE.MathUtils.smoothstep(openness, 0.58, 1);
  const moisture = THREE.MathUtils.clamp(
    THREE.MathUtils.lerp(0.45, 1, openness) *
      THREE.MathUtils.lerp(1, 0.18, normalizedAge),
    0,
    1,
  );
  const calyxRelease = THREE.MathUtils.smoothstep(openness, 0.12, 0.7);
  const phase: FlowerGrowthPhase =
    openness < 0.24
      ? "bud"
      : openness < 0.68
        ? "opening"
        : normalizedAge > 0.58
          ? "wilting"
          : normalizedAge > 0.24
            ? "mature"
            : "fresh";

  return {
    phase,
    openness,
    reproductiveMaturity,
    moisture,
    wilt,
    calyxRelease,
  };
}
