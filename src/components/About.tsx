import { useEffect, useState } from 'react'
import { about, site } from '../content'

/** Renders **bold** and [M&S AI Labs] (employer link) inline. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\])/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
        if (p.startsWith('[')) return <a key={i} href={site.employer.url} target="_blank" rel="noopener">{p.slice(1, -1)}</a>
        return p
      })}
    </>
  )
}

function useKathmanduTime() {
  const [time, setTime] = useState('--:--')
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kathmandu' })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = window.setInterval(tick, 15000)
    return () => window.clearInterval(id)
  }, [])
  return time
}

export function About() {
  const time = useKathmanduTime()
  const tools = about.tools
  return (
    <section className="block" id="about" aria-labelledby="about-title">
      <div className="wrap">
        <div className="head reveal">
          <div>
            <p className="eyebrow"><span className="n">■</span> About</p>
            <h2 id="about-title">Between the model and <em className="s">the people.</em></h2>
          </div>
        </div>
        <div className="about">
          <div className="reveal" style={{ '--i': 1 } as React.CSSProperties}>
            {about.paragraphs.map((p) => <p key={p.slice(0, 24)}><Rich text={p} /></p>)}
          </div>
          <aside className="now reveal" style={{ '--i': 2 } as React.CSSProperties} aria-label="Current status">
            <div className="row"><span>Now</span><b className="live"><i aria-hidden="true" /><a href={site.employer.url} target="_blank" rel="noopener">{about.now.role}</a></b></div>
            <div className="row"><span>Local time</span><b><span className="mono">{time}</span> Kathmandu</b></div>
            <div className="row"><span>Open to</span><b>{about.now.openTo}</b></div>
            <div className="row"><span>Working in</span><b>{about.now.workingIn}</b></div>
          </aside>
        </div>
        <div className="marquee reveal" style={{ '--i': 3 } as React.CSSProperties} aria-label="Tools I work with">
          <div className="track">
            {tools.map((t) => <span key={t}>{t}</span>)}
            {tools.map((t) => <span key={`${t}-dup`} aria-hidden="true">{t}</span>)}
          </div>
        </div>
      </div>
    </section>
  )
}
