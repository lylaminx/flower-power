import { defineConfig } from "@playwright/test";

// The capture route contains only a WebGL canvas, so font loading cannot affect
// its pixels. Some headless Chrome builds never resolve document.fonts.ready.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = "1";

const visualPort = process.env.PW_VISUAL_PORT ?? "3100";
const visualBaseUrl = `http://127.0.0.1:${visualPort}`;
const attachedServer = process.env.PW_ATTACHED_SERVER === "1";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // Readiness has its own 60-second assertion budget. Keep a separate budget
  // for the GPU readback and snapshot comparison instead of letting a scene
  // that becomes ready near that boundary fail immediately in screenshot().
  timeout: 180_000,
  reporter: "list",
  outputDir: "image-tests/results",
  snapshotPathTemplate: "image-tests/baselines/{arg}{ext}",
  use: {
    baseURL: visualBaseUrl,
    browserName: "chromium",
    channel: "chrome",
    colorScheme: "light",
    deviceScaleFactor: 1,
    locale: "en-US",
    serviceWorkers: "block",
  },
  webServer: attachedServer
    ? undefined
    : {
        // Next forks an internal `next-server` process. The wrapper owns that
        // process group and forwards Playwright shutdown signals to every child
        // so interrupted WebGL captures cannot poison the port. Attached mode
        // deliberately omits lifecycle management for a separately owned
        // diagnostic server.
        command: `node scripts/visual-test-server.mjs ${visualPort}`,
        url: visualBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
