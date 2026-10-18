import { defineConfig, devices } from '@playwright/test'

const executablePath = process.env.PW_CHROMIUM_PATH || undefined
const chromiumLaunch = {
  executablePath,
  args: ['--autoplay-policy=no-user-gesture-required'],
}
const ci = !!process.env.CI

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build -- --mode test && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !ci,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: chromiumLaunch },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], launchOptions: chromiumLaunch },
    },
    // Firefox and WebKit run the @smoke subset in CI only.
    ...(ci
      ? [
          { name: 'firefox', grep: /@smoke/, use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', grep: /@smoke/, use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
})
