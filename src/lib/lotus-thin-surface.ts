import * as THREE from "three";

type MutableShader = {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
};

export const lotusBacklightDirection = new THREE.Vector3(0.5, 4.2, -5)
  .normalize()
  .toArray() as [number, number, number];

export function createLotusThinSurfaceShader(rimIntensity: number) {
  const boundedRimStrength = THREE.MathUtils.smoothstep(
    rimIntensity,
    1.45,
    3.6,
  );
  return (shader: MutableShader) => {
    shader.uniforms.lotusBacklightDirection = {
      value: new THREE.Vector3(...lotusBacklightDirection),
    };
    shader.uniforms.lotusBacklightStrength = { value: boundedRimStrength };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vLotusWorldNormal;\nvarying vec3 vLotusWorldPosition;",
      )
      .replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nvLotusWorldNormal = normalize(mat3(modelMatrix) * objectNormal);",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvLotusWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vLotusWorldNormal;\nvarying vec3 vLotusWorldPosition;\nuniform vec3 lotusBacklightDirection;\nuniform float lotusBacklightStrength;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        [
          "#include <emissivemap_fragment>",
          "float lotusRearFacing = dot(-normalize(vLotusWorldNormal), normalize(lotusBacklightDirection));",
          "float lotusWrappedTransmission = smoothstep(-0.36, 0.76, lotusRearFacing);",
          "float lotusWorldView = dot(normalize(vLotusWorldNormal), normalize(cameraPosition - vLotusWorldPosition));",
          "float lotusGrazingScatter = pow(1.0 - abs(lotusWorldView), 1.9);",
          "totalEmissiveRadiance *= 0.03 + lotusWrappedTransmission * lotusBacklightStrength * 1.18 + lotusGrazingScatter * lotusBacklightStrength * 0.11;",
        ].join("\n"),
      );
  };
}

export function lotusThinSurfaceProgramKey(rimIntensity: number) {
  return `lotus-thin-surface-v1:${Math.round(rimIntensity * 100)}`;
}
