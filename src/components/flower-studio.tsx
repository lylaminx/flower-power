"use client";

import dynamic from "next/dynamic";
import {
  Camera,
  Aperture,
  BookOpen,
  ChevronLeft,
  Download,
  Menu,
  Grid3X3,
  Pencil,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { FlowerAdjustmentPanel } from "./flower-adjustment-panel";
import { ColorControl } from "./flower-controls";
import { SavedFlowersDialog } from "./saved-flowers-dialog";
import type { ExportPng } from "./flower-scene";
import { selectFlowerSettings } from "@/lib/flower-design";
import { flowerPresets, useFlowerStore } from "@/lib/flower-store";

const FlowerScene = dynamic(
  () => import("./flower-scene").then((mod) => mod.FlowerScene),
  {
    ssr: false,
    loading: () => (
      <div className="canvas-loading">
        <span />
        Growing your flower…
      </div>
    ),
  },
);

export function FlowerStudio() {
  const exportPngRef = useRef<ExportPng | null>(null);
  const [exportReady, setExportReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const store = useFlowerStore();

  const registerExporter = useCallback((exportPng: ExportPng | null) => {
    exportPngRef.current = exportPng;
    setExportReady(Boolean(exportPng));
  }, []);

  const exportImage = async () => {
    if (!exportPngRef.current) return;
    setExporting(true);
    try {
      await exportPngRef.current();
    } catch (error) {
      console.error("PNG export failed", error);
    } finally {
      setExporting(false);
    }
  };

  const save = async () => {
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/flowers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${store.preset} study`,
          settings: selectFlowerSettings(store),
        }),
      });
      if (!response.ok)
        throw new Error(`Save failed with status ${response.status}`);
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 1800);
    } catch (error) {
      console.error("Could not save study", error);
      setSaveStatus("error");
    }
  };

  return (
    <main className="studio-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">✿</span>
          <span>
            Flower<em>Power</em>
          </span>
          <small>BOTANICAL STUDIO</small>
        </div>
        <div className="study-name">
          <span>UNTITLED STUDY</span>
          <b>{store.preset} study</b>
        </div>
        <div className="top-actions">
          <a
            className="icon-button"
            href="/docs"
            target="_blank"
            rel="noreferrer"
            aria-label="Open documentation"
            title="Documentation"
          >
            <BookOpen size={18} />
          </a>
          <SavedFlowersDialog />
          <button
            className="secondary-button"
            disabled={saveStatus === "saving"}
            onClick={() => void save()}
          >
            <Save size={17} />
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "saved"
                ? "Saved"
                : saveStatus === "error"
                  ? "Save failed"
                  : "Save study"}
          </button>
          <button
            className="primary-button"
            disabled={!exportReady || exporting}
            onClick={() => void exportImage()}
          >
            <Download size={17} />
            {exporting ? "Exporting…" : "Export PNG"}
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside
          className={`control-panel left-panel ${store.panelOpen ? "open" : "closed"}`}
        >
          <button
            className="panel-toggle"
            onClick={store.togglePanel}
            aria-label="Toggle variety panel"
          >
            {store.panelOpen ? <ChevronLeft /> : <Menu />}
          </button>
          <div className="panel-content">
            <div className="panel-heading">
              <span>FLOWER DESIGN</span>
              <h1>Shape your bloom</h1>
              <p>Begin with a variety, then make it entirely your own.</p>
            </div>
            <div className="control-section">
              <h2>Variety</h2>
              <div className="preset-grid">
                {flowerPresets.map((preset) => (
                  <button
                    key={preset}
                    className={store.preset === preset ? "active" : ""}
                    onClick={() => store.applyPreset(preset)}
                  >
                    <i className={`mini-flower ${preset.toLowerCase()}`} />
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="randomize-wrap">
            <button className="randomize" onClick={store.randomize}>
              <Sparkles size={18} />
              Randomize naturally
            </button>
          </div>
        </aside>

        <div className="canvas-wrap">
          <FlowerScene onExportReady={registerExporter} />
          <div className="canvas-mode-tools" aria-label="Canvas display modes">
            <button
              className={store.renderMode === "line" ? "active" : ""}
              aria-label={
                store.renderMode === "line"
                  ? "Switch to color view"
                  : "Switch to line drawing"
              }
              title="Line drawing"
              onClick={() =>
                store.set(
                  "renderMode",
                  store.renderMode === "line" ? "color" : "line",
                )
              }
            >
              <Pencil size={17} />
            </button>
            <button
              className={store.grid ? "active" : ""}
              aria-label="Toggle composition grid"
              title="XY grid"
              onClick={() => store.set("grid", !store.grid)}
            >
              <Grid3X3 size={17} />
            </button>
            <button
              className={store.renderMode === "photo" ? "active" : ""}
              aria-label={
                store.renderMode === "photo"
                  ? "Switch to color view"
                  : "Switch to photorealistic rendering"
              }
              title="Photorealistic rendering"
              onClick={() =>
                store.set(
                  "renderMode",
                  store.renderMode === "photo" ? "color" : "photo",
                )
              }
            >
              <Aperture size={17} />
            </button>
            <button
              aria-label="Reset canvas view"
              title="Reset view"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={17} />
            </button>
          </div>
          <aside className="canvas-palette" aria-label="Flower color palette">
            <span>COLOR PALETTE</span>
            <div className="colors">
              <ColorControl label="Petal" property="petalColor" />
              <ColorControl label="Petal glow" property="petalTipColor" />
              <ColorControl label="Center" property="centerColor" />
              <ColorControl label="Stem" property="stemColor" />
            </div>
          </aside>
          <div className="canvas-label">
            <span>LIVE STUDY</span>
            <strong>
              {store.preset} · Seed {store.seed}
            </strong>
          </div>
          <div className="canvas-help">
            <Camera size={16} />
            <span>Drag to orbit</span>
            <i />
            Scroll to zoom
          </div>
        </div>

        <FlowerAdjustmentPanel />
      </section>
    </main>
  );
}
