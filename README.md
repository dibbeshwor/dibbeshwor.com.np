# dibbeshwor.com.np

Personal site for Dibbeshwor Acharya, AI engineer in Kathmandu.

One page, set in a WebGL sky. A single buffer of particles sits behind everything and reorganises as you scroll: galaxy → waveform → lattice → broadcast → globe → star dust. Each formation belongs to the chapter it accompanies. Around it: a noise-painted nebula, a procedural gas giant with rings and a moon that travels through the story, constellation lines, the odd meteor. Nothing is loaded; every visual is generated.

Built with React 19, TanStack Router, Three.js, Tailwind CSS v4 and Vite, deployed to Cloudflare with Wrangler.

## Where things live

| Path | What |
| --- | --- |
| `src/content.ts` | Every word on the site. Edit copy here, not in components. |
| `src/lib/cosmos/index.ts` | The Three.js scene: particle formations, nebula, planet system, constellations, meteors, camera and palette drift. |
| `src/lib/cosmos/shaders.ts` | All GLSL. The formation morph and pointer repulsion run in the particle vertex shader. |
| `src/components/Cosmos.tsx` | Mounts the scene, plus the grain and vignette overlays. |
| `src/components/Cursor.tsx` | The custom cursor (fine pointers only). |
| `src/components/Chapters.tsx` | The pinned section. Maps scroll position to a formation and to chapter text. |
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
