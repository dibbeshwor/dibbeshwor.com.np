import { useEffect, useRef } from 'react'
import { chapters } from '../content'
import { useReducedMotion } from '../hooks/useReducedMotion'

const smooth = (x: number) => x * x * (3 - 2 * x)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * The pinned section. Scroll position decides which chapter's text is on screen;
 * the sky itself is driven separately (see lib/journey.ts) from the same scroll.
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
    // what each chapter was last given, so a scroll only touches the ones that change
    const was = els.map(() => '')
    // measured on resize, not on every scroll
    let vh = 0, top = 0, len = 1
    const measure = () => {
      vh = window.innerHeight
      top = section.offsetTop
      len = Math.max(1, section.offsetHeight - vh)
    }

    const update = () => {
      ticking = false
      const y = window.scrollY
      const p = y < top ? 0 : y < top + len ? (y - top) / len : 1
      const seg = p * n
      els.forEach((el, i) => {
        const l = seg - i
        let vis = 0
        if (y >= top && l >= 0 && (l < 1 || i === n - 1)) {
          const fadeIn = smooth(clamp01(l / 0.12))
          const fadeOut = i === n - 1 ? 1 : 1 - smooth(clamp01((l - 0.6) / 0.2))
          vis = fadeIn * fadeOut
        }
        const dir = l < 0.5 ? 1 : -1
        const key = `${vis.toFixed(3)}${dir}`
        if (key === was[i]) return
        was[i] = key
        el.style.visibility = vis > 0 ? 'visible' : 'hidden'
        el.style.opacity = vis.toFixed(3)
        if (!reduce) {
          el.style.transform = `translateY(${((1 - vis) * 28 * dir).toFixed(1)}px)`
          // a settled chapter carries no filter at all, so its text isn't re-rasterised
          el.style.filter = vis >= 0.999 ? 'none' : `blur(${((1 - vis) * 10).toFixed(1)}px)`
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
    const onResize = () => { measure(); onScroll() }
    // fonts and images arriving move the section too
    const ro = new ResizeObserver(onResize)
    ro.observe(document.body)
    measure()
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
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
