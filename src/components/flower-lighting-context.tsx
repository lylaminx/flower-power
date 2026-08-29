"use client";

import { createContext, type ReactNode, useContext } from "react";
import { lightingRigs, type LightingRig } from "@/lib/flower-lighting";

const FlowerLightingContext = createContext<LightingRig>(
  lightingRigs.botanicalStudio,
);

export function FlowerLightingProvider({
  rig,
  children,
}: {
  rig: LightingRig;
  children: ReactNode;
}) {
  return (
    <FlowerLightingContext.Provider value={rig}>
      {children}
    </FlowerLightingContext.Provider>
  );
}

export function useFlowerLightingRig() {
  return useContext(FlowerLightingContext);
}
