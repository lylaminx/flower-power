"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { FlowerAdjustmentPanel } from "./flower-adjustment-panel";
import { BrandLogo } from "./brand-logo";
import { ColorControl } from "./flower-controls";
import { FlowerFileLoader } from "./flower-file-loader";
import { SavedFlowersDialog } from "./saved-flowers-dialog";
import { ThemeToggle } from "./theme-toggle";
import type { ExportPng } from "./flower-scene";
import { selectFlowerSettings } from "@/lib/flower-design";
import { downloadFlowerDesign } from "@/lib/flower-file";
import { getHeroFlowerProfile } from "@/lib/hero-flower-profiles";
import { flowerPresets, useFlowerStore } from "@/lib/flower-store";
import {
  lightingPresets,
  lightingRigs,
  type LightingPreset,
} from "@/lib/flower-lighting";
import {
  cameraCompositionOptions,
  cameraCompositions,
  type CameraComposition,
} from "@/lib/flower-camera";
import {
  renderQualityOptions,
  renderQualitySettings,
  getEffectiveRenderQuality,
  type RenderQuality,
} from "@/lib/flower-quality";

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

function CanvasControlPanel({
  lightingPreset,
  setLightingPreset,
  cameraComposition,
  setCameraComposition,
  focalLength,
  setFocalLength,
  depthOfField,
  setDepthOfField,
  aperture,
  setAperture,
  focusDistance,
  setFocusDistance,
  highlightBloom,
  setHighlightBloom,
  bloomIntensity,
  setBloomIntensity,
  ambientOcclusion,
  setAmbientOcclusion,
  ambientOcclusionStrength,
  setAmbientOcclusionStrength,
  renderQuality,
  setRenderQuality,
  qualityInteraction,
}: {
  lightingPreset: LightingPreset;
  setLightingPreset: (value: LightingPreset) => void;
  cameraComposition: CameraComposition;
  setCameraComposition: (value: CameraComposition) => void;
  focalLength: number;
  setFocalLength: (value: number) => void;
  depthOfField: boolean;
  setDepthOfField: (value: boolean) => void;
  aperture: number;
  setAperture: (value: number) => void;
  focusDistance: number;
  setFocusDistance: (value: number) => void;
  highlightBloom: boolean;
  setHighlightBloom: (value: boolean) => void;
  bloomIntensity: number;
  setBloomIntensity: (value: number) => void;
  ambientOcclusion: boolean;
  setAmbientOcclusion: (value: boolean) => void;
  ambientOcclusionStrength: number;
  setAmbientOcclusionStrength: (value: number) => void;
  renderQuality: RenderQuality;
  setRenderQuality: (value: RenderQuality) => void;
  qualityInteraction: boolean;
}) {
  const store = useFlowerStore();

  return (
    <aside className="canvas-control-panel" aria-label="Render controls">
      <section
        className="canvas-control-section"
        aria-label="Lighting controls"
      >
        <span>LIGHTING</span>
        <label>
          <select
            aria-label="Photographic lighting preset"
            value={lightingPreset}
            onChange={(event) => {
              setLightingPreset(event.target.value as LightingPreset);
              if (store.renderMode !== "photo")
                store.set("renderMode", "photo");
            }}
          >
            {lightingPresets.map((preset) => (
              <option key={preset} value={preset}>
                {lightingRigs[preset].label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section
        className="canvas-control-section"
        aria-label="Composition controls"
      >
        <span>COMPOSITION</span>
        <label>
          <select
            aria-label="Camera composition"
            value={cameraComposition}
            onChange={(event) => {
              const composition = event.target.value as CameraComposition;
              setCameraComposition(composition);
              setFocalLength(cameraCompositions[composition].defaultFocalLength);
            }}
          >
            {cameraCompositionOptions.map((composition) => (
              <option key={composition} value={composition}>
                {cameraCompositions[composition].label}
              </option>
            ))}
          </select>
        </label>
        <label className="canvas-control-range">
          <span>FOCAL LENGTH</span>
          <div>
            <input
              aria-label="Camera focal length"
              type="range"
              min="28"
              max="120"
              step="1"
              value={focalLength}
              onChange={(event) => setFocalLength(Number(event.target.value))}
            />
            <b>{focalLength} mm</b>
          </div>
        </label>
        <label className="canvas-control-toggle">
          <span>DEPTH OF FIELD</span>
          <input
            aria-label="Enable depth of field"
            type="checkbox"
            checked={depthOfField}
            onChange={(event) => {
              setDepthOfField(event.target.checked);
              if (event.target.checked && store.renderMode !== "photo")
                store.set("renderMode", "photo");
            }}
          />
        </label>
        {depthOfField && (
          <>
            <label className="canvas-control-range">
              <span>APERTURE</span>
              <div>
                <input
                  aria-label="Camera aperture"
                  type="range"
                  min="1.4"
                  max="16"
                  step="0.1"
                  value={aperture}
                  onChange={(event) => setAperture(Number(event.target.value))}
                />
                <b>ƒ/{aperture.toFixed(1)}</b>
              </div>
            </label>
            <label className="canvas-control-range">
              <span>FOCUS DISTANCE</span>
              <div>
                <input
                  aria-label="Camera focus distance"
                  type="range"
                  min="1"
                  max="14"
                  step="0.1"
                  value={focusDistance}
                  onChange={(event) =>
                    setFocusDistance(Number(event.target.value))
                  }
                />
                <b>{focusDistance.toFixed(1)} m</b>
              </div>
            </label>
          </>
        )}
      </section>

      <section
        className="canvas-control-section"
        aria-label="Quality controls"
      >
        <span>QUALITY</span>
        <label>
          <select
            aria-label="Rendering quality"
            value={renderQuality}
            onChange={(event) =>
              setRenderQuality(event.target.value as RenderQuality)
            }
          >
            {renderQualityOptions.map((quality) => (
              <option key={quality} value={quality}>
                {renderQualitySettings[quality].label}
              </option>
            ))}
          </select>
        </label>
        {qualityInteraction && renderQuality !== "draft" && (
          <small className="canvas-control-note">Editing in Draft…</small>
        )}
        <label className="canvas-control-toggle">
          <span>HIGHLIGHT BLOOM</span>
          <input
            aria-label="Enable highlight bloom"
            type="checkbox"
            checked={highlightBloom}
            onChange={(event) => {
              setHighlightBloom(event.target.checked);
              if (event.target.checked && store.renderMode !== "photo")
                store.set("renderMode", "photo");
            }}
          />
        </label>
        {highlightBloom && (
          <label className="canvas-control-range">
            <span>BLOOM STRENGTH</span>
            <div>
              <input
                aria-label="Highlight bloom strength"
                type="range"
                min="0.04"
                max="0.35"
                step="0.01"
                value={bloomIntensity}
                onChange={(event) =>
                  setBloomIntensity(Number(event.target.value))
                }
              />
              <b>{bloomIntensity.toFixed(2)}</b>
            </div>
          </label>
        )}
        <label className="canvas-control-toggle">
          <span>AMBIENT OCCLUSION</span>
          <input
            aria-label="Enable ambient occlusion"
            type="checkbox"
            checked={ambientOcclusion}
            onChange={(event) => {
              setAmbientOcclusion(event.target.checked);
              if (event.target.checked && store.renderMode !== "photo")
                store.set("renderMode", "photo");
            }}
          />
        </label>
        {ambientOcclusion && (
          <label className="canvas-control-range">
            <span>OCCLUSION STRENGTH</span>
            <div>
              <input
                aria-label="Ambient occlusion strength"
                type="range"
                min="0.15"
                max="0.8"
                step="0.01"
                value={ambientOcclusionStrength}
                onChange={(event) =>
                  setAmbientOcclusionStrength(Number(event.target.value))
                }
              />
              <b>{ambientOcclusionStrength.toFixed(2)}</b>
            </div>
          </label>
        )}
      </section>
    </aside>
  );
}

type PersistenceMode = "database" | "file";

const configuredPersistenceMode: PersistenceMode =
  process.env.NEXT_PUBLIC_PERSISTENCE_MODE === "file" ? "file" : "database";

export function FlowerStudio({
  persistenceMode = configuredPersistenceMode,
}: {
  persistenceMode?: PersistenceMode;
}) {
  const exportPngRef = useRef<ExportPng | null>(null);
  const [exportReady, setExportReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lightingPreset, setLightingPreset] =
    useState<LightingPreset>("botanicalStudio");
  const [cameraComposition, setCameraComposition] =
    useState<CameraComposition>("threeQuarter");
  const [focalLength, setFocalLength] = useState(
    cameraCompositions.threeQuarter.defaultFocalLength,
  );
  const [depthOfField, setDepthOfField] = useState(false);
  const [aperture, setAperture] = useState(5.6);
  const [focusDistance, setFocusDistance] = useState(7);
  const [highlightBloom, setHighlightBloom] = useState(false);
  const [bloomIntensity, setBloomIntensity] = useState(0.12);
  const [ambientOcclusion, setAmbientOcclusion] = useState(false);
  const [ambientOcclusionStrength, setAmbientOcclusionStrength] =
    useState(0.42);
  const [renderQuality, setRenderQuality] = useState<RenderQuality>("high");
  const [qualityInteraction, setQualityInteraction] = useState(false);
  const qualityRestoreTimer = useRef<number | null>(null);
  const qualityInteractionActive = useRef(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const store = useFlowerStore();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("Untitled study");
  const heroProfile = getHeroFlowerProfile(store.preset);
  const studioView = useMemo(
    () => ({
      position: cameraCompositions[cameraComposition].position,
      target: cameraCompositions[cameraComposition].target,
      fov: 36,
    }),
    [cameraComposition],
  );
  const effectiveRenderQuality = getEffectiveRenderQuality(
    renderQuality,
    qualityInteraction,
  );

  useEffect(
    () => () => {
      if (qualityRestoreTimer.current !== null)
        window.clearTimeout(qualityRestoreTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (saveDialogOpen) setSaveTitle(`${store.preset} study`);
  }, [saveDialogOpen, store.preset]);

  useEffect(() => {
    if (!saveDialogOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSaveDialogOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [saveDialogOpen]);

  const beginQualityInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    const target = event.target;
    const isRange =
      target instanceof HTMLInputElement && target.type === "range";
    const isCanvas = target instanceof HTMLCanvasElement;
    if (!isRange && !isCanvas) return;
    if (qualityRestoreTimer.current !== null)
      window.clearTimeout(qualityRestoreTimer.current);
    qualityInteractionActive.current = true;
    setQualityInteraction(true);
  };

  const endQualityInteraction = () => {
    if (!qualityInteractionActive.current) return;
    if (qualityRestoreTimer.current !== null)
      window.clearTimeout(qualityRestoreTimer.current);
    qualityRestoreTimer.current = window.setTimeout(() => {
      qualityInteractionActive.current = false;
      setQualityInteraction(false);
      qualityRestoreTimer.current = null;
    }, 180);
  };

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

  const openSaveDialog = () => {
    setSaveTitle(`${store.preset} study`);
    setSaveDialogOpen(true);
  };

  const save = async (title: string) => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;
    setSaveStatus("saving");
    try {
      const design = {
        name: normalizedTitle,
        settings: selectFlowerSettings(store),
      };
      if (persistenceMode === "file") {
        downloadFlowerDesign(design);
      } else {
        const response = await fetch("/api/flowers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(design),
        });
        if (!response.ok)
          throw new Error(`Save failed with status ${response.status}`);
      }
      setSaveStatus("saved");
      setSaveDialogOpen(false);
      window.setTimeout(() => setSaveStatus("idle"), 1800);
    } catch (error) {
      console.error("Could not save study", error);
      setSaveStatus("error");
    }
  };

  return (
    <main
      className="studio-shell"
      onPointerDownCapture={beginQualityInteraction}
      onPointerUpCapture={endQualityInteraction}
      onPointerCancelCapture={endQualityInteraction}
    >
      <header className="topbar">
        <div className="brand">
          <BrandLogo />
        </div>
        <div className="study-name">
          <span>UNTITLED STUDY</span>
          <b>{store.preset} study</b>
        </div>
        <div className="top-actions">
          <ThemeToggle />
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
          {persistenceMode === "file" ? (
            <FlowerFileLoader />
          ) : (
            <SavedFlowersDialog />
          )}
          <button
            className="secondary-button"
            disabled={saveStatus === "saving"}
            onClick={openSaveDialog}
          >
            <Save size={17} />
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "saved"
                ? "Saved"
                : saveStatus === "error"
                  ? "Save failed"
                  : persistenceMode === "file"
                    ? "Save JSON"
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

      {saveDialogOpen && (
        <div
          className="dialog-backdrop"
          onMouseDown={() => setSaveDialogOpen(false)}
        >
          <section
            className="save-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-study-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>SAVE STUDY</span>
                <h2 id="save-study-title">Name your study</h2>
              </div>
              <button
                className="library-close"
                aria-label="Close save dialog"
                onClick={() => setSaveDialogOpen(false)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>
            <form
              className="save-dialog-form"
              onSubmit={(event) => {
                event.preventDefault();
                void save(saveTitle);
              }}
            >
              <label className="save-dialog-field">
                <span>Title</span>
                <input
                  aria-label="Study title"
                  autoFocus
                  maxLength={120}
                  placeholder="Untitled study"
                  value={saveTitle}
                  onChange={(event) => setSaveTitle(event.target.value)}
                />
              </label>
              <div className="save-dialog-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setSaveDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saveStatus === "saving" || !saveTitle.trim()}
                >
                  <Save size={17} />
                  {persistenceMode === "file" ? "Save JSON" : "Save study"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

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
              {heroProfile && (
                <div className="hero-reference-card">
                  <span className="hero-reference-kicker">Hero reference</span>
                  <h3>{heroProfile.label}</h3>
                  <p>{heroProfile.referenceViews.join(" · ")}</p>
                  <ul className="hero-trait-list">
                    {heroProfile.traits.map((trait) => (
                      <li key={trait}>{trait}</li>
                    ))}
                  </ul>
                  <div className="hero-checks">
                    <span className="hero-reference-kicker">Reference checks</span>
                    <ul className="hero-check-list">
                      {heroProfile.referenceChecks.map((check) => (
                        <li key={check}>{check}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="hero-view-list">
                    {heroProfile.referenceViews.map((view) => (
                      <span key={view}>{view}</span>
                    ))}
                  </div>
                  <div className="hero-reference-actions">
                    <Link className="secondary-button" href="/reference-boards">
                      Open reference boards
                    </Link>
                  </div>
                </div>
              )}
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
          <FlowerScene
            onExportReady={registerExporter}
            lightingPreset={lightingPreset}
            view={studioView}
            focalLength={focalLength}
            depthOfField={depthOfField}
            aperture={aperture}
            focusDistance={focusDistance}
            highlightBloom={highlightBloom}
            bloomIntensity={bloomIntensity}
            ambientOcclusion={ambientOcclusion}
            ambientOcclusionStrength={ambientOcclusionStrength}
            quality={effectiveRenderQuality}
          />
          <CanvasControlPanel
            lightingPreset={lightingPreset}
            setLightingPreset={setLightingPreset}
            cameraComposition={cameraComposition}
            setCameraComposition={setCameraComposition}
            focalLength={focalLength}
            setFocalLength={setFocalLength}
            depthOfField={depthOfField}
            setDepthOfField={setDepthOfField}
            aperture={aperture}
            setAperture={setAperture}
            focusDistance={focusDistance}
            setFocusDistance={setFocusDistance}
            highlightBloom={highlightBloom}
            setHighlightBloom={setHighlightBloom}
            bloomIntensity={bloomIntensity}
            setBloomIntensity={setBloomIntensity}
            ambientOcclusion={ambientOcclusion}
            setAmbientOcclusion={setAmbientOcclusion}
            ambientOcclusionStrength={ambientOcclusionStrength}
            setAmbientOcclusionStrength={setAmbientOcclusionStrength}
            renderQuality={renderQuality}
            setRenderQuality={setRenderQuality}
            qualityInteraction={qualityInteraction}
          />
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
