import type { FlowerPreset } from "./flower-store";
import type { FlowerSpecies, LeafShape } from "./flower-species";

export type LeafTuning = {
  leafWidthScale: number;
  leafLengthScale: number;
  petioleScale: number;
  petioleLift: number;
  droopBias: number;
  curlScale: number;
  serrationScale: number;
  veinDensityScale: number;
  asymmetryScale: number;
  attachmentScale: number;
  attachmentShift: number;
  bladePitch: number;
  bladeRoll: number;
  bladeYaw: number;
  leafColorMix: number;
  leafShape?: LeafShape;
};

export function getHeroLeafTuning(
  preset: FlowerPreset,
  structure: FlowerSpecies,
): LeafTuning {
  const base: LeafTuning = {
    leafWidthScale: 1,
    leafLengthScale: 1,
    petioleScale: 1,
    petioleLift: 0,
    droopBias: 0,
    curlScale: 1,
    serrationScale: 1,
    veinDensityScale: 1,
    asymmetryScale: 1,
    attachmentScale: 1,
    attachmentShift: 0,
    bladePitch: 0,
    bladeRoll: 0,
    bladeYaw: 0,
    leafColorMix: 0.2,
    leafShape: structure.leafShape,
  };

  switch (preset) {
    case "Rose":
      return {
        ...base,
        leafWidthScale: 0.92,
        leafLengthScale: 0.88,
        petioleScale: 0.9,
        petioleLift: -0.01,
        droopBias: -0.04,
        curlScale: 0.84,
        serrationScale: 1.18,
        veinDensityScale: 1.12,
        asymmetryScale: 1.08,
        attachmentScale: 0.94,
        attachmentShift: -0.015,
        bladePitch: -0.02,
        bladeRoll: 0.04,
        bladeYaw: 0.04,
        leafColorMix: 0.18,
      };
    case "Poppy":
      return {
        ...base,
        leafWidthScale: 0.86,
        leafLengthScale: 0.94,
        petioleScale: 0.84,
        droopBias: 0.08,
        curlScale: 1.06,
        serrationScale: 1.22,
        veinDensityScale: 0.96,
        asymmetryScale: 1.1,
        attachmentScale: 0.9,
        attachmentShift: 0.02,
        bladePitch: 0.02,
        bladeRoll: -0.05,
        bladeYaw: -0.03,
        leafColorMix: 0.1,
      };
    case "Lily":
      return {
        ...base,
        leafWidthScale: 0.82,
        leafLengthScale: 1.16,
        petioleScale: 1.02,
        petioleLift: 0.02,
        droopBias: -0.02,
        curlScale: 0.9,
        serrationScale: 0.82,
        veinDensityScale: 1.04,
        asymmetryScale: 0.9,
        attachmentScale: 1.02,
        attachmentShift: 0.01,
        bladePitch: 0.06,
        bladeRoll: 0.02,
        bladeYaw: 0,
        leafColorMix: 0.14,
      };
    case "Sunflower":
      return {
        ...base,
        leafWidthScale: 1.1,
        leafLengthScale: 1.18,
        petioleScale: 1.12,
        petioleLift: -0.02,
        droopBias: 0.03,
        curlScale: 0.88,
        serrationScale: 1.02,
        veinDensityScale: 1.16,
        asymmetryScale: 1.04,
        attachmentScale: 1.04,
        attachmentShift: -0.01,
        bladePitch: 0.03,
        bladeRoll: 0.03,
        bladeYaw: 0.02,
        leafColorMix: 0.12,
      };
    case "Orchid":
      return {
        ...base,
        leafWidthScale: 0.72,
        leafLengthScale: 1.08,
        petioleScale: 0.76,
        petioleLift: 0.01,
        droopBias: -0.04,
        curlScale: 0.72,
        serrationScale: 0.7,
        veinDensityScale: 0.88,
        asymmetryScale: 0.84,
        attachmentScale: 0.88,
        attachmentShift: 0.04,
        bladePitch: 0.02,
        bladeRoll: -0.04,
        bladeYaw: 0.03,
        leafColorMix: 0.08,
      };
    case "Lotus":
      return {
        ...base,
        leafWidthScale: 1.18,
        leafLengthScale: 1.06,
        petioleScale: 1,
        petioleLift: 0,
        droopBias: -0.03,
        curlScale: 0.9,
        serrationScale: 0.72,
        veinDensityScale: 0.92,
        asymmetryScale: 0.9,
        attachmentScale: 1,
        attachmentShift: 0,
        bladePitch: 0.04,
        bladeRoll: 0.01,
        bladeYaw: -0.02,
        leafColorMix: 0.16,
      };
    default:
      return base;
  }
}
