"use client";

import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { FlowerModel } from "./flower-model";
import { canvasToPngBlob, downloadBlob } from "@/lib/canvas-export";
import { useFlowerStore } from "@/lib/flower-store";

export type ExportPng = () => Promise<void>;

function SceneTools({
  onExportReady,
}: {
  onExportReady: (exportPng: ExportPng | null) => void;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const exportPng: ExportPng = async () => {
      gl.render(scene, camera);
      const blob = await canvasToPngBlob(gl.domElement);
      downloadBlob(blob, `flowerpower-study-${Date.now()}.png`);
    };

    onExportReady(exportPng);
    return () => onExportReady(null);
  }, [camera, gl, onExportReady, scene]);

  return null;
}

export function FlowerScene({
  onExportReady,
}: {
  onExportReady: (exportPng: ExportPng | null) => void;
}) {
  const intensity = useFlowerStore((state) => state.lightIntensity);
  const grid = useFlowerStore((state) => state.grid);
  const photorealistic = useFlowerStore(
    (state) => state.renderMode === "photo",
  );

  return (
    <Canvas
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 0.98;
      }}
      camera={{ position: [5.8, 3.2, 7.8], fov: 36 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={["#ffffff"]} />
      <ambientLight intensity={0.38} />
      <hemisphereLight args={["#ffffff", "#f2f4ef", 0.58]} />
      <directionalLight position={[4, 7, 6]} intensity={intensity * 0.56} />
      <directionalLight
        position={[-5, 1, 4]}
        intensity={0.24}
        color="#fff8f5"
      />
      <pointLight position={[0, 4, -5]} intensity={0.14} color="#f4f7ff" />
      <FlowerModel />
      {grid && (
        <gridHelper
          args={[20, 20, "#d9ddd9", "#eef0ee"]}
          position={[0, -3.05, 0]}
        />
      )}
      {photorealistic && (
        <Environment preset="studio" environmentIntensity={0.06} />
      )}
      <OrbitControls
        makeDefault
        enableDamping
        minDistance={4}
        maxDistance={13}
        target={[0, -0.2, 0]}
      />
      <SceneTools onExportReady={onExportReady} />
    </Canvas>
  );
}
