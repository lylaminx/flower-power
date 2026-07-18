// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { canvasToPngBlob, downloadBlob } from "@/lib/canvas-export";

describe("canvas PNG export", () => {
  it("encodes a canvas as a PNG blob", async () => {
    const png = new Blob(["png"], { type: "image/png" });
    const canvas = document.createElement("canvas");
    canvas.toBlob = vi.fn((callback, type) => {
      expect(type).toBe("image/png");
      callback(png);
    });

    await expect(canvasToPngBlob(canvas)).resolves.toBe(png);
  });

  it("rejects when the browser cannot encode the canvas", async () => {
    const canvas = document.createElement("canvas");
    canvas.toBlob = vi.fn((callback) => callback(null));

    await expect(canvasToPngBlob(canvas)).rejects.toThrow(
      "The canvas could not be encoded as a PNG",
    );
  });

  it("downloads and cleans up a blob URL", () => {
    const blob = new Blob(["png"], { type: "image/png" });
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:flower-png");
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    downloadBlob(blob, "flowerpower-study.png");

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:flower-png");
    expect(
      document.querySelector("a[download='flowerpower-study.png']"),
    ).toBeNull();
  });
});
