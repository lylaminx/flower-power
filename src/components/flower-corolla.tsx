"use client";

import { Edges } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createFusedCorollaGeometry } from "@/lib/flower-geometry";
import type { FlowerSpecies } from "@/lib/flower-species";
import {
  getBotanicalAgeTexture,
  getBotanicalMaterialTexture,
  getBotanicalTexture,
} from "@/lib/botanical-textures";
import { useFlowerStore } from "@/lib/flower-store";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import { warmFusedCorollaGeometry } from "@/lib/geometry-worker-client";

export function FlowerCorolla({
  structure,
  seedOffset = 0,
}: {
  structure: FlowerSpecies;
  seedOffset?: number;
}) {
  const settings = useFlowerStore();
  const quality = useRenderQuality();
  const textureResolution = getTextureResolution(quality);
  const architecture = structure.bloomArchitecture;
  const lineDrawing = settings.renderMode === "line";
  const photorealistic = settings.renderMode === "photo";
  const geometry = useMemo(() => {
    if (architecture !== "bell" && architecture !== "trumpet") return null;
    return createFusedCorollaGeometry({
      architecture,
      length: (structure.corollaLength ?? 1) * settings.petalLength,
      throatRadius:
        (structure.corollaThroatRadius ?? 0.2) * settings.petalBaseWidth,
      mouthRadius: (structure.corollaMouthRadius ?? 0.8) * settings.petalWidth,
      lobes: structure.corollaLobes ?? 5,
      baseColor: settings.petalColor,
      tipColor: settings.petalTipColor,
      thicknessScale: settings.petalThickness,
      seed: settings.seed + seedOffset,
      rows: quality === "draft" ? 12 : quality === "ultra" ? 30 : 20,
      radialSegments: quality === "draft" ? 28 : quality === "ultra" ? 72 : 48,
    });
  }, [architecture, quality, seedOffset, settings, structure]);

  useEffect(() => {
    if (!geometry || (architecture !== "bell" && architecture !== "trumpet"))
      return;
    warmFusedCorollaGeometry({
      architecture,
      length: (structure.corollaLength ?? 1) * settings.petalLength,
      throatRadius:
        (structure.corollaThroatRadius ?? 0.2) * settings.petalBaseWidth,
      mouthRadius: (structure.corollaMouthRadius ?? 0.8) * settings.petalWidth,
      lobes: structure.corollaLobes ?? 5,
      baseColor: settings.petalColor,
      tipColor: settings.petalTipColor,
      thicknessScale: settings.petalThickness,
      seed: settings.seed + seedOffset,
      rows: quality === "draft" ? 12 : quality === "ultra" ? 30 : 20,
      radialSegments: quality === "draft" ? 28 : quality === "ultra" ? 72 : 48,
    });
  }, [
    architecture,
    geometry,
    quality,
    seedOffset,
    settings.petalLength,
    settings.petalBaseWidth,
    settings.petalColor,
    settings.petalThickness,
    settings.petalTipColor,
    settings.petalWidth,
    settings.seed,
    structure,
  ]);

  if (!geometry) return null;

  return (
    <mesh dispose={null} geometry={geometry}>
      {lineDrawing ? (
        <meshBasicMaterial color="#ffffff" />
      ) : (
        <meshPhysicalMaterial
          vertexColors
          map={getBotanicalAgeTexture(
            "petal",
            settings.petalAge,
            settings.seed + seedOffset,
            textureResolution,
          )}
          side={THREE.DoubleSide}
          roughness={photorealistic ? 0.68 : 0.78}
          specularIntensity={
            (photorealistic ? 0.14 : 0.06) + settings.petalSheen * 0.24
          }
          transmission={photorealistic ? settings.petalTranslucency * 0.14 : 0}
          thickness={0.025}
          ior={1.38}
          bumpMap={getBotanicalTexture("petal", textureResolution)}
          bumpScale={0.012 * settings.petalVeinStrength}
          normalMap={getBotanicalMaterialTexture(
            "petal",
            "microNormal",
            textureResolution,
          )}
          normalScale={new THREE.Vector2(0.1, 0.1)}
          roughnessMap={getBotanicalMaterialTexture(
            "petal",
            "roughness",
            textureResolution,
          )}
          thicknessMap={getBotanicalMaterialTexture(
            "petal",
            "thickness",
            textureResolution,
          )}
          clearcoat={photorealistic ? settings.petalSheen * 0.1 : 0}
          clearcoatRoughness={0.48}
          clearcoatMap={getBotanicalMaterialTexture(
            "petal",
            "moisture",
            textureResolution,
          )}
        />
      )}
      {lineDrawing && <Edges color="#111111" threshold={22} />}
    </mesh>
  );
}
