import { defineConfig } from "@playwright/test";

// The capture route contains only a WebGL canvas, so font loading cannot affect
// its pixels. Some headless Chrome builds never resolve document.fonts.ready.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = "1";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: "list",
  outputDir: "image-tests/results",
  snapshotPathTemplate: "image-tests/baselines/{arg}{ext}",
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    channel: "chrome",
    colorScheme: "light",
    deviceScaleFactor: 1,
    locale: "en-US",
    serviceWorkers: "block",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
