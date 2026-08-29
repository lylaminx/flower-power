import * as THREE from "three";

type MutableShader = {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
};

export const sunflowerBacklightDirection = new THREE.Vector3(0.5, 4.2, -5)
  .normalize()
  .toArray() as [number, number, number];

export function createSunflowerThinSurfaceShader(rimIntensity: number) {
  const boundedRimStrength = THREE.MathUtils.smoothstep(
    rimIntensity,
    1.45,
    3.6,
  );

  return (shader: MutableShader) => {
    shader.uniforms.sunflowerBacklightDirection = {
      value: new THREE.Vector3(...sunflowerBacklightDirection),
    };
    shader.uniforms.sunflowerBacklightStrength = {
      value: boundedRimStrength,
    };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSunflowerWorldNormal;\nvarying vec3 vSunflowerWorldPosition;",
      )
      .replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nvSunflowerWorldNormal = normalize(mat3(modelMatrix) * objectNormal);",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvSunflowerWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSunflowerWorldNormal;\nvarying vec3 vSunflowerWorldPosition;\nuniform vec3 sunflowerBacklightDirection;\nuniform float sunflowerBacklightStrength;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        [
          "#include <emissivemap_fragment>",
          "float sunflowerRearFacing = dot(-normalize(vSunflowerWorldNormal), normalize(sunflowerBacklightDirection));",
          "float sunflowerWrappedTransmission = smoothstep(-0.3, 0.78, sunflowerRearFacing);",
          "float sunflowerWorldView = dot(normalize(vSunflowerWorldNormal), normalize(cameraPosition - vSunflowerWorldPosition));",
          "float sunflowerGrazingScatter = pow(1.0 - abs(sunflowerWorldView), 1.85);",
          "float sunflowerPigmentLuminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));",
          "float sunflowerPigmentTransmission = mix(0.62, 1.0, smoothstep(0.15, 0.62, sunflowerPigmentLuminance));",
          "float sunflowerCellularScatter = 1.0;",
          "#ifdef USE_THICKNESSMAP",
          "float sunflowerOpticalDepth = texture2D(thicknessMap, vThicknessMapUv).g;",
          "sunflowerCellularScatter = mix(1.16, 0.86, smoothstep(0.12, 0.72, sunflowerOpticalDepth));",
          "#endif",
          "totalEmissiveRadiance *= (0.015 + sunflowerWrappedTransmission * sunflowerBacklightStrength * 1.16 + sunflowerGrazingScatter * sunflowerBacklightStrength * 0.12) * sunflowerPigmentTransmission * sunflowerCellularScatter;",
        ].join("\n"),
      );
  };
}

export function sunflowerThinSurfaceProgramKey(rimIntensity: number) {
  return `sunflower-thin-surface-v4:${Math.round(rimIntensity * 100)}`;
}
