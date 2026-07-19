import { describe, expect, it } from "vitest";
import {
  getEffectiveRenderQuality,
  getTextureResolution,
  renderQualityOptions,
  renderQualitySettings,
} from "@/lib/flower-quality";

describe("render quality tiers", () => {
  it("defines Draft, High, and Ultra in increasing order", () => {
    expect(renderQualityOptions).toEqual(["draft", "high", "ultra"]);
    expect(renderQualitySettings.draft.maxDpr).toBeLessThan(
      renderQualitySettings.high.maxDpr,
    );
    expect(renderQualitySettings.high.maxDpr).toBeLessThan(
      renderQualitySettings.ultra.maxDpr,
    );
  });

  it("keeps expensive effects out of Draft", () => {
    expect(renderQualitySettings.draft).toMatchObject({
      shadows: false,
      environment: false,
      postProcessing: false,
    });
  });

  it("increases shadow fidelity without changing design data", () => {
    expect(renderQualitySettings.ultra.shadowMapSize).toBeGreaterThan(
      renderQualitySettings.high.shadowMapSize,
    );
    expect(renderQualitySettings.ultra.contactShadowResolution).toBeGreaterThan(
      renderQualitySettings.high.contactShadowResolution,
    );
  });

  it("uses tier-specific procedural texture resolution", () => {
    expect(getTextureResolution("draft")).toBe(64);
    expect(getTextureResolution("high")).toBe(128);
    expect(getTextureResolution("ultra")).toBe(256);
  });

  it("temporarily lowers expensive tiers during interaction", () => {
    expect(getEffectiveRenderQuality("ultra", true)).toBe("draft");
    expect(getEffectiveRenderQuality("high", true)).toBe("draft");
    expect(getEffectiveRenderQuality("draft", true)).toBe("draft");
    expect(getEffectiveRenderQuality("ultra", false)).toBe("ultra");
  });
});
