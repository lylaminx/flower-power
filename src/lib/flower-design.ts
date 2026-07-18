import {
  flowerPresets,
  type FlowerSettings,
  type FlowerState,
} from "./flower-store";

export type SaveFlowerInput = {
  name: string;
  settings: FlowerSettings;
};

export type SavedFlowerSummary = {
  id: string;
  name: string;
  preset: FlowerSettings["preset"];
  renderMode: FlowerSettings["renderMode"];
  seed: number;
  createdAt: string;
  updatedAt: string;
};

export type SavedFlower = SavedFlowerSummary & {
  settings: FlowerSettings;
};

export function selectFlowerSettings(state: FlowerState): FlowerSettings {
  return {
    renderMode: state.renderMode,
    preset: state.preset,
    petalCount: state.petalCount,
    petalLength: state.petalLength,
    petalWidth: state.petalWidth,
    petalCurl: state.petalCurl,
    petalWaviness: state.petalWaviness,
    petalThickness: state.petalThickness,
    petalFold: state.petalFold,
    petalTwist: state.petalTwist,
    petalRuffle: state.petalRuffle,
    petalNotch: state.petalNotch,
    petalVeinStrength: state.petalVeinStrength,
    petalBaseWidth: state.petalBaseWidth,
    petalAge: state.petalAge,
    petalSpots: state.petalSpots,
    petalGuideStrength: state.petalGuideStrength,
    bloom: state.bloom,
    variation: state.variation,
    petalColor: state.petalColor,
    petalTipColor: state.petalTipColor,
    centerColor: state.centerColor,
    centerDensity: state.centerDensity,
    centerSize: state.centerSize,
    centerProfile: state.centerProfile,
    centerFloretSize: state.centerFloretSize,
    centerSpread: state.centerSpread,
    centerStamenLength: state.centerStamenLength,
    centerAntherSize: state.centerAntherSize,
    centerStigmaSize: state.centerStigmaSize,
    stemColor: state.stemColor,
    backgroundColor: state.backgroundColor,
    stemCurve: state.stemCurve,
    stemHeight: state.stemHeight,
    stemThickness: state.stemThickness,
    stemTaper: state.stemTaper,
    stemNodeCount: state.stemNodeCount,
    stemHairDensity: state.stemHairDensity,
    leafDensity: state.leafDensity,
    leafLength: state.leafLength,
    leafWidth: state.leafWidth,
    leafCurl: state.leafCurl,
    leafSerration: state.leafSerration,
    leafVeinDensity: state.leafVeinDensity,
    leafDroop: state.leafDroop,
    bloomTilt: state.bloomTilt,
    bloomTurn: state.bloomTurn,
    lightIntensity: state.lightIntensity,
    seed: state.seed,
    grid: state.grid,
  };
}

const hexColor = /^#[0-9a-f]{6}$/i;

export function isSaveFlowerInput(value: unknown): value is SaveFlowerInput {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SaveFlowerInput>;
  const settings = candidate.settings as Partial<FlowerSettings> | undefined;

  return Boolean(
    typeof candidate.name === "string" &&
    candidate.name.trim().length >= 1 &&
    candidate.name.trim().length <= 120 &&
    settings &&
    (flowerPresets as readonly string[]).includes(settings.preset ?? "") &&
    ["color", "line", "photo"].includes(settings.renderMode ?? "") &&
    Number.isInteger(settings.seed) &&
    (settings.seed ?? -1) >= 0 &&
    Number.isInteger(settings.petalCount) &&
    (settings.petalCount ?? 0) >= 1 &&
    (settings.petalCount ?? 101) <= 100 &&
    isNumber(settings.petalLength, 0) &&
    isNumber(settings.petalWidth, 0) &&
    isNumber(settings.petalCurl, 0, 1) &&
    isNumber(settings.petalWaviness, 0, 1) &&
    isNumber(settings.petalThickness, 0.25, 2) &&
    isNumber(settings.petalFold, 0, 1) &&
    isNumber(settings.petalTwist, -1, 1) &&
    isNumber(settings.petalRuffle, 0, 2) &&
    isNumber(settings.petalNotch, 0, 2) &&
    isNumber(settings.petalVeinStrength, 0, 2) &&
    isNumber(settings.petalBaseWidth, 0.5, 1.8) &&
    isNumber(settings.petalAge, 0, 1) &&
    isNumber(settings.petalSpots, 0, 1) &&
    isNumber(settings.petalGuideStrength, 0, 1) &&
    isNumber(settings.bloom, 0, 1) &&
    isNumber(settings.variation, 0, 1) &&
    isColor(settings.petalColor) &&
    isColor(settings.petalTipColor) &&
    isColor(settings.centerColor) &&
    isNumber(settings.centerDensity, 0.25, 2) &&
    isNumber(settings.centerSize, 0.5, 1.7) &&
    isNumber(settings.centerProfile, 0.4, 1.8) &&
    isNumber(settings.centerFloretSize, 0.5, 1.8) &&
    isNumber(settings.centerSpread, 0.5, 1.35) &&
    isNumber(settings.centerStamenLength, 0.4, 2) &&
    isNumber(settings.centerAntherSize, 0.4, 2) &&
    isNumber(settings.centerStigmaSize, 0.4, 2) &&
    isColor(settings.stemColor) &&
    isColor(settings.backgroundColor) &&
    isNumber(settings.stemCurve, 0) &&
    isNumber(settings.stemHeight, 0.65, 1.35) &&
    isNumber(settings.stemThickness, 0.5, 1.8) &&
    isNumber(settings.stemTaper, 0, 0.7) &&
    Number.isInteger(settings.stemNodeCount) &&
    (settings.stemNodeCount ?? -1) >= 0 &&
    (settings.stemNodeCount ?? 9) <= 8 &&
    isNumber(settings.stemHairDensity, 0, 2) &&
    isNumber(settings.leafDensity, 0, 2) &&
    isNumber(settings.leafLength, 0.5, 1.6) &&
    isNumber(settings.leafWidth, 0.5, 1.6) &&
    isNumber(settings.leafCurl, 0, 1) &&
    isNumber(settings.leafSerration, 0, 2) &&
    isNumber(settings.leafVeinDensity, 0.25, 2) &&
    isNumber(settings.leafDroop, 0, 1) &&
    isNumber(settings.bloomTilt, -0.6, 0.6) &&
    isNumber(settings.bloomTurn, -3.15, 3.15) &&
    isNumber(settings.lightIntensity, 0) &&
    typeof settings.grid === "boolean",
  );
}

function isNumber(value: unknown, minimum: number, maximum = Infinity) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function isColor(value: unknown) {
  return typeof value === "string" && hexColor.test(value);
}
