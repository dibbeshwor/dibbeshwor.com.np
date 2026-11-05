import { contact, site } from '../content'
import { CopyButton } from './Buttons'

export function Contact() {
  return (
    <section className="block contact" id="contact" aria-labelledby="contact-title">
      <div className="wrap">
        <p className="eyebrow reveal"><span className="n">■</span> Contact</p>
        <h2 id="contact-title" className="reveal" style={{ '--i': 1 } as React.CSSProperties}>Let’s <em className="s">talk.</em></h2>
        <p className="lede reveal" style={{ '--i': 2 } as React.CSSProperties}>{contact.lede}</p>
        <div className="actions reveal" style={{ '--i': 3 } as React.CSSProperties}>
          <CopyButton value={site.email} className="btn primary" magnet />
          <a className="btn" href={`mailto:${site.email}`}>Write to {site.email}</a>
        </div>
        <p className="links reveal" style={{ '--i': 4 } as React.CSSProperties}>
          <a href={site.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>
          <a href={site.github} target="_blank" rel="noopener">GitHub ↗</a>
          <a href={site.employer.url} target="_blank" rel="noopener">M&amp;S AI Labs ↗</a>
        </p>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <span>Kathmandu, Nepal · 27.7°N 85.3°E</span>
      </div>
    </footer>
  )
}
