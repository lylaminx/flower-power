"use client";

import { useFlowerStore } from "@/lib/flower-store";

type RangeProperty =
  | "petalCount"
  | "petalLength"
  | "petalWidth"
  | "petalCurl"
  | "petalWaviness"
  | "petalThickness"
  | "petalFold"
  | "petalTwist"
  | "petalRuffle"
  | "petalNotch"
  | "petalVeinStrength"
  | "petalBaseWidth"
  | "petalAge"
  | "petalSpots"
  | "petalGuideStrength"
  | "bloom"
  | "variation"
  | "centerDensity"
  | "centerSize"
  | "centerProfile"
  | "centerFloretSize"
  | "centerSpread"
  | "centerStamenLength"
  | "centerAntherSize"
  | "centerStigmaSize"
  | "stemCurve"
  | "stemHeight"
  | "stemThickness"
  | "stemTaper"
  | "stemNodeCount"
  | "stemHairDensity"
  | "leafDensity"
  | "leafLength"
  | "leafWidth"
  | "leafCurl"
  | "leafSerration"
  | "leafVeinDensity"
  | "leafDroop"
  | "bloomTilt"
  | "bloomTurn"
  | "lightIntensity";

type ColorProperty =
  | "petalColor"
  | "petalTipColor"
  | "centerColor"
  | "stemColor"
  | "backgroundColor";

export function RangeControl({
  label,
  property,
  min,
  max,
  step = 1,
  suffix = "",
}: {
  label: string;
  property: RangeProperty;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  const value = useFlowerStore((state) => state[property]);
  const set = useFlowerStore((state) => state.set);

  return (
    <label className="range-control">
      <span>
        <em>{label}</em>
        <b>
          {Number.isInteger(step) ? value : value.toFixed(2)}
          {suffix}
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => set(property, Number(event.target.value))}
      />
    </label>
  );
}

export function ColorControl({
  label,
  property,
}: {
  label: string;
  property: ColorProperty;
}) {
  const value = useFlowerStore((state) => state[property]);
  const set = useFlowerStore((state) => state.set);

  return (
    <label className="color-control">
      <span className="swatch" style={{ background: value }}>
        <input
          type="color"
          value={value}
          onChange={(event) => set(property, event.target.value)}
        />
      </span>
      <span>
        {label}
        <small>{value.toUpperCase()}</small>
      </span>
    </label>
  );
}
