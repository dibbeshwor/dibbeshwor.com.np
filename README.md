# dibbeshwor.com.np

Personal portfolio site for Dibbeshwor Acharya — Full-Stack / AI Engineer based in Nepal.

Built with React, TanStack Router, Tailwind CSS v4, and deployed as a static site on Cloudflare Pages.

## Stack

- **React 19** + **TypeScript**
- **TanStack Router** — file-based routing, fully type-safe
- **Tailwind CSS v4** — via Vite plugin, no config file
- **Vite 8**
- **Cloudflare Pages** — static deployment

## Development

```bash
pnpm install
pnpm dev
```

## Build & Deploy

```bash
# Type-check
pnpm typecheck

# Production build → dist/
pnpm build

# Deploy to Cloudflare Pages
pnpm deploy
```

The `deploy` script runs `vite build` then `wrangler pages deploy dist`. Alternatively, connect the repo to Cloudflare Pages with build command `vite build` and output directory `dist` for automatic deployments on push.

## Adding routes

Create a file under `src/routes/` — TanStack Router's Vite plugin auto-generates the route tree.

```
src/routes/
  __root.tsx     # root layout
  index.tsx      # /
  about.tsx      # /about
  projects/
    index.tsx    # /projects
```
