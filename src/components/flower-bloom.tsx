"use client";

import { FlowerCalyx } from "./flower-calyx";
import { FlowerCenter } from "./flower-center";
import { FlowerCorolla } from "./flower-corolla";
import { FlowerPetal } from "./flower-petal";
import type { FlowerSpecies } from "@/lib/flower-species";
import { useFlowerStore } from "@/lib/flower-store";
import { useEffect } from "react";
import * as THREE from "three";
import {
  createPetalPlacement,
  seededRandom,
} from "@/lib/flower-geometry";
import { getHeroPetalTuning } from "@/lib/flower-petal-tuning";
import { getFlowerGrowthState, getFlowerPhaseTuning } from "@/lib/flower-growth";
import { warmPetalGeometry } from "@/lib/geometry-worker-client";

export function FlowerBloom({
  structure,
  seedOffset = 0,
}: {
  structure: FlowerSpecies;
  seedOffset?: number;
}) {
  const settings = useFlowerStore();
  const fusedCorolla =
    structure.bloomArchitecture === "bell" ||
    structure.bloomArchitecture === "trumpet";
  const growth = getFlowerGrowthState(settings.bloom, settings.petalAge);
  const phase = growth.phase;
  const phaseTuning = getFlowerPhaseTuning(phase);

  useEffect(() => {
    if (fusedCorolla) return;
    structure.layers.forEach((layer, layerIndex) => {
      const count = Math.max(1, Math.round(settings.petalCount * layer.count));
      for (const index of [0, Math.floor(count * 0.5)]) {
        const seed = settings.seed + seedOffset;
        const random = seededRandom(seed + index * 7 + layer.length * 101);
        const secondary = seededRandom(seed + index * 13 + layer.width * 83);
        const placement = createPetalPlacement({
          index,
          count,
          layerIndex,
          layerCount: structure.layers.length,
          layerOffset: layer.offset,
          seed,
          variation: settings.variation,
          arrangement: structure.petalArrangement,
          receptacleRadius: structure.receptacleRadius,
          innerCompression: structure.innerCompression,
          overlapJitter: structure.overlapJitter,
          role: layer.role,
        });
        const tuning = getHeroPetalTuning(
          settings.preset,
          structure,
          layer,
          layerIndex,
          structure.layers.length,
        );
        const opening = THREE.MathUtils.clamp(
          settings.bloom * phaseTuning.petalOpenScale,
          0,
          1,
        );
        const length =
          settings.petalLength *
          layer.length *
          tuning.lengthScale *
          THREE.MathUtils.lerp(0.42, 1, opening) *
          phaseTuning.petalSpreadScale *
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

        const petalColors = {
          base: settings.petalColor,
          tip: settings.petalTipColor,
        };
        void warmPetalGeometry({
          length,
          width,
          curl:
            settings.petalCurl * (0.92 + tuning.curlBias * 0.45) +
            growth.wilt * 0.42 * phaseTuning.petalCurlScale,
          lift:
            (1 - settings.bloom) * 0.72 +
            layer.lift -
            (0.18 + layerIndex * 0.025) * (1 - settings.bloom) +
            tuning.liftBias * phaseTuning.petalLiftScale,
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
            growth.wilt * 0.05,
          twist:
            settings.petalTwist +
            tuning.twistBias +
            growth.wilt * 0.03,
          baseWidth: settings.petalBaseWidth * tuning.baseWidthScale,
          spots: settings.petalSpots * tuning.spotScale,
          guideStrength:
            settings.petalGuideStrength * tuning.guideStrengthScale,
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
            (layer.lateralCup ?? structure.lateralCup ?? 1) +
            tuning.lateralCupBias,
          lengthSegments: 18,
          widthSegments: 8,
        });
      }
    });
  }, [
    fusedCorolla,
    seedOffset,
    settings.bloom,
    settings.petalAsymmetry,
    settings.petalBaseWidth,
    settings.petalColor,
    settings.petalCount,
    settings.petalCurl,
    settings.petalEdgeWear,
    settings.petalFold,
    settings.petalLength,
    settings.petalNotch,
    settings.petalSheen,
    settings.petalSpots,
    settings.petalGuideStrength,
    settings.petalRuffle,
    settings.petalThickness,
    settings.petalTipColor,
    settings.petalTranslucency,
    settings.petalWidth,
    settings.petalTwist,
    settings.petalWaviness,
    settings.seed,
    settings.variation,
    structure,
    phase,
  ]);

  return (
    <group>
      <FlowerCalyx structure={structure} fusedCorolla={fusedCorolla} />
      {fusedCorolla ? (
        <FlowerCorolla structure={structure} seedOffset={seedOffset} />
      ) : (
        structure.layers.map((layer, layerIndex) => {
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
              layerIndex={layerIndex}
              layerCount={structure.layers.length}
              seedOffset={seedOffset}
            />
          ));
        })
      )}
      <group position={[0, structure.centerAxialOffset ?? 0, 0]}>
        <FlowerCenter structure={structure} minimal={fusedCorolla} />
      </group>
    </group>
  );
}
