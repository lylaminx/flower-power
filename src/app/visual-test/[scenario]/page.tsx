import { notFound } from "next/navigation";
import { VisualTestStage } from "@/components/visual-test-stage";
import {
  getVisualTestScenario,
  visualTestScenarios,
} from "@/lib/visual-test-scenarios";

export function generateStaticParams() {
  return visualTestScenarios.map((scenario) => ({ scenario: scenario.id }));
}

export default async function VisualTestPage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  const { scenario: scenarioId } = await params;
  const scenario = getVisualTestScenario(scenarioId);
  if (!scenario) notFound();

  return <VisualTestStage scenario={scenario} />;
}
