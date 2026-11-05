/**
 * Small animated illustrations, one per project. Pure SVG + CSS keyframes
 * (see `.viz-*` in index.css). They play only once the card has `.in`, and
 * hold their end state under prefers-reduced-motion.
 */
import { useReducedMotion } from '../hooks/useReducedMotion'

export type VizKind = 'astro' | 'shop' | 'cutaway' | 'tts' | 'election' | 'article' | 'atlas'

export function Viz({ kind }: { kind: VizKind }) {
  switch (kind) {
    case 'astro': return <AstroViz />
    case 'shop': return <ShopViz />
    case 'cutaway': return <CutawayViz />
    case 'tts': return <TtsViz />
    case 'election': return <ElectionViz />
    case 'article': return <ArticleViz />
    case 'atlas': return <AtlasViz />
  }
}

/* North Indian chart (the diamond-in-a-square Vedic layout), two friends' charts, a thread between them */
function AstroViz() {
  const chart = (x: number, y: number, s: number, cls: string) => (
    <g className={cls} transform={`translate(${x} ${y})`}>
      <rect width={s} height={s} rx="6" />
      <path d={`M0 0 L${s} ${s} M${s} 0 L0 ${s}`} />
      <path d={`M${s / 2} 0 L${s} ${s / 2} L${s / 2} ${s} L0 ${s / 2} Z`} />
    </g>
  )
  return (
    <svg className="viz viz-astro" viewBox="0 0 320 180" aria-hidden="true">
      {chart(28, 26, 128, 'chart a')}
      {chart(176, 26, 116, 'chart b')}
      {/* planets */}
      <g className="planets">
        <circle cx="60" cy="48" r="3.2" /><circle cx="124" cy="60" r="2.6" /><circle cx="92" cy="130" r="3" />
        <circle cx="48" cy="112" r="2.4" /><circle cx="234" cy="46" r="3.2" /><circle cx="266" cy="98" r="2.6" />
        <circle cx="204" cy="118" r="3" /><circle cx="236" cy="128" r="2.4" />
      </g>
      {/* the thread: a match between two charts */}
      <path className="thread" d="M92 90 C 130 70, 170 110, 234 84" />
      <g className="orbs">
        <circle cx="92" cy="90" r="7" /><circle cx="234" cy="84" r="7" />
      </g>
      <text className="tag" x="28" y="170">daily question · 6-day streak</text>
      <text className="tag right" x="292" y="170">78% match</text>
    </svg>
  )
}

/* WhatsApp order on the left, rider route on the right */
function ShopViz() {
  const reduce = useReducedMotion()
  return (
    <svg className="viz viz-shop" viewBox="0 0 320 180" aria-hidden="true">
      <g className="bubble b1">
        <rect x="22" y="26" width="118" height="30" rx="10" />
        <text x="34" y="46">🥚 🥛 🍜 2 kg chamal</text>
      </g>
      <g className="bubble b2">
        <rect x="22" y="64" width="96" height="28" rx="10" />
        <path className="play" d="M34 72 l10 6 l-10 6 z" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <rect key={i} className="bar" x={52 + i * 6} y={78 - ((i * 7) % 5) - 2} width="3" height={6 + ((i * 7) % 5) * 2} rx="1.5" />
        ))}
      </g>
      <g className="bubble b3 reply">
        <rect x="46" y="102" width="112" height="28" rx="10" />
        <text x="58" y="121">Rider assigned · 12 min</text>
      </g>
      {/* route */}
      <path className="route" id="shop-route" d="M196 132 C 212 92, 236 118, 254 86 S 286 52, 300 42" />
      <circle className="pin shop" cx="196" cy="132" r="5" />
      <circle className="pin home" cx="300" cy="42" r="5" />
      <circle className="rider" r="5">
        {!reduce && (
          <animateMotion dur="5.5s" repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;0.35;0.85;1" calcMode="linear">
            <mpath href="#shop-route" />
          </animateMotion>
        )}
      </circle>
      <text className="tag" x="22" y="170">no app · just WhatsApp</text>
    </svg>
  )
}

/* a long timeline, three clips lifted out of it */
function CutawayViz() {
  return (
    <svg className="viz viz-cut" viewBox="0 0 320 180" aria-hidden="true">
      <rect className="film" x="24" y="52" width="272" height="18" rx="4" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <rect key={i} className="frame" x={30 + i * 22} y="56" width="16" height="10" rx="2" />
      ))}
      <g className="hot">
        <rect x="74" y="52" width="38" height="18" rx="4" />
        <rect x="162" y="52" width="38" height="18" rx="4" />
        <rect x="250" y="52" width="38" height="18" rx="4" />
      </g>
      <g className="clips">
        <g className="clip c1"><rect x="40" y="104" width="68" height="40" rx="6" /><path d="M70 118 l8 6 l-8 6 z" /></g>
        <g className="clip c2"><rect x="126" y="104" width="68" height="40" rx="6" /><path d="M156 118 l8 6 l-8 6 z" /></g>
        <g className="clip c3"><rect x="212" y="104" width="68" height="40" rx="6" /><path d="M242 118 l8 6 l-8 6 z" /></g>
      </g>
      <text className="tag" x="24" y="170">42:17 → 3 clips</text>
    </svg>
  )
}

/* Nepali text becoming a waveform */
function TtsViz() {
  const bars = Array.from({ length: 26 }, (_, i) => i)
  return (
    <svg className="viz viz-tts" viewBox="0 0 320 180" aria-hidden="true">
      <text className="dev" x="24" y="64">आजको मुख्य समाचार</text>
      <text className="dev dim" x="24" y="90">रेडियो कान्तिपुर</text>
      <g className="wave" transform="translate(170 0)">
        {bars.map((i) => (
          <rect key={i} className="bar" x={i * 5} y="60" width="3" height="16" rx="1.5" style={{ animationDelay: `${(i * 0.09) % 1.2}s` }} />
        ))}
      </g>
      <text className="big" x="24" y="150">&lt;10 min</text>
      <text className="tag" x="130" y="150">for an hour of radio</text>
    </svg>
  )
}

/* a broadcast: rings leaving one point, reaching many */
function ElectionViz() {
  const dots = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2, r = 54 + ((i * 13) % 3) * 12
    return { x: 160 + Math.cos(a) * r * 1.6, y: 76 + Math.sin(a) * r * 0.7, d: (i * 0.17) % 2 }
  })
  return (
    <svg className="viz viz-vote" viewBox="0 0 320 180" aria-hidden="true">
      <g className="rings"><circle cx="160" cy="76" r="14" /><circle cx="160" cy="76" r="14" /><circle cx="160" cy="76" r="14" /></g>
      <circle className="src" cx="160" cy="76" r="5" />
      <g className="people">
        {dots.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.6" style={{ animationDelay: `${p.d}s` }} />)}
      </g>
      <text className="big" x="24" y="156">~40,000</text>
      <text className="tag" x="150" y="156">subscribers, live counts</text>
    </svg>
  )
}

/* lines of text sliding into a video frame */
function ArticleViz() {
  return (
    <svg className="viz viz-art" viewBox="0 0 320 180" aria-hidden="true">
      <g className="doc">
        <rect x="24" y="36" width="96" height="108" rx="8" />
        <rect className="ln" x="38" y="54" width="60" height="4" rx="2" />
        <rect className="ln" x="38" y="66" width="68" height="4" rx="2" />
        <rect className="ln" x="38" y="78" width="52" height="4" rx="2" />
        <rect className="ln" x="38" y="90" width="64" height="4" rx="2" />
        <rect className="ln" x="38" y="102" width="44" height="4" rx="2" />
      </g>
      <g className="fly">
        <rect x="38" y="54" width="60" height="4" rx="2" />
        <rect x="38" y="66" width="68" height="4" rx="2" />
        <rect x="38" y="78" width="52" height="4" rx="2" />
      </g>
      <g className="video">
        <rect x="168" y="40" width="128" height="80" rx="8" />
        <path className="play" d="M224 68 l16 12 l-16 12 z" />
        <g className="voice"><rect x="180" y="106" width="3" height="6" /><rect x="186" y="103" width="3" height="12" /><rect x="192" y="105" width="3" height="8" /><rect x="198" y="101" width="3" height="16" /><rect x="204" y="106" width="3" height="6" /></g>
      </g>
      <g className="out">
        <circle cx="200" cy="146" r="7" /><circle cx="232" cy="146" r="7" /><circle cx="264" cy="146" r="7" />
      </g>
      <text className="tag" x="24" y="170">article → voice → video → published</text>
    </svg>
  )
}

/* forty languages around one ring, lit one after another */
function AtlasViz() {
  const n = 40
  return (
    <svg className="viz viz-atlas" viewBox="0 0 320 180" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2
        return <circle key={i} className="lang" cx={160 + Math.cos(a) * 70} cy={88 + Math.sin(a) * 70} r="3" style={{ animationDelay: `${i * 0.12}s` }} />
      })}
      <text className="dev c" x="160" y="84">आवाज</text>
      <text className="tag c" x="160" y="104">40 languages</text>
    </svg>
  )
}
