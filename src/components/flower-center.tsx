"use client";

import { Edges } from "@react-three/drei";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { FlowerSpecies } from "@/lib/flower-species";
import { FlowerReproductiveDetails } from "./flower-reproductive";
import {
  getBotanicalMaterialTexture,
  getBotanicalTexture,
} from "@/lib/botanical-textures";
import { getHeroCenterTuning } from "@/lib/flower-center-tuning";
import { useFlowerStore } from "@/lib/flower-store";
import {
  getFlowerGrowthState,
  getFlowerPhaseTuning,
} from "@/lib/flower-growth";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import { useShallow } from "zustand/react/shallow";

const centerSphereGeometry = new THREE.SphereGeometry(1, 40, 18);
const seedpodPitGeometry = new THREE.CylinderGeometry(1, 1, 1, 7);
const floretSphereGeometry = new THREE.SphereGeometry(1, 8, 6);
const floretCylinderGeometry = new THREE.CylinderGeometry(0.68, 1, 1, 7);
const floretCrownGeometry = new THREE.TorusGeometry(0.62, 0.2, 4, 5);
const floretStigmaGeometry = new THREE.CapsuleGeometry(1, 1, 3, 5);

export function FlowerCenter({
  structure,
  minimal = false,
}: {
  structure: FlowerSpecies;
  minimal?: boolean;
}) {
  const settings = useFlowerStore(
    useShallow((state) => ({
      preset: state.preset,
      renderMode: state.renderMode,
      centerColor: state.centerColor,
      centerDensity: state.centerDensity,
      centerSize: state.centerSize,
      centerProfile: state.centerProfile,
      centerFloretSize: state.centerFloretSize,
      centerSpread: state.centerSpread,
      centerStamenLength: state.centerStamenLength,
      centerAntherSize: state.centerAntherSize,
      centerStigmaSize: state.centerStigmaSize,
      bloom: state.bloom,
      petalAge: state.petalAge,
    })),
  );
  const textureResolution = getTextureResolution(useRenderQuality());
  const centerColor = settings.centerColor;
  const lineDrawing = settings.renderMode === "line";
  const density = settings.centerDensity;
  const architecture = structure.centerArchitecture ?? "simple";
  const seedpodArchitecture = architecture === "seedpod";
  const tuning = getHeroCenterTuning(settings.preset, structure, architecture);
  const growth = getFlowerGrowthState(settings.bloom, settings.petalAge);
  const phaseTuning = getFlowerPhaseTuning(growth.phase);
  const centerExposure = phaseTuning.centerExposureScale;
  const centerMoisture = THREE.MathUtils.clamp(
    growth.moisture * phaseTuning.moistureScale,
    0,
    1,
  );
  const centerWilt = growth.wilt * phaseTuning.wiltScale;
  const topology =
    settings.preset === "Sunflower"
      ? {
          bodyX: 1.02,
          bodyY: 0.9,
          bodyZ: 1.02,
          radiusBias: 1.08,
          verticalBias: 0.88,
          sizeBias: 1.04,
          crownBias: 0.92,
          stigmaBias: 0.9,
          pitBias: 0.94,
        }
      : settings.preset === "Orchid"
        ? {
            bodyX: 0.74,
            bodyY: 1.16,
            bodyZ: 0.78,
            radiusBias: 0.72,
            verticalBias: 1.14,
            sizeBias: 0.9,
            crownBias: 0.86,
            stigmaBias: 1.08,
            pitBias: 0.88,
          }
        : settings.preset === "Lotus"
          ? {
              bodyX: 1.08,
              bodyY: 0.92,
              bodyZ: 1.08,
              radiusBias: 1.04,
              verticalBias: 0.86,
              sizeBias: 1.02,
              crownBias: 0.96,
              stigmaBias: 0.94,
              pitBias: 1.1,
            }
          : {
              bodyX: 1,
              bodyY: 1,
              bodyZ: 1,
              radiusBias: 1,
              verticalBias: 1,
              sizeBias: 1,
              crownBias: 1,
              stigmaBias: 1,
              pitBias: 1,
            };
  const architectureBodyScale =
    architecture === "column"
      ? {
          x: 0.44 * topology.bodyX,
          y: 1.38 * topology.bodyY,
          z: 0.42 * topology.bodyZ,
        }
      : seedpodArchitecture
        ? {
            x: 0.92 * topology.bodyX,
            y: 0.76 * topology.bodyY,
            z: 0.92 * topology.bodyZ,
          }
        : {
            x: topology.bodyX,
            y: topology.bodyY,
            z: topology.bodyZ,
          };
  const displayCenterColor =
    architecture === "column"
      ? new THREE.Color(structure.stigmaColor)
          .lerp(new THREE.Color(centerColor), tuning.displayColorMix)
          .getStyle()
      : centerColor;
  const centerRadius =
    structure.centerRadius *
    settings.centerSize *
    tuning.radiusScale *
    tuning.sizeScale *
    THREE.MathUtils.lerp(0.88, 1.06, centerExposure) *
    THREE.MathUtils.lerp(0.96, 1.02, centerMoisture);
  const centerHeight =
    structure.centerHeight *
    settings.centerProfile *
    tuning.heightScale *
    (seedpodArchitecture ? 1.14 : 1) *
    THREE.MathUtils.lerp(0.92, 1.04, centerExposure) *
    THREE.MathUtils.lerp(1, 0.9, centerWilt);
  const seedpodCount = Math.max(
    18,
    Math.min(
      64,
      Math.round(structure.florets * density * tuning.densityScale * 0.56),
    ),
  );
  const floretCount = Math.max(
    architecture === "column" ? 3 : seedpodArchitecture ? 12 : 8,
    Math.min(
      architecture === "column" ? 8 : seedpodArchitecture ? 56 : 720,
      Math.round(structure.florets * density * tuning.floretCountScale),
    ),
  );
  const mesh = useRef<THREE.InstancedMesh>(null);
  const floretCrowns = useRef<THREE.InstancedMesh>(null);
  const floretStigmas = useRef<THREE.InstancedMesh>(null);
  const seedpodPits = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    if (
      architecture === "composite" &&
      (!floretCrowns.current || !floretStigmas.current)
    )
      return;
    if (seedpodArchitecture && !seedpodPits.current) return;
    const transform = new THREE.Object3D();
    const inner = new THREE.Color(
      architecture === "composite"
        ? (structure.diskInnerColor ?? structure.floretAccent)
        : structure.floretAccent,
    );
    const outer = new THREE.Color(
      architecture === "composite"
        ? (structure.diskOuterColor ?? centerColor)
        : displayCenterColor,
    )
      .multiplyScalar(THREE.MathUtils.lerp(0.82, 0.92, centerMoisture))
      .lerp(new THREE.Color("#76553a"), centerWilt * 0.36);
    for (let index = 0; index < floretCount; index += 1) {
      const progress = Math.sqrt(index / floretCount);
      const angle = index * 2.399963;
      const radialShape =
        architecture === "composite"
          ? THREE.MathUtils.lerp(0.76, 1.04, progress)
          : architecture === "column"
            ? THREE.MathUtils.lerp(0.56, 0.94, progress)
            : THREE.MathUtils.lerp(0.86, 1, progress);
      const radius =
        progress *
        centerRadius *
        (architecture === "column" ? 0.32 : seedpodArchitecture ? 0.76 : 0.92) *
        topology.radiusBias *
        radialShape *
        settings.centerSpread *
        tuning.spreadScale;
      const innerCompaction =
        architecture === "composite"
          ? THREE.MathUtils.lerp(0.86, 1.1, centerExposure) *
            topology.verticalBias
          : architecture === "column"
            ? THREE.MathUtils.lerp(0.72, 0.9, centerExposure) *
              topology.verticalBias
            : THREE.MathUtils.lerp(0.9, 1, centerExposure) *
              topology.verticalBias;
      const verticalBias =
        architecture === "composite"
          ? THREE.MathUtils.lerp(1.04, 0.96, progress)
          : architecture === "column"
            ? THREE.MathUtils.lerp(1.22, 0.88, progress)
            : THREE.MathUtils.lerp(1.0, 0.92, progress);
      transform.position.set(
        Math.cos(angle) * radius,
        0.1 +
          centerHeight *
            (1 - progress * progress) *
            innerCompaction *
            verticalBias *
            THREE.MathUtils.lerp(1, 0.92, centerWilt),
        Math.sin(angle) * radius,
      );
      transform.rotation.set(0, -angle, 0);
      const densityScale = THREE.MathUtils.clamp(
        1 / Math.sqrt(density),
        0.72,
        1.35,
      );
      const size =
        THREE.MathUtils.lerp(
          architecture === "composite"
            ? 0.03 * tuning.floretSizeScale
            : seedpodArchitecture
              ? 0.044 * tuning.floretSizeScale
              : 0.035 * tuning.floretSizeScale,
          architecture === "column"
            ? 0.04 * tuning.floretSizeScale
            : seedpodArchitecture
              ? 0.028 * tuning.floretSizeScale
              : 0.024 * tuning.floretSizeScale,
          progress,
        ) *
        densityScale *
        settings.centerFloretSize *
        THREE.MathUtils.lerp(0.28, 1, centerExposure) *
        THREE.MathUtils.lerp(0.96, 1.08, centerMoisture) *
        topology.sizeBias;
      transform.scale.set(
        size,
        size *
          THREE.MathUtils.lerp(1.8, 1.15, progress) *
          THREE.MathUtils.lerp(1, 0.9, centerWilt),
        size,
      );
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
      mesh.current.setColorAt(index, inner.clone().lerp(outer, progress));

      if (architecture === "composite") {
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const floretTop = 0.1 + centerHeight * (1 - progress * progress);
        const crownScale =
          THREE.MathUtils.lerp(0.28, 1, centerExposure) *
          THREE.MathUtils.lerp(1, 0.92, centerWilt);

        transform.position.set(x, floretTop + size * 1.72, z);
        transform.rotation.set(Math.PI / 2, 0, -angle);
        transform.scale.setScalar(
          size *
            0.72 *
            topology.crownBias *
            THREE.MathUtils.lerp(
              0.3,
              1,
              growth.reproductiveMaturity * crownScale,
            ) *
            THREE.MathUtils.lerp(1, 0.86, centerWilt),
        );
        transform.updateMatrix();
        floretCrowns.current?.setMatrixAt(index, transform.matrix);

        const stigmaEmergence = THREE.MathUtils.smoothstep(
          progress,
          0.18,
          0.82,
        );
        const stigmaStretch =
          architecture === "composite"
            ? THREE.MathUtils.lerp(1, 0.84, progress)
            : THREE.MathUtils.lerp(1, 0.92, progress);
        transform.position.set(x, floretTop + size * 2.05, z);
        transform.rotation.set(0, -angle, 0);
        transform.scale.set(
          size * 0.13,
          size *
            THREE.MathUtils.lerp(0.75, 0.08, stigmaEmergence) *
            growth.reproductiveMaturity *
            centerExposure *
            stigmaStretch *
            topology.stigmaBias *
            THREE.MathUtils.lerp(1, 0.82, centerWilt),
          size * 0.13,
        );
        transform.updateMatrix();
        floretStigmas.current?.setMatrixAt(index, transform.matrix);
      }
    }

    if (seedpodArchitecture && seedpodPits.current) {
      for (let index = 0; index < seedpodCount; index += 1) {
        const progress = Math.sqrt(index / seedpodCount);
        const angle = index * 2.399963 + 0.28;
        const radius =
          progress *
          centerRadius *
          0.64 *
          settings.centerSpread *
          tuning.spreadScale;
        const pitHeight =
          0.11 + centerHeight * (1 - progress * progress) * 0.84;
        transform.position.set(
          Math.cos(angle) * radius,
          pitHeight,
          Math.sin(angle) * radius,
        );
        transform.rotation.set(Math.PI / 2, 0, -angle);
        transform.scale.set(
          centerRadius *
            0.06 *
            tuning.seedpodPitScale *
            topology.pitBias *
            THREE.MathUtils.lerp(0.96, 1.06, centerMoisture),
          centerRadius *
            0.06 *
            tuning.seedpodPitScale *
            topology.pitBias *
            THREE.MathUtils.lerp(0.96, 1.06, centerMoisture),
          centerRadius *
            0.022 *
            tuning.seedpodPitDepthScale *
            topology.pitBias *
            THREE.MathUtils.lerp(1, 0.9, centerWilt),
        );
        transform.updateMatrix();
        seedpodPits.current.setMatrixAt(index, transform.matrix);
      }
      seedpodPits.current.instanceMatrix.needsUpdate = true;
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
    if (floretCrowns.current)
      floretCrowns.current.instanceMatrix.needsUpdate = true;
    if (floretStigmas.current)
      floretStigmas.current.instanceMatrix.needsUpdate = true;
  }, [
    centerColor,
    displayCenterColor,
    centerHeight,
    centerRadius,
    density,
    floretCount,
    settings,
    structure,
    architecture,
    growth.reproductiveMaturity,
    centerExposure,
    seedpodArchitecture,
    seedpodCount,
  ]);

  return (
    <group>
      {!minimal && (
        <>
          <mesh
            dispose={null}
            position={[0, centerHeight * 0.15, 0]}
            scale={[
              centerRadius *
                architectureBodyScale.x *
                (architecture === "column"
                  ? 0.58
                  : seedpodArchitecture
                    ? 0.9
                    : 1),
              centerRadius *
                Math.max(
                  architecture === "column"
                    ? 0.52
                    : seedpodArchitecture
                      ? 0.36
                      : 0.22,
                  centerHeight,
                ) *
                architectureBodyScale.y,
              centerRadius *
                architectureBodyScale.z *
                (architecture === "column"
                  ? 0.5
                  : seedpodArchitecture
                    ? 0.9
                    : 1),
            ]}
          >
            <primitive object={centerSphereGeometry} attach="geometry" />
            {lineDrawing ? (
              <meshBasicMaterial color="#ffffff" />
            ) : (
              <meshStandardMaterial
                color={lineDrawing ? "#111111" : displayCenterColor}
                roughness={1}
                metalness={0}
                bumpMap={getBotanicalTexture("center", textureResolution)}
                bumpScale={0.035}
                normalMap={getBotanicalMaterialTexture(
                  "center",
                  "microNormal",
                  textureResolution,
                )}
                normalScale={new THREE.Vector2(0.14, 0.14)}
                roughnessMap={getBotanicalMaterialTexture(
                  "center",
                  "roughness",
                  textureResolution,
                )}
              />
            )}
            {lineDrawing && <Edges color="#111111" threshold={18} />}
          </mesh>
          {seedpodArchitecture && (
            <instancedMesh
              ref={seedpodPits}
              dispose={null}
              args={[undefined, undefined, seedpodCount]}
            >
              <primitive object={seedpodPitGeometry} attach="geometry" />
              {lineDrawing ? (
                <meshBasicMaterial color="#111111" />
              ) : (
                <meshStandardMaterial
                  color={structure.floretAccent}
                  roughness={0.9}
                />
              )}
            </instancedMesh>
          )}
          <instancedMesh
            ref={mesh}
            key={floretCount}
            dispose={null}
            args={[undefined, undefined, floretCount]}
          >
            <primitive
              object={
                architecture === "column"
                  ? floretSphereGeometry
                  : floretCylinderGeometry
              }
              attach="geometry"
            />
            {lineDrawing ? (
              <meshBasicMaterial color="#111111" wireframe />
            ) : (
              <meshStandardMaterial vertexColors roughness={1} metalness={0} />
            )}
          </instancedMesh>
          {architecture === "composite" && (
            <>
              <instancedMesh
                ref={floretCrowns}
                dispose={null}
                args={[undefined, undefined, floretCount]}
              >
                <primitive object={floretCrownGeometry} attach="geometry" />
                <meshStandardMaterial
                  color={
                    lineDrawing
                      ? "#111111"
                      : (structure.pollenColor ?? structure.floretAccent)
                  }
                  roughness={0.92}
                />
              </instancedMesh>
              <instancedMesh
                ref={floretStigmas}
                dispose={null}
                args={[undefined, undefined, floretCount]}
              >
                <primitive object={floretStigmaGeometry} attach="geometry" />
                <meshStandardMaterial
                  color={lineDrawing ? "#111111" : structure.stigmaColor}
                  roughness={0.88}
                />
              </instancedMesh>
            </>
          )}
        </>
      )}
      {architecture !== "composite" && !seedpodArchitecture && (
        <FlowerReproductiveDetails
          structure={structure}
          density={density}
          centerRadius={centerRadius}
          centerHeight={centerHeight}
          spread={settings.centerSpread}
          stamenLength={settings.centerStamenLength}
          antherSize={settings.centerAntherSize}
          stigmaSize={settings.centerStigmaSize}
          maturity={growth.reproductiveMaturity * centerExposure}
        />
      )}
    </group>
  );
}
