import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/auth-browser",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3101",
    viewport: { width: 390, height: 844 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: [
    {
      command: "node tests/mock-supabase.mjs",
      url: "http://127.0.0.1:5400/health",
      timeout: 20000,
      reuseExistingServer: false,
    },
    {
      command: "npm run build && npm start -- --port 3101",
      url: "http://localhost:3101",
      timeout: 120000,
      reuseExistingServer: false,
      env: {
        APP_URL: "http://localhost:3101",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:5400",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-local-test-key",
        SUPABASE_SERVICE_ROLE_KEY: "fixture-server-key",
        MASTER_USER_ID: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        STRIPE_SECRET_KEY: "",
        STRIPE_PRICE_ID: "",
        STRIPE_WEBHOOK_SECRET: "",
      },
    },
  ],
});
