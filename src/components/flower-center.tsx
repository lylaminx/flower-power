"use client";

import { Edges } from "@react-three/drei";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { FlowerSpecies } from "@/lib/flower-species";
import { FlowerReproductiveDetails } from "./flower-reproductive";
import { getBotanicalTexture } from "@/lib/botanical-textures";
import { useFlowerStore } from "@/lib/flower-store";

export function FlowerCenter({ structure }: { structure: FlowerSpecies }) {
  const settings = useFlowerStore();
  const centerColor = settings.centerColor;
  const lineDrawing = settings.renderMode === "line";
  const density = settings.centerDensity;
  const centerRadius = structure.centerRadius * settings.centerSize;
  const centerHeight = structure.centerHeight * settings.centerProfile;
  const floretCount = Math.max(
    8,
    Math.min(720, Math.round(structure.florets * density)),
  );
  const mesh = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new THREE.Object3D();
    const inner = new THREE.Color(structure.floretAccent);
    const outer = new THREE.Color(centerColor).multiplyScalar(0.86);

    for (let index = 0; index < floretCount; index += 1) {
      const progress = Math.sqrt(index / floretCount);
      const angle = index * 2.399963;
      const radius = progress * centerRadius * 0.92 * settings.centerSpread;
      transform.position.set(
        Math.cos(angle) * radius,
        0.1 + centerHeight * (1 - progress * progress),
        Math.sin(angle) * radius,
      );
      transform.rotation.set(0, -angle, 0);
      const densityScale = THREE.MathUtils.clamp(
        1 / Math.sqrt(density),
        0.72,
        1.35,
      );
      const size =
        THREE.MathUtils.lerp(0.035, 0.024, progress) *
        densityScale *
        settings.centerFloretSize;
      transform.scale.set(
        size,
        size * THREE.MathUtils.lerp(1.8, 1.15, progress),
        size,
      );
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
      mesh.current.setColorAt(index, inner.clone().lerp(outer, progress));
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
  }, [
    centerColor,
    centerHeight,
    centerRadius,
    density,
    floretCount,
    settings,
    structure,
  ]);

  return (
    <group>
      <mesh
        position={[0, centerHeight * 0.15, 0]}
        scale={[1, Math.max(0.22, centerHeight), 1]}
      >
        <sphereGeometry args={[centerRadius, 40, 18]} />
        {lineDrawing ? (
          <meshBasicMaterial color="#ffffff" />
        ) : (
          <meshStandardMaterial
            color={centerColor}
            roughness={1}
            metalness={0}
            bumpMap={getBotanicalTexture("center")}
            bumpScale={0.035}
          />
        )}
        {lineDrawing && <Edges color="#111111" threshold={18} />}
      </mesh>
      <instancedMesh
        ref={mesh}
        key={floretCount}
        args={[undefined, undefined, floretCount]}
      >
        <cylinderGeometry args={[0.68, 1, 1, 7]} />
        {lineDrawing ? (
          <meshBasicMaterial color="#111111" wireframe />
        ) : (
          <meshStandardMaterial vertexColors roughness={1} metalness={0} />
        )}
      </instancedMesh>
      <FlowerReproductiveDetails
        structure={structure}
        density={density}
        centerRadius={centerRadius}
        centerHeight={centerHeight}
        spread={settings.centerSpread}
        stamenLength={settings.centerStamenLength}
        antherSize={settings.centerAntherSize}
        stigmaSize={settings.centerStigmaSize}
      />
    </group>
  );
}
