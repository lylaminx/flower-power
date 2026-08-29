import { describe, expect, it } from "vitest";
import {
  createLotusThinSurfaceShader,
  lotusBacklightDirection,
  lotusThinSurfaceProgramKey,
} from "@/lib/lotus-thin-surface";

describe("lotus thin-surface shader", () => {
  it("uses a normalized rear light and stable rig-specific program key", () => {
    expect(Math.hypot(...lotusBacklightDirection)).toBeCloseTo(1);
    expect(lotusThinSurfaceProgramKey(3.6)).toBe("lotus-thin-surface-v1:360");
  });

  it("bounds wrapped and grazing scatter to strong rim lighting", () => {
    const makeShader = () => ({
      uniforms: {},
      vertexShader:
        "#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>",
      fragmentShader: "#include <common>\n#include <emissivemap_fragment>",
    });
    const backlit = makeShader();
    const studio = makeShader();

    createLotusThinSurfaceShader(3.6)(backlit);
    createLotusThinSurfaceShader(1.45)(studio);

    expect(backlit.uniforms).toHaveProperty("lotusBacklightStrength", {
      value: 1,
    });
    expect(studio.uniforms).toHaveProperty("lotusBacklightStrength", {
      value: 0,
    });
    expect(backlit.vertexShader).toContain("vLotusWorldNormal");
    expect(backlit.vertexShader).toContain("vLotusWorldPosition");
    expect(backlit.fragmentShader).toContain("lotusWrappedTransmission");
    expect(backlit.fragmentShader).toContain("lotusGrazingScatter");
    expect(backlit.fragmentShader).toContain("lotusWorldView");
    expect(backlit.fragmentShader).toContain("lotusBacklightStrength * 1.18");
  });
});
