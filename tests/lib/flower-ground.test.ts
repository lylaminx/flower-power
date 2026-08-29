import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  getAquaticWaterTexture,
  createGardenBladeGeometry,
  getGardenBackdropPlacements,
  getGardenGroundPlacements,
  getGardenGroundTexture,
} from "@/lib/flower-ground";

describe("garden ground texture", () => {
  it("builds curved segmented grass blades instead of triangular spears", () => {
    const blade = createGardenBladeGeometry();
    blade.computeBoundingBox();

    expect(blade.getAttribute("position").count).toBe(14);
    expect(blade.index?.count).toBe(36);
    expect(blade.boundingBox?.max.y).toBeCloseTo(1);
    expect(blade.boundingBox?.max.x).toBeGreaterThan(0.1);
    expect(blade.getAttribute("normal").count).toBe(14);
  });

  it("places deterministic low vegetation away from the plant crown", () => {
    const placements = getGardenGroundPlacements();
    expect(placements).toEqual(getGardenGroundPlacements());
    expect(placements).toHaveLength(38);
    expect(
      Math.min(
        ...placements.map(({ position }) =>
          Math.hypot(position[0], position[2]),
        ),
      ),
    ).toBeGreaterThanOrEqual(1.15);
    expect(
      Math.max(...placements.map(({ height }) => height)),
    ).toBeLessThanOrEqual(0.46);
    expect(new Set(placements.map(({ bladeCount }) => bladeCount)).size).toBe(
      3,
    );
  });

  it("layers taller vegetation behind a clear central sightline", () => {
    const placements = getGardenBackdropPlacements();

    expect(placements).toEqual(getGardenBackdropPlacements());
    expect(placements).toHaveLength(12);
    expect(placements.every(({ position }) => position[2] <= -1.4)).toBe(true);
    expect(
      placements.every(({ position }) => Math.abs(position[0]) >= 1.18),
    ).toBe(true);
    expect(
      Math.min(...placements.map(({ height }) => height)),
    ).toBeGreaterThanOrEqual(1.15);
    expect(
      Math.max(...placements.map(({ height }) => height)),
    ).toBeLessThanOrEqual(2.72);
  });

  it("is deterministic, tileable, and naturally varied", () => {
    const texture = getGardenGroundTexture();
    const data = texture.image.data as Uint8Array;
    const red = Array.from(data).filter((_, index) => index % 4 === 0);
    const green = Array.from(data).filter((_, index) => index % 4 === 1);

    expect(getGardenGroundTexture()).toBe(texture);
    expect(texture.wrapS).toBe(THREE.RepeatWrapping);
    expect(texture.wrapT).toBe(THREE.RepeatWrapping);
    expect(texture.repeat.toArray()).toEqual([3, 3]);
    expect(Math.min(...red)).toBeGreaterThan(120);
    expect(Math.min(...green)).toBeGreaterThan(115);
    expect(Math.max(...red) - Math.min(...red)).toBeGreaterThan(20);
    expect(Math.max(...green) - Math.min(...green)).toBeGreaterThan(20);
  });
});

describe("aquatic water texture", () => {
  it("is deterministic, tileable, and softly rippled", () => {
    const texture = getAquaticWaterTexture();
    const data = texture.image.data as Uint8Array;
    const red = Array.from(data).filter((_, index) => index % 4 === 0);
    const blue = Array.from(data).filter((_, index) => index % 4 === 2);

    expect(getAquaticWaterTexture()).toBe(texture);
    expect(texture.wrapS).toBe(THREE.RepeatWrapping);
    expect(texture.wrapT).toBe(THREE.RepeatWrapping);
    expect(texture.repeat.toArray()).toEqual([2, 2]);
    expect(Math.max(...red) - Math.min(...red)).toBeGreaterThan(4);
    expect(Math.max(...blue) - Math.min(...blue)).toBeGreaterThan(8);
  });
});
