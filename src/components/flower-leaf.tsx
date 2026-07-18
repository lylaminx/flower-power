"use client";

import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { createLeafGeometry } from "@/lib/flower-geometry";
import { getBotanicalTexture } from "@/lib/botanical-textures";
import { flowerSpecies } from "@/lib/flower-species";
import { useFlowerStore } from "@/lib/flower-store";

export function FlowerLeaf({
  side,
  attachment,
  attachmentT,
}: {
  side: number;
  attachment: THREE.Vector3;
  attachmentT: number;
}) {
  const settings = useFlowerStore();
  const lineDrawing = settings.renderMode === "line";
  const photorealistic = settings.renderMode === "photo";
  const structure = flowerSpecies[settings.preset];
  const geometry = useMemo(
    () =>
      createLeafGeometry(
        structure.leafWidth,
        settings.seed + side * 17 + attachmentT * 3100,
        structure.leafShape,
        (structure.leafSerration ?? 0.07) * settings.leafSerration,
        settings.leafCurl,
      ),
    [
      attachmentT,
      structure,
      settings.leafCurl,
      settings.leafSerration,
      settings.seed,
      side,
    ],
  );
  const midrib = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.16, 0.025),
        new THREE.Vector3(0, 0.25, 0.04),
        new THREE.Vector3(0, 0.72, 0.09),
        new THREE.Vector3(0, 1.28, 0.025),
      ]),
    [],
  );
  const lateralVeins = useMemo(() => {
    const veinCount = Math.max(2, Math.round(7 * settings.leafVeinDensity));
    return Array.from({ length: veinCount }, (_, index) => {
      const y = 0.14 + ((index + 1) / (veinCount + 1)) * 1.02;
      const reach = Math.sin((y / 1.35) * Math.PI) * structure.leafWidth * 0.78;
      return [-1, 1].map(
        (direction) =>
          new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0, y, 0.052),
            new THREE.Vector3(direction * reach * 0.46, y + 0.1, 0.064),
            new THREE.Vector3(direction * reach, y + 0.15, 0.045),
          ),
      );
    }).flat();
  }, [settings.leafVeinDensity, structure.leafWidth]);
  const petiole = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.13, 0.012),
        new THREE.Vector3(0, 0.3, 0.03),
      ]),
    [],
  );

  return (
    <group
      position={attachment}
      rotation={[
        0.18 + settings.leafDroop * 0.28,
        side * 0.5,
        side * (-0.88 - settings.leafDroop * 0.48),
      ]}
      scale={[side * settings.leafWidth, settings.leafLength, 1]}
    >
      <mesh>
        <tubeGeometry args={[petiole, 14, 0.018, 7, false]} />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : settings.stemColor}
          roughness={0.84}
          bumpMap={lineDrawing ? undefined : getBotanicalTexture("stem")}
          bumpScale={0.018}
        />
      </mesh>
      <mesh geometry={geometry}>
        {lineDrawing ? (
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        ) : (
          <meshPhysicalMaterial
            color={settings.stemColor}
            vertexColors
            side={THREE.DoubleSide}
            roughness={photorealistic ? 0.8 : 0.88}
            specularIntensity={photorealistic ? 0.14 : 0.06}
            sheen={0}
            clearcoat={0}
            bumpMap={getBotanicalTexture("leaf")}
            bumpScale={0.022}
          />
        )}
        {lineDrawing && <Edges color="#111111" threshold={20} />}
      </mesh>
      <mesh>
        <tubeGeometry args={[midrib, 24, 0.009, 6, false]} />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : "#294b31"}
          roughness={0.86}
        />
      </mesh>
      {lateralVeins.map((vein, index) => (
        <mesh key={index}>
          <tubeGeometry args={[vein, 10, 0.0035, 5, false]} />
          <meshStandardMaterial
            color={lineDrawing ? "#111111" : "#36583a"}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
