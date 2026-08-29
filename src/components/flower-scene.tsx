"use client";

import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Bloom as HighlightBloom,
  DepthOfField,
  EffectComposer,
  SSAO,
} from "@react-three/postprocessing";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { FlowerModel } from "./flower-model";
import { RenderQualityProvider } from "./render-quality-context";
import { canvasToPngBlob, downloadBlob } from "@/lib/canvas-export";
import { useFlowerStore } from "@/lib/flower-store";
import { lightingRigs, type LightingPreset } from "@/lib/flower-lighting";
import { clampFocalLength } from "@/lib/flower-camera";
import {
  renderQualitySettings,
  type RenderQuality,
} from "@/lib/flower-quality";
import { FlowerLightingProvider } from "./flower-lighting-context";
import {
  compileSceneDeterministically,
  getSceneReadinessOutstanding,
  type SceneCompilationResult,
} from "@/lib/scene-readiness";
import {
  getAquaticWaterTexture,
  getGardenBackdropPlacements,
  createGardenBladeGeometry,
  getGardenGroundPlacements,
  getGardenGroundTexture,
} from "@/lib/flower-ground";

export type ExportPng = () => Promise<void>;

export type FlowerSceneView = {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
};

const defaultView: FlowerSceneView = {
  position: [5.8, 3.2, 7.8],
  target: [0, -0.2, 0],
  fov: 36,
};

const gardenBladeGeometry = createGardenBladeGeometry();
const gardenBladeMaterials = ["#718066", "#829076", "#64735b"].map(
  (color) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.96,
      side: THREE.DoubleSide,
    }),
);

function GardenGroundDetails() {
  const placements = [
    ...getGardenBackdropPlacements().map((placement) => ({
      ...placement,
      layer: "backdrop" as const,
    })),
    ...getGardenGroundPlacements().map((placement) => ({
      ...placement,
      layer: "ground" as const,
    })),
  ];
  return (
    <group>
      {placements.map((placement, index) => (
        <group
          key={`garden-${placement.layer}-${index}`}
          position={placement.position}
          rotation={[0, placement.rotation, placement.lean]}
        >
          {Array.from({ length: placement.bladeCount }, (_, bladeIndex) => {
            const centeredIndex = bladeIndex - (placement.bladeCount - 1) / 2;
            const edgeProgress = Math.abs(centeredIndex) / placement.bladeCount;
            return (
              <mesh
                key={bladeIndex}
                geometry={gardenBladeGeometry}
                material={gardenBladeMaterials[placement.tone]}
                position={[
                  centeredIndex * placement.spread,
                  0,
                  centeredIndex * placement.spread * 0.38,
                ]}
                rotation={[0, centeredIndex * 0.64, centeredIndex * 0.09]}
                scale={[
                  placement.widthScale * (1 - edgeProgress * 0.22),
                  placement.height * (1 - edgeProgress * 0.32),
                  1,
                ]}
                receiveShadow
              />
            );
          })}
        </group>
      ))}
    </group>
  );
}

function useCanvasBackground(fixedColor?: string) {
  const [background, setBackground] = useState(fixedColor ?? "#ffffff");

  useEffect(() => {
    if (fixedColor) {
      setBackground(fixedColor);
      return;
    }

    const updateBackground = () => {
      setBackground(
        document.documentElement.dataset.theme === "dark"
          ? "#555b58"
          : "#ffffff",
      );
    };
    updateBackground();

    const observer = new MutationObserver(updateBackground);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [fixedColor]);

  return background;
}

function SceneTools({
  onExportReady,
}: {
  onExportReady: (exportPng: ExportPng | null) => void;
}) {
  const { gl } = useThree();

  useEffect(() => {
    const exportPng: ExportPng = async () => {
      // Let the normal render loop finish so exports include post-processing.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const blob = await canvasToPngBlob(gl.domElement);
      downloadBlob(blob, `flowerpower-study-${Date.now()}.png`);
    };

    onExportReady(exportPng);
    return () => onExportReady(null);
  }, [gl, onExportReady]);

  return null;
}

function PhotographicRendererSetup({
  exposure,
  shadows,
}: {
  exposure: number;
  shadows: boolean;
}) {
  const { gl, scene } = useThree();

  useEffect(() => {
    gl.toneMappingExposure = exposure;
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = shadows;
    });
  }, [exposure, gl, scene, shadows]);

  return null;
}

function CameraSetup({
  view,
  focalLength,
}: {
  view: FlowerSceneView;
  focalLength: number;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.position.set(...view.position);
    camera.setFocalLength(clampFocalLength(focalLength));
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
  }, [camera, focalLength, view]);

  return null;
}

export function FlowerScene({
  onExportReady,
  view = defaultView,
  interactive = true,
  onSceneReady,
  backgroundColor,
  groundStyle = "studio",
  fogNear = 11,
  fogFar = 19,
  environment = true,
  lightingPreset = "botanicalStudio",
  focalLength = 52,
  depthOfField = false,
  aperture = 5.6,
  focusDistance = 7,
  highlightBloom = false,
  bloomIntensity = 0.12,
  ambientOcclusion = false,
  ambientOcclusionStrength = 0.42,
  quality = "high",
}: {
  onExportReady: (exportPng: ExportPng | null) => void;
  view?: FlowerSceneView;
  interactive?: boolean;
  onSceneReady?: (result: SceneCompilationResult) => void;
  backgroundColor?: string;
  groundStyle?: "studio" | "garden" | "water";
  fogNear?: number;
  fogFar?: number;
  environment?: boolean;
  lightingPreset?: LightingPreset;
  focalLength?: number;
  depthOfField?: boolean;
  aperture?: number;
  focusDistance?: number;
  highlightBloom?: boolean;
  bloomIntensity?: number;
  ambientOcclusion?: boolean;
  ambientOcclusionStrength?: number;
  quality?: RenderQuality;
}) {
  const intensity = useFlowerStore((state) => state.lightIntensity);
  const grid = useFlowerStore((state) => state.grid);
  const photorealistic = useFlowerStore(
    (state) => state.renderMode === "photo",
  );
  const background = useCanvasBackground(backgroundColor);
  const rig = lightingRigs[lightingPreset];
  const qualitySettings = renderQualitySettings[quality];

  return (
    <Canvas
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      shadows={photorealistic && qualitySettings.shadows}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      camera={{ position: view.position, fov: view.fov }}
      dpr={[1, qualitySettings.maxDpr]}
    >
      <color attach="background" args={[background]} />
      {groundStyle === "garden" && (
        <fog attach="fog" args={[background, fogNear, fogFar]} />
      )}
      <CameraSetup view={view} focalLength={focalLength} />
      <ambientLight intensity={photorealistic ? 0.12 : 0.38} />
      <hemisphereLight
        args={["#f7faf8", "#d7d9d2", photorealistic ? 0.34 : 0.58]}
      />
      <rectAreaLight
        position={[4.5, 5.5, 5.5]}
        rotation={[-0.58, 0.62, 0.34]}
        width={5}
        height={4}
        intensity={intensity * rig.keyIntensity}
        color={rig.keyColor}
      />
      <rectAreaLight
        position={[-4.2, 2.4, 3.2]}
        rotation={[-0.32, -0.88, -0.18]}
        width={4}
        height={5}
        intensity={rig.fillIntensity}
        color={rig.fillColor}
      />
      <rectAreaLight
        position={[0.5, 4.2, -5]}
        rotation={[0.65, 0.05, Math.PI]}
        width={3.5}
        height={4}
        intensity={rig.rimIntensity}
        color={rig.rimColor}
      />
      <directionalLight
        castShadow={
          photorealistic && qualitySettings.shadows && groundStyle !== "garden"
        }
        position={[3.5, 7, 4.5]}
        intensity={photorealistic ? intensity * 0.34 : intensity * 0.56}
        color={rig.keyColor}
        shadow-mapSize-width={qualitySettings.shadowMapSize}
        shadow-mapSize-height={qualitySettings.shadowMapSize}
        shadow-camera-near={1}
        shadow-camera-far={18}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.00015}
      />
      <FlowerLightingProvider rig={rig}>
        <RenderQualityProvider value={quality}>
          <FlowerModel />
        </RenderQualityProvider>
      </FlowerLightingProvider>
      <PhotographicRendererSetup
        exposure={rig.exposure}
        shadows={photorealistic && qualitySettings.shadows}
      />
      {grid && (
        <gridHelper
          args={[20, 20, "#d9ddd9", "#eef0ee"]}
          position={[0, -3.05, 0]}
        />
      )}
      {photorealistic && environment && qualitySettings.environment && (
        <Environment
          preset={rig.environmentPreset}
          environmentIntensity={rig.environmentIntensity}
        />
      )}
      {photorealistic && qualitySettings.shadows && (
        <>
          <ContactShadows
            position={[0, -3.02, 0]}
            opacity={groundStyle === "garden" ? 0.2 : 0.42}
            scale={groundStyle === "garden" ? 5.5 : 9}
            blur={groundStyle === "garden" ? 4.2 : 2.6}
            far={groundStyle === "garden" ? 2.8 : 5.5}
            resolution={qualitySettings.contactShadowResolution}
            color="#27302c"
          />
          {groundStyle === "garden" ? (
            <>
              <mesh
                position={[0, -3.055, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
              >
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial
                  map={getGardenGroundTexture()}
                  color="#ddd4bd"
                  roughness={0.98}
                  metalness={0}
                />
              </mesh>
              <GardenGroundDetails />
            </>
          ) : groundStyle === "water" ? (
            <mesh
              position={[0, -3.055, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[30, 30]} />
              <meshStandardMaterial
                map={getAquaticWaterTexture()}
                color="#ffffff"
                roughness={0.24}
                metalness={0.08}
                transparent
                opacity={0.88}
              />
            </mesh>
          ) : (
            <mesh
              position={[0, -3.055, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[30, 30]} />
              <shadowMaterial color={rig.groundColor} opacity={0.12} />
            </mesh>
          )}
        </>
      )}
      {photorealistic &&
        qualitySettings.postProcessing &&
        (depthOfField || highlightBloom || ambientOcclusion) && (
          <EffectComposer multisampling={0} enableNormalPass={ambientOcclusion}>
            {ambientOcclusion ? (
              <SSAO
                samples={8}
                rings={4}
                radius={0.12}
                intensity={THREE.MathUtils.clamp(
                  ambientOcclusionStrength,
                  0.15,
                  0.8,
                )}
                luminanceInfluence={0.72}
                worldDistanceThreshold={1.2}
                worldDistanceFalloff={0.22}
                worldProximityThreshold={0.42}
                worldProximityFalloff={0.1}
                resolutionScale={qualitySettings.postProcessingScale}
              />
            ) : (
              <></>
            )}
            {depthOfField ? (
              <DepthOfField
                worldFocusDistance={focusDistance}
                worldFocusRange={0.28 + aperture * 0.18}
                bokehScale={Math.min(2, 4 / aperture)}
                resolutionScale={qualitySettings.postProcessingScale}
              />
            ) : (
              <></>
            )}
            {highlightBloom ? (
              <HighlightBloom
                intensity={THREE.MathUtils.clamp(bloomIntensity, 0.04, 0.35)}
                luminanceThreshold={0.88}
                luminanceSmoothing={0.18}
                mipmapBlur
                radius={0.42}
              />
            ) : (
              <></>
            )}
          </EffectComposer>
        )}
      {interactive && (
        <OrbitControls
          makeDefault
          enableDamping
          minDistance={4}
          maxDistance={13}
          target={view.target}
        />
      )}
      <SceneTools onExportReady={onExportReady} />
      {onSceneReady && <SceneReady onReady={onSceneReady} />}
    </Canvas>
  );
}

function SceneReady({
  onReady,
}: {
  onReady: (result: SceneCompilationResult) => void;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    let cancelled = false;
    const frameIds: number[] = [];

    const nextFrame = () =>
      new Promise<void>((resolve) => {
        frameIds.push(requestAnimationFrame(() => resolve()));
      });

    const settleScene = async () => {
      // Prefer non-blocking parallel shader compilation. If the browser driver
      // cannot complete it, continue through settled render frames rather than
      // calling synchronous gl.compile(), which can deadlock Chrome's render
      // thread on complex physical-material scenes.
      const compilation = await compileSceneDeterministically(
        gl,
        scene,
        camera,
      );
      await nextFrame();
      await nextFrame();
      await nextFrame();
      if (cancelled) return;
      gl.render(scene, camera);
      const outstanding = getSceneReadinessOutstanding(scene);
      if (gl.info.render.calls === 0) outstanding.push("render");
      onReady({
        ...compilation,
        settledFrames: 3,
        outstanding: [...new Set(outstanding)],
      });
    };

    void settleScene();

    return () => {
      cancelled = true;
      frameIds.forEach(cancelAnimationFrame);
    };
  }, [camera, gl, onReady, scene]);

  return null;
}
