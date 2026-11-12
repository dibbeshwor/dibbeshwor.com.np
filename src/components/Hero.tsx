import { hero, site } from '../content'
import { CopyButton, MagnetLink } from './Buttons'

const ArrowDown = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** one-time entrance stagger, in ms. The stars arrive first; the words follow. */
const at = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties
const START = 700
const WORD_STEP = 70

export function Hero() {
  const afterWords = START + WORD_STEP * hero.words.length + 90
  return (
    <section className="hero wrap" aria-labelledby="hero-title">
      <p className="hello rise" style={at(START - 200)}>
        <span className="orbit-dot" aria-hidden="true" />
        {hero.hello}
      </p>
      <h1 id="hero-title">
        {hero.words.map((w, i) => (
          <span key={w} className="w rise" style={at(START + WORD_STEP * i)}>{w}</span>
        ))}
        <span className="w rise" style={at(afterWords)}><em className="s">{hero.accent}</em></span>
      </h1>
      <p className="lede rise" style={at(afterWords + 100)}>{hero.lede}</p>
      <div className="actions rise" style={at(afterWords + 200)}>
        <MagnetLink href="#work" className="btn primary">
          See the work <ArrowDown />
        </MagnetLink>
        <CopyButton value={site.email} className="btn" />
      </div>
      <div className="meta rise" style={at(afterWords + 300)}>
        {hero.meta.map((m) => <span key={m}>{m}</span>)}
      </div>
      <div className="scroll-cue rise" style={at(afterWords + 700)} aria-hidden="true"><i />scroll</div>
      <div className="coords rise" style={at(afterWords + 700)} aria-hidden="true">
        <span>27.7172° N</span><span>85.3240° E</span><span>1,400 m</span>
      </div>
      {/* only in the social image (?og): the painted sky and a signature */}
      <div className="og-sign" aria-hidden="true">
        <p className="og-name">{site.short} <em className="s">{site.name.split(' ').slice(1).join(' ')}</em></p>
        <p className="og-role">AI engineer · Kathmandu</p>
      </div>
    </section>
  )
}
