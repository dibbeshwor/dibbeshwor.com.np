import { useEffect, useRef } from 'react'
import { chapters } from '../content'
import { progress } from '../lib/field'
import { useReducedMotion } from '../hooks/useReducedMotion'

const smooth = (x: number) => x * x * (3 - 2 * x)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * The pinned section. Scroll position drives both the particle formation and
 * which chapter's text is on screen. Styles are written straight to the DOM
 * inside one rAF per scroll event, so React never re-renders on scroll.
 */
export function Chapters() {
  const root = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const section = root.current
    if (!section) return
    const els = Array.from(section.querySelectorAll<HTMLElement>('.chapter'))
    const nums = Array.from(section.querySelectorAll<HTMLElement>('.counter .num > span'))
    const track = section.querySelector<HTMLElement>('.counter .track i')
    let lastOn = -1
    let ticking = false

    const update = () => {
      ticking = false
      const vh = window.innerHeight
      const y = window.scrollY
      const top = section.offsetTop
      const len = section.offsetHeight - vh
      const p = y < top ? 0 : y < top + len ? (y - top) / len : 1
      const seg = p * 4
      const idx = Math.min(3, Math.floor(seg))
      const local = seg - idx
      // the last 45% of each segment morphs the field toward the next formation
      const morph = idx < 3 ? clamp01((local - 0.55) / 0.45) : 0
      let f = idx + morph
      if (y >= top + len) f = 3 + Math.min(1, (y - (top + len)) / (vh * 0.9))
      if (reduce) f = y < top ? 0 : y < top + len ? Math.round(f) : 4
      progress.f = f
      document.body.classList.toggle('is-content', y > top + len + vh * 0.2)

      els.forEach((el, i) => {
        const l = seg - i
        let vis = 0
        if (y >= top && l >= 0 && (l < 1 || i === 3)) {
          const fadeIn = smooth(clamp01(l / 0.12))
          const fadeOut = i === 3 ? 1 : 1 - smooth(clamp01((l - 0.6) / 0.2))
          vis = fadeIn * fadeOut
        }
        el.style.opacity = vis.toFixed(3)
        if (!reduce) {
          const dir = l < 0.5 ? 1 : -1
          el.style.transform = `translateY(${((1 - vis) * 24 * dir).toFixed(1)}px)`
          el.style.filter = `blur(${((1 - vis) * 8).toFixed(1)}px)`
        }
        el.classList.toggle('is-on', vis > 0.5)
      })

      const on = Math.max(0, Math.min(3, Math.floor(seg)))
      if (on !== lastOn) {
        nums.forEach((n, i) => n.classList.toggle('is-on', i === on))
        lastOn = on
      }
      if (track) track.style.transform = `scaleY(${Math.min(1, p).toFixed(3)})`
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
      document.body.classList.remove('is-content')
    }
  }, [reduce])

  return (
    <section className="chapters" ref={root} aria-label="Four things I work on">
      <div className="stage">
        <div className="wrap">
          <div className="counter" aria-hidden="true">
            <span className="num">
              {chapters.map((c, i) => (
                <span key={c.kicker} className={i === 0 ? 'is-on' : undefined}>0{i + 1}</span>
              ))}
            </span>
            <span className="track"><i /></span>
            <span>0{chapters.length}</span>
          </div>

          {chapters.map((c, i) => (
            <article className="chapter" key={c.kicker}>
              <p className="eyebrow"><span className="n">0{i + 1}</span> {c.kicker}</p>
              <h2>{c.title} <em className="s">{c.accent}</em></h2>
              <p>{c.body}</p>
              <div className="fig">
                {c.figures.map((f) => (
                  <div key={f.label}><b>{f.value}</b><small>{f.label}</small></div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
