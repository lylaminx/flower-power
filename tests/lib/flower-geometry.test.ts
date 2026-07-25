import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  createLeafGeometry,
  createLeafMarginGeometry,
  createLeafVeinNetwork,
  createLeafAttachments,
  createFusedCorollaGeometry,
  createInflorescencePlacements,
  createPetalGeometry,
  createPetalPlacement,
  createStemPricklePlacements,
  createStemSurfacePlacements,
  createPollenClusterPlacements,
  createPetioleGeometry,
  createTaperedStem,
  getPetalOutlineWidth,
  getLeafOutlineWidth,
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
    expect(geometry.getAttribute("tangent").count).toBe(342);
    expect(geometry.index?.count).toBeGreaterThan(1_500);
    expect(geometry.groups).toHaveLength(3);
    expect(geometry.groups.map((group) => group.materialIndex)).toEqual([
      0, 1, 2,
    ]);
    expect(geometry.groups.reduce((sum, group) => sum + group.count, 0)).toBe(
      geometry.index?.count,
    );
    geometry.computeBoundingBox();
    expect(geometry.boundingBox?.max.z).toBeGreaterThan(1.4);
    expect(geometry.boundingBox?.max.y).toBeGreaterThan(
      geometry.boundingBox?.min.y ?? 0,
    );
    geometry.dispose();
  });

  it("scales petal tessellation for render quality without changing its extent", () => {
    const options = {
      length: 1.6,
      width: 0.6,
      curl: 0.25,
      lift: 0.1,
      baseColor: "#d47a9a",
      tipColor: "#f0b4c2",
      notch: 0.1,
      profile: 0.48,
    };
    const draft = createPetalGeometry({
      ...options,
      lengthSegments: 12,
      widthSegments: 6,
    });
    const ultra = createPetalGeometry({
      ...options,
      lengthSegments: 28,
      widthSegments: 12,
    });
    draft.computeBoundingBox();
    ultra.computeBoundingBox();

    expect(ultra.getAttribute("position").count).toBeGreaterThan(
      draft.getAttribute("position").count * 3,
    );
    expect(ultra.boundingBox?.max.z).toBeCloseTo(
      draft.boundingBox?.max.z ?? 0,
      1,
    );
    draft.dispose();
    ultra.dispose();
  });

  it("creates a closed, UV-mapped fused corolla", () => {
    const geometry = createFusedCorollaGeometry({
      architecture: "trumpet",
      length: 1,
      throatRadius: 0.18,
      mouthRadius: 1.1,
      lobes: 5,
      baseColor: "#536fb4",
      tipColor: "#9caee2",
      seed: 42,
    });

    expect(geometry.getAttribute("position").count).toBe(2058);
    expect(geometry.getAttribute("uv").count).toBe(2058);
    expect(geometry.getAttribute("normal").count).toBe(2058);
    expect(geometry.getAttribute("tangent").count).toBe(2058);
    expect(geometry.index?.count).toBe(12_096);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox?.max.y).toBeGreaterThan(1);
    expect(geometry.boundingBox?.max.x).toBeGreaterThan(1);
    geometry.dispose();
  });

  it("scales fused corolla tessellation by quality", () => {
    const options = {
      architecture: "bell" as const,
      length: 1,
      throatRadius: 0.2,
      mouthRadius: 0.7,
      lobes: 6,
      baseColor: "#536bbb",
      tipColor: "#8797d3",
    };
    const draft = createFusedCorollaGeometry({
      ...options,
      rows: 12,
      radialSegments: 28,
    });
    const ultra = createFusedCorollaGeometry({
      ...options,
      rows: 30,
      radialSegments: 72,
    });

    expect(ultra.getAttribute("position").count).toBeGreaterThan(
      draft.getAttribute("position").count * 4,
    );
    draft.dispose();
    ultra.dispose();
  });

  it("distinguishes a narrow bell from a broad trumpet", () => {
    const common = {
      length: 1,
      throatRadius: 0.18,
      lobes: 5,
      baseColor: "#536bbb",
      tipColor: "#8797d3",
      seed: 9,
    };
    const bell = createFusedCorollaGeometry({
      ...common,
      architecture: "bell",
      mouthRadius: 0.55,
    });
    const trumpet = createFusedCorollaGeometry({
      ...common,
      architecture: "trumpet",
      mouthRadius: 1.2,
    });
    bell.computeBoundingBox();
    trumpet.computeBoundingBox();

    expect(trumpet.boundingBox?.max.x ?? 0).toBeGreaterThan(
      (bell.boundingBox?.max.x ?? 0) * 1.8,
    );
    bell.dispose();
    trumpet.dispose();
  });

  it("creates distinct species-aware petal outlines", () => {
    const ellipticShoulder = getPetalOutlineWidth(0.25, 0.5, "elliptic");
    const fanShoulder = getPetalOutlineWidth(0.25, 0.5, "fan");
    const fanTip = getPetalOutlineWidth(0.7, 0.5, "fan");
    const lanceTip = getPetalOutlineWidth(0.7, 0.5, "lanceolate");

    expect(fanShoulder).toBeLessThan(ellipticShoulder);
    expect(fanTip).toBeGreaterThan(lanceTip);
    expect(getPetalOutlineWidth(0, 0.5, "obovate")).toBeCloseTo(0);
    expect(getPetalOutlineWidth(1, 0.5, "spatulate")).toBeCloseTo(0);
  });

  it("tapers petal thickness toward the edge", () => {
    const geometry = createPetalGeometry({
      length: 1.6,
      width: 0.8,
      curl: 0,
      lift: 0,
      baseColor: "#ffffff",
      tipColor: "#ffffff",
      notch: 0,
      profile: 0.5,
      thicknessScale: 2,
    });
    const positions = geometry.getAttribute("position");
    const faceSize = 19 * 9;
    const middleCenter = 9 * 9 + 4;
    const middleEdge = 9 * 9;
    const centerThickness = Math.abs(
      positions.getY(middleCenter) - positions.getY(middleCenter + faceSize),
    );
    const edgeThickness = Math.abs(
      positions.getY(middleEdge) - positions.getY(middleEdge + faceSize),
    );

    expect(centerThickness).toBeGreaterThan(edgeThickness * 3);
    geometry.dispose();
  });

  it("creates smooth deterministic edge variation for individual petals", () => {
    const options = {
      length: 1.6,
      width: 0.8,
      curl: 0,
      lift: 0,
      baseColor: "#ffffff",
      tipColor: "#ffffff",
      notch: 0,
      profile: 0.5,
      edgeIrregularity: 1,
    };
    const first = createPetalGeometry({ ...options, markingSeed: 101 });
    const repeated = createPetalGeometry({ ...options, markingSeed: 101 });
    const individual = createPetalGeometry({ ...options, markingSeed: 102 });

    expect(repeated).toBe(first);
    expect(Array.from(individual.getAttribute("position").array)).not.toEqual(
      Array.from(first.getAttribute("position").array),
    );
  });

  it("creates deterministic petal placements", () => {
    const options = {
      index: 4,
      count: 18,
      layerIndex: 2,
      layerCount: 5,
      layerOffset: 0.5,
      seed: 1847,
      variation: 0.2,
      arrangement: "phyllotactic" as const,
      receptacleRadius: 0.12,
      innerCompression: 0.7,
    };

    expect(createPetalPlacement(options)).toEqual(
      createPetalPlacement(options),
    );
    expect(createPetalPlacement({ ...options, seed: 1848 })).not.toEqual(
      createPetalPlacement(options),
    );
  });

  it("uses phyllotactic angles instead of an even radial ring", () => {
    const common = {
      index: 1,
      count: 12,
      layerIndex: 0,
      layerCount: 3,
      layerOffset: 0,
      seed: 42,
      variation: 0,
      overlapJitter: 0,
    };
    const radial = createPetalPlacement({
      ...common,
      arrangement: "radial",
    });
    const phyllotactic = createPetalPlacement({
      ...common,
      arrangement: "phyllotactic",
    });

    expect(radial.angle).toBeCloseTo(Math.PI / 6);
    expect(phyllotactic.angle).not.toBeCloseTo(radial.angle);
  });

  it("compresses inner petal attachment points toward the receptacle", () => {
    const common = {
      index: 2,
      count: 16,
      layerCount: 4,
      layerOffset: 0,
      seed: 99,
      variation: 0,
      receptacleRadius: 0.2,
      innerCompression: 0.75,
    };
    const outer = createPetalPlacement({ ...common, layerIndex: 0 });
    const inner = createPetalPlacement({ ...common, layerIndex: 3 });

    expect(inner.radialOffset).toBeLessThan(outer.radialOffset * 0.4);
  });

  it("places bilateral petal roles in mirrored anatomical positions", () => {
    const common = {
      count: 3,
      layerIndex: 0,
      layerCount: 3,
      layerOffset: 0,
      seed: 42,
      variation: 0,
      overlapJitter: 0,
      arrangement: "bilateral" as const,
      role: "sepal" as const,
    };
    const left = createPetalPlacement({ ...common, index: 0 });
    const dorsal = createPetalPlacement({ ...common, index: 1 });
    const right = createPetalPlacement({ ...common, index: 2 });
    const lip = createPetalPlacement({
      ...common,
      index: 0,
      count: 1,
      role: "lip",
    });

    expect(left.angle).toBeCloseTo(-right.angle);
    expect(dorsal.angle).toBeCloseTo(Math.PI);
    expect(lip.angle).toBeCloseTo(0);
  });

  it("alternates seeded blooms along a vertical spike", () => {
    const placements = createInflorescencePlacements({
      architecture: "spike",
      count: 5,
      spacing: 0.5,
      spread: 0.4,
      seed: 42,
    });

    expect(placements).toHaveLength(5);
    expect(placements[0].position[0]).toBeGreaterThan(0);
    expect(placements[1].position[0]).toBeLessThan(0);
    expect(placements[4].position[1]).toBeCloseTo(-2);
    expect(placements[4].scale).toBeGreaterThan(placements[0].scale);
    expect(placements[4].maturity).toBeGreaterThan(placements[0].maturity);
    expect(placements[0].maturity).toBe(0);
    expect(placements[4].maturity).toBe(1);
  });

  it("distributes deterministic cluster blooms around a shared axis", () => {
    const options = {
      architecture: "cluster" as const,
      count: 6,
      spacing: 0.3,
      spread: 0.7,
      seed: 81,
    };
    const placements = createInflorescencePlacements(options);

    expect(placements).toEqual(createInflorescencePlacements(options));
    expect(new Set(placements.map(({ position }) => position[0])).size).toBe(6);
    expect(
      placements.every(({ position }) => Math.abs(position[0]) <= 0.7),
    ).toBe(true);
    expect(
      placements.every(({ maturity }) => maturity >= 0.74 && maturity <= 1),
    ).toBe(true);
  });

  it("places hooked stem prickles deterministically around the stem", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -4, 0),
      new THREE.Vector3(0.1, -2, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const placements = createStemPricklePlacements(curve, 9, 1847);
    const repeated = createStemPricklePlacements(curve, 9, 1847);

    expect(placements).toEqual(repeated);
    expect(placements).toHaveLength(9);
    expect(placements.every(({ direction }) => direction.length() > 0.99)).toBe(
      true,
    );
    expect(
      placements.every(({ direction }, index) => {
        const t = 0.12 + ((index + 0.5) / placements.length) * 0.74;
        return direction.dot(curve.getTangentAt(t)) < 0;
      }),
    ).toBe(true);
  });

  it("keeps stem surface details normal to a curved stem", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, -4, 0.2),
      new THREE.Vector3(0.5, -2.2, -0.3),
      new THREE.Vector3(-0.2, 0, 0.1),
    ]);
    const placements = createStemSurfacePlacements(curve, 18, 1847);

    expect(placements).toEqual(createStemSurfacePlacements(curve, 18, 1847));
    expect(placements).toHaveLength(18);
    expect(
      placements.every(
        ({ tangent, radial }) =>
          Math.abs(tangent.dot(radial)) < 0.00001 &&
          radial.length() > 0.999 &&
          radial.length() < 1.001,
      ),
    ).toBe(true);
    expect(
      placements.every(
        ({ t, position }) => position.distanceTo(curve.getPointAt(t)) < 0.00001,
      ),
    ).toBe(true);
  });

  it("builds deterministic multi-grain pollen clusters per anther", () => {
    const placements = createPollenClusterPlacements(6, 3, 1847);

    expect(placements).toEqual(createPollenClusterPlacements(6, 3, 1847));
    expect(placements).toHaveLength(18);
    expect(new Set(placements.map(({ stamenIndex }) => stamenIndex))).toEqual(
      new Set([0, 1, 2, 3, 4, 5]),
    );
    expect(placements.every(({ offset }) => offset.length() > 0)).toBe(true);
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

  it("closes the leaf silhouette with a cached margin band", () => {
    const leaf = createLeafGeometry(0.3, 42);
    const margin = createLeafMarginGeometry(leaf, 0.004);

    expect(margin).toBe(createLeafMarginGeometry(leaf, 0.004));
    expect(margin.getAttribute("position").count).toBeGreaterThan(300);
    expect(margin.getAttribute("normal").count).toBe(
      margin.getAttribute("position").count,
    );
    expect(margin.getAttribute("uv").count).toBe(
      margin.getAttribute("position").count,
    );
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

  it("creates a broad cordate leaf base", () => {
    expect(getLeafOutlineWidth(0.2, "cordate")).toBeGreaterThan(
      getLeafOutlineWidth(0.2, "lance"),
    );
    const cordate = createLeafGeometry(0.5, 42, "cordate", 0.08);
    const lance = createLeafGeometry(0.5, 42, "lance", 0.08);
    expect(cordate.getAttribute("position").array).not.toEqual(
      lance.getAttribute("position").array,
    );
    cordate.dispose();
    lance.dispose();
  });

  it("creates a circular peltate lotus blade with a central depression", () => {
    expect(getLeafOutlineWidth(0.5, "peltate")).toBeCloseTo(1);
    expect(getLeafOutlineWidth(0, "peltate")).toBe(0);
    expect(getLeafOutlineWidth(1, "peltate")).toBe(0);

    const peltate = createLeafGeometry(0.5, 42, "peltate", 0);
    const ovate = createLeafGeometry(0.5, 42, "ovate", 0);
    expect(peltate.getAttribute("position").array).not.toEqual(
      ovate.getAttribute("position").array,
    );
  });

  it("builds deterministic branching veins within the leaf outline", () => {
    const first = createLeafVeinNetwork(0.5, "cordate", 1, 42);
    const second = createLeafVeinNetwork(0.5, "cordate", 1, 42);

    expect(first.laterals).toHaveLength(14);
    expect(first.branches).toHaveLength(14);
    expect(first.laterals[4].getPoint(1)).toEqual(
      second.laterals[4].getPoint(1),
    );
    expect(Math.abs(first.laterals[4].getPoint(1).x)).toBeLessThanOrEqual(0.55);
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

  it("supports elliptical and ribbed stem cross-sections", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -4, 0),
      new THREE.Vector3(0, -2, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const round = createTaperedStem(curve, 1, 0.3, 0, 0, 42);
    const organic = createTaperedStem(curve, 1, 0.3, 0.18, 0.15, 42);

    expect(organic.getAttribute("position").array).not.toEqual(
      round.getAttribute("position").array,
    );
    expect(organic.getAttribute("position").count).toBe(
      round.getAttribute("position").count,
    );
    round.dispose();
    organic.dispose();
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
      expect(attachment.tangent.length()).toBeCloseTo(1);
      expect(
        attachment.tangent.distanceTo(curve.getTangentAt(attachment.t)),
      ).toBeLessThan(0.00001);
    }
  });

  it("supports species-specific basal leaf attachment zones", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -4, 0),
      new THREE.Vector3(0.2, -2, 0.1),
      new THREE.Vector3(0, 0, 0),
    ]);
    const basal = createLeafAttachments(curve, 2, 0.04, 0.16);

    expect(basal).toHaveLength(4);
    expect(basal.every(({ t }) => t >= 0.02 && t <= 0.19)).toBe(true);
  });

  it("alternates single leaves instead of forcing opposite pairs", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -4, 0),
      new THREE.Vector3(0.2, -2, 0.1),
      new THREE.Vector3(0, 0, 0),
    ]);
    const attachments = createLeafAttachments(curve, 4, 0.2, 0.78, "alternate");

    expect(attachments).toHaveLength(4);
    expect(attachments.map(({ side }) => side)).toEqual([1, -1, 1, -1]);
    expect(
      attachments.every(({ point, t }) => point.equals(curve.getPointAt(t))),
    ).toBe(true);
  });

  it("tapers petioles through the shaft and flares into the blade", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.01, 0.15, 0.01),
      new THREE.Vector3(0, 0.3, 0.03),
    ]);
    const geometry = createPetioleGeometry(curve);
    const positions = geometry.getAttribute("position");
    const ringRadius = (segment: number) => {
      const center = curve.getPointAt(segment / 14);
      let total = 0;
      for (let ring = 0; ring < 7; ring += 1) {
        total += new THREE.Vector3()
          .fromBufferAttribute(positions, segment * 7 + ring)
          .distanceTo(center);
      }
      return total / 7;
    };

    expect(positions.count).toBe(105);
    expect(geometry.getAttribute("normal").count).toBe(105);
    expect(ringRadius(0)).toBeGreaterThan(ringRadius(8));
    expect(ringRadius(14)).toBeGreaterThan(ringRadius(8));
  });
});
