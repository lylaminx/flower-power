import { describe, expect, it } from "vitest";
import {
  getCompositeFloretMaturity,
  getCompositeFloretSenescence,
  getFlowerGrowthState,
  getLeafSenescence,
} from "@/lib/flower-growth";

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

  it("senesces lower and stressed leaves before protected upper leaves", () => {
    const lower = getLeafSenescence(0.65, 0.7, 0.28, 0.9);
    const upper = getLeafSenescence(0.65, 0.7, 0.76, 0.1);

    expect(lower.age).toBeGreaterThan(upper.age);
    expect(lower.wilt).toBeGreaterThan(upper.wilt);
    expect(lower.moistureScale).toBeLessThan(upper.moistureScale);
  });

  it("keeps leaf senescence values bounded", () => {
    expect(getLeafSenescence(4, 3, -1, 8)).toMatchObject({
      age: 1,
      wilt: 1,
    });
  });

  it("advances composite floret maturity from the rim inward", () => {
    const outer = getCompositeFloretMaturity(0.92, 0.4);
    const inner = getCompositeFloretMaturity(0.18, 0.4);

    expect(outer).toBeGreaterThan(inner);
    expect(getCompositeFloretMaturity(0.1, 1)).toBeCloseTo(1);
    expect(getCompositeFloretMaturity(0.9, 0)).toBeCloseTo(0);
  });

  it("dries spent outer florets while the inner disk remains active", () => {
    const outer = getCompositeFloretSenescence(0.92, 0.72);
    const inner = getCompositeFloretSenescence(0.18, 0.72);

    expect(outer).toBeGreaterThan(inner);
    expect(getCompositeFloretSenescence(0.9, 0)).toBeCloseTo(0);
  });
});
