import { describe, expect, it } from "vitest";
import {
  getVisualTestScenario,
  isVisualTestScenario,
  visualTestScenarios,
} from "@/lib/visual-test-scenarios";

describe("visual test scenarios", () => {
  it("defines one deterministic target for every hero species", () => {
    expect(
      visualTestScenarios.slice(0, 6).map((scenario) => scenario.species),
    ).toEqual(["Rose", "Poppy", "Lily", "Sunflower", "Orchid", "Lotus"]);
    expect(
      new Set(visualTestScenarios.map((scenario) => scenario.id)).size,
    ).toBe(visualTestScenarios.length);
  });

  it("covers the fused bell and trumpet structural families", () => {
    expect(visualTestScenarios.map((scenario) => scenario.species)).toEqual(
      expect.arrayContaining(["Bluebell", "Morning Glory"]),
    );
  });

  it("covers the spike and cluster structural families", () => {
    expect(visualTestScenarios.map((scenario) => scenario.species)).toEqual(
      expect.arrayContaining(["Gladiolus", "Rhododendron"]),
    );
  });

  it("uses fixed square capture dimensions and valid scenarios", () => {
    for (const scenario of visualTestScenarios) {
      expect(isVisualTestScenario(scenario)).toBe(true);
      expect(scenario.dimensions).toEqual({ width: 1440, height: 1440 });
    }
  });

  it("calibrates every photographic lighting preset", () => {
    expect(
      new Set(visualTestScenarios.map((scenario) => scenario.lighting)),
    ).toEqual(
      new Set([
        "botanicalStudio",
        "overcastGarden",
        "morningBacklight",
        "goldenHour",
        "museumIllustration",
        "macroPhotography",
      ]),
    );
  });

  it("covers macro focus and underside occlusion", () => {
    expect(getVisualTestScenario("lotus-macro-focus")?.effects).toMatchObject({
      depthOfField: true,
      aperture: 5.6,
    });
    expect(
      getVisualTestScenario("rose-studio-underside")?.effects,
    ).toMatchObject({ ambientOcclusion: true });
  });

  it("looks up scenarios by route id", () => {
    expect(getVisualTestScenario("poppy-studio-front")?.seed).toBe(2718);
    expect(getVisualTestScenario("missing")).toBeUndefined();
  });
});
