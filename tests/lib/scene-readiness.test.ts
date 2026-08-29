import { describe, expect, it, vi } from "vitest";
import type * as THREE from "three";

import {
  compileSceneDeterministically,
  getSceneReadinessOutstanding,
} from "@/lib/scene-readiness";

describe("scene readiness", () => {
  it("uses successful asynchronous shader compilation", async () => {
    const renderer = {
      compileAsync: vi.fn().mockResolvedValue(undefined),
    };

    const result = await compileSceneDeterministically(
      renderer as never,
      {} as THREE.Object3D,
      {} as THREE.Camera,
      10,
    );

    expect(result.mode).toBe("async");
    expect(result.outstanding).toEqual([]);
  });

  it("reports missing geometry and ignores settled data textures", () => {
    const emptyScene = {
      traverse: (visit: (object: object) => void) => visit({}),
    };
    expect(getSceneReadinessOutstanding(emptyScene as never)).toEqual([
      "geometry",
    ]);

    const scene = {
      traverse: (visit: (object: object) => void) =>
        visit({
          isMesh: true,
          material: { map: { image: { width: 4, height: 4 } } },
        }),
    };
    expect(getSceneReadinessOutstanding(scene as never)).toEqual([]);
  });

  it("falls back to settled frames when the async gate stalls", async () => {
    vi.useFakeTimers();
    const renderer = {
      compileAsync: vi.fn(() => new Promise<void>(() => undefined)),
    };
    const compilation = compileSceneDeterministically(
      renderer as never,
      {} as THREE.Object3D,
      {} as THREE.Camera,
      25,
    );

    await vi.advanceTimersByTimeAsync(25);

    await expect(compilation).resolves.toMatchObject({
      mode: "frame-fallback",
    });
    vi.useRealTimers();
  });

  it("falls back to settled frames when asynchronous compilation rejects", async () => {
    const renderer = {
      compileAsync: vi.fn().mockRejectedValue(new Error("driver failure")),
    };

    await expect(
      compileSceneDeterministically(
        renderer as never,
        {} as THREE.Object3D,
        {} as THREE.Camera,
        10,
      ),
    ).resolves.toMatchObject({ mode: "frame-fallback" });
  });
});
