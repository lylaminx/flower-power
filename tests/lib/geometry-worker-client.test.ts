import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  warmFusedCorollaGeometry,
  warmLeafGeometry,
  warmPetalGeometry,
  warmStemGeometry,
} from "@/lib/geometry-worker-client";

describe("geometry worker client", () => {
  it("makes every warmup a no-op during server rendering", async () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0),
    ]);

    await expect(
      warmPetalGeometry({
        length: 1,
        width: 1,
        curl: 0,
        lift: 0,
        baseColor: "#ffffff",
        tipColor: "#ffffff",
        notch: 0,
        profile: 1,
      }),
    ).resolves.toBeUndefined();
    await expect(warmLeafGeometry(1, 42)).resolves.toBeUndefined();
    await expect(
      warmFusedCorollaGeometry({
        architecture: "bell",
        length: 1,
        throatRadius: 0.2,
        mouthRadius: 0.5,
        lobes: 5,
        baseColor: "#ffffff",
        tipColor: "#ffffff",
      }),
    ).resolves.toBeUndefined();
    await expect(warmStemGeometry({ curve })).resolves.toBeUndefined();
  });
});
