"use client";

import { Edges } from "@react-three/drei";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { getBotanicalTexture } from "@/lib/botanical-textures";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import type { StemTuning } from "@/lib/flower-stem-tuning";
import {
  createStemPricklePlacements,
  createStemSurfacePlacements,
  seededRandom,
} from "@/lib/flower-geometry";

const stemNodeSphereGeometry = new THREE.SphereGeometry(0.064, 16, 9);
const stemNodeConeGeometry = new THREE.ConeGeometry(1, 1, 7);
const stemScarGeometry = new THREE.SphereGeometry(1, 12, 8);
const stemBundleScarGeometry = new THREE.SphereGeometry(1, 6, 4);
const stemHairGeometry = new THREE.ConeGeometry(1, 1, 5);
const stemLenticelGeometry = new THREE.SphereGeometry(1, 7, 5);
const stemPrickleGeometry = new THREE.ConeGeometry(1, 1, 7);

export function FlowerStemDetails({
  curve,
  color,
  lineDrawing,
  hairiness,
  nodeCount,
  leafAttachments,
  seed,
  tuning,
}: {
  curve: THREE.CatmullRomCurve3;
  color: string;
  lineDrawing: boolean;
  hairiness: number;
  nodeCount: number;
  leafAttachments: Array<{
    side: 1 | -1;
    t: number;
    point: THREE.Vector3;
    tangent: THREE.Vector3;
  }>;
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
    const hairMesh = hairs.current;
    const lenticelMesh = lenticels.current;
    const transform = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);

    const hairPlacements = createStemSurfacePlacements(
      curve,
      hairCount,
      seed + 401,
      0.08,
      0.94 + tuning.stemNodeSpacingBias * 0.2,
    );
    hairPlacements.forEach(({ position, radial, scale }, index) => {
      transform.position
        .copy(position)
        .addScaledVector(radial, 0.055 * tuning.stemNodeBulgeScale);
      transform.quaternion.setFromUnitVectors(up, radial);
      transform.scale.set(
        0.0025 * scale,
        (0.035 + (index % 3) * 0.006) * tuning.stemHairinessScale * scale,
        0.0025 * scale,
      );
      transform.updateMatrix();
      hairMesh.setMatrixAt(index, transform.matrix);
    });
    hairMesh.instanceMatrix.needsUpdate = true;

    const lenticelPlacements = createStemSurfacePlacements(
      curve,
      lenticelCount,
      seed + 809,
      0.12,
      0.9 + tuning.stemNodeSpacingBias * 0.16,
    );
    lenticelPlacements.forEach(
      ({ position, radial, tangent, scale }, index) => {
        transform.position
          .copy(position)
          .addScaledVector(radial, 0.057 * tuning.stemNodeBulgeScale);
        transform.quaternion.setFromUnitVectors(up, radial);
        transform.rotateOnAxis(up, Math.atan2(tangent.z, tangent.x));
        transform.scale.set(
          (0.009 + (index % 3) * 0.002) * tuning.stemLenticelScale * scale,
          0.003,
          0.005 * scale,
        );
        transform.updateMatrix();
        lenticelMesh.setMatrixAt(index, transform.matrix);
      },
    );
    lenticelMesh.instanceMatrix.needsUpdate = true;

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
    return {
      point: curve.getPointAt(t),
      frame: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        curve.getTangentAt(t).normalize(),
      ),
    };
  });
  const nodeColor = new THREE.Color(color).multiplyScalar(0.82);
  const scarColor = new THREE.Color(color)
    .lerp(new THREE.Color("#8a7351"), 0.42)
    .multiplyScalar(0.78);
  const bundleScarColor = scarColor.clone().multiplyScalar(0.58);
  const shootAttachments =
    tuning.secondaryShootCount > 0
      ? leafAttachments
          .filter((attachment) => attachment.side > 0)
          .slice(-tuning.secondaryShootCount)
      : [];
  const secondaryShoots = shootAttachments.map((attachment, index) => {
    const frame = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      attachment.tangent,
    );
    const outward = new THREE.Vector3(attachment.side, 0, 0)
      .applyQuaternion(frame)
      .normalize();
    const shootScale =
      tuning.secondaryShootScale *
      THREE.MathUtils.lerp(
        0.88,
        1.12,
        seededRandom(seed + attachment.t * 2081 + index * 313),
      );
    const path = new THREE.CatmullRomCurve3([
      attachment.point.clone(),
      attachment.point
        .clone()
        .addScaledVector(outward, 0.12 * shootScale)
        .addScaledVector(attachment.tangent, 0.08 * shootScale),
      attachment.point
        .clone()
        .addScaledVector(outward, 0.31 * shootScale)
        .addScaledVector(attachment.tangent, 0.25 * shootScale),
      attachment.point
        .clone()
        .addScaledVector(outward, 0.44 * shootScale)
        .addScaledVector(attachment.tangent, 0.46 * shootScale),
    ]);
    return {
      path,
      tip: path.getPointAt(1),
      tangent: path.getTangentAt(1).normalize(),
      scale: shootScale,
    };
  });

  return (
    <group>
      {secondaryShoots.map((shoot, index) => (
        <group key={`secondary-shoot-${index}`}>
          <mesh>
            <tubeGeometry
              args={[
                shoot.path,
                quality === "draft" ? 10 : quality === "ultra" ? 24 : 16,
                0.018 * shoot.scale,
                quality === "draft" ? 5 : 7,
                false,
              ]}
            />
            {lineDrawing ? (
              <meshBasicMaterial color="#ffffff" />
            ) : (
              <meshStandardMaterial
                color={color}
                roughness={0.86}
                bumpMap={getBotanicalTexture("stem", textureResolution)}
                bumpScale={0.018}
              />
            )}
            {lineDrawing && <Edges color="#111111" threshold={18} />}
          </mesh>
          <mesh
            position={shoot.tip}
            quaternion={new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              shoot.tangent,
            )}
            scale={[
              0.028 * shoot.scale,
              0.09 * shoot.scale,
              0.028 * shoot.scale,
            ]}
          >
            <primitive object={stemNodeConeGeometry} attach="geometry" />
            <meshStandardMaterial
              color={lineDrawing ? "#ffffff" : color}
              roughness={0.88}
            />
            {lineDrawing && <Edges color="#111111" threshold={18} />}
          </mesh>
        </group>
      ))}
      {nodes.map(({ point, frame }, index) => (
        <group key={index} position={point} quaternion={frame}>
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
          <group
            position={[index % 2 === 0 ? 0.061 : -0.061, -0.022, 0.012]}
            rotation={[0, 0, index % 2 === 0 ? -0.1 : 0.1]}
          >
            <mesh
              dispose={null}
              scale={[
                0.006,
                0.025 * tuning.stemNodeBulgeScale,
                0.038 * tuning.stemNodeBulgeScale,
              ]}
            >
              <primitive object={stemScarGeometry} attach="geometry" />
              {lineDrawing ? (
                <meshBasicMaterial color="#ffffff" />
              ) : (
                <meshStandardMaterial color={scarColor} roughness={0.96} />
              )}
              {lineDrawing && <Edges color="#111111" threshold={18} />}
            </mesh>
            {!lineDrawing &&
              [-1, 0, 1].map((bundleIndex) => (
                <mesh
                  key={bundleIndex}
                  dispose={null}
                  position={[
                    index % 2 === 0 ? 0.0065 : -0.0065,
                    bundleIndex === 0 ? -0.006 : 0.004,
                    bundleIndex * 0.013,
                  ]}
                  scale={[0.003, 0.004, 0.004]}
                >
                  <primitive
                    object={stemBundleScarGeometry}
                    attach="geometry"
                  />
                  <meshStandardMaterial color={bundleScarColor} roughness={1} />
                </mesh>
              ))}
          </group>
        </group>
      ))}
      {leafAttachments.map((attachment) => {
        const frame = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          attachment.tangent,
        );
        const variation = THREE.MathUtils.lerp(
          0.82,
          1.16,
          seededRandom(seed + attachment.t * 1703 + attachment.side * 97),
        );
        const budScale = tuning.axillaryBudScale * variation;
        return (
          <group
            key={`attachment-${attachment.side}-${attachment.t}`}
            position={attachment.point}
            quaternion={frame}
          >
            <mesh
              dispose={null}
              position={[attachment.side * 0.045, 0.002, 0]}
              scale={[0.82, 0.38, 1.04]}
            >
              <primitive object={stemNodeSphereGeometry} attach="geometry" />
              {lineDrawing ? (
                <meshBasicMaterial color="#ffffff" />
              ) : (
                <meshStandardMaterial
                  color={nodeColor}
                  roughness={0.84}
                  bumpMap={getBotanicalTexture("stem", textureResolution)}
                  bumpScale={0.018}
                />
              )}
              {lineDrawing && <Edges color="#111111" threshold={18} />}
            </mesh>
            {budScale > 0 && (
              <mesh
                dispose={null}
                position={[
                  attachment.side * (0.07 + budScale * 0.012),
                  0.05 * budScale,
                  0.012,
                ]}
                rotation={[
                  0.12,
                  attachment.side * 0.16,
                  attachment.side * -0.62,
                ]}
                scale={[0.026 * budScale, 0.085 * budScale, 0.026 * budScale]}
              >
                <primitive object={stemNodeConeGeometry} attach="geometry" />
                <meshStandardMaterial
                  color={lineDrawing ? "#ffffff" : color}
                  roughness={0.88}
                />
                {lineDrawing && <Edges color="#111111" threshold={18} />}
              </mesh>
            )}
          </group>
        );
      })}
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
