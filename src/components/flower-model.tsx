"use client";

import { Edges } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { FlowerBloom } from "./flower-bloom";
import { FlowerInflorescence } from "./flower-inflorescence";
import { FlowerLeaf } from "./flower-leaf";
import { FlowerStemDetails } from "./flower-stem-details";
import {
  createLeafAttachments,
  seededRandom,
  createTaperedStem,
} from "@/lib/flower-geometry";
import {
  warmLeafGeometry,
  warmStemGeometry,
} from "@/lib/geometry-worker-client";
import {
  getBotanicalMaterialTexture,
  getBotanicalTexture,
} from "@/lib/botanical-textures";
import { flowerSpecies } from "@/lib/flower-species";
import {
  getFlowerGrowthState,
  getFlowerPhaseTuning,
} from "@/lib/flower-growth";
import { getHeroLeafTuning } from "@/lib/flower-leaf-tuning";
import { getHeroStemTuning } from "@/lib/flower-stem-tuning";
import { useFlowerStore } from "@/lib/flower-store";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import { getBloomLoadResponse } from "@/lib/flower-physics";

export function FlowerModel() {
  const settings = useFlowerStore();
  const quality = useRenderQuality();
  const textureResolution = getTextureResolution(quality);
  const lineDrawing = settings.renderMode === "line";
  const photorealistic = settings.renderMode === "photo";
  const structure = flowerSpecies[settings.preset];
  const leafTuning = getHeroLeafTuning(settings.preset, structure);
  const stemTuning = getHeroStemTuning(settings.preset, structure);
  const growth = getFlowerGrowthState(settings.bloom, settings.petalAge);
  const phaseTuning = getFlowerPhaseTuning(growth.phase);
  const bloomLoad = getBloomLoadResponse(structure, settings);
  const stemRelax = THREE.MathUtils.lerp(
    1,
    0.9,
    growth.wilt * phaseTuning.wiltScale,
  );
  const stemPath = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(
          stemTuning.topBendX * 0.4,
          -4.35 * settings.stemHeight * stemTuning.stemHeightScale * stemRelax,
          stemTuning.topBendZ * 0.4,
        ),
        new THREE.Vector3(
          -settings.stemCurve *
            0.42 *
            stemTuning.curveScale *
            bloomLoad.stemFlex +
            bloomLoad.individualLean +
            stemTuning.midBendX * 0.45,
          -2.9 * settings.stemHeight * stemTuning.stemHeightScale * stemRelax,
          0.03 + stemTuning.midBendZ * 0.45,
        ),
        new THREE.Vector3(
          settings.stemCurve *
            0.38 *
            stemTuning.curveScale *
            bloomLoad.stemFlex -
            bloomLoad.individualLean * 0.35 +
            stemTuning.topBendX * 0.22,
          -1.35 * settings.stemHeight * stemTuning.stemHeightScale * stemRelax,
          -0.03 + stemTuning.topBendZ * 0.22,
        ),
        new THREE.Vector3(
          stemTuning.topBendX * 0.08,
          -0.08 - growth.wilt * 0.04,
          stemTuning.topBendZ * 0.08,
        ),
      ]),
    [
      bloomLoad,
      growth.wilt,
      settings.stemCurve,
      settings.stemHeight,
      stemRelax,
      stemTuning,
    ],
  );
  const stemGeometry = useMemo(
    () =>
      createTaperedStem(
        stemPath,
        settings.stemThickness *
          stemTuning.stemThicknessScale *
          THREE.MathUtils.lerp(0.96, 1.02, phaseTuning.moistureScale),
        settings.stemTaper * stemTuning.stemTaperScale,
        structure.stemEccentricity,
        structure.stemRibbing,
        settings.seed,
      ),
    [
      settings.seed,
      settings.stemTaper,
      settings.stemThickness,
      phaseTuning.moistureScale,
      stemPath,
      stemTuning,
      structure.stemEccentricity,
      structure.stemRibbing,
    ],
  );
  const leafPairCount = Math.max(
    0,
    Math.min(
      6,
      Math.round(
        (structure.leafPairs ?? 1) *
          settings.leafDensity *
          leafTuning.attachmentScale,
      ),
    ),
  );
  const leafAttachments = useMemo(
    () =>
      createLeafAttachments(
        stemPath,
        leafPairCount,
        leafTuning.attachmentStart,
        leafTuning.attachmentEnd,
        leafTuning.leafArrangement,
      ),
    [
      leafPairCount,
      leafTuning.attachmentEnd,
      leafTuning.attachmentStart,
      leafTuning.leafArrangement,
      stemPath,
    ],
  );
  const aerialRoots = useMemo(() => {
    const base = stemPath.getPointAt(0.045);
    return Array.from({ length: stemTuning.aerialRootCount }, (_, index) => {
      const angle =
        (index / Math.max(1, stemTuning.aerialRootCount)) * Math.PI * 2 +
        seededRandom(settings.seed + index * 509) * 0.7;
      const reach = THREE.MathUtils.lerp(
        0.42,
        0.7,
        seededRandom(settings.seed + index * 887 + 31),
      );
      const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      return new THREE.CatmullRomCurve3([
        base.clone(),
        base
          .clone()
          .addScaledVector(radial, reach * 0.2)
          .add(new THREE.Vector3(0, -0.025, 0)),
        base
          .clone()
          .addScaledVector(radial, reach * 0.62)
          .add(new THREE.Vector3(0, -0.1, 0)),
        base
          .clone()
          .addScaledVector(radial, reach)
          .add(new THREE.Vector3(0, -0.24 - index * 0.035, 0)),
      ]);
    });
  }, [settings.seed, stemPath, stemTuning.aerialRootCount]);

  useEffect(() => {
    warmStemGeometry({
      curve: stemPath,
      thickness: settings.stemThickness * stemTuning.stemThicknessScale,
      taper: settings.stemTaper * stemTuning.stemTaperScale,
      eccentricity: structure.stemEccentricity,
      ribbing: structure.stemRibbing,
      seed: settings.seed,
    });

    leafAttachments.forEach((attachment) => {
      const leafSeed =
        settings.seed + attachment.side * 17 + attachment.t * 3100;
      const leafAsymmetry =
        settings.leafAsymmetry *
        leafTuning.asymmetryScale *
        (seededRandom(
          settings.seed + attachment.side * 211 + attachment.t * 1709,
        ) -
          0.5) *
        2;
      warmLeafGeometry(
        structure.leafWidth * leafTuning.leafWidthScale,
        leafSeed,
        leafTuning.leafShape ?? structure.leafShape,
        (structure.leafSerration ?? 0.07) * settings.leafSerration,
        settings.leafCurl * leafTuning.curlScale,
        leafAsymmetry,
      );
    });
  }, [
    leafAttachments,
    settings.seed,
    settings.stemThickness,
    settings.stemTaper,
    stemTuning.stemTaperScale,
    stemTuning.stemThicknessScale,
    settings.leafCurl,
    settings.leafAsymmetry,
    settings.leafSerration,
    leafTuning,
    structure.leafShape,
    structure.leafSerration,
    structure.leafWidth,
    structure.stemEccentricity,
    structure.stemRibbing,
    stemPath,
  ]);

  return (
    <group position={[0, 1.35, 0]} rotation={[0.04, 0, -0.06]}>
      <mesh geometry={stemGeometry}>
        {lineDrawing ? (
          <meshBasicMaterial color="#ffffff" />
        ) : (
          <meshPhysicalMaterial
            color={settings.stemColor}
            vertexColors
            roughness={photorealistic ? 0.84 : 0.91}
            specularIntensity={photorealistic ? 0.12 : 0.05}
            sheen={0}
            bumpMap={getBotanicalTexture("stem", textureResolution)}
            bumpScale={0.035}
            normalMap={getBotanicalMaterialTexture(
              "stem",
              "microNormal",
              textureResolution,
            )}
            normalScale={new THREE.Vector2(0.16, 0.16)}
            roughnessMap={getBotanicalMaterialTexture(
              "stem",
              "roughness",
              textureResolution,
            )}
          />
        )}
        {lineDrawing && <Edges color="#111111" threshold={16} />}
      </mesh>

      <mesh name="stem-center-wire">
        <tubeGeometry
          args={[stemPath, 72, 0.014 * settings.stemThickness, 6, false]}
        />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : "#203c2a"}
          roughness={1}
        />
      </mesh>

      <FlowerStemDetails
        curve={stemPath}
        color={settings.stemColor}
        lineDrawing={lineDrawing}
        hairiness={
          (structure.stemHairiness ?? 1) *
          settings.stemHairDensity *
          THREE.MathUtils.lerp(1, 0.76, growth.wilt * phaseTuning.wiltScale)
        }
        nodeCount={Math.max(
          0,
          Math.round(
            settings.stemNodeCount *
              THREE.MathUtils.lerp(1, 0.9, growth.wilt * phaseTuning.wiltScale),
          ),
        )}
        leafAttachments={leafAttachments}
        seed={settings.seed}
        tuning={stemTuning}
      />

      {aerialRoots.map((root, index) => {
        const tip = root.getPointAt(1);
        return (
          <group key={`aerial-root-${index}`}>
            <mesh>
              <tubeGeometry
                args={[
                  root,
                  quality === "draft" ? 14 : quality === "ultra" ? 32 : 22,
                  0.035,
                  quality === "draft" ? 6 : 9,
                  false,
                ]}
              />
              {lineDrawing ? (
                <meshBasicMaterial color="#ffffff" />
              ) : (
                <meshPhysicalMaterial
                  color="#aeb9a1"
                  roughness={0.92}
                  bumpMap={getBotanicalTexture("stem", textureResolution)}
                  bumpScale={0.022}
                  normalMap={getBotanicalMaterialTexture(
                    "stem",
                    "microNormal",
                    textureResolution,
                  )}
                  normalScale={new THREE.Vector2(0.1, 0.1)}
                />
              )}
              {lineDrawing && <Edges color="#111111" threshold={18} />}
            </mesh>
            <mesh position={tip} scale={[0.04, 0.055, 0.04]}>
              <sphereGeometry args={[1, 10, 7]} />
              {lineDrawing ? (
                <meshBasicMaterial color="#ffffff" />
              ) : (
                <meshStandardMaterial color="#78956a" roughness={0.86} />
              )}
              {lineDrawing && <Edges color="#111111" threshold={18} />}
            </mesh>
          </group>
        );
      })}

      {leafAttachments.map((attachment) => (
        <FlowerLeaf
          key={`${attachment.side}-${attachment.t}`}
          side={attachment.side}
          attachment={attachment.point}
          stemTangent={attachment.tangent}
          attachmentT={attachment.t}
        />
      ))}

      {structure.inflorescenceArchitecture === "spike" ||
      structure.inflorescenceArchitecture === "cluster" ? (
        <FlowerInflorescence structure={structure} />
      ) : (
        <group
          rotation={[
            0.72 +
              settings.bloomTilt +
              bloomLoad.bloomDroop +
              stemTuning.budNod *
                (1 - growth.openness) *
                THREE.MathUtils.lerp(1, 0.72, growth.wilt),
            settings.bloomTurn,
            -0.42 + bloomLoad.individualLean * 0.4,
          ]}
        >
          <FlowerBloom structure={structure} />
        </group>
      )}
    </group>
  );
}
