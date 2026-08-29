import { describe, expect, it } from "vitest";
import {
  createOrchidThinSurfaceShader,
  orchidBacklightDirection,
  orchidThinSurfaceProgramKey,
} from "@/lib/orchid-thin-surface";

describe("orchid thin-surface shader", () => {
  it("adds a normalized rear-light direction and stable program key", () => {
    expect(Math.hypot(...orchidBacklightDirection)).toBeCloseTo(1);
    expect(orchidThinSurfaceProgramKey(3.6)).toBe("orchid-thin-surface-v3:360");
  });

  it("modulates thickness-mapped emission by the world-space rear light", () => {
    const shader = {
      uniforms: {},
      vertexShader:
        "#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>",
      fragmentShader: "#include <common>\n#include <emissivemap_fragment>",
    };

    createOrchidThinSurfaceShader(3.6)(shader);

    expect(shader.uniforms).toHaveProperty("orchidBacklightDirection");
    expect(shader.uniforms).toHaveProperty("orchidBacklightStrength", {
      value: 1,
    });
    expect(shader.vertexShader).toContain("vOrchidWorldNormal");
    expect(shader.vertexShader).toContain("vOrchidWorldPosition");
    expect(shader.fragmentShader).toContain("orchidWrappedTransmission");
    expect(shader.fragmentShader).toContain("orchidGrazingScatter");
    expect(shader.fragmentShader).toContain("orchidTissueLuminance");
    expect(shader.fragmentShader).toContain("orchidTissueTransmission");
    expect(shader.fragmentShader).toContain("mix(0.72, 1.0");
    expect(shader.fragmentShader).toContain("totalEmissiveRadiance *=");
  });
});
