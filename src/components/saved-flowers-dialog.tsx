"use client";

import { FolderOpen, LoaderCircle, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { SavedFlower, SavedFlowerSummary } from "@/lib/flower-design";
import { useFlowerStore } from "@/lib/flower-store";

type LoadState = "idle" | "loading" | "error";

export function SavedFlowersDialog() {
  const loadSettings = useFlowerStore((state) => state.loadSettings);
  const [open, setOpen] = useState(false);
  const [flowers, setFlowers] = useState<SavedFlowerSummary[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [loadingId, setLoadingId] = useState<string>();

  const refresh = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/flowers");
      if (!response.ok) throw new Error(`List failed (${response.status})`);
      const body = (await response.json()) as { flowers: SavedFlowerSummary[] };
      setFlowers(body.flowers);
      setState("idle");
    } catch (error) {
      console.error("Could not load saved flowers", error);
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const loadFlower = async (id: string) => {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/flowers/${id}`);
      if (!response.ok) throw new Error(`Load failed (${response.status})`);
      const body = (await response.json()) as { flower: SavedFlower };
      loadSettings(body.flower.settings);
      setOpen(false);
    } catch (error) {
      console.error("Could not load saved flower", error);
      setState("error");
    } finally {
      setLoadingId(undefined);
    }
  };

  return (
    <>
      <button className="secondary-button" onClick={() => setOpen(true)}>
        <FolderOpen size={17} />
        Saved flowers
      </button>
      {open && (
        <div className="dialog-backdrop" onMouseDown={() => setOpen(false)}>
          <section
            className="flower-library"
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-flowers-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>YOUR COLLECTION</span>
                <h2 id="saved-flowers-title">Saved flowers</h2>
              </div>
              <button
                className="library-close"
                aria-label="Close saved flowers"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </header>

            <div className="flower-library-list">
              {state === "loading" && (
                <p className="library-message">
                  <LoaderCircle className="spin" size={18} /> Loading flowers…
                </p>
              )}
              {state === "error" && (
                <div className="library-message">
                  <p>We couldn’t reach the flower collection.</p>
                  <button onClick={() => void refresh()}>Try again</button>
                </div>
              )}
              {state === "idle" && flowers.length === 0 && (
                <p className="library-message">
                  No saved flowers yet. Save a study to begin your collection.
                </p>
              )}
              {state === "idle" &&
                flowers.map((flower) => (
                  <article className="saved-flower-card" key={flower.id}>
                    <div className="saved-flower-mark">✿</div>
                    <div>
                      <h3>{flower.name}</h3>
                      <p>
                        {flower.preset} · Seed {flower.seed} ·{" "}
                        {flower.renderMode}
                      </p>
                      <time dateTime={flower.createdAt}>
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(flower.createdAt))}
                      </time>
                    </div>
                    <button
                      disabled={Boolean(loadingId)}
                      onClick={() => void loadFlower(flower.id)}
                    >
                      {loadingId === flower.id ? "Loading…" : "Load"}
                    </button>
                  </article>
                ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
