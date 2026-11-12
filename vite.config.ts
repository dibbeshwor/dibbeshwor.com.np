import { defineConfig, type Plugin } from 'vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * The sky (three.js) is a dynamic import so the page can paint before it parses. This
 * asks for it from the HTML, so it downloads alongside the entry instead of after it.
 */
function preloadSky(): Plugin {
  return {
    name: 'preload-sky',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const chunk = Object.values(ctx.bundle ?? {}).find(
          (c) => c.type === 'chunk' && !!c.facadeModuleId?.endsWith('/src/lib/cosmos/index.ts'),
        )
        if (!chunk) return
        return [{ tag: 'link', attrs: { rel: 'modulepreload', crossorigin: '', href: `/${chunk.fileName}` }, injectTo: 'head' }]
      },
    },
  }
}

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    preloadSky(),
  ],
})
