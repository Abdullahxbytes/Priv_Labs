import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    launchOptions: { channel: "msedge" },
  },
  webServer: {
    command: "npx next start -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
  },
});
