"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { FlowerBloom } from "./flower-bloom";
import {
  createInflorescencePlacements,
  createPetioleGeometry,
} from "@/lib/flower-geometry";
import type { FlowerSpecies } from "@/lib/flower-species";
import { getBotanicalTexture } from "@/lib/botanical-textures";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import { useFlowerStore } from "@/lib/flower-store";

const inflorescenceBractGeometry = new THREE.ConeGeometry(1, 1, 7);

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
  const branchGeometries = useMemo(
    () =>
      branches.map((branch) =>
        createPetioleGeometry(
          branch,
          0.021 * settings.stemThickness,
          0.011 * settings.stemThickness,
          0.003 * settings.stemThickness,
        ),
      ),
    [branches, settings.stemThickness],
  );

  return (
    <group>
      {branches.map((branch, index) => (
        <group key={`pedicel-${index}`}>
          <mesh geometry={branchGeometries[index]} dispose={null}>
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
          <mesh
            dispose={null}
            position={branch.getPointAt(0.04)}
            rotation={[
              0.14,
              placements[index].position[0] >= 0 ? -0.35 : 0.35,
              placements[index].position[0] >= 0 ? -0.78 : 0.78,
            ]}
            scale={[
              0.025 * settings.stemThickness,
              0.13 *
                settings.stemThickness *
                THREE.MathUtils.lerp(0.72, 1, placements[index].maturity),
              0.018 * settings.stemThickness,
            ]}
          >
            <primitive object={inflorescenceBractGeometry} attach="geometry" />
            <meshStandardMaterial
              color={lineDrawing ? "#111111" : settings.stemColor}
              roughness={0.9}
            />
          </mesh>
        </group>
      ))}
      {placements.map((placement, index) => (
        <group
          key={`bloom-${index}`}
          position={placement.position}
          rotation={[
            placement.rotation[0] +
              settings.bloomTilt -
              (1 - placement.maturity) * 0.42,
            placement.rotation[1] + settings.bloomTurn,
            placement.rotation[2],
          ]}
          scale={[
            placement.scale * THREE.MathUtils.lerp(0.38, 1, placement.maturity),
            placement.scale * THREE.MathUtils.lerp(0.78, 1, placement.maturity),
            placement.scale * THREE.MathUtils.lerp(0.38, 1, placement.maturity),
          ]}
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
