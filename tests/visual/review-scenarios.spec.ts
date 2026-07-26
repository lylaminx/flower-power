import { expect, test } from "@playwright/test";
import scenarios from "../../image-tests/scenarios.json";

const reviewScenarios = scenarios.filter((scenario) => scenario.reviewOnly);

test.describe("reference review captures", () => {
  test.setTimeout(120_000);

  test.skip(
    process.env.VISUAL_REVIEW !== "1",
    "Run with npm run test:visual:review when reviewing reference alignment.",
  );

  for (const scenario of reviewScenarios) {
    test(`${scenario.species}: ${scenario.id}`, async ({ page }, testInfo) => {
      await page.setViewportSize(scenario.dimensions);
      await page.goto(`/visual-test/${scenario.id}`);

      const stage = page.locator("[data-visual-test-ready]");
      await expect(stage).toHaveAttribute("data-scenario", scenario.id);
      await expect(stage).toHaveAttribute("data-visual-test-ready", "true", {
        timeout: 60_000,
      });

      const path = testInfo.outputPath(`${scenario.id}.png`);
      await page.screenshot({ animations: "disabled", path });
      await testInfo.attach(scenario.id, {
        path,
        contentType: "image/png",
      });
    });
  }
});
