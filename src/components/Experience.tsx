import { experience, site } from '../content'

export function Experience() {
  return (
    <section className="block" id="experience" aria-labelledby="xp-title">
      <div className="wrap">
        <div className="head reveal">
          <div>
            <p className="eyebrow"><span className="n">■</span> Experience</p>
            <h2 id="xp-title">Where I’ve <em className="s">been.</em></h2>
          </div>
          <a className="aside" href={site.linkedin} target="_blank" rel="noopener">Full history on LinkedIn ↗</a>
        </div>
        <ul className="xp">
          {experience.map((x, i) => (
            <li key={x.role} className="reveal" style={{ '--i': i } as React.CSSProperties}>
              <span className="y">{x.years}</span>
              <span className="r"><b>{x.role}</b><span>{x.org}</span></span>
              {x.current ? <span className="tag">current</span> : <span />}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
