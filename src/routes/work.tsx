import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/work')({
  component: Work,
  head: () => ({
    meta: [{ title: 'Work — Dibbeshwor Acharya' }],
  }),
})

interface WorkItem {
  title: string
  href?: string
  meta: string
  desc: string
  tags: string[]
}

const ITEMS: WorkItem[] = [
  {
    title: 'AI content infrastructure',
    href: 'https://mediastack.pro',
    meta: 'mediastack ai · 2026 — now',
    desc: 'the AI-powered plumbing behind how content gets made — LLM pipelines, media generation, and a lot of glue. this is the day job, and the fun kind.',
    tags: ['TypeScript', 'LLMs', 'pipelines'],
  },
  {
    title: 'Story-to-everything pipeline',
    href: 'https://kmg.com.np',
    meta: 'kantipur media group · 2024 — 2026',
    desc: "one writer's article goes in; a rendered video, an AI voiceover, and WhatsApp & Viber news pushes come out. also scraped and analyzed 40k+ Discord and Reddit posts, and built the newsroom's internal WhatsApp task bot.",
    tags: ['ffmpeg', 'Facebook Graph API', 'Azure TTS', 'ElevenLabs', 'Node.js'],
  },
  {
    title: 'Video asset pipeline & RAG chatbot',
    href: 'https://uptrendly.com',
    meta: 'uptrendly media · 2025 — 2026',
    desc: 'an end-to-end video production pipeline that turns a brief into finished assets in about 30 minutes, plus a RAG chatbot that recommends influencers. runs on AWS and Cloudflare.',
    tags: ['AWS', 'Cloudflare', 'RAG', 'RESTful APIs'],
  },
  {
    title: 'Lokdohori Pratisthan',
    href: 'https://lokdohoripratisthan.org.np/',
    meta: 'freelance · membership platform',
    desc: "membership management for Nepal's folk-music organisation — eSewa payments, member records, and an admin panel to run it all.",
    tags: ['React', 'Express', 'TypeScript', 'eSewa'],
  },
  {
    title: 'Digital Palika & E-Sifarish',
    meta: 'khandachakra municipality · gov services',
    desc: 'digital services for a local government — role-based access control, a dynamic template builder, and automated sifarish (recommendation letter) issuing.',
    tags: ['React', 'Mantine UI', 'RBAC'],
  },
]

function Work() {
  return (
    <div className="page">
      <Header />
      <main>
        <p className="greeting">work —</p>
        <h1 className="name">
          Things I've <em>shipped.</em>
        </h1>
        <p className="role">
          pipelines, portals, and quiet tools — newest first
        </p>

        <div className="work-list">
          {ITEMS.map((item) => (
            <article key={item.title} className="work-item">
              <h2 className="work-title">
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener">
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </h2>
              <p className="work-meta">{item.meta}</p>
              <p className="work-desc">{item.desc}</p>
              <div className="work-tags">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
