"use client";

import { Edges } from "@react-three/drei";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { getBotanicalTexture } from "@/lib/botanical-textures";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import type { StemTuning } from "@/lib/flower-stem-tuning";
import { createStemPricklePlacements } from "@/lib/flower-geometry";

const stemNodeSphereGeometry = new THREE.SphereGeometry(0.064, 16, 9);
const stemNodeConeGeometry = new THREE.ConeGeometry(1, 1, 7);
const stemHairGeometry = new THREE.ConeGeometry(1, 1, 5);
const stemLenticelGeometry = new THREE.SphereGeometry(1, 7, 5);
const stemPrickleGeometry = new THREE.ConeGeometry(1, 1, 7);

export function FlowerStemDetails({
  curve,
  color,
  lineDrawing,
  hairiness,
  nodeCount,
  seed,
  tuning,
}: {
  curve: THREE.CatmullRomCurve3;
  color: string;
  lineDrawing: boolean;
  hairiness: number;
  nodeCount: number;
  seed: number;
  tuning: StemTuning;
}) {
  const quality = useRenderQuality();
  const textureResolution = getTextureResolution(quality);
  const hairs = useRef<THREE.InstancedMesh>(null);
  const lenticels = useRef<THREE.InstancedMesh>(null);
  const prickles = useRef<THREE.InstancedMesh>(null);
  const hairCount = Math.max(
    1,
    Math.round(28 * hairiness * tuning.stemHairinessScale),
  );
  const lenticelCount = Math.max(8, Math.round(22 * tuning.stemLenticelScale));
  const prickleCount = Math.round(
    11 *
      tuning.prickleDensity *
      (quality === "draft" ? 0.55 : quality === "ultra" ? 1.25 : 1),
  );

  useLayoutEffect(() => {
    if (lineDrawing) return;
    if (!hairs.current || !lenticels.current) return;
    const transform = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);

    for (let index = 0; index < hairCount; index += 1) {
      const t =
        0.08 + (index / hairCount) * (0.86 + tuning.stemNodeSpacingBias * 0.45);
      const point = curve.getPointAt(t);
      const angle = index * 2.399963;
      const outward = new THREE.Vector3(
        Math.cos(angle),
        0.3,
        Math.sin(angle),
      ).normalize();
      transform.position
        .copy(point)
        .addScaledVector(outward, 0.055 * tuning.stemNodeBulgeScale);
      transform.quaternion.setFromUnitVectors(up, outward);
      transform.scale.set(
        0.0025,
        (0.035 + (index % 3) * 0.006) * tuning.stemHairinessScale,
        0.0025,
      );
      transform.updateMatrix();
      hairs.current.setMatrixAt(index, transform.matrix);
    }
    hairs.current.instanceMatrix.needsUpdate = true;

    for (let index = 0; index < lenticelCount; index += 1) {
      const t =
        0.12 +
        (index / lenticelCount) * (0.78 + tuning.stemNodeSpacingBias * 0.32);
      const point = curve.getPointAt(t);
      const angle = index * 3.88322;
      const outward = new THREE.Vector3(
        Math.cos(angle),
        0,
        Math.sin(angle),
      ).normalize();
      transform.position
        .copy(point)
        .addScaledVector(outward, 0.057 * tuning.stemNodeBulgeScale);
      transform.quaternion.setFromUnitVectors(up, outward);
      transform.scale.set(
        (0.009 + (index % 3) * 0.002) * tuning.stemLenticelScale,
        0.003,
        0.005,
      );
      transform.updateMatrix();
      lenticels.current.setMatrixAt(index, transform.matrix);
    }
    lenticels.current.instanceMatrix.needsUpdate = true;

    if (prickles.current) {
      const placements = createStemPricklePlacements(curve, prickleCount, seed);
      placements.forEach((placement, index) => {
        transform.position.copy(placement.position);
        transform.quaternion.setFromUnitVectors(up, placement.direction);
        transform.scale.set(
          0.026 * placement.scale * tuning.prickleSizeScale,
          0.16 * placement.scale * tuning.prickleSizeScale,
          0.026 * placement.scale * tuning.prickleSizeScale,
        );
        transform.updateMatrix();
        prickles.current?.setMatrixAt(index, transform.matrix);
      });
      prickles.current.instanceMatrix.needsUpdate = true;
    }
  }, [
    curve,
    hairCount,
    lenticelCount,
    lineDrawing,
    prickleCount,
    seed,
    tuning,
  ]);

  const adjustedNodeCount = Math.max(
    0,
    Math.round(nodeCount * tuning.stemNodeCountScale),
  );
  const nodes = Array.from({ length: adjustedNodeCount }, (_, index) => {
    const t =
      0.3 +
      ((index + 1) / (adjustedNodeCount + 1)) *
        (0.42 + tuning.stemNodeSpacingBias * 0.2);
    return curve.getPointAt(t);
  });
  const nodeColor = new THREE.Color(color).multiplyScalar(0.82);

  return (
    <group>
      {nodes.map((point, index) => (
        <group key={index} position={point}>
          <mesh
            dispose={null}
            scale={[
              1.45 * tuning.stemNodeBulgeScale,
              0.72 * tuning.stemNodeBulgeScale,
              1.45 * tuning.stemNodeBulgeScale,
            ]}
          >
            <primitive object={stemNodeSphereGeometry} attach="geometry" />
            {lineDrawing ? (
              <meshBasicMaterial color="#ffffff" />
            ) : (
              <meshStandardMaterial
                color={nodeColor}
                roughness={0.82}
                bumpMap={getBotanicalTexture("stem", textureResolution)}
                bumpScale={0.025}
              />
            )}
          </mesh>
          <mesh
            dispose={null}
            position={[index % 2 === 0 ? 0.07 : -0.07, 0.055, 0.015]}
            rotation={[0.2, 0, index % 2 === 0 ? -0.55 : 0.55]}
            scale={[
              0.032 * tuning.stemNodeBulgeScale,
              0.095 * tuning.stemNodeBulgeScale,
              0.032 * tuning.stemNodeBulgeScale,
            ]}
          >
            <primitive object={stemNodeConeGeometry} attach="geometry" />
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
            dispose={null}
            args={[undefined, undefined, hairCount]}
            visible={hairiness > 0}
          >
            <primitive object={stemHairGeometry} attach="geometry" />
            <meshBasicMaterial
              color="#d5ddcd"
              transparent
              opacity={0.38}
              depthWrite={false}
            />
          </instancedMesh>
          <instancedMesh
            ref={lenticels}
            dispose={null}
            args={[undefined, undefined, lenticelCount]}
          >
            <primitive object={stemLenticelGeometry} attach="geometry" />
            <meshStandardMaterial color={nodeColor} roughness={0.94} />
          </instancedMesh>
          {prickleCount > 0 && (
            <instancedMesh
              ref={prickles}
              dispose={null}
              args={[undefined, undefined, prickleCount]}
            >
              <primitive object={stemPrickleGeometry} attach="geometry" />
              <meshStandardMaterial
                color={nodeColor.clone().multiplyScalar(0.72)}
                roughness={0.9}
              />
            </instancedMesh>
          )}
        </>
      )}
    </group>
  );
}
