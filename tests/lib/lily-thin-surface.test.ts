import { describe, expect, it } from "vitest";
import {
  createLilyThinSurfaceShader,
  lilyBacklightDirection,
  lilyThinSurfaceProgramKey,
} from "@/lib/lily-thin-surface";

describe("lily thin-surface shader", () => {
  it("uses a normalized rear light and stable rig-specific program key", () => {
    expect(Math.hypot(...lilyBacklightDirection)).toBeCloseTo(1);
    expect(lilyThinSurfaceProgramKey(3.6)).toBe("lily-thin-surface-v3:360");
  });

  it("adds directional and grazing scatter only under strong rim light", () => {
    const makeShader = () => ({
      uniforms: {},
      vertexShader:
        "#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>",
      fragmentShader: "#include <common>\n#include <emissivemap_fragment>",
    });
    const backlit = makeShader();
    const studio = makeShader();

    createLilyThinSurfaceShader(3.6)(backlit);
    createLilyThinSurfaceShader(1.45)(studio);

    expect(backlit.uniforms).toHaveProperty("lilyBacklightStrength", {
      value: 1,
    });
    expect(studio.uniforms).toHaveProperty("lilyBacklightStrength", {
      value: 0,
    });
    expect(backlit.vertexShader).toContain("vLilyWorldNormal");
    expect(backlit.vertexShader).toContain("vLilyWorldPosition");
    expect(backlit.fragmentShader).toContain("lilyWrappedTransmission");
    expect(backlit.fragmentShader).toContain("lilyGrazingScatter");
    expect(backlit.fragmentShader).toContain("lilyWorldView");
    expect(backlit.fragmentShader).toContain("lilyPigmentLuminance");
    expect(backlit.fragmentShader).toContain("lilyPigmentTransmission");
    expect(backlit.fragmentShader).toContain("mix(0.58, 1.0");
    expect(backlit.fragmentShader).toContain("lilyBacklightStrength * 1.9");
  });
});
