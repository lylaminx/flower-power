import { describe, expect, it } from "vitest";
import {
  createPoppyThinSurfaceShader,
  poppyBacklightDirection,
  poppyThinSurfaceProgramKey,
} from "@/lib/poppy-thin-surface";

describe("poppy thin-surface shader", () => {
  it("uses the normalized rear light and a stable rig-specific program key", () => {
    expect(Math.hypot(...poppyBacklightDirection)).toBeCloseTo(1);
    expect(poppyThinSurfaceProgramKey(3.6)).toBe("poppy-thin-surface-v13:360");
  });

  it("adds directional and grazing scatter to thickness-mapped emission", () => {
    const shader = {
      uniforms: {},
      vertexShader:
        "#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>",
      fragmentShader:
        "#include <common>\n#include <color_fragment>\n#include <normal_fragment_maps>\n#include <roughnessmap_fragment>\n#include <emissivemap_fragment>",
    };

    createPoppyThinSurfaceShader(3.6)(shader);

    expect(shader.uniforms).toHaveProperty("poppyBacklightDirection");
    expect(shader.uniforms).toHaveProperty("poppyBacklightStrength", {
      value: 1,
    });
    expect(shader.vertexShader).toContain("vPoppyWorldNormal");
    expect(shader.vertexShader).toContain("vPoppyWorldPosition");
    expect(shader.vertexShader).toContain("vPoppyLocalPosition");
    expect(shader.vertexShader).toContain("vPoppyUv = uv");
    expect(shader.fragmentShader).toContain("poppyPigmentField");
    expect(shader.fragmentShader).toContain("poppyPigmentDepth");
    expect(shader.fragmentShader).toContain("poppyAttachmentDepth");
    expect(shader.fragmentShader).toContain("poppyRadialLane");
    expect(shader.fragmentShader).toContain("poppyLivingDepth");
    expect(shader.fragmentShader).toContain("poppyMembraneEnvelope");
    expect(shader.fragmentShader).toContain("poppyLongFiber");
    expect(shader.fragmentShader).toContain("poppyCrossFiber");
    expect(shader.fragmentShader).toContain("poppyCellField");
    expect(shader.fragmentShader).toContain("poppyFineLong");
    expect(shader.fragmentShader).toContain("poppyFineCross");
    expect(shader.fragmentShader).toContain("poppyFineMembrane");
    expect(shader.fragmentShader).toContain("poppyFiberHeight)) * 1.18");
    expect(shader.fragmentShader).toContain("poppyFineMembrane * 0.035");
    expect(shader.fragmentShader).toContain(
      "roughnessFactor = clamp(roughnessFactor",
    );
    expect(shader.fragmentShader).toContain("poppyFiberHeight");
    expect(shader.fragmentShader).toContain("dFdx(poppyFiberHeight)");
    expect(shader.fragmentShader).toContain(
      "perturbNormalArb(-vViewPosition, normal, poppyFiberGradient",
    );
    expect(shader.fragmentShader).toContain(
      "smoothstep(0.06, 0.2, vPoppyUv.y)",
    );
    expect(shader.fragmentShader).toContain("vPoppyUv.y * 62.0");
    expect(shader.fragmentShader).toContain("poppyScarletShadow");
    expect(shader.fragmentShader).toContain("vec3(0.9, 0.94, 0.98)");
    expect(shader.fragmentShader).toContain("poppyWrappedTransmission");
    expect(shader.fragmentShader).toContain("poppyGrazingScatter");
    expect(shader.fragmentShader).toContain("poppyWorldView");
    expect(shader.fragmentShader).toContain("poppyBacklightStrength * 2.4");
    expect(shader.fragmentShader).toContain("poppyBacklightStrength * 0.25");
    expect(shader.fragmentShader).toContain(
      "poppyCellField * poppyMembraneEnvelope * 0.075",
    );
  });

  it("suppresses the emission lobe under ordinary studio rim light", () => {
    const shader = {
      uniforms: {},
      vertexShader:
        "#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>",
      fragmentShader:
        "#include <common>\n#include <color_fragment>\n#include <emissivemap_fragment>",
    };

    createPoppyThinSurfaceShader(1.45)(shader);

    expect(shader.uniforms).toHaveProperty("poppyBacklightStrength", {
      value: 0,
    });
  });
});
