# dibbeshwor.com.np

Personal site for Dibbeshwor Acharya, AI engineer in Kathmandu.

One page, set in a WebGL sky, and one continuous dive. A single buffer of stars sits behind everything and reshapes as you scroll: the galaxy in the hero, then down into the solar system, then Earth drawn as continents of points, and by the footer Kathmandu at dusk, with Boudhanath, prayer flags, the valley's lights and the ridge behind. Each dive goes through a pivot: the arm we fly into, the third planet, Nepal on the globe. Around the stars: a noise-painted nebula that becomes a dusk sky, constellation lines, the odd meteor. Nothing is loaded; every visual is generated (the land mask is a 360×180 bitmap baked from Natural Earth).

Built with React 19, TanStack Router, Three.js, Tailwind CSS v4 and Vite, deployed to Cloudflare with Wrangler.

## Where things live

| Path | What |
| --- | --- |
| `src/content.ts` | Every word on the site. Edit copy here, not in components. |
| `src/lib/journey.ts` | Scroll → where we are in the dive (`f` stop, `z` push, `lock` for earth turning to Nepal). |
| `src/lib/cosmos/index.ts` | The Three.js scene: stars, nebula, constellations, meteors, camera, palette drift, the pivots. |
| `src/lib/cosmos/formations.ts` | Builds the per-star attributes for galaxy, solar system, earth and Kathmandu. |
| `src/lib/cosmos/shaders.ts` | All GLSL. The dive between stops and the pointer repulsion run in the particle vertex shader. |
| `src/lib/cosmos/land.ts` | The land bitmap. Regenerate with `node scripts/make-land.mjs <ne_110m_land.geojson>`. |
| `src/components/Cosmos.tsx` | Mounts the scene, plus the grain and vignette overlays. |
| `src/components/Cursor.tsx` | The custom cursor (fine pointers only). |
| `src/components/Chapters.tsx` | The pinned section. Fades chapter text in and out with scroll. |
| `src/components/*` | One component per section: `Nav`, `Hero`, `Work`, `About`, `Experience`, `Contact`. |
| `src/components/Viz.tsx` | The small animated illustration on each project card (SVG + CSS keyframes in `index.css`). |
| `src/index.css` | Tokens and page styles. Reduced-motion rules at the bottom. |
| `public/` | Favicons, OG image, manifest, sitemap. |

## Development

```bash
pnpm install
pnpm dev
```

## Checks and deploy

```bash
pnpm typecheck
pnpm lint
pnpm build      # → dist/
pnpm deploy     # build, then wrangler deploy
```

`wrangler.jsonc` serves `dist/` as static assets with single-page-app fallback, so unknown paths render the in-app 404.

## Motion and accessibility

- Everything animates on `transform`, `opacity` and `filter`; scroll work runs in one `requestAnimationFrame` per scroll event and never re-renders React.
- `prefers-reduced-motion` is respected: the sky holds still and switches formation without morphing, there is no warp-in, no meteors, no pointer repulsion, reveals become fades, the marquee is static, cards don't tilt and the native cursor is kept.
- The canvas is `aria-hidden`; all content is plain HTML underneath it. Without WebGL the page falls back to a CSS nebula.
- The nebula shader renders at a third of the resolution and is composited behind the scene; particle counts and pixel ratio are lower on phones.
