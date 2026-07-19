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
  onSceneReady?: () => void;
  backgroundColor?: string;
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
        castShadow={photorealistic && qualitySettings.shadows}
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
      <RenderQualityProvider value={quality}>
        <FlowerModel />
      </RenderQualityProvider>
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
            opacity={0.42}
            scale={9}
            blur={2.6}
            far={5.5}
            resolution={qualitySettings.contactShadowResolution}
            color="#27302c"
          />
          <mesh
            position={[0, -3.055, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[30, 30]} />
            <shadowMaterial color={rig.groundColor} opacity={0.12} />
          </mesh>
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

function SceneReady({ onReady }: { onReady: () => void }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        gl.render(scene, camera);
        onReady();
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [camera, gl, onReady, scene]);

  return null;
}
