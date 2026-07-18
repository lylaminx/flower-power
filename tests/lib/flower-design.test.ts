import { describe, expect, it } from "vitest";
import { isSaveFlowerInput, selectFlowerSettings } from "@/lib/flower-design";
import { useFlowerStore } from "@/lib/flower-store";

describe("flower design payloads", () => {
  it("selects only persistent flower settings", () => {
    const settings = selectFlowerSettings(useFlowerStore.getState());

    expect(settings).toMatchObject({ preset: "Cosmos", seed: 42 });
    expect(settings).not.toHaveProperty("set");
    expect(settings).not.toHaveProperty("panelOpen");
  });

  it("accepts a complete valid design", () => {
    expect(
      isSaveFlowerInput({
        name: "Cosmos study",
        settings: selectFlowerSettings(useFlowerStore.getState()),
      }),
    ).toBe(true);
  });

  it("accepts photorealistic render mode", () => {
    expect(
      isSaveFlowerInput({
        name: "Photorealistic study",
        settings: {
          ...selectFlowerSettings(useFlowerStore.getState()),
          renderMode: "photo",
        },
      }),
    ).toBe(true);
  });

  it.each([
    null,
    {},
    { name: "", settings: {} },
    {
      name: "Invalid color",
      settings: {
        ...selectFlowerSettings(useFlowerStore.getState()),
        petalColor: "pink",
      },
    },
    {
      name: "Invalid count",
      settings: {
        ...selectFlowerSettings(useFlowerStore.getState()),
        petalCount: 0,
      },
    },
  ])("rejects invalid input %#", (input) => {
    expect(isSaveFlowerInput(input)).toBe(false);
  });
});
