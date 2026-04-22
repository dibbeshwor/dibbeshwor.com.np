import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/blog')({ component: Blog })

function Blog() {
  return (
    <div className="page">
      <Header />
      <main>
        <p className="greeting">thoughts —</p>
        <h1 className="name">Coming <em>soon.</em></h1>
      </main>
      <Footer />
    </div>
  )
}
