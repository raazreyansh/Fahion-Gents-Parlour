import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:8081"
  },
  webServer: {
    command: "npm run web -w apps/mobile -- --port 8081",
    url: "http://localhost:8081",
    reuseExistingServer: true,
    timeout: 120_000
  }
});
