import { describe, expect, it } from "vitest";
import { getBotanicalTexture } from "@/lib/botanical-textures";

describe("botanical textures", () => {
  it.each(["petal", "leaf", "stem", "center"] as const)(
    "creates a reusable %s data texture",
    (surface) => {
      const texture = getBotanicalTexture(surface);

      expect(texture.image.width).toBe(128);
      expect(texture.image.height).toBe(128);
      expect(texture.version).toBeGreaterThan(0);
      expect(getBotanicalTexture(surface)).toBe(texture);
    },
  );

  it("uses a denser repeat for fibrous stems", () => {
    const stem = getBotanicalTexture("stem");
    const petal = getBotanicalTexture("petal");

    expect(stem.repeat.x).toBeGreaterThan(petal.repeat.x);
    expect(stem.repeat.y).toBeGreaterThan(petal.repeat.y);
  });
});
