import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/$')({ component: NotFound })

function NotFound() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if ((e.target as Element).closest('a')) return
      void navigate({ to: '/' })
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [navigate])

  return (
    <div className="nf-container">
      <div className="nf-wrap">
        <h1 className="nf-code">4<span className="nf-zero">0</span>4</h1>
        <div className="nf-tag">Seems like you got lost.</div>
        <br />
        <Link to="/" className="nf-cmd">
          <span className="nf-prompt">:q</span>take me home
        </Link>
        <div className="nf-hint">press anywhere to go back</div>
        <svg className="nf-squiggle" width="180" height="30" viewBox="0 0 180 30" fill="none" aria-hidden="true">
          <path d="M4 22 C 28 2, 56 2, 70 18 S 116 28, 176 6" stroke="currentColor" strokeWidth="1.4" fill="none" />
        </svg>
      </div>
    </div>
  )
}
