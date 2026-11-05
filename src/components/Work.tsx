import { useEffect, useRef } from 'react'
import { smaller, work, type Figure } from '../content'
import { useFinePointer } from '../hooks/useReducedMotion'

function FigureView({ figure }: { figure: Figure }) {
  if (figure.kind === 'pipe') {
    return (
      <div className="pipe">
        {figure.steps.map((s, i) => (
          <span key={s} style={{ display: 'contents' }}>
            {i > 0 && <i aria-hidden="true">→</i>}
            <span className={s === figure.hot ? 'hot' : undefined}>{s}</span>
          </span>
        ))}
      </div>
    )
  }
  return (
    <>
      {figure.items.map((m) => (
        <div className="metric" key={m.label}>
          <b>{m.value}{m.unit && <small>{m.unit}</small>}</b>
          <span>{m.label}</span>
        </div>
      ))}
    </>
  )
}

/** Cards light up around the pointer. Only on fine pointers; touch gets the static card. */
function useSpotlight(ref: React.RefObject<HTMLElement | null>) {
  const fine = useFinePointer()
  useEffect(() => {
    const root = ref.current
    if (!root || !fine) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.card'))
    const handlers = cards.map((card) => {
      const h = (e: PointerEvent) => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${e.clientX - r.left}px`)
        card.style.setProperty('--my', `${e.clientY - r.top}px`)
      }
      card.addEventListener('pointermove', h)
      return () => card.removeEventListener('pointermove', h)
    })
    return () => handlers.forEach((off) => off())
  }, [ref, fine])
}

export function Work() {
  const grid = useRef<HTMLDivElement>(null)
  useSpotlight(grid)
  return (
    <section className="block" id="work" aria-labelledby="work-title">
      <div className="wrap">
        <div className="head reveal">
          <div>
            <p className="eyebrow"><span className="n">■</span> Selected work</p>
            <h2 id="work-title">Things that run <em className="s">in production.</em></h2>
          </div>
          <p className="aside">2024 → now</p>
        </div>

        <div className="grid" ref={grid}>
          {work.map((w, i) => (
            <article key={w.title} className={`card reveal ${w.wide ? 'wide' : ''}`} style={{ '--i': i } as React.CSSProperties}>
              <div className="body">
                <p className="k"><span>{w.kicker}</span><span>{w.meta}</span></p>
                <h3>{w.title}</h3>
                <p>{w.body}</p>
                {w.stack && (
                  <div className="stack">{w.stack.map((s) => <span key={s}>{s}</span>)}</div>
                )}
              </div>
              <div className="figure"><FigureView figure={w.figure} /></div>
            </article>
          ))}
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
