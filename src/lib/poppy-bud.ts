import * as THREE from "three";
import { seededRandom } from "./flower-geometry";

export function getPoppyBudTaper(t: number) {
  const along = THREE.MathUtils.clamp(t, 0, 1);
  const basalRound = THREE.MathUtils.lerp(
    0.72,
    1,
    THREE.MathUtils.smoothstep(along, 0, 0.2),
  );
  const pointedApex = THREE.MathUtils.lerp(
    1,
    0.38,
    THREE.MathUtils.smoothstep(along, 0.62, 1),
  );
  return basalRound * pointedApex;
}

export function getPoppyBudRadialScale(angle: number, t: number) {
  const seamEnvelope = Math.pow(
    Math.sin(Math.PI * THREE.MathUtils.clamp(t, 0, 1)),
    0.7,
  );
  return getPoppyBudTaper(t) * (1 + Math.cos(angle * 2) * 0.065 * seamEnvelope);
}

export function getPoppyBudSeamStrength(angle: number, t: number) {
  const envelope = Math.pow(
    Math.sin(Math.PI * THREE.MathUtils.clamp(t, 0, 1)),
    0.72,
  );
  const seamDistance = Math.abs(Math.cos(angle));
  return Math.exp(-Math.pow(seamDistance / 0.11, 2)) * envelope;
}

export function createPoppyBudGeometry() {
  const geometry = new THREE.SphereGeometry(1, 24, 16);
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const colors: number[] = [];

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const radius = Math.hypot(x, z);
    if (radius <= Number.EPSILON) {
      colors.push(1, 1, 1);
      continue;
    }
    const angle = Math.atan2(z, x);
    const t = (y + 1) * 0.5;
    const radialScale = getPoppyBudRadialScale(angle, t);
    position.setXYZ(index, x * radialScale, y, z * radialScale);
    const seamShade = 1 - getPoppyBudSeamStrength(angle, t) * 0.22;
    colors.push(seamShade, seamShade, seamShade);
  }

  position.needsUpdate = true;
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createPoppyBudHairPlacements(seed: number, count = 36) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const phase = seededRandom(seed + 431) * Math.PI * 2;
  return Array.from({ length: count }, (_, index) => {
    const t = 0.14 + ((index + 0.5) / count) * 0.72;
    const y = t * 2 - 1;
    const sphereRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = index * goldenAngle + phase;
    const radialScale = getPoppyBudRadialScale(angle, t);
    const position = new THREE.Vector3(
      Math.cos(angle) * sphereRadius * radialScale,
      y,
      Math.sin(angle) * sphereRadius * radialScale,
    );
    const normal = new THREE.Vector3(
      position.x,
      y * 0.62,
      position.z,
    ).normalize();
    return {
      position,
      normal,
      lengthScale: THREE.MathUtils.lerp(
        0.72,
        1.24,
        seededRandom(seed + index * 313 + 1_907),
      ),
      radiusScale: THREE.MathUtils.lerp(
        0.72,
        1.08,
        seededRandom(seed + index * 557 + 2_501),
      ),
    };
  });
}
