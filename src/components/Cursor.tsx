import { useEffect, useRef } from 'react'
import { useFinePointer, useReducedMotion } from '../hooks/useReducedMotion'

/**
 * A small star for a cursor: a hot dot that sits exactly under the pointer and a
 * soft ring that trails it. The ring opens over anything clickable. Fine pointers
 * only; touch and reduced-motion users keep the native cursor.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const fine = useFinePointer()
  const reduce = useReducedMotion()
  useEffect(() => {
    const d = dot.current, r = ring.current
    if (!d || !r || !fine || reduce) return
    document.documentElement.classList.add('has-cursor')
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0, shown = false
    const tick = () => {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) raf = requestAnimationFrame(tick)
      else raf = 0
    }
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY
      if (!shown) { shown = true; rx = x; ry = y; d.classList.add('on'); r.classList.add('on') }
      const t = e.target as Element | null
      const hot = !!t?.closest('a, button, [role="button"], .card, input, textarea')
      r.classList.toggle('hot', hot)
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const down = () => r.classList.add('down')
    const up = () => r.classList.remove('down')
    const leave = () => { d.classList.remove('on'); r.classList.remove('on'); shown = false }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [fine, reduce])
  if (!fine || reduce) return null
  return (
    <>
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
      <div className="cursor-ring" ref={ring} aria-hidden="true" />
    </>
  )
}
