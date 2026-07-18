import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFlowerStore } from "@/lib/flower-store";

const initialState = useFlowerStore.getState();

describe("useFlowerStore", () => {
  beforeEach(() => {
    useFlowerStore.setState(initialState, true);
    vi.restoreAllMocks();
  });

  it("updates any editable setting", () => {
    useFlowerStore.getState().set("petalLength", 2.1);
    useFlowerStore.getState().set("backgroundColor", "#123456");

    expect(useFlowerStore.getState()).toMatchObject({
      petalLength: 2.1,
      backgroundColor: "#123456",
    });
  });

  it.each([
    ["Daisy", 20, "#f7efe7"],
    ["Cosmos", 12, "#d47a9a"],
    ["Sunset", 16, "#d95f45"],
    ["Poppy", 6, "#c9342f"],
    ["Coneflower", 18, "#b85f87"],
    ["Dahlia", 22, "#a82f58"],
    ["Rose", 18, "#b93657"],
    ["Sunflower", 28, "#e7a51e"],
    ["Peony", 20, "#dc829a"],
    ["Lotus", 16, "#e39bad"],
    ["Anemone", 9, "#6f55a4"],
    ["Zinnia", 22, "#df5b4f"],
    ["Tulip", 6, "#c93f58"],
    ["Iris", 6, "#6551a2"],
    ["Lily", 6, "#f0d8d4"],
    ["Orchid", 5, "#ead9ed"],
    ["Carnation", 28, "#d85f72"],
    ["Cherry Blossom", 5, "#f0c5cf"],
    ["Magnolia", 9, "#eee4df"],
    ["Camellia", 24, "#c8324f"],
    ["Chrysanthemum", 32, "#d69a35"],
    ["Daffodil", 6, "#f1d64e"],
    ["Hibiscus", 5, "#d83c57"],
    ["Marigold", 30, "#e88718"],
    ["Pansy", 5, "#7253a4"],
    ["Gardenia", 20, "#f1eee4"],
    ["Ranunculus", 30, "#e57466"],
    ["Gerbera", 30, "#e0525f"],
    ["Bluebell", 6, "#536bbb"],
    ["Protea", 28, "#b9586d"],
    ["Water Lily", 22, "#eee4ed"],
    ["Morning Glory", 5, "#536fb4"],
    ["Calla Lily", 1, "#eeeae0"],
    ["Forget-me-not", 5, "#668ec9"],
    ["Aster", 30, "#765ca8"],
    ["Clematis", 8, "#7957a0"],
    ["Hellebore", 5, "#c8bdcf"],
    ["Crocus", 6, "#7756a6"],
    ["Amaryllis", 6, "#c93f4b"],
    ["Primrose", 5, "#e8cf58"],
    ["Plumeria", 5, "#eee9df"],
    ["Poinsettia", 12, "#b92f3c"],
  ] as const)("applies the %s preset", (preset, petalCount, petalColor) => {
    vi.spyOn(Math, "random").mockReturnValue(0.1234);

    useFlowerStore.getState().applyPreset(preset);

    expect(useFlowerStore.getState()).toMatchObject({
      preset,
      petalCount,
      petalColor,
      seed: 1234,
    });
  });

  it("toggles the controls panel", () => {
    const wasOpen = useFlowerStore.getState().panelOpen;

    useFlowerStore.getState().togglePanel();

    expect(useFlowerStore.getState().panelOpen).toBe(!wasOpen);
  });

  it("loads saved flower settings without closing the panels", () => {
    const settings = {
      renderMode: "line" as const,
      preset: "Daisy" as const,
      petalCount: 25,
      petalLength: 1.4,
      petalWidth: 0.5,
      petalCurl: 0.2,
      petalWaviness: 0.35,
      petalThickness: 1.2,
      petalFold: 0.7,
      petalTwist: -0.25,
      petalRuffle: 1.3,
      petalNotch: 0.8,
      petalVeinStrength: 1.4,
      petalBaseWidth: 1.1,
      petalAge: 0.2,
      petalSpots: 0.3,
      petalGuideStrength: 0.5,
      bloom: 0.8,
      variation: 0.1,
      petalColor: "#ffffff",
      petalTipColor: "#eeeeee",
      centerColor: "#aaaaaa",
      centerDensity: 1.5,
      centerSize: 1.2,
      centerProfile: 0.9,
      centerFloretSize: 1.3,
      centerSpread: 1.1,
      centerStamenLength: 1.4,
      centerAntherSize: 0.8,
      centerStigmaSize: 1.25,
      stemColor: "#336633",
      backgroundColor: "#ffffff",
      stemCurve: 0.2,
      stemHeight: 1.1,
      stemThickness: 1.25,
      stemTaper: 0.45,
      stemNodeCount: 4,
      stemHairDensity: 0.8,
      leafDensity: 1.5,
      leafLength: 1.2,
      leafWidth: 0.85,
      leafCurl: 0.6,
      leafSerration: 1.3,
      leafVeinDensity: 1.4,
      leafDroop: 0.5,
      bloomTilt: 0.2,
      bloomTurn: -0.4,
      lightIntensity: 1,
      seed: 99,
      grid: true,
    };
    useFlowerStore.getState().loadSettings(settings);
    expect(useFlowerStore.getState()).toMatchObject({
      ...settings,
      panelOpen: true,
      rightPanelOpen: true,
    });
  });

  it("keeps randomized values within their supported ranges", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    useFlowerStore.setState({ petalCount: 4, petalCurl: 0, variation: 0.04 });

    useFlowerStore.getState().randomize();

    expect(useFlowerStore.getState()).toMatchObject({
      petalCount: 1,
      petalCurl: 0,
      variation: 0.04,
      seed: 0,
    });
  });

  it("caps randomized values at their upper bounds", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99999);
    useFlowerStore.setState({ petalCount: 32, petalCurl: 1, variation: 0.45 });

    useFlowerStore.getState().randomize();

    expect(useFlowerStore.getState()).toMatchObject({
      petalCount: 32,
      petalCurl: 1,
      variation: 0.45,
      seed: 99999,
    });
  });
});
