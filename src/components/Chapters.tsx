import { useEffect, useRef } from 'react'
import { chapters } from '../content'
import { progress } from '../lib/cosmos'
import { useReducedMotion } from '../hooks/useReducedMotion'

const smooth = (x: number) => x * x * (3 - 2 * x)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * The pinned section. Scroll position drives both the sky's formation and which
 * chapter's text is on screen. The hero holds the galaxy (formation 0); chapter i
 * owns formation i + 1; past the end the field scatters into dust (5).
 * Styles are written straight to the DOM inside one rAF per scroll event.
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
    const n = chapters.length
    let lastOn = -1
    let ticking = false

    const update = () => {
      ticking = false
      const vh = window.innerHeight
      const y = window.scrollY
      const top = section.offsetTop
      const len = section.offsetHeight - vh
      const p = y < top ? 0 : y < top + len ? (y - top) / len : 1
      const seg = p * n
      const idx = Math.min(n - 1, Math.floor(seg))
      const local = seg - idx

      let f: number
      if (y < top) {
        // the galaxy begins to gather into the wave as the hero leaves
        f = clamp01((y - (top - vh * 0.5)) / (vh * 0.5)) * 0.35
      } else if (y < top + len) {
        // the first 22% of chapter one finishes the galaxy → wave morph; later chapters morph in their last 45%
        const lead = idx === 0 ? 0.35 + clamp01(local / 0.22) * 0.65 : idx + 1
        const morph = idx < n - 1 ? clamp01((local - 0.55) / 0.45) : 0
        f = idx === 0 && local < 0.22 ? lead : idx + 1 + morph
      } else {
        f = n + Math.min(1, (y - (top + len)) / (vh * 0.9))
      }
      if (reduce) f = y < top ? 0 : y < top + len ? idx + 1 : n + 1
      progress.f = f
      document.body.classList.toggle('is-content', y > top + len + vh * 0.2)

      els.forEach((el, i) => {
        const l = seg - i
        let vis = 0
        if (y >= top && l >= 0 && (l < 1 || i === n - 1)) {
          const fadeIn = smooth(clamp01(l / 0.12))
          const fadeOut = i === n - 1 ? 1 : 1 - smooth(clamp01((l - 0.6) / 0.2))
          vis = fadeIn * fadeOut
        }
        el.style.opacity = vis.toFixed(3)
        if (!reduce) {
          const dir = l < 0.5 ? 1 : -1
          el.style.transform = `translateY(${((1 - vis) * 28 * dir).toFixed(1)}px)`
          el.style.filter = `blur(${((1 - vis) * 10).toFixed(1)}px)`
        }
        el.classList.toggle('is-on', vis > 0.5)
      })

      const on = Math.max(0, Math.min(n - 1, Math.floor(seg)))
      if (on !== lastOn) {
        nums.forEach((s, i) => s.classList.toggle('is-on', i === on))
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
      progress.f = 0
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
              <p className="kicker"><span className="n">0{i + 1}</span>{c.kicker}</p>
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
