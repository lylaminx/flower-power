import { describe, expect, it } from "vitest";
import {
  lightingPresets,
  lightingRigs,
  type LightingPreset,
} from "@/lib/flower-lighting";

describe("photographic lighting rigs", () => {
  const presets = lightingPresets as readonly LightingPreset[];

  it("defines all planned lighting presets", () => {
    expect(presets).toEqual([
      "botanicalStudio",
      "overcastGarden",
      "morningBacklight",
      "goldenHour",
      "museumIllustration",
      "macroPhotography",
    ]);
  });

  it.each(presets)("keeps %s intensities and exposure restrained", (preset) => {
    const rig = lightingRigs[preset];

    expect(rig.exposure).toBeGreaterThanOrEqual(0.8);
    expect(rig.exposure).toBeLessThanOrEqual(1.1);
    expect(rig.keyIntensity).toBeGreaterThan(rig.fillIntensity);
    expect(rig.environmentIntensity).toBeLessThanOrEqual(0.2);
    expect(rig.keyColor).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
