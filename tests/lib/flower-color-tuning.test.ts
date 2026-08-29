import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  getHeroPetalAttenuationDistance,
  getHeroPetalColorVariationScale,
  getHeroPetalTransmissionFactor,
  getHeroMainStemColor,
  getHeroPetioleColor,
  getHeroSupportTissueColor,
  getSunflowerPhyllaryColor,
  getSunflowerLeafColorVariation,
} from "@/lib/flower-color-tuning";

describe("hero petal color tuning", () => {
  it("gives sunflower rays moderate tissue transmission without affecting generic petals", () => {
    expect(getHeroPetalTransmissionFactor("Sunflower", "ray")).toBe(0.38);
    expect(getHeroPetalTransmissionFactor("Sunflower", "default")).toBe(0.22);
    expect(getHeroPetalTransmissionFactor("Poppy")).toBe(0.42);
  });
  it("keeps Rose variation broader than the shared baseline", () => {
    expect(getHeroPetalColorVariationScale("Rose")).toBeGreaterThan(1);
    expect(getHeroPetalColorVariationScale("Poppy")).toBeGreaterThan(1);
    expect(getHeroPetalColorVariationScale("Orchid")).toBe(1.15);
    expect(getHeroPetalColorVariationScale("Sunflower")).toBe(1.12);
    expect(getHeroPetalColorVariationScale("Lily")).toBe(1.1);
    expect(getHeroPetalColorVariationScale("Lotus")).toBe(1.06);
  });

  it("makes the Orchid labellum denser than white tepals", () => {
    expect(getHeroPetalAttenuationDistance("Orchid", "lip")).toBe(0.68);
    expect(getHeroPetalAttenuationDistance("Orchid", "default")).toBe(0.86);
    expect(getHeroPetalAttenuationDistance("Lotus", "default")).toBe(1.1);
  });
});

describe("hero support-tissue color", () => {
  it("separates sunflower phyllary whorls with restrained living greens", () => {
    const outer = getSunflowerPhyllaryColor("#36552f", 0);
    const middle = getSunflowerPhyllaryColor("#36552f", 1);
    const inner = getSunflowerPhyllaryColor("#36552f", 2);

    expect(middle.getHSL({ h: 0, s: 0, l: 0 }).l).toBeGreaterThan(
      outer.getHSL({ h: 0, s: 0, l: 0 }).l,
    );
    expect(inner.getHSL({ h: 0, s: 0, l: 0 }).l).toBeGreaterThan(
      middle.getHSL({ h: 0, s: 0, l: 0 }).l,
    );
    expect(getSunflowerPhyllaryColor("#36552f", 7).getHex()).toBe(
      inner.getHex(),
    );
  });
  it("lifts sunflower leaves and varies individuals within living bounds", () => {
    const base = new THREE.Color("#55784a");
    const leaf = getHeroSupportTissueColor("Sunflower", base, "leaf");
    const stem = getHeroMainStemColor("Sunflower", base);
    const first = getSunflowerLeafColorVariation(5772, 0.34, -1);
    const second = getSunflowerLeafColorVariation(5772, 0.62, 1);

    expect(leaf.getHSL({ h: 0, s: 0, l: 0 }).l).toBeGreaterThan(
      stem.getHSL({ h: 0, s: 0, l: 0 }).l,
    );
    expect(first).toEqual(getSunflowerLeafColorVariation(5772, 0.34, -1));
    expect(first).not.toEqual(second);
    expect(Math.abs(first.hueOffset)).toBeLessThanOrEqual(0.009);
    expect(Math.abs(first.saturationOffset)).toBeLessThanOrEqual(0.025);
    expect(Math.abs(first.lightnessOffset)).toBeLessThanOrEqual(0.0225);
  });
  it("lifts rose foliage and keeps lily blades distinct from their stem", () => {
    const base = "#427448";
    const roseLeaf = getHeroSupportTissueColor("Rose", base, "leaf");
    const roseCalyx = getHeroSupportTissueColor("Rose", base, "calyx");
    const rosePetiole = getHeroPetioleColor("Rose", base);
    const lilyLeaf = getHeroSupportTissueColor("Lily", base, "leaf");

    expect(roseLeaf.g).toBeGreaterThan(roseCalyx.g);
    expect(rosePetiole.getHexString()).toBe(roseLeaf.getHexString());
    expect(lilyLeaf.getHexString()).not.toBe("427448");
    expect(lilyLeaf.getHSL({ h: 0, s: 0, l: 0 }).l).toBeGreaterThan(
      new THREE.Color(base).getHSL({ h: 0, s: 0, l: 0 }).l,
    );
    expect(lilyLeaf.g).toBeGreaterThan(new THREE.Color(base).g * 1.2);
    expect(lilyLeaf.g).toBeLessThan(0.32);
    expect(
      getHeroSupportTissueColor("Lily", base, "calyx").getHexString(),
    ).toBe("427448");
  });

  it("gives poppy leaves a muted glaucous cast without tinting its calyx", () => {
    const base = "#527b49";
    const leaf = getHeroSupportTissueColor("Poppy", base, "leaf");
    const calyx = getHeroSupportTissueColor("Poppy", base, "calyx");

    expect(leaf.getHexString()).not.toBe(new THREE.Color(base).getHexString());
    expect(leaf.b).toBeGreaterThan(new THREE.Color(base).b);
    expect(leaf.getHSL({ h: 0, s: 0, l: 0 }).l).toBeGreaterThan(
      new THREE.Color(base).getHSL({ h: 0, s: 0, l: 0 }).l,
    );
    expect(calyx.getHexString()).toBe(new THREE.Color(base).getHexString());
  });

  it("carries the poppy glaucous cast through its stem and petioles", () => {
    const base = "#527b49";
    const baseColor = new THREE.Color(base);
    const stem = getHeroMainStemColor("Poppy", base);
    const petiole = getHeroPetioleColor("Poppy", base);

    expect(stem.b).toBeGreaterThan(baseColor.b);
    expect(petiole.b).toBeGreaterThan(baseColor.b);
    expect(stem.getHSL({ h: 0, s: 0, l: 0 }).l).toBeGreaterThan(
      baseColor.getHSL({ h: 0, s: 0, l: 0 }).l,
    );
    expect(stem.getHexString()).toBe(petiole.getHexString());
  });

  it("separates mature rose cane and living sunflower stem palettes", () => {
    const base = "#427448";
    const rose = getHeroMainStemColor("Rose", base);
    const sunflower = getHeroMainStemColor("Sunflower", base);

    expect(rose.r).toBeGreaterThan(new THREE.Color(base).r);
    expect(rose.g).toBeLessThan(new THREE.Color(base).g);
    expect(sunflower.getHexString()).not.toBe(
      new THREE.Color(base).getHexString(),
    );
    expect(sunflower.g).toBeGreaterThan(sunflower.r);
  });

  it("gives lotus peduncles and pad scapes restrained aquatic greens", () => {
    const base = "#427448";
    const baseColor = new THREE.Color(base);
    const peduncle = getHeroMainStemColor("Lotus", base);
    const padScape = getHeroPetioleColor("Lotus", base);
    const lilyPetiole = getHeroPetioleColor("Lily", base);

    expect(peduncle.getHexString()).not.toBe(baseColor.getHexString());
    expect(padScape.getHexString()).not.toBe(baseColor.getHexString());
    expect(peduncle.b).toBeGreaterThan(baseColor.b);
    expect(padScape.b).toBeGreaterThan(baseColor.b);
    expect(lilyPetiole.getHexString()).toBe(baseColor.getHexString());
  });

  it("matures orchid spikes and crown supports toward restrained olive green", () => {
    const base = "#49704d";
    const baseColor = new THREE.Color(base);
    const spike = getHeroMainStemColor("Orchid", base);
    const crownSupport = getHeroPetioleColor("Orchid", base);
    const baseHsl = baseColor.getHSL({ h: 0, s: 0, l: 0 });
    const spikeHsl = spike.getHSL({ h: 0, s: 0, l: 0 });

    expect(spike.getHexString()).toBe(crownSupport.getHexString());
    expect(spike.getHexString()).not.toBe(baseColor.getHexString());
    expect(spikeHsl.s).toBeLessThan(baseHsl.s);
    expect(spikeHsl.l).toBeGreaterThan(baseHsl.l);
  });
});
