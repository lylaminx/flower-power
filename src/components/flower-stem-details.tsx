"use client";

import { Edges } from "@react-three/drei";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { getBotanicalTexture } from "@/lib/botanical-textures";

export function FlowerStemDetails({
  curve,
  color,
  lineDrawing,
  hairiness,
  nodeCount,
}: {
  curve: THREE.CatmullRomCurve3;
  color: string;
  lineDrawing: boolean;
  hairiness: number;
  nodeCount: number;
}) {
  const hairs = useRef<THREE.InstancedMesh>(null);
  const lenticels = useRef<THREE.InstancedMesh>(null);
  const hairCount = Math.max(1, Math.round(28 * hairiness));
  const lenticelCount = 22;

  useLayoutEffect(() => {
    if (lineDrawing) return;
    if (!hairs.current || !lenticels.current) return;
    const transform = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);

    for (let index = 0; index < hairCount; index += 1) {
      const t = 0.08 + (index / hairCount) * 0.86;
      const point = curve.getPointAt(t);
      const angle = index * 2.399963;
      const outward = new THREE.Vector3(
        Math.cos(angle),
        0.3,
        Math.sin(angle),
      ).normalize();
      transform.position.copy(point).addScaledVector(outward, 0.055);
      transform.quaternion.setFromUnitVectors(up, outward);
      transform.scale.set(0.0025, 0.035 + (index % 3) * 0.006, 0.0025);
      transform.updateMatrix();
      hairs.current.setMatrixAt(index, transform.matrix);
    }
    hairs.current.instanceMatrix.needsUpdate = true;

    for (let index = 0; index < lenticelCount; index += 1) {
      const t = 0.12 + (index / lenticelCount) * 0.78;
      const point = curve.getPointAt(t);
      const angle = index * 3.88322;
      const outward = new THREE.Vector3(
        Math.cos(angle),
        0,
        Math.sin(angle),
      ).normalize();
      transform.position.copy(point).addScaledVector(outward, 0.057);
      transform.quaternion.setFromUnitVectors(up, outward);
      transform.scale.set(0.009 + (index % 3) * 0.002, 0.003, 0.005);
      transform.updateMatrix();
      lenticels.current.setMatrixAt(index, transform.matrix);
    }
    lenticels.current.instanceMatrix.needsUpdate = true;
  }, [curve, hairCount, lineDrawing]);

  const nodes = Array.from({ length: nodeCount }, (_, index) =>
    curve.getPointAt(0.3 + ((index + 1) / (nodeCount + 1)) * 0.42),
  );
  const nodeColor = new THREE.Color(color).multiplyScalar(0.82);

  return (
    <group>
      {nodes.map((point, index) => (
        <group key={index} position={point}>
          <mesh scale={[1.45, 0.72, 1.45]}>
            <sphereGeometry args={[0.064, 16, 9]} />
            {lineDrawing ? (
              <meshBasicMaterial color="#ffffff" />
            ) : (
              <meshStandardMaterial
                color={nodeColor}
                roughness={0.82}
                bumpMap={getBotanicalTexture("stem")}
                bumpScale={0.025}
              />
            )}
          </mesh>
          <mesh
            position={[index % 2 === 0 ? 0.07 : -0.07, 0.055, 0.015]}
            rotation={[0.2, 0, index % 2 === 0 ? -0.55 : 0.55]}
            scale={[0.032, 0.095, 0.032]}
          >
            <coneGeometry args={[1, 1, 7]} />
            <meshStandardMaterial
              color={lineDrawing ? "#ffffff" : color}
              roughness={0.86}
            />
            {lineDrawing && <Edges color="#111111" threshold={18} />}
          </mesh>
        </group>
      ))}
      {!lineDrawing && (
        <>
          <instancedMesh
            ref={hairs}
            args={[undefined, undefined, hairCount]}
            visible={hairiness > 0}
          >
            <coneGeometry args={[1, 1, 5]} />
            <meshBasicMaterial
              color="#d5ddcd"
              transparent
              opacity={0.38}
              depthWrite={false}
            />
          </instancedMesh>
          <instancedMesh
            ref={lenticels}
            args={[undefined, undefined, lenticelCount]}
          >
            <sphereGeometry args={[1, 7, 5]} />
            <meshStandardMaterial color={nodeColor} roughness={0.94} />
          </instancedMesh>
        </>
      )}
    </group>
  );
}
