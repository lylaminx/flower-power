import type { FlowerPreset } from "./flower-store";
import type { FlowerSpecies, PetalLayer } from "./flower-species";

export type PetalTuning = {
  lengthScale: number;
  widthScale: number;
  widthVariationScale: number;
  curlBias: number;
  thicknessScale: number;
  profileScale: number;
  edgeRuffleScale: number;
  baseDarkeningScale: number;
  translucencyScale: number;
  sheenScale: number;
  surfaceReliefScale: number;
  tessellationScale: number;
  foldBias: number;
  pleatStrength: number;
  petalPersistence: number;
  twistBias: number;
  baseWidthScale: number;
  guideStrengthScale: number;
  spotScale: number;
  asymmetryScale: number;
  asymmetryBias: number;
  lateralCupBias: number;
  longitudinalCurveBias: number;
  tipReflex: number;
  liftBias: number;
  liftVariationScale: number;
  placementAngleBias: number;
  placementRadialScale: number;
  placementRollBias: number;
  placementLiftBias: number;
  individualAngleJitter: number;
  individualRollJitter: number;
  individualLiftJitter: number;
};

export function getLotusPetalMaterialTuning(
  layerIndex: number,
  layerCount: number,
  face: number,
) {
  const depth = layerCount <= 1 ? 0 : layerIndex / (layerCount - 1);
  return {
    // Exposed outer petals read slightly more matte and irregular than the
    // protected inner petals; keep the range narrow so the flower stays waxy,
    // not chalky.
    roughnessOffset: depth * 0.035 + face * 0.012,
    clearcoatRoughness: 0.52 + depth * 0.075 + face * 0.045,
  };
}

export function getSunflowerRayMaterialTuning(
  index: number,
  count: number,
  face: number,
) {
  const radialVariation =
    Math.sin((index / Math.max(1, count)) * Math.PI * 2.39996 + 0.7) * 0.5 +
    0.5;
  return {
    roughnessOffset: radialVariation * 0.018 + face * 0.01,
    clearcoatRoughness: 0.48 + radialVariation * 0.055 + face * 0.04,
    sheenStrength: (face === 0 ? 0.072 : 0.056) + radialVariation * 0.008,
    sheenRoughness: 0.76 + radialVariation * 0.05 + face * 0.025,
    emissiveIntensity: 0.042 + face * 0.008,
  };
}

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
    widthVariationScale: 1,
    curlBias: role.curl,
    thicknessScale: role.thickness,
    profileScale: 1,
    edgeRuffleScale: 1,
    baseDarkeningScale: 1,
    translucencyScale: 1,
    sheenScale: 1,
    surfaceReliefScale: 1,
    tessellationScale: 1,
    foldBias: 0,
    pleatStrength: 0,
    petalPersistence: 1,
    twistBias: 0,
    baseWidthScale: 1,
    guideStrengthScale: 1,
    spotScale: 1,
    asymmetryScale: 1,
    asymmetryBias: 0,
    lateralCupBias: 0,
    longitudinalCurveBias: 0,
    tipReflex: 0,
    liftBias: 0,
    liftVariationScale: 1,
    placementAngleBias: 0,
    placementRadialScale: 1,
    placementRollBias: 0,
    placementLiftBias: 0,
    individualAngleJitter: 0,
    individualRollJitter: 0,
    individualLiftJitter: 0,
  };

  switch (preset) {
    case "Rose":
      return {
        ...tuning,
        lengthScale: 0.96 - depth * 0.03,
        widthScale: 0.98 - depth * 0.05,
        widthVariationScale: 1.35,
        curlBias: 0.06,
        thicknessScale: 1.12,
        profileScale: 1.05,
        edgeRuffleScale: 1.2,
        baseDarkeningScale: 0.92,
        translucencyScale: 0.82,
        sheenScale: 1.08,
        surfaceReliefScale: 1.75,
        tessellationScale: 1.24,
        tipReflex: 0.12,
        foldBias: 0.035,
        pleatStrength: 0.075,
        twistBias: 0.03,
        // Close the central petal junction from the floral face so persistent
        // sepals remain underside anatomy instead of showing through as a
        // green five-point plate around the reproductive whorl.
        baseWidthScale: 1.18,
        guideStrengthScale: 1.02,
        spotScale: 0.92,
        asymmetryScale: 1.35,
        liftBias: -0.02,
        placementAngleBias: 0.01,
        placementRadialScale: 0.72,
        placementRollBias: -0.02,
        placementLiftBias: -0.01,
        individualAngleJitter: 0.12,
        individualRollJitter: 0.18,
        individualLiftJitter: 0.075,
      };
    case "Poppy":
      return {
        ...tuning,
        lengthScale: 1.05,
        widthScale: 1.26,
        widthVariationScale: 0.45,
        curlBias: -0.08,
        thicknessScale: 0.68,
        profileScale: 0.9,
        edgeRuffleScale: 1.08,
        baseDarkeningScale: 0.84,
        translucencyScale: 1.5,
        sheenScale: 0.72,
        surfaceReliefScale: 1.72,
        tessellationScale: 1.65,
        tipReflex: 0.07,
        foldBias: -0.02,
        pleatStrength: 1.12,
        petalPersistence: 0.08,
        twistBias: -0.01,
        baseWidthScale: 1.55,
        guideStrengthScale: 0.88,
        spotScale: 1.1,
        asymmetryScale: 1.05,
        // A fully open corn poppy is a shallow saucer, not a perfectly flat
        // sheet. Keep the distal margin near the attachment plane while a
        // broad longitudinal crown gives the profile living bowl depth.
        liftBias: 0.04,
        longitudinalCurveBias: 0.55,
        liftVariationScale: 0.45,
        placementAngleBias: -0.02,
        placementRadialScale: 1.02,
        placementRollBias: 0.03,
        placementLiftBias: 0.01,
        individualAngleJitter: 0.11,
        individualRollJitter: 0.045,
        individualLiftJitter: 0.018,
      };
    case "Lily":
      return {
        ...tuning,
        // Lily's outer and inner three-part whorls are similar tepals, but not
        // clones: the outer members are longer and narrower, while the inner
        // members broaden around the reproductive column.
        lengthScale: 1.1 - depth * 0.05,
        widthScale: 1.02 + depth * 0.14,
        curlBias: 0.18,
        thicknessScale: 0.92,
        profileScale: 0.88,
        edgeRuffleScale: 0.92,
        baseDarkeningScale: 0.88,
        translucencyScale: 0.82,
        sheenScale: 0.95,
        // The long recurved free edge is a dominant part of the Lily
        // silhouette. Give it enough samples to keep the distal turnover
        // smooth at review resolution instead of exposing the shared grid.
        tessellationScale: 1.24,
        foldBias: 0.03,
        twistBias: 0.02,
        baseWidthScale: 2.35,
        guideStrengthScale: 0.98,
        spotScale: 1.08,
        asymmetryScale: 1,
        lateralCupBias: 0.3 + depth * 0.08,
        longitudinalCurveBias: 0.3,
        tipReflex: 0.78 - depth * 0.1,
        liftBias: 0.02,
        placementAngleBias: 0.02,
        placementRadialScale: 0.68,
        placementRollBias: 0.02,
        placementLiftBias: 0.02,
        // Preserve the six-part flower while breaking the mechanically exact
        // star made by identically seated tepals.
        individualAngleJitter: 0.075,
        individualRollJitter: 0.09,
        individualLiftJitter: 0.04,
      };
    case "Sunflower":
      return {
        ...tuning,
        lengthScale: 1,
        // Wild species-form ligules leave readable clefts between neighbors;
        // the previous broad profile merged the 18 rays into a nearly solid
        // decorative rosette at the locked identifying distance.
        widthScale: 0.72,
        widthVariationScale: 1.28,
        curlBias: -0.03,
        thicknessScale: 0.58,
        profileScale: 1.02,
        edgeRuffleScale: 0.72,
        baseDarkeningScale: 0.88,
        translucencyScale: 1.36,
        sheenScale: 0.74,
        // Reveal the existing vascular and interveinal normal hierarchy under
        // front light without changing its frequencies or adding grain.
        surfaceReliefScale: 1.58,
        tessellationScale: 1.28,
        tipReflex: 0.12,
        foldBias: 0.045,
        twistBias: 0.025,
        baseWidthScale: 0.94,
        guideStrengthScale: 1.15,
        spotScale: 0.75,
        asymmetryScale: 0.92,
        liftBias: -0.02,
        placementAngleBias: 0,
        placementRadialScale: 1.04,
        placementRollBias: -0.03,
        placementLiftBias: -0.01,
        // Composite rays are individually seated around the disk; keep the
        // offsets small enough to preserve a coherent circular head.
        individualAngleJitter: 0.055,
        individualRollJitter: 0.08,
        individualLiftJitter: 0.03,
      };
    case "Orchid":
      return {
        ...tuning,
        lengthScale: role.length,
        widthScale: layer.role === "lip" ? 0.86 : role.width,
        curlBias: role.curl - 0.02,
        thicknessScale: 0.72,
        profileScale: 0.88,
        edgeRuffleScale: 0.9,
        baseDarkeningScale: 0.9,
        translucencyScale: layer.role === "lip" ? 0.92 : 1.34,
        sheenScale: layer.role === "lip" ? 0.88 : 1.24,
        surfaceReliefScale: 0.92,
        tipReflex: layer.role === "lip" ? 0.08 : 0.14,
        foldBias: layer.role === "lip" ? 0.08 : 0.02,
        twistBias: layer.role === "lip" ? 0.06 : 0.02,
        baseWidthScale: layer.role === "lip" ? 1.02 : 0.96,
        guideStrengthScale: layer.role === "lip" ? 1.55 : 1,
        spotScale: layer.role === "lip" ? 1.12 : 0.9,
        asymmetryScale: 1.12,
        asymmetryBias: layer.role === "lip" ? 0.03 : 0,
        lateralCupBias: layer.role === "lip" ? 0.38 : 0.05,
        longitudinalCurveBias: layer.role === "lip" ? -0.22 : -0.04,
        liftBias: layer.role === "lip" ? -0.06 : 0.01,
        placementAngleBias: layer.role === "lip" ? 0.18 : 0.04,
        placementRadialScale: layer.role === "lip" ? 1.08 : 0.96,
        placementRollBias: layer.role === "lip" ? 0.08 : 0.02,
        placementLiftBias: layer.role === "lip" ? -0.03 : 0.005,
      };
    case "Lotus":
      return {
        ...tuning,
        lengthScale: 0.96 - depth * 0.05,
        widthScale: 1 - depth * 0.04,
        curlBias: 0.06 - depth * 0.035,
        thicknessScale: 1.04,
        profileScale: 0.96,
        edgeRuffleScale: 0.82,
        baseDarkeningScale: 0.94,
        translucencyScale: 1.34,
        sheenScale: 0.86,
        surfaceReliefScale: 1.18,
        tipReflex: 0.16 - depth * 0.04,
        foldBias: 0.04,
        pleatStrength: 0.18,
        twistBias: 0.02,
        baseWidthScale: 1.02,
        guideStrengthScale: 0.96,
        spotScale: 0.94,
        asymmetryScale: 0.94,
        liftBias: 0.03 - depth * 0.045,
        placementAngleBias: -0.02,
        placementRadialScale: 1.02 + depth * 0.12,
        placementRollBias: -0.02,
        placementLiftBias: 0.015 - depth * 0.025,
      };
    default:
      return tuning;
  }
}
