import { describe, expect, it } from "vitest";
import {
  createPoppyBudGeometry,
  createPoppyBudHairPlacements,
  getPoppyBudRadialScale,
  getPoppyBudSeamStrength,
  getPoppyBudTaper,
} from "@/lib/poppy-bud";

describe("poppy floral bud", () => {
  it("tapers to a pointed apex above a rounded base", () => {
    expect(getPoppyBudTaper(0.5)).toBeGreaterThan(getPoppyBudTaper(0));
    expect(getPoppyBudTaper(1)).toBeLessThan(getPoppyBudTaper(0));
  });

  it("forms two bounded closed-sepal lobes", () => {
    const lobe = getPoppyBudRadialScale(0, 0.5);
    const oppositeLobe = getPoppyBudRadialScale(Math.PI, 0.5);
    const groove = getPoppyBudRadialScale(Math.PI / 2, 0.5);

    expect(lobe).toBeGreaterThan(groove);
    expect(oppositeLobe).toBeCloseTo(lobe);
    expect(lobe - groove).toBeLessThan(0.15);
    expect(getPoppyBudRadialScale(0, 0)).toBeCloseTo(getPoppyBudTaper(0));
  });

  it("darkens two opposing sepal seams away from the bud poles", () => {
    expect(getPoppyBudSeamStrength(Math.PI / 2, 0.5)).toBeGreaterThan(0.95);
    expect(getPoppyBudSeamStrength(Math.PI * 1.5, 0.5)).toBeGreaterThan(0.95);
    expect(getPoppyBudSeamStrength(0, 0.5)).toBeLessThan(0.01);
    expect(getPoppyBudSeamStrength(Math.PI / 2, 0)).toBeCloseTo(0);
  });

  it("builds a closed, smooth shared bud geometry", () => {
    const geometry = createPoppyBudGeometry();
    geometry.computeBoundingBox();

    expect(geometry.index).not.toBeNull();
    expect(geometry.getAttribute("normal").count).toBe(
      geometry.getAttribute("position").count,
    );
    expect(geometry.getAttribute("color").count).toBe(
      geometry.getAttribute("position").count,
    );
    expect(geometry.boundingBox?.max.y).toBeCloseTo(1);
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-1);
  });

  it("distributes deterministic hairs over the closed sepal surface", () => {
    const hairs = createPoppyBudHairPlacements(2718);
    const repeated = createPoppyBudHairPlacements(2718);

    expect(hairs).toHaveLength(36);
    expect(hairs.map(({ position }) => position.toArray())).toEqual(
      repeated.map(({ position }) => position.toArray()),
    );
    expect(hairs.every(({ normal }) => normal.length() > 0.999)).toBe(true);
    expect(new Set(hairs.map(({ lengthScale }) => lengthScale)).size).toBe(36);
    expect(
      hairs.every(
        ({ lengthScale, radiusScale }) =>
          lengthScale >= 0.72 &&
          lengthScale <= 1.24 &&
          radiusScale >= 0.72 &&
          radiusScale <= 1.08,
      ),
    ).toBe(true);
    expect(
      Math.min(...hairs.map(({ position }) => position.y)),
    ).toBeGreaterThan(-0.8);
    expect(Math.max(...hairs.map(({ position }) => position.y))).toBeLessThan(
      0.8,
    );
  });
});
