import { hero, site } from '../content'
import { CopyButton, MagnetLink } from './Buttons'

const ArrowDown = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** one-time entrance stagger, in ms */
const at = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties
const WORD_START = 60
const WORD_STEP = 55

export function Hero() {
  const afterWords = WORD_START + WORD_STEP * hero.words.length + 70
  return (
    <section className="hero wrap" aria-labelledby="hero-title">
      <p className="hello rise" style={at(0)}>{hero.hello}</p>
      <h1 id="hero-title">
        {hero.words.map((w, i) => (
          <span key={w} className="w rise" style={at(WORD_START + WORD_STEP * i)}>{w}</span>
        ))}
        <em className="s w rise" style={at(afterWords)}>{hero.accent}</em>
      </h1>
      <p className="lede rise" style={at(afterWords + 80)}>{hero.lede}</p>
      <div className="actions rise" style={at(afterWords + 160)}>
        <MagnetLink href="#work" className="btn primary">
          See the work <ArrowDown />
        </MagnetLink>
        <CopyButton value={site.email} className="btn" />
      </div>
      <div className="meta rise" style={at(afterWords + 240)}>
        {hero.meta.map((m) => <span key={m}>{m}</span>)}
      </div>
      <div className="scroll-cue" aria-hidden="true"><i />scroll</div>
    </section>
  )
}
