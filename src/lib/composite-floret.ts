import * as THREE from "three";

export function getCompositeCrownRadius(angle: number) {
  return 0.72 + Math.cos(angle * 5) * 0.13;
}

export function getSunflowerCompositeCrownRadius(angle: number) {
  // The second harmonic gives each persistent corolla lobe a stronger tip and
  // a tighter sinus than the soft generic composite crown. This preserves
  // a small open throat while keeping the five-part outline readable after the
  // spent crown is compressed and viewed among hundreds of neighbors.
  return 0.68 + Math.cos(angle * 5) * 0.2 + Math.cos(angle * 10) * 0.025;
}

function crownRandom(seed: number) {
  const raw = Math.sin(seed * 12.9898 + 31.417) * 43758.5453;
  return raw - Math.floor(raw);
}

export function getCompositeCrownVariation(seed: number, index: number) {
  const phase = crownRandom(seed + index * 181 + 29) * ((Math.PI * 2) / 5);
  const aspect = 0.94 + crownRandom(seed + index * 227 + 53) * 0.12;
  return {
    phase,
    scaleX: aspect,
    scaleY: 2 - aspect,
  };
}

export function getSunflowerSpentCrownVariation(
  seed: number,
  index: number,
  senescence: number,
) {
  const spent = THREE.MathUtils.clamp(senescence, 0, 1);
  const compression = THREE.MathUtils.lerp(
    0.84,
    0.94,
    crownRandom(seed + index * 461 + 211),
  );
  return {
    scaleX: THREE.MathUtils.lerp(1, compression, spent),
    scaleY: THREE.MathUtils.lerp(1, 1 / compression, spent),
    rotationOffset:
      (crownRandom(seed + index * 503 + 239) - 0.5) * 0.24 * spent,
  };
}

export function getCompositeFloretPlacementVariation(
  seed: number,
  index: number,
) {
  return {
    angleOffset: (crownRandom(seed + index * 263 + 71) - 0.5) * 0.024,
    radiusScale: THREE.MathUtils.lerp(
      0.985,
      1.015,
      crownRandom(seed + index * 307 + 97),
    ),
    heightOffset: (crownRandom(seed + index * 347 + 131) - 0.5) * 0.08,
    developmentOffset: (crownRandom(seed + index * 389 + 163) - 0.5) * 0.05,
    lightnessOffset: (crownRandom(seed + index * 433 + 197) - 0.5) * 0.04,
  };
}

function createFloretCrownGeometry(radiusAtAngle: (angle: number) => number) {
  const shape = new THREE.Shape();
  const segments = 40;
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const radius = radiusAtAngle(angle);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  const throat = new THREE.Path();
  throat.absarc(0, 0, 0.28, 0, Math.PI * 2, true);
  shape.holes.push(throat);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    curveSegments: 8,
    steps: 1,
  });
  geometry.translate(0, 0, -0.09);
  geometry.computeVertexNormals();
  return geometry;
}

export function createCompositeFloretCrownGeometry() {
  return createFloretCrownGeometry(getCompositeCrownRadius);
}

export function createSunflowerCompositeFloretCrownGeometry() {
  return createFloretCrownGeometry(getSunflowerCompositeCrownRadius);
}

export function createCompositeFloretTubeGeometry() {
  const segments = 12;
  const height = 1;
  const lowerOuterRadius = 1;
  const upperOuterRadius = 0.7;
  const wallThickness = 0.16;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let ring = 0; ring < 4; ring += 1) {
    const upper = ring % 2 === 1;
    const inner = ring >= 2;
    const outerRadius = upper ? upperOuterRadius : lowerOuterRadius;
    const radius = outerRadius - (inner ? wallThickness : 0);
    const y = upper ? height * 0.5 : -height * 0.5;

    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      positions.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    }
  }

  for (let segment = 0; segment < segments; segment += 1) {
    const next = (segment + 1) % segments;
    const lowerOuter = segment;
    const upperOuter = segments + segment;
    const lowerInner = segments * 2 + segment;
    const upperInner = segments * 3 + segment;
    const nextLowerOuter = next;
    const nextUpperOuter = segments + next;
    const nextLowerInner = segments * 2 + next;
    const nextUpperInner = segments * 3 + next;

    indices.push(
      lowerOuter,
      nextLowerOuter,
      upperOuter,
      nextLowerOuter,
      nextUpperOuter,
      upperOuter,
      upperInner,
      nextUpperInner,
      lowerInner,
      nextUpperInner,
      nextLowerInner,
      lowerInner,
      upperOuter,
      nextUpperOuter,
      upperInner,
      nextUpperOuter,
      nextUpperInner,
      upperInner,
      nextLowerOuter,
      lowerOuter,
      nextLowerInner,
      lowerOuter,
      lowerInner,
      nextLowerInner,
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createBifidCompositeStigmaGeometry() {
  const shape = new THREE.Shape();
  // A sunflower style divides into two narrow, gently recurved branches. Use
  // curved shoulders and separated tips rather than the former angular fork,
  // which read as a repeated yellow star at disk-macro scale.
  shape.moveTo(-0.1, -0.5);
  shape.lineTo(0.1, -0.5);
  shape.bezierCurveTo(0.1, -0.16, 0.09, 0.02, 0.15, 0.12);
  shape.bezierCurveTo(0.22, 0.24, 0.34, 0.37, 0.39, 0.5);
  shape.bezierCurveTo(0.4, 0.54, 0.36, 0.59, 0.31, 0.58);
  shape.bezierCurveTo(0.19, 0.5, 0.09, 0.37, 0, 0.25);
  shape.bezierCurveTo(-0.09, 0.37, -0.19, 0.5, -0.31, 0.58);
  shape.bezierCurveTo(-0.36, 0.59, -0.4, 0.54, -0.39, 0.5);
  shape.bezierCurveTo(-0.34, 0.37, -0.22, 0.24, -0.15, 0.12);
  shape.bezierCurveTo(-0.09, 0.02, -0.1, -0.16, -0.1, -0.5);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.025,
    bevelThickness: 0.02,
    curveSegments: 6,
    steps: 1,
  });
  geometry.translate(0, 0, -0.08);
  geometry.computeVertexNormals();
  return geometry;
}

export function getSunflowerFloretStage(
  progress: number,
  maturity: number,
  senescence: number,
) {
  const radius = THREE.MathUtils.clamp(progress, 0, 1);
  const developed = THREE.MathUtils.clamp(maturity, 0, 1);
  const spent = THREE.MathUtils.clamp(senescence, 0, 1);
  return {
    bodyHeightScale:
      THREE.MathUtils.lerp(1.82, 1.18, radius) *
      THREE.MathUtils.lerp(0.82, 1.16, developed) *
      THREE.MathUtils.lerp(1, 0.78, spent),
    bodyWidthScale:
      THREE.MathUtils.lerp(0.78, 1.08, developed) *
      THREE.MathUtils.lerp(1, 0.88, spent) *
      THREE.MathUtils.lerp(1.03, 0.98, radius),
    crownScale:
      THREE.MathUtils.lerp(0.52, 1.08, developed) *
      THREE.MathUtils.lerp(1, 0.82, spent),
    styleScale:
      THREE.MathUtils.smoothstep(developed, 0.36, 0.9) *
      THREE.MathUtils.lerp(1, 0.5, spent),
  };
}

export function getSunflowerFloretRadialSizeScale(progress: number) {
  const radius = THREE.MathUtils.clamp(progress, 0, 1);
  return THREE.MathUtils.lerp(
    1,
    1.14,
    THREE.MathUtils.smoothstep(radius, 0.46, 0.94),
  );
}

export function getSunflowerFloretPosture(
  seed: number,
  index: number,
  progress: number,
  maturity: number,
  senescence: number,
) {
  const radius = THREE.MathUtils.clamp(progress, 0, 1);
  const developed = THREE.MathUtils.clamp(maturity, 0, 1);
  const spent = THREE.MathUtils.clamp(senescence, 0, 1);
  const random = (salt: number) =>
    crownRandom(seed + index * 719 + Math.round(salt * 1000));
  const radialLean =
    THREE.MathUtils.lerp(0.018, 0.13, radius) +
    developed * 0.025 +
    spent * THREE.MathUtils.lerp(0.025, 0.085, radius);

  return {
    tilt: THREE.MathUtils.clamp(
      radialLean * THREE.MathUtils.lerp(0.78, 1.22, random(0.173)),
      0.012,
      0.29,
    ),
    azimuthOffset: (random(0.491) - 0.5) * (0.08 + spent * 0.14),
  };
}

export function getCompositeFloretVerticalLayout(
  size: number,
  bodyHeightScale: number,
  crownScale: number,
) {
  const bodyTopOffset = size * bodyHeightScale * 0.5;
  const crownHalfDepth = size * crownScale * 0.09;
  return {
    crownCenterOffset: bodyTopOffset + crownHalfDepth,
    stigmaCenterOffset: bodyTopOffset + crownHalfDepth * 2 + size * 0.08,
  };
}

export function getCompositeCrownColor(
  baseColor: THREE.ColorRepresentation,
  pollenColor: THREE.ColorRepresentation,
  maturity: number,
  senescence: number,
) {
  const flowering = THREE.MathUtils.smoothstep(maturity, 0.18, 0.86);
  return new THREE.Color(baseColor)
    .lerp(new THREE.Color(pollenColor), flowering * 0.9)
    .lerp(
      new THREE.Color("#4b301f"),
      THREE.MathUtils.clamp(senescence, 0, 1) * 0.52,
    );
}

export function getSunflowerWeatheredCrownColor(
  source: THREE.ColorRepresentation,
  seed: number,
  index: number,
  senescence: number,
) {
  const spent = THREE.MathUtils.clamp(senescence, 0, 1);
  if (spent === 0) return new THREE.Color(source);

  const warmDryTissue = new THREE.Color("#76502d").lerp(
    new THREE.Color("#493126"),
    crownRandom(seed + index * 547 + 269),
  );
  const weatheringMix =
    THREE.MathUtils.lerp(0.18, 0.36, crownRandom(seed + index * 593 + 307)) *
    spent;
  return new THREE.Color(source)
    .lerp(warmDryTissue, weatheringMix)
    .offsetHSL(
      0,
      0,
      (crownRandom(seed + index * 631 + 337) - 0.5) * 0.026 * spent,
    );
}

export function getSunflowerDiskBodyColor(
  progress: number,
  maturity: number,
  senescence: number,
  lightnessOffset = 0,
) {
  const radius = THREE.MathUtils.clamp(progress, 0, 1);
  const flowering = THREE.MathUtils.smoothstep(maturity, 0.18, 0.88);
  const color = new THREE.Color("#7b3f22")
    .lerp(new THREE.Color("#45271d"), radius * 0.72)
    .lerp(new THREE.Color("#a65f29"), flowering * 0.3)
    .lerp(
      new THREE.Color("#38251e"),
      THREE.MathUtils.clamp(senescence, 0, 1) * 0.48,
    );
  color.offsetHSL(0, 0, lightnessOffset);
  return color;
}
