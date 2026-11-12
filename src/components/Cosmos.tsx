import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

/*
 * three.js is most of the page's script, so the sky comes in its own chunk: the words can
 * paint before it has parsed. The request goes out with the page (a modulepreload that
 * vite.config.ts adds to index.html), so it doesn't wait for this module to ask.
 */
const cosmos = import('../lib/cosmos')

const noGL = () => document.body.classList.add('no-gl')

/** The WebGL sky, plus the film grain and vignette that sit over the whole page. */
export function Cosmos() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let destroy: (() => void) | undefined
    let gone = false
    cosmos.then(
      ({ createCosmos }) => {
        if (gone) return
        try {
          destroy = createCosmos(canvas, { reduceMotion: reduce })
        } catch {
          // no WebGL: the nebula gradient in CSS stands in
          noGL()
        }
      },
      noGL,
    )
    return () => { gone = true; destroy?.() }
  }, [reduce])
  return (
    <>
      <canvas id="field" ref={ref} aria-hidden="true" />
      <div className="nebula" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  )
}
