import { Link } from '@tanstack/react-router'

interface NavLink {
  to: string
  label: string
}

const LINKS: NavLink[] = [
  { to: '/work', label: 'see my works' },
  { to: '/blog', label: 'read my thoughts' },
]

export function MoreLinks() {
  return (
    <p className="more">
      <span className="lead">or wander —</span>
      {LINKS.map((link, i) => (
        <span key={link.to} style={{ display: 'contents' }}>
          {i > 0 && <span className="sep">·</span>}
          <Link to={link.to}>{link.label}</Link>
        </span>
      ))}
    </p>
  )
}
