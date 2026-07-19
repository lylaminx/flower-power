"use client";

import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import {
  createLeafGeometry,
  createLeafVeinNetwork,
  seededRandom,
} from "@/lib/flower-geometry";
import {
  getBotanicalAgeTexture,
  getBotanicalMaterialTexture,
  getBotanicalTexture,
} from "@/lib/botanical-textures";
import { flowerSpecies } from "@/lib/flower-species";
import { getHeroLeafTuning } from "@/lib/flower-leaf-tuning";
import {
  getFlowerGrowthState,
  getFlowerPhaseTuning,
} from "@/lib/flower-growth";
import { useFlowerStore } from "@/lib/flower-store";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import { useShallow } from "zustand/react/shallow";

export function FlowerLeaf({
  side,
  attachment,
  attachmentT,
}: {
  side: number;
  attachment: THREE.Vector3;
  attachmentT: number;
}) {
  const settings = useFlowerStore(
    useShallow((state) => ({
      renderMode: state.renderMode,
      preset: state.preset,
      seed: state.seed,
      stemColor: state.stemColor,
      leafLength: state.leafLength,
      leafWidth: state.leafWidth,
      leafCurl: state.leafCurl,
      leafSerration: state.leafSerration,
      leafVeinDensity: state.leafVeinDensity,
      leafDroop: state.leafDroop,
      leafAsymmetry: state.leafAsymmetry,
      leafAge: state.leafAge,
      bloom: state.bloom,
    })),
  );
  const textureResolution = getTextureResolution(useRenderQuality());
  const lineDrawing = settings.renderMode === "line";
  const photorealistic = settings.renderMode === "photo";
  const structure = flowerSpecies[settings.preset];
  const tuning = getHeroLeafTuning(settings.preset, structure);
  const growth = getFlowerGrowthState(settings.bloom, settings.leafAge);
  const phaseTuning = getFlowerPhaseTuning(growth.phase);
  const leafMoisture = THREE.MathUtils.clamp(
    growth.moisture * phaseTuning.moistureScale,
    0,
    1,
  );
  const leafDroop = settings.leafDroop * 0.68 + growth.wilt * 0.44;
  const geometry = useMemo(
    () =>
      createLeafGeometry(
        structure.leafWidth *
          tuning.leafWidthScale *
          THREE.MathUtils.lerp(0.92, 1.03, leafMoisture),
        settings.seed + side * 17 + attachmentT * 3100,
        tuning.leafShape ?? structure.leafShape,
        (structure.leafSerration ?? 0.07) *
          settings.leafSerration *
          tuning.serrationScale *
          THREE.MathUtils.lerp(0.88, 1, phaseTuning.moistureScale),
        settings.leafCurl *
          tuning.curlScale *
          THREE.MathUtils.lerp(0.9, 1.06, leafMoisture),
        settings.leafAsymmetry *
          tuning.asymmetryScale *
          (seededRandom(settings.seed + side * 211 + attachmentT * 1709) -
            0.5) *
          2,
      ),
    [
      attachmentT,
      leafMoisture,
      structure,
      phaseTuning,
      tuning,
      settings.leafCurl,
      settings.leafAsymmetry,
      settings.leafSerration,
      settings.seed,
      side,
    ],
  );
  const leafColor = useMemo(
    () =>
      `#${new THREE.Color(settings.stemColor)
        .lerp(
          new THREE.Color("#77733c"),
          settings.leafAge * 0.55 +
            tuning.leafColorMix * 0.06 +
            growth.wilt * 0.12,
        )
        .getHexString()}`,
    [growth.wilt, settings.leafAge, settings.stemColor, tuning.leafColorMix],
  );
  const midrib = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.16, 0.025),
        new THREE.Vector3(0, 0.25, 0.04),
        new THREE.Vector3(0, 0.72, 0.09),
        new THREE.Vector3(0, 1.28, 0.025),
      ]),
    [],
  );
  const veinNetwork = useMemo(
    () =>
      createLeafVeinNetwork(
        structure.leafWidth * tuning.leafWidthScale,
        tuning.leafShape ?? structure.leafShape,
        settings.leafVeinDensity * tuning.veinDensityScale,
        settings.seed + attachmentT * 1877 + side * 43,
      ),
    [
      attachmentT,
      settings.leafVeinDensity,
      settings.seed,
      side,
      tuning,
      structure.leafShape,
      structure.leafWidth,
    ],
  );
  const petiole = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.13 * tuning.petioleScale, 0.012),
        new THREE.Vector3(0, 0.3 * tuning.petioleScale, 0.03),
      ]),
    [tuning.petioleScale],
  );

  return (
    <group
      position={[
        attachment.x,
        attachment.y + tuning.attachmentShift,
        attachment.z,
      ]}
      rotation={[
        0.18 + leafDroop * 0.28 + tuning.droopBias + tuning.bladePitch,
        side * (0.5 + tuning.bladeYaw),
        side * (-0.88 - leafDroop * 0.48 + tuning.bladeRoll),
      ]}
      scale={[
        side *
          settings.leafWidth *
          tuning.leafWidthScale *
          THREE.MathUtils.lerp(0.94, 1.04, leafMoisture),
        settings.leafLength *
          tuning.leafLengthScale *
          THREE.MathUtils.lerp(0.92, 1.02, leafMoisture),
        1,
      ]}
    >
      <mesh dispose={null}>
        <tubeGeometry
          args={[petiole, 14, 0.018 * tuning.petioleScale, 7, false]}
        />
        <meshStandardMaterial
          color={lineDrawing ? "#111111" : settings.stemColor}
          roughness={0.84}
          bumpMap={
            lineDrawing
              ? undefined
              : getBotanicalTexture("stem", textureResolution)
          }
          bumpScale={0.018}
          roughnessMap={
            lineDrawing
              ? undefined
              : getBotanicalMaterialTexture(
                  "stem",
                  "roughness",
                  textureResolution,
                )
          }
        />
      </mesh>
      <group position={[0, 0.26 + tuning.petioleLift, 0]}>
        <mesh dispose={null} geometry={geometry}>
          {lineDrawing ? (
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
          ) : (
            <meshPhysicalMaterial
              color={leafColor}
              map={getBotanicalAgeTexture(
                "leaf",
                settings.leafAge,
                settings.seed + attachmentT * 3100 + side * 17,
                textureResolution,
              )}
              vertexColors
              side={THREE.FrontSide}
              roughness={photorealistic ? 0.8 : 0.88}
              specularIntensity={photorealistic ? 0.14 : 0.06}
              sheen={0}
              clearcoat={photorealistic ? 0.12 * leafMoisture : 0}
              clearcoatRoughness={0.38}
              clearcoatMap={getBotanicalMaterialTexture(
                "leaf",
                "moisture",
                textureResolution,
              )}
              bumpMap={getBotanicalTexture("leaf", textureResolution)}
              bumpScale={0.022}
              normalMap={getBotanicalMaterialTexture(
                "leaf",
                "microNormal",
                textureResolution,
              )}
              normalScale={new THREE.Vector2(0.14, 0.14)}
              roughnessMap={getBotanicalMaterialTexture(
                "leaf",
                "roughness",
                textureResolution,
              )}
              transmission={photorealistic ? 0.045 * leafMoisture : 0}
              thickness={0.045 * tuning.leafWidthScale * leafMoisture}
              thicknessMap={getBotanicalMaterialTexture(
                "leaf",
                "thickness",
                textureResolution,
              )}
              attenuationColor={leafColor}
              attenuationDistance={0.8}
            />
          )}
          {lineDrawing && <Edges color="#111111" threshold={20} />}
        </mesh>
        {!lineDrawing && (
          <mesh dispose={null} geometry={geometry}>
            <meshPhysicalMaterial
              color={`#${new THREE.Color(leafColor)
                .lerp(new THREE.Color("#a5ad78"), 0.2)
                .getHexString()}`}
              map={getBotanicalAgeTexture(
                "leaf",
                settings.leafAge,
                settings.seed + attachmentT * 3100 + side * 17,
                textureResolution,
              )}
              vertexColors
              side={THREE.BackSide}
              roughness={photorealistic ? 0.9 : 0.94}
              specularIntensity={photorealistic ? 0.07 : 0.03}
              bumpMap={getBotanicalTexture("leaf", textureResolution)}
              bumpScale={-0.018}
              normalMap={getBotanicalMaterialTexture(
                "leaf",
                "microNormal",
                textureResolution,
              )}
              normalScale={new THREE.Vector2(0.1, -0.1)}
              roughnessMap={getBotanicalMaterialTexture(
                "leaf",
                "roughness",
                textureResolution,
              )}
              transmission={photorealistic ? 0.075 * leafMoisture : 0}
              thickness={0.04 * tuning.leafWidthScale * leafMoisture}
              thicknessMap={getBotanicalMaterialTexture(
                "leaf",
                "thickness",
                textureResolution,
              )}
              attenuationColor={leafColor}
              attenuationDistance={0.72}
            />
          </mesh>
        )}
        <mesh>
          <tubeGeometry args={[midrib, 24, 0.009, 6, false]} />
          <meshStandardMaterial
            color={lineDrawing ? "#111111" : "#294b31"}
            roughness={0.86}
          />
        </mesh>
        {veinNetwork.laterals.map((vein, index) => (
          <mesh key={`lateral-${index}`}>
            <tubeGeometry args={[vein, 10, 0.0035, 5, false]} />
            <meshStandardMaterial
              color={lineDrawing ? "#111111" : "#36583a"}
              roughness={0.9}
            />
          </mesh>
        ))}
        {veinNetwork.branches.map((vein, index) => (
          <mesh key={`branch-${index}`}>
            <tubeGeometry args={[vein, 7, 0.0022, 5, false]} />
            <meshStandardMaterial
              color={lineDrawing ? "#111111" : "#3d6041"}
              roughness={0.92}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
