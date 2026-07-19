import type { FlowerPreset } from "./flower-store";
import type { CenterArchitecture, FlowerSpecies } from "./flower-species";

export type CenterTuning = {
  radiusScale: number;
  heightScale: number;
  densityScale: number;
  sizeScale: number;
  spreadScale: number;
  floretCountScale: number;
  floretSizeScale: number;
  seedpodPitScale: number;
  seedpodPitDepthScale: number;
  stamenCountScale: number;
  stamenLengthScale: number;
  antherSizeScale: number;
  stigmaSizeScale: number;
  styleLengthScale: number;
  ovaryScale: number;
  displayColorMix: number;
};

export function getHeroCenterTuning(
  preset: FlowerPreset,
  structure: FlowerSpecies,
  architecture: CenterArchitecture,
): CenterTuning {
  const base: CenterTuning = {
    radiusScale: 1,
    heightScale: 1,
    densityScale: 1,
    sizeScale: 1,
    spreadScale: 1,
    floretCountScale: 1,
    floretSizeScale: 1,
    seedpodPitScale: 1,
    seedpodPitDepthScale: 1,
    stamenCountScale: 1,
    stamenLengthScale: 1,
    antherSizeScale: 1,
    stigmaSizeScale: 1,
    styleLengthScale: 1,
    ovaryScale: 1,
    displayColorMix: 0.5,
  };

  switch (preset) {
    case "Rose":
      return {
        ...base,
        radiusScale: 0.84,
        heightScale: 0.88,
        densityScale: 1.08,
        sizeScale: 0.9,
        spreadScale: 0.9,
        floretCountScale: 0.9,
        floretSizeScale: 0.88,
        stamenCountScale: 1.04,
        stamenLengthScale: 0.96,
        antherSizeScale: 0.9,
        stigmaSizeScale: 0.92,
        styleLengthScale: 0.92,
        ovaryScale: 0.86,
        displayColorMix: 0.28,
      };
    case "Poppy":
      return {
        ...base,
        radiusScale: 0.92,
        heightScale: 0.82,
        densityScale: 1.1,
        sizeScale: 1,
        spreadScale: 1.06,
        floretCountScale: 0.94,
        floretSizeScale: 0.92,
        stamenCountScale: 1.16,
        stamenLengthScale: 1.22,
        antherSizeScale: 1.06,
        stigmaSizeScale: 1.1,
        styleLengthScale: 1.12,
        ovaryScale: 0.8,
        displayColorMix: 0.18,
      };
    case "Lily":
      return {
        ...base,
        radiusScale: 0.8,
        heightScale: 0.9,
        densityScale: 0.92,
        sizeScale: 0.92,
        spreadScale: 0.9,
        floretCountScale: 1,
        floretSizeScale: 0.88,
        stamenCountScale: 0.96,
        stamenLengthScale: 1.12,
        antherSizeScale: 1.08,
        stigmaSizeScale: 0.98,
        styleLengthScale: 1.16,
        ovaryScale: 0.9,
        displayColorMix: 0.48,
      };
    case "Sunflower":
      return {
        ...base,
        radiusScale: 1.04,
        heightScale: 0.76,
        densityScale: 1.22,
        sizeScale: 1.08,
        spreadScale: 0.9,
        floretCountScale: 1,
        floretSizeScale: 0.84,
        seedpodPitScale: 0.88,
        seedpodPitDepthScale: 0.82,
        stamenCountScale: 1.08,
        stamenLengthScale: 0.88,
        antherSizeScale: 0.96,
        stigmaSizeScale: 0.94,
        styleLengthScale: 0.88,
        ovaryScale: 1.08,
        displayColorMix: 0.66,
      };
    case "Orchid":
      return {
        ...base,
        radiusScale: 0.76,
        heightScale: 1.08,
        densityScale: 0.84,
        sizeScale: 0.92,
        spreadScale: 0.76,
        floretCountScale: architecture === "column" ? 0.5 : 0.72,
        floretSizeScale: 0.84,
        stamenCountScale: 0.7,
        stamenLengthScale: 0.82,
        antherSizeScale: 0.88,
        stigmaSizeScale: 0.96,
        styleLengthScale: 1.08,
        ovaryScale: 0.76,
        displayColorMix: 0.34,
      };
    case "Lotus":
      return {
        ...base,
        radiusScale: 1.08,
        heightScale: 1.12,
        densityScale: 1.04,
        sizeScale: 1,
        spreadScale: 0.92,
        floretCountScale: 0.96,
        floretSizeScale: 1,
        seedpodPitScale: 1.12,
        seedpodPitDepthScale: 1.16,
        stamenCountScale: 1,
        stamenLengthScale: 0.86,
        antherSizeScale: 0.9,
        stigmaSizeScale: 0.88,
        styleLengthScale: 0.82,
        ovaryScale: 1.14,
        displayColorMix: 0.52,
      };
    default:
      return base;
  }
}
