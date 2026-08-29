import * as THREE from "three";

type MutableShader = {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
};

export const roseBacklightDirection = new THREE.Vector3(0.5, 4.2, -5)
  .normalize()
  .toArray() as [number, number, number];

export function createRoseThinSurfaceShader(rimIntensity: number) {
  const boundedRimStrength = THREE.MathUtils.clamp(rimIntensity / 3.6, 0, 1);
  return (shader: MutableShader) => {
    shader.uniforms.roseBacklightDirection = {
      value: new THREE.Vector3(...roseBacklightDirection),
    };
    shader.uniforms.roseBacklightStrength = { value: boundedRimStrength };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vRoseWorldNormal;\nvarying vec3 vRoseWorldPosition;",
      )
      .replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nvRoseWorldNormal = normalize(mat3(modelMatrix) * objectNormal);",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvRoseWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vRoseWorldNormal;\nvarying vec3 vRoseWorldPosition;\nuniform vec3 roseBacklightDirection;\nuniform float roseBacklightStrength;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        [
          "#include <emissivemap_fragment>",
          "float roseRearFacing = dot(-normalize(vRoseWorldNormal), normalize(roseBacklightDirection));",
          "float roseWrappedTransmission = smoothstep(-0.3, 0.78, roseRearFacing);",
          "float roseWorldView = dot(normalize(vRoseWorldNormal), normalize(cameraPosition - vRoseWorldPosition));",
          "float roseGrazingScatter = pow(1.0 - abs(roseWorldView), 1.8);",
          "float rosePigmentLuminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));",
          "float rosePigmentTransmission = mix(0.55, 1.0, smoothstep(0.08, 0.48, rosePigmentLuminance));",
          "totalEmissiveRadiance *= (0.1 + roseWrappedTransmission * (0.3 + roseBacklightStrength * 0.74) + roseGrazingScatter * roseBacklightStrength * 0.1) * rosePigmentTransmission;",
        ].join("\n"),
      );
  };
}

export function roseThinSurfaceProgramKey(rimIntensity: number) {
  return `rose-thin-surface-v2:${Math.round(rimIntensity * 100)}`;
}
