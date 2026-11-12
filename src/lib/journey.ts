/**
 * Scroll → where we are in the dive.
 *
 *   f   0 galaxy · 1 solar system · 2 earth · 3 kathmandu (fractions morph)
 *   z   push within a level, 0 wide → 1 close
 *   lock 0 → 1 across the content sections, as earth turns to face Nepal
 *
 * The hero holds the galaxy. In the pinned chapters: Voice dives through the
 * arm and collapses into the solar system, Systems orbits then zooms to the
 * third planet, Reach and Atlas are earth, wide then close. Work, About and
 * Experience hold earth while it turns. Contact dives to Kathmandu; by the
 * footer the city has formed.
 */
export const progress = { f: 0, z: 0, lock: 0 }

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

export function startJourney(reduce: boolean) {
  const chapters = document.querySelector<HTMLElement>('.chapters')
  const contact = document.querySelector<HTMLElement>('#contact')
  if (!chapters || !contact) return () => {}
  let ticking = false
  // layout is read on resize, never on scroll, so a scroll frame doesn't force a layout
  let vh = 0, top = 0, len = 1, end = 0, kathStart = 0, kathEnd = 0
  const measure = () => {
    vh = window.innerHeight
    top = chapters.offsetTop
    len = Math.max(1, chapters.offsetHeight - vh)
    end = top + len
    const docEnd = document.documentElement.scrollHeight - vh
    kathStart = contact.offsetTop - vh * 1.05
    kathEnd = Math.max(kathStart + vh * 0.8, docEnd)
  }
  const n = 4

  const update = () => {
    ticking = false
    const y = window.scrollY

    let f = 0, z = 0, lock = 0
    if (y < top) {
      z = clamp01((y - (top - vh)) / vh) * 0.3
    } else if (y < end) {
      const seg = ((y - top) / len) * n
      const idx = Math.min(n - 1, Math.floor(seg))
      const local = seg - idx
      const morph = clamp01((local - 0.55) / 0.45)
      if (idx === 0) { z = 0.3 + 0.7 * clamp01(local / 0.55); f = morph }
      else if (idx === 1) { f = 1 + morph; z = clamp01(local / 0.55) }
      else if (idx === 2) { f = 2; z = 0.4 * clamp01(local / 0.7) }
      else { f = 2; z = 0.4 + 0.6 * clamp01(local / 0.7) }
    } else {
      f = 2; z = 1
      lock = clamp01((y - end) / Math.max(1, kathStart - vh * 0.6 - end))
      if (y > kathStart) { lock = 1; f = 2 + clamp01((y - kathStart) / (kathEnd - kathStart)) }
    }
    if (reduce) {
      f = Math.round(f); z = 0.5; lock = lock > 0.5 || f >= 3 ? 1 : 0
    }
    progress.f = f; progress.z = z; progress.lock = lock
    const content = y > end + vh * 0.2 && y < kathStart
    if (content !== isContent) { isContent = content; document.body.classList.toggle('is-content', content) }
  }
  let isContent = false
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update) }
  }
  const onResize = () => { measure(); onScroll() }
  // fonts, images and the cards revealing all move the sections after load
  const ro = new ResizeObserver(onResize)
  ro.observe(document.body)
  measure()
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  return () => {
    ro.disconnect()
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    document.body.classList.remove('is-content')
    progress.f = 0; progress.z = 0; progress.lock = 0
  }
}
