const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  use: {
    headless: true,
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npx http-server -p 3000 -c-1",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
