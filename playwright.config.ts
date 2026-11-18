import { defineConfig } from "@playwright/test";

// E2E contra o build de produção (L-0025): `astro build` + `astro preview`, igual ao CI.
// Porta fixa; nunca reaproveita servidor (evita testar build velho).
const PORTA = 4329;
const BASE = `http://127.0.0.1:${PORTA}`;

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: BASE,
    locale: "pt-BR",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "celular-360", use: { browserName: "chromium", viewport: { width: 360, height: 640 } } },
    { name: "desktop-1280", use: { browserName: "chromium", viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `npx astro build && npx astro preview --host 127.0.0.1 --port ${PORTA}`,
    url: BASE,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ASTRO_TELEMETRY_DISABLED: "1" },
  },
});
