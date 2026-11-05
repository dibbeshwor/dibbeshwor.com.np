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
  hello: 'Dibbeshwor Acharya, AI engineer in Kathmandu.',
  // the last entry is set in the accent serif
  words: ['I build', 'AI systems', 'that keep', 'working when'],
  accent: "nobody's watching.",
  lede:
    'Speech, agents and media pipelines: the part between a model and the people who depend on it. Two years shipping to production, end to end.',
  meta: ['Currently at M&S AI Labs', 'TypeScript · Python', 'LLM agents · RAG · TTS', 'Remote-friendly'],
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

export interface WorkItem {
  title: string
  line: string
  meta: string
  href?: string
  viz: 'astro' | 'shop' | 'cutaway' | 'tts' | 'election' | 'article' | 'atlas'
  size: 'lead' | 'third' | 'half'
}

export const work: WorkItem[] = [
  {
    title: 'AstroMates',
    line: 'Friends answer one question a day and see how their Vedic charts line up. An AI Jyotishi answers in English or Nepali.',
    meta: 'astromates.io',
    href: 'https://astromates.io',
    viz: 'astro',
    size: 'lead',
  },
  {
    title: 'Shopmate',
    line: 'Groceries ordered on WhatsApp by text or voice note, across the Kathmandu valley. The nearest rider is assigned automatically.',
    meta: 'shopmate.si',
    href: 'https://shopmate.si',
    viz: 'shop',
    size: 'lead',
  },
  {
    title: 'Nepali speech at newsroom speed',
    line: 'Fine-tuned text-to-speech behind a queue-based gateway. An hour of radio, voiced in under ten minutes.',
    meta: 'Kantipur · M&S AI Labs',
    viz: 'tts',
    size: 'third',
  },
  {
    title: 'Cutaway',
    line: 'A long recording goes in; the moments worth keeping come out as short clips.',
    meta: 'cutaway.pro',
    href: 'https://cutaway.pro',
    viz: 'cutaway',
    size: 'third',
  },
  {
    title: 'Election night on WhatsApp',
    line: 'Live results for Nepal’s 2026 election, pushed to a channel as the counts came in.',
    meta: 'Kantipur · 2026',
    viz: 'election',
    size: 'third',
  },
  {
    title: 'Article → narrated video',
    line: 'A story goes in; a narrated video comes out and publishes itself to three platforms.',
    meta: 'Kantipur · 2024–26',
    viz: 'article',
    size: 'half',
  },
  {
    title: 'Atlas',
    line: 'Speech for 40 regional languages: datasets, per-language quality benchmarks, deployment.',
    meta: 'M&S AI Labs · ongoing',
    viz: 'atlas',
    size: 'half',
  },
]

export const smaller: { title: string; body: string }[] = [
  { title: 'Brief → finished video', body: 'Script, image, voice and video in one pipeline, under 30 minutes end to end. Uptrendly Media.' },
  { title: 'Influencer RAG agent', body: 'Recommends creators from proprietary data, over WhatsApp. Uptrendly Media.' },
  { title: 'WhatsApp assistant', body: 'Prototype agent for email, spreadsheets and triage. Mostly taught me where platform policy draws the line.' },
  { title: 'Likeness studio', body: 'Consent-based ad images and short videos for creators, with a royalty model.' },
  { title: 'Protest discourse', body: 'Analysis of 40,000+ Discord and Reddit posts from Nepal’s Gen-Z protests.' },
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
