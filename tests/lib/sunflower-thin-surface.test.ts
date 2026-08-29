import { describe, expect, it } from "vitest";
import {
  createSunflowerThinSurfaceShader,
  sunflowerBacklightDirection,
  sunflowerThinSurfaceProgramKey,
} from "@/lib/sunflower-thin-surface";

function compile(rimIntensity: number) {
  const shader = {
    uniforms: {} as Record<string, { value: unknown }>,
    vertexShader:
      "#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>",
    fragmentShader: "#include <common>\n#include <emissivemap_fragment>",
  };
  createSunflowerThinSurfaceShader(rimIntensity)(shader);
  return shader;
}

describe("sunflower thin-surface shader", () => {
  it("adds bounded directional and grazing tissue scatter", () => {
    const shader = compile(3.6);

    expect(shader.vertexShader).toContain("vSunflowerWorldNormal");
    expect(shader.vertexShader).toContain("vSunflowerWorldPosition");
    expect(shader.fragmentShader).toContain("sunflowerWrappedTransmission");
    expect(shader.fragmentShader).toContain("sunflowerGrazingScatter");
    expect(shader.fragmentShader).toContain("sunflowerWorldView");
    expect(shader.fragmentShader).toContain("sunflowerPigmentLuminance");
    expect(shader.fragmentShader).toContain("sunflowerPigmentTransmission");
    expect(shader.fragmentShader).toContain("sunflowerCellularScatter");
    expect(shader.fragmentShader).toContain("sunflowerOpticalDepth");
    expect(shader.fragmentShader).toContain(
      "texture2D(thicknessMap, vThicknessMapUv).g",
    );
    expect(shader.fragmentShader).toContain("mix(1.16, 0.86");
    expect(shader.fragmentShader).toContain("mix(0.62, 1.0");
    expect(shader.fragmentShader).toContain(
      "sunflowerBacklightStrength * 1.16",
    );
    expect(shader.uniforms.sunflowerBacklightStrength.value).toBe(1);
    expect(sunflowerBacklightDirection).toHaveLength(3);
  });

  it("disables the added light response below the rim threshold", () => {
    expect(compile(1.45).uniforms.sunflowerBacklightStrength.value).toBe(0);
  });

  it("keys shader variants by lighting intensity", () => {
    expect(sunflowerThinSurfaceProgramKey(2.456)).toBe(
      "sunflower-thin-surface-v4:246",
    );
  });
});
