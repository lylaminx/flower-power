import Link from "next/link";
import Image from "next/image";
import { getReferenceBoards } from "@/lib/flower-reference-boards";

export const metadata = {
  title: "Reference boards · FlowerPower",
  description: "Licensed photographic reference boards for the six hero species.",
};

export default async function ReferenceBoardsPage() {
  const boards = await getReferenceBoards();

  return (
    <main className="reference-boards-shell">
      <header className="reference-hero">
        <div>
          <span className="reference-kicker">PHOTOGRAPHIC REFERENCE</span>
          <h1>Hero species reference boards</h1>
          <p>
            Licensed reference photos for the six hero species, grouped by
            view, provenance, and the anatomy checks they inform.
          </p>
        </div>
        <div className="reference-hero-actions">
          <Link className="secondary-button" href="/">
            Back to studio
          </Link>
        </div>
      </header>

      <section className="reference-board-grid">
        {boards.map((board) => (
          <article key={board.species} className="reference-board-card">
            <div className="reference-board-header">
              <div>
                <span className="reference-kicker">{board.species}</span>
                <h2>{board.label}</h2>
              </div>
              {board.scenarioId && (
                <Link
                  className="secondary-button reference-board-link"
                  href={`/reference-compare/${board.scenarioId}`}
                >
                  Compare render
                </Link>
              )}
            </div>

            <p className="reference-board-summary">
              {board.traits.join(" · ")}
            </p>

            <div className="reference-chip-row">
              {board.referenceChecks.map((check) => (
                <span key={check} className="reference-chip">
                  {check}
                </span>
              ))}
            </div>

            <div className="reference-image-grid">
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
                    <span>
                      {image.creator}
                      {image.license ? ` · ${image.license}` : ""}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
