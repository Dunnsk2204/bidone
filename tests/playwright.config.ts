import { defineConfig, devices } from '@playwright/test';

const API_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
const UI_URL = process.env.UI_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: '.',

  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  webServer: [
    {
      command: 'npm run dev',
      cwd: '../../bidshopNew/backend',
      url: `${API_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: 'npm run dev',
      cwd: '../../bidshopNew/frontend',
      url: UI_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],

  use: {
    baseURL: API_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'api',
      testMatch: 'API-Tests/**/*.spec.ts',
      use: {
        baseURL: API_URL,
      },
    },
    {
      name: 'ui',
      testMatch: 'UI-Tests/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: UI_URL,
        actionTimeout: 15_000,
        navigationTimeout: 20_000,
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});