import { createFileRoute } from '@tanstack/react-router'
import { Field } from '../components/Field'
import { Nav } from '../components/Nav'
import { Hero } from '../components/Hero'
import { Chapters } from '../components/Chapters'
import { Work } from '../components/Work'
import { About } from '../components/About'
import { Experience } from '../components/Experience'
import { Contact, Footer } from '../components/Contact'
import { useReveal } from '../hooks/useReveal'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  useReveal()
  return (
    <>
      <Field />
      <Nav />
      <main id="top">
        <Hero />
        <Chapters />
        <Work />
        <About />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
