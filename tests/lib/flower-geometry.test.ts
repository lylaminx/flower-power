import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  createLeafGeometry,
  createLilyOvaryGeometry,
  createLeafMarginGeometry,
  createLeafVeinNetwork,
  getPeltateRadialVein,
  getPeltateDropletVertexIndex,
  createLeafAttachments,
  createFusedCorollaGeometry,
  createInflorescencePlacements,
  createPetalGeometry,
  createPetalPlacement,
  createOrchidSpikeBractGeometry,
  createPoppyReceptacleGeometry,
  createRosePrickleGeometry,
  createRoseStipuleGeometry,
  createRoseCalyxCupGeometry,
  createRoseHypanthiumLiningGeometry,
  createSunflowerReceptacleGeometry,
  createTaperedFilamentGeometry,
  createLilyAntherGeometry,
  createRoseAntherGeometry,
  getRugoseLeafSurfaceRelief,
  getCoarseLeafLaminaVariation,
  createLilyStigmaGeometry,
  createLilyStyleGeometry,
  createLotusCarpelPitGeometry,
  createStemPricklePlacements,
  createStemSurfacePlacements,
  createPollenClusterPlacements,
  distributeRosePollenOffset,
  distributeLilyPollenOffset,
  orientPollenOffsetToAnther,
  createPetioleGeometry,
  createTaperedStem,
  getPetalOutlineWidth,
  getLigulateApexRecession,
  getPetalLateralCupEnvelope,
  getLabellumCallusField,
  getPaperyPetalCrinkle,
  getPaperyPetalPigmentVariation,
  getPaperyPetalVeinStrength,
  getRayLongitudinalVeinStrength,
  getLeafOutlineWidth,
  getCordateBasalSinusOffset,
  getAerialRootTipPose,
  getPinnateLeafVeinRelief,
  getPinnatifidLobeEnvelope,
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

  it("builds a smooth three-lobed lily ovary body", () => {
    const geometry = createLilyOvaryGeometry();
    const position = geometry.getAttribute("position");
    const equatorialRadii = Array.from(
      { length: position.count },
      (_, index) => ({
        radius: Math.hypot(position.getX(index), position.getZ(index)),
        y: position.getY(index),
      }),
    )
      .filter(({ y }) => Math.abs(y) < 0.01)
      .map(({ radius }) => radius);

    expect(geometry.index).not.toBeNull();
    expect(Math.max(...equatorialRadii)).toBeGreaterThan(1.05);
    expect(Math.min(...equatorialRadii)).toBeLessThan(0.95);
    expect(
      Math.max(...equatorialRadii) / Math.min(...equatorialRadii),
    ).toBeLessThan(1.16);
    expect(geometry.getAttribute("normal").count).toBe(position.count);
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
    expect(getPetalOutlineWidth(1, 0.5, "rugosa")).toBeGreaterThan(0.8);
    expect(getPetalOutlineWidth(1, 0.5, "spatulate")).toBeCloseTo(0);
    expect(getPetalOutlineWidth(1, 0.5, "lanceolate")).toBeGreaterThan(0.02);
    expect(getPetalOutlineWidth(1, 0.5, "lanceolate")).toBeLessThan(0.03);
    expect(getPetalOutlineWidth(0, 0.5, "ray")).toBeCloseTo(0);
    expect(getPetalOutlineWidth(1, 0.5, "ray")).toBeGreaterThan(0.7);
    expect(getPetalOutlineWidth(0.92, 0.5, "ray")).toBeGreaterThan(
      getPetalOutlineWidth(0.92, 0.5, "spatulate"),
    );
    expect(getPetalOutlineWidth(0.3, 0.5, "labellum")).toBeGreaterThan(
      getPetalOutlineWidth(0.72, 0.5, "labellum"),
    );
    expect(getPetalOutlineWidth(0.3, 0.5, "labellum")).toBeLessThan(0.9);
    expect(getPetalOutlineWidth(0.22, 0.5, "labellum")).toBeCloseTo(
      getPetalOutlineWidth(0.3, 0.5, "labellum"),
      1,
    );
    expect(getPetalOutlineWidth(0.46, 0.5, "labellum")).toBeLessThan(
      getPetalOutlineWidth(0.3, 0.5, "labellum"),
    );
    expect(getPetalOutlineWidth(1, 0.5, "labellum")).toBeCloseTo(0);
  });

  it("keeps rugosa petals broad and rounded at the free margin", () => {
    const widthSegments = 12;
    const lengthSegments = 24;
    const geometry = createPetalGeometry({
      length: 1.4,
      width: 1,
      curl: 0,
      lift: 0,
      baseColor: "#c83f9a",
      tipColor: "#e176bb",
      notch: 0,
      profile: 0.5,
      outline: "rugosa",
      lengthSegments,
      widthSegments,
    });
    const position = geometry.getAttribute("position");
    const lastRow = lengthSegments * (widthSegments + 1);
    const left = lastRow;
    const center = lastRow + widthSegments / 2;
    const right = lastRow + widthSegments;

    expect(Math.abs(position.getX(left))).toBeGreaterThan(0.4);
    expect(Math.abs(position.getX(right))).toBeGreaterThan(0.4);
    expect(position.getZ(center)).toBeGreaterThan(position.getZ(left));
    expect(position.getZ(center)).toBeGreaterThan(position.getZ(right));
  });

  it("varies the broad rugosa free edge without changing its topology", () => {
    const options = {
      length: 1.4,
      width: 1,
      curl: 0,
      lift: 0,
      baseColor: "#c83f9a",
      tipColor: "#e176bb",
      notch: 0,
      profile: 0.5,
      outline: "rugosa" as const,
      lengthSegments: 24,
      widthSegments: 12,
    };
    const first = createPetalGeometry({ ...options, markingSeed: 1847 });
    const second = createPetalGeometry({ ...options, markingSeed: 1848 });
    const firstPosition = first.getAttribute("position");
    const secondPosition = second.getAttribute("position");
    const lastRow = options.lengthSegments * (options.widthSegments + 1);
    const firstMargin = Array.from(
      { length: options.widthSegments + 1 },
      (_, column) => firstPosition.getZ(lastRow + column),
    );
    const secondMargin = Array.from(
      { length: options.widthSegments + 1 },
      (_, column) => secondPosition.getZ(lastRow + column),
    );

    expect(first.index?.count).toBe(second.index?.count);
    expect(firstMargin).not.toEqual(secondMargin);
    expect(Math.max(...firstMargin) - Math.min(...firstMargin)).toBeLessThan(
      options.length * 0.3,
    );
  });

  it("places the distal notch along the ray margin instead of vertical lift", () => {
    const geometry = createPetalGeometry({
      length: 1.5,
      width: 0.7,
      curl: 0,
      lift: 0.1,
      baseColor: "#d99018",
      tipColor: "#ffd24a",
      notch: 0.2,
      profile: 0.8,
      outline: "ray",
      lengthSegments: 24,
      widthSegments: 12,
    });
    const position = geometry.getAttribute("position");
    const rowStart = 24 * 13;
    const center = rowStart + 6;
    const left = rowStart;
    const right = rowStart + 12;

    expect(position.getZ(center)).toBeLessThan(position.getZ(left));
    expect(position.getZ(center)).toBeLessThan(position.getZ(right));
    expect(position.getY(center)).toBeCloseTo(position.getY(left), 2);
    geometry.dispose();
  });

  it("forms three shallow apical teeth on ligulate ray florets", () => {
    expect(getLigulateApexRecession(-0.31, 1, 0.1)).toBeGreaterThan(0.09);
    expect(getLigulateApexRecession(0.31, 1, 0.1)).toBeGreaterThan(0.09);
    expect(getLigulateApexRecession(0, 1, 0.1)).toBeLessThan(0.02);
    expect(getLigulateApexRecession(0.72, 1, 0.1)).toBeLessThan(0.001);
    expect(getLigulateApexRecession(-0.31, 0.7, 0.1)).toBeCloseTo(0);

    const geometry = createPetalGeometry({
      length: 1.5,
      width: 0.7,
      curl: 0,
      lift: 0.1,
      baseColor: "#d99018",
      tipColor: "#ffd24a",
      notch: 0.1,
      profile: 0.8,
      outline: "ray",
      tissueVariant: "ligulate",
      lengthSegments: 24,
      widthSegments: 16,
    });
    const position = geometry.getAttribute("position");
    const tipStart = 24 * 17;
    const leftSinus = position.getZ(tipStart + 5);
    const centerTooth = position.getZ(tipStart + 8);
    const rightSinus = position.getZ(tipStart + 11);

    expect(centerTooth).toBeGreaterThan(leftSinus);
    expect(centerTooth).toBeGreaterThan(rightSinus);
    geometry.dispose();
  });

  it("recurves a tepal along its length without a sharp vertical hinge", () => {
    const geometry = createPetalGeometry({
      length: 2,
      width: 0.62,
      curl: 0,
      lift: 0,
      baseColor: "#e9b51f",
      tipColor: "#ffe06b",
      notch: 0,
      profile: 0.66,
      tipReflex: 0.74,
      lengthSegments: 24,
      widthSegments: 8,
    });
    const position = geometry.getAttribute("position");
    const nearTip = 20 * 9 + 4;
    const straight = createPetalGeometry({
      length: 2,
      width: 0.62,
      curl: 0,
      lift: 0,
      baseColor: "#e9b51f",
      tipColor: "#ffe06b",
      notch: 0,
      profile: 0.66,
      tipReflex: 0,
      lengthSegments: 24,
      widthSegments: 8,
    });
    const straightPosition = straight.getAttribute("position");

    expect(position.getY(nearTip)).toBeGreaterThan(-0.4);
    expect(position.getZ(nearTip)).toBeLessThan(straightPosition.getZ(nearTip));
    geometry.dispose();
    straight.dispose();
  });

  it("relaxes labellum cup across its lateral shoulders", () => {
    expect(getPetalLateralCupEnvelope(0.3, "labellum")).toBeLessThan(
      getPetalLateralCupEnvelope(0.3, "elliptic") * 0.55,
    );
    expect(getPetalLateralCupEnvelope(0.72, "labellum")).toBeCloseTo(
      getPetalLateralCupEnvelope(0.72, "elliptic"),
    );
  });

  it("embosses paired callus lobes and a median keel into the labellum", () => {
    expect(getLabellumCallusField(-0.16, 0.4, 17)).toBeGreaterThan(0.68);
    expect(getLabellumCallusField(0.16, 0.4, 17)).toBeGreaterThan(0.68);
    expect(getLabellumCallusField(0, 0.49, 17)).toBeGreaterThan(0.4);
    expect(getLabellumCallusField(0.7, 0.7, 17)).toBeLessThan(0.01);
  });

  it("builds central and branching vascular ridges for papery petals", () => {
    expect(getPaperyPetalVeinStrength(0, 0.5)).toBeGreaterThan(0.6);
    expect(getPaperyPetalVeinStrength(0.17, 0.5)).toBeGreaterThan(0.25);
    expect(getPaperyPetalVeinStrength(0.5, 0.5)).toBeLessThan(0.05);
    expect(getPaperyPetalVeinStrength(0, 0)).toBeCloseTo(0);
  });

  it("makes bounded seed-specific papery crinkles that fade at attachments", () => {
    const first = getPaperyPetalCrinkle(0.23, 0.58, 17, 0.4);
    const repeated = getPaperyPetalCrinkle(0.23, 0.58, 17, 0.4);
    const second = getPaperyPetalCrinkle(0.23, 0.58, 29, 0.4);

    expect(first).toBe(repeated);
    expect(second).not.toBeCloseTo(first, 5);
    expect(Math.abs(first)).toBeLessThan(0.045);
    expect(getPaperyPetalCrinkle(0.23, 0, 17, 0.4)).toBeCloseTo(0);
    expect(getPaperyPetalCrinkle(0.23, 1, 17, 0.4)).toBeCloseTo(0);
    expect(getPaperyPetalCrinkle(0.2, 0.76, 17, 0.4)).not.toBeCloseTo(
      getPaperyPetalCrinkle(0.32, 0.76, 17, 0.4),
      4,
    );
  });

  it("adds broad seed-specific pigment variation within papery membranes", () => {
    const first = getPaperyPetalPigmentVariation(0.23, 0.58, 17);
    const repeated = getPaperyPetalPigmentVariation(0.23, 0.58, 17);
    const second = getPaperyPetalPigmentVariation(0.23, 0.58, 29);

    expect(first).toBe(repeated);
    expect(second).not.toBeCloseTo(first, 5);
    expect(Math.abs(first)).toBeLessThanOrEqual(1);
    expect(getPaperyPetalPigmentVariation(0.23, 0, 17)).toBeCloseTo(0);
    expect(getPaperyPetalPigmentVariation(0.23, 1, 17)).toBeCloseTo(0);
  });

  it("keeps sunflower ray venation longitudinal and tissue-subtle", () => {
    const centerVein = getRayLongitudinalVeinStrength(0, 0.55);
    const lateralVein = getRayLongitudinalVeinStrength(0.42, 0.55);
    const interveinalTissue = getRayLongitudinalVeinStrength(0.22, 0.55);

    expect(centerVein).toBeGreaterThan(lateralVein);
    expect(lateralVein).toBeGreaterThan(interveinalTissue);
    expect(getRayLongitudinalVeinStrength(0, 0)).toBeCloseTo(0);
    expect(getRayLongitudinalVeinStrength(0, 1)).toBeLessThan(centerVein);
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

  it("adds bounded low-frequency tension to fleshy rose margins", () => {
    const options = {
      length: 1.6,
      width: 0.8,
      curl: 0,
      lift: 0,
      baseColor: "#bb2b70",
      tipColor: "#d95a9a",
      notch: 0,
      profile: 0.5,
      edgeIrregularity: 0.35,
      markingSeed: 1847,
      lengthSegments: 16,
      widthSegments: 8,
    } as const;
    const plain = createPetalGeometry(options);
    const veined = createPetalGeometry({ ...options, tissueVariant: "veined" });
    const plainPosition = plain.getAttribute("position");
    const veinedPosition = veined.getAttribute("position");
    const edgeDeltas = Array.from({ length: 15 }, (_, row) => {
      const index = (row + 1) * 9;
      return Math.abs(veinedPosition.getY(index) - plainPosition.getY(index));
    });
    const maximum = Math.max(...edgeDeltas);

    expect(maximum).toBeGreaterThan(0.004);
    expect(maximum).toBeLessThan(0.02);
  });

  it("adds restrained Rose tissue color and shallow relief without changing its outline", () => {
    const options = {
      length: 1.6,
      width: 0.8,
      curl: 0,
      lift: 0,
      baseColor: "#bb2b70",
      tipColor: "#d95a9a",
      notch: 0,
      profile: 0.5,
      markingSeed: 101,
      lengthSegments: 12,
      widthSegments: 8,
    };
    const plain = createPetalGeometry(options);
    const veined = createPetalGeometry({ ...options, tissueVariant: "veined" });

    const plainPositions = Array.from(
      plain.getAttribute("position").array as ArrayLike<number>,
    );
    const veinedPositions = Array.from(
      veined.getAttribute("position").array as ArrayLike<number>,
    );
    const yDeltas = veinedPositions
      .filter((_, index) => index % 3 === 1)
      .map((value, index) => Math.abs(value - plainPositions[index * 3 + 1]));

    expect(veinedPositions).not.toEqual(plainPositions);
    expect(veinedPositions.filter((_, index) => index % 3 !== 1)).toEqual(
      plainPositions.filter((_, index) => index % 3 !== 1),
    );
    expect(Math.max(...yDeltas)).toBeGreaterThan(0);
    expect(Math.max(...yDeltas)).toBeLessThan(options.width * 0.004);
    expect(Array.from(veined.getAttribute("color").array)).not.toEqual(
      Array.from(plain.getAttribute("color").array),
    );
  });

  it("adds bounded parallel relief to lily tepals with quiet endpoints", () => {
    const options = {
      length: 2.1,
      width: 0.64,
      curl: 0.4,
      lift: 0.04,
      baseColor: "#f28a2b",
      tipColor: "#f7ad49",
      notch: 0,
      profile: 0.58,
      outline: "lanceolate" as const,
      markingSeed: 3141,
      lengthSegments: 24,
      widthSegments: 20,
    };
    const plain = createPetalGeometry(options);
    const parallel = createPetalGeometry({
      ...options,
      tissueVariant: "parallel",
    });
    const repeated = createPetalGeometry({
      ...options,
      tissueVariant: "parallel",
    });
    const plainPositions = plain.getAttribute("position");
    const parallelPositions = parallel.getAttribute("position");
    const rowWidth = options.widthSegments + 1;
    const middle = 12 * rowWidth + 7;
    const attachment = 7;
    const tip = options.lengthSegments * rowWidth + 7;
    const tipRow = Array.from(
      { length: rowWidth },
      (_, column) => options.lengthSegments * rowWidth + column,
    );
    const tipXs = tipRow.map((index) => parallelPositions.getX(index));

    expect(repeated).toBe(parallel);
    expect(parallelPositions.getY(middle)).not.toBeCloseTo(
      plainPositions.getY(middle),
      5,
    );
    expect(
      Math.abs(parallelPositions.getY(middle) - plainPositions.getY(middle)),
    ).toBeLessThan(options.width * 0.005);
    expect(parallelPositions.getY(attachment)).toBeCloseTo(
      plainPositions.getY(attachment),
    );
    expect(parallelPositions.getY(tip)).toBeCloseTo(plainPositions.getY(tip));
    expect(Math.max(...tipXs) - Math.min(...tipXs)).toBeGreaterThan(0);
    expect(Math.max(...tipXs) - Math.min(...tipXs)).toBeLessThan(
      options.width * 0.04,
    );
  });

  it("adds absorptive vascular contrast to papery petal tissue", () => {
    const options = {
      length: 2,
      width: 1.6,
      curl: 0.1,
      lift: 0.1,
      baseColor: "#dc3028",
      tipColor: "#ee553b",
      notch: 0,
      profile: 1,
      pleatStrength: 1.4,
      markingSeed: 2718,
      lengthSegments: 24,
      widthSegments: 20,
    };
    const plain = createPetalGeometry(options);
    const papery = createPetalGeometry({ ...options, tissueVariant: "papery" });
    const plainColors = Array.from(plain.getAttribute("color").array);
    const paperyColors = Array.from(papery.getAttribute("color").array);
    const mean = (values: number[]) =>
      values.reduce((total, value) => total + value, 0) / values.length;

    expect(Array.from(papery.getAttribute("position").array)).toEqual(
      Array.from(plain.getAttribute("position").array),
    );
    expect(paperyColors).not.toEqual(plainColors);
    expect(mean(paperyColors)).toBeLessThan(mean(plainColors));
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

  it("builds broad-based rose prickles with a gently hooked tip", () => {
    const geometry = createRosePrickleGeometry();
    const position = geometry.getAttribute("position");
    const vertices = Array.from({ length: position.count }, (_, index) => ({
      x: position.getX(index),
      y: position.getY(index),
      z: position.getZ(index),
    }));
    const tip = vertices.reduce((highest, vertex) =>
      vertex.y > highest.y ? vertex : highest,
    );

    expect(geometry.index).not.toBeNull();
    expect(Math.min(...vertices.map(({ y }) => y))).toBeCloseTo(0);
    expect(tip.y).toBeCloseTo(1);
    expect(tip.x).toBeLessThan(-0.15);
    expect(
      Math.max(
        ...vertices
          .filter(({ y }) => y === 0)
          .map(({ x, z }) => Math.hypot(x, z)),
      ),
    ).toBeGreaterThan(0.9);
  });

  it("seats juvenile cane prickles on a caller-sized stem surface", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0),
    ]);
    const placement = createStemPricklePlacements(curve, 1, 1847, 0.028)[0];
    const axisPoint = curve.getPointAt(0.49);

    expect(placement.position.distanceTo(axisPoint)).toBeCloseTo(0.028, 3);
  });

  it("builds thin closed rose stipules that survive edge-on views", () => {
    const geometry = createRoseStipuleGeometry();
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;

    expect(box.max.y - box.min.y).toBeGreaterThan(0.26);
    expect(box.max.x - box.min.x).toBeGreaterThan(0.05);
    expect(box.max.z - box.min.z).toBeGreaterThan(0.01);
    expect(box.max.z - box.min.z).toBeLessThan(0.025);
    expect(geometry.getAttribute("normal").count).toBe(
      geometry.getAttribute("position").count,
    );
    geometry.dispose();
  });

  it("builds a thin lanceolate orchid spike bract", () => {
    const geometry = createOrchidSpikeBractGeometry();
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;

    expect(box).not.toBeNull();
    expect(box!.max.y - box!.min.y).toBeGreaterThan(0.9);
    expect(box!.max.x - box!.min.x).toBeGreaterThan(0.6);
    expect(box!.max.z - box!.min.z).toBeLessThan(0.2);
    expect(geometry.getAttribute("normal").count).toBe(
      geometry.getAttribute("position").count,
    );
    geometry.dispose();
  });

  it("builds a closed tapered rose calyx cup instead of a sphere", () => {
    const geometry = createRoseCalyxCupGeometry(0.14);
    const position = geometry.getAttribute("position");
    geometry.computeBoundingBox();

    expect(position.count).toBeGreaterThan(150);
    expect(geometry.boundingBox?.max.x).toBeCloseTo(0.14, 2);
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-0.0812, 3);
    expect(geometry.boundingBox?.max.y).toBeCloseTo(0.0812, 3);
    expect(geometry.getAttribute("normal").count).toBe(position.count);
  });

  it("builds a closed softly irregular Rose hypanthium lining", () => {
    const geometry = createRoseHypanthiumLiningGeometry();
    const position = geometry.getAttribute("position");
    geometry.computeBoundingBox();
    const equatorRadii = Array.from({ length: position.count }, (_, index) => ({
      radius: Math.hypot(position.getX(index), position.getZ(index)),
      y: position.getY(index),
    }))
      .filter(({ y }) => Math.abs(y) < 0.001)
      .map(({ radius }) => radius);

    expect(geometry.index).not.toBeNull();
    expect(position.count).toBeGreaterThan(1000);
    expect(
      Math.max(...equatorRadii) - Math.min(...equatorRadii),
    ).toBeGreaterThan(0.04);
    expect(geometry.boundingBox!.max.y).toBeGreaterThan(0.9);
    expect(geometry.boundingBox!.max.y).toBeLessThan(0.94);
    expect(geometry.getAttribute("normal").count).toBe(position.count);
  });

  it("builds a shallow obconic poppy receptacle after the sepals fall", () => {
    const geometry = createPoppyReceptacleGeometry(0.2);
    const position = geometry.getAttribute("position");
    geometry.computeBoundingBox();

    expect(geometry.index).not.toBeNull();
    expect(position.count).toBeGreaterThan(150);
    expect(geometry.boundingBox?.max.x).toBeCloseTo(0.2, 2);
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-0.124, 3);
    expect(geometry.boundingBox?.max.y).toBeCloseTo(0.06, 3);
    expect(geometry.getAttribute("normal").count).toBe(position.count);
    geometry.dispose();
  });

  it("builds a closed shallow sunflower receptacle base", () => {
    const geometry = createSunflowerReceptacleGeometry(0.58);
    const position = geometry.getAttribute("position");
    geometry.computeBoundingBox();

    expect(geometry.index).not.toBeNull();
    expect(geometry.boundingBox?.max.x).toBeCloseTo(0.545, 2);
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-0.336, 3);
    expect(geometry.boundingBox?.max.y).toBeCloseTo(0.075, 3);
    expect(
      geometry.boundingBox!.max.y - geometry.boundingBox!.min.y,
    ).toBeLessThan(0.5);
    expect(geometry.getAttribute("normal").count).toBe(position.count);
  });

  it("builds smooth filaments that taper toward the anther", () => {
    const geometry = createTaperedFilamentGeometry();
    const position = geometry.getAttribute("position");
    const ringRadius = (targetY: number) => {
      const radii = Array.from({ length: position.count }, (_, index) => ({
        radius: Math.hypot(position.getX(index), position.getZ(index)),
        y: position.getY(index),
      }))
        .filter(({ y }) => Math.abs(y - targetY) < 0.001)
        .map(({ radius }) => radius);
      return Math.max(...radii);
    };

    expect(position.count).toBeGreaterThan(40);
    expect(ringRadius(0.5)).toBeCloseTo(0.82);
    expect(ringRadius(-0.5)).toBeCloseTo(1);
    expect(geometry.getAttribute("normal").count).toBe(position.count);
  });

  it("builds closed, smoothly unequal lily anther lobes", () => {
    const geometry = createLilyAntherGeometry();
    const position = geometry.getAttribute("position");
    geometry.computeBoundingBox();
    const radiusNear = (targetY: number) =>
      Math.max(
        ...Array.from({ length: position.count }, (_, index) => ({
          radius: Math.hypot(position.getX(index), position.getZ(index)),
          y: position.getY(index),
        }))
          .filter(({ y }) => Math.abs(y - targetY) < 0.02)
          .map(({ radius }) => radius),
      );

    expect(geometry.index).not.toBeNull();
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-1.7);
    expect(geometry.boundingBox?.max.y).toBeCloseTo(1.7);
    expect(radiusNear(-1.05)).toBeGreaterThan(radiusNear(0.92));
    expect(position.getX(0)).toBeCloseTo(0);
    expect(position.getZ(0)).toBeCloseTo(0);
    expect(geometry.getAttribute("normal").count).toBe(position.count);
  });

  it("builds short bowed and unequally tapered Rose anther sacs", () => {
    const geometry = createRoseAntherGeometry();
    const position = geometry.getAttribute("position");
    geometry.computeBoundingBox();
    const meanXNear = (targetY: number) => {
      const values = Array.from({ length: position.count }, (_, index) => ({
        x: position.getX(index),
        y: position.getY(index),
      }))
        .filter(({ y }) => Math.abs(y - targetY) < 0.04)
        .map(({ x }) => x);
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    };

    expect(geometry.index).not.toBeNull();
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-1.5);
    expect(geometry.boundingBox?.max.y).toBeCloseTo(1.38);
    expect(meanXNear(-0.18)).toBeGreaterThan(meanXNear(-1.5));
    expect(position.getX(0)).toBeCloseTo(0);
    expect(geometry.getAttribute("normal").count).toBe(position.count);
  });

  it("builds a shallow continuous three-lobed lily stigma", () => {
    const geometry = createLilyStigmaGeometry();
    const position = geometry.getAttribute("position");
    geometry.computeBoundingBox();
    const radialExtent = (angle: number) =>
      Math.max(
        ...Array.from({ length: position.count }, (_, index) => ({
          angle: Math.atan2(position.getZ(index), position.getX(index)),
          radius: Math.hypot(position.getX(index), position.getZ(index)),
        }))
          .filter(
            ({ angle: candidate }) =>
              Math.abs(
                Math.atan2(
                  Math.sin(candidate - angle),
                  Math.cos(candidate - angle),
                ),
              ) < 0.05,
          )
          .map(({ radius }) => radius),
      );

    expect(geometry.index).not.toBeNull();
    expect(geometry.boundingBox?.max.y).toBeCloseTo(0.275);
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-0.275);
    expect(radialExtent(0)).toBeGreaterThan(radialExtent(Math.PI / 3) * 1.2);
    expect(geometry.getAttribute("normal").count).toBe(position.count);
  });

  it("tapers the smooth lily style from ovary to stigma", () => {
    const geometry = createLilyStyleGeometry();
    const position = geometry.getAttribute("position");
    geometry.computeBoundingBox();
    const ringRadius = (targetY: number) =>
      Math.max(
        ...Array.from({ length: position.count }, (_, index) => ({
          radius: Math.hypot(position.getX(index), position.getZ(index)),
          y: position.getY(index),
        }))
          .filter(({ y }) => Math.abs(y - targetY) < 0.001)
          .map(({ radius }) => radius),
      );

    expect(geometry.index).not.toBeNull();
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-0.5);
    expect(geometry.boundingBox?.max.y).toBeCloseTo(0.5);
    expect(ringRadius(-0.5)).toBeCloseTo(1);
    expect(ringRadius(0.5)).toBeCloseTo(0.78);
    expect(geometry.getAttribute("normal").count).toBe(position.count);
  });

  it("builds a shallow closed concave lotus carpel pit", () => {
    const geometry = createLotusCarpelPitGeometry();
    const position = geometry.getAttribute("position");
    geometry.computeBoundingBox();
    const centerHeights = Array.from(
      { length: position.count },
      (_, index) => ({
        radius: Math.hypot(position.getX(index), position.getZ(index)),
        y: position.getY(index),
      }),
    ).filter(({ radius }) => radius < 0.001);
    const rimHeights = Array.from({ length: position.count }, (_, index) => ({
      radius: Math.hypot(position.getX(index), position.getZ(index)),
      y: position.getY(index),
    })).filter(({ radius }) => radius > 0.98);

    expect(geometry.index).not.toBeNull();
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-0.42);
    expect(geometry.boundingBox?.max.y).toBeCloseTo(0.24);
    expect(Math.min(...centerHeights.map(({ y }) => y))).toBeLessThan(
      Math.min(...rimHeights.map(({ y }) => y)),
    );
    expect(geometry.getAttribute("normal").count).toBe(position.count);
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

  it("aligns elongated aerial-root tips with the terminal tangent", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.4, -0.2, 0.1),
      new THREE.Vector3(0.8, -0.45, 0.3),
    ]);
    const pose = getAerialRootTipPose(curve, 0.04);
    const endpoint = curve.getPointAt(1);

    expect(pose.direction.length()).toBeCloseTo(1);
    expect(pose.direction.dot(curve.getTangentAt(1))).toBeCloseTo(1);
    expect(pose.position.distanceTo(endpoint)).toBeCloseTo(0.022);
    expect(pose.lengthScale).toBeGreaterThan(pose.radialScale * 2);
  });

  it("builds deterministic multi-grain pollen clusters per anther", () => {
    const placements = createPollenClusterPlacements(6, 3, 1847);

    expect(placements).toEqual(createPollenClusterPlacements(6, 3, 1847));
    expect(placements).toHaveLength(18);
    expect(new Set(placements.map(({ stamenIndex }) => stamenIndex))).toEqual(
      new Set([0, 1, 2, 3, 4, 5]),
    );
    expect(new Set(placements.map(({ lobeSide }) => lobeSide))).toEqual(
      new Set([-1, 1]),
    );
    expect(placements.every(({ offset }) => offset.length() > 0)).toBe(true);
  });

  it("seats pollen on opposite anther lobes in the stamen frame", () => {
    const offset = new THREE.Vector3(0.002, 0.009, 0.001);
    const left = orientPollenOffsetToAnther(offset, Math.PI / 3, -1, 0.015);
    const right = orientPollenOffsetToAnther(offset, Math.PI / 3, 1, 0.015);
    const tangent = new THREE.Vector3(
      Math.cos(Math.PI / 3 + Math.PI / 2),
      0,
      Math.sin(Math.PI / 3 + Math.PI / 2),
    );

    expect(right.clone().sub(left).dot(tangent)).toBeCloseTo(0.03);
    expect(left.y).toBeCloseTo(offset.y);
    expect(right.y).toBeCloseTo(offset.y);
  });

  it("distributes Rose pollen along short paired sacs instead of a bead halo", () => {
    const offset = new THREE.Vector3(0.006, 0.009, -0.005);
    const base = distributeRosePollenOffset(offset, 0, 5, 1847);
    const tip = distributeRosePollenOffset(offset, 4, 5, 1847);
    const repeated = distributeRosePollenOffset(offset, 0, 5, 1847);

    expect(base).toEqual(repeated);
    expect(base.y).toBeLessThan(0);
    expect(tip.y).toBeGreaterThan(0);
    expect(Math.abs(base.x)).toBeLessThan(Math.abs(offset.x));
    expect(Math.abs(base.z)).toBeLessThan(Math.abs(offset.z));
    expect(tip.y - base.y).toBeGreaterThan(0.012);
  });

  it("compresses lily pollen jitter through flattened anther depth", () => {
    const offset = new THREE.Vector3(0.002, 0.009, 0.012);
    const round = orientPollenOffsetToAnther(offset, 0, 1, 0.015, 1);
    const flattened = orientPollenOffsetToAnther(offset, 0, 1, 0.015, 0.58);

    expect(flattened.x).toBeCloseTo(round.x);
    expect(flattened.y).toBeCloseTo(round.y);
    expect(flattened.z - 0.015).toBeCloseTo(offset.z * 0.58);
    expect(flattened.z).toBeLessThan(round.z);
  });

  it("distributes lily pollen dust along the anther axis", () => {
    const offset = new THREE.Vector3(0.008, 0.009, 0.012);
    const grains = Array.from({ length: 18 }, (_, index) =>
      distributeLilyPollenOffset(offset, index, 18, 3141),
    );

    expect(grains).toEqual(
      Array.from({ length: 18 }, (_, index) =>
        distributeLilyPollenOffset(offset, index, 18, 3141),
      ),
    );
    expect(grains[0].y).toBeGreaterThanOrEqual(-0.016);
    expect(grains.at(-1)?.y).toBeLessThanOrEqual(0.018);
    expect(grains.at(-1)?.y).toBeGreaterThan(grains[0].y);
    expect(grains.every(({ x }) => Math.abs(x) < Math.abs(offset.x))).toBe(
      true,
    );
    expect(grains.every(({ z }) => Math.abs(z) < Math.abs(offset.z))).toBe(
      true,
    );
  });

  it("creates a curved indexed leaf", () => {
    const geometry = createLeafGeometry(0.3, 42);

    expect(geometry.getAttribute("position").count).toBe(377);
    expect(geometry.getAttribute("normal").count).toBe(377);
    expect(geometry.getAttribute("uv").count).toBe(377);
    expect(geometry.getAttribute("color").count).toBe(377);
    expect(geometry.index?.count).toBe(2016);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox?.max.y).toBeCloseTo(1.35);
    expect(geometry.boundingBox?.max.z).toBeGreaterThan(0.1);
    geometry.dispose();
  });

  it("integrates bounded pinnate relief into sunflower leaf tissue", () => {
    const plain = createLeafGeometry(0.5, 42, "cordate", 0.08, 0.2, 0, 0);
    const veined = createLeafGeometry(0.5, 42, "cordate", 0.08, 0.2, 0, 1);

    expect(getPinnateLeafVeinRelief(0, 0.5)).toBeGreaterThan(0.8);
    expect(getPinnateLeafVeinRelief(1, 0.5)).toBeCloseTo(0);
    expect(getPinnateLeafVeinRelief(0.5, 0)).toBeCloseTo(0);
    expect(veined.userData.leafGrid.columns).toBe(20);
    expect(plain.userData.leafGrid.columns).toBe(12);
    expect(veined.getAttribute("position").count).toBeGreaterThan(
      plain.getAttribute("position").count,
    );
  });

  it("gives sunflower leaves bounded coarse lamina variation", () => {
    const coarse = createLeafGeometry(
      0.5,
      5772,
      "cordate",
      0.1,
      0.2,
      0,
      1,
      1,
      "coarse",
    );
    const repeated = createLeafGeometry(
      0.5,
      5772,
      "cordate",
      0.1,
      0.2,
      0,
      1,
      1,
      "coarse",
    );
    const samples = Array.from({ length: 41 }, (_, index) =>
      getCoarseLeafLaminaVariation(0.42, index / 40, 5772),
    );

    expect(coarse).toBe(repeated);
    expect(coarse.userData.leafGrid.rows).toBe(56);
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.4);
    expect(samples.every((sample) => Math.abs(sample) <= 1)).toBe(true);
    expect(getCoarseLeafLaminaVariation(0.42, 0, 5772)).toBeCloseTo(0);
    expect(getCoarseLeafLaminaVariation(0.42, 1, 5772)).toBeCloseTo(0);
    expect(getCoarseLeafLaminaVariation(0, 0.5, 5772)).toBeLessThan(0.2);
  });

  it("gives Rose leaflets fine serration and bounded rugose puckering", () => {
    const plain = createLeafGeometry(
      0.36,
      1847,
      "ovate",
      0.13,
      0.2,
      0,
      0.72,
      1,
    );
    const rugose = createLeafGeometry(
      0.36,
      1847,
      "ovate",
      0.13,
      0.2,
      0,
      0.72,
      1,
      "rugose",
    );
    const samples = Array.from({ length: 81 }, (_, index) =>
      getRugoseLeafSurfaceRelief(0.58, index / 80, 1847),
    );

    expect(rugose.userData.leafGrid.rows).toBe(56);
    expect(rugose.getAttribute("position").count).toBeGreaterThan(
      plain.getAttribute("position").count,
    );
    expect(Math.max(...samples)).toBeLessThanOrEqual(1);
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(-1);
    expect(samples[0]).toBeCloseTo(0);
    expect(samples.at(-1)).toBeCloseTo(0);

    const position = rugose.getAttribute("position");
    const columns = rugose.userData.leafGrid.columns as number;
    const centerColumn = Math.floor(columns / 2);
    const centerHeights = Array.from({ length: 57 }, (_, row) =>
      position.getZ(row * (columns + 1) + centerColumn),
    );
    const adjacentSteps = centerHeights
      .slice(1)
      .map((height, index) => Math.abs(height - centerHeights[index]));
    expect(Math.max(...adjacentSteps)).toBeLessThan(0.012);
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

  it("gives poppy foliage deep smooth pinnatifid sinuses", () => {
    const samples = Array.from({ length: 101 }, (_, index) =>
      getPinnatifidLobeEnvelope(index / 100),
    );
    const pinnatifid = createLeafGeometry(0.4, 42, "pinnatifid", 0.08);
    const shallow = createLeafGeometry(0.4, 42, "lobed", 0.08);

    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0.32);
    expect(Math.min(...samples)).toBeLessThan(0.35);
    expect(Math.max(...samples)).toBeLessThanOrEqual(1);
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.64);
    expect(pinnatifid.getAttribute("position").array).not.toEqual(
      shallow.getAttribute("position").array,
    );
  });

  it("creates a broad cordate leaf base", () => {
    expect(getLeafOutlineWidth(0, "cordate")).toBeGreaterThan(0.3);
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

  it("softens the cordate basal sinus across both blade axes", () => {
    const center = getCordateBasalSinusOffset(0, 0);
    const shoulder = getCordateBasalSinusOffset(0.5, 0);

    expect(center).toBeGreaterThan(shoulder);
    expect(shoulder).toBeGreaterThan(0);
    expect(getCordateBasalSinusOffset(1, 0)).toBeCloseTo(0);
    expect(getCordateBasalSinusOffset(0, 0.2)).toBeCloseTo(0);
    expect(getCordateBasalSinusOffset(-0.4, 0.06)).toBeCloseTo(
      getCordateBasalSinusOffset(0.4, 0.06),
    );

    const sunflowerLeaf = createLeafGeometry(
      0.5,
      42,
      "cordate",
      0.08,
      0.2,
      0,
      1,
    );
    expect(sunflowerLeaf.userData.leafGrid.rows).toBe(36);
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
    expect(peltate.getAttribute("position").count).toBeGreaterThan(
      ovate.getAttribute("position").count * 2,
    );
    expect(peltate.userData.leafGrid).toEqual({ rows: 96, columns: 20 });
    expect(peltate.userData.leafPerimeter).toHaveLength(96);

    expect(getPeltateRadialVein(0.6, 0.5)).toBeGreaterThan(0.8);
    expect(getPeltateRadialVein(0.6, 0.525)).toBeLessThan(0.05);
  });

  it("scales leaf silhouette tessellation without changing the outline", () => {
    const draft = createLeafGeometry(0.5, 42, "ovate", 0.08, 0.2, 0, 0, 0.82);
    const ultra = createLeafGeometry(0.5, 42, "ovate", 0.08, 0.2, 0, 0, 1.55);

    expect(ultra.getAttribute("position").count).toBeGreaterThan(
      draft.getAttribute("position").count,
    );
    draft.computeBoundingBox();
    ultra.computeBoundingBox();
    expect(ultra.boundingBox?.max.x).toBeCloseTo(
      draft.boundingBox?.max.x ?? 0,
      2,
    );
    draft.dispose();
    ultra.dispose();
  });

  it("distributes lotus droplets away from insertion and free margin", () => {
    const indices = Array.from({ length: 18 }, (_, index) =>
      getPeltateDropletVertexIndex(index, 1847),
    );
    const rings = indices.map(
      (vertexIndex) => Math.floor((vertexIndex - 1) / 96) + 1,
    );

    expect(indices).toEqual(
      Array.from({ length: 18 }, (_, index) =>
        getPeltateDropletVertexIndex(index, 1847),
      ),
    );
    expect(new Set(indices).size).toBeGreaterThan(14);
    expect(rings.every((ring) => ring >= 3)).toBe(true);
    expect(rings.every((ring) => ring <= 18)).toBe(true);
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

    expect(geometry.getAttribute("position").count).toBe(1_168);
    expect(geometry.getAttribute("normal").count).toBe(1_168);
    expect(geometry.getAttribute("uv").count).toBe(1_168);
    expect(geometry.getAttribute("color").count).toBe(1_168);
    expect(geometry.index?.count).toBe(6_912);
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

  it("spirals monocot leaves around the stem", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -4, 0),
      new THREE.Vector3(0.2, -2, 0.1),
      new THREE.Vector3(0, 0, 0),
    ]);
    const attachments = createLeafAttachments(curve, 6, 0.2, 0.78, "spiral");

    expect(attachments).toHaveLength(6);
    expect(new Set(attachments.map(({ azimuth }) => azimuth)).size).toBe(6);
    expect(attachments[1].azimuth - attachments[0].azimuth).toBeCloseTo(
      Math.PI * (3 - Math.sqrt(5)),
    );
  });

  it("tapers petioles through the shaft and flares into the blade", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.01, 0.15, 0.01),
      new THREE.Vector3(0, 0.3, 0.03),
    ]);
    const geometry = createPetioleGeometry(curve);
    const positions = geometry.getAttribute("position");
    const colors = geometry.getAttribute("color");
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
    expect(colors.count).toBe(105);
    expect(geometry.getAttribute("normal").count).toBe(105);
    expect(ringRadius(0)).toBeGreaterThan(ringRadius(8));
    expect(ringRadius(14)).toBeGreaterThan(ringRadius(8));
    const ringTone = (segment: number) => {
      let total = 0;
      for (let ring = 0; ring < 7; ring += 1) {
        total += colors.getX(segment * 7 + ring);
      }
      return total / 7;
    };
    expect(ringTone(14)).toBeGreaterThan(ringTone(0));
    expect(ringTone(14) - ringTone(0)).toBeLessThan(0.12);
  });

  it("builds higher-resolution tapering velamen without a terminal flare", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.3, -0.2, 0.1),
      new THREE.Vector3(0.7, -0.5, 0.2),
    ]);
    const geometry = createPetioleGeometry(curve, 0.04, 0.0288, 0, 22, 9);
    const positions = geometry.getAttribute("position");
    const ringRadius = (segment: number) => {
      const center = curve.getPointAt(segment / 22);
      return (
        Array.from({ length: 9 }, (_, ring) =>
          new THREE.Vector3()
            .fromBufferAttribute(positions, segment * 9 + ring)
            .distanceTo(center),
        ).reduce((sum, radius) => sum + radius, 0) / 9
      );
    };

    expect(positions.count).toBe(207);
    expect(ringRadius(0)).toBeCloseTo(0.04);
    expect(ringRadius(22)).toBeCloseTo(0.0288);
    expect(ringRadius(22)).toBeLessThan(ringRadius(11));
  });
});
