import * as THREE from "three";
import {
  primeGeometryCache,
  getFusedCorollaGeometryCacheKey,
  getLeafGeometryCacheKey,
  getPetalGeometryCacheKey,
  getStemGeometryCacheKey,
} from "./flower-geometry";
import type {
  BloomArchitecture,
  LeafShape,
  PetalOutline,
} from "./flower-species";

type WarmupResponse = {
  requestId: number;
  key: string;
  geometry?: ReturnType<THREE.BufferGeometry["toJSON"]>;
  error?: string;
};

type GeometryKind = "petal" | "leaf" | "fusedCorolla" | "stem";

const pendingRequests = new Map<string, Promise<void>>();
let worker: Worker | null = null;
let nextRequestId = 1;

function getWorker() {
  if (typeof window === "undefined") return null;
  if (worker) return worker;
  worker = new Worker(
    new URL("../workers/geometry-worker.ts", import.meta.url),
    { type: "module" },
  );
  return worker;
}

function hydrateGeometry(
  key: string,
  geometryJson: WarmupResponse["geometry"],
) {
  if (!geometryJson) return;
  const loader = new THREE.BufferGeometryLoader();
  const geometry = loader.parse(geometryJson);
  primeGeometryCache(key, geometry);
}

function warmGeometry(key: string, kind: GeometryKind, payload: unknown) {
  if (typeof window === "undefined") return Promise.resolve();
  const existing = pendingRequests.get(key);
  if (existing) return existing;

  const activeWorker = getWorker();
  if (!activeWorker) return Promise.resolve();

  const requestId = nextRequestId++;
  const promise = new Promise<void>((resolve) => {
    const handleMessage = (event: MessageEvent<WarmupResponse>) => {
      if (event.data.requestId !== requestId) return;
      activeWorker.removeEventListener("message", handleMessage);
      activeWorker.removeEventListener("error", handleError);
      pendingRequests.delete(key);
      if (!event.data.error) {
        hydrateGeometry(event.data.key, event.data.geometry);
      }
      resolve();
    };
    const handleError = () => {
      activeWorker.removeEventListener("message", handleMessage);
      activeWorker.removeEventListener("error", handleError);
      pendingRequests.delete(key);
      resolve();
    };

    activeWorker.addEventListener("message", handleMessage);
    activeWorker.addEventListener("error", handleError);
    activeWorker.postMessage({ requestId, kind, payload });
  });

  pendingRequests.set(key, promise);
  return promise;
}

export function warmPetalGeometry(params: {
  length: number;
  width: number;
  curl: number;
  lift: number;
  baseColor: string;
  tipColor: string;
  notch: number;
  profile: number;
  edgeRuffle?: number;
  baseDarkening?: number;
  waviness?: number;
  wavePhase?: number;
  thicknessScale?: number;
  fold?: number;
  twist?: number;
  baseWidth?: number;
  spots?: number;
  guideStrength?: number;
  markingSeed?: number;
  asymmetry?: number;
  edgeWear?: number;
  edgeIrregularity?: number;
  outline?: PetalOutline;
  longitudinalCurve?: number;
  lateralCup?: number;
  lengthSegments?: number;
  widthSegments?: number;
}) {
  return warmGeometry(getPetalGeometryCacheKey(params), "petal", params);
}

export function warmLeafGeometry(
  width: number,
  seed: number,
  shape: LeafShape = "ovate",
  serrationStrength = 0.07,
  curl = 0.35,
  asymmetry = 0,
) {
  return warmGeometry(
    getLeafGeometryCacheKey(
      width,
      seed,
      shape,
      serrationStrength,
      curl,
      asymmetry,
    ),
    "leaf",
    [width, seed, shape, serrationStrength, curl, asymmetry],
  );
}

export function warmFusedCorollaGeometry(params: {
  architecture: Extract<BloomArchitecture, "bell" | "trumpet">;
  length: number;
  throatRadius: number;
  mouthRadius: number;
  lobes: number;
  baseColor: string;
  tipColor: string;
  thicknessScale?: number;
  seed?: number;
  rows?: number;
  radialSegments?: number;
}) {
  return warmGeometry(
    getFusedCorollaGeometryCacheKey(params),
    "fusedCorolla",
    params,
  );
}

export function warmStemGeometry(params: {
  curve: THREE.CatmullRomCurve3;
  thickness?: number;
  taper?: number;
  eccentricity?: number;
  ribbing?: number;
  seed?: number;
}) {
  const curvePoints = params.curve.points.map(
    (point) => [point.x, point.y, point.z] as [number, number, number],
  );
  return warmGeometry(
    getStemGeometryCacheKey(
      params.curve,
      params.thickness ?? 1,
      params.taper ?? 0.38,
      params.eccentricity ?? 0,
      params.ribbing ?? 0,
      params.seed ?? 0,
    ),
    "stem",
    {
      curve: curvePoints,
      thickness: params.thickness ?? 1,
      taper: params.taper ?? 0.38,
      eccentricity: params.eccentricity ?? 0,
      ribbing: params.ribbing ?? 0,
      seed: params.seed ?? 0,
    },
  );
}
