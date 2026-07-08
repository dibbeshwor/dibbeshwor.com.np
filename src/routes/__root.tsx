import { createRootRoute, HeadContent, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  head: () => ({
    meta: [{ title: 'Dibbeshwor Acharya — Full-Stack & AI Engineer' }],
  }),
  component: () => (
    <>
      <HeadContent />
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
})
