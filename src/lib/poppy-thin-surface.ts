import * as THREE from "three";

type MutableShader = {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
};

export const poppyBacklightDirection = new THREE.Vector3(0.5, 4.2, -5)
  .normalize()
  .toArray() as [number, number, number];

export function createPoppyThinSurfaceShader(rimIntensity: number) {
  const boundedRimStrength = THREE.MathUtils.smoothstep(
    rimIntensity,
    1.45,
    3.6,
  );
  return (shader: MutableShader) => {
    shader.uniforms.poppyBacklightDirection = {
      value: new THREE.Vector3(...poppyBacklightDirection),
    };
    shader.uniforms.poppyBacklightStrength = { value: boundedRimStrength };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vPoppyWorldNormal;\nvarying vec3 vPoppyWorldPosition;\nvarying vec3 vPoppyLocalPosition;\nvarying vec2 vPoppyUv;",
      )
      .replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nvPoppyWorldNormal = normalize(mat3(modelMatrix) * objectNormal);",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvPoppyLocalPosition = transformed;\nvPoppyUv = uv;\nvPoppyWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vPoppyWorldNormal;\nvarying vec3 vPoppyWorldPosition;\nvarying vec3 vPoppyLocalPosition;\nvarying vec2 vPoppyUv;\nuniform vec3 poppyBacklightDirection;\nuniform float poppyBacklightStrength;",
      )
      .replace(
        "#include <color_fragment>",
        [
          "#include <color_fragment>",
          // Broad, overlapping fields mimic uneven anthocyanin density without
          // introducing the granular noise that made earlier tissue look printed.
          "float poppyPigmentField = sin(vPoppyLocalPosition.x * 1.7 + vPoppyUv.y * 1.4) * cos(vPoppyUv.y * 2.8 - vPoppyLocalPosition.x * 0.35);",
          "float poppyPigmentDepth = smoothstep(-0.72, 0.82, poppyPigmentField);",
          // The reference tissue is deepest around the attachment and along
          // broad radial lanes, then becomes warmer and more transmissive at
          // the free margin. Keep this low-frequency so it reads as pigment
          // held in living membrane rather than a printed texture.
          "float poppyAttachmentDepth = 1.0 - smoothstep(0.04, 0.42, vPoppyUv.y);",
          "float poppyRadialLane = 0.5 + 0.5 * cos(vPoppyLocalPosition.x * 2.35 + vPoppyUv.y * 0.7);",
          "float poppyLivingDepth = clamp(poppyAttachmentDepth * (0.3 + poppyRadialLane * 0.18) + poppyPigmentDepth * 0.34, 0.0, 0.62);",
          // Fine anisotropic membrane structure remains visible under frontal
          // macro light, where normal-only wrinkles otherwise flatten out.
          // Interfering bands avoid a single regular fabric-like frequency.
          "float poppyMembraneEnvelope = smoothstep(0.06, 0.2, vPoppyUv.y) * (1.0 - smoothstep(0.86, 0.99, vPoppyUv.y));",
          "float poppyLongFiber = sin(vPoppyUv.y * 62.0 + vPoppyLocalPosition.x * 5.3 + sin(vPoppyLocalPosition.x * 8.7) * 0.72);",
          "float poppyCrossFiber = sin(vPoppyLocalPosition.x * 43.0 - vPoppyUv.y * 17.0 + sin(vPoppyUv.y * 26.0) * 0.55);",
          "float poppyCellField = poppyLongFiber * 0.72 + poppyCrossFiber * 0.28;",
          // A finer warped layer sits above the structural creases. Multiplying
          // two directions breaks continuous textile-like stripes into short,
          // irregular membrane cells.
          "float poppyFineLong = sin(vPoppyUv.y * 137.0 + vPoppyLocalPosition.x * 17.0 + sin(vPoppyUv.y * 29.0) * 0.8);",
          "float poppyFineCross = sin(vPoppyLocalPosition.x * 89.0 - vPoppyUv.y * 41.0 + sin(vPoppyLocalPosition.x * 23.0) * 0.65);",
          "float poppyFineMembrane = poppyFineLong * poppyFineCross;",
          // Preserve saturated scarlet in folds. Multiplying two sub-0.8 fields
          // previously collapsed most of the lamina into opaque maroon under
          // ordinary macro light instead of reserving deep red for overlaps.
          "vec3 poppyScarletShadow = vec3(0.9, 0.84, 0.86);",
          "vec3 poppyScarletGlow = vec3(1.12, 1.01, 0.97);",
          "diffuseColor.rgb *= mix(poppyScarletShadow, poppyScarletGlow, poppyPigmentDepth);",
          "diffuseColor.rgb *= mix(vec3(1.0), vec3(0.9, 0.94, 0.98), poppyLivingDepth);",
          "diffuseColor.rgb *= 1.0 + (poppyCellField * 0.075 + poppyFineMembrane * 0.035) * poppyMembraneEnvelope;",
        ].join("\n"),
      )
      .replace(
        "#include <normal_fragment_maps>",
        [
          "#include <normal_fragment_maps>",
          // Convert the registered membrane field into restrained screen-space
          // relief. This follows the curved petal surface and supplements the
          // texture normal without changing geometry or silhouette.
          "float poppyFiberHeight = (poppyCellField * 0.82 + poppyFineMembrane * 0.18) * poppyMembraneEnvelope;",
          "vec2 poppyFiberGradient = vec2(dFdx(poppyFiberHeight), dFdy(poppyFiberHeight)) * 1.18;",
          "normal = perturbNormalArb(-vViewPosition, normal, poppyFiberGradient, faceDirection);",
        ].join("\n"),
      )
      .replace(
        "#include <roughnessmap_fragment>",
        [
          "#include <roughnessmap_fragment>",
          // Dry membrane fibers interrupt broad highlights more strongly than
          // they change pigment. Reuse the same bounded field so the response
          // remains registered with the subtle albedo structure.
          "roughnessFactor = clamp(roughnessFactor + (poppyCellField * 0.09 + poppyFineMembrane * 0.035) * poppyMembraneEnvelope, 0.38, 1.0);",
        ].join("\n"),
      )
      .replace(
        "#include <emissivemap_fragment>",
        [
          "#include <emissivemap_fragment>",
          "float poppyRearFacing = dot(-normalize(vPoppyWorldNormal), normalize(poppyBacklightDirection));",
          "float poppyWrappedTransmission = smoothstep(-0.34, 0.76, poppyRearFacing);",
          "float poppyWorldView = dot(normalize(vPoppyWorldNormal), normalize(cameraPosition - vPoppyWorldPosition));",
          "float poppyGrazingScatter = pow(1.0 - abs(poppyWorldView), 1.45);",
          "totalEmissiveRadiance *= 0.02 + poppyWrappedTransmission * poppyBacklightStrength * 2.4 + poppyGrazingScatter * poppyBacklightStrength * 0.25;",
          // Denser fiber crossings transmit slightly less rear light. Keep the
          // modulation shallow so it reads as membrane thickness, not stripes.
          "totalEmissiveRadiance *= 1.0 - poppyCellField * poppyMembraneEnvelope * 0.075;",
        ].join("\n"),
      );
  };
}

export function poppyThinSurfaceProgramKey(rimIntensity: number) {
  return `poppy-thin-surface-v13:${Math.round(rimIntensity * 100)}`;
}
