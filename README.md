# dibbeshwor.com.np

Personal site for Dibbeshwor Acharya, AI engineer in Kathmandu.

One page. A single field of particles sits behind everything and reorganises as you scroll: galaxy → waveform → lattice → globe → star dust. Each formation belongs to the chapter it accompanies.

Built with React 19, TanStack Router, Tailwind CSS v4 and Vite, deployed to Cloudflare with Wrangler.

## Where things live

| Path | What |
| --- | --- |
| `src/content.ts` | Every word on the site. Edit copy here, not in components. |
| `src/lib/field.ts` | The particle engine: five formations, scroll-driven blending, pointer repulsion. |
| `src/components/Chapters.tsx` | The pinned section. Maps scroll position to a formation and to chapter text. |
| `src/components/*` | One component per section: `Nav`, `Hero`, `Work`, `About`, `Experience`, `Contact`. |
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
- `prefers-reduced-motion` is respected: the field holds still and switches formation without morphing, reveals become fades, the marquee is static and magnetic buttons are off.
- The canvas is `aria-hidden`; all content is plain HTML underneath it.
