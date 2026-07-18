"use client";

import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { FlowerCenter } from "./flower-center";
import { FlowerLeaf } from "./flower-leaf";
import { FlowerPetal } from "./flower-petal";
import { FlowerStemDetails } from "./flower-stem-details";
import {
  createLeafAttachments,
  createTaperedStem,
} from "@/lib/flower-geometry";
import { getBotanicalTexture } from "@/lib/botanical-textures";
import { flowerSpecies } from "@/lib/flower-species";
import { useFlowerStore } from "@/lib/flower-store";

export function FlowerModel() {
  const settings = useFlowerStore();
  const lineDrawing = settings.renderMode === "line";
  const photorealistic = settings.renderMode === "photo";
  const structure = flowerSpecies[settings.preset];
  const stemPath = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -4.35 * settings.stemHeight, 0),
        new THREE.Vector3(
          -settings.stemCurve * 0.42,
          -2.9 * settings.stemHeight,
          0.03,
        ),
        new THREE.Vector3(
          settings.stemCurve * 0.38,
          -1.35 * settings.stemHeight,
          -0.03,
        ),
        new THREE.Vector3(0, -0.08, 0),
      ]),
    [settings.stemCurve, settings.stemHeight],
  );
  const stemGeometry = useMemo(
    () =>
      createTaperedStem(stemPath, settings.stemThickness, settings.stemTaper),
    [settings.stemTaper, settings.stemThickness, stemPath],
  );
  const leafPairCount = Math.max(
    0,
    Math.min(6, Math.round((structure.leafPairs ?? 1) * settings.leafDensity)),
  );
  const leafAttachments = useMemo(
    () => createLeafAttachments(stemPath, leafPairCount),
    [leafPairCount, stemPath],
  );

  return (
    <group position={[0, 1.35, 0]} rotation={[0.04, 0, -0.06]}>
      <mesh geometry={stemGeometry}>
        {lineDrawing ? (
          <meshBasicMaterial color="#ffffff" />
        ) : (
          <meshPhysicalMaterial
            color={settings.stemColor}
            vertexColors
            roughness={photorealistic ? 0.84 : 0.91}
            specularIntensity={photorealistic ? 0.12 : 0.05}
            sheen={0}
            bumpMap={getBotanicalTexture("stem")}
            bumpScale={0.035}
          />
        )}
        {lineDrawing && <Edges color="#111111" threshold={16} />}
      </mesh>

      <mesh name="stem-center-wire">
        <tubeGeometry
          args={[stemPath, 72, 0.014 * settings.stemThickness, 6, false]}
        />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : "#203c2a"}
          roughness={1}
        />
      </mesh>

      <FlowerStemDetails
        curve={stemPath}
        color={settings.stemColor}
        lineDrawing={lineDrawing}
        hairiness={(structure.stemHairiness ?? 1) * settings.stemHairDensity}
        nodeCount={settings.stemNodeCount}
      />

      {leafAttachments.map((attachment) => (
        <FlowerLeaf
          key={`${attachment.side}-${attachment.t}`}
          side={attachment.side}
          attachment={attachment.point}
          attachmentT={attachment.t}
        />
      ))}

      <group rotation={[0.72 + settings.bloomTilt, settings.bloomTurn, -0.42]}>
        <mesh position={[0, -0.1, 0]} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[structure.centerRadius * 1.12, 28, 12]} />
          {lineDrawing ? (
            <meshBasicMaterial color="#ffffff" />
          ) : (
            <meshStandardMaterial color={settings.stemColor} roughness={0.82} />
          )}
          {lineDrawing && <Edges color="#111111" threshold={18} />}
        </mesh>
        {Array.from({ length: structure.sepals }, (_, index) => (
          <mesh
            key={`sepal-${index}`}
            position={[0, -0.08, 0]}
            rotation={[-0.15, (index / structure.sepals) * Math.PI * 2, 0]}
            scale={[0.07, 0.04, 0.48]}
          >
            <sphereGeometry args={[1, 10, 6]} />
            {lineDrawing ? (
              <meshBasicMaterial color="#ffffff" />
            ) : (
              <meshStandardMaterial
                color={settings.stemColor}
                roughness={0.8}
              />
            )}
            {lineDrawing && <Edges color="#111111" threshold={18} />}
          </mesh>
        ))}
        {structure.layers.map((layer, layerIndex) => {
          const count = Math.max(
            1,
            Math.round(settings.petalCount * layer.count),
          );
          return Array.from({ length: count }, (_, index) => (
            <FlowerPetal
              key={`${layerIndex}-${index}`}
              index={index}
              count={count}
              layer={layer}
            />
          ));
        })}
        <FlowerCenter structure={structure} />
      </group>
    </group>
  );
}
