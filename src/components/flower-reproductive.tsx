"use client";

import { Edges } from "@react-three/drei";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { FlowerSpecies } from "@/lib/flower-species";
import { getHeroCenterTuning } from "@/lib/flower-center-tuning";
import { getFlowerGrowthState, getFlowerPhaseTuning } from "@/lib/flower-growth";
import { useFlowerStore } from "@/lib/flower-store";

const filamentGeometry = new THREE.CylinderGeometry(1, 1, 1, 6);
const antherGeometry = new THREE.CapsuleGeometry(1, 1.4, 4, 8);
const pollenGeometry = new THREE.IcosahedronGeometry(1, 1);
const ovaryGeometry = new THREE.SphereGeometry(1, 18, 12);
const styleGeometry = new THREE.CylinderGeometry(1, 1, 1, 8);
const stigmaHeadGeometry = new THREE.SphereGeometry(1, 20, 12);
const stigmaLobeGeometry = new THREE.CapsuleGeometry(1, 1.1, 4, 7);
const columnGeometry = new THREE.CapsuleGeometry(1, 1.5, 5, 8);

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
}) {
  const lineDrawing = useFlowerStore((state) => state.renderMode === "line");
  const preset = useFlowerStore((state) => state.preset);
  const bloom = useFlowerStore((state) => state.bloom);
  const petalAge = useFlowerStore((state) => state.petalAge);
  const tuning = getHeroCenterTuning(
    preset,
    structure,
    structure.centerArchitecture ?? "simple",
  );
  const architecture = structure.centerArchitecture ?? "simple";
  const isColumn = architecture === "column";
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
  const pollen = useRef<THREE.InstancedMesh>(null);
  const stamenCount = Math.max(
    isColumn ? 2 : 2,
    Math.min(
      isColumn ? 4 : 90,
      Math.round(structure.stamenCount * density * tuning.stamenCountScale),
    ),
  );

  useLayoutEffect(() => {
    if (!filaments.current || !anthers.current || !pollen.current) return;
    const transform = new THREE.Object3D();
    const baseHeight = centerHeight * 0.52 + 0.08;

    for (let index = 0; index < stamenCount; index += 1) {
      const angle = (index / stamenCount) * Math.PI * 2;
      const alternating = isColumn ? 0.22 + index * 0.08 : index % 2 === 0 ? 0.72 : 0.58;
      const radius = centerRadius * alternating * spread;
      const filamentHeight =
        (0.09 + (index % 3) * 0.012) *
        stamenLength *
        tuning.stamenLengthScale *
        THREE.MathUtils.lerp(0.18, 1, maturityScale) * THREE.MathUtils.lerp(1, 0.78, wilt);

      transform.position.set(
        isColumn ? (index % 2 === 0 ? -radius : radius) : Math.cos(angle) * radius,
        baseHeight + filamentHeight * 0.5,
        isColumn ? -centerRadius * 0.02 + index * 0.012 : Math.sin(angle) * radius,
      );
      transform.rotation.set(
        isColumn ? 0.16 : 0,
        isColumn ? 0 : -angle,
        isColumn ? (index % 2 === 0 ? -0.45 : 0.45) : Math.sin(angle) * 0.1,
      );
      transform.scale.set(
        isColumn ? 0.008 : 0.006,
        filamentHeight,
        isColumn ? 0.008 : 0.006,
      );
      transform.updateMatrix();
      filaments.current.setMatrixAt(index, transform.matrix);

      transform.position.y = baseHeight + filamentHeight;
      transform.rotation.set(
        isColumn ? 0.38 : 0.25,
        isColumn ? (index % 2 === 0 ? 0.34 : -0.34) : -angle,
        Math.PI / 2,
      );
      transform.scale.set(
        0.012 * antherSize * tuning.antherSizeScale,
        0.03 * antherSize * tuning.antherSizeScale,
        0.009 * antherSize * tuning.antherSizeScale,
      );
      transform.updateMatrix();
      anthers.current.setMatrixAt(index, transform.matrix);

      transform.position.set(
        isColumn
          ? (index % 2 === 0 ? -radius * 0.75 : radius * 0.75)
          : Math.cos(angle) * radius + Math.cos(angle + 0.8) * 0.009,
        baseHeight + filamentHeight + 0.012,
        isColumn
          ? -centerRadius * 0.005 + index * 0.01
          : Math.sin(angle) * radius + Math.sin(angle + 0.8) * 0.009,
      );
      transform.rotation.set(0, 0, 0);
      transform.scale.setScalar(
        0.0075 *
          antherSize *
          tuning.antherSizeScale *
          THREE.MathUtils.smoothstep(maturityScale, 0.38, 0.9) *
          THREE.MathUtils.lerp(1, 0.72, wilt),
      );
      transform.updateMatrix();
      pollen.current.setMatrixAt(index, transform.matrix);
    }
    filaments.current.instanceMatrix.needsUpdate = true;
    anthers.current.instanceMatrix.needsUpdate = true;
    pollen.current.instanceMatrix.needsUpdate = true;
  }, [
    antherSize,
    centerHeight,
    centerRadius,
    spread,
    stamenCount,
    stamenLength,
    maturity,
  ]);

  const styleLength =
    (0.1 + centerHeight * 0.32) *
    stamenLength *
    THREE.MathUtils.lerp(0.2, 1, maturityScale) *
    THREE.MathUtils.lerp(1, 0.82, wilt) *
    (structure.styleLength ?? 1) *
    tuning.styleLengthScale;
  const ovaryScale = (structure.ovaryScale ?? 0.8) * tuning.ovaryScale;
  const ovaryY =
    structure.ovaryPosition === "inferior"
      ? -centerRadius * 0.24
      : centerHeight * 0.35;
  const styleBase = ovaryY + centerRadius * 0.16 * ovaryScale;
  const pistilHeight = styleBase + styleLength;
  const stigmaScale = THREE.MathUtils.lerp(1, 0.88, wilt);
  const stigmaColor = new THREE.Color(structure.stigmaColor).lerp(
    new THREE.Color("#8f7d52"),
    wilt * 0.55,
  );

  return (
    <group>
      <instancedMesh
        ref={filaments}
        key={`filaments-${stamenCount}`}
        dispose={null}
        args={[undefined, undefined, stamenCount]}
      >
        <primitive object={filamentGeometry} attach="geometry" />
        <meshBasicMaterial
          color={lineDrawing ? "#111111" : structure.filamentColor}
        />
      </instancedMesh>
      <instancedMesh
        ref={anthers}
        key={`anthers-${stamenCount}`}
        dispose={null}
        args={[undefined, undefined, stamenCount]}
      >
        <primitive object={antherGeometry} attach="geometry" />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : structure.antherColor}
          roughness={0.9}
        />
      </instancedMesh>

      <instancedMesh
        ref={pollen}
        key={`pollen-${stamenCount}`}
        dispose={null}
        args={[undefined, undefined, stamenCount]}
      >
        <primitive object={pollenGeometry} attach="geometry" />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : (structure.pollenColor ?? "#d9a43b")}
          roughness={1}
        />
      </instancedMesh>

      <mesh
        dispose={null}
        position={[0, ovaryY, 0]}
        scale={[
          centerRadius * (isColumn ? 0.22 : 0.34) * ovaryScale,
          centerRadius * (isColumn ? 0.58 : 0.42) * ovaryScale,
          centerRadius * (isColumn ? 0.22 : 0.34) * ovaryScale,
        ]}
      >
        <primitive object={ovaryGeometry} attach="geometry" />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : stigmaColor.getStyle()}
          roughness={0.88}
        />
      </mesh>

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
          roughness={0.82}
        />
      </mesh>

      <mesh
        dispose={null}
        position={[0, pistilHeight - (isColumn ? 0.03 : 0.035), 0]}
        scale={[
          centerRadius * (isColumn ? 0.28 : 0.2) * stigmaSize * stigmaScale,
          centerRadius * (isColumn ? 0.18 : 0.144) * stigmaSize * stigmaScale,
          centerRadius * (isColumn ? 0.24 : 0.2) * stigmaSize * stigmaScale,
        ]}
      >
        <primitive object={stigmaHeadGeometry} attach="geometry" />
        {lineDrawing ? (
          <meshBasicMaterial color="#ffffff" />
        ) : (
          <meshPhysicalMaterial
            color={structure.stigmaColor}
            roughness={0.83}
            specularIntensity={0.08}
            clearcoat={0}
          />
        )}
        {lineDrawing && <Edges color="#111111" threshold={18} />}
      </mesh>

      {Array.from({ length: structure.stigmaLobes }, (_, index) => {
        const angle = (index / structure.stigmaLobes) * Math.PI * 2;
        const radius = centerRadius * 0.07 * stigmaSize;
        return (
          <mesh
            key={index}
            position={[
              isColumn ? (index % 2 === 0 ? -radius : radius) : Math.cos(angle) * radius,
              pistilHeight + 0.025,
              isColumn ? index * 0.01 : Math.sin(angle) * radius,
            ]}
            rotation={[0, isColumn ? (index % 2 === 0 ? 0.5 : -0.5) : -angle, Math.PI / 2]}
            scale={[
              0.01 * stigmaSize,
              centerRadius * (isColumn ? 0.1 : 0.08) * stigmaSize,
              0.014 * stigmaSize,
            ]}
          >
            <primitive object={stigmaLobeGeometry} attach="geometry" />
            <meshStandardMaterial
              color={lineDrawing ? "#111111" : stigmaColor.getStyle()}
              roughness={0.86}
            />
          </mesh>
        );
      })}
    </group>
  );
}
