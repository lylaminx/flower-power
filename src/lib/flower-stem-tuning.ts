import type { FlowerPreset } from "./flower-store";
import type { CalyxForm, FlowerSpecies } from "./flower-species";

export type StemTuning = {
  curveScale: number;
  topBendX: number;
  topBendZ: number;
  midBendX: number;
  midBendZ: number;
  stemHeightScale: number;
  stemThicknessScale: number;
  stemTaperScale: number;
  stemHairinessScale: number;
  stemNodeCountScale: number;
  stemNodeSpacingBias: number;
  stemNodeBulgeScale: number;
  stemLenticelScale: number;
  calyxForm?: CalyxForm;
  sepalSizeScale: number;
  sepalSpreadScale: number;
  sepalLengthScale: number;
  calyxLiftBias: number;
  calyxScaleX: number;
  calyxScaleY: number;
  calyxScaleZ: number;
};

export function getHeroStemTuning(
  preset: FlowerPreset,
  structure: FlowerSpecies,
): StemTuning {
  const base: StemTuning = {
    curveScale: 1,
    topBendX: 0,
    topBendZ: 0,
    midBendX: 0,
    midBendZ: 0,
    stemHeightScale: 1,
    stemThicknessScale: 1,
    stemTaperScale: 1,
    stemHairinessScale: 1,
    stemNodeCountScale: 1,
    stemNodeSpacingBias: 0,
    stemNodeBulgeScale: 1,
    stemLenticelScale: 1,
    sepalSizeScale: 1,
    sepalSpreadScale: 1,
    sepalLengthScale: 1,
    calyxLiftBias: 0,
    calyxScaleX: 1,
    calyxScaleY: 1,
    calyxScaleZ: 1,
    calyxForm: structure.calyxForm,
  };

  switch (preset) {
    case "Rose":
      return {
        ...base,
        curveScale: 0.82,
        topBendX: -0.02,
        midBendX: -0.03,
        stemHeightScale: 0.98,
        stemThicknessScale: 0.96,
        stemTaperScale: 0.96,
        stemHairinessScale: 1.16,
        stemNodeCountScale: 1.18,
        stemNodeSpacingBias: -0.01,
        stemNodeBulgeScale: 1.16,
        stemLenticelScale: 1.1,
        sepalSizeScale: 0.96,
        sepalSpreadScale: 0.88,
        sepalLengthScale: 0.92,
        calyxLiftBias: -0.04,
        calyxScaleX: 1.04,
        calyxScaleY: 0.92,
        calyxScaleZ: 1.04,
      };
    case "Poppy":
      return {
        ...base,
        curveScale: 0.72,
        topBendX: 0.02,
        midBendX: 0.01,
        stemHeightScale: 1.02,
        stemThicknessScale: 0.84,
        stemTaperScale: 0.9,
        stemHairinessScale: 0.72,
        stemNodeCountScale: 0.84,
        stemNodeSpacingBias: 0.03,
        stemNodeBulgeScale: 0.86,
        stemLenticelScale: 0.82,
        sepalSizeScale: 0.88,
        sepalSpreadScale: 0.8,
        sepalLengthScale: 0.82,
        calyxForm: "cupped",
        calyxLiftBias: -0.02,
        calyxScaleX: 0.9,
        calyxScaleY: 0.84,
        calyxScaleZ: 0.9,
      };
    case "Lily":
      return {
        ...base,
        curveScale: 0.9,
        topBendX: 0.01,
        topBendZ: -0.01,
        stemHeightScale: 1.08,
        stemThicknessScale: 0.9,
        stemTaperScale: 0.88,
        stemHairinessScale: 0.62,
        stemNodeCountScale: 1.08,
        stemNodeSpacingBias: -0.02,
        stemNodeBulgeScale: 0.82,
        stemLenticelScale: 0.88,
        sepalSizeScale: 1.02,
        sepalSpreadScale: 1,
        sepalLengthScale: 1.04,
        calyxForm: "reflexed",
        calyxLiftBias: 0.02,
        calyxScaleX: 0.96,
        calyxScaleY: 1,
        calyxScaleZ: 0.96,
      };
    case "Sunflower":
      return {
        ...base,
        curveScale: 0.62,
        topBendX: 0.03,
        topBendZ: -0.02,
        stemHeightScale: 1.12,
        stemThicknessScale: 1.18,
        stemTaperScale: 0.92,
        stemHairinessScale: 1.36,
        stemNodeCountScale: 1.24,
        stemNodeSpacingBias: -0.02,
        stemNodeBulgeScale: 1.18,
        stemLenticelScale: 1.14,
        sepalSizeScale: 1.08,
        sepalSpreadScale: 1.08,
        sepalLengthScale: 1.1,
        calyxForm: "bracted",
        calyxLiftBias: -0.03,
        calyxScaleX: 1.08,
        calyxScaleY: 1.06,
        calyxScaleZ: 1.08,
      };
    case "Orchid":
      return {
        ...base,
        curveScale: 1.04,
        topBendX: 0.12,
        topBendZ: 0.02,
        midBendX: 0.18,
        midBendZ: -0.04,
        stemHeightScale: 1.14,
        stemThicknessScale: 0.88,
        stemTaperScale: 0.84,
        stemHairinessScale: 0.42,
        stemNodeCountScale: 0.92,
        stemNodeSpacingBias: 0.05,
        stemNodeBulgeScale: 0.7,
        stemLenticelScale: 0.68,
        sepalSizeScale: 0.94,
        sepalSpreadScale: 0.82,
        sepalLengthScale: 0.92,
        calyxLiftBias: 0.04,
        calyxScaleX: 0.92,
        calyxScaleY: 0.88,
        calyxScaleZ: 0.92,
      };
    case "Lotus":
      return {
        ...base,
        curveScale: 0.58,
        topBendX: -0.01,
        midBendX: 0,
        stemHeightScale: 1.04,
        stemThicknessScale: 0.9,
        stemTaperScale: 0.92,
        stemHairinessScale: 0.36,
        stemNodeCountScale: 0.72,
        stemNodeSpacingBias: 0.08,
        stemNodeBulgeScale: 0.78,
        stemLenticelScale: 0.64,
        sepalSizeScale: 1.02,
        sepalSpreadScale: 0.92,
        sepalLengthScale: 0.96,
        calyxLiftBias: 0.02,
        calyxScaleX: 0.98,
        calyxScaleY: 0.96,
        calyxScaleZ: 0.98,
      };
    default:
      return base;
  }
}
