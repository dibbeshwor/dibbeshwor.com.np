import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { MoreLinks } from "../components/MoreLinks";
import { NeovimEditor } from "../components/NeovimEditor";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="page">
      <svg
        className="deco deco-1"
        width="54"
        height="54"
        viewBox="0 0 54 54"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="27"
          cy="27"
          r="22"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="3 4"
        />
        <circle cx="27" cy="27" r="4" fill="currentColor" opacity="0.5" />
      </svg>
      <svg
        className="deco deco-2"
        width="72"
        height="40"
        viewBox="0 0 72 40"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 28 C 14 6, 30 6, 36 20 S 60 34, 70 14"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
      <svg
        className="deco deco-3"
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20 4 L24 16 L36 20 L24 24 L20 36 L16 24 L4 20 L16 16 Z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          opacity="0.7"
        />
      </svg>

      <Header />

      <main>
        <p className="greeting">hi there —</p>
        <h1 className="name">
          I'm Dibbeshwor,{" "}
          <em>
            a full-stack
            <br />& AI engineer.
          </em>
        </h1>
        <p className="role">
          based in Nepal · building quiet tools that automate loud things
        </p>

        <section className="intro">
          <p>
            I spend my days glueing{" "}
            <span className="underline">LLMs, voice APIs, and ffmpeg</span> into
            pipelines that turn one writer's news story into a video, a
            voiceover, a WhatsApp push, and a Facebook post — all before the
            second coffee.
          </p>
          <p>
            Lately I've been shipping at{" "}
            <a href="https://kmg.com.np" target="_blank" rel="noopener">
              Kantipur Media Group
            </a>{" "}
            and{" "}
            <a href="https://uptrendly.com" target="_blank" rel="noopener">
              Uptrendly Media
            </a>
            , mostly in TypeScript with React, Hono, and Postgres, deployed
            wherever the bill makes sense — AWS, a lonely VPS, Cloudflare.
          </p>
          <p>
            Readable code, clean terminal prompts, and a lot of claude. If that
            sounds like your kind of thing, leave me a note below — or just say
            hi.
          </p>
        </section>

        <MoreLinks />

        <NeovimEditor />
      </main>

      <Footer />
    </div>
  );
}
