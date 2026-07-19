import { expect, test } from "@playwright/test";
import scenarios from "../../image-tests/scenarios.json";

for (const scenario of scenarios) {
  test(`${scenario.species}: ${scenario.id}`, async ({ page }) => {
    await page.setViewportSize(scenario.dimensions);
    await page.goto(`/visual-test/${scenario.id}`);

    const stage = page.locator("[data-visual-test-ready]");
    await expect(stage).toHaveAttribute("data-scenario", scenario.id);
    await expect(stage).toHaveAttribute("data-visual-test-ready", "true", {
      timeout: 30_000,
    });

    const capture = await page.screenshot({ animations: "disabled" });
    expect(capture).toMatchSnapshot(`${scenario.id}.png`, {
      maxDiffPixelRatio: 0.01,
    });
  });
}
