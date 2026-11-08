import { useEffect, useRef } from 'react'
import { smaller, work } from '../content'
import { useFinePointer, useReducedMotion } from '../hooks/useReducedMotion'
import { Viz } from './Viz'

/**
 * Cards light up around the pointer and tilt toward it, like a plate catching light.
 * Fine pointers only; touch gets the static card.
 */
function useCardLight(ref: React.RefObject<HTMLElement | null>) {
  const fine = useFinePointer()
  const reduce = useReducedMotion()
  useEffect(() => {
    const root = ref.current
    if (!root || !fine) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.card'))
    const offs = cards.map((card) => {
      let raf = 0
      let rx = 0, ry = 0, tx = 0, ty = 0
      const tick = () => {
        rx += (tx - rx) * 0.14; ry += (ty - ry) * 0.14
        card.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
        card.style.setProperty('--ry', `${ry.toFixed(2)}deg`)
        if (Math.abs(tx - rx) > 0.02 || Math.abs(ty - ry) > 0.02) raf = requestAnimationFrame(tick)
        else raf = 0
      }
      const move = (e: PointerEvent) => {
        const r = card.getBoundingClientRect()
        const x = e.clientX - r.left, y = e.clientY - r.top
        card.style.setProperty('--mx', `${x}px`)
        card.style.setProperty('--my', `${y}px`)
        if (reduce) return
        tx = -((y / r.height) - 0.5) * 7
        ty = ((x / r.width) - 0.5) * 9
        if (!raf) raf = requestAnimationFrame(tick)
      }
      const leave = () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick) }
      card.addEventListener('pointermove', move)
      card.addEventListener('pointerleave', leave)
      return () => {
        cancelAnimationFrame(raf)
        card.removeEventListener('pointermove', move)
        card.removeEventListener('pointerleave', leave)
      }
    })
    return () => offs.forEach((off) => off())
  }, [ref, fine, reduce])
}

export function Work() {
  const grid = useRef<HTMLDivElement>(null)
  useCardLight(grid)
  return (
    <section className="block" id="work" aria-labelledby="work-title">
      <div className="wrap">
        <div className="head reveal">
          <div>
            <p className="kicker"><span className="n">§</span>Selected work</p>
            <h2 id="work-title">Things that run <em className="s">in production.</em></h2>
          </div>
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
                <span className="sheen" aria-hidden="true" />
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
