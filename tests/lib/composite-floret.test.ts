import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  createCompositeFloretCrownGeometry,
  createSunflowerCompositeFloretCrownGeometry,
  createCompositeFloretTubeGeometry,
  createBifidCompositeStigmaGeometry,
  getCompositeCrownVariation,
  getCompositeCrownColor,
  getCompositeCrownRadius,
  getSunflowerCompositeCrownRadius,
  getCompositeFloretVerticalLayout,
  getCompositeFloretPlacementVariation,
  getSunflowerDiskBodyColor,
  getSunflowerFloretPosture,
  getSunflowerFloretRadialSizeScale,
  getSunflowerFloretStage,
  getSunflowerSpentCrownVariation,
  getSunflowerWeatheredCrownColor,
} from "@/lib/composite-floret";

describe("composite floret crown", () => {
  it("varies crown phase and aspect within fivefold bounds", () => {
    const crowns = Array.from({ length: 12 }, (_, index) =>
      getCompositeCrownVariation(1847, index),
    );

    expect(crowns).toEqual(
      Array.from({ length: 12 }, (_, index) =>
        getCompositeCrownVariation(1847, index),
      ),
    );
    expect(new Set(crowns.map(({ phase }) => phase)).size).toBe(12);
    expect(crowns.every(({ phase }) => phase >= 0)).toBe(true);
    expect(crowns.every(({ phase }) => phase <= (Math.PI * 2) / 5)).toBe(true);
    expect(crowns.every(({ scaleX }) => scaleX >= 0.94)).toBe(true);
    expect(crowns.every(({ scaleX }) => scaleX <= 1.06)).toBe(true);
    expect(crowns.every(({ scaleX, scaleY }) => scaleX + scaleY === 2)).toBe(
      true,
    );
  });

  it("loosens exact disk lattices without breaking phyllotactic packing", () => {
    const placements = Array.from({ length: 64 }, (_, index) =>
      getCompositeFloretPlacementVariation(5772, index),
    );

    expect(placements).toEqual(
      Array.from({ length: 64 }, (_, index) =>
        getCompositeFloretPlacementVariation(5772, index),
      ),
    );
    expect(new Set(placements.map(({ angleOffset }) => angleOffset)).size).toBe(
      64,
    );
    for (const placement of placements) {
      expect(Math.abs(placement.angleOffset)).toBeLessThanOrEqual(0.012);
      expect(placement.radiusScale).toBeGreaterThanOrEqual(0.985);
      expect(placement.radiusScale).toBeLessThanOrEqual(1.015);
      expect(Math.abs(placement.heightOffset)).toBeLessThanOrEqual(0.04);
      expect(Math.abs(placement.developmentOffset)).toBeLessThanOrEqual(0.025);
      expect(Math.abs(placement.lightnessOffset)).toBeLessThanOrEqual(0.02);
    }
  });

  it("adds bounded anisotropic collapse only to spent sunflower crowns", () => {
    const fresh = getSunflowerSpentCrownVariation(5772, 12, 0);
    const spent = Array.from({ length: 12 }, (_, index) =>
      getSunflowerSpentCrownVariation(5772, index, 1),
    );

    expect(fresh).toEqual({ scaleX: 1, scaleY: 1, rotationOffset: 0 });
    expect(new Set(spent.map(({ scaleX }) => scaleX)).size).toBe(12);
    expect(spent.every(({ scaleX }) => scaleX >= 0.84)).toBe(true);
    expect(spent.every(({ scaleX }) => scaleX <= 0.94)).toBe(true);
    expect(spent.every(({ scaleY }) => scaleY > 1)).toBe(true);
    expect(
      spent.every(({ rotationOffset }) => Math.abs(rotationOffset) <= 0.12),
    ).toBe(true);
  });

  it("forms five bounded corolla lobes around an open throat", () => {
    expect(getCompositeCrownRadius(0)).toBeCloseTo(0.85);
    expect(getCompositeCrownRadius(Math.PI / 5)).toBeCloseTo(0.59);
    expect(getCompositeCrownRadius((Math.PI * 2) / 5)).toBeCloseTo(0.85);
  });

  it("creates a shallow reusable crown mesh", () => {
    const geometry = createCompositeFloretCrownGeometry();
    geometry.computeBoundingBox();

    expect(geometry.getAttribute("position").count).toBeGreaterThan(100);
    expect(
      geometry.boundingBox!.max.z - geometry.boundingBox!.min.z,
    ).toBeLessThan(0.3);
  });

  it("sharpens sunflower crown shoulders around five persistent lobes", () => {
    const lobe = getSunflowerCompositeCrownRadius(0);
    const sinus = getSunflowerCompositeCrownRadius(Math.PI / 5);
    const geometry = createSunflowerCompositeFloretCrownGeometry();

    expect(lobe).toBeGreaterThan(0.9);
    expect(sinus).toBeLessThan(0.51);
    expect(lobe).toBeGreaterThan(getCompositeCrownRadius(0));
    expect(sinus).toBeLessThan(getCompositeCrownRadius(Math.PI / 5));
    expect(lobe - sinus).toBeGreaterThan(0.39);
    expect(geometry.getAttribute("position").count).toBeGreaterThan(100);
  });

  it("colors only flowering crowns toward pollen gold", () => {
    const base = getCompositeCrownColor("#70431f", "#e0a832", 0, 0);
    const flowering = getCompositeCrownColor("#70431f", "#e0a832", 1, 0);
    const spent = getCompositeCrownColor("#70431f", "#e0a832", 1, 1);

    expect(flowering.r).toBeGreaterThan(base.r);
    expect(flowering.g).toBeGreaterThan(base.g);
    expect(spent.g).toBeLessThan(flowering.g);
  });

  it("weathers only spent sunflower crowns within a varied dry-tissue palette", () => {
    const source = new THREE.Color("#8c5b27");
    const fresh = getSunflowerWeatheredCrownColor(source, 5772, 4, 0);
    const spent = Array.from({ length: 12 }, (_, index) =>
      getSunflowerWeatheredCrownColor(source, 5772, index, 1),
    );

    expect(fresh.getHex()).toBe(source.getHex());
    expect(
      new Set(spent.map((color) => color.getHex())).size,
    ).toBeGreaterThanOrEqual(10);
    for (const color of spent) {
      expect(color.r).toBeGreaterThan(color.g);
      expect(color.g).toBeGreaterThan(color.b);
      expect(color.getHSL({ h: 0, s: 0, l: 0 }).l).toBeLessThan(0.36);
    }
  });

  it("separates sunflower disk developmental zones without black peg bodies", () => {
    const innerFlowering = getSunflowerDiskBodyColor(0.18, 1, 0);
    const outerSpent = getSunflowerDiskBodyColor(0.9, 1, 1);
    const varied = getSunflowerDiskBodyColor(0.18, 1, 0, 0.015);

    expect(innerFlowering.r).toBeGreaterThan(innerFlowering.g);
    expect(innerFlowering.g).toBeGreaterThan(innerFlowering.b);
    expect(innerFlowering.getHex()).not.toBe(new THREE.Color("#000").getHex());
    expect(outerSpent.getHSL({ h: 0, s: 0, l: 0 }).l).toBeLessThan(
      innerFlowering.getHSL({ h: 0, s: 0, l: 0 }).l,
    );
    expect(varied.getHex()).not.toBe(innerFlowering.getHex());
  });

  it("builds an open, thin-walled tapered floret tube", () => {
    const geometry = createCompositeFloretTubeGeometry();
    geometry.computeBoundingBox();

    expect(geometry.getAttribute("position").count).toBe(48);
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-0.5);
    expect(geometry.boundingBox?.max.y).toBeCloseTo(0.5);
    expect(geometry.index?.count).toBe(288);
  });

  it("builds a slender curved bifid style with two separated branches", () => {
    const geometry = createBifidCompositeStigmaGeometry();
    geometry.computeBoundingBox();

    expect(geometry.boundingBox!.min.x).toBeLessThan(-0.38);
    expect(geometry.boundingBox!.max.x).toBeGreaterThan(0.38);
    expect(geometry.boundingBox!.max.x).toBeLessThan(0.44);
    expect(geometry.boundingBox!.max.y).toBeGreaterThan(0.55);
    expect(geometry.getAttribute("position").count).toBeGreaterThan(300);
    expect(
      geometry.boundingBox!.max.z - geometry.boundingBox!.min.z,
    ).toBeLessThan(0.3);
  });

  it("stages sunflower tube, crown, and bifid style development", () => {
    const bud = getSunflowerFloretStage(0.3, 0.1, 0);
    const flowering = getSunflowerFloretStage(0.3, 0.9, 0);
    const spent = getSunflowerFloretStage(0.3, 0.9, 1);

    expect(flowering.bodyHeightScale).toBeGreaterThan(bud.bodyHeightScale);
    expect(flowering.bodyWidthScale).toBeGreaterThan(bud.bodyWidthScale);
    expect(spent.bodyWidthScale).toBeLessThan(flowering.bodyWidthScale);
    expect(flowering.crownScale).toBeGreaterThan(bud.crownScale);
    expect(flowering.styleScale).toBeGreaterThan(bud.styleScale);
    expect(spent.crownScale).toBeLessThan(flowering.crownScale);
    expect(spent.crownScale).toBeGreaterThan(flowering.crownScale * 0.8);
    expect(spent.styleScale).toBeLessThan(flowering.styleScale);
  });

  it("fills the outer sunflower disk without enlarging the active center", () => {
    expect(getSunflowerFloretRadialSizeScale(0)).toBe(1);
    expect(getSunflowerFloretRadialSizeScale(0.4)).toBe(1);
    expect(getSunflowerFloretRadialSizeScale(0.7)).toBeGreaterThan(1.04);
    expect(getSunflowerFloretRadialSizeScale(1)).toBeCloseTo(1.14);
  });

  it("gives sunflower disk florets bounded radial posture variation", () => {
    const center = getSunflowerFloretPosture(5772, 8, 0.1, 0.2, 0);
    const outer = Array.from({ length: 16 }, (_, index) =>
      getSunflowerFloretPosture(5772, index, 0.92, 1, 1),
    );

    expect(center.tilt).toBeLessThan(0.08);
    expect(outer).toEqual(
      Array.from({ length: 16 }, (_, index) =>
        getSunflowerFloretPosture(5772, index, 0.92, 1, 1),
      ),
    );
    expect(new Set(outer.map(({ tilt }) => tilt)).size).toBe(16);
    expect(outer.every(({ tilt }) => tilt >= 0.012 && tilt <= 0.29)).toBe(true);
    expect(
      outer.every(({ azimuthOffset }) => Math.abs(azimuthOffset) <= 0.11),
    ).toBe(true);
  });

  it("seats the crown directly on the transformed tube top", () => {
    const layout = getCompositeFloretVerticalLayout(0.04, 1.8, 0.7);

    expect(layout.crownCenterOffset).toBeCloseTo(0.03852);
    expect(layout.stigmaCenterOffset).toBeGreaterThan(layout.crownCenterOffset);
  });
});
