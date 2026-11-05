/**
 * All copy for the site lives here. Layout lives in the components.
 * Tone: plain, specific, first person. Facts carry the weight.
 */

export const site = {
  name: 'Dibbeshwor Acharya',
  short: 'Dibbeshwor',
  title: 'Dibbeshwor Acharya — AI engineer',
  description:
    'AI engineer in Kathmandu. Speech, agents and media pipelines that keep working in production.',
  url: 'https://dibbeshwor.com.np',
  email: 'hi@dibbeshwor.com.np',
  linkedin: 'https://www.linkedin.com/in/dbeee/',
  github: 'https://github.com/dibbeshwor',
  employer: { name: 'M&S AI Labs', url: 'https://mns.com.np/mnslabs/' },
}

export const hero = {
  eyebrow: 'AI engineer · Kathmandu · currently at M&S AI Labs',
  // the last entry is set in the accent serif
  words: ['I build', 'AI systems', 'that keep', 'working when'],
  accent: "nobody's watching.",
  lede:
    'Speech, agents and media pipelines: the part between a model and the people who depend on it. Two years shipping to production, end to end.',
  meta: ['TypeScript · Python', 'LLM agents · RAG · TTS', 'Postgres · Redis · GPUs', 'Remote-friendly'],
}

export interface Chapter {
  kicker: string
  title: string
  accent: string
  body: string
  figures: { value: string; label: string }[]
}

export const chapters: Chapter[] = [
  {
    kicker: 'Voice',
    title: 'Teaching machines to',
    accent: 'speak Nepali.',
    body:
      'A fine-tuned text-to-speech model behind a queue-based gateway. It now voices a national radio bulletin and a day’s worth of articles, every day, without anyone pressing a button.',
    figures: [
      { value: '<10 min', label: 'to voice an hour-long bulletin' },
      { value: '120+', label: 'articles voiced per day' },
    ],
  },
  {
    kicker: 'Systems',
    title: 'The unglamorous parts,',
    accent: 'done properly.',
    body:
      'Queues, retries, GPU workers, webhooks, job state in Postgres. The small decisions that turn a model into something people can rely on at 5am.',
    figures: [
      { value: '0', label: 'jobs lost when a worker dies' },
      { value: 'API → queue → GPU', label: 'Hono gateway, Python workers' },
    ],
  },
  {
    kicker: 'Reach',
    title: 'Where the output',
    accent: 'actually lands.',
    body:
      'Election-night results pushed to tens of thousands of people on WhatsApp. Articles that become narrated videos and publish themselves. Agents that answer on the channels people already use.',
    figures: [
      { value: '~40,000', label: 'subscribers, live results' },
      { value: '3', label: 'platforms published automatically' },
    ],
  },
  {
    kicker: 'Atlas',
    title: 'Keeping smaller languages',
    accent: 'audible.',
    body:
      'Helping shape speech for 40 regional languages: dataset requirements, per-language quality benchmarks and how it all gets deployed. Accessibility first, preservation as a side effect.',
    figures: [
      { value: '40', label: 'languages in scope' },
      { value: 'ongoing', label: 'M&S AI Labs' },
    ],
  },
]

export type Figure =
  | { kind: 'metrics'; items: { value: string; unit?: string; label: string }[] }
  | { kind: 'pipe'; steps: string[]; hot: string }

export interface WorkItem {
  kicker: string
  meta: string
  title: string
  body: string
  stack?: string[]
  figure: Figure
  wide?: boolean
}

export const work: WorkItem[] = [
  {
    kicker: 'Text-to-speech gateway',
    meta: 'Kantipur · M&S AI Labs · 2025–now',
    title: 'Nepali speech, at newsroom speed',
    body:
      'Fine-tuned TTS behind a queue-based gateway: a Hono API hands jobs to GPU Python workers, with job state in PostgreSQL, API keys, webhooks and retries with backoff.',
    stack: ['TypeScript', 'Hono', 'Python', 'PostgreSQL', 'Docker', 'GPUs'],
    figure: {
      kind: 'metrics',
      items: [
        { value: '<10', unit: 'min', label: 'hour-long radio bulletin' },
        { value: '120', unit: '+/day', label: 'articles given a voice' },
      ],
    },
    wide: true,
  },
  {
    kicker: 'Conversational news',
    meta: '2026',
    title: 'chat.ekantipur.com',
    body:
      'Readers ask the news questions. Frontend, Node.js proxy and an embeddable widget, covering the whole path from browser to model.',
    figure: { kind: 'pipe', steps: ['reader', 'widget', 'proxy', 'model'], hot: 'model' },
  },
  {
    kicker: 'Real-time messaging',
    meta: '2026',
    title: 'Election night on WhatsApp',
    body: 'Live result updates during Nepal’s 2026 election, pushed to a WhatsApp channel as counts came in.',
    figure: { kind: 'metrics', items: [{ value: '~40', unit: 'k', label: 'subscribers receiving live results' }] },
  },
  {
    kicker: 'Media automation',
    meta: '2024–26',
    title: 'Article → narrated video',
    body:
      'A story goes in; a narrated video comes out and is published to Facebook, Instagram and WhatsApp with no one in the loop.',
    figure: { kind: 'pipe', steps: ['article', 'tts', 'ffmpeg', 'publish'], hot: 'ffmpeg' },
  },
  {
    kicker: 'Creator tooling',
    meta: 'Uptrendly · 2025–26',
    title: 'Brief → finished video',
    body:
      'Script, image, voice and video generation in one pipeline, plus a RAG agent that recommends influencers over WhatsApp.',
    figure: { kind: 'metrics', items: [{ value: '<30', unit: 'min', label: 'from brief to finished video' }] },
  },
  {
    kicker: 'Regional speech',
    meta: 'M&S AI Labs · ongoing',
    title: 'Atlas',
    body: 'Architecture for text-to-speech across regional languages: datasets, per-language quality benchmarks, deployment.',
    figure: { kind: 'metrics', items: [{ value: '40', label: 'languages in scope' }] },
  },
]

export const smaller: { title: string; body: string }[] = [
  { title: 'Shopmate', body: 'Groceries ordered on WhatsApp by text or voice note. The nearest rider is assigned automatically.' },
  { title: 'WhatsApp assistant', body: 'Prototype agent for email, spreadsheets and message triage. Mostly taught me where platform policy draws the line.' },
  { title: 'Likeness studio', body: 'Consent-based ad images and short videos for creators, with a royalty model.' },
  { title: 'Protest discourse', body: 'Analysis of 40,000+ Discord and Reddit posts from Nepal’s Gen-Z protests.' },
  { title: 'Lokdohori Pratisthan', body: 'Membership platform with eSewa payments for a folk-music organisation.' },
  { title: 'Digital Palika', body: 'Municipal services with role-based access and a letter-template builder.' },
]

export const about = {
  paragraphs: [
    // `strong` segments are marked with ** ** and rendered bold
    'Most of my work sits between a model and the people who depend on its output. **The queues, retries, GPU workers and small decisions** that make an AI system something you can trust when nobody is watching it.',
    'I lead AI engineering at [M&S AI Labs], building products for newsrooms, brands and creators. Before that, two years at Kantipur Media Group, and creator tooling at Uptrendly Media in parallel. I studied Computing at London Metropolitan University, through Islington College.',
    'I like readable code, boring infrastructure and tools that disappear into someone’s day.',
  ],
  now: {
    role: 'AI Engineering Lead, M&S AI Labs',
    openTo: 'Work that’s hard for the right reasons. Remote or Kathmandu.',
    workingIn: 'TypeScript, Python, SQL',
  },
  tools: [
    'TypeScript', 'Python', 'Hono', 'FastAPI', 'Node.js', 'PostgreSQL', 'Redis', 'Qdrant', 'BullMQ',
    'Docker', 'Nginx', 'Cloudflare', 'AWS', 'RunPod', 'React', 'TanStack', 'FFmpeg', 'WebSockets',
  ],
}

export const experience: { years: string; role: string; org: string; current?: boolean }[] = [
  { years: '2026 — now', role: 'AI Engineering Lead', org: 'M&S AI Labs', current: true },
  { years: '2024 — 2026', role: 'Full-stack / AI Engineer', org: 'Kantipur Media Group' },
  { years: '2025 — 2026', role: 'Backend / Automation Engineer', org: 'Uptrendly Media · remote' },
  { years: '2022 — 2025', role: 'BSc (Hons) Computing', org: 'London Metropolitan University, via Islington College' },
]

export const contact = {
  lede:
    'If you’re building something where AI has to actually work in production, I’d like to hear about it. I reply to most emails within a day.',
}
