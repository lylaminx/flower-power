import * as THREE from "three";

type MutableShader = {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
};

export const lilyBacklightDirection = new THREE.Vector3(0.5, 4.2, -5)
  .normalize()
  .toArray() as [number, number, number];

export function createLilyThinSurfaceShader(rimIntensity: number) {
  const boundedRimStrength = THREE.MathUtils.smoothstep(
    rimIntensity,
    1.45,
    3.6,
  );
  return (shader: MutableShader) => {
    shader.uniforms.lilyBacklightDirection = {
      value: new THREE.Vector3(...lilyBacklightDirection),
    };
    shader.uniforms.lilyBacklightStrength = { value: boundedRimStrength };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vLilyWorldNormal;\nvarying vec3 vLilyWorldPosition;",
      )
      .replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nvLilyWorldNormal = normalize(mat3(modelMatrix) * objectNormal);",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvLilyWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vLilyWorldNormal;\nvarying vec3 vLilyWorldPosition;\nuniform vec3 lilyBacklightDirection;\nuniform float lilyBacklightStrength;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        [
          "#include <emissivemap_fragment>",
          "float lilyRearFacing = dot(-normalize(vLilyWorldNormal), normalize(lilyBacklightDirection));",
          "float lilyWrappedTransmission = smoothstep(-0.42, 0.72, lilyRearFacing);",
          "float lilyWorldView = dot(normalize(vLilyWorldNormal), normalize(cameraPosition - vLilyWorldPosition));",
          "float lilyGrazingScatter = pow(1.0 - abs(lilyWorldView), 1.7);",
          "float lilyPigmentLuminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));",
          "float lilyPigmentTransmission = mix(0.58, 1.0, smoothstep(0.12, 0.62, lilyPigmentLuminance));",
          "totalEmissiveRadiance *= (0.02 + lilyWrappedTransmission * lilyBacklightStrength * 1.9 + lilyGrazingScatter * lilyBacklightStrength * 0.2) * lilyPigmentTransmission;",
        ].join("\n"),
      );
  };
}

export function lilyThinSurfaceProgramKey(rimIntensity: number) {
  return `lily-thin-surface-v3:${Math.round(rimIntensity * 100)}`;
}
