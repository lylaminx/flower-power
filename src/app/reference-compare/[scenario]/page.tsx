import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getReferenceBoard,
  isHeroFlowerPreset,
} from "@/lib/flower-reference-boards";
import {
  getVisualTestScenario,
  visualTestScenarios,
} from "@/lib/visual-test-scenarios";

export function generateStaticParams() {
  return visualTestScenarios.map((scenario) => ({ scenario: scenario.id }));
}

export default async function ReferenceComparePage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  const { scenario: scenarioId } = await params;
  const scenario = getVisualTestScenario(scenarioId);
  if (!scenario) notFound();
  if (!isHeroFlowerPreset(scenario.species)) notFound();

  const board = await getReferenceBoard(scenario.species);
  if (!board.images.length) notFound();

  return (
    <main className="reference-compare-shell">
      <header className="reference-hero reference-compare-header">
        <div>
          <span className="reference-kicker">REFERENCE COMPARISON</span>
          <h1>{board.label}</h1>
          <p>
            Compare the locked render against the reference board for
            {` `}
            {board.label.toLowerCase()}.
          </p>
        </div>
        <div className="reference-hero-actions">
          <Link className="secondary-button" href="/reference-boards">
            All boards
          </Link>
          <Link className="secondary-button" href={`/visual-test/${scenario.id}`}>
            Open render only
          </Link>
        </div>
      </header>

      <section className="reference-compare-grid">
        <article className="reference-board-card reference-board-card--compare">
          <div className="reference-board-header">
            <div>
              <span className="reference-kicker">PHOTOGRAPHY</span>
              <h2>Reference board</h2>
            </div>
            <Link
              className="secondary-button reference-board-link"
              href={`/visual-test/${scenario.id}`}
            >
              Scenario {scenario.id}
            </Link>
          </div>

          <p className="reference-board-summary">
            {board.traits.join(" · ")}
          </p>

          <div className="reference-image-grid reference-image-grid--compact">
            {board.images.map((image) => (
              <figure key={image.filename} className="reference-image-card">
                <Image
                  src={image.imageUrl}
                  alt={`${board.label} ${image.view}`}
                  width={800}
                  height={600}
                />
                <figcaption>
                  <strong>{image.view}</strong>
                  <span>{image.title}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </article>

        <article className="reference-render-card">
          <div className="reference-render-header">
            <div>
              <span className="reference-kicker">LIVE RENDER</span>
              <h2>{scenario.id}</h2>
            </div>
            <div className="reference-render-meta">
              <span>
                {scenario.dimensions.width}×{scenario.dimensions.height}
              </span>
              <span>{scenario.lighting}</span>
            </div>
          </div>

          <div
            className="reference-render-frame"
            style={{
              aspectRatio: `${scenario.dimensions.width} / ${scenario.dimensions.height}`,
            }}
          >
            <iframe
              src={`/visual-test/${scenario.id}`}
              title={`Visual test render for ${board.label}`}
            />
          </div>
        </article>
      </section>
    </main>
  );
}
