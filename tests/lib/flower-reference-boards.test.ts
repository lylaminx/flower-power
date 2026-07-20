import { describe, expect, it } from "vitest";

import {
  getReferenceBoard,
  getReferenceBoards,
  isHeroFlowerPreset,
} from "@/lib/flower-reference-boards";

describe("flower reference boards", () => {
  it("loads the curated boards and image metadata", async () => {
    const boards = await getReferenceBoards();

    expect(boards.map((board) => board.species)).toEqual([
      "Rose",
      "Poppy",
      "Lily",
      "Sunflower",
      "Orchid",
      "Lotus",
    ]);
    expect(boards.every((board) => board.images.length > 0)).toBe(true);
    expect(boards[0].images[0]).toMatchObject({
      species: "Rose",
      imageUrl: expect.stringMatching(/^\/api\/reference-flowers\/rose\//),
      creator: expect.any(String),
      license: expect.any(String),
    });
  });

  it("loads one board and recognizes supported species", async () => {
    expect(isHeroFlowerPreset("Lotus")).toBe(true);
    expect(isHeroFlowerPreset("Daisy")).toBe(false);

    await expect(getReferenceBoard("Lotus")).resolves.toMatchObject({
      species: "Lotus",
      label: expect.any(String),
      images: expect.any(Array),
    });
  });
});
