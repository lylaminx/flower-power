export type LightingPreset =
  | "botanicalStudio"
  | "overcastGarden"
  | "morningBacklight"
  | "goldenHour"
  | "museumIllustration"
  | "macroPhotography";

export type LightingRig = {
  label: string;
  exposure: number;
  environmentIntensity: number;
  keyColor: string;
  keyIntensity: number;
  fillColor: string;
  fillIntensity: number;
  rimColor: string;
  rimIntensity: number;
  groundColor: string;
  environmentPreset: "studio" | "park" | "dawn" | "sunset" | "warehouse";
};

export const lightingPresets = [
  "botanicalStudio",
  "overcastGarden",
  "morningBacklight",
  "goldenHour",
  "museumIllustration",
  "macroPhotography",
] as const satisfies readonly LightingPreset[];

export const lightingRigs: Record<LightingPreset, LightingRig> = {
  botanicalStudio: {
    label: "Botanical studio",
    exposure: 0.96,
    environmentIntensity: 0.11,
    keyColor: "#fff8ef",
    keyIntensity: 2.4,
    fillColor: "#e8f1f4",
    fillIntensity: 1.15,
    rimColor: "#fff4e8",
    rimIntensity: 1.45,
    groundColor: "#e7e8e4",
    environmentPreset: "studio",
  },
  overcastGarden: {
    label: "Overcast garden",
    exposure: 1.02,
    environmentIntensity: 0.18,
    keyColor: "#eef3f1",
    keyIntensity: 1.55,
    fillColor: "#dfe9e6",
    fillIntensity: 1.2,
    rimColor: "#f1f5f2",
    rimIntensity: 0.72,
    groundColor: "#b9c2b7",
    environmentPreset: "park",
  },
  morningBacklight: {
    label: "Morning backlight",
    exposure: 0.94,
    environmentIntensity: 0.1,
    keyColor: "#ffd9a8",
    keyIntensity: 3.1,
    fillColor: "#cddff2",
    fillIntensity: 0.85,
    rimColor: "#fff0c7",
    rimIntensity: 2.5,
    groundColor: "#d4d0c4",
    environmentPreset: "dawn",
  },
  goldenHour: {
    label: "Golden hour",
    exposure: 0.9,
    environmentIntensity: 0.08,
    keyColor: "#ffbd72",
    keyIntensity: 2.8,
    fillColor: "#8396b5",
    fillIntensity: 0.58,
    rimColor: "#ffd29a",
    rimIntensity: 1.9,
    groundColor: "#8f7965",
    environmentPreset: "sunset",
  },
  museumIllustration: {
    label: "Museum illustration",
    exposure: 1,
    environmentIntensity: 0.06,
    keyColor: "#fffdf6",
    keyIntensity: 1.85,
    fillColor: "#f4f0e5",
    fillIntensity: 1.25,
    rimColor: "#ffffff",
    rimIntensity: 0.62,
    groundColor: "#f1eee3",
    environmentPreset: "warehouse",
  },
  macroPhotography: {
    label: "Macro photography",
    exposure: 0.92,
    environmentIntensity: 0.09,
    keyColor: "#fff5ea",
    keyIntensity: 2.65,
    fillColor: "#dce9ed",
    fillIntensity: 0.9,
    rimColor: "#ffffff",
    rimIntensity: 1.75,
    groundColor: "#c9cbc7",
    environmentPreset: "studio",
  },
};
