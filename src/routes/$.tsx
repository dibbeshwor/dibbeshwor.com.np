import { createFileRoute, Link } from '@tanstack/react-router'
import { Field } from '../components/Field'
import { site } from '../content'

export const Route = createFileRoute('/$')({
  component: NotFound,
  head: () => ({
    meta: [{ title: `Page not found — ${site.name}` }],
  }),
})

function NotFound() {
  return (
    <>
      <Field />
      <main className="nf">
        <div className="wrap">
          <p className="eyebrow"><span className="n">404</span> Nothing here</p>
          <h1>This page drifted <em className="s">out of orbit.</em></h1>
          <p className="lede">The address may have changed, or it never existed. The homepage has everything.</p>
          <div className="actions">
            <Link to="/" className="btn primary">Go to the homepage</Link>
            <a className="btn" href={`mailto:${site.email}`}>Write to {site.email}</a>
          </div>
        </div>
      </main>
    </>
  )
}
