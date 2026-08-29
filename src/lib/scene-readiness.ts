import type * as THREE from "three";

export type SceneCompilationResult = {
  mode: "async" | "frame-fallback";
  durationMs: number;
  settledFrames: number;
  outstanding: string[];
};

type SceneCompiler = Pick<THREE.WebGLRenderer, "compileAsync">;

export async function compileSceneDeterministically(
  renderer: SceneCompiler,
  scene: THREE.Object3D,
  camera: THREE.Camera,
  timeoutMs = 12_000,
): Promise<SceneCompilationResult> {
  const startedAt = performance.now();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const asyncCompilation = Promise.resolve()
    .then(() => renderer.compileAsync(scene, camera))
    .then(() => "async" as const)
    .catch(() => "frame-fallback" as const);
  const timeout = new Promise<"frame-fallback">((resolve) => {
    timeoutId = setTimeout(() => resolve("frame-fallback"), timeoutMs);
  });
  const mode = await Promise.race([asyncCompilation, timeout]);

  if (timeoutId !== undefined) clearTimeout(timeoutId);

  return {
    mode,
    durationMs: Math.round(performance.now() - startedAt),
    settledFrames: 0,
    outstanding: [],
  };
}

export function getSceneReadinessOutstanding(scene: THREE.Object3D) {
  const outstanding = new Set<string>();
  let meshCount = 0;

  scene.traverse((object) => {
    const candidate = object as THREE.Object3D & {
      isMesh?: boolean;
      material?: Record<string, unknown> | Record<string, unknown>[];
    };
    if (!candidate.isMesh || !candidate.material) return;
    meshCount += 1;
    const materials = Array.isArray(candidate.material)
      ? candidate.material
      : [candidate.material];
    materials.forEach((material) => {
      [
        "map",
        "normalMap",
        "roughnessMap",
        "metalnessMap",
        "emissiveMap",
      ].forEach((key) => {
        const texture = material[key] as
          { image?: { complete?: boolean; naturalWidth?: number } } | undefined;
        const image = texture?.image;
        if (
          image &&
          image.complete === false &&
          (image.naturalWidth === undefined || image.naturalWidth === 0)
        ) {
          outstanding.add("textures");
        }
      });
    });
  });

  if (meshCount === 0) outstanding.add("geometry");
  return [...outstanding];
}
