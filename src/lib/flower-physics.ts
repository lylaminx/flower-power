import * as THREE from "three";
import { seededRandom } from "./flower-geometry";
import type { FlowerSpecies } from "./flower-species";

export type BloomLoadSettings = {
  petalCount: number;
  petalLength: number;
  petalWidth: number;
  centerSize: number;
  stemThickness: number;
  petalAge: number;
  seed: number;
};

/**
 * Approximates how the visible bloom load flexes its supporting stem. The
 * response is deliberately bounded so artist controls remain authoritative.
 */
export function getBloomLoadResponse(
  structure: FlowerSpecies,
  settings: BloomLoadSettings,
) {
  const layerArea = structure.layers.reduce(
    (sum, layer) => sum + layer.count * layer.length * layer.width,
    0,
  );
  const petalLoad =
    settings.petalCount *
    settings.petalLength *
    settings.petalWidth *
    layerArea *
    0.018;
  const centerLoad =
    structure.centerRadius *
    settings.centerSize *
    (0.42 + Math.sqrt(structure.florets) * 0.035);
  const bloomCount = Math.max(1, structure.inflorescenceCount ?? 1);
  const totalLoad = (petalLoad + centerLoad) * Math.sqrt(bloomCount);
  const support = Math.max(0.32, Math.pow(settings.stemThickness, 1.65));
  const normalizedLoad = THREE.MathUtils.clamp(totalLoad / support, 0, 1);
  const ageSoftening = THREE.MathUtils.smoothstep(settings.petalAge, 0.35, 1);
  const individualLean =
    (seededRandom(settings.seed + 7_001) - 0.5) * 2 * normalizedLoad * 0.045;

  return {
    normalizedLoad,
    stemFlex: 1 + normalizedLoad * 0.32 + ageSoftening * 0.1,
    bloomDroop: normalizedLoad * 0.065 + ageSoftening * 0.045,
    individualLean,
  };
}
