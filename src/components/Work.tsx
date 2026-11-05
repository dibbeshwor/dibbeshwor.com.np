import { useEffect, useRef } from 'react'
import { smaller, work } from '../content'
import { useFinePointer } from '../hooks/useReducedMotion'
import { Viz } from './Viz'

/** Cards light up around the pointer. Only on fine pointers; touch gets the static card. */
function useSpotlight(ref: React.RefObject<HTMLElement | null>) {
  const fine = useFinePointer()
  useEffect(() => {
    const root = ref.current
    if (!root || !fine) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.card'))
    const offs = cards.map((card) => {
      const h = (e: PointerEvent) => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${e.clientX - r.left}px`)
        card.style.setProperty('--my', `${e.clientY - r.top}px`)
      }
      card.addEventListener('pointermove', h)
      return () => card.removeEventListener('pointermove', h)
    })
    return () => offs.forEach((off) => off())
  }, [ref, fine])
}

export function Work() {
  const grid = useRef<HTMLDivElement>(null)
  useSpotlight(grid)
  return (
    <section className="block" id="work" aria-labelledby="work-title">
      <div className="wrap">
        <div className="head reveal">
          <h2 id="work-title">Things that run <em className="s">in production.</em></h2>
          <p className="aside">2024 → now</p>
        </div>

        <div className="grid" ref={grid}>
          {work.map((w, i) => {
            const inner = (
              <>
                <div className="viz-wrap"><Viz kind={w.viz} /></div>
                <div className="body">
                  <h3>{w.title}{w.href && <span className="arrow" aria-hidden="true">↗</span>}</h3>
                  <p>{w.line}</p>
                  <p className="meta">{w.meta}</p>
                </div>
              </>
            )
            const cls = `card reveal ${w.size}`
            const style = { '--i': i } as React.CSSProperties
            return w.href ? (
              <a key={w.title} className={cls} style={style} href={w.href} target="_blank" rel="noopener">{inner}</a>
            ) : (
              <article key={w.title} className={cls} style={style}>{inner}</article>
            )
          })}
        </div>

        <div className="more reveal">
          <p className="lbl">Smaller things</p>
          {smaller.map((s) => (
            <div className="item" key={s.title}><b>{s.title}</b>{s.body}</div>
          ))}
        </div>
      </div>
    </section>
  )
}
