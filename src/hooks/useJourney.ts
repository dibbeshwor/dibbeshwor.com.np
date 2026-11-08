import { useEffect } from 'react'
import { startJourney } from '../lib/journey'
import { useReducedMotion } from './useReducedMotion'

/** Drives the sky from scroll. Call once at the page level, after the sections have mounted. */
export function useJourney() {
  const reduce = useReducedMotion()
  useEffect(() => startJourney(reduce), [reduce])
}
