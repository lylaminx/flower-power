import { describe, expect, it } from "vitest";
import {
  createRoseThinSurfaceShader,
  roseBacklightDirection,
  roseThinSurfaceProgramKey,
} from "@/lib/rose-thin-surface";

describe("rose thin-surface shader", () => {
  it("uses a normalized rear light and stable rig-specific program key", () => {
    expect(Math.hypot(...roseBacklightDirection)).toBeCloseTo(1);
    expect(roseThinSurfaceProgramKey(1.45)).toBe("rose-thin-surface-v2:145");
  });

  it("adds wrapped fleshy transmission scaled by the active rim", () => {
    const shader = {
      uniforms: {},
      vertexShader:
        "#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>",
      fragmentShader: "#include <common>\n#include <emissivemap_fragment>",
    };

    createRoseThinSurfaceShader(1.8)(shader);

    expect(shader.uniforms).toHaveProperty("roseBacklightStrength", {
      value: 0.5,
    });
    expect(shader.vertexShader).toContain("vRoseWorldNormal");
    expect(shader.vertexShader).toContain("vRoseWorldPosition");
    expect(shader.fragmentShader).toContain("roseWrappedTransmission");
    expect(shader.fragmentShader).toContain("roseGrazingScatter");
    expect(shader.fragmentShader).toContain("roseWorldView");
    expect(shader.fragmentShader).toContain("rosePigmentLuminance");
    expect(shader.fragmentShader).toContain("rosePigmentTransmission");
    expect(shader.fragmentShader).toContain("mix(0.55, 1.0");
    expect(shader.fragmentShader).toContain("roseBacklightStrength * 0.74");
  });
});
