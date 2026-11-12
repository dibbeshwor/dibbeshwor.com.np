/**
 * Renders the social image (public/og_image.jpg, 1200×630) from the live sky.
 *
 *   pnpm build && node node_modules/vite/bin/vite.js preview --port 4173 &
 *   node scripts/make-og.mjs [chromium-executable]
 *
 * Needs `playwright-core` resolvable (install it temporarily with
 * `pnpm add -D playwright-core`, or run from a folder that has it) and a
 * Chromium build; pass its path, or let Playwright find its own download.
 * The page is opened with `?og`: the hero gives way to a small signature, the
 * paint is laid on thicker and the fine lines are dropped (see createCosmos).
 * It captures at 2x, then macOS `sips` scales it down and saves a JPEG, which
 * keeps a painted image well under the 1 MB social previews like.
 */
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import { rmSync } from 'node:fs'
const [, , executablePath] = process.argv
const out = new URL('../public/og_image.jpg', import.meta.url).pathname
const tmp = out.replace(/\.jpg$/, '.capture.png')
// a real GPU: software GL trips the quality step-down and drops stars
const browser = await chromium.launch({ executablePath, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:4173/?og', { waitUntil: 'networkidle' })
await page.mouse.move(-10, -10)
await page.waitForTimeout(6000)
await page.screenshot({ path: tmp, type: 'png' })
await browser.close()
execFileSync('sips', ['-z', '630', '1200', '-s', 'format', 'jpeg', '-s', 'formatOptions', '86', tmp, '--out', out], { stdio: 'ignore' })
rmSync(tmp)
console.log('wrote public/og_image.jpg')
