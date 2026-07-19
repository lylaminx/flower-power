// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFlowerStore } from "@/lib/flower-store";

const { exportPng } = vi.hoisted(() => ({ exportPng: vi.fn() }));

vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<unknown>,
    options: { loading?: () => React.ReactNode },
  ) => {
    void loader();
    options.loading?.();
    return function MockFlowerScene({
      onExportReady,
    }: {
      onExportReady: (handler: typeof exportPng | null) => void;
    }) {
      React.useEffect(() => {
        onExportReady(exportPng);
        return () => onExportReady(null);
      }, [onExportReady]);
      return <div data-testid="flower-scene" />;
    };
  },
}));

import { FlowerStudio } from "@/components/flower-studio";

const initialState = useFlowerStore.getState();

describe("FlowerStudio", () => {
  beforeEach(() => {
    useFlowerStore.setState(initialState, true);
    exportPng.mockClear();
    localStorage.clear();
    document.documentElement.dataset.theme = "light";
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 201 }),
    );
  });

  it("renders the editor, active preset, and current seed", () => {
    render(<FlowerStudio />);

    expect(
      screen.getByRole("heading", { name: "Shape your bloom" }),
    ).toBeVisible();
    expect(screen.getByTestId("flower-scene")).toBeInTheDocument();
    expect(screen.getByText("Cosmos · Seed 42")).toBeVisible();
    expect(screen.getByRole("button", { name: "Cosmos" })).toHaveClass(
      "active",
    );
    expect(
      screen.getByRole("link", { name: "Open documentation" }),
    ).toHaveAttribute("href", "/docs");
    expect(
      screen.getByRole("complementary", { name: "Flower color palette" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Reset canvas view" }),
    ).toBeVisible();
    expect(
      screen.getByRole("combobox", { name: "Photographic lighting preset" }),
    ).toHaveValue("botanicalStudio");
    expect(
      screen.getByRole("combobox", { name: "Camera composition" }),
    ).toHaveValue("threeQuarter");
    expect(
      screen.getByRole("slider", { name: "Camera focal length" }),
    ).toHaveValue("52");
    expect(
      screen.getByRole("checkbox", { name: "Enable depth of field" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Enable highlight bloom" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Enable ambient occlusion" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("combobox", { name: "Rendering quality" }),
    ).toHaveValue("high");
  });

  it("changes rendering quality independently of flower settings", async () => {
    const user = userEvent.setup();
    render(<FlowerStudio />);
    const preset = useFlowerStore.getState().preset;

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Rendering quality" }),
      "ultra",
    );

    expect(
      screen.getByRole("combobox", { name: "Rendering quality" }),
    ).toHaveValue("ultra");
    expect(useFlowerStore.getState().preset).toBe(preset);
  });

  it("enables restrained ambient occlusion controls in photo mode", async () => {
    const user = userEvent.setup();
    render(<FlowerStudio />);

    await user.click(
      screen.getByRole("checkbox", { name: "Enable ambient occlusion" }),
    );

    expect(useFlowerStore.getState().renderMode).toBe("photo");
    expect(
      screen.getByRole("slider", { name: "Ambient occlusion strength" }),
    ).toHaveValue("0.42");
  });

  it("enables restrained highlight bloom controls in photo mode", async () => {
    const user = userEvent.setup();
    render(<FlowerStudio />);

    await user.click(
      screen.getByRole("checkbox", { name: "Enable highlight bloom" }),
    );

    expect(useFlowerStore.getState().renderMode).toBe("photo");
    expect(
      screen.getByRole("slider", { name: "Highlight bloom strength" }),
    ).toHaveValue("0.12");
  });

  it("enables restrained photographic depth of field controls", async () => {
    const user = userEvent.setup();
    render(<FlowerStudio />);

    await user.click(
      screen.getByRole("checkbox", { name: "Enable depth of field" }),
    );

    expect(useFlowerStore.getState().renderMode).toBe("photo");
    expect(screen.getByRole("slider", { name: "Camera aperture" })).toHaveValue(
      "5.6",
    );
    expect(
      screen.getByRole("slider", { name: "Camera focus distance" }),
    ).toHaveValue("7");
  });

  it("changes composition and adopts its default focal length", async () => {
    const user = userEvent.setup();
    render(<FlowerStudio />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Camera composition" }),
      "macro",
    );

    expect(
      screen.getByRole("slider", { name: "Camera focal length" }),
    ).toHaveValue("85");
  });

  it("selects a photographic lighting rig and enters photo mode", async () => {
    const user = userEvent.setup();
    render(<FlowerStudio />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Photographic lighting preset" }),
      "goldenHour",
    );

    expect(
      screen.getByRole("combobox", { name: "Photographic lighting preset" }),
    ).toHaveValue("goldenHour");
    expect(useFlowerStore.getState().renderMode).toBe("photo");
  });

  it("toggles and remembers the color theme", async () => {
    const user = userEvent.setup();
    render(<FlowerStudio />);

    await user.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("flowerpower-theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeVisible();
  });

  it("updates numeric and color controls", () => {
    render(<FlowerStudio />);

    fireEvent.change(screen.getByRole("slider", { name: /Petal count/ }), {
      target: { value: "24" },
    });
    fireEvent.change(screen.getByLabelText(/Petal glow/), {
      target: { value: "#112233" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Element density/ }), {
      target: { value: "1.6" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Petal waviness/ }), {
      target: { value: "0.55" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /^Thickness/ }), {
      target: { value: "1.4" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Leaf curl/ }), {
      target: { value: "0.7" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Central fold/ }), {
      target: { value: "0.75" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Anther size/ }), {
      target: { value: "1.35" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Bloom tilt/ }), {
      target: { value: "0.3" },
    });
    fireEvent.change(
      screen.getByRole("slider", { name: /Natural asymmetry/ }),
      { target: { value: "0.2" } },
    );
    fireEvent.change(screen.getByRole("slider", { name: /Edge wear/ }), {
      target: { value: "0.3" },
    });
    fireEvent.change(screen.getByRole("slider", { name: /Sepal spread/ }), {
      target: { value: "0.6" },
    });

    expect(useFlowerStore.getState()).toMatchObject({
      petalCount: 24,
      petalTipColor: "#112233",
      centerDensity: 1.6,
      petalWaviness: 0.55,
      stemThickness: 1.4,
      leafCurl: 0.7,
      petalFold: 0.75,
      centerAntherSize: 1.35,
      bloomTilt: 0.3,
      petalAsymmetry: 0.2,
      petalEdgeWear: 0.3,
      sepalSpread: 0.6,
    });
    expect(screen.getByText("24")).toBeVisible();
    expect(screen.getByText("#112233")).toBeVisible();
  }, 10_000);

  it("applies presets and updates the live-study label", async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<FlowerStudio />);

    await user.click(screen.getByRole("button", { name: "Sunset" }));

    expect(useFlowerStore.getState()).toMatchObject({
      preset: "Sunset",
      seed: 5000,
    });
    expect(screen.getByText("Sunset · Seed 5000")).toBeVisible();
  });

  it("toggles the grid and both control panels", async () => {
    const user = userEvent.setup();
    render(<FlowerStudio />);

    await user.click(
      screen.getByRole("button", { name: "Toggle composition grid" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Toggle variety panel" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Toggle adjustment panel" }),
    );

    expect(useFlowerStore.getState()).toMatchObject({
      grid: true,
      panelOpen: false,
      rightPanelOpen: false,
    });
    expect(document.querySelector(".left-panel")).toHaveClass("closed");
    expect(document.querySelector(".right-panel")).toHaveClass("closed");
  });

  it("switches between color and line-drawing views", async () => {
    const user = userEvent.setup();
    render(<FlowerStudio />);

    await user.click(
      screen.getByRole("button", { name: "Switch to line drawing" }),
    );

    expect(useFlowerStore.getState().renderMode).toBe("line");
    expect(
      screen.getByRole("button", { name: "Switch to color view" }),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Switch to color view" }),
    );
    expect(useFlowerStore.getState().renderMode).toBe("color");
  });

  it("switches photorealistic rendering on and off", async () => {
    const user = userEvent.setup();
    render(<FlowerStudio />);

    await user.click(
      screen.getByRole("button", {
        name: "Switch to photorealistic rendering",
      }),
    );
    expect(useFlowerStore.getState().renderMode).toBe("photo");

    await user.click(
      screen.getByRole("button", { name: "Switch to color view" }),
    );
    expect(useFlowerStore.getState().renderMode).toBe("color");
  });

  it("randomizes the flower and exports the canvas", async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, "random").mockReturnValue(0.25);
    render(<FlowerStudio />);

    await user.click(
      screen.getByRole("button", { name: "Randomize naturally" }),
    );
    await user.click(screen.getByRole("button", { name: "Export PNG" }));

    expect(useFlowerStore.getState().seed).toBe(25000);
    expect(exportPng).toHaveBeenCalledOnce();
  });

  it("saves the current design through the flowers API", async () => {
    const user = userEvent.setup();
    render(<FlowerStudio />);

    await user.click(screen.getByRole("button", { name: "Save study" }));

    expect(screen.getByRole("button", { name: "Saved" })).toBeVisible();
    expect(fetch).toHaveBeenCalledWith("/api/flowers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.any(String),
    });
    const request = vi.mocked(fetch).mock.calls[0][1];
    const saved = JSON.parse(String(request?.body));
    expect(saved).toMatchObject({
      name: "Cosmos study",
      settings: { preset: "Cosmos", seed: 42 },
    });
    expect(saved.settings).not.toHaveProperty("set");
    expect(saved.settings).not.toHaveProperty("panelOpen");
  });

  it("downloads a design file without using the API in file mode", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:flower-design");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<FlowerStudio persistenceMode="file" />);

    expect(screen.getByRole("button", { name: "Load JSON" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Saved flowers" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save JSON" }));

    expect(screen.getByRole("button", { name: "Saved" })).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({ type: "application/json" }),
    );
  });

  it("shows when the database save fails", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 503 } as Response);
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<FlowerStudio />);

    await user.click(screen.getByRole("button", { name: "Save study" }));

    expect(screen.getByRole("button", { name: "Save failed" })).toBeVisible();
  });
});
