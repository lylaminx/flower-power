"use client";

import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import {
  createPetalGeometry,
  createPetalPlacement,
  seededRandom,
} from "@/lib/flower-geometry";
import { getHeroPetalTuning } from "@/lib/flower-petal-tuning";
import { getFlowerGrowthState, getFlowerPhaseTuning } from "@/lib/flower-growth";
import {
  getBotanicalAgeTexture,
  getBotanicalMaterialTexture,
  getBotanicalTexture,
} from "@/lib/botanical-textures";
import { flowerSpecies, type PetalLayer } from "@/lib/flower-species";
import { useFlowerStore } from "@/lib/flower-store";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import { useShallow } from "zustand/react/shallow";

export function FlowerPetal({
  index,
  count,
  layer,
  layerIndex,
  layerCount,
  seedOffset = 0,
}: {
  index: number;
  count: number;
  layer: PetalLayer;
  layerIndex: number;
  layerCount: number;
  seedOffset?: number;
}) {
  const settings = useFlowerStore(
    useShallow((state) => ({
      renderMode: state.renderMode,
      preset: state.preset,
      petalLength: state.petalLength,
      petalWidth: state.petalWidth,
      petalCurl: state.petalCurl,
      petalWaviness: state.petalWaviness,
      petalThickness: state.petalThickness,
      petalFold: state.petalFold,
      petalTwist: state.petalTwist,
      petalRuffle: state.petalRuffle,
      petalNotch: state.petalNotch,
      petalVeinStrength: state.petalVeinStrength,
      petalBaseWidth: state.petalBaseWidth,
      petalAge: state.petalAge,
      petalSpots: state.petalSpots,
      petalGuideStrength: state.petalGuideStrength,
      petalAsymmetry: state.petalAsymmetry,
      petalTranslucency: state.petalTranslucency,
      petalEdgeWear: state.petalEdgeWear,
      petalSheen: state.petalSheen,
      bloom: state.bloom,
      variation: state.variation,
      petalColor: state.petalColor,
      petalTipColor: state.petalTipColor,
      seed: state.seed,
    })),
  );
  const quality = useRenderQuality();
  const textureResolution = getTextureResolution(quality);
  const lineDrawing = settings.renderMode === "line";
  const photorealistic = settings.renderMode === "photo";
  const structure = flowerSpecies[settings.preset];
  const growth = getFlowerGrowthState(settings.bloom, settings.petalAge);
  const phaseTuning = getFlowerPhaseTuning(growth.phase);
  const opening = THREE.MathUtils.clamp(
    growth.openness * phaseTuning.petalOpenScale,
    0,
    1,
  );
  const bloomOpenScale =
    THREE.MathUtils.lerp(0.42, 1, opening) * phaseTuning.petalSpreadScale;
  const tuning = getHeroPetalTuning(
    settings.preset,
    structure,
    layer,
    layerIndex,
    layerCount,
  );
  const seed = settings.seed + seedOffset;
  const random = seededRandom(seed + index * 7 + layer.length * 101);
  const secondary = seededRandom(seed + index * 13 + layer.width * 83);
  const placement = createPetalPlacement({
    index,
    count,
    layerIndex,
    layerCount,
    layerOffset: layer.offset,
    seed,
    variation: settings.variation,
    arrangement: structure.petalArrangement,
    receptacleRadius: structure.receptacleRadius,
    innerCompression: structure.innerCompression,
    overlapJitter: structure.overlapJitter,
    role: layer.role,
  });
  const placementAngle = placement.angle + tuning.placementAngleBias;
  const placementRadialOffset =
    placement.radialOffset * tuning.placementRadialScale;
  const length =
    settings.petalLength *
    layer.length *
    tuning.lengthScale *
    bloomOpenScale *
    placement.scale *
    (1 + (random - 0.5) * settings.variation);
  const width =
    settings.petalWidth *
    layer.width *
    tuning.widthScale *
    THREE.MathUtils.lerp(0.68, 1, opening) *
    phaseTuning.petalSpreadScale *
    placement.scale *
    (1 + (secondary - 0.5) * settings.variation);
  const lift =
    (1 - settings.bloom) * 0.72 +
    layer.lift +
    tuning.liftBias * phaseTuning.petalLiftScale +
    (1 - opening) * 0.24 +
    (secondary - 0.5) * settings.variation * 0.3 -
    growth.wilt * phaseTuning.wiltScale * (0.18 + layerIndex * 0.025);
  const petalColors = useMemo(() => {
    const tint = (value: string, amount: number) =>
      `#${new THREE.Color(value)
        .offsetHSL((secondary - 0.5) * 0.012, (random - 0.5) * 0.035, amount)
        .getHexString()}`;
    const lightness = (random - 0.5) * settings.variation * 0.12;
    const aged = new THREE.Color("#8b6846");
    const withLayerAccent = (value: string) =>
      layer.accentColor
        ? `#${new THREE.Color(value)
            .lerp(
              new THREE.Color(layer.accentColor),
              layer.accentStrength ?? 0.5,
            )
            .getHexString()}`
        : value;
    const ageColor = (value: string, amount: number) =>
      `#${new THREE.Color(value).lerp(aged, settings.petalAge * amount).getHexString()}`;
    return {
      base: ageColor(
        withLayerAccent(tint(settings.petalColor, lightness)),
        0.28,
      ),
      tip: ageColor(
        withLayerAccent(tint(settings.petalTipColor, lightness * 0.7)),
        0.5,
      ),
    };
  }, [
    random,
    secondary,
    settings.petalColor,
    settings.petalTipColor,
    settings.variation,
    settings.petalAge,
    layer.accentColor,
    layer.accentStrength,
  ]);
  const geometry = useMemo(
    () =>
      createPetalGeometry({
        length,
        width,
        curl:
          settings.petalCurl * (0.92 + tuning.curlBias * 0.45) +
          growth.wilt * 0.42 * phaseTuning.petalCurlScale +
          (1 - opening) * 0.08,
        lift,
        baseColor: petalColors.base,
        tipColor: petalColors.tip,
        notch: structure.notch * settings.petalNotch,
        profile: structure.profile * tuning.profileScale,
        edgeRuffle:
          structure.edgeRuffle * settings.petalRuffle * tuning.edgeRuffleScale,
        baseDarkening: structure.baseDarkening * tuning.baseDarkeningScale,
        waviness: settings.petalWaviness,
        wavePhase: random * Math.PI * 2,
        thicknessScale: settings.petalThickness * tuning.thicknessScale,
        fold:
          settings.petalFold +
          tuning.foldBias +
          (1 - opening) * 0.08 +
          growth.wilt * 0.05,
        twist:
          settings.petalTwist +
          tuning.twistBias +
          (1 - opening) * 0.04 +
          growth.wilt * 0.03,
        baseWidth: settings.petalBaseWidth * tuning.baseWidthScale,
        spots: settings.petalSpots * tuning.spotScale,
        guideStrength: settings.petalGuideStrength * tuning.guideStrengthScale,
        markingSeed: seed + index * 101,
        asymmetry:
          settings.petalAsymmetry *
          tuning.asymmetryScale *
          (seededRandom(seed + index * 149) - 0.5) *
          2 +
          tuning.asymmetryBias,
        edgeWear: settings.petalEdgeWear,
        outline: layer.outline ?? structure.petalOutline,
        longitudinalCurve:
          (layer.longitudinalCurve ?? structure.longitudinalCurve ?? 0) +
          tuning.longitudinalCurveBias,
        lateralCup:
          (layer.lateralCup ?? structure.lateralCup ?? 1) + tuning.lateralCupBias,
        lengthSegments:
          quality === "draft" ? 12 : quality === "ultra" ? 28 : 18,
        widthSegments: quality === "draft" ? 6 : quality === "ultra" ? 12 : 8,
      }),
    [
      length,
      width,
      settings,
      lift,
      structure,
      tuning,
      petalColors,
      random,
      index,
      layer.lateralCup,
      layer.longitudinalCurve,
      layer.outline,
      seed,
      growth.wilt,
      quality,
    ],
  );

  return (
      <mesh
      dispose={null}
      geometry={geometry}
      rotation={[0, placementAngle, placement.roll + tuning.placementRollBias]}
      position={[
        Math.sin(placementAngle) * placementRadialOffset,
        layer.lift * 0.12 +
          tuning.placementLiftBias +
          (1 - opening) * 0.12 +
          (index % 3) * 0.009,
        Math.cos(placementAngle) * placementRadialOffset,
      ]}
    >
      {lineDrawing ? (
        <meshBasicMaterial color="#ffffff" />
      ) : (
        <>
          {["#ffffff", "#e4e8df", "#d9d8cf"].map((surfaceColor, face) => (
            <meshPhysicalMaterial
              key={surfaceColor}
              attach={`material-${face}`}
              color={surfaceColor}
              map={getBotanicalAgeTexture(
                "petal",
                settings.petalAge,
                seed,
                textureResolution,
              )}
              vertexColors
              roughness={
                (photorealistic ? 0.72 : 0.78) -
                settings.petalSheen * 0.25 * tuning.sheenScale +
                secondary * 0.08 +
                face * 0.035
              }
              specularIntensity={
                (photorealistic ? 0.16 : 0.06) +
                settings.petalSheen * 0.28 * tuning.sheenScale -
                face * 0.025
              }
              clearcoat={
                photorealistic
                  ? Math.max(0.012, settings.petalSheen * 0.12) *
                      tuning.sheenScale *
                    growth.moisture
                  : 0
              }
              clearcoatRoughness={0.46}
              clearcoatMap={getBotanicalMaterialTexture(
                "petal",
                "moisture",
                textureResolution,
              )}
              sheen={0}
              transmission={
                photorealistic
                  ? settings.petalTranslucency * 0.16 * tuning.translucencyScale
                  : 0
              }
              thickness={THREE.MathUtils.lerp(
                0.08,
                0.018,
                settings.petalTranslucency,
              )}
              ior={1.38}
              attenuationColor={layer.accentColor ?? settings.petalTipColor}
              attenuationDistance={1.25}
              bumpMap={getBotanicalTexture("petal", textureResolution)}
              bumpScale={0.014 * settings.petalVeinStrength}
              normalMap={getBotanicalMaterialTexture(
                "petal",
                "microNormal",
                textureResolution,
              )}
              normalScale={new THREE.Vector2(0.12, 0.12)}
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
            />
          ))}
        </>
      )}
      {lineDrawing && <Edges color="#111111" threshold={24} />}
    </mesh>
  );
}
