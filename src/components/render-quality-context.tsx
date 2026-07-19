"use client";

import { createContext, useContext } from "react";
import type { RenderQuality } from "@/lib/flower-quality";

const RenderQualityContext = createContext<RenderQuality>("high");

export const RenderQualityProvider = RenderQualityContext.Provider;

export function useRenderQuality() {
  return useContext(RenderQualityContext);
}
