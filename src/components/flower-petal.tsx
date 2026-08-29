"use client";

import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import {
  createPetalGeometry,
  createPetalPlacement,
  seededRandom,
} from "@/lib/flower-geometry";
import {
  getHeroPetalTuning,
  getLotusPetalMaterialTuning,
  getSunflowerRayMaterialTuning,
} from "@/lib/flower-petal-tuning";
import {
  getFlowerGrowthState,
  getFlowerPhaseTuning,
} from "@/lib/flower-growth";
import {
  getBotanicalMaterialTexture,
  getBotanicalTexture,
  getPetalAlbedoTexture,
} from "@/lib/botanical-textures";
import { flowerSpecies, type PetalLayer } from "@/lib/flower-species";
import { useFlowerStore } from "@/lib/flower-store";
import {
  getHeroPetalAttenuationDistance,
  getHeroPetalTransmissionFactor,
  getHeroPetalColorVariationScale,
} from "@/lib/flower-color-tuning";
import { useRenderQuality } from "./render-quality-context";
import {
  getPetalTessellation,
  getTextureResolution,
} from "@/lib/flower-quality";
import {
  createOrchidThinSurfaceShader,
  orchidThinSurfaceProgramKey,
} from "@/lib/orchid-thin-surface";
import {
  createPoppyThinSurfaceShader,
  poppyThinSurfaceProgramKey,
} from "@/lib/poppy-thin-surface";
import {
  createLilyThinSurfaceShader,
  lilyThinSurfaceProgramKey,
} from "@/lib/lily-thin-surface";
import {
  createRoseThinSurfaceShader,
  roseThinSurfaceProgramKey,
} from "@/lib/rose-thin-surface";
import {
  createSunflowerThinSurfaceShader,
  sunflowerThinSurfaceProgramKey,
} from "@/lib/sunflower-thin-surface";
import {
  createLotusThinSurfaceShader,
  lotusThinSurfaceProgramKey,
} from "@/lib/lotus-thin-surface";
import { useFlowerLightingRig } from "./flower-lighting-context";
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
  const lightingRig = useFlowerLightingRig();
  // Lily freckles and Rose's fine branched vasculature expose the shared
  // albedo/material textures at macro distance. Give both species one extra
  // resolution tier so those tissue fields do not resolve into square texels.
  const textureResolution = Math.min(
    512,
    getTextureResolution(quality) *
      (settings.preset === "Lily" || settings.preset === "Rose" ? 2 : 1),
  );
  const orchidThinSurfaceShader = useMemo(
    () => createOrchidThinSurfaceShader(lightingRig.rimIntensity),
    [lightingRig.rimIntensity],
  );
  const orchidThinSurfaceCacheKey = useMemo(
    () => () => orchidThinSurfaceProgramKey(lightingRig.rimIntensity),
    [lightingRig.rimIntensity],
  );
  const poppyThinSurfaceShader = useMemo(
    () => createPoppyThinSurfaceShader(lightingRig.rimIntensity),
    [lightingRig.rimIntensity],
  );
  const poppyThinSurfaceCacheKey = useMemo(
    () => () => poppyThinSurfaceProgramKey(lightingRig.rimIntensity),
    [lightingRig.rimIntensity],
  );
  const lilyThinSurfaceShader = useMemo(
    () => createLilyThinSurfaceShader(lightingRig.rimIntensity),
    [lightingRig.rimIntensity],
  );
  const lilyThinSurfaceCacheKey = useMemo(
    () => () => lilyThinSurfaceProgramKey(lightingRig.rimIntensity),
    [lightingRig.rimIntensity],
  );
  const roseThinSurfaceShader = useMemo(
    () => createRoseThinSurfaceShader(lightingRig.rimIntensity),
    [lightingRig.rimIntensity],
  );
  const roseThinSurfaceCacheKey = useMemo(
    () => () => roseThinSurfaceProgramKey(lightingRig.rimIntensity),
    [lightingRig.rimIntensity],
  );
  const sunflowerThinSurfaceShader = useMemo(
    () => createSunflowerThinSurfaceShader(lightingRig.rimIntensity),
    [lightingRig.rimIntensity],
  );
  const sunflowerThinSurfaceCacheKey = useMemo(
    () => () => sunflowerThinSurfaceProgramKey(lightingRig.rimIntensity),
    [lightingRig.rimIntensity],
  );
  const lotusThinSurfaceShader = useMemo(
    () => createLotusThinSurfaceShader(lightingRig.rimIntensity),
    [lightingRig.rimIntensity],
  );
  const lotusThinSurfaceCacheKey = useMemo(
    () => () => lotusThinSurfaceProgramKey(lightingRig.rimIntensity),
    [lightingRig.rimIntensity],
  );
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
  const lotusMaterialTuning =
    settings.preset === "Lotus"
      ? getLotusPetalMaterialTuning(layerIndex, layerCount, 0)
      : undefined;
  const sunflowerRayMaterialTuning =
    settings.preset === "Sunflower" && layer.role === "ray"
      ? getSunflowerRayMaterialTuning(index, count, 0)
      : undefined;
  const petalTessellation = getPetalTessellation(
    quality,
    layer.outline ?? structure.petalOutline ?? "elliptic",
    tuning.tessellationScale,
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
  const placementAngle =
    placement.angle +
    tuning.placementAngleBias +
    (random - 0.5) * tuning.individualAngleJitter;
  const placementRadialOffset =
    placement.radialOffset * tuning.placementRadialScale;
  const layerProgress = layerCount <= 1 ? 0 : layerIndex / (layerCount - 1);
  const individualWilt =
    growth.wilt *
    phaseTuning.wiltScale *
    THREE.MathUtils.lerp(
      0.72,
      1.28,
      seededRandom(seed + index * 347 + layerIndex * 89),
    ) *
    THREE.MathUtils.lerp(1.18, 0.68, layerProgress);
  const petalRetention = THREE.MathUtils.lerp(
    1,
    tuning.petalPersistence,
    THREE.MathUtils.smoothstep(individualWilt, 0.48, 0.96),
  );
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
    (1 + (secondary - 0.5) * settings.variation * tuning.widthVariationScale);
  const lift =
    (1 - settings.bloom) * 0.72 +
    layer.lift +
    tuning.liftBias * phaseTuning.petalLiftScale +
    (1 - opening) * 0.24 +
    (secondary - 0.5) * settings.variation * 0.3 * tuning.liftVariationScale -
    individualWilt * (0.18 + layerIndex * 0.025);
  const petalColors = useMemo(() => {
    const tint = (value: string, amount: number) =>
      `#${new THREE.Color(value)
        .offsetHSL((secondary - 0.5) * 0.012, (random - 0.5) * 0.035, amount)
        .getHexString()}`;
    const lightness =
      (random - 0.5) *
      settings.variation *
      0.12 *
      getHeroPetalColorVariationScale(settings.preset);
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
    settings.preset,
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
          individualWilt * 0.42 * phaseTuning.petalCurlScale +
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
          individualWilt * 0.05,
        pleatStrength:
          tuning.pleatStrength *
          THREE.MathUtils.lerp(0.72, 1, opening) *
          THREE.MathUtils.lerp(1, 1.12, individualWilt),
        twist:
          settings.petalTwist +
          tuning.twistBias +
          (1 - opening) * 0.04 +
          (settings.preset === "Sunflower" && layer.role === "ray"
            ? (secondary - 0.5) * 0.14
            : 0) +
          (secondary - 0.5) * individualWilt * 0.12,
        baseWidth: settings.petalBaseWidth * tuning.baseWidthScale,
        spots:
          settings.preset === "Poppy"
            ? 0
            : settings.petalSpots * tuning.spotScale * 0.15,
        guideStrength:
          settings.petalGuideStrength * tuning.guideStrengthScale * 0.15,
        markingSeed: seed + index * 101,
        asymmetry:
          settings.petalAsymmetry *
            tuning.asymmetryScale *
            (seededRandom(seed + index * 149) - 0.5) *
            2 +
          tuning.asymmetryBias,
        edgeWear: settings.petalEdgeWear,
        edgeIrregularity:
          0.28 + settings.variation * 0.45 + settings.petalEdgeWear * 0.2,
        outline: layer.outline ?? structure.petalOutline,
        longitudinalCurve:
          (layer.longitudinalCurve ?? structure.longitudinalCurve ?? 0) +
          tuning.longitudinalCurveBias,
        tipReflex: tuning.tipReflex * opening,
        lateralCup:
          (layer.lateralCup ?? structure.lateralCup ?? 1) +
          tuning.lateralCupBias,
        tissueVariant:
          settings.preset === "Poppy"
            ? "papery"
            : settings.preset === "Rose"
              ? "veined"
              : settings.preset === "Lily"
                ? "parallel"
                : settings.preset === "Sunflower" && layer.role === "ray"
                  ? "ligulate"
                  : "default",
        lengthSegments: petalTessellation.lengthSegments,
        // The lateral grid defines the projected petal margin. Eight to twelve
        // segments left unmistakable polygonal steps on broad hero petals,
        // especially Poppy, Rose, and Lotus. Spend tessellation on this visible
        // outline before adding more micro-detail.
        widthSegments: petalTessellation.widthSegments,
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
      secondary,
      index,
      layer.role,
      layer.lateralCup,
      layer.longitudinalCurve,
      layer.outline,
      opening,
      phaseTuning.petalCurlScale,
      seed,
      individualWilt,
      petalTessellation.lengthSegments,
      petalTessellation.widthSegments,
    ],
  );

  return (
    <mesh
      dispose={null}
      geometry={geometry}
      rotation={[
        0,
        placementAngle,
        placement.roll +
          tuning.placementRollBias +
          (random - 0.5) * tuning.individualRollJitter,
      ]}
      scale={[petalRetention, petalRetention, petalRetention]}
      position={[
        Math.sin(placementAngle) * placementRadialOffset,
        layer.lift * 0.12 +
          tuning.placementLiftBias +
          (secondary - 0.5) * tuning.individualLiftJitter +
          (1 - opening) * 0.12 +
          (index % 3) * 0.009 -
          individualWilt * 0.035 -
          (1 - petalRetention) * 0.12,
        Math.cos(placementAngle) * placementRadialOffset,
      ]}
    >
      {lineDrawing ? (
        <meshBasicMaterial color="#ffffff" />
      ) : (
        <>
          {(settings.preset === "Lotus"
            ? ["#ffffff", "#f5eee8", "#eaded4"]
            : settings.preset === "Orchid"
              ? ["#ffffff", "#faf8f3", "#eee8df"]
              : ["#ffffff", "#e4e8df", "#d9d8cf"]
          ).map((surfaceColor, face) => (
            <meshPhysicalMaterial
              key={surfaceColor}
              attach={`material-${face}`}
              color={surfaceColor}
              map={getPetalAlbedoTexture(
                settings.petalAge,
                seed + index * 101,
                settings.petalSpots *
                  tuning.spotScale *
                  (layer.role === "lip" ? 2.4 : 1),
                settings.petalGuideStrength *
                  tuning.guideStrengthScale *
                  (layer.role === "lip" ? 2.2 : 1),
                textureResolution,
                layer.role === "lip"
                  ? "#a44082"
                  : settings.preset === "Lily"
                    ? "#542018"
                    : undefined,
                layer.role === "lip" ? "#d29436" : undefined,
                settings.preset === "Lily"
                  ? "lily"
                  : settings.preset === "Poppy"
                    ? "poppy"
                    : settings.preset === "Rose"
                      ? "rose"
                      : settings.preset === "Sunflower"
                        ? "ligulate"
                        : "default",
              )}
              vertexColors
              roughness={
                (photorealistic ? 0.72 : 0.78) -
                settings.petalSheen * 0.25 * tuning.sheenScale +
                secondary * 0.08 +
                face * 0.035 +
                (lotusMaterialTuning?.roughnessOffset ?? 0) +
                (sunflowerRayMaterialTuning?.roughnessOffset ?? 0) +
                (photorealistic &&
                settings.preset === "Orchid" &&
                layer.role === "lip"
                  ? 0.05
                  : photorealistic && settings.preset === "Poppy"
                    ? -0.045
                    : 0)
              }
              specularIntensity={
                (photorealistic ? 0.16 : 0.06) +
                settings.petalSheen * 0.28 * tuning.sheenScale -
                face * 0.025 -
                (photorealistic &&
                settings.preset === "Orchid" &&
                layer.role === "lip"
                  ? 0.03
                  : 0) +
                (photorealistic && settings.preset === "Poppy" ? 0.12 : 0)
              }
              specularColor={
                photorealistic && settings.preset === "Poppy"
                  ? "#ffd0c4"
                  : "#ffffff"
              }
              clearcoat={
                photorealistic
                  ? Math.max(0.012, settings.petalSheen * 0.12) *
                    tuning.sheenScale *
                    growth.moisture *
                    (settings.preset === "Orchid" && layer.role === "lip"
                      ? 0.68
                      : settings.preset === "Poppy"
                        ? 0.72
                        : settings.preset === "Rose"
                          ? 0.8
                          : settings.preset === "Lily"
                            ? 0.86
                            : settings.preset === "Sunflower" &&
                                layer.role === "ray"
                              ? 0.82
                              : settings.preset === "Lotus"
                                ? 0.78
                                : 1)
                  : 0
              }
              clearcoatRoughness={
                settings.preset === "Lotus"
                  ? getLotusPetalMaterialTuning(layerIndex, layerCount, face)
                      .clearcoatRoughness
                  : settings.preset === "Sunflower" && layer.role === "ray"
                    ? getSunflowerRayMaterialTuning(index, count, face)
                        .clearcoatRoughness
                    : settings.preset === "Orchid" && layer.role === "lip"
                      ? 0.58
                      : settings.preset === "Poppy"
                        ? 0.62
                        : settings.preset === "Rose"
                          ? 0.52
                          : settings.preset === "Lily"
                            ? 0.5
                            : 0.46
              }
              clearcoatMap={getBotanicalMaterialTexture(
                "petal",
                "moisture",
                textureResolution,
                settings.preset === "Lotus"
                  ? "lotus"
                  : settings.preset === "Poppy"
                    ? "papery"
                    : settings.preset === "Rose"
                      ? "veined"
                      : settings.preset === "Lily"
                        ? "parallel"
                        : settings.preset === "Sunflower" &&
                            layer.role === "ray"
                          ? "ligulate"
                          : "default",
              )}
              sheen={
                photorealistic && settings.preset === "Rose"
                  ? face === 1
                    ? 0.16
                    : 0.13
                  : photorealistic &&
                      settings.preset === "Sunflower" &&
                      layer.role === "ray"
                    ? getSunflowerRayMaterialTuning(index, count, face)
                        .sheenStrength
                    : 0
              }
              sheenColor={
                settings.preset === "Rose"
                  ? "#f5b0c8"
                  : settings.preset === "Sunflower" && layer.role === "ray"
                    ? "#ffc45a"
                    : "#ffffff"
              }
              sheenRoughness={
                settings.preset === "Rose"
                  ? 0.68
                  : settings.preset === "Sunflower" && layer.role === "ray"
                    ? getSunflowerRayMaterialTuning(index, count, face)
                        .sheenRoughness
                    : 0.5
              }
              emissive={
                photorealistic && settings.preset === "Poppy"
                  ? "#ff4b24"
                  : photorealistic && settings.preset === "Lily"
                    ? "#ffdc62"
                    : photorealistic && settings.preset === "Rose"
                      ? "#ff78c5"
                      : photorealistic &&
                          settings.preset === "Sunflower" &&
                          layer.role === "ray"
                        ? "#f0a12d"
                        : photorealistic &&
                            settings.preset === "Orchid" &&
                            layer.role !== "lip"
                          ? "#fff0dc"
                          : photorealistic && settings.preset === "Lotus"
                            ? "#ffd5da"
                            : "#000000"
              }
              emissiveIntensity={
                photorealistic && settings.preset === "Poppy"
                  ? 0.2 + face * 0.025
                  : photorealistic && settings.preset === "Lily"
                    ? 0.24 + face * 0.018
                    : photorealistic && settings.preset === "Rose"
                      ? face === 1
                        ? 0.12
                        : 0.04
                      : photorealistic &&
                          settings.preset === "Sunflower" &&
                          layer.role === "ray"
                        ? getSunflowerRayMaterialTuning(index, count, face)
                            .emissiveIntensity
                        : photorealistic &&
                            settings.preset === "Orchid" &&
                            layer.role !== "lip"
                          ? 0.1 + face * 0.025
                          : photorealistic && settings.preset === "Lotus"
                            ? 0.08 + face * 0.02
                            : 0
              }
              emissiveMap={
                photorealistic && settings.preset === "Poppy"
                  ? getBotanicalMaterialTexture(
                      "petal",
                      "backscatter",
                      textureResolution,
                      "papery",
                    )
                  : photorealistic && settings.preset === "Lily"
                    ? getBotanicalMaterialTexture(
                        "petal",
                        "backscatter",
                        textureResolution,
                        "parallel",
                      )
                    : photorealistic && settings.preset === "Rose"
                      ? getBotanicalMaterialTexture(
                          "petal",
                          "backscatter",
                          textureResolution,
                          "veined",
                        )
                      : photorealistic &&
                          settings.preset === "Sunflower" &&
                          layer.role === "ray"
                        ? getBotanicalMaterialTexture(
                            "petal",
                            "backscatter",
                            textureResolution,
                            "ligulate",
                          )
                        : photorealistic &&
                            settings.preset === "Orchid" &&
                            layer.role !== "lip"
                          ? getBotanicalMaterialTexture(
                              "petal",
                              "backscatter",
                              textureResolution,
                              "orchid",
                            )
                          : photorealistic && settings.preset === "Lotus"
                            ? getBotanicalMaterialTexture(
                                "petal",
                                "backscatter",
                                textureResolution,
                                "lotus",
                              )
                            : null
              }
              onBeforeCompile={
                photorealistic && settings.preset === "Poppy"
                  ? poppyThinSurfaceShader
                  : photorealistic && settings.preset === "Lily"
                    ? lilyThinSurfaceShader
                    : photorealistic && settings.preset === "Rose"
                      ? roseThinSurfaceShader
                      : photorealistic &&
                          settings.preset === "Sunflower" &&
                          layer.role === "ray"
                        ? sunflowerThinSurfaceShader
                        : photorealistic &&
                            settings.preset === "Orchid" &&
                            layer.role !== "lip"
                          ? orchidThinSurfaceShader
                          : photorealistic && settings.preset === "Lotus"
                            ? lotusThinSurfaceShader
                            : undefined
              }
              customProgramCacheKey={
                photorealistic && settings.preset === "Poppy"
                  ? poppyThinSurfaceCacheKey
                  : photorealistic && settings.preset === "Lily"
                    ? lilyThinSurfaceCacheKey
                    : photorealistic && settings.preset === "Rose"
                      ? roseThinSurfaceCacheKey
                      : photorealistic &&
                          settings.preset === "Sunflower" &&
                          layer.role === "ray"
                        ? sunflowerThinSurfaceCacheKey
                        : photorealistic &&
                            settings.preset === "Orchid" &&
                            layer.role !== "lip"
                          ? orchidThinSurfaceCacheKey
                          : photorealistic && settings.preset === "Lotus"
                            ? lotusThinSurfaceCacheKey
                            : undefined
              }
              transmission={
                photorealistic
                  ? settings.petalTranslucency *
                    getHeroPetalTransmissionFactor(
                      settings.preset,
                      layer.role,
                    ) *
                    tuning.translucencyScale
                  : 0
              }
              thickness={
                THREE.MathUtils.lerp(0.08, 0.018, settings.petalTranslucency) *
                (settings.preset === "Orchid"
                  ? 0.72
                  : settings.preset === "Lily"
                    ? 0.9
                    : settings.preset === "Lotus"
                      ? 0.94
                      : settings.preset === "Sunflower" && layer.role === "ray"
                        ? 0.94
                        : settings.preset === "Poppy"
                          ? 0.5
                          : 1)
              }
              ior={1.38}
              attenuationColor={layer.accentColor ?? settings.petalTipColor}
              attenuationDistance={getHeroPetalAttenuationDistance(
                settings.preset,
                layer.role,
              )}
              bumpMap={getBotanicalTexture(
                "petal",
                textureResolution,
                settings.preset === "Sunflower" && layer.role === "ray"
                  ? "ligulate"
                  : "default",
              )}
              bumpScale={
                (settings.preset === "Poppy" ? 0.022 : 0.014) *
                settings.petalVeinStrength *
                tuning.surfaceReliefScale
              }
              normalMap={getBotanicalMaterialTexture(
                "petal",
                "microNormal",
                textureResolution,
                settings.preset === "Poppy"
                  ? "papery"
                  : settings.preset === "Rose"
                    ? "veined"
                    : settings.preset === "Lily"
                      ? "parallel"
                      : settings.preset === "Sunflower" && layer.role === "ray"
                        ? "ligulate"
                        : settings.preset === "Orchid" && layer.role === "lip"
                          ? "orchidLip"
                          : settings.preset === "Lotus"
                            ? "lotus"
                            : "default",
              )}
              normalScale={new THREE.Vector2(
                settings.preset === "Poppy"
                  ? 0.28
                  : settings.preset === "Lily"
                    ? 0.26
                    : settings.preset === "Rose"
                      ? 0.24
                      : 0.12,
                settings.preset === "Poppy"
                  ? 0.28
                  : settings.preset === "Lily"
                    ? 0.26
                    : settings.preset === "Rose"
                      ? 0.24
                      : 0.12,
              ).multiplyScalar(tuning.surfaceReliefScale)}
              roughnessMap={getBotanicalMaterialTexture(
                "petal",
                "roughness",
                textureResolution,
                settings.preset === "Poppy"
                  ? "papery"
                  : settings.preset === "Lily"
                    ? "parallel"
                    : settings.preset === "Rose"
                      ? "veined"
                      : settings.preset === "Sunflower" && layer.role === "ray"
                        ? "ligulate"
                        : settings.preset === "Orchid" && layer.role !== "lip"
                          ? "orchid"
                          : settings.preset === "Orchid" && layer.role === "lip"
                            ? "orchidLip"
                            : settings.preset === "Lotus"
                              ? "lotus"
                              : "default",
              )}
              thicknessMap={getBotanicalMaterialTexture(
                "petal",
                "thickness",
                textureResolution,
                settings.preset === "Poppy"
                  ? "papery"
                  : settings.preset === "Lily"
                    ? "parallel"
                    : settings.preset === "Rose"
                      ? "veined"
                      : settings.preset === "Orchid" && layer.role !== "lip"
                        ? "orchid"
                        : settings.preset === "Orchid" && layer.role === "lip"
                          ? "orchidLip"
                          : settings.preset === "Lotus"
                            ? "lotus"
                            : layer.role === "ray"
                              ? "ligulate"
                              : "default",
              )}
            />
          ))}
        </>
      )}
      {lineDrawing && <Edges color="#111111" threshold={24} />}
    </mesh>
  );
}
