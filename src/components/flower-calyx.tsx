"use client";

import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import {
  getBotanicalMaterialTexture,
  getBotanicalTexture,
} from "@/lib/botanical-textures";
import { createPetalGeometry } from "@/lib/flower-geometry";
import {
  getFlowerGrowthState,
  getFlowerPhaseTuning,
} from "@/lib/flower-growth";
import type { FlowerSpecies } from "@/lib/flower-species";
import { getHeroStemTuning } from "@/lib/flower-stem-tuning";
import { useFlowerStore } from "@/lib/flower-store";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import { useShallow } from "zustand/react/shallow";

export function FlowerCalyx({
  structure,
  fusedCorolla,
}: {
  structure: FlowerSpecies;
  fusedCorolla: boolean;
}) {
  const settings = useFlowerStore(
    useShallow((state) => ({
      preset: state.preset,
      renderMode: state.renderMode,
      stemColor: state.stemColor,
      sepalSize: state.sepalSize,
      sepalSpread: state.sepalSpread,
      bloom: state.bloom,
      petalAge: state.petalAge,
    })),
  );
  const quality = useRenderQuality();
  const textureResolution = getTextureResolution(quality);
  const lineDrawing = settings.renderMode === "line";
  const stemTuning = getHeroStemTuning(settings.preset, structure);
  const form = stemTuning.calyxForm ?? structure.calyxForm ?? "cupped";
  const growth = getFlowerGrowthState(settings.bloom, settings.petalAge);
  const phaseTuning = getFlowerPhaseTuning(growth.phase);
  const opening = THREE.MathUtils.clamp(
    growth.openness * phaseTuning.calyxOpenScale,
    0,
    1,
  );
  const sepalLength =
    (structure.sepalLength ?? 1) *
    settings.sepalSize *
    stemTuning.sepalLengthScale *
    (fusedCorolla ? 0.42 : THREE.MathUtils.lerp(0.5, 0.68, opening));
  const sepalWidth =
    (form === "bracted" ? 0.19 : 0.14) *
    settings.sepalSize *
    stemTuning.sepalSizeScale *
    THREE.MathUtils.lerp(0.86, 1, opening);
  const geometry = useMemo(() => {
    const result = createPetalGeometry({
      length: sepalLength,
      width: sepalWidth,
      curl: form === "reflexed" ? -0.75 : 0.12,
      lift:
        (form === "cupped" ? 0.12 : -0.08) +
        stemTuning.calyxLiftBias +
        (1 - opening) * 0.1 * phaseTuning.petalLiftScale,
      baseColor: "#ffffff",
      tipColor: "#eef3e9",
      notch: 0,
      profile: form === "bracted" ? 0.9 : 0.72,
      thicknessScale: 1.5,
      fold: 0.45,
      twist: 0.08,
      baseWidth: 1.35,
      edgeIrregularity: 0.22,
      edgeRuffle:
        (form === "bracted" ? 0.035 : 0.012) *
        stemTuning.sepalSpreadScale *
        THREE.MathUtils.lerp(0.84, 1, opening) *
        phaseTuning.petalSpreadScale,
      outline: "lanceolate",
      lateralCup: form === "cupped" ? 1.2 : 0.48,
      lengthSegments: quality === "draft" ? 8 : quality === "ultra" ? 22 : 14,
      widthSegments: quality === "draft" ? 4 : quality === "ultra" ? 10 : 6,
    }).clone();
    // Sepals use one leaf-like material on their closed geometry.
    result.clearGroups();
    return result;
  }, [form, quality, sepalLength, sepalWidth, stemTuning]);
  const baseTilt =
    form === "reflexed"
      ? 1.12
      : form === "bracted"
        ? 0.8
        : THREE.MathUtils.lerp(0.78, 0.58, opening);
  const growthTilt = THREE.MathUtils.lerp(
    0.34,
    0,
    growth.calyxRelease * phaseTuning.calyxOpenScale,
  );

  return (
    <group position={[0, fusedCorolla ? -0.19 : -0.11, 0]}>
      {!fusedCorolla && (
        <mesh
          dispose={null}
          position={[0, -0.035 + stemTuning.calyxLiftBias, 0]}
          scale={[
            stemTuning.calyxScaleX,
            0.42 * stemTuning.calyxScaleY,
            stemTuning.calyxScaleZ,
          ]}
        >
          <sphereGeometry args={[structure.centerRadius * 1.16, 32, 14]} />
          {lineDrawing ? (
            <meshBasicMaterial color="#ffffff" />
          ) : (
            <meshPhysicalMaterial
              color={settings.stemColor}
              roughness={0.86}
              bumpMap={getBotanicalTexture("stem", textureResolution)}
              bumpScale={0.025}
              roughnessMap={getBotanicalMaterialTexture(
                "stem",
                "roughness",
                textureResolution,
              )}
            />
          )}
          {lineDrawing && <Edges color="#111111" threshold={18} />}
        </mesh>
      )}

      {Array.from({ length: structure.sepals }, (_, index) => {
        const angle = (index / structure.sepals) * Math.PI * 2;
        const alternating = form === "bracted" && index % 2 ? 0.82 : 1;
        return (
          <group key={`sepal-${index}`} rotation={[0, angle, 0]}>
            <mesh
              dispose={null}
              geometry={geometry}
              rotation={[
                baseTilt + growthTilt - settings.sepalSpread * 0.22,
                0,
                form === "bracted" && index % 2 ? 0.08 : -0.03,
              ]}
              scale={[alternating, alternating, alternating]}
            >
              {lineDrawing ? (
                <meshBasicMaterial color="#ffffff" />
              ) : (
                <meshPhysicalMaterial
                  vertexColors
                  color={settings.stemColor}
                  side={THREE.DoubleSide}
                  roughness={0.84}
                  bumpMap={getBotanicalTexture("leaf", textureResolution)}
                  bumpScale={0.018}
                  normalMap={getBotanicalMaterialTexture(
                    "leaf",
                    "microNormal",
                    textureResolution,
                  )}
                  normalScale={new THREE.Vector2(0.09, 0.09)}
                  roughnessMap={getBotanicalMaterialTexture(
                    "leaf",
                    "roughness",
                    textureResolution,
                  )}
                />
              )}
              {lineDrawing && <Edges color="#111111" threshold={22} />}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
