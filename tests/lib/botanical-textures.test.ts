import { describe, expect, it } from "vitest";
import {
  getBotanicalAgeTexture,
  getBotanicalMaterialTexture,
  getBotanicalTexture,
} from "@/lib/botanical-textures";

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

  it("creates and caches tier-specific texture resolutions", () => {
    const draft = getBotanicalTexture("petal", 64);
    const ultra = getBotanicalTexture("petal", 256);

    expect(draft.image.width).toBe(64);
    expect(ultra.image.width).toBe(256);
    expect(draft).not.toBe(ultra);
    expect(getBotanicalTexture("petal", 64)).toBe(draft);
  });

  it.each(["roughness", "thickness", "moisture"] as const)(
    "creates a reusable RGBA %s map with a green channel",
    (map) => {
      const texture = getBotanicalMaterialTexture("petal", map);
      const data = texture.image.data as Uint8Array;

      expect(texture.image.width).toBe(128);
      expect(data).toHaveLength(128 * 128 * 4);
      expect(data[0]).toBe(data[1]);
      expect(getBotanicalMaterialTexture("petal", map)).toBe(texture);
    },
  );

  it("encodes reusable tangent-space micro normals", () => {
    const texture = getBotanicalMaterialTexture("petal", "microNormal");
    const data = texture.image.data as Uint8Array;

    expect(data[2]).toBeGreaterThan(200);
    expect(
      data.some((channel, index) => index % 4 === 0 && channel !== 128),
    ).toBe(true);
    expect(getBotanicalMaterialTexture("petal", "microNormal")).toBe(texture);
  });

  it("makes petal veins thicker than the nearby tissue", () => {
    const texture = getBotanicalMaterialTexture("petal", "thickness");
    const data = texture.image.data as Uint8Array;
    const y = 64;
    const channelAt = (x: number) => data[(y * 128 + x) * 4 + 1];

    expect(channelAt(64)).toBeGreaterThan(channelAt(42));
  });

  it("creates deterministic age maps with stronger edge discoloration", () => {
    const texture = getBotanicalAgeTexture("petal", 0.8, 42);
    const data = texture.image.data as Uint8Array;
    const channelAt = (x: number, y: number, channel: number) =>
      data[(y * 128 + x) * 4 + channel];

    expect(channelAt(0, 64, 2)).toBeLessThan(channelAt(64, 64, 2));
    expect(getBotanicalAgeTexture("petal", 0.8, 42)).toBe(texture);
    expect(getBotanicalAgeTexture("petal", 0.8, 43)).not.toBe(texture);
  });

  it("keeps new tissue neutral", () => {
    const data = getBotanicalAgeTexture("leaf", 0, 9).image.data as Uint8Array;

    expect(new Set(data.filter((_, index) => index % 4 !== 3))).toEqual(
      new Set([255]),
    );
  });
});
