import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMagnet } from '../hooks/useMagnet'

export function MagnetLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null)
  useMagnet(ref)
  return (
    <a ref={ref} href={href} className={className}>
      {children}
    </a>
  )
}

/** Copies `value`; the label morphs to "Copied" instead of raising a toast. */
export function CopyButton({ value, className, magnet = false }: { value: string; className?: string; magnet?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [done, setDone] = useState(false)
  useMagnet(ref, magnet ? 0.22 : 0)
  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => setDone(false), 1800)
    return () => window.clearTimeout(t)
  }, [done])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setDone(true)
    } catch {
      window.location.href = `mailto:${value}`
    }
  }
  return (
    <button ref={ref} type="button" className={`${className ?? ''} ${done ? 'is-done' : ''}`} onClick={copy}>
      <span className="label">
        <span className="base">Copy email</span>
        <span className="alt" aria-live="polite">{done ? 'Copied' : ''}</span>
      </span>
    </button>
  )
}
