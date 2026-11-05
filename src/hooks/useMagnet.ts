import { useEffect, type RefObject } from 'react'
import { useFinePointer, useReducedMotion } from './useReducedMotion'

/** Makes an element lean toward the pointer while hovered, then ease back. */
export function useMagnet(ref: RefObject<HTMLElement | null>, strength = 0.22) {
  const fine = useFinePointer()
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el || !fine || reduce) return
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0
    const tick = () => {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18
      el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(tick)
      else raf = 0
    }
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tx = (e.clientX - (r.left + r.width / 2)) * strength
      ty = (e.clientY - (r.top + r.height / 2)) * strength
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const leave = () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick) }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      el.style.transform = ''
    }
  }, [ref, fine, reduce, strength])
}
