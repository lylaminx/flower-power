import * as THREE from "three";
import {
  createFusedCorollaGeometry,
  createLeafGeometry,
  createPetalGeometry,
  createTaperedStem,
  getFusedCorollaGeometryCacheKey,
  getLeafGeometryCacheKey,
  getPetalGeometryCacheKey,
  getStemGeometryCacheKey,
} from "@/lib/flower-geometry";

type GeometryWarmupMessage =
  | {
      requestId: number;
      kind: "petal";
      payload: Parameters<typeof createPetalGeometry>[0];
    }
  | {
      requestId: number;
      kind: "leaf";
      payload: Parameters<typeof createLeafGeometry>;
    }
  | {
      requestId: number;
      kind: "fusedCorolla";
      payload: Parameters<typeof createFusedCorollaGeometry>[0];
    }
  | {
      requestId: number;
      kind: "stem";
      payload: {
        curve: [number, number, number][];
        thickness: number;
        taper: number;
        eccentricity: number;
        ribbing: number;
        seed: number;
      };
    };

type GeometryWarmupResponse = {
  requestId: number;
  key: string;
  geometry: ReturnType<THREE.BufferGeometry["toJSON"]>;
};

const selfScope = self as unknown as {
  addEventListener: (
    type: "message",
    listener: (event: MessageEvent<GeometryWarmupMessage>) => void,
  ) => void;
  postMessage: (
    message: GeometryWarmupResponse | { requestId: number; error: string },
  ) => void;
};

selfScope.addEventListener("message", (event) => {
  const { requestId, kind, payload } = event.data;

  try {
    if (kind === "petal") {
      const geometry = createPetalGeometry(payload);
      const response: GeometryWarmupResponse = {
        requestId,
        key: getPetalGeometryCacheKey(payload),
        geometry: geometry.toJSON(),
      };
      selfScope.postMessage(response);
      geometry.dispose();
      return;
    }

    if (kind === "leaf") {
      const [width, seed, shape, serrationStrength, curl, asymmetry] = payload;
      const geometry = createLeafGeometry(
        width,
        seed,
        shape,
        serrationStrength,
        curl,
        asymmetry,
      );
      const response: GeometryWarmupResponse = {
        requestId,
        key: getLeafGeometryCacheKey(
          width,
          seed,
          shape,
          serrationStrength,
          curl,
          asymmetry,
        ),
        geometry: geometry.toJSON(),
      };
      selfScope.postMessage(response);
      geometry.dispose();
      return;
    }

    if (kind === "fusedCorolla") {
      const geometry = createFusedCorollaGeometry(payload);
      const response: GeometryWarmupResponse = {
        requestId,
        key: getFusedCorollaGeometryCacheKey(payload),
        geometry: geometry.toJSON(),
      };
      selfScope.postMessage(response);
      geometry.dispose();
      return;
    }

    if (kind === "stem") {
      const curve = new THREE.CatmullRomCurve3(
        payload.curve.map((point) => new THREE.Vector3(...point)),
      );
      const geometry = createTaperedStem(
        curve,
        payload.thickness,
        payload.taper,
        payload.eccentricity,
        payload.ribbing,
        payload.seed,
      );
      const response: GeometryWarmupResponse = {
        requestId,
        key: getStemGeometryCacheKey(
          curve,
          payload.thickness,
          payload.taper,
          payload.eccentricity,
          payload.ribbing,
          payload.seed,
        ),
        geometry: geometry.toJSON(),
      };
      selfScope.postMessage(response);
      geometry.dispose();
    }
  } catch (error) {
    selfScope.postMessage({
      requestId,
      error: error instanceof Error ? error.message : "Geometry warmup failed",
    });
  }
});
