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
      expect(scenario.dimensions.width).toBe(scenario.dimensions.height);
      if (!scenario.reviewOnly) {
        expect(scenario.dimensions).toEqual({ width: 1440, height: 1440 });
      }
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
    expect(
      getVisualTestScenario("orchid-phalaenopsis-center-macro-review"),
    ).toMatchObject({
      focalLength: 120,
      camera: {
        target: [0.25, -0.82, 0],
        fov: 18,
      },
    });
    expect(
      getVisualTestScenario("orchid-phalaenopsis-labellum-macro-review"),
    ).toMatchObject({
      species: "Orchid",
      lighting: "macroPhotography",
      focalLength: 120,
      reviewOnly: true,
    });
    expect(
      getVisualTestScenario("sunflower-ray-backlight-review"),
    ).toMatchObject({
      species: "Sunflower",
      lighting: "morningBacklight",
      focalLength: 105,
      reviewOnly: true,
    });
    expect(getVisualTestScenario("sunflower-ray-macro-review")).toMatchObject({
      species: "Sunflower",
      lighting: "macroPhotography",
      focalLength: 120,
      reviewOnly: true,
    });
    expect(
      getVisualTestScenario("sunflower-ray-macro-ultra-review"),
    ).toMatchObject({
      species: "Sunflower",
      quality: "ultra",
      lighting: "macroPhotography",
      focalLength: 120,
      reviewOnly: true,
    });
    expect(
      getVisualTestScenario("sunflower-center-macro-review"),
    ).toMatchObject({
      species: "Sunflower",
      lighting: "macroPhotography",
      focalLength: 120,
      reviewOnly: true,
    });
    expect(
      getVisualTestScenario("sunflower-reference-front-seed-1847-review"),
    ).toMatchObject({ species: "Sunflower", seed: 1847, reviewOnly: true });
    expect(
      getVisualTestScenario("sunflower-reference-front-seed-2718-review"),
    ).toMatchObject({ species: "Sunflower", seed: 2718, reviewOnly: true });
    expect(
      getVisualTestScenario("sunflower-attachment-underside-review"),
    ).toMatchObject({
      species: "Sunflower",
      lighting: "overcastGarden",
      focalLength: 85,
      reviewOnly: true,
      camera: { fov: 30 },
    });
    expect(
      getVisualTestScenario("sunflower-whole-plant-habit-review"),
    ).toMatchObject({
      species: "Sunflower",
      lighting: "overcastGarden",
      focalLength: 50,
      groundStyle: "garden",
      fogNear: 14,
      fogFar: 24,
      effects: { ambientOcclusion: true },
      reviewOnly: true,
    });
    expect(getVisualTestScenario("lily-tepal-backlight-review")).toMatchObject({
      species: "Lily",
      lighting: "morningBacklight",
      focalLength: 110,
      reviewOnly: true,
    });
    expect(getVisualTestScenario("lily-tepal-macro-review")).toMatchObject({
      species: "Lily",
      lighting: "macroPhotography",
      focalLength: 120,
      reviewOnly: true,
    });
    expect(getVisualTestScenario("lily-center-macro-review")).toMatchObject({
      species: "Lily",
      lighting: "macroPhotography",
      focalLength: 120,
      reviewOnly: true,
    });
    expect(getVisualTestScenario("rose-petal-backlight-review")).toMatchObject({
      species: "Rose",
      lighting: "morningBacklight",
      focalLength: 105,
      reviewOnly: true,
      camera: {
        position: [-1.5, 1.2, 4.2],
        target: [0, 1.65, 0],
        fov: 24,
      },
    });
    expect(getVisualTestScenario("rose-petal-macro-review")).toMatchObject({
      species: "Rose",
      lighting: "macroPhotography",
      focalLength: 120,
      reviewOnly: true,
      camera: {
        position: [-0.82, 1.76, 1.85],
        target: [-0.35, 1.75, 0],
        fov: 17,
      },
    });
    expect(getVisualTestScenario("rose-center-macro-review")).toMatchObject({
      species: "Rose",
      lighting: "macroPhotography",
      focalLength: 120,
      reviewOnly: true,
      camera: {
        position: [0.68, 2.51, 0.94],
        target: [0.05, 1.45, 0],
        fov: 18,
      },
    });
    expect(getVisualTestScenario("lotus-petal-backlight-review")).toMatchObject(
      {
        species: "Lotus",
        lighting: "morningBacklight",
        focalLength: 105,
        reviewOnly: true,
      },
    );
    expect(getVisualTestScenario("lotus-petal-macro-review")).toMatchObject({
      species: "Lotus",
      lighting: "macroPhotography",
      focalLength: 120,
      reviewOnly: true,
    });
  });

  it("looks up scenarios by route id", () => {
    expect(getVisualTestScenario("poppy-studio-front")?.seed).toBe(2718);
    const lilyFrontSeeds = [
      "lily-reference-front-review",
      "lily-reference-front-seed-2718-review",
      "lily-reference-front-seed-5772-review",
    ].map((id) => getVisualTestScenario(id));
    expect(lilyFrontSeeds.map((scenario) => scenario?.seed)).toEqual([
      3141, 2718, 5772,
    ]);
    expect(
      lilyFrontSeeds.every(
        (scenario) =>
          scenario?.species === "Lily" &&
          scenario.lighting === "overcastGarden" &&
          scenario.reviewOnly,
      ),
    ).toBe(true);
    expect(getVisualTestScenario("lily-garden-habit-review")).toMatchObject({
      species: "Lily",
      lighting: "overcastGarden",
      groundStyle: "garden",
      backgroundColor: "#b8c6b2",
      effects: {
        ambientOcclusion: true,
        depthOfField: true,
        aperture: 5.6,
        focusDistance: 10.7,
      },
      reviewOnly: true,
    });
    expect(
      getVisualTestScenario("poppy-morning-backlight-review"),
    ).toMatchObject({
      species: "Poppy",
      lighting: "morningBacklight",
      reviewOnly: true,
    });
    const poppyBacklightSeeds = [
      "poppy-morning-backlight-review",
      "poppy-morning-backlight-seed-1618-review",
      "poppy-morning-backlight-seed-5772-review",
    ].map((id) => getVisualTestScenario(id));
    expect(poppyBacklightSeeds.map((scenario) => scenario?.seed)).toEqual([
      2718, 1618, 5772,
    ]);
    expect(getVisualTestScenario("poppy-outdoor-front-review")).toMatchObject({
      species: "Poppy",
      groundStyle: "garden",
      backgroundColor: "#b8c6b2",
      reviewOnly: true,
    });
    const poppyHabitSeeds = [
      "poppy-outdoor-front-review",
      "poppy-outdoor-front-seed-1618-review",
      "poppy-outdoor-front-seed-5772-review",
    ].map((id) => getVisualTestScenario(id));
    expect(poppyHabitSeeds.map((scenario) => scenario?.seed)).toEqual([
      2718, 1618, 5772,
    ]);
    expect(
      poppyHabitSeeds.every(
        (scenario) =>
          scenario?.species === "Poppy" &&
          scenario.groundStyle === "garden" &&
          scenario.reviewOnly,
      ),
    ).toBe(true);
    expect(getVisualTestScenario("poppy-petal-macro-review")).toMatchObject({
      species: "Poppy",
      lighting: "macroPhotography",
      focalLength: 70,
      reviewOnly: true,
    });
    const poppyMacroSeeds = [
      "poppy-petal-macro-review",
      "poppy-petal-macro-seed-1618-review",
      "poppy-petal-macro-seed-5772-review",
    ].map((id) => getVisualTestScenario(id));
    expect(poppyMacroSeeds.map((scenario) => scenario?.seed)).toEqual([
      2718, 1618, 5772,
    ]);
    expect(
      poppyMacroSeeds.every(
        (scenario) =>
          scenario?.lighting === "macroPhotography" &&
          scenario.focalLength === 70 &&
          scenario.reviewOnly,
      ),
    ).toBe(true);
    expect(getVisualTestScenario("poppy-center-macro-review")).toMatchObject({
      species: "Poppy",
      lighting: "macroPhotography",
      focalLength: 120,
      reviewOnly: true,
    });
    expect(getVisualTestScenario("poppy-side-profile-review")).toMatchObject({
      species: "Poppy",
      lighting: "botanicalStudio",
      reviewOnly: true,
    });
    expect(
      getVisualTestScenario("poppy-underside-attachment-review"),
    ).toMatchObject({
      species: "Poppy",
      lighting: "botanicalStudio",
      reviewOnly: true,
    });
    const poppyUndersideSeeds = [
      "poppy-underside-attachment-review",
      "poppy-underside-attachment-seed-1618-review",
      "poppy-underside-attachment-seed-5772-review",
    ].map((id) => getVisualTestScenario(id));
    expect(poppyUndersideSeeds.map((scenario) => scenario?.seed)).toEqual([
      2718, 1618, 5772,
    ]);
    expect(getVisualTestScenario("poppy-foliage-stem-review")).toMatchObject({
      species: "Poppy",
      lighting: "botanicalStudio",
      reviewOnly: true,
    });
    const poppyFoliageSeeds = [
      "poppy-foliage-stem-review",
      "poppy-foliage-stem-seed-1618-review",
      "poppy-foliage-stem-seed-5772-review",
    ].map((id) => getVisualTestScenario(id));
    expect(poppyFoliageSeeds.map((scenario) => scenario?.seed)).toEqual([
      2718, 1618, 5772,
    ]);
    expect(getVisualTestScenario("poppy-nodding-bud-review")).toMatchObject({
      species: "Poppy",
      focalLength: 105,
      reviewOnly: true,
    });
    expect(
      getVisualTestScenario("lotus-nucifera-aquatic-foliage-review"),
    ).toMatchObject({ species: "Lotus", groundStyle: "water" });
    expect(getVisualTestScenario("lotus-center-macro-review")).toMatchObject({
      species: "Lotus",
      lighting: "macroPhotography",
      focalLength: 120,
      reviewOnly: true,
    });
    expect(getVisualTestScenario("lily-reference-front-review")).toMatchObject({
      species: "Lily",
      reviewOnly: true,
    });
    expect(getVisualTestScenario("lily-reference-side-review")).toMatchObject({
      species: "Lily",
      reviewOnly: true,
    });
    expect(
      getVisualTestScenario("orchid-phalaenopsis-tepal-backlight-review"),
    ).toMatchObject({
      species: "Orchid",
      lighting: "morningBacklight",
      focalLength: 120,
      reviewOnly: true,
      camera: {
        position: [3, 0.2, 4.5],
        target: [0.25, -0.82, 0],
        fov: 18,
      },
    });
    expect(getVisualTestScenario("rose-rugosa-front-review")).toMatchObject({
      species: "Rose",
      reviewOnly: true,
    });
    expect(
      getVisualTestScenario("rose-petal-macro-ultra-review"),
    ).toMatchObject({
      species: "Rose",
      quality: "ultra",
      lighting: "macroPhotography",
      reviewOnly: true,
    });
    expect(
      getVisualTestScenario("rose-rugosa-front-seed-2718-review"),
    ).toMatchObject({ species: "Rose", seed: 2718, reviewOnly: true });
    expect(
      getVisualTestScenario("rose-rugosa-front-seed-5772-review"),
    ).toMatchObject({ species: "Rose", seed: 5772, reviewOnly: true });
    expect(getVisualTestScenario("rose-rugosa-habit-review")).toMatchObject({
      species: "Rose",
      lighting: "overcastGarden",
      focalLength: 46,
      groundStyle: "garden",
      effects: { depthOfField: true, aperture: 5.6 },
      reviewOnly: true,
    });
    expect(getVisualTestScenario("rose-rugosa-side-review")).toMatchObject({
      species: "Rose",
      lighting: "overcastGarden",
      focalLength: 105,
      reviewOnly: true,
      effects: { ambientOcclusion: true },
    });
    expect(getVisualTestScenario("rose-rugosa-underside-review")).toMatchObject(
      {
        species: "Rose",
        reviewOnly: true,
        effects: { ambientOcclusion: true },
      },
    );
    expect(
      getVisualTestScenario("rose-rugosa-foliage-stem-review"),
    ).toMatchObject({
      species: "Rose",
      lighting: "overcastGarden",
      focalLength: 85,
      reviewOnly: true,
      effects: { ambientOcclusion: true },
    });
    expect(getVisualTestScenario("missing")).toBeUndefined();
  });
});
