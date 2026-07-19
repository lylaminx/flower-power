import type { FlowerPreset } from "./flower-store";
import type { FlowerSpecies, PetalLayer } from "./flower-species";

export type PetalTuning = {
  lengthScale: number;
  widthScale: number;
  curlBias: number;
  thicknessScale: number;
  profileScale: number;
  edgeRuffleScale: number;
  baseDarkeningScale: number;
  translucencyScale: number;
  sheenScale: number;
  foldBias: number;
  twistBias: number;
  baseWidthScale: number;
  guideStrengthScale: number;
  spotScale: number;
  asymmetryScale: number;
  asymmetryBias: number;
  lateralCupBias: number;
  longitudinalCurveBias: number;
  liftBias: number;
  placementAngleBias: number;
  placementRadialScale: number;
  placementRollBias: number;
  placementLiftBias: number;
};

function roleScale(layer: PetalLayer) {
  switch (layer.role) {
    case "sepal":
      return { length: 0.9, width: 0.9, curl: -0.06, thickness: 0.92 };
    case "lip":
      return { length: 0.92, width: 1.18, curl: -0.04, thickness: 0.86 };
    case "ray":
      return { length: 1.05, width: 0.92, curl: -0.03, thickness: 0.9 };
    default:
      return { length: 1, width: 1, curl: 0, thickness: 1 };
  }
}

export function getHeroPetalTuning(
  preset: FlowerPreset,
  structure: FlowerSpecies,
  layer: PetalLayer,
  layerIndex: number,
  layerCount: number,
): PetalTuning {
  const depth = layerCount <= 1 ? 0 : layerIndex / (layerCount - 1);
  const role = roleScale(layer);
  const tuning: PetalTuning = {
    lengthScale: role.length,
    widthScale: role.width,
    curlBias: role.curl,
    thicknessScale: role.thickness,
    profileScale: 1,
    edgeRuffleScale: 1,
    baseDarkeningScale: 1,
    translucencyScale: 1,
    sheenScale: 1,
    foldBias: 0,
    twistBias: 0,
    baseWidthScale: 1,
    guideStrengthScale: 1,
    spotScale: 1,
    asymmetryScale: 1,
    asymmetryBias: 0,
    lateralCupBias: 0,
    longitudinalCurveBias: 0,
    liftBias: 0,
    placementAngleBias: 0,
    placementRadialScale: 1,
    placementRollBias: 0,
    placementLiftBias: 0,
  };

  switch (preset) {
    case "Rose":
      return {
        ...tuning,
        lengthScale: 0.96 - depth * 0.03,
        widthScale: 0.98 - depth * 0.05,
        curlBias: 0.12,
        thicknessScale: 1.12,
        profileScale: 1.05,
        edgeRuffleScale: 1.2,
        baseDarkeningScale: 0.92,
        translucencyScale: 0.82,
        sheenScale: 1.08,
        foldBias: 0.06,
        twistBias: 0.03,
        baseWidthScale: 1.04,
        guideStrengthScale: 1.02,
        spotScale: 0.92,
        asymmetryScale: 0.9,
        liftBias: -0.02,
        placementAngleBias: 0.01,
        placementRadialScale: 0.98,
        placementRollBias: -0.02,
        placementLiftBias: -0.01,
      };
    case "Poppy":
      return {
        ...tuning,
        lengthScale: 1.05,
        widthScale: 1.06,
        curlBias: -0.08,
        thicknessScale: 0.68,
        profileScale: 0.9,
        edgeRuffleScale: 1.08,
        baseDarkeningScale: 0.84,
        translucencyScale: 1.5,
        sheenScale: 0.72,
        foldBias: -0.02,
        twistBias: -0.01,
        baseWidthScale: 0.96,
        guideStrengthScale: 0.88,
        spotScale: 1.1,
        asymmetryScale: 1.05,
        liftBias: -0.04,
        placementAngleBias: -0.02,
        placementRadialScale: 1.02,
        placementRollBias: 0.03,
        placementLiftBias: 0.01,
      };
    case "Lily":
      return {
        ...tuning,
        lengthScale: 1.08,
        widthScale: 0.78,
        curlBias: 0.18,
        thicknessScale: 0.92,
        profileScale: 0.88,
        edgeRuffleScale: 0.72,
        baseDarkeningScale: 0.88,
        translucencyScale: 0.82,
        sheenScale: 0.95,
        foldBias: 0.03,
        twistBias: 0.02,
        baseWidthScale: 0.95,
        guideStrengthScale: 0.98,
        spotScale: 1.08,
        asymmetryScale: 1,
        liftBias: 0.02,
        placementAngleBias: 0.02,
        placementRadialScale: 0.92,
        placementRollBias: 0.02,
        placementLiftBias: 0.02,
      };
    case "Sunflower":
      return {
        ...tuning,
        lengthScale: 1,
        widthScale: 0.92,
        curlBias: -0.03,
        thicknessScale: 0.84,
        profileScale: 1.02,
        edgeRuffleScale: 0.85,
        baseDarkeningScale: 0.88,
        translucencyScale: 0.72,
        sheenScale: 0.82,
        foldBias: 0,
        twistBias: 0,
        baseWidthScale: 0.94,
        guideStrengthScale: 1.15,
        spotScale: 0.75,
        asymmetryScale: 0.92,
        liftBias: -0.02,
        placementAngleBias: 0,
        placementRadialScale: 1.04,
        placementRollBias: -0.03,
        placementLiftBias: -0.01,
      };
    case "Orchid":
      return {
        ...tuning,
        lengthScale: role.length,
        widthScale: role.width,
        curlBias: role.curl - 0.02,
        thicknessScale: 0.84,
        profileScale: 0.88,
        edgeRuffleScale: 0.9,
        baseDarkeningScale: 0.9,
        translucencyScale: 0.92,
        sheenScale: 1.12,
        foldBias: layer.role === "lip" ? 0.08 : 0.02,
        twistBias: layer.role === "lip" ? 0.06 : 0.02,
        baseWidthScale: layer.role === "lip" ? 0.88 : 0.96,
        guideStrengthScale: layer.role === "lip" ? 1.2 : 1,
        spotScale: layer.role === "lip" ? 1.12 : 0.9,
        asymmetryScale: 1.12,
        asymmetryBias: layer.role === "lip" ? 0.03 : 0,
        lateralCupBias: layer.role === "lip" ? 0.22 : 0.05,
        longitudinalCurveBias: layer.role === "lip" ? -0.12 : -0.04,
        liftBias: layer.role === "lip" ? -0.06 : 0.01,
        placementAngleBias: layer.role === "lip" ? 0.18 : 0.04,
        placementRadialScale: layer.role === "lip" ? 1.08 : 0.96,
        placementRollBias: layer.role === "lip" ? 0.08 : 0.02,
        placementLiftBias: layer.role === "lip" ? -0.03 : 0.005,
      };
    case "Lotus":
      return {
        ...tuning,
        lengthScale: 0.96,
        widthScale: 1,
        curlBias: 0.06,
        thicknessScale: 1.06,
        profileScale: 0.96,
        edgeRuffleScale: 0.82,
        baseDarkeningScale: 0.94,
        translucencyScale: 0.88,
        sheenScale: 1.08,
        foldBias: 0.04,
        twistBias: 0.02,
        baseWidthScale: 1.02,
        guideStrengthScale: 0.96,
        spotScale: 0.94,
        asymmetryScale: 0.94,
        liftBias: 0.03,
        placementAngleBias: -0.02,
        placementRadialScale: 1.02,
        placementRollBias: -0.02,
        placementLiftBias: 0.015,
      };
    default:
      return tuning;
  }
}
