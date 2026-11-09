import { createRootRoute, HeadContent, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { site } from '../content'
import { Cosmos } from '../components/Cosmos'
import { Cursor } from '../components/Cursor'

export const Route = createRootRoute({
  head: () => ({
    meta: [{ title: site.title }],
  }),
  component: () => (
    <>
      <HeadContent />
      <a className="skip" href="#work">Skip to the work</a>
      <Cosmos />
      <Cursor />
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
})
