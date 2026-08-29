"use client";

import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import {
  getBotanicalMaterialTexture,
  getBotanicalTexture,
  getCalyxBladeMaterialVariant,
  getCalyxBodyMaterialVariant,
} from "@/lib/botanical-textures";
import {
  createPetalGeometry,
  createPoppyReceptacleGeometry,
  createRoseCalyxCupGeometry,
  createSunflowerReceptacleGeometry,
} from "@/lib/flower-geometry";
import {
  getFlowerGrowthState,
  getFlowerPhaseTuning,
} from "@/lib/flower-growth";
import type { FlowerSpecies } from "@/lib/flower-species";
import {
  getCalyxOrganVariation,
  getCalyxAssemblyOffset,
  getCalyxRetention,
  getHeroStemTuning,
  getSunflowerPhyllaryWhorlTuning,
  shouldRenderExternalCalyx,
} from "@/lib/flower-stem-tuning";
import { useFlowerStore } from "@/lib/flower-store";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import { useShallow } from "zustand/react/shallow";
import {
  getHeroSupportTissueColor,
  getSunflowerPhyllaryColor,
} from "@/lib/flower-color-tuning";

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
      seed: state.seed,
    })),
  );
  const quality = useRenderQuality();
  const textureResolution = getTextureResolution(quality);
  const calyxBodyMaterialVariant = getCalyxBodyMaterialVariant(settings.preset);
  const calyxBladeMaterialVariant = getCalyxBladeMaterialVariant(
    settings.preset,
  );
  const lineDrawing = settings.renderMode === "line";
  const photorealistic = settings.renderMode === "photo";
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
    (settings.preset === "Sunflower"
      ? 0.145
      : form === "bracted"
        ? 0.19
        : 0.14) *
    settings.sepalSize *
    stemTuning.sepalSizeScale *
    THREE.MathUtils.lerp(0.86, 1, opening);
  const geometry = useMemo(() => {
    const result = createPetalGeometry({
      length: sepalLength,
      width: sepalWidth,
      curl:
        form === "reflexed"
          ? -0.75
          : settings.preset === "Sunflower"
            ? 0.2
            : 0.12,
      lift:
        (form === "cupped" ? 0.12 : -0.08) +
        stemTuning.calyxLiftBias +
        (1 - opening) * 0.1 * phaseTuning.petalLiftScale,
      baseColor: "#ffffff",
      tipColor: "#eef3e9",
      notch: 0,
      profile: form === "bracted" ? 0.9 : 0.72,
      thicknessScale: 1.5,
      fold: settings.preset === "Sunflower" ? 0.72 : 0.45,
      twist: settings.preset === "Sunflower" ? 0.12 : 0.08,
      baseWidth: 1.35,
      edgeIrregularity: 0.22,
      edgeRuffle:
        (form === "bracted" ? 0.035 : 0.012) *
        stemTuning.sepalSpreadScale *
        THREE.MathUtils.lerp(0.84, 1, opening) *
        phaseTuning.petalSpreadScale,
      outline: "lanceolate",
      lateralCup:
        form === "cupped" ? 1.2 : settings.preset === "Sunflower" ? 0.82 : 0.48,
      lengthSegments: quality === "draft" ? 8 : quality === "ultra" ? 22 : 14,
      widthSegments: quality === "draft" ? 4 : quality === "ultra" ? 10 : 6,
    }).clone();
    // Sepals use one leaf-like material on their closed geometry.
    result.clearGroups();
    return result;
  }, [
    form,
    opening,
    phaseTuning.petalLiftScale,
    phaseTuning.petalSpreadScale,
    quality,
    sepalLength,
    sepalWidth,
    settings.preset,
    stemTuning,
  ]);
  const roseCalyxCupGeometry = useMemo(
    () => createRoseCalyxCupGeometry(structure.centerRadius * 1.16),
    [structure.centerRadius],
  );
  const poppyReceptacleGeometry = useMemo(
    () => createPoppyReceptacleGeometry(structure.centerRadius * 0.17),
    [structure.centerRadius],
  );
  const sunflowerReceptacleGeometry = useMemo(
    () => createSunflowerReceptacleGeometry(structure.centerRadius * 1.16),
    [structure.centerRadius],
  );
  const baseTilt =
    settings.preset === "Rose"
      ? 0.92
      : form === "reflexed"
        ? 1.12
        : form === "bracted"
          ? 0.8
          : THREE.MathUtils.lerp(0.78, 0.58, opening);
  const growthTilt = THREE.MathUtils.lerp(
    0.34,
    0,
    growth.calyxRelease * phaseTuning.calyxOpenScale,
  );
  const sepalRetention = getCalyxRetention(
    opening,
    stemTuning.sepalPersistence,
  );
  const sepalCount =
    settings.preset === "Sunflower"
      ? structure.sepals * 3
      : form === "bracted"
        ? structure.sepals * 2
        : structure.sepals;

  return (
    <group
      position={[0, getCalyxAssemblyOffset(settings.preset, fusedCorolla), 0]}
    >
      {settings.preset === "Poppy" && opening > 0.3 && (
        <mesh
          dispose={null}
          geometry={poppyReceptacleGeometry}
          position={[0, -0.025 + stemTuning.calyxLiftBias, 0]}
          scale={[1, 1.65, 1]}
        >
          {lineDrawing ? (
            <meshBasicMaterial color="#ffffff" />
          ) : (
            <meshPhysicalMaterial
              color={getHeroSupportTissueColor(
                settings.preset,
                settings.stemColor,
                "calyx",
              )}
              roughness={0.88}
              bumpMap={getBotanicalTexture("center", textureResolution)}
              bumpScale={0.008}
              normalMap={getBotanicalMaterialTexture(
                "center",
                "microNormal",
                textureResolution,
                "receptacle",
              )}
              normalScale={new THREE.Vector2(0.1, 0.1)}
              roughnessMap={getBotanicalMaterialTexture(
                "center",
                "roughness",
                textureResolution,
                "receptacle",
              )}
              clearcoat={photorealistic ? 0.025 : 0}
              clearcoatRoughness={0.82}
              clearcoatMap={getBotanicalMaterialTexture(
                "center",
                "moisture",
                textureResolution,
                "receptacle",
              )}
            />
          )}
          {lineDrawing && <Edges color="#111111" threshold={20} />}
        </mesh>
      )}
      {!fusedCorolla &&
        sepalRetention > 0.02 &&
        shouldRenderExternalCalyx(
          structure.centerArchitecture,
          settings.preset,
        ) && (
          <mesh
            dispose={null}
            position={[0, -0.035 + stemTuning.calyxLiftBias, 0]}
            scale={[
              stemTuning.calyxScaleX * sepalRetention,
              0.42 * stemTuning.calyxScaleY * sepalRetention,
              stemTuning.calyxScaleZ * sepalRetention,
            ]}
          >
            {settings.preset === "Rose" ? (
              <primitive object={roseCalyxCupGeometry} attach="geometry" />
            ) : settings.preset === "Sunflower" ? (
              <primitive
                object={sunflowerReceptacleGeometry}
                attach="geometry"
              />
            ) : (
              <sphereGeometry args={[structure.centerRadius * 1.16, 32, 14]} />
            )}
            {lineDrawing ? (
              <meshBasicMaterial color="#ffffff" />
            ) : (
              <meshPhysicalMaterial
                color={getHeroSupportTissueColor(
                  settings.preset,
                  settings.stemColor,
                  "calyx",
                )}
                roughness={settings.preset === "Rose" ? 0.9 : 0.86}
                transmission={
                  photorealistic && settings.preset === "Rose" ? 0.018 : 0
                }
                thickness={settings.preset === "Rose" ? 0.06 : 0.035}
                attenuationColor={getHeroSupportTissueColor(
                  settings.preset,
                  settings.stemColor,
                  "calyx",
                )}
                attenuationDistance={settings.preset === "Rose" ? 0.82 : 1}
                bumpMap={getBotanicalTexture("stem", textureResolution)}
                bumpScale={settings.preset === "Sunflower" ? 0.018 : 0.025}
                normalMap={
                  settings.preset === "Sunflower"
                    ? getBotanicalMaterialTexture(
                        "stem",
                        "microNormal",
                        textureResolution,
                        calyxBodyMaterialVariant,
                      )
                    : undefined
                }
                normalScale={new THREE.Vector2(0.1, 0.1)}
                roughnessMap={getBotanicalMaterialTexture(
                  "stem",
                  "roughness",
                  textureResolution,
                  calyxBodyMaterialVariant,
                )}
              />
            )}
            {lineDrawing && <Edges color="#111111" threshold={18} />}
          </mesh>
        )}

      {shouldRenderExternalCalyx(
        structure.centerArchitecture,
        settings.preset,
      ) &&
        Array.from({ length: sepalCount }, (_, index) => {
          const bractWhorl =
            form === "bracted" ? Math.floor(index / structure.sepals) : 0;
          const whorlIndex =
            form === "bracted" ? index % structure.sepals : index;
          const sunflowerWhorl =
            settings.preset === "Sunflower"
              ? getSunflowerPhyllaryWhorlTuning(bractWhorl)
              : null;
          const angle =
            (whorlIndex / structure.sepals) * Math.PI * 2 +
            (sunflowerWhorl
              ? (Math.PI / structure.sepals) * sunflowerWhorl.angleOffsetScale
              : bractWhorl === 1
                ? Math.PI / structure.sepals
                : 0);
          const lengthScale =
            sunflowerWhorl?.lengthScale ??
            (form === "bracted" ? (bractWhorl === 0 ? 1.08 : 0.82) : 1);
          const widthScale =
            sunflowerWhorl?.widthScale ??
            (form === "bracted" ? (bractWhorl === 0 ? 0.94 : 1.08) : 1);
          const whorlTilt =
            sunflowerWhorl?.tilt ??
            (form === "bracted" ? (bractWhorl === 0 ? 0.12 : -0.1) : 0);
          const organVariation = getCalyxOrganVariation(
            settings.preset,
            settings.seed,
            index,
          );
          return (
            <group
              key={`sepal-${index}`}
              position={[
                0,
                -(1 - sepalRetention) * 0.12 -
                  (sunflowerWhorl?.axialOffset ??
                    (form === "bracted" ? bractWhorl * 0.022 : 0)) -
                  (settings.preset === "Rose" ? 0.075 : 0),
                0,
              ]}
              rotation={[0, angle + organVariation.azimuth, 0]}
            >
              <mesh
                dispose={null}
                geometry={geometry}
                rotation={[
                  baseTilt +
                    whorlTilt +
                    organVariation.tilt +
                    growthTilt -
                    settings.sepalSpread * 0.22 +
                    (1 - sepalRetention) * 0.72,
                  0,
                  (form === "bracted"
                    ? (whorlIndex % 3) * 0.025 - 0.025
                    : -0.03) + organVariation.roll,
                ]}
                scale={[
                  widthScale * organVariation.widthScale * sepalRetention,
                  lengthScale * organVariation.lengthScale * sepalRetention,
                  widthScale *
                    organVariation.widthScale *
                    organVariation.depthScale *
                    sepalRetention,
                ]}
              >
                {lineDrawing ? (
                  <meshBasicMaterial color="#ffffff" />
                ) : (
                  <meshPhysicalMaterial
                    vertexColors
                    color={
                      settings.preset === "Sunflower"
                        ? getSunflowerPhyllaryColor(
                            settings.stemColor,
                            bractWhorl,
                          )
                        : getHeroSupportTissueColor(
                            settings.preset,
                            settings.stemColor,
                            "calyx",
                          )
                    }
                    side={THREE.DoubleSide}
                    roughness={
                      settings.preset === "Sunflower"
                        ? 0.82 + bractWhorl * 0.025
                        : settings.preset === "Poppy"
                          ? 0.88
                          : settings.preset === "Rose"
                            ? 0.87 + (organVariation.widthScale - 0.94) * 0.18
                            : 0.84
                    }
                    bumpMap={getBotanicalTexture("leaf", textureResolution)}
                    bumpScale={0.018}
                    normalMap={getBotanicalMaterialTexture(
                      "leaf",
                      "microNormal",
                      textureResolution,
                      calyxBladeMaterialVariant,
                    )}
                    normalScale={
                      settings.preset === "Sunflower"
                        ? new THREE.Vector2(0.15, 0.15)
                        : settings.preset === "Rose"
                          ? new THREE.Vector2(0.1, 0.1)
                          : new THREE.Vector2(0.09, 0.09)
                    }
                    roughnessMap={getBotanicalMaterialTexture(
                      "leaf",
                      "roughness",
                      textureResolution,
                      calyxBladeMaterialVariant,
                    )}
                    transmission={
                      photorealistic && settings.preset === "Rose"
                        ? 0.028
                        : photorealistic && settings.preset === "Sunflower"
                          ? 0.014 + (1 - bractWhorl) * 0.006
                          : photorealistic && settings.preset === "Poppy"
                            ? 0.012
                            : 0
                    }
                    thickness={
                      settings.preset === "Rose"
                        ? 0.045
                        : settings.preset === "Sunflower"
                          ? 0.05
                          : settings.preset === "Poppy"
                            ? 0.04
                            : 0.035
                    }
                    thicknessMap={getBotanicalMaterialTexture(
                      "leaf",
                      "thickness",
                      textureResolution,
                      calyxBladeMaterialVariant,
                    )}
                    attenuationColor={getHeroSupportTissueColor(
                      settings.preset,
                      settings.stemColor,
                      "calyx",
                    )}
                    attenuationDistance={
                      settings.preset === "Rose"
                        ? 0.78
                        : settings.preset === "Poppy"
                          ? 0.5
                          : 0.64
                    }
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
