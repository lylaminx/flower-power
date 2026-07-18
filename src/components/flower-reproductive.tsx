"use client";

import { Edges } from "@react-three/drei";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { FlowerSpecies } from "@/lib/flower-species";
import { useFlowerStore } from "@/lib/flower-store";

export function FlowerReproductiveDetails({
  structure,
  density,
  centerRadius,
  centerHeight,
  spread,
  stamenLength,
  antherSize,
  stigmaSize,
}: {
  structure: FlowerSpecies;
  density: number;
  centerRadius: number;
  centerHeight: number;
  spread: number;
  stamenLength: number;
  antherSize: number;
  stigmaSize: number;
}) {
  const lineDrawing = useFlowerStore((state) => state.renderMode === "line");
  const filaments = useRef<THREE.InstancedMesh>(null);
  const anthers = useRef<THREE.InstancedMesh>(null);
  const stamenCount = Math.max(
    2,
    Math.min(90, Math.round(structure.stamenCount * density)),
  );

  useLayoutEffect(() => {
    if (!filaments.current || !anthers.current) return;
    const transform = new THREE.Object3D();
    const baseHeight = centerHeight * 0.52 + 0.08;

    for (let index = 0; index < stamenCount; index += 1) {
      const angle = (index / stamenCount) * Math.PI * 2;
      const alternating = index % 2 === 0 ? 0.72 : 0.58;
      const radius = centerRadius * alternating * spread;
      const filamentHeight = (0.09 + (index % 3) * 0.012) * stamenLength;

      transform.position.set(
        Math.cos(angle) * radius,
        baseHeight + filamentHeight * 0.5,
        Math.sin(angle) * radius,
      );
      transform.rotation.set(0, -angle, Math.sin(angle) * 0.1);
      transform.scale.set(0.006, filamentHeight, 0.006);
      transform.updateMatrix();
      filaments.current.setMatrixAt(index, transform.matrix);

      transform.position.y = baseHeight + filamentHeight;
      transform.rotation.set(0.25, -angle, Math.PI / 2);
      transform.scale.set(
        0.012 * antherSize,
        0.03 * antherSize,
        0.009 * antherSize,
      );
      transform.updateMatrix();
      anthers.current.setMatrixAt(index, transform.matrix);
    }
    filaments.current.instanceMatrix.needsUpdate = true;
    anthers.current.instanceMatrix.needsUpdate = true;
  }, [
    antherSize,
    centerHeight,
    centerRadius,
    spread,
    stamenCount,
    stamenLength,
  ]);

  const pistilHeight = centerHeight + 0.12 * stamenLength;

  return (
    <group>
      <instancedMesh
        ref={filaments}
        key={`filaments-${stamenCount}`}
        args={[undefined, undefined, stamenCount]}
      >
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshBasicMaterial
          color={lineDrawing ? "#111111" : structure.filamentColor}
        />
      </instancedMesh>
      <instancedMesh
        ref={anthers}
        key={`anthers-${stamenCount}`}
        args={[undefined, undefined, stamenCount]}
      >
        <capsuleGeometry args={[1, 1.4, 4, 8]} />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : structure.antherColor}
          roughness={0.9}
        />
      </instancedMesh>

      <mesh position={[0, pistilHeight - 0.035, 0]} scale={[1, 0.72, 1]}>
        <sphereGeometry args={[centerRadius * 0.2 * stigmaSize, 20, 12]} />
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
              Math.cos(angle) * radius,
              pistilHeight + 0.025,
              Math.sin(angle) * radius,
            ]}
            rotation={[0, -angle, Math.PI / 2]}
            scale={[
              0.01 * stigmaSize,
              centerRadius * 0.08 * stigmaSize,
              0.014 * stigmaSize,
            ]}
          >
            <capsuleGeometry args={[1, 1.1, 4, 7]} />
            <meshStandardMaterial
              color={lineDrawing ? "#111111" : structure.stigmaColor}
              roughness={0.86}
            />
          </mesh>
        );
      })}
    </group>
  );
}
