"use client";

import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { createPetalGeometry, seededRandom } from "@/lib/flower-geometry";
import { getBotanicalTexture } from "@/lib/botanical-textures";
import { flowerSpecies, type PetalLayer } from "@/lib/flower-species";
import { useFlowerStore } from "@/lib/flower-store";

export function FlowerPetal({
  index,
  count,
  layer,
}: {
  index: number;
  count: number;
  layer: PetalLayer;
}) {
  const settings = useFlowerStore();
  const lineDrawing = settings.renderMode === "line";
  const photorealistic = settings.renderMode === "photo";
  const structure = flowerSpecies[settings.preset];
  const random = seededRandom(settings.seed + index * 7 + layer.length * 101);
  const secondary = seededRandom(settings.seed + index * 13 + layer.width * 83);
  const angle =
    ((index + layer.offset) / count) * Math.PI * 2 +
    (random - 0.5) * settings.variation * 0.25;
  const length =
    settings.petalLength *
    layer.length *
    (1 + (random - 0.5) * settings.variation);
  const width =
    settings.petalWidth *
    layer.width *
    (1 + (secondary - 0.5) * settings.variation);
  const lift =
    (1 - settings.bloom) * 0.72 +
    layer.lift +
    (secondary - 0.5) * settings.variation * 0.3;
  const petalColors = useMemo(() => {
    const tint = (value: string, amount: number) =>
      `#${new THREE.Color(value)
        .offsetHSL((secondary - 0.5) * 0.012, (random - 0.5) * 0.035, amount)
        .getHexString()}`;
    const lightness = (random - 0.5) * settings.variation * 0.12;
    const aged = new THREE.Color("#8b6846");
    const ageColor = (value: string, amount: number) =>
      `#${new THREE.Color(value).lerp(aged, settings.petalAge * amount).getHexString()}`;
    return {
      base: ageColor(tint(settings.petalColor, lightness), 0.28),
      tip: ageColor(tint(settings.petalTipColor, lightness * 0.7), 0.5),
    };
  }, [
    random,
    secondary,
    settings.petalColor,
    settings.petalTipColor,
    settings.variation,
    settings.petalAge,
  ]);
  const geometry = useMemo(
    () =>
      createPetalGeometry({
        length,
        width,
        curl: settings.petalCurl,
        lift,
        baseColor: petalColors.base,
        tipColor: petalColors.tip,
        notch: structure.notch * settings.petalNotch,
        profile: structure.profile,
        edgeRuffle: structure.edgeRuffle * settings.petalRuffle,
        baseDarkening: structure.baseDarkening,
        waviness: settings.petalWaviness,
        wavePhase: random * Math.PI * 2,
        thicknessScale: settings.petalThickness,
        fold: settings.petalFold,
        twist: settings.petalTwist,
        baseWidth: settings.petalBaseWidth,
        spots: settings.petalSpots,
        guideStrength: settings.petalGuideStrength,
        markingSeed: settings.seed + index * 101,
      }),
    [length, width, settings, lift, structure, petalColors, random, index],
  );

  return (
    <mesh
      geometry={geometry}
      rotation={[0, angle, (random - 0.5) * settings.variation * 0.16]}
      position={[0, layer.lift * 0.12 + (index % 3) * 0.009, 0]}
    >
      {lineDrawing ? (
        <meshBasicMaterial color="#ffffff" />
      ) : (
        <meshPhysicalMaterial
          vertexColors
          roughness={(photorealistic ? 0.67 : 0.74) + secondary * 0.08}
          specularIntensity={photorealistic ? 0.2 : 0.08}
          clearcoat={0}
          sheen={0}
          transmission={photorealistic ? 0.012 : 0}
          thickness={0.045}
          ior={1.38}
          attenuationColor={settings.petalTipColor}
          attenuationDistance={1.25}
          bumpMap={getBotanicalTexture("petal")}
          bumpScale={0.014 * settings.petalVeinStrength}
        />
      )}
      {lineDrawing && <Edges color="#111111" threshold={24} />}
    </mesh>
  );
}
