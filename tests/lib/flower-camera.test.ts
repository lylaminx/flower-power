import { describe, expect, it } from "vitest";
import {
  cameraCompositionOptions,
  cameraCompositions,
  clampFocalLength,
} from "@/lib/flower-camera";

describe("photographic camera", () => {
  it("defines the planned composition views", () => {
    expect(cameraCompositionOptions).toEqual([
      "threeQuarter",
      "front",
      "macro",
      "underside",
    ]);
  });

  it("uses a longer lens and closer target for macro composition", () => {
    expect(cameraCompositions.macro.defaultFocalLength).toBeGreaterThan(
      cameraCompositions.threeQuarter.defaultFocalLength,
    );
    expect(cameraCompositions.macro.target[1]).toBeGreaterThan(
      cameraCompositions.threeQuarter.target[1],
    );
  });

  it.each([
    [10, 28],
    [50, 50],
    [200, 120],
  ])("clamps %s mm to %s mm", (input, expected) => {
    expect(clampFocalLength(input)).toBe(expected);
  });
});
