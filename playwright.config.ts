import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3100",
    viewport: { width: 390, height: 844 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "npm start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 30000,
    env: {
      APP_URL: "http://localhost:3100",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      STRIPE_SECRET_KEY: "sk_test_local_fixture",
      STRIPE_WEBHOOK_SECRET: "whsec_local_fixture",
      STRIPE_PRICE_ID: "",
    },
  },
});
