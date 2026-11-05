import { useEffect, useRef } from 'react'
import { createField } from '../lib/field'
import { useReducedMotion } from '../hooks/useReducedMotion'

export function Field() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!ref.current) return
    return createField(ref.current, { reduceMotion: reduce })
  }, [reduce])
  return (
    <>
      <canvas id="field" ref={ref} aria-hidden="true" />
      <div className="nebula" aria-hidden="true" />
    </>
  )
}
