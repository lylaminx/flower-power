import { describe, expect, it } from "vitest";
import { getFlowerGrowthState } from "@/lib/flower-growth";

describe("flower growth", () => {
  it.each([
    [0.1, 0, "bud"],
    [0.5, 0, "opening"],
    [0.9, 0.1, "fresh"],
    [0.9, 0.35, "mature"],
    [0.9, 0.8, "wilting"],
  ] as const)("maps bloom %s and age %s to %s", (bloom, age, phase) => {
    expect(getFlowerGrowthState(bloom, age).phase).toBe(phase);
  });

  it("coordinates reproductive maturity and calyx release with opening", () => {
    const bud = getFlowerGrowthState(0.1, 0);
    const fresh = getFlowerGrowthState(0.9, 0);

    expect(fresh.reproductiveMaturity).toBeGreaterThan(
      bud.reproductiveMaturity,
    );
    expect(fresh.calyxRelease).toBeGreaterThan(bud.calyxRelease);
  });

  it("reduces moisture and increases wilt as an open flower ages", () => {
    const fresh = getFlowerGrowthState(1, 0);
    const old = getFlowerGrowthState(1, 1);

    expect(old.moisture).toBeLessThan(fresh.moisture);
    expect(old.wilt).toBeGreaterThan(fresh.wilt);
  });

  it("clamps input values", () => {
    const state = getFlowerGrowthState(4, -2);

    expect(state.openness).toBe(1);
    expect(state.moisture).toBeLessThanOrEqual(1);
  });
});
