import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 90000, fullyParallel: false, retries: process.env.CI ? 1 : 0, workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:8200', trace: 'retain-on-failure' },
  webServer: { command: 'npm start', url: 'http://127.0.0.1:8200/api/health/ready', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
});
