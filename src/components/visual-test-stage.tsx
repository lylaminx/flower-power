"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { VisualTestScenario } from "@/lib/visual-test-scenarios";
import { useFlowerStore } from "@/lib/flower-store";

const FlowerScene = dynamic(
  () => import("./flower-scene").then((module) => module.FlowerScene),
  { ssr: false },
);

export function VisualTestStage({
  scenario,
}: {
  scenario: VisualTestScenario;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const store = useFlowerStore.getState();
    store.applyPreset(scenario.species, scenario.seed);
    store.set("renderMode", scenario.renderMode);
    store.set("lightIntensity", scenario.lightIntensity);
    store.set("grid", false);
  }, [scenario]);

  const markReady = useCallback(() => setReady(true), []);

  return (
    <main
      className="visual-test-stage"
      data-scenario={scenario.id}
      data-visual-test-ready={ready ? "true" : "false"}
      style={{
        aspectRatio: `${scenario.dimensions.width} / ${scenario.dimensions.height}`,
      }}
    >
      <FlowerScene
        backgroundColor="#ffffff"
        environment={false}
        interactive={false}
        onExportReady={() => undefined}
        onSceneReady={markReady}
        view={scenario.camera}
        lightingPreset={scenario.lighting}
        focalLength={scenario.focalLength}
        depthOfField={scenario.effects?.depthOfField}
        aperture={scenario.effects?.aperture}
        focusDistance={scenario.effects?.focusDistance}
        ambientOcclusion={scenario.effects?.ambientOcclusion}
      />
    </main>
  );
}
