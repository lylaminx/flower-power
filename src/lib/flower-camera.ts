export type CameraComposition =
  "threeQuarter" | "front" | "macro" | "underside";

export type CameraCompositionView = {
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  defaultFocalLength: number;
};

export const cameraCompositions: Record<
  CameraComposition,
  CameraCompositionView
> = {
  threeQuarter: {
    label: "Three-quarter",
    position: [5.8, 3.2, 7.8],
    target: [0, -0.2, 0],
    defaultFocalLength: 52,
  },
  front: {
    label: "Botanical front",
    position: [0, 0.55, 9.4],
    target: [0, -0.45, 0],
    defaultFocalLength: 58,
  },
  macro: {
    label: "Bloom macro",
    position: [2.7, 1.85, 4.15],
    target: [0, 0.7, 0],
    defaultFocalLength: 85,
  },
  underside: {
    label: "Calyx underside",
    position: [3.9, -0.65, 5.7],
    target: [0, 0.55, 0],
    defaultFocalLength: 65,
  },
};

export const cameraCompositionOptions = [
  "threeQuarter",
  "front",
  "macro",
  "underside",
] as const satisfies readonly CameraComposition[];

export function clampFocalLength(focalLength: number) {
  return Math.min(120, Math.max(28, focalLength));
}
