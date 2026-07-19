"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { FlowerBloom } from "./flower-bloom";
import { createInflorescencePlacements } from "@/lib/flower-geometry";
import type { FlowerSpecies } from "@/lib/flower-species";
import { getBotanicalTexture } from "@/lib/botanical-textures";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import { useFlowerStore } from "@/lib/flower-store";

export function FlowerInflorescence({
  structure,
}: {
  structure: FlowerSpecies;
}) {
  const settings = useFlowerStore();
  const textureResolution = getTextureResolution(useRenderQuality());
  const architecture = structure.inflorescenceArchitecture;
  const lineDrawing = settings.renderMode === "line";
  const placements = useMemo(() => {
    if (architecture !== "spike" && architecture !== "cluster") return [];
    return createInflorescencePlacements({
      architecture,
      count: structure.inflorescenceCount ?? 5,
      spacing: structure.inflorescenceSpacing ?? 0.45,
      spread: structure.inflorescenceSpread ?? 0.5,
      seed: settings.seed,
    });
  }, [architecture, settings.seed, structure]);
  const branches = useMemo(
    () =>
      placements.map(({ position }) => {
        const endpoint = new THREE.Vector3(...position);
        return new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, position[1] - 0.08, 0),
          new THREE.Vector3(position[0] * 0.42, position[1], position[2] * 0.3),
          endpoint,
        );
      }),
    [placements],
  );

  return (
    <group>
      {branches.map((branch, index) => (
        <mesh key={`pedicel-${index}`}>
          <tubeGeometry
            args={[branch, 14, 0.018 * settings.stemThickness, 7]}
          />
          <meshStandardMaterial
            color={lineDrawing ? "#111111" : settings.stemColor}
            roughness={0.86}
            bumpMap={
              lineDrawing
                ? undefined
                : getBotanicalTexture("stem", textureResolution)
            }
            bumpScale={0.018}
          />
        </mesh>
      ))}
      {placements.map((placement, index) => (
        <group
          key={`bloom-${index}`}
          position={placement.position}
          rotation={[
            placement.rotation[0] + settings.bloomTilt,
            placement.rotation[1] + settings.bloomTurn,
            placement.rotation[2],
          ]}
          scale={placement.scale}
        >
          <FlowerBloom
            structure={structure}
            seedOffset={placement.seedOffset}
          />
        </group>
      ))}
    </group>
  );
}
