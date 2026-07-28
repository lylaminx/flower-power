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
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import { useShallow } from "zustand/react/shallow";

const orchidCallusGeometry = new THREE.SphereGeometry(1, 14, 9);
const orchidKeelGeometry = new THREE.CapsuleGeometry(1, 1.5, 4, 7);
const orchidLipLobeGeometry = createPetalGeometry({
  length: 0.72,
  width: 0.44,
  curl: 0.36,
  lift: 0.07,
  baseColor: "#f2eadf",
  tipColor: "#fffdf8",
  notch: 0,
  profile: 0.68,
  thicknessScale: 0.72,
  fold: 0.42,
  baseWidth: 1.2,
  outline: "obovate",
  longitudinalCurve: -0.35,
  lateralCup: 1.72,
  lengthSegments: 30,
  widthSegments: 20,
}).clone();
orchidLipLobeGeometry.clearGroups();

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
    (1 + (secondary - 0.5) * settings.variation);
  const lift =
    (1 - settings.bloom) * 0.72 +
    layer.lift +
    tuning.liftBias * phaseTuning.petalLiftScale +
    (1 - opening) * 0.24 +
    (secondary - 0.5) * settings.variation * 0.3 -
    individualWilt * (0.18 + layerIndex * 0.025);
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
          (secondary - 0.5) * individualWilt * 0.12,
        baseWidth: settings.petalBaseWidth * tuning.baseWidthScale,
        spots: settings.petalSpots * tuning.spotScale * 0.15,
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
        lengthSegments:
          quality === "draft"
            ? 12
            : Math.round(
                (quality === "ultra" ? 40 : 28) * tuning.tessellationScale,
              ),
        // The lateral grid defines the projected petal margin. Eight to twelve
        // segments left unmistakable polygonal steps on broad hero petals,
        // especially Poppy, Rose, and Lotus. Spend tessellation on this visible
        // outline before adding more micro-detail.
        widthSegments:
          quality === "draft"
            ? 6
            : Math.round(
                (quality === "ultra" ? 24 : 16) * tuning.tessellationScale,
              ),
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
      layer.lateralCup,
      layer.longitudinalCurve,
      layer.outline,
      opening,
      phaseTuning.petalCurlScale,
      seed,
      individualWilt,
      quality,
    ],
  );

  return (
    <mesh
      dispose={null}
      geometry={geometry}
      rotation={[0, placementAngle, placement.roll + tuning.placementRollBias]}
      scale={[petalRetention, petalRetention, petalRetention]}
      position={[
        Math.sin(placementAngle) * placementRadialOffset,
        layer.lift * 0.12 +
          tuning.placementLiftBias +
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
          {["#ffffff", "#e4e8df", "#d9d8cf"].map((surfaceColor, face) => (
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
                layer.role === "lip" ? "#a44082" : undefined,
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
                  ? settings.petalTranslucency * 0.22 * tuning.translucencyScale
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
              bumpScale={
                0.014 * settings.petalVeinStrength * tuning.surfaceReliefScale
              }
              normalMap={getBotanicalMaterialTexture(
                "petal",
                "microNormal",
                textureResolution,
              )}
              normalScale={new THREE.Vector2(0.12, 0.12).multiplyScalar(
                tuning.surfaceReliefScale,
              )}
              roughnessMap={getBotanicalMaterialTexture(
                "petal",
                "roughness",
                textureResolution,
              )}
              thicknessMap={getBotanicalMaterialTexture(
                "petal",
                "thickness",
                textureResolution,
                settings.preset === "Poppy"
                  ? "papery"
                  : settings.preset === "Rose"
                    ? "veined"
                    : layer.role === "ray"
                      ? "ligulate"
                      : "default",
              )}
            />
          ))}
        </>
      )}
      {lineDrawing && <Edges color="#111111" threshold={24} />}
      {settings.preset === "Orchid" && layer.role === "lip" && (
        <group>
          {([-1, 1] as const).map((lobeSide) => (
            <mesh
              key={`lip-lobe-${lobeSide}`}
              dispose={null}
              geometry={orchidLipLobeGeometry}
              position={[lobeSide * width * 0.042, 0.004, length * 0.008]}
              rotation={[-0.26, lobeSide * 0.34, lobeSide * -0.14]}
              scale={[width * 0.7, length * 0.78, width * 0.72]}
            >
              {lineDrawing ? (
                <meshBasicMaterial color="#ffffff" />
              ) : (
                <meshPhysicalMaterial
                  color="#f5f0e8"
                  roughness={0.7}
                  specularIntensity={0.16}
                  transmission={0.035}
                  thickness={0.025}
                  side={THREE.DoubleSide}
                />
              )}
            </mesh>
          ))}
          {([-1, 1] as const).map((callusSide) => (
            <mesh
              key={`callus-${callusSide}`}
              dispose={null}
              position={[
                callusSide * width * 0.11,
                0.026,
                length * (0.22 + secondary * 0.025),
              ]}
              rotation={[0.18, 0, callusSide * -0.16]}
              scale={[width * 0.055, length * 0.05, width * 0.045]}
            >
              <primitive object={orchidCallusGeometry} attach="geometry" />
              {lineDrawing ? (
                <meshBasicMaterial color="#ffffff" />
              ) : (
                <meshPhysicalMaterial
                  color={layer.accentColor ?? settings.petalTipColor}
                  roughness={THREE.MathUtils.lerp(0.82, 0.68, growth.moisture)}
                  specularIntensity={0.12}
                  clearcoat={0.06 * growth.moisture}
                  clearcoatRoughness={0.42}
                />
              )}
              {lineDrawing && <Edges color="#111111" threshold={18} />}
            </mesh>
          ))}
          <mesh
            dispose={null}
            position={[0, 0.022, length * 0.37]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[width * 0.045, length * 0.16, width * 0.055]}
          >
            <primitive object={orchidKeelGeometry} attach="geometry" />
            {lineDrawing ? (
              <meshBasicMaterial color="#ffffff" />
            ) : (
              <meshPhysicalMaterial
                color={layer.accentColor ?? settings.petalTipColor}
                roughness={0.76}
                specularIntensity={0.1}
              />
            )}
            {lineDrawing && <Edges color="#111111" threshold={18} />}
          </mesh>
        </group>
      )}
    </mesh>
  );
}
