import scenarioData from "../../image-tests/scenarios.json";
import { flowerPresets, type FlowerPreset } from "./flower-store";
import { lightingPresets, type LightingPreset } from "./flower-lighting";

export type VisualTestScenario = {
  id: string;
  species: FlowerPreset;
  seed: number;
  renderMode: "photo";
  lighting: LightingPreset;
  lightIntensity: number;
  focalLength?: number;
  effects?: {
    depthOfField?: boolean;
    aperture?: number;
    focusDistance?: number;
    ambientOcclusion?: boolean;
  };
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  };
  dimensions: { width: number; height: number };
};

function isVector3(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

export function isVisualTestScenario(
  value: unknown,
): value is VisualTestScenario {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const camera = candidate.camera as Record<string, unknown> | undefined;
  const dimensions = candidate.dimensions as
    Record<string, unknown> | undefined;

  return (
    typeof candidate.id === "string" &&
    (flowerPresets as readonly string[]).includes(
      candidate.species as string,
    ) &&
    Number.isInteger(candidate.seed) &&
    (candidate.seed as number) >= 0 &&
    candidate.renderMode === "photo" &&
    (lightingPresets as readonly string[]).includes(
      candidate.lighting as string,
    ) &&
    typeof candidate.lightIntensity === "number" &&
    (candidate.focalLength === undefined ||
      (typeof candidate.focalLength === "number" &&
        candidate.focalLength >= 28 &&
        candidate.focalLength <= 120)) &&
    Boolean(camera) &&
    isVector3(camera?.position) &&
    isVector3(camera?.target) &&
    typeof camera?.fov === "number" &&
    Boolean(dimensions) &&
    Number.isInteger(dimensions?.width) &&
    Number.isInteger(dimensions?.height) &&
    (dimensions?.width as number) > 0 &&
    (dimensions?.height as number) > 0
  );
}

if (!scenarioData.every(isVisualTestScenario)) {
  throw new Error("image-tests/scenarios.json contains an invalid scenario");
}

export const visualTestScenarios =
  scenarioData as unknown as readonly VisualTestScenario[];

export function getVisualTestScenario(id: string) {
  return visualTestScenarios.find((scenario) => scenario.id === id);
}
