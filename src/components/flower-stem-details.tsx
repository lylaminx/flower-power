"use client";

import { Edges } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  type BotanicalMaterialVariant,
  getBotanicalMaterialTexture,
  getBotanicalTexture,
} from "@/lib/botanical-textures";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import {
  getSecondaryShootControlOffsets,
  getRoseBasalCaneControlOffsets,
  getSecondaryShootAzimuthOffset,
  getSecondaryShootHairCount,
  getSecondaryShootPrickleCount,
  getSecondaryShootLeafCount,
  getSecondaryShootMaterialVariant,
  getLeafAttachmentFrame,
  getLeafAttachmentSwelling,
  getStemNodeVariation,
  type StemTuning,
} from "@/lib/flower-stem-tuning";
import {
  createLeafAttachments,
  createOrchidSpikeBractGeometry,
  createPetioleGeometry,
  createRosePrickleGeometry,
  createStemPricklePlacements,
  createStemSurfacePlacements,
  seededRandom,
} from "@/lib/flower-geometry";
import { FlowerLeaf } from "./flower-leaf";
import {
  createPoppyBudGeometry,
  createPoppyBudHairPlacements,
} from "@/lib/poppy-bud";

const stemNodeSphereGeometry = new THREE.SphereGeometry(0.064, 16, 9);
const stemNodeConeGeometry = new THREE.ConeGeometry(1, 1, 7);
const vegetativeBudGeometry = new THREE.SphereGeometry(1, 12, 8);
const stemScarGeometry = new THREE.SphereGeometry(1, 12, 8);
const stemBundleScarGeometry = new THREE.SphereGeometry(1, 6, 4);
const stemHairGeometry = new THREE.ConeGeometry(1, 1, 5);
const stemLenticelGeometry = new THREE.SphereGeometry(1, 7, 5);
const stemPrickleGeometry = createRosePrickleGeometry();
const orchidSpikeBractGeometry = createOrchidSpikeBractGeometry();
const poppyBudGeometry = createPoppyBudGeometry();
const poppyBudHairGeometry = new THREE.ConeGeometry(1, 1, 5);

function SecondaryShootPrickles({
  path,
  count,
  seed,
  shootScale,
  prickleScale,
  color,
}: {
  path: THREE.CatmullRomCurve3;
  count: number;
  seed: number;
  shootScale: number;
  prickleScale: number;
  color: THREE.Color;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    createStemPricklePlacements(path, count, seed, 0.018 * shootScale).forEach(
      (placement, index) => {
        transform.position.copy(placement.position);
        transform.quaternion.setFromUnitVectors(up, placement.direction);
        transform.scale.set(
          0.014 * placement.scale * prickleScale,
          0.075 * placement.scale * prickleScale,
          0.014 * placement.scale * prickleScale,
        );
        transform.updateMatrix();
        mesh.current?.setMatrixAt(index, transform.matrix);
      },
    );
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [count, path, prickleScale, seed, shootScale]);

  if (count === 0) return null;
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <primitive object={stemPrickleGeometry} attach="geometry" />
      <meshStandardMaterial color={color} roughness={0.88} />
    </instancedMesh>
  );
}

export function FlowerStemDetails({
  curve,
  color,
  lineDrawing,
  hairiness,
  nodeCount,
  leafAttachments,
  seed,
  tuning,
  materialVariant,
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
    azimuth?: number;
  }>;
  seed: number;
  tuning: StemTuning;
  materialVariant: BotanicalMaterialVariant;
}) {
  const quality = useRenderQuality();
  const textureResolution = getTextureResolution(quality);
  const hairs = useRef<THREE.InstancedMesh>(null);
  const lenticels = useRef<THREE.InstancedMesh>(null);
  const prickles = useRef<THREE.InstancedMesh>(null);
  const poppyBudHairs = useMemo(
    () => createPoppyBudHairPlacements(seed + 5_903),
    [seed],
  );
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
    const variation = getStemNodeVariation(
      seed,
      index,
      tuning.stemNodeIrregularity,
    );
    const t = THREE.MathUtils.clamp(
      0.3 +
        ((index + 1) / (adjustedNodeCount + 1)) *
          (0.42 + tuning.stemNodeSpacingBias * 0.2) +
        variation.spacingOffset,
      0.28,
      0.76,
    );
    const frame = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      curve.getTangentAt(t).normalize(),
    );
    frame.multiply(
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        variation.azimuth,
      ),
    );
    return {
      point: curve.getPointAt(t),
      frame,
      variation,
    };
  });
  const nodeColor = new THREE.Color(color).multiplyScalar(0.82);
  const scarColor = new THREE.Color(color)
    .lerp(new THREE.Color("#8a7351"), 0.42)
    .multiplyScalar(0.78);
  const bundleScarColor = scarColor.clone().multiplyScalar(0.58);
  const shootPool =
    materialVariant === "woody"
      ? leafAttachments
      : leafAttachments.filter((attachment) => attachment.side > 0);
  const shootAttachments =
    tuning.secondaryShootCount > 0
      ? tuning.secondaryShootCount >= 2 && materialVariant === "woody"
        ? [
            shootPool[0],
            ...shootPool.slice(-(tuning.secondaryShootCount - 1)),
          ].filter(Boolean)
        : shootPool.slice(-tuning.secondaryShootCount)
      : [];
  const secondaryShoots = shootAttachments.map((attachmentSeed, index) => {
    // Rose uses both of its existing vegetative shoots as basal canes. This
    // creates a three-cane young sucker (including the flowering parent) at the
    // same geometry budget as the former basal-plus-crown arrangement.
    const roseBasalT = index === 0 ? 0.018 : 0.038;
    const attachment =
      materialVariant === "woody"
        ? {
            ...attachmentSeed,
            side: (index % 2 === 0 ? -1 : 1) as -1 | 1,
            t: roseBasalT,
            point: curve.getPointAt(roseBasalT),
            tangent: curve.getTangentAt(roseBasalT).normalize(),
          }
        : attachmentSeed;
    const frame = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      attachment.tangent,
    );
    const outward = new THREE.Vector3(attachment.side, 0, 0)
      .applyQuaternion(frame)
      .applyAxisAngle(
        attachment.tangent,
        getSecondaryShootAzimuthOffset(tuning.secondaryShootBudKind),
      )
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
      ...(materialVariant === "woody"
        ? getRoseBasalCaneControlOffsets(shootScale, index)
        : getSecondaryShootControlOffsets(
            tuning.secondaryShootBudKind,
            shootScale,
          )
      ).map(({ outward: outwardOffset, upward }) =>
        attachment.point
          .clone()
          .addScaledVector(outward, outwardOffset)
          .addScaledVector(attachment.tangent, upward),
      ),
    ]);
    const shootHairCount = getSecondaryShootHairCount(
      tuning.secondaryShootBudKind,
      materialVariant,
    );
    const shootPrickleCount = getSecondaryShootPrickleCount(
      materialVariant,
      quality,
    );
    const shootLeafCount = getSecondaryShootLeafCount(materialVariant);
    return {
      path,
      tip: path.getPointAt(1),
      tangent: path.getTangentAt(1).normalize(),
      scale: shootScale,
      hairPlacements: createStemSurfacePlacements(
        path,
        shootHairCount,
        seed + index * 887 + 6_307,
        0.14,
        0.9,
      ),
      prickleCount: shootPrickleCount,
      leafAttachments: createLeafAttachments(
        path,
        shootLeafCount,
        0.3,
        0.78,
        "alternate",
      ),
    };
  });
  const secondaryShootMaterialVariant = getSecondaryShootMaterialVariant(
    tuning.secondaryShootBudKind,
    materialVariant,
  );
  const detailNormalScale = [
    "aquatic",
    "glaucous",
    "monocot",
    "spike",
  ].includes(materialVariant)
    ? 0.1
    : 0.14;
  const detailBumpScale = detailNormalScale === 0.1 ? 0.012 : 0.018;

  return (
    <group>
      {secondaryShoots.map((shoot, index) => (
        <group key={`secondary-shoot-${index}`}>
          <mesh>
            <primitive
              object={createPetioleGeometry(
                shoot.path,
                0.019 * shoot.scale,
                0.011 * shoot.scale,
                0,
                quality === "draft" ? 10 : quality === "ultra" ? 24 : 16,
                quality === "draft" ? 5 : 7,
              )}
              attach="geometry"
            />
            {lineDrawing ? (
              <meshBasicMaterial color="#ffffff" />
            ) : (
              <meshStandardMaterial
                color={color}
                vertexColors
                roughness={materialVariant === "woody" ? 0.83 : 0.86}
                bumpMap={getBotanicalTexture("stem", textureResolution)}
                bumpScale={
                  secondaryShootMaterialVariant === "glaucous" ? 0.014 : 0.018
                }
                normalMap={getBotanicalMaterialTexture(
                  "stem",
                  "microNormal",
                  textureResolution,
                  secondaryShootMaterialVariant,
                )}
                normalScale={new THREE.Vector2(0.12, 0.12)}
                roughnessMap={getBotanicalMaterialTexture(
                  "stem",
                  "roughness",
                  textureResolution,
                  secondaryShootMaterialVariant,
                )}
              />
            )}
            {lineDrawing && <Edges color="#111111" threshold={18} />}
          </mesh>
          {!lineDrawing &&
            shoot.hairPlacements.map(
              ({ position, radial, scale }, hairIndex) => (
                <mesh
                  key={`shoot-hair-${hairIndex}`}
                  position={position
                    .clone()
                    .addScaledVector(radial, 0.026 * shoot.scale)}
                  quaternion={new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    radial,
                  )}
                  scale={[
                    0.0018 * scale,
                    0.022 * scale * shoot.scale,
                    0.0018 * scale,
                  ]}
                >
                  <primitive object={stemHairGeometry} attach="geometry" />
                  <meshBasicMaterial
                    color="#d5ddcd"
                    transparent
                    opacity={0.34}
                    depthWrite={false}
                  />
                </mesh>
              ),
            )}
          {!lineDrawing && (
            <SecondaryShootPrickles
              path={shoot.path}
              count={shoot.prickleCount}
              seed={seed + index * 1_103 + 7_211}
              shootScale={shoot.scale}
              prickleScale={tuning.prickleSizeScale}
              color={nodeColor.clone().multiplyScalar(0.82)}
            />
          )}
          {shoot.leafAttachments.map((leafAttachment, leafIndex) => (
            <FlowerLeaf
              key={`secondary-leaf-${leafIndex}`}
              side={leafAttachment.side}
              attachment={leafAttachment.point}
              stemTangent={leafAttachment.tangent}
              attachmentT={THREE.MathUtils.clamp(
                leafAttachment.t + index * 0.013,
                0,
                1,
              )}
              azimuth={leafAttachment.azimuth}
              visualScale={0.7 + leafIndex * 0.05}
            />
          ))}
          <group
            position={shoot.tip}
            quaternion={new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              shoot.tangent,
            )}
            scale={[
              (tuning.secondaryShootBudKind === "poppy-floral"
                ? 0.1
                : materialVariant === "woody"
                  ? 0.014
                  : 0.028) * shoot.scale,
              (tuning.secondaryShootBudKind === "poppy-floral"
                ? 0.17
                : materialVariant === "woody"
                  ? 0.032
                  : 0.09) * shoot.scale,
              (tuning.secondaryShootBudKind === "poppy-floral"
                ? 0.09
                : materialVariant === "woody"
                  ? 0.014
                  : 0.028) * shoot.scale,
            ]}
          >
            <mesh>
              <primitive
                object={
                  tuning.secondaryShootBudKind === "poppy-floral"
                    ? poppyBudGeometry
                    : materialVariant === "woody"
                      ? vegetativeBudGeometry
                      : stemNodeConeGeometry
                }
                attach="geometry"
              />
              <meshStandardMaterial
                color={
                  lineDrawing
                    ? "#ffffff"
                    : tuning.secondaryShootBudKind === "poppy-floral"
                      ? new THREE.Color(color).lerp(
                          new THREE.Color("#829965"),
                          0.68,
                        )
                      : color
                }
                roughness={0.84}
                vertexColors={tuning.secondaryShootBudKind === "poppy-floral"}
                bumpMap={
                  tuning.secondaryShootBudKind === "poppy-floral"
                    ? getBotanicalTexture("stem", textureResolution)
                    : null
                }
                bumpScale={
                  tuning.secondaryShootBudKind === "poppy-floral" ? 0.014 : 0
                }
                normalMap={
                  tuning.secondaryShootBudKind === "poppy-floral"
                    ? getBotanicalMaterialTexture(
                        "stem",
                        "microNormal",
                        textureResolution,
                        secondaryShootMaterialVariant,
                      )
                    : null
                }
                normalScale={new THREE.Vector2(0.1, 0.1)}
                roughnessMap={
                  tuning.secondaryShootBudKind === "poppy-floral"
                    ? getBotanicalMaterialTexture(
                        "stem",
                        "roughness",
                        textureResolution,
                        secondaryShootMaterialVariant,
                      )
                    : null
                }
              />
              {lineDrawing && <Edges color="#111111" threshold={18} />}
            </mesh>
            {tuning.secondaryShootBudKind === "poppy-floral" &&
              !lineDrawing &&
              poppyBudHairs.map((hair, hairIndex) => (
                <mesh
                  key={`poppy-bud-hair-${hairIndex}`}
                  position={hair.position
                    .clone()
                    .addScaledVector(hair.normal, 0.055)}
                  quaternion={new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    hair.normal,
                  )}
                  scale={[
                    0.022 * hair.radiusScale,
                    0.18 * hair.lengthScale,
                    0.022 * hair.radiusScale,
                  ]}
                >
                  <primitive object={poppyBudHairGeometry} attach="geometry" />
                  <meshStandardMaterial color="#d2d0b9" roughness={1} />
                </mesh>
              ))}
          </group>
        </group>
      ))}
      {nodes.map(({ point, frame, variation }, index) => (
        <group key={index} position={point} quaternion={frame}>
          <mesh
            dispose={null}
            scale={[
              1.45 * tuning.stemNodeBulgeScale * variation.radialScale,
              0.72 * tuning.stemNodeBulgeScale * variation.axialScale,
              1.45 * tuning.stemNodeBulgeScale * variation.radialScale,
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
                bumpScale={detailBumpScale}
                normalMap={getBotanicalMaterialTexture(
                  "stem",
                  "microNormal",
                  textureResolution,
                  materialVariant,
                )}
                normalScale={
                  new THREE.Vector2(detailNormalScale, detailNormalScale)
                }
                roughnessMap={getBotanicalMaterialTexture(
                  "stem",
                  "roughness",
                  textureResolution,
                  materialVariant,
                )}
              />
            )}
          </mesh>
          <mesh
            dispose={null}
            position={[index % 2 === 0 ? 0.07 : -0.07, 0.055, 0.015]}
            rotation={[0.2, 0, index % 2 === 0 ? -0.55 : 0.55]}
            scale={[
              (materialVariant === "spike" ? 0.15 : 0.032) *
                tuning.stemNodeBulgeScale,
              (materialVariant === "spike" ? 0.28 : 0.095) *
                tuning.stemNodeBulgeScale,
              (materialVariant === "spike" ? 0.12 : 0.032) *
                tuning.stemNodeBulgeScale,
            ]}
          >
            <primitive
              object={
                materialVariant === "spike"
                  ? orchidSpikeBractGeometry
                  : stemNodeConeGeometry
              }
              attach="geometry"
            />
            <meshStandardMaterial
              color={lineDrawing ? "#ffffff" : color}
              roughness={0.86}
            />
            {lineDrawing && <Edges color="#111111" threshold={18} />}
          </mesh>
          <group
            position={[index % 2 === 0 ? 0.061 : -0.061, -0.022, 0.012]}
            rotation={[0, 0, index % 2 === 0 ? -0.1 : 0.1]}
            visible={tuning.stemScarScale > 0}
          >
            <mesh
              dispose={null}
              scale={[
                0.006 * tuning.stemScarScale,
                0.025 * tuning.stemNodeBulgeScale * tuning.stemScarScale,
                0.038 * tuning.stemNodeBulgeScale * tuning.stemScarScale,
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
              tuning.stemScarScale > 0 &&
              [-1, 0, 1].map((bundleIndex) => (
                <mesh
                  key={bundleIndex}
                  dispose={null}
                  position={[
                    (index % 2 === 0 ? 0.0065 : -0.0065) * tuning.stemScarScale,
                    (bundleIndex === 0 ? -0.006 : 0.004) * tuning.stemScarScale,
                    bundleIndex * 0.013 * tuning.stemScarScale,
                  ]}
                  scale={[
                    0.003 * tuning.stemScarScale,
                    0.004 * tuning.stemScarScale,
                    0.004 * tuning.stemScarScale,
                  ]}
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
        const frame = getLeafAttachmentFrame(
          attachment.tangent,
          attachment.azimuth,
        );
        const variation = THREE.MathUtils.lerp(
          0.82,
          1.16,
          seededRandom(seed + attachment.t * 1703 + attachment.side * 97),
        );
        const budScale = tuning.axillaryBudScale * variation;
        const swelling = getLeafAttachmentSwelling(tuning.stemNodeBulgeScale);
        return (
          <group
            key={`attachment-${attachment.side}-${attachment.t}`}
            position={attachment.point}
            quaternion={frame}
          >
            <mesh
              dispose={null}
              position={[attachment.side * swelling.offset, 0.002, 0]}
              scale={
                swelling.scale.map(
                  (value) => value * tuning.attachmentSwellingScale,
                ) as [number, number, number]
              }
            >
              <primitive object={stemNodeSphereGeometry} attach="geometry" />
              {lineDrawing ? (
                <meshBasicMaterial color="#ffffff" />
              ) : (
                <meshStandardMaterial
                  color={nodeColor}
                  roughness={0.84}
                  bumpMap={getBotanicalTexture("stem", textureResolution)}
                  bumpScale={detailBumpScale}
                  normalMap={getBotanicalMaterialTexture(
                    "stem",
                    "microNormal",
                    textureResolution,
                    materialVariant,
                  )}
                  normalScale={
                    new THREE.Vector2(detailNormalScale, detailNormalScale)
                  }
                  roughnessMap={getBotanicalMaterialTexture(
                    "stem",
                    "roughness",
                    textureResolution,
                    materialVariant,
                  )}
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
            visible={hairiness > 0 && tuning.stemHairinessScale > 0}
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
            visible={tuning.stemLenticelScale > 0}
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
                color={nodeColor.clone().multiplyScalar(0.82)}
                roughness={0.86}
              />
            </instancedMesh>
          )}
        </>
      )}
    </group>
  );
}
