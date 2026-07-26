"use client";

import { Edges } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { FlowerSpecies } from "@/lib/flower-species";
import { getHeroCenterTuning } from "@/lib/flower-center-tuning";
import {
  getFlowerGrowthState,
  getFlowerPhaseTuning,
} from "@/lib/flower-growth";
import { useFlowerStore } from "@/lib/flower-store";
import { useRenderQuality } from "./render-quality-context";
import {
  createPollenClusterPlacements,
  seededRandom,
} from "@/lib/flower-geometry";

const filamentGeometry = new THREE.CylinderGeometry(1, 1, 1, 6);
const antherGeometry = new THREE.CapsuleGeometry(1, 1.4, 4, 8);
const antherGrooveGeometry = new THREE.CapsuleGeometry(1, 1.35, 3, 6);
const pollenGeometry = new THREE.IcosahedronGeometry(1, 1);
const ovaryGeometry = new THREE.SphereGeometry(1, 18, 12);
const ovaryRidgeGeometry = new THREE.CapsuleGeometry(1, 1.2, 4, 6);
const styleGeometry = new THREE.CylinderGeometry(1, 1, 1, 8);
const stigmaHeadGeometry = new THREE.SphereGeometry(1, 20, 12);
const stigmaLobeGeometry = new THREE.CapsuleGeometry(1, 1.1, 4, 7);
const stigmaPapillaGeometry = new THREE.SphereGeometry(1, 7, 5);
const columnGeometry = new THREE.CapsuleGeometry(1, 1.5, 5, 8);
const polliniumGeometry = new THREE.SphereGeometry(1, 12, 8);
const polliniumStalkGeometry = new THREE.CylinderGeometry(1, 0.72, 1, 7);

export function FlowerReproductiveDetails({
  structure,
  density,
  centerRadius,
  centerHeight,
  spread,
  stamenLength,
  antherSize,
  stigmaSize,
  maturity,
  showPistil = true,
}: {
  structure: FlowerSpecies;
  density: number;
  centerRadius: number;
  centerHeight: number;
  spread: number;
  stamenLength: number;
  antherSize: number;
  stigmaSize: number;
  maturity: number;
  showPistil?: boolean;
}) {
  const lineDrawing = useFlowerStore((state) => state.renderMode === "line");
  const preset = useFlowerStore((state) => state.preset);
  const bloom = useFlowerStore((state) => state.bloom);
  const petalAge = useFlowerStore((state) => state.petalAge);
  const seed = useFlowerStore((state) => state.seed);
  const quality = useRenderQuality();
  const tuning = getHeroCenterTuning(
    preset,
    structure,
    structure.centerArchitecture ?? "simple",
  );
  const architecture = structure.centerArchitecture ?? "simple";
  const isColumn = architecture === "column";
  const isPoppy = preset === "Poppy";
  const isLily = preset === "Lily";
  const growth = getFlowerGrowthState(bloom, petalAge);
  const phaseTuning = getFlowerPhaseTuning(growth.phase);
  const maturityScale = THREE.MathUtils.clamp(
    maturity * phaseTuning.centerExposureScale,
    0,
    1,
  );
  const moisture = THREE.MathUtils.clamp(
    growth.moisture * phaseTuning.moistureScale,
    0,
    1,
  );
  const wilt = growth.wilt * phaseTuning.wiltScale;
  const filaments = useRef<THREE.InstancedMesh>(null);
  const anthers = useRef<THREE.InstancedMesh>(null);
  const antherGrooves = useRef<THREE.InstancedMesh>(null);
  const pollen = useRef<THREE.InstancedMesh>(null);
  const stigmaPapillae = useRef<THREE.InstancedMesh>(null);
  const ovaryRidges = useRef<THREE.InstancedMesh>(null);
  const stamenCount = Math.max(
    isColumn ? 2 : 2,
    Math.min(
      isColumn ? 4 : 90,
      Math.round(structure.stamenCount * density * tuning.stamenCountScale),
    ),
  );
  const antherLobesPerStamen = isColumn ? 1 : 2;
  const antherCount = stamenCount * antherLobesPerStamen;
  const filamentSegments = quality === "draft" || isColumn ? 1 : 2;
  const filamentCount = stamenCount * filamentSegments;
  const grainsPerAnther = quality === "draft" ? 1 : quality === "ultra" ? 5 : 3;
  const pollenPlacements = useMemo(
    () => createPollenClusterPlacements(stamenCount, grainsPerAnther, seed),
    [grainsPerAnther, seed, stamenCount],
  );
  const pollenCount = pollenPlacements.length;
  const polliniumEmergence = THREE.MathUtils.smoothstep(
    maturityScale,
    0.28,
    0.76,
  );

  useLayoutEffect(() => {
    if (
      !filaments.current ||
      !anthers.current ||
      !antherGrooves.current ||
      !pollen.current
    )
      return;
    const transform = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    const baseHeight = centerHeight * 0.52 + 0.08;

    for (let index = 0; index < stamenCount; index += 1) {
      const angle = (index / stamenCount) * Math.PI * 2;
      const alternating = isColumn
        ? 0.22 + index * 0.08
        : index % 2 === 0
          ? 0.72
          : 0.58;
      const radius = centerRadius * alternating * spread;
      const filamentHeight =
        (0.09 + (index % 3) * 0.012) *
        stamenLength *
        tuning.stamenLengthScale *
        THREE.MathUtils.lerp(0.18, 1, maturityScale) *
        THREE.MathUtils.lerp(1, 0.78, wilt);

      const filamentBase = new THREE.Vector3(
        isColumn
          ? index % 2 === 0
            ? -radius
            : radius
          : Math.cos(angle) * radius,
        baseHeight,
        isColumn
          ? -centerRadius * 0.02 + index * 0.012
          : Math.sin(angle) * radius,
      );
      const filamentTip = filamentBase
        .clone()
        .add(new THREE.Vector3(0, filamentHeight, 0))
        .add(
          new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(
            centerRadius *
              0.08 *
              tuning.filamentSpreadScale *
              THREE.MathUtils.lerp(0.22, 1, maturityScale),
          ),
        );
      const bowAmount =
        (isColumn ? 0.006 : centerRadius * 0.035 * tuning.filamentSpreadScale) *
        THREE.MathUtils.lerp(0.35, 1, maturityScale) *
        THREE.MathUtils.lerp(1, 1.2, wilt);
      const filamentMid = filamentBase
        .clone()
        .lerp(filamentTip, 0.52)
        .add(
          new THREE.Vector3(
            Math.cos(angle) * bowAmount,
            0,
            Math.sin(angle) * bowAmount,
          ),
        );
      const filamentPoints =
        filamentSegments === 1
          ? [filamentBase, filamentTip]
          : [filamentBase, filamentMid, filamentTip];

      for (
        let segmentIndex = 0;
        segmentIndex < filamentSegments;
        segmentIndex += 1
      ) {
        const start = filamentPoints[segmentIndex];
        const end = filamentPoints[segmentIndex + 1];
        const direction = end.clone().sub(start);
        transform.position.copy(start).add(end).multiplyScalar(0.5);
        transform.quaternion.setFromUnitVectors(
          up,
          direction.clone().normalize(),
        );
        transform.scale.set(
          isColumn ? 0.008 : 0.006,
          direction.length() * 1.035,
          isColumn ? 0.008 : 0.006,
        );
        transform.updateMatrix();
        filaments.current.setMatrixAt(
          index * filamentSegments + segmentIndex,
          transform.matrix,
        );
      }

      const antherCenter = filamentTip.clone();
      const seededLean =
        ((index % 3) - 1) * 0.008 * THREE.MathUtils.lerp(0.2, 1, maturityScale);
      antherCenter.add(
        new THREE.Vector3(
          Math.cos(angle) * seededLean,
          0,
          Math.sin(angle) * seededLean,
        ),
      );
      for (
        let lobeIndex = 0;
        lobeIndex < antherLobesPerStamen;
        lobeIndex += 1
      ) {
        const lobeSide =
          antherLobesPerStamen === 1 ? 0 : lobeIndex === 0 ? -1 : 1;
        const lobeSeparation =
          0.0075 * antherSize * tuning.antherSizeScale * lobeSide;
        transform.position
          .copy(antherCenter)
          .add(
            new THREE.Vector3(
              Math.cos(angle + Math.PI / 2) * lobeSeparation,
              lobeSide * 0.0015,
              Math.sin(angle + Math.PI / 2) * lobeSeparation,
            ),
          );
        transform.rotation.set(
          isColumn
            ? 0.38
            : isLily
              ? 0.08 + lobeSide * 0.025
              : 0.25 + lobeSide * 0.035,
          isColumn ? (index % 2 === 0 ? 0.34 : -0.34) : -angle,
          isLily ? 0.16 : Math.PI / 2,
        );
        transform.scale.set(
          (isColumn ? 0.012 : 0.0075) * antherSize * tuning.antherSizeScale,
          0.03 * antherSize * tuning.antherSizeScale,
          0.0075 * antherSize * tuning.antherSizeScale,
        );
        transform.updateMatrix();
        anthers.current.setMatrixAt(
          index * antherLobesPerStamen + lobeIndex,
          transform.matrix,
        );

        const grooveMaturity =
          THREE.MathUtils.smoothstep(maturityScale, 0.3, 0.82) *
          THREE.MathUtils.lerp(1, 0.72, wilt);
        transform.position.y += 0.0032 * antherSize * tuning.antherSizeScale;
        transform.scale.set(
          0.0022 * antherSize * tuning.antherSizeScale * grooveMaturity,
          0.027 * antherSize * tuning.antherSizeScale,
          0.002 * antherSize * tuning.antherSizeScale * grooveMaturity,
        );
        transform.updateMatrix();
        antherGrooves.current.setMatrixAt(
          index * antherLobesPerStamen + lobeIndex,
          transform.matrix,
        );
      }
    }

    pollenPlacements.forEach(({ stamenIndex, offset, scale }, pollenIndex) => {
      const angle = (stamenIndex / stamenCount) * Math.PI * 2;
      const alternating = isColumn
        ? 0.22 + stamenIndex * 0.08
        : stamenIndex % 2 === 0
          ? 0.72
          : 0.58;
      const radius = centerRadius * alternating * spread;
      const filamentHeight =
        (0.09 + (stamenIndex % 3) * 0.012) *
        stamenLength *
        tuning.stamenLengthScale *
        THREE.MathUtils.lerp(0.18, 1, maturityScale) *
        THREE.MathUtils.lerp(1, 0.78, wilt);
      const seededLean =
        ((stamenIndex % 3) - 1) *
        0.008 *
        THREE.MathUtils.lerp(0.2, 1, maturityScale);
      const tipSpread =
        centerRadius *
        0.08 *
        tuning.filamentSpreadScale *
        THREE.MathUtils.lerp(0.22, 1, maturityScale);
      transform.position
        .set(
          isColumn
            ? stamenIndex % 2 === 0
              ? -radius * 0.75
              : radius * 0.75
            : Math.cos(angle) * radius,
          baseHeight + filamentHeight,
          isColumn
            ? -centerRadius * 0.005 + stamenIndex * 0.01
            : Math.sin(angle) * radius,
        )
        .add(
          new THREE.Vector3(
            Math.cos(angle) * tipSpread,
            0,
            Math.sin(angle) * tipSpread,
          ),
        )
        .add(
          new THREE.Vector3(
            Math.cos(angle) * seededLean,
            0,
            Math.sin(angle) * seededLean,
          ),
        )
        .add(offset);
      transform.rotation.set(0, angle, 0);
      transform.scale.setScalar(
        0.0048 *
          scale *
          antherSize *
          tuning.antherSizeScale *
          THREE.MathUtils.smoothstep(maturityScale, 0.38, 0.9) *
          THREE.MathUtils.lerp(1, 0.72, wilt),
      );
      transform.updateMatrix();
      pollen.current?.setMatrixAt(pollenIndex, transform.matrix);
    });
    filaments.current.instanceMatrix.needsUpdate = true;
    anthers.current.instanceMatrix.needsUpdate = true;
    antherGrooves.current.instanceMatrix.needsUpdate = true;
    pollen.current.instanceMatrix.needsUpdate = true;
  }, [
    antherSize,
    antherLobesPerStamen,
    centerHeight,
    centerRadius,
    filamentSegments,
    isColumn,
    isLily,
    maturityScale,
    pollenPlacements,
    spread,
    stamenCount,
    stamenLength,
    tuning.antherSizeScale,
    tuning.filamentSpreadScale,
    tuning.stamenLengthScale,
    wilt,
  ]);

  const styleLength =
    (0.1 + centerHeight * 0.32) *
    stamenLength *
    THREE.MathUtils.lerp(0.2, 1, maturityScale) *
    THREE.MathUtils.lerp(1, 0.82, wilt) *
    (structure.styleLength ?? 1) *
    tuning.styleLengthScale;
  const ovaryScale = (structure.ovaryScale ?? 0.8) * tuning.ovaryScale;
  const ovaryGrowth =
    THREE.MathUtils.lerp(0.72, 1, maturityScale) *
    THREE.MathUtils.lerp(1, 1.04, wilt);
  const ovaryHeightGrowth =
    ovaryGrowth *
    (isPoppy
      ? THREE.MathUtils.lerp(
          1,
          1.68,
          THREE.MathUtils.smoothstep(wilt, 0.16, 0.86),
        )
      : 1);
  const ovaryY =
    structure.ovaryPosition === "inferior"
      ? -centerRadius * 0.24
      : centerHeight * 0.35;
  const styleBase = ovaryY + centerRadius * 0.16 * ovaryScale;
  const pistilHeight = styleBase + styleLength;
  const stigmaScale = THREE.MathUtils.lerp(1, 0.88, wilt);
  const papillaCount = quality === "draft" ? 4 : quality === "ultra" ? 18 : 10;
  const papillaMaturity =
    THREE.MathUtils.smoothstep(maturityScale, 0.28, 0.82) *
    THREE.MathUtils.lerp(1, 0.62, wilt);
  const stigmaColor = new THREE.Color(structure.stigmaColor).lerp(
    new THREE.Color("#8f7d52"),
    wilt * 0.55,
  );
  const antherGrooveColor = new THREE.Color(structure.antherColor)
    .lerp(new THREE.Color(structure.pollenColor ?? "#d9a43b"), 0.3)
    .multiplyScalar(0.62);
  const ovaryRidgeCount =
    quality === "draft"
      ? Math.min(3, structure.stigmaLobes)
      : Math.min(10, Math.max(3, structure.stigmaLobes));

  useLayoutEffect(() => {
    if (!ovaryRidges.current) return;
    const transform = new THREE.Object3D();
    const ovaryRadius =
      centerRadius * (isColumn ? 0.22 : 0.34) * ovaryScale * ovaryGrowth;
    const ovaryHeight =
      centerRadius * (isColumn ? 0.58 : 0.42) * ovaryScale * ovaryHeightGrowth;

    for (let index = 0; index < ovaryRidgeCount; index += 1) {
      const angle = (index / ovaryRidgeCount) * Math.PI * 2;
      transform.position.set(
        Math.cos(angle) * ovaryRadius * 0.94,
        ovaryY,
        Math.sin(angle) * ovaryRadius * 0.94,
      );
      transform.rotation.set(0, -angle, 0);
      transform.scale.set(
        Math.max(0.0035, ovaryRadius * 0.055),
        ovaryHeight * 0.72,
        Math.max(0.0025, ovaryRadius * 0.035),
      );
      transform.updateMatrix();
      ovaryRidges.current.setMatrixAt(index, transform.matrix);
    }
    ovaryRidges.current.instanceMatrix.needsUpdate = true;
  }, [
    centerRadius,
    isColumn,
    ovaryGrowth,
    ovaryHeightGrowth,
    ovaryRidgeCount,
    ovaryScale,
    ovaryY,
  ]);

  useLayoutEffect(() => {
    if (!stigmaPapillae.current) return;
    const transform = new THREE.Object3D();
    const headRadius =
      centerRadius *
      (isColumn ? 0.19 : isPoppy ? 0.28 : 0.135) *
      stigmaSize *
      stigmaScale;

    for (let index = 0; index < papillaCount; index += 1) {
      const progress = (index + 0.5) / papillaCount;
      const angle =
        index * 2.399963 + seededRandom(seed + index * 157 + 41) * 0.45;
      const radial = Math.sqrt(progress) * headRadius * 0.88;
      const dome = Math.sqrt(Math.max(0, 1 - (radial / headRadius) ** 2));
      transform.position.set(
        Math.cos(angle) * radial,
        pistilHeight +
          centerRadius *
            (isColumn ? 0.08 : isPoppy ? 0.038 : 0.105) *
            stigmaSize *
            dome,
        Math.sin(angle) * radial,
      );
      transform.rotation.set(0, -angle, 0);
      const individualScale = THREE.MathUtils.lerp(
        0.78,
        1.18,
        seededRandom(seed + index * 263 + 79),
      );
      transform.scale.set(
        0.0045 * individualScale * stigmaSize * papillaMaturity,
        0.009 * individualScale * stigmaSize * papillaMaturity,
        0.0045 * individualScale * stigmaSize * papillaMaturity,
      );
      transform.updateMatrix();
      stigmaPapillae.current.setMatrixAt(index, transform.matrix);
    }
    stigmaPapillae.current.instanceMatrix.needsUpdate = true;
  }, [
    centerRadius,
    isColumn,
    isPoppy,
    papillaCount,
    papillaMaturity,
    pistilHeight,
    seed,
    stigmaScale,
    stigmaSize,
  ]);

  return (
    <group>
      <instancedMesh
        ref={filaments}
        key={`filaments-${filamentCount}`}
        visible={!isColumn}
        dispose={null}
        args={[undefined, undefined, filamentCount]}
      >
        <primitive object={filamentGeometry} attach="geometry" />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : structure.filamentColor}
          roughness={THREE.MathUtils.lerp(0.9, 0.72, moisture)}
        />
      </instancedMesh>
      <instancedMesh
        ref={anthers}
        key={`anthers-${antherCount}`}
        visible={!isColumn}
        dispose={null}
        args={[undefined, undefined, antherCount]}
      >
        <primitive object={antherGeometry} attach="geometry" />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : structure.antherColor}
          roughness={THREE.MathUtils.lerp(0.96, 0.82, moisture)}
        />
      </instancedMesh>

      <instancedMesh
        ref={antherGrooves}
        key={`anther-grooves-${antherCount}`}
        visible={!lineDrawing && !isColumn}
        dispose={null}
        args={[undefined, undefined, antherCount]}
      >
        <primitive object={antherGrooveGeometry} attach="geometry" />
        <meshStandardMaterial color={antherGrooveColor} roughness={0.98} />
      </instancedMesh>

      <instancedMesh
        ref={pollen}
        key={`pollen-${pollenCount}`}
        visible={!isColumn}
        dispose={null}
        args={[undefined, undefined, pollenCount]}
      >
        <primitive object={pollenGeometry} attach="geometry" />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : (structure.pollenColor ?? "#d9a43b")}
          roughness={1}
        />
      </instancedMesh>

      <group visible={showPistil}>
        <mesh
          dispose={null}
          position={[0, ovaryY, 0]}
          scale={[
            centerRadius * (isColumn ? 0.22 : 0.34) * ovaryScale * ovaryGrowth,
            centerRadius *
              (isColumn ? 0.58 : 0.42) *
              ovaryScale *
              ovaryHeightGrowth,
            centerRadius * (isColumn ? 0.22 : 0.34) * ovaryScale * ovaryGrowth,
          ]}
        >
          <primitive object={ovaryGeometry} attach="geometry" />
          <meshStandardMaterial
            color={lineDrawing ? "#111111" : stigmaColor.getStyle()}
            roughness={THREE.MathUtils.lerp(0.93, 0.78, moisture)}
          />
        </mesh>

        {!lineDrawing && (
          <instancedMesh
            ref={ovaryRidges}
            key={`ovary-ridges-${ovaryRidgeCount}`}
            dispose={null}
            args={[undefined, undefined, ovaryRidgeCount]}
          >
            <primitive object={ovaryRidgeGeometry} attach="geometry" />
            <meshStandardMaterial
              color={stigmaColor.clone().multiplyScalar(0.82)}
              roughness={THREE.MathUtils.lerp(0.94, 0.8, moisture)}
            />
          </instancedMesh>
        )}

        <mesh
          dispose={null}
          position={[0, styleBase + styleLength * 0.5, 0]}
          scale={[
            centerRadius * (isColumn ? 0.08 : 0.04) * stigmaSize,
            styleLength * 0.5,
            centerRadius * (isColumn ? 0.08 : 0.04) * stigmaSize,
          ]}
        >
          <primitive
            object={isColumn ? columnGeometry : styleGeometry}
            attach="geometry"
          />
          <meshStandardMaterial
            color={lineDrawing ? "#111111" : stigmaColor.getStyle()}
            roughness={THREE.MathUtils.lerp(0.9, 0.7, moisture)}
          />
        </mesh>

        <mesh
          dispose={null}
          position={[0, pistilHeight - (isColumn ? 0.03 : 0.035), 0]}
          scale={[
            centerRadius *
              (isColumn ? 0.28 : isPoppy ? 0.42 : 0.2) *
              stigmaSize *
              stigmaScale,
            centerRadius *
              (isColumn ? 0.18 : isPoppy ? 0.055 : 0.144) *
              stigmaSize *
              stigmaScale,
            centerRadius *
              (isColumn ? 0.24 : isPoppy ? 0.42 : 0.2) *
              stigmaSize *
              stigmaScale,
          ]}
        >
          <primitive object={stigmaHeadGeometry} attach="geometry" />
          {lineDrawing ? (
            <meshBasicMaterial color="#ffffff" />
          ) : (
            <meshPhysicalMaterial
              color={structure.stigmaColor}
              roughness={THREE.MathUtils.lerp(0.92, 0.66, moisture)}
              specularIntensity={0.08}
              clearcoat={0.1 * moisture}
              clearcoatRoughness={0.42}
            />
          )}
          {lineDrawing && <Edges color="#111111" threshold={18} />}
        </mesh>

        {isColumn && (
          <group
            position={[
              0,
              pistilHeight + centerRadius * 0.065 * stigmaSize * stigmaScale,
              centerRadius * 0.055,
            ]}
            scale={[polliniumEmergence, polliniumEmergence, polliniumEmergence]}
          >
            {([-1, 1] as const).map((polliniumSide) => (
              <group
                key={`pollinium-${polliniumSide}`}
                position={[polliniumSide * centerRadius * 0.09, 0, 0]}
                rotation={[0.12, 0, polliniumSide * -0.1]}
              >
                <mesh
                  dispose={null}
                  scale={[
                    centerRadius * 0.055,
                    centerRadius * 0.115,
                    centerRadius * 0.052,
                  ]}
                >
                  <primitive object={polliniumGeometry} attach="geometry" />
                  {lineDrawing ? (
                    <meshBasicMaterial color="#ffffff" />
                  ) : (
                    <meshPhysicalMaterial
                      color={structure.pollenColor ?? "#e8c94d"}
                      roughness={THREE.MathUtils.lerp(0.86, 0.68, moisture)}
                      specularIntensity={0.1}
                      clearcoat={0.04 * moisture}
                      clearcoatRoughness={0.5}
                    />
                  )}
                  {lineDrawing && <Edges color="#111111" threshold={18} />}
                </mesh>
                <mesh
                  dispose={null}
                  position={[
                    -polliniumSide * centerRadius * 0.045,
                    -centerRadius * 0.095,
                    -centerRadius * 0.015,
                  ]}
                  rotation={[0, 0, polliniumSide * -0.42]}
                  scale={[
                    centerRadius * 0.014,
                    centerRadius * 0.09,
                    centerRadius * 0.014,
                  ]}
                >
                  <primitive
                    object={polliniumStalkGeometry}
                    attach="geometry"
                  />
                  <meshStandardMaterial
                    color={lineDrawing ? "#111111" : structure.filamentColor}
                    roughness={0.88}
                  />
                </mesh>
              </group>
            ))}
          </group>
        )}

        {!lineDrawing && (
          <instancedMesh
            ref={stigmaPapillae}
            key={`stigma-papillae-${papillaCount}`}
            dispose={null}
            args={[undefined, undefined, papillaCount]}
          >
            <primitive object={stigmaPapillaGeometry} attach="geometry" />
            <meshPhysicalMaterial
              color={stigmaColor.getStyle()}
              roughness={THREE.MathUtils.lerp(0.9, 0.62, moisture)}
              specularIntensity={0.12}
              clearcoat={0.08 * moisture}
              clearcoatRoughness={0.38}
            />
          </instancedMesh>
        )}

        {Array.from({ length: structure.stigmaLobes }, (_, index) => {
          const angle = (index / structure.stigmaLobes) * Math.PI * 2;
          const radius = centerRadius * (isPoppy ? 0.17 : 0.07) * stigmaSize;
          return (
            <mesh
              key={index}
              position={[
                isColumn
                  ? index % 2 === 0
                    ? -radius
                    : radius
                  : Math.cos(angle) * radius,
                pistilHeight + (isPoppy ? 0.012 : 0.025),
                isColumn ? index * 0.01 : Math.sin(angle) * radius,
              ]}
              rotation={[
                0,
                isColumn ? (index % 2 === 0 ? 0.5 : -0.5) : -angle,
                Math.PI / 2,
              ]}
              scale={[
                (isPoppy ? 0.008 : 0.01) * stigmaSize,
                centerRadius *
                  (isColumn ? 0.1 : isPoppy ? 0.17 : 0.08) *
                  stigmaSize,
                (isPoppy ? 0.01 : 0.014) * stigmaSize,
              ]}
            >
              <primitive object={stigmaLobeGeometry} attach="geometry" />
              <meshStandardMaterial
                color={lineDrawing ? "#111111" : stigmaColor.getStyle()}
                roughness={THREE.MathUtils.lerp(0.92, 0.72, moisture)}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
