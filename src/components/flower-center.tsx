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
import {
  getHeroCenterTuning,
  shouldRenderCenterBody,
} from "@/lib/flower-center-tuning";
import { useFlowerStore } from "@/lib/flower-store";
import {
  getCompositeFloretMaturity,
  getCompositeFloretSenescence,
  getFlowerGrowthState,
  getFlowerPhaseTuning,
} from "@/lib/flower-growth";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import {
  createCompositeFloretCrownGeometry,
  createSunflowerCompositeFloretCrownGeometry,
  createCompositeFloretTubeGeometry,
  createBifidCompositeStigmaGeometry,
  getCompositeCrownVariation,
  getCompositeCrownColor,
  getCompositeFloretVerticalLayout,
  getCompositeFloretPlacementVariation,
  getSunflowerDiskBodyColor,
  getSunflowerFloretPosture,
  getSunflowerFloretRadialSizeScale,
  getSunflowerFloretStage,
  getSunflowerSpentCrownVariation,
  getSunflowerWeatheredCrownColor,
} from "@/lib/composite-floret";
import {
  createLotusCarpelPitGeometry,
  createRoseHypanthiumLiningGeometry,
  seededRandom,
} from "@/lib/flower-geometry";
import { useShallow } from "zustand/react/shallow";

const centerSphereGeometry = new THREE.SphereGeometry(1, 40, 18);
const roseHypanthiumLiningGeometry = createRoseHypanthiumLiningGeometry();
const seedpodBodyGeometry = new THREE.CylinderGeometry(1, 0.62, 1, 36, 8);
const seedpodPitGeometry = createLotusCarpelPitGeometry();
const seedpodSeedGeometry = new THREE.SphereGeometry(1, 10, 7);
const floretCylinderGeometry = new THREE.CylinderGeometry(0.68, 1, 1, 7);
const compositeFloretTubeGeometry = createCompositeFloretTubeGeometry();
const floretCrownGeometry = createCompositeFloretCrownGeometry();
const sunflowerFloretCrownGeometry =
  createSunflowerCompositeFloretCrownGeometry();
const floretStigmaGeometry = new THREE.CapsuleGeometry(1, 1, 3, 5);
const sunflowerFloretStigmaGeometry = createBifidCompositeStigmaGeometry();
const seedpodBodyHeightFloor = 0.68;

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
      seed: state.seed,
    })),
  );
  const textureResolution = getTextureResolution(useRenderQuality());
  const centerColor = settings.centerColor;
  const lineDrawing = settings.renderMode === "line";
  const density = settings.centerDensity;
  const architecture = structure.centerArchitecture ?? "simple";
  const seedpodArchitecture = architecture === "seedpod";
  // Poppies and lilies expose true reproductive organs rather than the shared
  // decorative center body and generic floret mound. Rose retains a dedicated
  // flattened hypanthial disc below its stamens.
  const reproductiveOnly =
    settings.preset === "Poppy" || settings.preset === "Lily";
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
    settings.preset === "Rose"
      ? {
          // Bridge the open space inside the five petal bases without
          // revealing the green sepal whorl as a geometric pentagon.
          bodyX: 0.9,
          bodyY: 0.34,
          bodyZ: 0.87,
          radiusBias: 1,
          verticalBias: 1,
          sizeBias: 1,
          crownBias: 1,
          stigmaBias: 1,
          pitBias: 1,
        }
      : settings.preset === "Sunflower"
        ? {
            bodyX: 1.02,
            bodyY: 0.9,
            bodyZ: 1.02,
            radiusBias: 1.08,
            verticalBias: 0.88,
            sizeBias: 1.04,
            crownBias: 0.92,
            // Sunflower's bifid styles should just clear the active crowns in
            // the macro view without becoming a decorative yellow star field.
            stigmaBias: 1.18,
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
            y: 0.94 * topology.bodyY,
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
      : seedpodArchitecture
        ? new THREE.Color(centerColor)
            .lerp(new THREE.Color("#b58a36"), centerWilt * 0.18)
            .getStyle()
        : settings.preset === "Rose"
          ? new THREE.Color("#77804b")
              .lerp(new THREE.Color(centerColor), 0.18)
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
    14,
    Math.min(
      36,
      Math.round(structure.florets * density * tuning.densityScale * 0.26),
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
  const seedpodSeeds = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    if (
      architecture === "composite" &&
      (!floretCrowns.current || !floretStigmas.current)
    )
      return;
    if (seedpodArchitecture && (!seedpodPits.current || !seedpodSeeds.current))
      return;
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
      const placementVariation =
        architecture === "composite"
          ? getCompositeFloretPlacementVariation(settings.seed, index)
          : null;
      const individualDevelopment = THREE.MathUtils.clamp(
        growth.reproductiveMaturity * centerExposure +
          (placementVariation?.developmentOffset ?? 0),
        0,
        1,
      );
      const compositeMaturity =
        architecture === "composite"
          ? getCompositeFloretMaturity(progress, individualDevelopment)
          : 0;
      const compositeSenescence =
        architecture === "composite"
          ? getCompositeFloretSenescence(progress, individualDevelopment)
          : 0;
      const angle = index * 2.399963 + (placementVariation?.angleOffset ?? 0);
      const crownVariation =
        architecture === "composite"
          ? getCompositeCrownVariation(settings.seed, index)
          : null;
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
        tuning.spreadScale *
        (placementVariation?.radiusScale ?? 1);
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
      const floretY =
        0.1 +
        centerHeight *
          (1 - progress * progress) *
          innerCompaction *
          verticalBias *
          THREE.MathUtils.lerp(1, 0.92, centerWilt) +
        centerHeight * (placementVariation?.heightOffset ?? 0);
      transform.position.set(
        Math.cos(angle) * radius,
        floretY,
        Math.sin(angle) * radius,
      );
      transform.rotation.set(0, -angle + (crownVariation?.phase ?? 0), 0);
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
        topology.sizeBias *
        (settings.preset === "Sunflower"
          ? getSunflowerFloretRadialSizeScale(progress)
          : 1);
      const sunflowerStage =
        settings.preset === "Sunflower"
          ? getSunflowerFloretStage(
              progress,
              compositeMaturity,
              compositeSenescence,
            )
          : null;
      const sunflowerPosture =
        settings.preset === "Sunflower"
          ? getSunflowerFloretPosture(
              settings.seed,
              index,
              progress,
              compositeMaturity,
              compositeSenescence,
            )
          : null;
      transform.rotation.set(
        sunflowerPosture?.tilt ?? 0,
        -angle +
          (crownVariation?.phase ?? 0) +
          (sunflowerPosture?.azimuthOffset ?? 0),
        0,
      );
      const bodyHeightScale = sunflowerStage
        ? sunflowerStage.bodyHeightScale *
          THREE.MathUtils.lerp(1, 0.9, centerWilt)
        : THREE.MathUtils.lerp(1.8, 1.15, progress) *
          THREE.MathUtils.lerp(1, 0.9, centerWilt);
      const bodyWidthScale = sunflowerStage?.bodyWidthScale ?? 1;
      transform.scale.set(
        size * bodyWidthScale,
        size * bodyHeightScale,
        size * bodyWidthScale,
      );
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
      const bodyColor =
        settings.preset === "Sunflower"
          ? getSunflowerDiskBodyColor(
              progress,
              compositeMaturity,
              compositeSenescence,
              placementVariation?.lightnessOffset ?? 0,
            )
          : inner
              .clone()
              .lerp(outer, progress)
              .lerp(new THREE.Color("#60462f"), compositeSenescence * 0.58);
      mesh.current.setColorAt(index, bodyColor);

      if (architecture === "composite") {
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const crownScale =
          THREE.MathUtils.lerp(0.28, 1, centerExposure) *
          THREE.MathUtils.lerp(1, 0.92, centerWilt);
        const ringMaturity = compositeMaturity;

        const individualCrownScale = THREE.MathUtils.lerp(
          0.9,
          1.08,
          seededRandom(settings.seed + index * 149 + 37),
        );
        const renderedCrownScale =
          size *
          (settings.preset === "Sunflower" ? 0.82 : 0.72) *
          topology.crownBias *
          individualCrownScale *
          THREE.MathUtils.lerp(0.38, 1, ringMaturity * crownScale) *
          (sunflowerStage?.crownScale ?? 1) *
          // Sunflower's stage model already contracts spent crowns. Applying
          // the shared senescence factor again erased the five corolla lobes
          // and left the outer disk reading as a field of round tube ends.
          (settings.preset === "Sunflower"
            ? 1
            : THREE.MathUtils.lerp(1, 0.48, compositeSenescence)) *
          THREE.MathUtils.lerp(1, 0.86, centerWilt);
        const verticalLayout = getCompositeFloretVerticalLayout(
          size,
          bodyHeightScale,
          renderedCrownScale / size,
        );
        const spentCrownVariation =
          settings.preset === "Sunflower"
            ? getSunflowerSpentCrownVariation(
                settings.seed,
                index,
                compositeSenescence,
              )
            : { scaleX: 1, scaleY: 1, rotationOffset: 0 };
        const postureAngle = angle + (sunflowerPosture?.azimuthOffset ?? 0);
        const crownLean = sunflowerPosture
          ? Math.sin(sunflowerPosture.tilt) * verticalLayout.crownCenterOffset
          : 0;
        transform.position.set(
          x + Math.cos(postureAngle) * crownLean,
          floretY +
            Math.cos(sunflowerPosture?.tilt ?? 0) *
              verticalLayout.crownCenterOffset,
          z + Math.sin(postureAngle) * crownLean,
        );
        transform.rotation.set(
          Math.PI / 2 + (sunflowerPosture?.tilt ?? 0),
          0,
          -angle +
            crownVariation!.phase +
            spentCrownVariation.rotationOffset +
            (sunflowerPosture?.azimuthOffset ?? 0),
        );
        transform.scale.set(
          renderedCrownScale *
            crownVariation!.scaleX *
            spentCrownVariation.scaleX,
          renderedCrownScale *
            crownVariation!.scaleY *
            spentCrownVariation.scaleY,
          renderedCrownScale,
        );
        transform.updateMatrix();
        floretCrowns.current?.setMatrixAt(index, transform.matrix);
        const crownColor = getCompositeCrownColor(
          structure.diskOuterColor ?? centerColor,
          structure.pollenColor ?? structure.floretAccent,
          ringMaturity,
          compositeSenescence,
        );
        if (settings.preset === "Sunflower") {
          crownColor.lerp(
            new THREE.Color("#d8a83d"),
            seededRandom(settings.seed + index * 127 + 43) * 0.06,
          );
          crownColor.offsetHSL(
            0,
            0,
            (placementVariation?.lightnessOffset ?? 0) * 0.72,
          );
          crownColor.copy(
            getSunflowerWeatheredCrownColor(
              crownColor,
              settings.seed,
              index,
              compositeSenescence,
            ),
          );
        }
        floretCrowns.current?.setColorAt(index, crownColor);

        const stigmaEmergence =
          sunflowerStage?.styleScale ??
          THREE.MathUtils.smoothstep(ringMaturity, 0.38, 0.92);
        const stigmaStretch =
          architecture === "composite"
            ? THREE.MathUtils.lerp(1, 0.84, progress)
            : THREE.MathUtils.lerp(1, 0.92, progress);
        const stigmaLean = sunflowerPosture
          ? Math.sin(sunflowerPosture.tilt) * verticalLayout.stigmaCenterOffset
          : 0;
        transform.position.set(
          x + Math.cos(postureAngle) * stigmaLean,
          floretY +
            Math.cos(sunflowerPosture?.tilt ?? 0) *
              verticalLayout.stigmaCenterOffset,
          z + Math.sin(postureAngle) * stigmaLean,
        );
        transform.rotation.set(
          sunflowerPosture?.tilt ?? 0,
          -angle + (sunflowerPosture?.azimuthOffset ?? 0),
          0,
        );
        transform.scale.set(
          size * (settings.preset === "Sunflower" ? 0.22 : 0.13),
          size *
            THREE.MathUtils.lerp(0.06, 0.96, stigmaEmergence) *
            centerExposure *
            stigmaStretch *
            topology.stigmaBias *
            THREE.MathUtils.lerp(1, 0.56, compositeSenescence) *
            THREE.MathUtils.lerp(1, 0.82, centerWilt),
          size * (settings.preset === "Sunflower" ? 0.22 : 0.13),
        );
        transform.updateMatrix();
        floretStigmas.current?.setMatrixAt(index, transform.matrix);
      }
    }

    const pitMesh = seedpodPits.current;
    const seedMesh = seedpodSeeds.current;
    if (seedpodArchitecture && pitMesh && seedMesh) {
      for (let index = 0; index < seedpodCount; index += 1) {
        const progress = Math.sqrt(index / seedpodCount);
        const angle = index * 2.399963 + 0.28;
        const radius =
          progress *
          centerRadius *
          0.64 *
          settings.centerSpread *
          tuning.spreadScale;
        const seedpodSurfaceY =
          centerHeight * 0.15 +
          centerRadius *
            Math.max(seedpodBodyHeightFloor, centerHeight) *
            architectureBodyScale.y *
            0.5;
        const pitHeight =
          seedpodSurfaceY + centerHeight * 0.018 * (1 - progress * progress);
        transform.position.set(
          Math.cos(angle) * radius,
          pitHeight,
          Math.sin(angle) * radius,
        );
        transform.rotation.set(0, -angle, 0);
        const pitRadius =
          centerRadius *
          0.06 *
          tuning.seedpodPitScale *
          topology.pitBias *
          THREE.MathUtils.lerp(0.96, 1.06, centerMoisture);
        transform.scale.set(
          pitRadius,
          centerRadius *
            0.022 *
            tuning.seedpodPitDepthScale *
            topology.pitBias *
            THREE.MathUtils.lerp(1, 0.9, centerWilt),
          pitRadius,
        );
        transform.updateMatrix();
        pitMesh.setMatrixAt(index, transform.matrix);
        const pitVariation = seededRandom(settings.seed + index * 149 + 61);
        pitMesh.setColorAt(
          index,
          new THREE.Color().setRGB(
            THREE.MathUtils.lerp(0.92, 1.05, pitVariation),
            THREE.MathUtils.lerp(0.9, 1.03, pitVariation),
            THREE.MathUtils.lerp(0.72, 0.9, pitVariation),
          ),
        );

        const seedMaturity = THREE.MathUtils.smoothstep(
          growth.reproductiveMaturity * centerExposure,
          0.62,
          0.98,
        );
        const seedScale =
          pitRadius *
          THREE.MathUtils.lerp(0.1, 0.38, seedMaturity) *
          THREE.MathUtils.lerp(1, 0.94, centerWilt);
        transform.position.set(
          Math.cos(angle) * radius,
          pitHeight +
            centerRadius * THREE.MathUtils.lerp(-0.014, -0.004, seedMaturity),
          Math.sin(angle) * radius,
        );
        transform.rotation.set(0, -angle, 0);
        transform.scale.set(
          seedScale,
          seedScale * THREE.MathUtils.lerp(0.64, 0.9, seedMaturity),
          seedScale,
        );
        transform.updateMatrix();
        seedMesh.setMatrixAt(index, transform.matrix);
        const seedVariation = seededRandom(settings.seed + index * 173 + 29);
        seedMesh.setColorAt(
          index,
          new THREE.Color().setRGB(
            THREE.MathUtils.lerp(0.94, 1.02, seedVariation),
            THREE.MathUtils.lerp(0.94, 1.01, seedVariation),
            THREE.MathUtils.lerp(0.9, 0.98, seedVariation),
          ),
        );
      }
      pitMesh.instanceMatrix.needsUpdate = true;
      seedMesh.instanceMatrix.needsUpdate = true;
      if (pitMesh.instanceColor) pitMesh.instanceColor.needsUpdate = true;
      if (seedMesh.instanceColor) seedMesh.instanceColor.needsUpdate = true;
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
    if (floretCrowns.current)
      floretCrowns.current.instanceMatrix.needsUpdate = true;
    if (floretCrowns.current?.instanceColor)
      floretCrowns.current.instanceColor.needsUpdate = true;
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
    architectureBodyScale.y,
    centerMoisture,
    centerWilt,
    growth.reproductiveMaturity,
    centerExposure,
    seedpodArchitecture,
    seedpodCount,
    topology.crownBias,
    topology.pitBias,
    topology.radiusBias,
    topology.sizeBias,
    topology.stigmaBias,
    topology.verticalBias,
    tuning.floretSizeScale,
    tuning.seedpodPitDepthScale,
    tuning.seedpodPitScale,
    tuning.spreadScale,
  ]);

  return (
    <group>
      {!minimal && !reproductiveOnly && (
        <>
          {shouldRenderCenterBody(architecture) && (
            <mesh
              dispose={null}
              position={[0, centerHeight * 0.15, 0]}
              scale={[
                centerRadius *
                  architectureBodyScale.x *
                  (seedpodArchitecture ? 0.9 : 1),
                centerRadius *
                  Math.max(
                    seedpodArchitecture ? seedpodBodyHeightFloor : 0.22,
                    centerHeight,
                  ) *
                  architectureBodyScale.y,
                centerRadius *
                  architectureBodyScale.z *
                  (seedpodArchitecture ? 0.9 : 1),
              ]}
            >
              <primitive
                object={
                  seedpodArchitecture
                    ? seedpodBodyGeometry
                    : settings.preset === "Rose"
                      ? roseHypanthiumLiningGeometry
                      : centerSphereGeometry
                }
                attach="geometry"
              />
              {lineDrawing ? (
                <meshBasicMaterial color="#ffffff" />
              ) : (
                <meshStandardMaterial
                  color={lineDrawing ? "#111111" : displayCenterColor}
                  roughness={settings.preset === "Rose" ? 0.94 : 1}
                  metalness={0}
                  bumpMap={getBotanicalTexture("center", textureResolution)}
                  bumpScale={0.035}
                  normalMap={getBotanicalMaterialTexture(
                    "center",
                    "microNormal",
                    textureResolution,
                    seedpodArchitecture || settings.preset === "Rose"
                      ? "receptacle"
                      : "default",
                  )}
                  normalScale={
                    new THREE.Vector2(
                      settings.preset === "Rose" ? 0.16 : 0.14,
                      settings.preset === "Rose" ? 0.16 : 0.14,
                    )
                  }
                  roughnessMap={getBotanicalMaterialTexture(
                    "center",
                    "roughness",
                    textureResolution,
                    seedpodArchitecture || settings.preset === "Rose"
                      ? "receptacle"
                      : "default",
                  )}
                />
              )}
              {lineDrawing && <Edges color="#111111" threshold={18} />}
            </mesh>
          )}
          {seedpodArchitecture && (
            <>
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
                    vertexColors
                    color="#9b873f"
                    roughness={0.94}
                    normalMap={getBotanicalMaterialTexture(
                      "center",
                      "microNormal",
                      textureResolution,
                      "pit",
                    )}
                    normalScale={new THREE.Vector2(0.028, 0.028)}
                    roughnessMap={getBotanicalMaterialTexture(
                      "center",
                      "roughness",
                      textureResolution,
                      "pit",
                    )}
                  />
                )}
              </instancedMesh>
              <instancedMesh
                ref={seedpodSeeds}
                dispose={null}
                args={[undefined, undefined, seedpodCount]}
              >
                <primitive object={seedpodSeedGeometry} attach="geometry" />
                {lineDrawing ? (
                  <meshBasicMaterial color="#ffffff" />
                ) : (
                  <meshStandardMaterial
                    vertexColors
                    color={new THREE.Color("#d5d39a").lerp(
                      new THREE.Color("#75603d"),
                      centerWilt * 0.72,
                    )}
                    roughness={THREE.MathUtils.lerp(0.82, 0.96, centerWilt)}
                    normalMap={getBotanicalMaterialTexture(
                      "center",
                      "microNormal",
                      textureResolution,
                      "seed",
                    )}
                    normalScale={new THREE.Vector2(0.022, 0.022)}
                    roughnessMap={getBotanicalMaterialTexture(
                      "center",
                      "roughness",
                      textureResolution,
                      "seed",
                    )}
                  />
                )}
              </instancedMesh>
            </>
          )}
          {architecture !== "column" && (
            <instancedMesh
              ref={mesh}
              key={floretCount}
              visible={!seedpodArchitecture && settings.preset !== "Rose"}
              dispose={null}
              args={[undefined, undefined, floretCount]}
            >
              <primitive
                object={
                  architecture === "composite"
                    ? compositeFloretTubeGeometry
                    : floretCylinderGeometry
                }
                attach="geometry"
              />
              {lineDrawing ? (
                <meshBasicMaterial color="#111111" wireframe />
              ) : (
                <meshStandardMaterial
                  vertexColors
                  roughness={settings.preset === "Sunflower" ? 0.9 : 1}
                  metalness={0}
                  emissive={
                    settings.preset === "Sunflower" ? "#6b351c" : "#000000"
                  }
                  emissiveIntensity={settings.preset === "Sunflower" ? 0.06 : 0}
                  normalMap={getBotanicalMaterialTexture(
                    "center",
                    "microNormal",
                    textureResolution,
                  )}
                  normalScale={new THREE.Vector2(0.045, 0.045)}
                  roughnessMap={getBotanicalMaterialTexture(
                    "center",
                    "roughness",
                    textureResolution,
                  )}
                />
              )}
            </instancedMesh>
          )}
          {architecture === "composite" && (
            <>
              <instancedMesh
                ref={floretCrowns}
                dispose={null}
                args={[undefined, undefined, floretCount]}
              >
                <primitive
                  object={
                    settings.preset === "Sunflower"
                      ? sunflowerFloretCrownGeometry
                      : floretCrownGeometry
                  }
                  attach="geometry"
                />
                <meshPhysicalMaterial
                  color={lineDrawing ? "#111111" : "#ffffff"}
                  vertexColors={!lineDrawing}
                  roughness={0.88}
                  emissive={
                    settings.preset === "Sunflower" ? "#9b5a24" : "#000000"
                  }
                  emissiveIntensity={settings.preset === "Sunflower" ? 0.05 : 0}
                  clearcoat={
                    lineDrawing || settings.preset !== "Sunflower"
                      ? 0
                      : 0.08 * growth.moisture
                  }
                  clearcoatRoughness={0.62}
                  clearcoatMap={
                    lineDrawing
                      ? undefined
                      : settings.preset === "Sunflower"
                        ? getBotanicalMaterialTexture(
                            "center",
                            "moisture",
                            textureResolution,
                            "disk",
                          )
                        : undefined
                  }
                  normalMap={
                    lineDrawing
                      ? undefined
                      : getBotanicalMaterialTexture(
                          "center",
                          "microNormal",
                          textureResolution,
                          settings.preset === "Sunflower" ? "disk" : "default",
                        )
                  }
                  normalScale={new THREE.Vector2(0.035, 0.035)}
                  roughnessMap={
                    lineDrawing
                      ? undefined
                      : getBotanicalMaterialTexture(
                          "center",
                          "roughness",
                          textureResolution,
                          settings.preset === "Sunflower" ? "disk" : "default",
                        )
                  }
                />
              </instancedMesh>
              <instancedMesh
                ref={floretStigmas}
                dispose={null}
                args={[undefined, undefined, floretCount]}
              >
                <primitive
                  object={
                    settings.preset === "Sunflower"
                      ? sunflowerFloretStigmaGeometry
                      : floretStigmaGeometry
                  }
                  attach="geometry"
                />
                <meshStandardMaterial
                  color={lineDrawing ? "#111111" : structure.stigmaColor}
                  roughness={0.88}
                  normalMap={
                    lineDrawing
                      ? undefined
                      : getBotanicalMaterialTexture(
                          "center",
                          "microNormal",
                          textureResolution,
                          settings.preset === "Sunflower" ? "disk" : "default",
                        )
                  }
                  normalScale={new THREE.Vector2(0.025, 0.025)}
                  roughnessMap={
                    lineDrawing
                      ? undefined
                      : getBotanicalMaterialTexture(
                          "center",
                          "roughness",
                          textureResolution,
                          settings.preset === "Sunflower" ? "disk" : "default",
                        )
                  }
                />
              </instancedMesh>
            </>
          )}
        </>
      )}
      {architecture !== "composite" && (
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
          showPistil={!seedpodArchitecture}
        />
      )}
    </group>
  );
}
