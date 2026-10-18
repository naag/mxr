import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

// The cloud dev container ships its own Chromium; point PW_CHROMIUM_PATH at it
// instead of downloading browsers (see docs/PLAN.md §7.3).
const executablePath = process.env.PW_CHROMIUM_PATH || undefined

export default defineConfig({
  // Relative base: the app uses hash routing, so it works under any path
  // (GitHub Pages serves it from /mxr/).
  base: './',
  plugins: [tailwindcss(), svelte()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.svelte.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          include: ['src/**/*.svelte.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({ launchOptions: { executablePath } }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
