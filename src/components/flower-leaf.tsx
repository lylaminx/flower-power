"use client";

import { Edges } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  createLeafGeometry,
  createLeafMarginGeometry,
  createLeafVeinNetwork,
  createPetioleGeometry,
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
  getLeafSenescence,
  getFlowerPhaseTuning,
} from "@/lib/flower-growth";
import { useFlowerStore } from "@/lib/flower-store";
import { useRenderQuality } from "./render-quality-context";
import { getTextureResolution } from "@/lib/flower-quality";
import { useShallow } from "zustand/react/shallow";

const stipuleShape = new THREE.Shape();
stipuleShape.moveTo(0, 0);
stipuleShape.bezierCurveTo(-0.035, 0.07, -0.042, 0.19, -0.008, 0.27);
stipuleShape.bezierCurveTo(0.025, 0.2, 0.03, 0.08, 0, 0);
const stipuleGeometry = new THREE.ShapeGeometry(stipuleShape, 5);
const leafHairGeometry = new THREE.ConeGeometry(1, 1, 5);
const leafDropletGeometry = new THREE.SphereGeometry(1, 12, 8);

export function FlowerLeaf({
  side,
  attachment,
  stemTangent,
  attachmentT,
}: {
  side: number;
  attachment: THREE.Vector3;
  stemTangent: THREE.Vector3;
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
  const quality = useRenderQuality();
  const textureResolution = getTextureResolution(quality);
  const lineDrawing = settings.renderMode === "line";
  const photorealistic = settings.renderMode === "photo";
  const structure = flowerSpecies[settings.preset];
  const tuning = getHeroLeafTuning(settings.preset, structure);
  const growth = getFlowerGrowthState(settings.bloom, settings.leafAge);
  const phaseTuning = getFlowerPhaseTuning(growth.phase);
  const senescence = getLeafSenescence(
    settings.leafAge,
    growth.wilt,
    attachmentT,
    seededRandom(settings.seed + side * 419 + attachmentT * 2371),
  );
  const leafMoisture = THREE.MathUtils.clamp(
    growth.moisture * phaseTuning.moistureScale * senescence.moistureScale,
    0,
    1,
  );
  const leafDroop = settings.leafDroop * 0.68 + senescence.wilt * 0.44;
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
          (THREE.MathUtils.lerp(0.96, 1.02, leafMoisture) +
            senescence.wilt * 0.22),
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
      senescence.wilt,
      tuning,
      settings.leafCurl,
      settings.leafAsymmetry,
      settings.leafSerration,
      settings.seed,
      side,
    ],
  );
  const marginGeometry = useMemo(
    () => createLeafMarginGeometry(geometry, 0.0035 * tuning.leafWidthScale),
    [geometry, tuning.leafWidthScale],
  );
  const leafColor = useMemo(() => {
    const baseColor =
      settings.preset === "Lotus"
        ? new THREE.Color(settings.stemColor).lerp(
            new THREE.Color("#86b77a"),
            0.52,
          )
        : new THREE.Color(settings.stemColor);
    return `#${baseColor
      .lerp(
        new THREE.Color("#77733c"),
        senescence.age * 0.55 +
          tuning.leafColorMix * 0.06 +
          senescence.wilt * 0.12,
      )
      .getHexString()}`;
  }, [
    senescence.age,
    senescence.wilt,
    settings.preset,
    settings.stemColor,
    tuning.leafColorMix,
  ]);
  const frontVeinColors =
    settings.preset === "Sunflower"
      ? ["#819174", "#78896c", "#708164"]
      : ["#294b31", "#36583a", "#3d6041"];
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
  const undersideMidrib = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        midrib.points.map(
          (point) => new THREE.Vector3(point.x, point.y, point.z - 0.032),
        ),
      ),
    [midrib],
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
  const undersideLaterals = useMemo(
    () =>
      veinNetwork.laterals.map(
        (vein) =>
          new THREE.CatmullRomCurve3(
            vein
              .getPoints(10)
              .map(
                (point) => new THREE.Vector3(point.x, point.y, point.z - 0.026),
              ),
          ),
      ),
    [veinNetwork],
  );
  const parallelVeins = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const sideOffset = (index - 3) / 3;
        const width =
          structure.leafWidth * tuning.leafWidthScale * sideOffset * 0.72;
        return new THREE.CatmullRomCurve3([
          new THREE.Vector3(width * 0.08, -0.08, 0.031),
          new THREE.Vector3(width * 0.76, 0.34, 0.05),
          new THREE.Vector3(width, 0.72, 0.078),
          new THREE.Vector3(width * 0.62, 1.08, 0.05),
          new THREE.Vector3(width * 0.08, 1.3, 0.025),
        ]);
      }),
    [structure.leafWidth, tuning.leafWidthScale],
  );
  const undersideParallelVeins = useMemo(
    () =>
      parallelVeins.map(
        (vein) =>
          new THREE.CatmullRomCurve3(
            vein.points.map(
              (point) => new THREE.Vector3(point.x, point.y, point.z - 0.03),
            ),
          ),
      ),
    [parallelVeins],
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
  const petioleGeometry = useMemo(
    () =>
      createPetioleGeometry(
        petiole,
        0.022 * tuning.petioleScale,
        0.012 * tuning.petioleScale,
        0.006 * tuning.petioleScale,
      ),
    [petiole, tuning.petioleScale],
  );
  const stemFrame = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        stemTangent.clone().normalize(),
      ),
    [stemTangent],
  );
  const leafletPlacements = Array.from(
    { length: tuning.leafletPairs },
    (_, pair) =>
      ([-1, 1] as const).map((leafletSide) => ({
        side: leafletSide,
        y: 0.28 + pair * 0.32,
        scale: 0.5 - pair * 0.055,
      })),
  ).flat();
  const compoundLeaf = tuning.leafletPairs > 0;
  const peltateLeaf = tuning.leafShape === "peltate";
  const leafHairs = useRef<THREE.InstancedMesh>(null);
  const leafDroplets = useRef<THREE.InstancedMesh>(null);
  const leafHairCount =
    tuning.leafHairiness > 0
      ? quality === "draft"
        ? 14
        : quality === "ultra"
          ? 48
          : 28
      : 1;
  useLayoutEffect(() => {
    if (!leafHairs.current || tuning.leafHairiness <= 0) return;
    const positionAttribute = geometry.getAttribute("position");
    const normalAttribute = geometry.getAttribute("normal");
    const transform = new THREE.Object3D();
    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const frontVertexCount = Math.floor(positionAttribute.count / 2);

    for (let index = 0; index < leafHairCount; index += 1) {
      const random = seededRandom(
        settings.seed + attachmentT * 2903 + side * 181 + index * 431,
      );
      const vertexIndex = Math.min(
        frontVertexCount - 1,
        Math.floor(random * frontVertexCount),
      );
      position.fromBufferAttribute(positionAttribute, vertexIndex);
      normal.fromBufferAttribute(normalAttribute, vertexIndex).normalize();
      const hairLength = THREE.MathUtils.lerp(
        0.014,
        0.03,
        seededRandom(settings.seed + index * 719 + side * 37),
      );
      transform.position
        .copy(position)
        .addScaledVector(normal, hairLength * 0.48);
      transform.quaternion.setFromUnitVectors(up, normal);
      transform.scale.set(0.0022, hairLength, 0.0022);
      transform.updateMatrix();
      leafHairs.current.setMatrixAt(index, transform.matrix);
    }
    leafHairs.current.instanceMatrix.needsUpdate = true;
  }, [
    attachmentT,
    geometry,
    leafHairCount,
    settings.seed,
    side,
    tuning.leafHairiness,
  ]);
  const dropletCount = peltateLeaf
    ? quality === "draft"
      ? 5
      : quality === "ultra"
        ? 18
        : 10
    : 1;
  useLayoutEffect(() => {
    if (!leafDroplets.current || !peltateLeaf) return;
    const positionAttribute = geometry.getAttribute("position");
    const normalAttribute = geometry.getAttribute("normal");
    const transform = new THREE.Object3D();
    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const frontVertexCount = Math.floor(positionAttribute.count / 2);

    for (let index = 0; index < dropletCount; index += 1) {
      const random = seededRandom(
        settings.seed + attachmentT * 3251 + side * 233 + index * 619,
      );
      const vertexIndex = Math.min(
        frontVertexCount - 1,
        Math.floor(random * frontVertexCount),
      );
      position.fromBufferAttribute(positionAttribute, vertexIndex);
      normal.fromBufferAttribute(normalAttribute, vertexIndex).normalize();
      const dropletRadius =
        THREE.MathUtils.lerp(
          0.016,
          0.038,
          seededRandom(settings.seed + side * 71 + index * 977),
        ) * THREE.MathUtils.lerp(0.58, 1, leafMoisture);
      transform.position
        .copy(position)
        .addScaledVector(normal, dropletRadius * 0.56);
      transform.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        normal,
      );
      transform.scale.set(
        dropletRadius,
        dropletRadius * THREE.MathUtils.lerp(0.62, 0.86, random),
        dropletRadius,
      );
      transform.updateMatrix();
      leafDroplets.current.setMatrixAt(index, transform.matrix);
    }
    leafDroplets.current.instanceMatrix.needsUpdate = true;
  }, [
    attachmentT,
    dropletCount,
    geometry,
    leafMoisture,
    peltateLeaf,
    settings.seed,
    side,
  ]);
  const radialVeins = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        const center = new THREE.Vector3(0, 0.675, 0.03);
        const end = new THREE.Vector3(
          Math.cos(angle) * structure.leafWidth * 0.82,
          0.675 + Math.sin(angle) * 0.62,
          0.045,
        );
        return new THREE.QuadraticBezierCurve3(
          center,
          center
            .clone()
            .lerp(end, 0.52)
            .add(new THREE.Vector3(0, 0, 0.025)),
          end,
        );
      }),
    [structure.leafWidth],
  );

  return (
    <group
      position={[
        attachment.x,
        attachment.y + tuning.attachmentShift,
        attachment.z,
      ]}
      quaternion={peltateLeaf ? new THREE.Quaternion() : stemFrame}
    >
      <group
        rotation={
          peltateLeaf
            ? [
                1.5 + leafDroop * 0.08,
                side * tuning.bladeYaw,
                side * (0.08 + tuning.bladeRoll),
              ]
            : [
                0.18 + leafDroop * 0.28 + tuning.droopBias + tuning.bladePitch,
                side * (0.5 + tuning.bladeYaw),
                side * (-0.88 - leafDroop * 0.48 + tuning.bladeRoll),
              ]
        }
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
        <mesh dispose={null} geometry={petioleGeometry}>
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
        <group
          position={[
            0,
            0.26 +
              tuning.petioleLift +
              (compoundLeaf ? 0.58 : 0) -
              (peltateLeaf ? 0.675 : 0),
            0,
          ]}
          scale={compoundLeaf ? [0.62, 0.62, 0.82] : [1, 1, 1]}
        >
          <mesh dispose={null} geometry={geometry}>
            {lineDrawing ? (
              <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
            ) : (
              <meshPhysicalMaterial
                color={leafColor}
                map={getBotanicalAgeTexture(
                  "leaf",
                  senescence.age,
                  settings.seed + attachmentT * 3100 + side * 17,
                  textureResolution,
                )}
                vertexColors
                side={THREE.FrontSide}
                roughness={
                  photorealistic
                    ? 0.8 - (tuning.leafGlossScale - 1) * 0.08
                    : 0.88
                }
                specularIntensity={
                  photorealistic ? 0.14 * tuning.leafGlossScale : 0.06
                }
                sheen={0}
                clearcoat={
                  photorealistic
                    ? 0.12 * tuning.leafGlossScale * leafMoisture
                    : 0
                }
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
                  senescence.age,
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
          {!lineDrawing && (
            <mesh dispose={null} geometry={marginGeometry}>
              <meshStandardMaterial
                color={`#${new THREE.Color(leafColor)
                  .lerp(new THREE.Color("#687346"), 0.22 + senescence.age * 0.2)
                  .getHexString()}`}
                roughness={0.92}
              />
            </mesh>
          )}
          <group visible={!peltateLeaf && tuning.venation === "pinnate"}>
            <mesh>
              <tubeGeometry args={[midrib, 24, 0.009, 6, false]} />
              <meshStandardMaterial
                color={lineDrawing ? "#111111" : frontVeinColors[0]}
                roughness={0.86}
              />
            </mesh>
            {veinNetwork.laterals.map((vein, index) => (
              <mesh key={`lateral-${index}`}>
                <tubeGeometry args={[vein, 10, 0.0035, 5, false]} />
                <meshStandardMaterial
                  color={lineDrawing ? "#111111" : frontVeinColors[1]}
                  roughness={0.9}
                />
              </mesh>
            ))}
            {veinNetwork.branches.map((vein, index) => (
              <mesh key={`branch-${index}`}>
                <tubeGeometry args={[vein, 7, 0.0022, 5, false]} />
                <meshStandardMaterial
                  color={lineDrawing ? "#111111" : frontVeinColors[2]}
                  roughness={0.92}
                />
              </mesh>
            ))}
            {!lineDrawing && (
              <>
                <mesh>
                  <tubeGeometry
                    args={[undersideMidrib, 24, 0.0115, 6, false]}
                  />
                  <meshStandardMaterial color="#8d9d71" roughness={0.94} />
                </mesh>
                {undersideLaterals.map((vein, index) => (
                  <mesh key={`underside-lateral-${index}`}>
                    <tubeGeometry args={[vein, 10, 0.0042, 5, false]} />
                    <meshStandardMaterial color="#91a078" roughness={0.96} />
                  </mesh>
                ))}
              </>
            )}
          </group>
          {tuning.venation === "parallel" &&
            parallelVeins.map((vein, index) => (
              <group key={`parallel-${index}`}>
                <mesh>
                  <tubeGeometry
                    args={[vein, 18, index === 3 ? 0.0075 : 0.0032, 5, false]}
                  />
                  <meshStandardMaterial
                    color={lineDrawing ? "#111111" : "#36583a"}
                    roughness={0.9}
                  />
                </mesh>
                {!lineDrawing && (
                  <mesh>
                    <tubeGeometry
                      args={[
                        undersideParallelVeins[index],
                        18,
                        index === 3 ? 0.009 : 0.0038,
                        5,
                        false,
                      ]}
                    />
                    <meshStandardMaterial color="#91a078" roughness={0.96} />
                  </mesh>
                )}
              </group>
            ))}
          {peltateLeaf &&
            radialVeins.map((vein, index) => (
              <mesh key={`radial-${index}`}>
                <tubeGeometry args={[vein, 12, 0.0045, 5, false]} />
                <meshStandardMaterial
                  color={lineDrawing ? "#111111" : "#416346"}
                  roughness={0.9}
                />
              </mesh>
            ))}
          {!lineDrawing && tuning.leafHairiness > 0 && (
            <instancedMesh
              ref={leafHairs}
              dispose={null}
              args={[undefined, undefined, leafHairCount]}
            >
              <primitive object={leafHairGeometry} attach="geometry" />
              <meshBasicMaterial
                color="#d7ddc9"
                transparent
                opacity={0.34}
                depthWrite={false}
              />
            </instancedMesh>
          )}
          {!lineDrawing && peltateLeaf && (
            <instancedMesh
              ref={leafDroplets}
              dispose={null}
              args={[undefined, undefined, dropletCount]}
            >
              <primitive object={leafDropletGeometry} attach="geometry" />
              <meshPhysicalMaterial
                color="#dce8df"
                transparent
                opacity={0.72}
                roughness={0.08}
                transmission={0.82}
                thickness={0.08}
                ior={1.33}
                specularIntensity={0.92}
                clearcoat={0.8}
                clearcoatRoughness={0.06}
                depthWrite={false}
              />
            </instancedMesh>
          )}
        </group>
        {compoundLeaf && (
          <>
            {([-1, 1] as const).map((stipuleSide) => (
              <mesh
                key={`stipule-${stipuleSide}`}
                dispose={null}
                geometry={stipuleGeometry}
                position={[stipuleSide * 0.018, 0.035, 0.018]}
                rotation={[-0.06, stipuleSide * 0.12, stipuleSide * -0.32]}
                scale={[stipuleSide * (0.82 + senescence.wilt * 0.08), 0.9, 1]}
              >
                {lineDrawing ? (
                  <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
                ) : (
                  <meshPhysicalMaterial
                    color={leafColor}
                    map={getBotanicalAgeTexture(
                      "leaf",
                      senescence.age,
                      settings.seed + attachmentT * 3100 + stipuleSide * 193,
                      textureResolution,
                    )}
                    side={THREE.DoubleSide}
                    roughness={0.88}
                    specularIntensity={photorealistic ? 0.09 : 0.04}
                    bumpMap={getBotanicalTexture("leaf", textureResolution)}
                    bumpScale={0.012}
                    transmission={photorealistic ? 0.025 * leafMoisture : 0}
                    thickness={0.028 * leafMoisture}
                    attenuationColor={leafColor}
                    attenuationDistance={0.58}
                  />
                )}
                {lineDrawing && <Edges color="#111111" threshold={20} />}
              </mesh>
            ))}
            <mesh>
              <tubeGeometry
                args={[
                  new THREE.CatmullRomCurve3([
                    new THREE.Vector3(0, 0.2, 0.025),
                    new THREE.Vector3(0, 0.58, 0.04),
                    new THREE.Vector3(0, 0.96, 0.05),
                  ]),
                  18,
                  0.01,
                  6,
                  false,
                ]}
              />
              <meshStandardMaterial
                color={lineDrawing ? "#111111" : "#315136"}
                roughness={0.88}
              />
            </mesh>
            {leafletPlacements.map((leaflet, leafletIndex) => (
              <group
                key={`leaflet-${leaflet.side}-${leaflet.y}`}
                position={[
                  leaflet.side * 0.018,
                  leaflet.y,
                  0.035 + leafletIndex * 0.001,
                ]}
                rotation={[0.03, leaflet.side * 0.08, leaflet.side * -0.88]}
                scale={[leaflet.scale, leaflet.scale * 0.82, leaflet.scale]}
              >
                <mesh dispose={null} geometry={geometry}>
                  {lineDrawing ? (
                    <meshBasicMaterial
                      color="#ffffff"
                      side={THREE.DoubleSide}
                    />
                  ) : (
                    <meshPhysicalMaterial
                      color={leafColor}
                      map={getBotanicalAgeTexture(
                        "leaf",
                        senescence.age,
                        settings.seed + attachmentT * 3100 + leafletIndex * 271,
                        textureResolution,
                      )}
                      vertexColors
                      side={THREE.DoubleSide}
                      roughness={
                        photorealistic
                          ? 0.82 - (tuning.leafGlossScale - 1) * 0.07
                          : 0.9
                      }
                      specularIntensity={
                        photorealistic ? 0.12 * tuning.leafGlossScale : 0.05
                      }
                      bumpMap={getBotanicalTexture("leaf", textureResolution)}
                      bumpScale={0.018}
                      transmission={photorealistic ? 0.04 * leafMoisture : 0}
                      thickness={0.04 * leafMoisture}
                      attenuationColor={leafColor}
                      attenuationDistance={0.76}
                    />
                  )}
                  {lineDrawing && <Edges color="#111111" threshold={20} />}
                </mesh>
                {!lineDrawing && (
                  <mesh dispose={null} geometry={marginGeometry}>
                    <meshStandardMaterial
                      color={new THREE.Color(leafColor).multiplyScalar(0.78)}
                      roughness={0.92}
                    />
                  </mesh>
                )}
              </group>
            ))}
          </>
        )}
      </group>
    </group>
  );
}
