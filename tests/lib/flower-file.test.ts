// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  createFlowerDesignFile,
  parseFlowerDesignFile,
} from "@/lib/flower-file";
import { selectFlowerSettings } from "@/lib/flower-design";
import { useFlowerStore } from "@/lib/flower-store";

const design = () => ({
  name: "Cosmos study",
  settings: selectFlowerSettings(useFlowerStore.getState()),
});

describe("FlowerPower design files", () => {
  it("creates and parses a versioned design file", () => {
    const file = createFlowerDesignFile(design());

    expect(file).toMatchObject({
      format: "flowerpower-design",
      version: 1,
      name: "Cosmos study",
      settings: { preset: "Cosmos", seed: 42 },
    });
    expect(parseFlowerDesignFile(JSON.stringify(file))).toEqual(file);
  });

  it.each([
    "not json",
    "{}",
    JSON.stringify({ ...createFlowerDesignFile(design()), version: 2 }),
    JSON.stringify({
      ...createFlowerDesignFile(design()),
      settings: { ...design().settings, petalCount: 0 },
    }),
  ])("rejects invalid or unsupported files", (contents) => {
    expect(() => parseFlowerDesignFile(contents)).toThrow();
  });
});
