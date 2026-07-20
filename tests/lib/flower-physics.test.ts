import { describe, expect, it } from "vitest";

import { getBloomLoadResponse } from "@/lib/flower-physics";
import { flowerSpecies } from "@/lib/flower-species";

const settings = {
  petalCount: 14,
  petalLength: 1.28,
  petalWidth: 0.76,
  centerSize: 0.78,
  stemThickness: 0.84,
  petalAge: 0.08,
  seed: 1847,
};

describe("bloom load response", () => {
  it("is deterministic and bounded", () => {
    const response = getBloomLoadResponse(flowerSpecies.Rose, settings);

    expect(response).toEqual(
      getBloomLoadResponse(flowerSpecies.Rose, settings),
    );
    expect(response.normalizedLoad).toBeGreaterThan(0);
    expect(response.normalizedLoad).toBeLessThanOrEqual(1);
    expect(response.bloomDroop).toBeLessThan(0.12);
  });

  it("lets stronger stems support the same bloom more rigidly", () => {
    const slender = getBloomLoadResponse(flowerSpecies.Rose, {
      ...settings,
      stemThickness: 0.55,
    });
    const sturdy = getBloomLoadResponse(flowerSpecies.Rose, {
      ...settings,
      stemThickness: 1.35,
    });

    expect(slender.normalizedLoad).toBeGreaterThan(sturdy.normalizedLoad);
    expect(slender.stemFlex).toBeGreaterThan(sturdy.stemFlex);
  });

  it("softens posture as a flower ages", () => {
    const fresh = getBloomLoadResponse(flowerSpecies.Lily, {
      ...settings,
      petalAge: 0.1,
    });
    const aging = getBloomLoadResponse(flowerSpecies.Lily, {
      ...settings,
      petalAge: 0.9,
    });

    expect(aging.stemFlex).toBeGreaterThan(fresh.stemFlex);
    expect(aging.bloomDroop).toBeGreaterThan(fresh.bloomDroop);
  });
});
