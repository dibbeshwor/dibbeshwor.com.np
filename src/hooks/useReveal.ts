import { useEffect } from 'react'

/** Elements whose animations loop forever; they rest while they're off screen. */
const LOOPING = '.card, .marquee, .now, .orbit-art'

/**
 * Adds `.in` to every `.reveal` element the first time it scrolls into view, and
 * `.is-off` to anything that loops while it is out of view, so it stops costing frames.
 * Call once at the page level; it observes the whole document.
 */
export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))

    const live = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.classList.toggle('is-off', !e.isIntersecting)
      },
      { rootMargin: '120px 0px' },
    )
    document.querySelectorAll(LOOPING).forEach((el) => live.observe(el))
    return () => { io.disconnect(); live.disconnect() }
  }, [])
}
