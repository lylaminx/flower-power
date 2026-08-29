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
  createPetioleGeometry,
  getAerialRootTipPose,
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
  getStemMaterialVariant,
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
import { getHeroMainStemColor } from "@/lib/flower-color-tuning";

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
  const mainStemColor = useMemo(
    () =>
      `#${getHeroMainStemColor(
        settings.preset,
        settings.stemColor,
      ).getHexString()}`,
    [settings.preset, settings.stemColor],
  );
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
            stemTuning.topBendX * 0.22 +
            stemTuning.headLoadBendX * bloomLoad.normalizedLoad,
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
      settings.preset === "Lotus"
        ? 0
        : settings.preset === "Orchid"
          ? 2
          : Math.round(
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
        index * 2.399963 + seededRandom(settings.seed + index * 509) * 1.05;
      const reach = THREE.MathUtils.lerp(
        0.38,
        0.82,
        seededRandom(settings.seed + index * 887 + 31),
      );
      const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const emergence = base
        .clone()
        .addScaledVector(radial, 0.025 + index * 0.009)
        .add(new THREE.Vector3(0, (index - 2) * 0.018, 0));
      return new THREE.CatmullRomCurve3([
        emergence,
        emergence
          .clone()
          .addScaledVector(radial, reach * 0.18)
          .add(
            new THREE.Vector3(
              Math.sin(angle * 1.3) * 0.035,
              0.045 - index * 0.018,
              Math.cos(angle * 1.7) * 0.025,
            ),
          ),
        emergence
          .clone()
          .addScaledVector(radial, reach * 0.58)
          .add(
            new THREE.Vector3(
              Math.sin(angle * 1.7) * 0.08,
              -0.07 - index * 0.028,
              Math.cos(angle * 1.3) * 0.06,
            ),
          ),
        emergence
          .clone()
          .addScaledVector(radial, reach)
          .add(
            new THREE.Vector3(
              Math.sin(angle * 1.7) * 0.14,
              -0.2 - index * 0.052,
              Math.cos(angle * 1.3) * 0.1,
            ),
          ),
      ]);
    });
  }, [settings.seed, stemPath, stemTuning.aerialRootCount]);
  const lotusLeafScapes = useMemo(() => {
    if (settings.preset !== "Lotus") return [];
    const base = stemPath.getPointAt(0.035);
    const side = seededRandom(settings.seed + 4_217) > 0.5 ? 1 : -1;
    return [0, 1].map((index) => {
      const direction = index === 0 ? side : -side;
      const endpoint = new THREE.Vector3(
        direction *
          THREE.MathUtils.lerp(
            index === 0 ? 1.15 : 1.7,
            index === 0 ? 1.48 : 2.05,
            seededRandom(settings.seed + 7_109 + index * 613),
          ),
        index === 0 ? -2.48 : -2.63,
        THREE.MathUtils.lerp(
          index === 0 ? -0.32 : -0.85,
          index === 0 ? 0.38 : -0.38,
          seededRandom(settings.seed + 9_131 + index * 947),
        ),
      );
      return new THREE.CatmullRomCurve3([
        base
          .clone()
          .add(new THREE.Vector3(direction * (0.04 + index * 0.05), 0, 0)),
        base
          .clone()
          .lerp(endpoint, 0.3)
          .add(new THREE.Vector3(direction * 0.08, 0.06, index * -0.05)),
        base
          .clone()
          .lerp(endpoint, 0.7)
          .add(new THREE.Vector3(direction * 0.12, 0.04, index * -0.08)),
        endpoint,
      ]);
    });
  }, [settings.preset, settings.seed, stemPath]);

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
            color={mainStemColor}
            vertexColors
            roughness={
              photorealistic && settings.preset === "Lotus" ? 0.76 : 0.84
            }
            specularIntensity={
              photorealistic && settings.preset === "Lotus" ? 0.18 : 0.12
            }
            sheen={0}
            bumpMap={getBotanicalTexture("stem", textureResolution)}
            bumpScale={
              settings.preset === "Lotus"
                ? 0.018
                : settings.preset === "Poppy"
                  ? 0.022
                  : settings.preset === "Lily"
                    ? 0.02
                    : settings.preset === "Orchid"
                      ? 0.018
                      : 0.035
            }
            normalMap={getBotanicalMaterialTexture(
              "stem",
              "microNormal",
              textureResolution,
              getStemMaterialVariant(settings.preset),
            )}
            normalScale={
              settings.preset === "Poppy" ||
              settings.preset === "Lily" ||
              settings.preset === "Orchid"
                ? new THREE.Vector2(0.12, 0.12)
                : new THREE.Vector2(0.16, 0.16)
            }
            roughnessMap={getBotanicalMaterialTexture(
              "stem",
              "roughness",
              textureResolution,
              getStemMaterialVariant(settings.preset),
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
        color={mainStemColor}
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
        materialVariant={getStemMaterialVariant(settings.preset)}
      />

      {lotusLeafScapes.map((scape, index) => (
        <mesh key={`lotus-leaf-scape-${index}`}>
          <primitive
            object={createPetioleGeometry(
              scape,
              (index === 0 ? 0.046 : 0.04) * settings.stemThickness,
              (index === 0 ? 0.037 : 0.032) * settings.stemThickness,
              0,
              quality === "draft" ? 20 : quality === "ultra" ? 40 : 30,
              quality === "draft" ? 7 : 10,
            )}
            attach="geometry"
          />
          {lineDrawing ? (
            <meshBasicMaterial color="#ffffff" />
          ) : (
            <meshPhysicalMaterial
              color={settings.stemColor}
              roughness={0.84}
              specularIntensity={0.12}
              bumpMap={getBotanicalTexture("stem", textureResolution)}
              bumpScale={0.018}
            />
          )}
          {lineDrawing && <Edges color="#111111" threshold={18} />}
        </mesh>
      ))}

      {aerialRoots.map((root, index) => {
        const rootRadius = THREE.MathUtils.lerp(
          0.027,
          0.044,
          seededRandom(settings.seed + index * 1_103),
        );
        const tip = getAerialRootTipPose(root, rootRadius);
        return (
          <group key={`aerial-root-${index}`}>
            <mesh>
              <primitive
                object={createPetioleGeometry(
                  root,
                  rootRadius,
                  rootRadius * 0.72,
                  0,
                  quality === "draft" ? 14 : quality === "ultra" ? 32 : 22,
                  quality === "draft" ? 6 : 9,
                )}
                attach="geometry"
              />
              {lineDrawing ? (
                <meshBasicMaterial color="#ffffff" />
              ) : (
                <meshPhysicalMaterial
                  color={`#${new THREE.Color("#b7bca9")
                    .lerp(
                      new THREE.Color("#879b82"),
                      seededRandom(settings.seed + index * 719),
                    )
                    .getHexString()}`}
                  roughness={0.92}
                  bumpMap={getBotanicalTexture("stem", textureResolution)}
                  bumpScale={0.022}
                  normalMap={getBotanicalMaterialTexture(
                    "stem",
                    "microNormal",
                    textureResolution,
                    "velamen",
                  )}
                  normalScale={new THREE.Vector2(0.1, 0.1)}
                  roughnessMap={getBotanicalMaterialTexture(
                    "stem",
                    "roughness",
                    textureResolution,
                    "velamen",
                  )}
                />
              )}
              {lineDrawing && <Edges color="#111111" threshold={18} />}
            </mesh>
            <mesh
              position={tip.position}
              quaternion={new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                tip.direction,
              )}
              scale={[tip.radialScale, tip.lengthScale, tip.radialScale]}
            >
              <sphereGeometry args={[1, 14, 9]} />
              {lineDrawing ? (
                <meshBasicMaterial color="#ffffff" />
              ) : (
                <meshStandardMaterial
                  color={`#${new THREE.Color("#78956a")
                    .lerp(
                      new THREE.Color("#9cab87"),
                      seededRandom(settings.seed + index * 433),
                    )
                    .getHexString()}`}
                  roughness={0.86}
                />
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
          azimuth={attachment.azimuth}
          visualScale={
            settings.preset === "Rose" && attachment.t > 0.65 ? 0.82 : 1
          }
        />
      ))}

      {lotusLeafScapes.map((scape, index) => (
        <FlowerLeaf
          key={`lotus-leaf-${index}`}
          side={index === 0 ? 1 : -1}
          attachment={scape.getPointAt(1)}
          stemTangent={scape.getTangentAt(1)}
          attachmentT={0.08 + index * 0.11}
        />
      ))}

      {settings.preset === "Lotus" && !lineDrawing && (
        <group position={[0, -2.68, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[28, quality === "draft" ? 96 : 192]} />
            <meshPhysicalMaterial
              color="#5e9d98"
              roughness={0.26}
              specularIntensity={0.58}
              clearcoat={0.42}
              clearcoatRoughness={0.18}
              transmission={0.08}
              normalMap={getBotanicalMaterialTexture(
                "center",
                "microNormal",
                textureResolution,
              )}
              normalScale={new THREE.Vector2(0.045, 0.045)}
              transparent
              opacity={0.7}
              depthWrite
            />
          </mesh>
        </group>
      )}

      {structure.inflorescenceArchitecture === "spike" ||
      structure.inflorescenceArchitecture === "cluster" ? (
        <FlowerInflorescence structure={structure} />
      ) : (
        <group
          scale={stemTuning.bloomScale}
          rotation={[
            0.72 +
              settings.bloomTilt +
              stemTuning.bloomPitchBias +
              bloomLoad.bloomDroop +
              stemTuning.budNod *
                (1 - growth.openness) *
                THREE.MathUtils.lerp(1, 0.72, growth.wilt),
            settings.bloomTurn + stemTuning.bloomYawBias,
            -0.42 + stemTuning.bloomRollBias + bloomLoad.individualLean * 0.4,
          ]}
        >
          <FlowerBloom structure={structure} />
        </group>
      )}
    </group>
  );
}
