/**
 * Renders the social image (public/og_image.png, 1200×630) from the live hero.
 *
 *   pnpm build && node node_modules/vite/bin/vite.js preview --port 4173 &
 *   node scripts/make-og.mjs [chromium-executable]
 *
 * Needs `playwright-core` resolvable (install it temporarily with
 * `pnpm add -D playwright-core`, or run from a folder that has it) and a
 * Chromium build; pass its path, or let Playwright find its own download.
 * The page is opened with `?og`, which hides the nav, the cue and the grain.
 */
import { chromium } from 'playwright-core'
const [, , executablePath] = process.argv
const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:4173/?og', { waitUntil: 'networkidle' })
await page.mouse.move(-10, -10)
await page.waitForTimeout(5000)
await page.screenshot({ path: new URL('../public/og_image.png', import.meta.url).pathname, type: 'png' })
await browser.close()
console.log('wrote public/og_image.png')
