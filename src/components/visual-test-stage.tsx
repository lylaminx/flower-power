"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { VisualTestScenario } from "@/lib/visual-test-scenarios";
import { useFlowerStore } from "@/lib/flower-store";
import type { SceneCompilationResult } from "@/lib/scene-readiness";

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
  const [compilation, setCompilation] = useState<SceneCompilationResult | null>(
    null,
  );

  useEffect(() => {
    const store = useFlowerStore.getState();
    store.applyPreset(scenario.species, scenario.seed);
    store.set("renderMode", scenario.renderMode);
    store.set("lightIntensity", scenario.lightIntensity);
    store.set("grid", false);
  }, [scenario]);

  const markReady = useCallback((result: SceneCompilationResult) => {
    setCompilation(result);
    setReady(result.outstanding.length === 0);
  }, []);

  return (
    <main
      className="visual-test-stage"
      data-scenario={scenario.id}
      data-visual-test-ready={ready ? "true" : "false"}
      data-scene-compile-mode={compilation?.mode ?? "pending"}
      data-scene-compile-duration-ms={compilation?.durationMs ?? ""}
      data-scene-readiness-outstanding={
        compilation?.outstanding.join(",") ?? "pending"
      }
      style={{
        aspectRatio: `${scenario.dimensions.width} / ${scenario.dimensions.height}`,
      }}
    >
      <FlowerScene
        backgroundColor={scenario.backgroundColor ?? "#ffffff"}
        groundStyle={scenario.groundStyle}
        fogNear={scenario.fogNear}
        fogFar={scenario.fogFar}
        environment={false}
        interactive={false}
        onExportReady={() => undefined}
        onSceneReady={markReady}
        view={scenario.camera}
        lightingPreset={scenario.lighting}
        quality={scenario.quality}
        focalLength={scenario.focalLength}
        depthOfField={scenario.effects?.depthOfField}
        aperture={scenario.effects?.aperture}
        focusDistance={scenario.effects?.focusDistance}
        ambientOcclusion={scenario.effects?.ambientOcclusion}
      />
    </main>
  );
}
