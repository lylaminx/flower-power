"use client";

import { Edges } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  getBotanicalMaterialTexture,
  getBotanicalTexture,
  getAntherMaterialVariant,
  getOvaryMaterialVariant,
} from "@/lib/botanical-textures";
import type { FlowerSpecies } from "@/lib/flower-species";
import {
  getAntherGrooveColor,
  getAntherRoughness,
  getFilamentSegmentCount,
  getHeroCenterTuning,
  getLilyStamenVariation,
  getPoppyStamenVariation,
  poppyStamenSurface,
  poppyStigmaDisk,
  getPollenGrainsPerStamen,
  getRoseFreeStyleCount,
  getRoseFreeStyleVariation,
  getRoseStamenVariation,
  getReproductiveRadiusScale,
  orchidColumnHood,
  orchidColumnPose,
  orchidColumnSilhouette,
  orchidPolliniumPose,
} from "@/lib/flower-center-tuning";
import {
  getFlowerGrowthState,
  getFlowerPhaseTuning,
} from "@/lib/flower-growth";
import { useFlowerStore } from "@/lib/flower-store";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import {
  createTaperedFilamentGeometry,
  createLilyAntherGeometry,
  createRoseAntherGeometry,
  createLilyStigmaGeometry,
  createLilyStyleGeometry,
  createLilyOvaryGeometry,
  createPollenClusterPlacements,
  distributeRosePollenOffset,
  distributeLilyPollenOffset,
  orientPollenOffsetToAnther,
  seededRandom,
} from "@/lib/flower-geometry";

const filamentGeometry = createTaperedFilamentGeometry();
const antherGeometry = new THREE.CapsuleGeometry(1, 1.4, 4, 8);
const lilyAntherGeometry = createLilyAntherGeometry();
const roseAntherGeometry = createRoseAntherGeometry();
const antherGrooveGeometry = new THREE.CapsuleGeometry(1, 1.35, 3, 6);
const pollenGeometry = new THREE.IcosahedronGeometry(1, 1);
const ovaryGeometry = new THREE.SphereGeometry(1, 18, 12);
const lilyOvaryGeometry = createLilyOvaryGeometry();
const ovaryRidgeGeometry = new THREE.CapsuleGeometry(1, 1.2, 4, 6);
const styleGeometry = new THREE.CylinderGeometry(1, 1, 1, 8);
const lilyStyleGeometry = createLilyStyleGeometry();
const stigmaHeadGeometry = new THREE.SphereGeometry(1, 20, 12);
const poppyStigmaDiskGeometry = (() => {
  const geometry = new THREE.CylinderGeometry(1, 0.9, 1, 80, 3);
  const position = geometry.getAttribute("position");
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);
    const angle = Math.atan2(z, x);
    const lobe =
      1 +
      Math.cos(angle * poppyStigmaDisk.lobeCount) *
        poppyStigmaDisk.rimLobeAmplitude;
    position.setX(index, x * lobe);
    position.setZ(index, z * lobe);
    if (position.getY(index) > 0) {
      const radius = Math.min(1, Math.hypot(x, z));
      position.setY(index, position.getY(index) + (1 - radius * radius) * 0.32);
    }
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
})();
const lilyStigmaGeometry = createLilyStigmaGeometry();
const stigmaLobeGeometry = new THREE.CapsuleGeometry(1, 1.1, 4, 7);
const poppyStigmaRayGeometry = new THREE.BoxGeometry(1, 1, 1);
const stigmaPapillaGeometry = new THREE.SphereGeometry(1, 7, 5);
const columnShape = new THREE.Shape();
const columnContour = [
  ...orchidColumnSilhouette.map(
    ([halfWidth, height]) => new THREE.Vector2(-halfWidth, height),
  ),
  ...[...orchidColumnSilhouette]
    .reverse()
    .slice(1, -1)
    .map(([halfWidth, height]) => new THREE.Vector2(halfWidth, height)),
];
columnShape.setFromPoints(columnContour);
const columnGeometry = new THREE.ExtrudeGeometry(columnShape, {
  depth: orchidColumnHood.depth,
  steps: 1,
  bevelEnabled: true,
  bevelSegments: 4,
  bevelSize: orchidColumnHood.bevelSize,
  bevelThickness: orchidColumnHood.bevelThickness,
  curveSegments: 12,
});
columnGeometry.translate(0, 0, -orchidColumnHood.depth * 0.5);
columnGeometry.computeVertexNormals();
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
  const textureResolution = getTextureResolution(quality);
  const tuning = getHeroCenterTuning(
    preset,
    structure,
    structure.centerArchitecture ?? "simple",
  );
  const ovaryMaterialVariant = getOvaryMaterialVariant(preset);
  const antherMaterialVariant = getAntherMaterialVariant(preset);
  const architecture = structure.centerArchitecture ?? "simple";
  const isColumn = architecture === "column";
  const isPoppy = preset === "Poppy";
  const isLily = preset === "Lily";
  const isRose = preset === "Rose";
  const isLotus = preset === "Lotus";
  const reproductiveRadiusScale = getReproductiveRadiusScale(preset);
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
  const orchidPolliniumColor = useMemo(
    () =>
      new THREE.Color(structure.pollenColor ?? "#e8c94d").lerp(
        new THREE.Color("#c87925"),
        orchidPolliniumPose.warmColorMix,
      ),
    [structure.pollenColor],
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
  const filamentSegments = isPoppy
    ? quality === "draft"
      ? 3
      : quality === "ultra"
        ? 10
        : 8
    : getFilamentSegmentCount(quality, isColumn, isLily);
  const filamentCount = stamenCount * filamentSegments;
  const grainsPerAnther = getPollenGrainsPerStamen(quality, isLily);
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
      const lilyVariation = isLily
        ? getLilyStamenVariation(seed, index)
        : undefined;
      const roseVariation = isRose
        ? getRoseStamenVariation(seed, index)
        : undefined;
      const poppyVariation = isPoppy
        ? getPoppyStamenVariation(seed, index, stamenCount)
        : undefined;
      const angle =
        (index / stamenCount) * Math.PI * 2 +
        (poppyVariation?.angleOffset ?? 0) +
        (roseVariation?.angleOffset ?? 0) +
        (lilyVariation?.angleOffset ?? 0);
      const alternating = isColumn
        ? 0.22 + index * 0.08
        : isRose
          ? (roseVariation?.radialSeat ?? 0.66)
          : isPoppy
            ? (poppyVariation?.radialSeat ?? 0.64)
            : index % 2 === 0
              ? 0.72
              : 0.58;
      const radius =
        centerRadius *
        reproductiveRadiusScale *
        alternating *
        spread *
        (lilyVariation?.radiusScale ?? 1);
      const filamentHeight =
        (isRose ? 0.102 : isPoppy ? 0.102 : 0.09 + (index % 3) * 0.012) *
        stamenLength *
        tuning.stamenLengthScale *
        (poppyVariation?.lengthScale ?? 1) *
        (lilyVariation?.lengthScale ?? 1) *
        (roseVariation?.lengthScale ?? 1) *
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
              reproductiveRadiusScale *
              0.08 *
              tuning.filamentSpreadScale *
              THREE.MathUtils.lerp(0.22, 1, maturityScale),
          ),
        );
      const bowAmount =
        (isColumn
          ? 0.006
          : centerRadius *
            (isPoppy ? 0.062 : 0.035) *
            tuning.filamentSpreadScale) *
        (poppyVariation?.curveScale ?? 1) *
        THREE.MathUtils.lerp(0.35, 1, maturityScale) *
        THREE.MathUtils.lerp(1, 1.2, wilt);
      const filamentMid = filamentBase
        .clone()
        .lerp(filamentTip, 0.52)
        .add(
          new THREE.Vector3(
            Math.cos(angle) * bowAmount -
              Math.sin(angle) * (poppyVariation?.lateralCurve ?? 0),
            0,
            Math.sin(angle) * bowAmount +
              Math.cos(angle) * (poppyVariation?.lateralCurve ?? 0),
          ),
        );
      const filamentPoints =
        filamentSegments === 1
          ? [filamentBase, filamentTip]
          : new THREE.QuadraticBezierCurve3(
              filamentBase,
              // Solve the quadratic control point so the curve passes through
              // the authored midpoint instead of halving its outward bow.
              filamentMid
                .clone()
                .multiplyScalar(2)
                .addScaledVector(filamentBase, -0.5)
                .addScaledVector(filamentTip, -0.5),
              filamentTip,
            ).getPoints(filamentSegments);

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
          (isColumn ? 0.008 : 0.006) * tuning.filamentRadiusScale,
          direction.length() * 1.035,
          (isColumn ? 0.008 : 0.006) * tuning.filamentRadiusScale,
        );
        transform.updateMatrix();
        filaments.current.setMatrixAt(
          index * filamentSegments + segmentIndex,
          transform.matrix,
        );
      }

      const antherCenter = filamentTip.clone();
      const seededLean =
        (((index % 3) - 1) * 0.008 +
          (lilyVariation?.leanOffset ?? 0) +
          (poppyVariation?.leanOffset ?? 0) +
          (roseVariation?.leanOffset ?? 0)) *
        THREE.MathUtils.lerp(0.2, 1, maturityScale);
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
          (isLily ? 0.0042 : 0.0075) *
          antherSize *
          tuning.antherSizeScale *
          lobeSide;
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
              ? 0.08 + lobeSide * 0.012
              : (poppyVariation?.antherTilt ??
                  roseVariation?.antherTilt ??
                  0.25) +
                lobeSide * 0.035,
          isColumn
            ? index % 2 === 0
              ? 0.34
              : -0.34
            : -angle +
                (poppyVariation?.antherYaw ?? roseVariation?.antherYaw ?? 0),
          isRose
            ? lobeSide *
                THREE.MathUtils.lerp(
                  0.025,
                  0.085,
                  seededRandom(seed + index * 397 + lobeIndex * 83 + 23),
                )
            : isLily
              ? 0.16
              : Math.PI / 2,
        );
        const roseLobeLengthScale = isRose
          ? THREE.MathUtils.lerp(
              0.9,
              1.08,
              seededRandom(seed + index * 463 + lobeIndex * 101 + 47),
            )
          : 1;
        transform.scale.set(
          (isColumn ? 0.012 : 0.0075) *
            antherSize *
            tuning.antherSizeScale *
            (poppyVariation?.antherScale ?? roseVariation?.antherScale ?? 1) *
            tuning.antherWidthScale,
          0.03 *
            antherSize *
            tuning.antherSizeScale *
            (poppyVariation?.antherScale ?? roseVariation?.antherScale ?? 1) *
            (isPoppy ? poppyStamenSurface.antherLengthScale : 1) *
            roseLobeLengthScale,
          0.0075 *
            antherSize *
            tuning.antherSizeScale *
            (poppyVariation?.antherScale ?? roseVariation?.antherScale ?? 1) *
            tuning.antherDepthScale,
        );
        transform.updateMatrix();
        anthers.current.setMatrixAt(
          index * antherLobesPerStamen + lobeIndex,
          transform.matrix,
        );

        const grooveMaturity =
          THREE.MathUtils.smoothstep(maturityScale, 0.3, 0.82) *
          THREE.MathUtils.lerp(1, 0.72, wilt);
        const lilyGrooveWidth = isLily
          ? THREE.MathUtils.lerp(
              0.82,
              1.12,
              seededRandom(seed + index * 431 + lobeIndex * 71 + 19),
            )
          : 1;
        const lilyGrooveLength = isLily
          ? THREE.MathUtils.lerp(
              0.94,
              1.03,
              seededRandom(seed + index * 557 + lobeIndex * 97 + 43),
            )
          : 1;
        transform.position.y +=
          (isLily
            ? THREE.MathUtils.lerp(
                0.0025,
                0.0037,
                seededRandom(seed + index * 653 + lobeIndex * 109 + 61),
              )
            : 0.0032) *
          antherSize *
          tuning.antherSizeScale;
        transform.scale.set(
          0.0022 *
            antherSize *
            tuning.antherSizeScale *
            grooveMaturity *
            lilyGrooveWidth,
          0.027 *
            antherSize *
            tuning.antherSizeScale *
            lilyGrooveLength *
            (isPoppy ? poppyStamenSurface.antherLengthScale : 1),
          0.002 *
            antherSize *
            tuning.antherSizeScale *
            tuning.antherDepthScale *
            grooveMaturity,
        );
        transform.updateMatrix();
        antherGrooves.current.setMatrixAt(
          index * antherLobesPerStamen + lobeIndex,
          transform.matrix,
        );
      }
    }

    pollenPlacements.forEach(
      ({ stamenIndex, lobeSide, offset, scale }, pollenIndex) => {
        const lilyVariation = isLily
          ? getLilyStamenVariation(seed, stamenIndex)
          : undefined;
        const roseVariation = isRose
          ? getRoseStamenVariation(seed, stamenIndex)
          : undefined;
        const poppyVariation = isPoppy
          ? getPoppyStamenVariation(seed, stamenIndex, stamenCount)
          : undefined;
        const angle =
          (stamenIndex / stamenCount) * Math.PI * 2 +
          (poppyVariation?.angleOffset ?? 0) +
          (roseVariation?.angleOffset ?? 0) +
          (lilyVariation?.angleOffset ?? 0);
        const alternating = isColumn
          ? 0.22 + stamenIndex * 0.08
          : isRose
            ? (roseVariation?.radialSeat ?? 0.66)
            : isPoppy
              ? (poppyVariation?.radialSeat ?? 0.64)
              : stamenIndex % 2 === 0
                ? 0.72
                : 0.58;
        const radius =
          centerRadius *
          reproductiveRadiusScale *
          alternating *
          spread *
          (lilyVariation?.radiusScale ?? 1);
        const filamentHeight =
          (isRose
            ? 0.102
            : isPoppy
              ? 0.102
              : 0.09 + (stamenIndex % 3) * 0.012) *
          stamenLength *
          tuning.stamenLengthScale *
          (poppyVariation?.lengthScale ?? 1) *
          (lilyVariation?.lengthScale ?? 1) *
          (roseVariation?.lengthScale ?? 1) *
          THREE.MathUtils.lerp(0.18, 1, maturityScale) *
          THREE.MathUtils.lerp(1, 0.78, wilt);
        const seededLean =
          (((stamenIndex % 3) - 1) * 0.008 +
            (lilyVariation?.leanOffset ?? 0) +
            (poppyVariation?.leanOffset ?? 0) +
            (roseVariation?.leanOffset ?? 0)) *
          THREE.MathUtils.lerp(0.2, 1, maturityScale);
        const tipSpread =
          centerRadius *
          reproductiveRadiusScale *
          0.08 *
          tuning.filamentSpreadScale *
          THREE.MathUtils.lerp(0.22, 1, maturityScale);
        const seatedPollenOffset =
          isLily || isRose
            ? orientPollenOffsetToAnther(
                isLily
                  ? distributeLilyPollenOffset(
                      offset,
                      pollenIndex % grainsPerAnther,
                      grainsPerAnther,
                      seed + stamenIndex * 271,
                    )
                  : distributeRosePollenOffset(
                      offset,
                      pollenIndex % grainsPerAnther,
                      grainsPerAnther,
                      seed + stamenIndex * 331,
                    ),
                angle,
                lobeSide,
                (isLily ? 0.0082 : 0.0075) *
                  antherSize *
                  tuning.antherSizeScale,
                tuning.antherDepthScale,
              )
            : offset;
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
          .add(seatedPollenOffset);
        const pollenScale =
          (isLily ? 0.00255 : 0.0048) *
          (isPoppy ? poppyStamenSurface.pollenScale : 1) *
          (isRose ? 0.64 : 1) *
          scale *
          antherSize *
          tuning.antherSizeScale *
          THREE.MathUtils.smoothstep(maturityScale, 0.38, 0.9) *
          THREE.MathUtils.lerp(1, 0.72, wilt);
        if (isLily) {
          const grainTwist =
            seededRandom(seed + pollenIndex * 811 + 127) * Math.PI;
          transform.rotation.set(
            (seededRandom(seed + pollenIndex * 887 + 149) - 0.5) * 0.7,
            angle + grainTwist,
            (seededRandom(seed + pollenIndex * 941 + 173) - 0.5) * 0.8,
          );
          transform.scale.set(
            pollenScale * 0.72,
            pollenScale * 1.18,
            pollenScale * 0.84,
          );
        } else if (isRose) {
          transform.rotation.set(
            (seededRandom(seed + pollenIndex * 887 + 149) - 0.5) * 0.65,
            angle + seededRandom(seed + pollenIndex * 811 + 127) * Math.PI,
            (seededRandom(seed + pollenIndex * 941 + 173) - 0.5) * 0.7,
          );
          transform.scale.set(
            pollenScale * 0.72,
            pollenScale * 1.12,
            pollenScale * 0.82,
          );
        } else {
          transform.rotation.set(0, angle, 0);
          transform.scale.setScalar(pollenScale);
        }
        transform.updateMatrix();
        pollen.current?.setMatrixAt(pollenIndex, transform.matrix);
      },
    );
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
    grainsPerAnther,
    isColumn,
    isLily,
    isPoppy,
    isRose,
    reproductiveRadiusScale,
    maturityScale,
    pollenPlacements,
    spread,
    stamenCount,
    stamenLength,
    seed,
    tuning.antherDepthScale,
    tuning.antherSizeScale,
    tuning.antherWidthScale,
    tuning.filamentRadiusScale,
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
  const styleBase =
    ovaryY +
    centerRadius *
      (isPoppy ? 0.43 : 0.16) *
      ovaryScale *
      tuning.ovaryHeightScale;
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
  const antherGrooveColor = getAntherGrooveColor(
    structure.antherColor,
    structure.pollenColor ?? "#d9a43b",
    isLily,
  );
  const ovaryRidgeCount =
    quality === "draft"
      ? Math.min(3, structure.stigmaLobes)
      : Math.min(10, Math.max(3, structure.stigmaLobes));

  useLayoutEffect(() => {
    if (!ovaryRidges.current) return;
    const transform = new THREE.Object3D();
    const ovaryRadius =
      centerRadius *
      (isColumn ? 0.22 : 0.34) *
      ovaryScale *
      tuning.ovaryWidthScale *
      ovaryGrowth;
    const ovaryHeight =
      centerRadius *
      (isColumn ? 0.58 : 0.42) *
      ovaryScale *
      tuning.ovaryHeightScale *
      ovaryHeightGrowth;

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
    tuning.ovaryHeightScale,
    tuning.ovaryWidthScale,
  ]);

  useLayoutEffect(() => {
    if (!stigmaPapillae.current) return;
    const transform = new THREE.Object3D();
    const headRadius =
      centerRadius *
      (isColumn ? 0.19 : isPoppy ? 0.28 : isLily ? 0.21 : 0.135) *
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
            (isColumn
              ? 0.08
              : isPoppy
                ? 0.038
                : isLily
                  ? 0.018 + dome * 0.018
                  : 0.105) *
            stigmaSize *
            (isLily ? 1 : dome),
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
    isLily,
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
          roughness={
            isRose
              ? THREE.MathUtils.lerp(0.92, 0.78, moisture)
              : THREE.MathUtils.lerp(0.9, 0.72, moisture)
          }
        />
      </instancedMesh>
      <instancedMesh
        ref={anthers}
        key={`anthers-${antherCount}`}
        visible={!isColumn}
        dispose={null}
        args={[undefined, undefined, antherCount]}
      >
        <primitive
          object={
            isLily
              ? lilyAntherGeometry
              : isRose
                ? roseAntherGeometry
                : antherGeometry
          }
          attach="geometry"
        />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : structure.antherColor}
          roughness={
            isRose
              ? THREE.MathUtils.lerp(0.98, 0.88, moisture)
              : getAntherRoughness(moisture, isLily)
          }
          normalMap={
            isLily
              ? getBotanicalMaterialTexture(
                  "center",
                  "microNormal",
                  textureResolution,
                  antherMaterialVariant,
                )
              : undefined
          }
          normalScale={new THREE.Vector2(isLily ? 0.2 : 1, isLily ? 0.2 : 1)}
          roughnessMap={
            isLily
              ? getBotanicalMaterialTexture(
                  "center",
                  "roughness",
                  textureResolution,
                  antherMaterialVariant,
                )
              : undefined
          }
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
        <meshStandardMaterial
          color={antherGrooveColor}
          roughness={0.98}
          normalMap={
            isLily
              ? getBotanicalMaterialTexture(
                  "center",
                  "microNormal",
                  textureResolution,
                  antherMaterialVariant,
                )
              : undefined
          }
          normalScale={new THREE.Vector2(isLily ? 0.11 : 1, isLily ? 0.11 : 1)}
        />
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
        {!isColumn && !isRose && (
          <mesh
            dispose={null}
            position={[0, ovaryY, 0]}
            scale={[
              centerRadius *
                0.34 *
                ovaryScale *
                tuning.ovaryWidthScale *
                ovaryGrowth,
              centerRadius *
                0.42 *
                ovaryScale *
                tuning.ovaryHeightScale *
                ovaryHeightGrowth,
              centerRadius *
                0.34 *
                ovaryScale *
                tuning.ovaryWidthScale *
                ovaryGrowth,
            ]}
          >
            <primitive
              object={isLily ? lilyOvaryGeometry : ovaryGeometry}
              attach="geometry"
            />
            <meshStandardMaterial
              color={lineDrawing ? "#111111" : stigmaColor.getStyle()}
              roughness={THREE.MathUtils.lerp(0.93, 0.78, moisture)}
              bumpMap={
                isLily
                  ? getBotanicalTexture("stem", textureResolution)
                  : undefined
              }
              bumpScale={isLily ? 0.008 : 0}
              normalMap={
                isLily
                  ? getBotanicalMaterialTexture(
                      "stem",
                      "microNormal",
                      textureResolution,
                      ovaryMaterialVariant,
                    )
                  : isPoppy
                    ? getBotanicalMaterialTexture(
                        "center",
                        "microNormal",
                        textureResolution,
                        "receptacle",
                      )
                    : isLotus
                      ? getBotanicalMaterialTexture(
                          "center",
                          "microNormal",
                          textureResolution,
                          "receptacle",
                        )
                      : undefined
              }
              normalScale={
                new THREE.Vector2(
                  isPoppy ? 0.035 : 0.07,
                  isPoppy ? 0.035 : 0.07,
                )
              }
              roughnessMap={
                isLily
                  ? getBotanicalMaterialTexture(
                      "stem",
                      "roughness",
                      textureResolution,
                      ovaryMaterialVariant,
                    )
                  : isPoppy
                    ? getBotanicalMaterialTexture(
                        "center",
                        "roughness",
                        textureResolution,
                        "receptacle",
                      )
                    : isLotus
                      ? getBotanicalMaterialTexture(
                          "center",
                          "roughness",
                          textureResolution,
                          "receptacle",
                        )
                      : undefined
              }
            />
          </mesh>
        )}

        {!lineDrawing && !isColumn && !isRose && (
          <instancedMesh
            ref={ovaryRidges}
            key={`ovary-ridges-${ovaryRidgeCount}`}
            dispose={null}
            args={[undefined, undefined, ovaryRidgeCount]}
          >
            <primitive object={ovaryRidgeGeometry} attach="geometry" />
            <meshStandardMaterial
              color={stigmaColor.clone().multiplyScalar(isPoppy ? 0.94 : 0.82)}
              roughness={THREE.MathUtils.lerp(0.94, 0.8, moisture)}
              normalMap={
                isLily
                  ? getBotanicalMaterialTexture(
                      "stem",
                      "microNormal",
                      textureResolution,
                      ovaryMaterialVariant,
                    )
                  : isPoppy
                    ? getBotanicalMaterialTexture(
                        "center",
                        "microNormal",
                        textureResolution,
                        "receptacle",
                      )
                    : isLotus
                      ? getBotanicalMaterialTexture(
                          "center",
                          "microNormal",
                          textureResolution,
                          "pit",
                        )
                      : undefined
              }
              normalScale={
                new THREE.Vector2(
                  isPoppy ? 0.028 : 0.055,
                  isPoppy ? 0.028 : 0.055,
                )
              }
              roughnessMap={
                isLily
                  ? getBotanicalMaterialTexture(
                      "stem",
                      "roughness",
                      textureResolution,
                      ovaryMaterialVariant,
                    )
                  : isPoppy
                    ? getBotanicalMaterialTexture(
                        "center",
                        "roughness",
                        textureResolution,
                        "receptacle",
                      )
                    : isLotus
                      ? getBotanicalMaterialTexture(
                          "center",
                          "roughness",
                          textureResolution,
                          "pit",
                        )
                      : undefined
              }
            />
          </instancedMesh>
        )}

        {isRose &&
          Array.from(
            { length: getRoseFreeStyleCount(quality) },
            (_, styleIndex) => {
              const styleCount = getRoseFreeStyleCount(quality);
              const variation = getRoseFreeStyleVariation(seed, styleIndex);
              const angle =
                (styleIndex / styleCount) * Math.PI * 2 +
                0.38 +
                variation.angleOffset;
              const offset = centerRadius * variation.radialSeat;
              const freeStyleLength = styleLength * variation.lengthScale;
              return (
                <group
                  key={`rose-free-style-${styleIndex}`}
                  position={[
                    Math.cos(angle) * offset,
                    styleBase,
                    Math.sin(angle) * offset,
                  ]}
                  rotation={[
                    Math.sin(angle) * variation.lean,
                    0,
                    -Math.cos(angle) * variation.lean,
                  ]}
                >
                  <mesh
                    dispose={null}
                    position={[0, freeStyleLength * 0.5, 0]}
                    scale={[
                      centerRadius * 0.012,
                      freeStyleLength * 0.5,
                      centerRadius * 0.012,
                    ]}
                  >
                    <primitive object={styleGeometry} attach="geometry" />
                    {lineDrawing ? (
                      <meshBasicMaterial color="#ffffff" />
                    ) : (
                      <meshPhysicalMaterial
                        color={stigmaColor.getStyle()}
                        roughness={0.8}
                        specularIntensity={0.06}
                      />
                    )}
                  </mesh>
                  <mesh
                    dispose={null}
                    position={[0, freeStyleLength, 0]}
                    scale={centerRadius * 0.024 * variation.stigmaScale}
                  >
                    <primitive object={stigmaHeadGeometry} attach="geometry" />
                    {lineDrawing ? (
                      <meshBasicMaterial color="#ffffff" />
                    ) : (
                      <meshPhysicalMaterial
                        color={stigmaColor.getStyle()}
                        roughness={0.86}
                        specularIntensity={0.05}
                      />
                    )}
                  </mesh>
                </group>
              );
            },
          )}
        <mesh
          dispose={null}
          visible={!isRose}
          position={[
            0,
            styleBase +
              styleLength * 0.5 +
              (isColumn
                ? centerRadius * orchidColumnPose.verticalOffsetScale
                : 0),
            isColumn ? centerRadius * orchidColumnPose.forwardOffsetScale : 0,
          ]}
          rotation={isColumn ? [orchidColumnPose.tilt, 0, 0] : undefined}
          scale={[
            isColumn
              ? centerRadius * orchidColumnPose.widthScale * stigmaSize
              : centerRadius * 0.04,
            isColumn
              ? styleLength * orchidColumnPose.lengthScale
              : styleLength * 0.5,
            isColumn
              ? centerRadius * orchidColumnPose.depthScale * stigmaSize
              : centerRadius * 0.04,
          ]}
        >
          <primitive
            object={
              isColumn
                ? columnGeometry
                : isLily
                  ? lilyStyleGeometry
                  : styleGeometry
            }
            attach="geometry"
          />
          {lineDrawing ? (
            <meshBasicMaterial color="#ffffff" />
          ) : (
            <meshPhysicalMaterial
              color={stigmaColor.getStyle()}
              roughness={THREE.MathUtils.lerp(0.78, 0.62, moisture)}
              specularIntensity={0.12}
              clearcoat={0.08 * moisture}
              clearcoatRoughness={0.42}
              bumpMap={
                isLily
                  ? getBotanicalTexture("stem", textureResolution)
                  : undefined
              }
              bumpScale={isLily ? 0.004 : 0}
              normalMap={
                isLily
                  ? getBotanicalMaterialTexture(
                      "stem",
                      "microNormal",
                      textureResolution,
                      ovaryMaterialVariant,
                    )
                  : isColumn
                    ? getBotanicalMaterialTexture(
                        "center",
                        "microNormal",
                        textureResolution,
                      )
                    : undefined
              }
              normalScale={
                new THREE.Vector2(
                  isLily ? 0.04 : isColumn ? 0.018 : 1,
                  isLily ? 0.04 : isColumn ? 0.018 : 1,
                )
              }
              roughnessMap={
                isLily
                  ? getBotanicalMaterialTexture(
                      "stem",
                      "roughness",
                      textureResolution,
                      ovaryMaterialVariant,
                    )
                  : isColumn
                    ? getBotanicalMaterialTexture(
                        "center",
                        "roughness",
                        textureResolution,
                      )
                    : undefined
              }
            />
          )}
        </mesh>

        {!isColumn && !isRose && (
          <mesh
            dispose={null}
            position={[
              0,
              isPoppy
                ? pistilHeight + poppyStigmaDisk.verticalOffset
                : isLily
                  ? pistilHeight - centerRadius * 0.018
                  : pistilHeight - 0.035,
              0,
            ]}
            scale={[
              centerRadius *
                (isPoppy ? poppyStigmaDisk.radiusScale : isLily ? 0.24 : 0.2) *
                stigmaSize *
                stigmaScale,
              centerRadius *
                (isPoppy
                  ? poppyStigmaDisk.thicknessScale
                  : isLily
                    ? 0.11
                    : 0.144) *
                stigmaSize *
                stigmaScale,
              centerRadius *
                (isPoppy ? poppyStigmaDisk.radiusScale : isLily ? 0.24 : 0.2) *
                stigmaSize *
                stigmaScale,
            ]}
          >
            <primitive
              object={
                isPoppy
                  ? poppyStigmaDiskGeometry
                  : isLily
                    ? lilyStigmaGeometry
                    : stigmaHeadGeometry
              }
              attach="geometry"
            />
            {lineDrawing ? (
              <meshBasicMaterial color="#ffffff" />
            ) : (
              <meshPhysicalMaterial
                color={structure.stigmaColor}
                roughness={THREE.MathUtils.lerp(0.92, 0.66, moisture)}
                specularIntensity={0.08}
                clearcoat={0.1 * moisture}
                clearcoatRoughness={0.42}
                normalMap={getBotanicalMaterialTexture(
                  "center",
                  "microNormal",
                  textureResolution,
                )}
                normalScale={new THREE.Vector2(0.014, 0.014)}
                roughnessMap={getBotanicalMaterialTexture(
                  "center",
                  "roughness",
                  textureResolution,
                )}
              />
            )}
            {lineDrawing && <Edges color="#111111" threshold={18} />}
          </mesh>
        )}

        {isColumn && (
          <group
            position={[
              0,
              pistilHeight +
                centerRadius *
                  (0.065 * stigmaSize * stigmaScale +
                    orchidColumnPose.verticalOffsetScale),
              centerRadius * orchidColumnPose.forwardOffsetScale,
            ]}
            rotation={[orchidColumnPose.tilt, 0, 0]}
            scale={[polliniumEmergence, polliniumEmergence, polliniumEmergence]}
          >
            {([-1, 1] as const).map((polliniumSide) => (
              <group
                key={`pollinium-${polliniumSide}`}
                position={[
                  polliniumSide *
                    centerRadius *
                    orchidPolliniumPose.separationScale,
                  -centerRadius * 0.018,
                  centerRadius * 0.012,
                ]}
                rotation={[0.08, 0, polliniumSide * -0.06]}
              >
                <mesh
                  dispose={null}
                  scale={[
                    centerRadius * orchidPolliniumPose.widthScale,
                    centerRadius * orchidPolliniumPose.heightScale,
                    centerRadius * orchidPolliniumPose.depthScale,
                  ]}
                >
                  <primitive object={polliniumGeometry} attach="geometry" />
                  {lineDrawing ? (
                    <meshBasicMaterial color="#ffffff" />
                  ) : (
                    <meshPhysicalMaterial
                      color={orchidPolliniumColor}
                      roughness={THREE.MathUtils.lerp(0.94, 0.82, moisture)}
                      specularIntensity={0.04}
                      clearcoat={0.02 * moisture}
                      clearcoatRoughness={0.5}
                      normalMap={getBotanicalMaterialTexture(
                        "center",
                        "microNormal",
                        textureResolution,
                      )}
                      normalScale={new THREE.Vector2(0.024, 0.024)}
                      roughnessMap={getBotanicalMaterialTexture(
                        "center",
                        "roughness",
                        textureResolution,
                      )}
                    />
                  )}
                  {lineDrawing && <Edges color="#111111" threshold={18} />}
                </mesh>
                <mesh
                  visible={lineDrawing}
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

        {!lineDrawing && !isColumn && (
          <instancedMesh
            ref={stigmaPapillae}
            visible={!isPoppy && !isRose}
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
              normalMap={getBotanicalMaterialTexture(
                "center",
                "microNormal",
                textureResolution,
              )}
              normalScale={new THREE.Vector2(0.016, 0.016)}
              roughnessMap={getBotanicalMaterialTexture(
                "center",
                "roughness",
                textureResolution,
              )}
            />
          </instancedMesh>
        )}

        {!isColumn &&
          !isLily &&
          !isRose &&
          Array.from({ length: structure.stigmaLobes }, (_, index) => {
            const angle = (index / structure.stigmaLobes) * Math.PI * 2;
            const radius =
              centerRadius *
              (isPoppy ? poppyStigmaDisk.rayRadiusScale : 0.07) *
              stigmaSize;
            return (
              <mesh
                key={index}
                position={[
                  Math.cos(angle) * radius,
                  pistilHeight +
                    (isPoppy ? poppyStigmaDisk.crownOffset : 0.025),
                  Math.sin(angle) * radius,
                ]}
                rotation={[0, -angle, Math.PI / 2]}
                scale={[
                  (isPoppy ? poppyStigmaDisk.rayWidth : 0.01) * stigmaSize,
                  centerRadius *
                    (isPoppy ? poppyStigmaDisk.rayLengthScale : 0.08) *
                    stigmaSize,
                  (isPoppy ? poppyStigmaDisk.rayDepth : 0.014) * stigmaSize,
                ]}
              >
                <primitive
                  object={isPoppy ? poppyStigmaRayGeometry : stigmaLobeGeometry}
                  attach="geometry"
                />
                <meshStandardMaterial
                  color={
                    lineDrawing
                      ? "#111111"
                      : isPoppy
                        ? stigmaColor.clone().multiplyScalar(0.42).getStyle()
                        : stigmaColor.getStyle()
                  }
                  roughness={THREE.MathUtils.lerp(0.92, 0.72, moisture)}
                />
              </mesh>
            );
          })}
      </group>
    </group>
  );
}
