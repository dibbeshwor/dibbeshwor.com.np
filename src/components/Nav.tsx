import { useEffect, useRef } from 'react'
import { site } from '../content'

export function Nav() {
  const bar = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let ticking = false
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? (window.scrollY / max).toFixed(4) : 0})`
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update) }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return (
    <header className="nav">
      <a className="brand" href="#top" aria-label={`${site.name}, back to top`}>
        <span className="dot" aria-hidden="true" />
        {site.short}
      </a>
      <nav className="nav-links" aria-label="Page sections">
        <a href="#work">Work</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
        <a className="cta" href={`mailto:${site.email}`}>Say hello</a>
      </nav>
      <span className="progress" ref={bar} aria-hidden="true" />
    </header>
  )
}
