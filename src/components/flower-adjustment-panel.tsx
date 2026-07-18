"use client";

import { ChevronRight, Menu } from "lucide-react";
import { RangeControl } from "./flower-controls";
import { useFlowerStore } from "@/lib/flower-store";

export function FlowerAdjustmentPanel() {
  const store = useFlowerStore();

  return (
    <aside
      className={`control-panel right-panel ${store.rightPanelOpen ? "open" : "closed"}`}
    >
      <button
        className="panel-toggle right-panel-toggle"
        onClick={store.toggleRightPanel}
        aria-label="Toggle adjustment panel"
      >
        {store.rightPanelOpen ? <ChevronRight /> : <Menu />}
      </button>

      <div className="panel-content">
        <div className="panel-heading adjustment-heading">
          <span>FLOWER DETAILS</span>
          <h1>Refine your study</h1>
          <p>Adjust form, color, and presentation.</p>
        </div>

        <div className="control-section">
          <h2>Flower center</h2>
          <RangeControl
            label="Element density"
            property="centerDensity"
            min={0.25}
            max={2}
            step={0.05}
          />
          <RangeControl
            label="Center size"
            property="centerSize"
            min={0.5}
            max={1.7}
            step={0.01}
          />
          <RangeControl
            label="Center profile"
            property="centerProfile"
            min={0.4}
            max={1.8}
            step={0.01}
          />
          <RangeControl
            label="Floret size"
            property="centerFloretSize"
            min={0.5}
            max={1.8}
            step={0.01}
          />
          <RangeControl
            label="Element spread"
            property="centerSpread"
            min={0.5}
            max={1.35}
            step={0.01}
          />
          <RangeControl
            label="Filament length"
            property="centerStamenLength"
            min={0.4}
            max={2}
            step={0.01}
          />
          <RangeControl
            label="Anther size"
            property="centerAntherSize"
            min={0.4}
            max={2}
            step={0.01}
          />
          <RangeControl
            label="Stigma size"
            property="centerStigmaSize"
            min={0.4}
            max={2}
            step={0.01}
          />
        </div>

        <div className="control-section">
          <h2>Petal form</h2>
          <RangeControl
            label="Petal count"
            property="petalCount"
            min={1}
            max={32}
          />
          <RangeControl
            label="Length"
            property="petalLength"
            min={0.8}
            max={2.2}
            step={0.05}
          />
          <RangeControl
            label="Width"
            property="petalWidth"
            min={0.25}
            max={1.2}
            step={0.05}
          />
          <RangeControl
            label="Tip curl"
            property="petalCurl"
            min={0}
            max={1}
            step={0.01}
          />
          <RangeControl
            label="Petal waviness"
            property="petalWaviness"
            min={0}
            max={1}
            step={0.01}
          />
          <RangeControl
            label="Base width"
            property="petalBaseWidth"
            min={0.5}
            max={1.8}
            step={0.01}
          />
          <RangeControl
            label="Blade thickness"
            property="petalThickness"
            min={0.25}
            max={2}
            step={0.01}
          />
          <RangeControl
            label="Central fold"
            property="petalFold"
            min={0}
            max={1}
            step={0.01}
          />
          <RangeControl
            label="Longitudinal twist"
            property="petalTwist"
            min={-1}
            max={1}
            step={0.01}
          />
          <RangeControl
            label="Edge ruffle"
            property="petalRuffle"
            min={0}
            max={2}
            step={0.01}
          />
          <RangeControl
            label="Tip notch"
            property="petalNotch"
            min={0}
            max={2}
            step={0.01}
          />
          <RangeControl
            label="Vein relief"
            property="petalVeinStrength"
            min={0}
            max={2}
            step={0.01}
          />
          <RangeControl
            label="Petal age"
            property="petalAge"
            min={0}
            max={1}
            step={0.01}
          />
          <RangeControl
            label="Natural spotting"
            property="petalSpots"
            min={0}
            max={1}
            step={0.01}
          />
          <RangeControl
            label="Nectar guides"
            property="petalGuideStrength"
            min={0}
            max={1}
            step={0.01}
          />
          <RangeControl
            label="Bloom"
            property="bloom"
            min={0.25}
            max={1}
            step={0.01}
          />
          <RangeControl
            label="Natural variation"
            property="variation"
            min={0}
            max={0.5}
            step={0.01}
          />
        </div>

        <div className="control-section">
          <h2>Stem structure</h2>
          <RangeControl
            label="Stem curve"
            property="stemCurve"
            min={0}
            max={1.2}
            step={0.01}
          />
          <RangeControl
            label="Height"
            property="stemHeight"
            min={0.65}
            max={1.35}
            step={0.01}
          />
          <RangeControl
            label="Thickness"
            property="stemThickness"
            min={0.5}
            max={1.8}
            step={0.01}
          />
          <RangeControl
            label="Taper"
            property="stemTaper"
            min={0}
            max={0.7}
            step={0.01}
          />
          <RangeControl
            label="Growth nodes"
            property="stemNodeCount"
            min={0}
            max={8}
          />
          <RangeControl
            label="Stem hairs"
            property="stemHairDensity"
            min={0}
            max={2}
            step={0.05}
          />
        </div>

        <div className="control-section">
          <h2>Leaf structure</h2>
          <RangeControl
            label="Foliage amount"
            property="leafDensity"
            min={0}
            max={2}
            step={0.1}
          />
          <RangeControl
            label="Leaf length"
            property="leafLength"
            min={0.5}
            max={1.6}
            step={0.01}
          />
          <RangeControl
            label="Leaf width"
            property="leafWidth"
            min={0.5}
            max={1.6}
            step={0.01}
          />
          <RangeControl
            label="Leaf curl"
            property="leafCurl"
            min={0}
            max={1}
            step={0.01}
          />
          <RangeControl
            label="Edge serration"
            property="leafSerration"
            min={0}
            max={2}
            step={0.05}
          />
          <RangeControl
            label="Vein density"
            property="leafVeinDensity"
            min={0.25}
            max={2}
            step={0.05}
          />
          <RangeControl
            label="Leaf droop"
            property="leafDroop"
            min={0}
            max={1}
            step={0.01}
          />
        </div>

        <div className="control-section">
          <h2>Natural pose</h2>
          <RangeControl
            label="Bloom tilt"
            property="bloomTilt"
            min={-0.6}
            max={0.6}
            step={0.01}
          />
          <RangeControl
            label="Bloom turn"
            property="bloomTurn"
            min={-3.15}
            max={3.15}
            step={0.05}
          />
        </div>

        <div className="control-section">
          <h2>Scene</h2>
          <RangeControl
            label="Key light"
            property="lightIntensity"
            min={0.3}
            max={3}
            step={0.1}
          />
        </div>
      </div>
    </aside>
  );
}
