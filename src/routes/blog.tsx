import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/blog')({
  component: Blog,
  head: () => ({
    meta: [{ title: 'Thoughts — Dibbeshwor Acharya' }],
  }),
})

function Blog() {
  return (
    <div className="page">
      <Header />
      <main>
        <p className="greeting">thoughts —</p>
        <h1 className="name">
          Thoughts, <em>occasionally.</em>
        </h1>

        <article className="post">
          <p className="post-meta">jul 8, 2026 · 2 min</p>
          <h2 className="post-title">I was too lazy to write this</h2>
          <div className="post-body">
            <p>
              Here's how this post got made: I opened my editor, stared at an
              empty <code>blog.tsx</code> for a while, typed "coming soon," and
              shipped it. Told myself I'd write something real later. You know
              how "later" goes.
            </p>
            <p>
              So today I did what any self-respecting engineer does with a task
              that requires effort: I automated it. I told the AI that lives in
              my terminal — the same one that fixes my CSS and politely
              pretends my variable names are fine — to "write a short
              interesting blog that will keep users engaged. Make it funny but
              not too try hard."
            </p>
            <p>
              Which means an AI is now writing, under explicit instructions to
              be funny but not <em>too</em> funny, about a man who builds
              content-automation pipelines for a living and could not manually
              produce three paragraphs.
            </p>
            <p>
              In my defense: at work I turn one writer's article into a video,
              a voiceover, and a WhatsApp push before their chai gets cold.
              Automating other people's content is literally my job. It was
              only a matter of time before I became my own client.
            </p>
            <p>
              Is this cheating? I prefer "dogfooding." The pipeline works —
              you're standing at the end of it, and you read the whole thing,
              which technically makes this the engagement I was asked to
              deliver.
            </p>
            <p>
              Real posts will show up here eventually — ffmpeg crimes, LLM glue
              code, servers I have personally apologized to. Written by me.
              Probably. The ghostwriter says hi, and declines to say anything
              else about itself.
            </p>
          </div>
        </article>

        <p className="post-outro">
          opinions about any of this? the{' '}
          <Link to="/" hash="terminal">
            guestbook
          </Link>{' '}
          is open.
        </p>
      </main>
      <Footer />
    </div>
  )
}
