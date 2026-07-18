import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  createLeafGeometry,
  createLeafAttachments,
  createPetalGeometry,
  createTaperedStem,
  seededRandom,
} from "@/lib/flower-geometry";

describe("flower geometry", () => {
  it("produces deterministic normalized random values", () => {
    expect(seededRandom(42)).toBe(seededRandom(42));
    expect(seededRandom(42)).toBeGreaterThanOrEqual(0);
    expect(seededRandom(42)).toBeLessThan(1);
    expect(seededRandom(42)).not.toBe(seededRandom(43));
  });

  it("creates an indexed, colored, volumetric petal", () => {
    const geometry = createPetalGeometry({
      length: 1.6,
      width: 0.6,
      curl: 0.25,
      lift: 0.1,
      baseColor: "#d47a9a",
      tipColor: "#f0b4c2",
      notch: 0.1,
      profile: 0.48,
      waviness: 0.5,
      wavePhase: 1.2,
      thicknessScale: 1.4,
      fold: 0.7,
      twist: -0.3,
      baseWidth: 1.2,
    });

    expect(geometry.getAttribute("position").count).toBe(342);
    expect(geometry.getAttribute("color").count).toBe(342);
    expect(geometry.getAttribute("uv").count).toBe(342);
    expect(geometry.getAttribute("normal").count).toBe(342);
    expect(geometry.index?.count).toBeGreaterThan(1_500);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox?.max.z).toBeGreaterThan(1.4);
    expect(geometry.boundingBox?.max.y).toBeGreaterThan(
      geometry.boundingBox?.min.y ?? 0,
    );
    geometry.dispose();
  });

  it("creates a curved indexed leaf", () => {
    const geometry = createLeafGeometry(0.3, 42);

    expect(geometry.getAttribute("position").count).toBe(119);
    expect(geometry.getAttribute("normal").count).toBe(119);
    expect(geometry.getAttribute("uv").count).toBe(119);
    expect(geometry.getAttribute("color").count).toBe(119);
    expect(geometry.index?.count).toBe(576);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox?.max.y).toBeCloseTo(1.35);
    expect(geometry.boundingBox?.max.z).toBeGreaterThan(0.1);
    geometry.dispose();
  });

  it("creates distinct linear and lobed leaf silhouettes", () => {
    const linear = createLeafGeometry(0.4, 42, "linear", 0);
    const lobed = createLeafGeometry(0.4, 42, "lobed", 0.12);
    linear.computeBoundingBox();
    lobed.computeBoundingBox();

    const linearWidth =
      (linear.boundingBox?.max.x ?? 0) - (linear.boundingBox?.min.x ?? 0);
    const lobedWidth =
      (lobed.boundingBox?.max.x ?? 0) - (lobed.boundingBox?.min.x ?? 0);
    expect(linearWidth).not.toBeCloseTo(lobedWidth);
    expect(linear.getAttribute("position").array).not.toEqual(
      lobed.getAttribute("position").array,
    );
    linear.dispose();
    lobed.dispose();
  });

  it("creates a tapered tube along a stem curve", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -4, 0),
      new THREE.Vector3(-0.2, -2, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const geometry = createTaperedStem(curve);

    expect(geometry.getAttribute("position").count).toBe(876);
    expect(geometry.getAttribute("normal").count).toBe(876);
    expect(geometry.getAttribute("uv").count).toBe(876);
    expect(geometry.getAttribute("color").count).toBe(876);
    expect(geometry.index?.count).toBe(5_184);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox?.min.y).toBeLessThan(-4);
    expect(geometry.boundingBox?.max.y).toBeGreaterThanOrEqual(0);
    geometry.dispose();
  });

  it("adjusts stem thickness and taper", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -4, 0),
      new THREE.Vector3(0, -2, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const narrow = createTaperedStem(curve, 0.6, 0.1);
    const broad = createTaperedStem(curve, 1.6, 0.65);
    narrow.computeBoundingBox();
    broad.computeBoundingBox();
    expect(broad.boundingBox?.max.x ?? 0).toBeGreaterThan(
      narrow.boundingBox?.max.x ?? 0,
    );
    expect(broad.getAttribute("position").count).toBe(
      narrow.getAttribute("position").count,
    );
    narrow.dispose();
    broad.dispose();
  });

  it("anchors every leaf directly to the stem center wire", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -4, 0),
      new THREE.Vector3(0.2, -2, 0.1),
      new THREE.Vector3(0, 0, 0),
    ]);
    const attachments = createLeafAttachments(curve, 3);

    expect(attachments).toHaveLength(6);
    for (const attachment of attachments) {
      expect(attachment.point.distanceTo(curve.getPointAt(attachment.t))).toBe(
        0,
      );
    }
  });
});
