export type RenderQuality = "draft" | "high" | "ultra";

export type RenderQualitySettings = {
  label: string;
  maxDpr: number;
  shadows: boolean;
  shadowMapSize: 512 | 1024 | 2048;
  contactShadowResolution: 256 | 512 | 1024;
  environment: boolean;
  postProcessing: boolean;
  postProcessingScale: number;
};

export const renderQualityOptions = [
  "draft",
  "high",
  "ultra",
] as const satisfies readonly RenderQuality[];

export const renderQualitySettings: Record<
  RenderQuality,
  RenderQualitySettings
> = {
  draft: {
    label: "Draft",
    maxDpr: 1,
    shadows: false,
    shadowMapSize: 512,
    contactShadowResolution: 256,
    environment: false,
    postProcessing: false,
    postProcessingScale: 0.5,
  },
  high: {
    label: "High",
    maxDpr: 1.5,
    shadows: true,
    shadowMapSize: 1024,
    contactShadowResolution: 512,
    environment: true,
    postProcessing: true,
    postProcessingScale: 0.75,
  },
  ultra: {
    label: "Ultra",
    maxDpr: 2,
    shadows: true,
    shadowMapSize: 2048,
    contactShadowResolution: 1024,
    environment: true,
    postProcessing: true,
    postProcessingScale: 1,
  },
};

export function getTextureResolution(quality: RenderQuality) {
  return quality === "draft" ? 64 : quality === "ultra" ? 256 : 128;
}

export function getEffectiveRenderQuality(
  selected: RenderQuality,
  interacting: boolean,
): RenderQuality {
  return interacting && selected !== "draft" ? "draft" : selected;
}
