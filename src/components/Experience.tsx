import { experience, site } from '../content'

/** Four nested orbits, one body each; the current role is the one closest in. */
function OrbitArt() {
  const orbits = [
    { r: 52, dur: 26, delay: -3 },
    { r: 84, dur: 41, delay: -11 },
    { r: 118, dur: 57, delay: -19 },
    { r: 150, dur: 75, delay: -31 },
  ]
  return (
    <svg className="orbit-art" viewBox="0 0 340 340" aria-hidden="true">
      <defs>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff3e2" />
          <stop offset="0.35" stopColor="#ffb070" />
          <stop offset="1" stopColor="#ffb070" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="170" cy="170" r="26" fill="url(#sun)" className="sun" />
      <circle cx="170" cy="170" r="5" fill="#fff6ea" />
      {orbits.map(({ r, dur, delay }, i) => (
        <g key={r} className="orb" style={{ '--dur': `${dur}s`, '--delay': `${delay}s` } as React.CSSProperties}>
          <ellipse cx="170" cy="170" rx={r} ry={r * 0.62} className="path" />
          <g className="spin">
            <circle cx={170 + r} cy="170" r={i === 0 ? 4.5 : 3.2 + i * 0.4} className={`body b${i}`} />
          </g>
        </g>
      ))}
    </svg>
  )
}

export function Experience() {
  return (
    <section className="block xp-block" id="experience" aria-labelledby="xp-title">
      <div className="wrap">
        <div className="head reveal">
          <div>
            <p className="kicker"><span className="n">§</span>Orbit so far</p>
            <h2 id="xp-title">Where I’ve <em className="s">been.</em></h2>
          </div>
          <a className="aside" href={site.linkedin} target="_blank" rel="noopener">Full history on LinkedIn ↗</a>
        </div>
        <div className="xp-grid">
          <ul className="xp">
            {experience.map((x, i) => (
              <li key={x.role} className="reveal" style={{ '--i': i } as React.CSSProperties}>
                <span className="y">{x.years}</span>
                <span className="r"><b>{x.role}</b><span>{x.org}</span></span>
                {x.current ? <span className="tag">current</span> : <span />}
              </li>
            ))}
          </ul>
          <div className="reveal orbit-wrap" style={{ '--i': 2 } as React.CSSProperties}>
            <OrbitArt />
          </div>
        </div>
      </div>
    </section>
  )
}
