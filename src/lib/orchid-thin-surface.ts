import * as THREE from "three";

type MutableShader = {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
};

export const orchidBacklightDirection = new THREE.Vector3(0.5, 4.2, -5)
  .normalize()
  .toArray() as [number, number, number];

export function createOrchidThinSurfaceShader(rimIntensity: number) {
  const boundedRimStrength = THREE.MathUtils.clamp(rimIntensity / 3.6, 0, 1);
  return (shader: MutableShader) => {
    shader.uniforms.orchidBacklightDirection = {
      value: new THREE.Vector3(...orchidBacklightDirection),
    };
    shader.uniforms.orchidBacklightStrength = { value: boundedRimStrength };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vOrchidWorldNormal;\nvarying vec3 vOrchidWorldPosition;",
      )
      .replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nvOrchidWorldNormal = normalize(mat3(modelMatrix) * objectNormal);",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvOrchidWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vOrchidWorldNormal;\nvarying vec3 vOrchidWorldPosition;\nuniform vec3 orchidBacklightDirection;\nuniform float orchidBacklightStrength;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        [
          "#include <emissivemap_fragment>",
          "float orchidRearFacing = dot(-normalize(vOrchidWorldNormal), normalize(orchidBacklightDirection));",
          "float orchidWrappedTransmission = smoothstep(-0.22, 0.72, orchidRearFacing);",
          "float orchidWorldView = dot(normalize(vOrchidWorldNormal), normalize(cameraPosition - vOrchidWorldPosition));",
          "float orchidGrazingScatter = pow(1.0 - abs(orchidWorldView), 1.65);",
          "float orchidTissueLuminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));",
          "float orchidTissueTransmission = mix(0.72, 1.0, smoothstep(0.55, 0.95, orchidTissueLuminance));",
          "totalEmissiveRadiance *= (0.16 + orchidWrappedTransmission * (0.72 + orchidBacklightStrength * 1.12) + orchidGrazingScatter * orchidBacklightStrength * 0.08) * orchidTissueTransmission;",
        ].join("\n"),
      );
  };
}

export function orchidThinSurfaceProgramKey(rimIntensity: number) {
  return `orchid-thin-surface-v3:${Math.round(rimIntensity * 100)}`;
}
