import { useEffect, useRef } from 'react'
import { createCosmos } from '../lib/cosmos'
import { useReducedMotion } from '../hooks/useReducedMotion'

/** The WebGL sky, plus the film grain and vignette that sit over the whole page. */
export function Cosmos() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!ref.current) return
    try {
      return createCosmos(ref.current, { reduceMotion: reduce })
    } catch {
      // no WebGL: the nebula gradient in CSS stands in
      document.body.classList.add('no-gl')
    }
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
