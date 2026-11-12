/**
 * Builds the per-particle attributes for the four stops of the journey.
 * Everything is deterministic in the particle index, so a rebuild at a new
 * size keeps each star's personality.
 *
 *   0 galaxy · 1 solar system · 2 earth · 3 kathmandu
 */
import { isLand } from './land'

/** deterministic hash → [0,1) */
export function rand(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}
const gauss = (i: number, salt: number) => (rand(i, salt) + rand(i, salt + 17) + rand(i, salt + 31)) / 1.5 - 1

export const GALAXY_R = 26
export const EARTH_R = 15
export const KATHMANDU = { lat: 27.7172, lon: 85.324 }
/** the third planet: every particle that belongs to it shares these, so the camera can find it */
export const EARTH_ORBIT = { r: 8.8, angle0: 0.6, speed: 0.157 }

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]
const mixc = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export interface Formations {
  N: number
  galaxy: Float32Array        // vec3
  seed: Float32Array          // vec3
  size: Float32Array          // float
  kind: Float32Array          // 0 cool · 1 warm · 2 bright
  brightIdx: number[]         // indices of bright, non-bulge galaxy stars
  solar: Float32Array         // vec4: orbit radius, start angle, angular speed, alpha
  solarO: Float32Array        // vec3: offset from the body centre
  solarC: Float32Array        // vec3 colour
  earth: Float32Array         // vec4: unit position, alpha (2 = pulsing beacon)
  earthC: Float32Array        // vec3 colour
  kath: Float32Array          // vec4: position, alpha
  kathC: Float32Array         // vec3 colour
}

export function buildFormations(N: number): Formations {
  const galaxy = new Float32Array(N * 3), seed = new Float32Array(N * 3), size = new Float32Array(N), kind = new Float32Array(N)
  const solar = new Float32Array(N * 4), solarO = new Float32Array(N * 3), solarC = new Float32Array(N * 3)
  const earth = new Float32Array(N * 4), earthC = new Float32Array(N * 3)
  const kath = new Float32Array(N * 4), kathC = new Float32Array(N * 3)
  const brightIdx: number[] = []

  /* ------------------------------------------------------------ galaxy + identity */
  for (let i = 0; i < N; i++) {
    const i3 = i * 3
    const inBulge = rand(i, 1) < 0.16
    let gx: number, gy: number, gz: number
    if (inBulge) {
      const r = Math.pow(rand(i, 2), 0.7) * 6, th = rand(i, 3) * Math.PI * 2, ph = Math.acos(rand(i, 4) * 2 - 1)
      gx = r * Math.sin(ph) * Math.cos(th); gz = r * Math.sin(ph) * Math.sin(th); gy = r * Math.cos(ph) * 0.6
    } else {
      const r = (0.08 + Math.pow(rand(i, 2), 0.72) * 0.92) * GALAXY_R
      const arm = i % 3
      const haze = rand(i, 23) < 0.22
      const ang = r * 0.24 + arm * ((Math.PI * 2) / 3) + (haze ? rand(i, 24) * 2.1 : 0)
      const across = gauss(i, 5) * (1.6 + r * 0.09) * (haze ? 2.2 : 1)
      const along = gauss(i, 25) * 1.2
      gx = Math.cos(ang) * r - Math.sin(ang) * across + Math.cos(ang) * along
      gz = Math.sin(ang) * r + Math.cos(ang) * across + Math.sin(ang) * along
      gy = gauss(i, 6) * (0.4 + (1 - r / GALAXY_R) * 2.0)
    }
    galaxy[i3] = gx; galaxy[i3 + 1] = gy; galaxy[i3 + 2] = gz
    seed[i3] = rand(i, 18); seed[i3 + 1] = rand(i, 19); seed[i3 + 2] = rand(i, 20)
    const kr = rand(i, 21)
    kind[i] = kr < 0.78 ? 0 : kr < 0.94 ? 1 : 2
    size[i] = kind[i] === 2 ? 2.8 + rand(i, 22) * 2.6 : 1.15 + Math.pow(rand(i, 22), 1.7) * 2.6
    if (kind[i] === 2 && !inBulge) brightIdx.push(i)
  }

  /* ------------------------------------------------------------ solar system */
  {
    const planets = [
      { r: 4.5, body: 0.42, c: '#a99d94', n: 0.006 },
      { r: 6.5, body: 0.72, c: '#e8b45c', n: 0.010 },
      { r: EARTH_ORBIT.r, body: 0.78, c: '#5a96e6', n: 0.012, angle0: EARTH_ORBIT.angle0 },
      { r: 11, body: 0.55, c: '#ea6a42', n: 0.008 },
      { r: 19, body: 1.35, c: '#e09a6e', n: 0.02 },
      { r: 23.5, body: 1.15, c: '#e2b45e', n: 0.015, ring: [1.7, 2.7] as [number, number] },
      { r: 27, body: 1.2, c: '#5fc4c4', n: 0.016 },
      { r: 30.5, body: 1.2, c: '#4f80d6', n: 0.016 },
    ]
    const speedAt = (r: number) => EARTH_ORBIT.speed * Math.pow(EARTH_ORBIT.r / r, 1.5)
    // slots: [start, end) fractions of N
    const plan: { frac: number; fill: (i: number, j: number, count: number) => void }[] = []
    const set = (i: number, r: number, a0: number, sp: number, alpha: number, ox: number, oy: number, oz: number, col: [number, number, number]) => {
      solar[i * 4] = r; solar[i * 4 + 1] = a0; solar[i * 4 + 2] = sp; solar[i * 4 + 3] = alpha
      solarO[i * 3] = ox; solarO[i * 3 + 1] = oy; solarO[i * 3 + 2] = oz
      solarC[i * 3] = col[0]; solarC[i * 3 + 1] = col[1]; solarC[i * 3 + 2] = col[2]
    }
    const onSphere = (i: number, R: number, salt: number, shell = true) => {
      const th = rand(i, salt) * Math.PI * 2, ph = Math.acos(rand(i, salt + 1) * 2 - 1)
      const rr = shell ? R : R * Math.cbrt(rand(i, salt + 2))
      return [rr * Math.sin(ph) * Math.cos(th), rr * Math.cos(ph), rr * Math.sin(ph) * Math.sin(th)] as const
    }
    const sunCore = hex('#ffc85e'), sunEdge = hex('#f27e54')
    plan.push({ frac: 0.055, fill: (i) => {
      const [x, y, z] = onSphere(i, 2.4, 40, false)
      const d = Math.hypot(x, y, z) / 2.4
      set(i, 0, 0, 0, 1, x, y, z, mixc(sunCore, sunEdge, d))
    } })
    const dustCol = hex('#8fa8dc')
    plan.push({ frac: 0.17, fill: (i, j, count) => {
      const p = planets[j % planets.length]
      const r = p.r + gauss(i, 43) * 0.12
      set(i, r, rand(i, 44) * Math.PI * 2, speedAt(p.r), 0.34, 0, gauss(i, 45) * 0.08, 0, dustCol)
      void count
    } })
    for (const p of planets) {
      const col = hex(p.c)
      plan.push({ frac: p.n, fill: (i) => {
        const [x, y, z] = onSphere(i, p.body, 46, rand(i, 49) < 0.7)
        const shade = 0.75 + 0.35 * rand(i, 50)
        set(i, p.r, p.angle0 ?? rand(0, p.r) * Math.PI * 2, speedAt(p.r), 1, x, y, z, [col[0] * shade, col[1] * shade, col[2] * shade])
      } })
      if (p.ring) {
        const ringCol = hex('#cfa873')
        plan.push({ frac: 0.018, fill: (i) => {
          const rr = p.ring![0] + Math.pow(rand(i, 51), 0.8) * (p.ring![1] - p.ring![0]), a = rand(i, 52) * Math.PI * 2
          set(i, p.r, p.angle0 ?? rand(0, p.r) * Math.PI * 2, speedAt(p.r), 0.55 + 0.3 * rand(i, 53), Math.cos(a) * rr, gauss(i, 54) * 0.04, Math.sin(a) * rr * 0.92, ringCol)
        } })
      }
    }
    const beltCol = hex('#aaa294')
    plan.push({ frac: 0.15, fill: (i) => {
      const r = 13.6 + Math.pow(rand(i, 55), 1.2) * 2.6
      set(i, r, rand(i, 56) * Math.PI * 2, speedAt(r), 0.4, 0, gauss(i, 57) * 0.5, 0, beltCol)
    } })
    const kuiperCol = hex('#8c9ade')
    plan.push({ frac: 0.11, fill: (i) => {
      const r = 33 + Math.pow(rand(i, 58), 1.1) * 4.5
      set(i, r, rand(i, 59) * Math.PI * 2, speedAt(r), 0.3, 0, gauss(i, 60) * 1.2, 0, kuiperCol)
    } })
    const hazeCol = hex('#a3bce4')
    plan.push({ frac: 1, fill: (i) => {
      const r = 3 + Math.pow(rand(i, 61), 0.8) * 32
      set(i, r, rand(i, 62) * Math.PI * 2, speedAt(r) * 0.6, 0.14, 0, gauss(i, 63) * 0.3, 0, hazeCol)
    } })
    let i = 0
    for (const slot of plan) {
      const count = slot.frac >= 1 ? N - i : Math.round(N * slot.frac)
      for (let j = 0; j < count && i < N; j++, i++) slot.fill(i, j, count)
    }
  }

  /* ------------------------------------------------------------ earth */
  {
    const land = hex('#3fa784'), landWarm = hex('#dba254'), ocean = hex('#74a8ea'), beaconC = hex('#e9542c')
    const toXYZ = (lat: number, lon: number) => {
      const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180
      return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)] as const
    }
    const nLand = Math.round(N * 0.6), nBeacon = Math.round(N * 0.006)
    for (let i = 0; i < N; i++) {
      const i4 = i * 4, i3 = i * 3
      if (i < nLand) {
        // rejection-sample the land mask so the continents are dense and the sea is quiet
        let lat = 0, lon = 0, ok = false
        for (let t = 0; t < 60 && !ok; t++) {
          lat = (Math.asin(rand(i, 70 + t) * 2 - 1) * 180) / Math.PI
          lon = rand(i, 140 + t) * 360 - 180
          ok = isLand(lat, lon)
        }
        const [x, y, z] = toXYZ(lat, lon)
        earth[i4] = x; earth[i4 + 1] = y; earth[i4 + 2] = z; earth[i4 + 3] = ok ? 0.85 + 0.15 * rand(i, 71) : 0.45
        const c = ok ? mixc(land, landWarm, rand(i, 72) * 0.5) : ocean
        earthC[i3] = c[0]; earthC[i3 + 1] = c[1]; earthC[i3 + 2] = c[2]
      } else if (i < nLand + nBeacon) {
        const a = rand(i, 73) * Math.PI * 2, d = Math.sqrt(rand(i, 74)) * 1.6
        const [x, y, z] = toXYZ(KATHMANDU.lat + Math.sin(a) * d, KATHMANDU.lon + Math.cos(a) * d)
        earth[i4] = x; earth[i4 + 1] = y; earth[i4 + 2] = z; earth[i4 + 3] = 2
        earthC[i3] = beaconC[0]; earthC[i3 + 1] = beaconC[1]; earthC[i3 + 2] = beaconC[2]
      } else {
        const lat = (Math.asin(rand(i, 75) * 2 - 1) * 180) / Math.PI, lon = rand(i, 76) * 360 - 180
        const [x, y, z] = toXYZ(lat, lon)
        const onLand = isLand(lat, lon)
        earth[i4] = x; earth[i4 + 1] = y; earth[i4 + 2] = z; earth[i4 + 3] = onLand ? 0.7 : 0.42
        const c = onLand ? land : ocean
        earthC[i3] = c[0]; earthC[i3 + 1] = c[1]; earthC[i3 + 2] = c[2]
      }
    }
  }

  /* ------------------------------------------------------------ kathmandu */
  {
    const GROUND = -14
    const stone = hex('#6f82a8'), stoneDim = hex('#b6c0d2'), gold = hex('#e29a2c'), light = hex('#ea7a4c'), lightPale = hex('#f2b06c'), led = hex('#7fa8e8')
    const snow = hex('#f08c94'), rock = hex('#a4b2c8'), sky = hex('#a9c4e8')
    const flagCols = ['#4f90e4', '#d8d0c2', '#e85c5c', '#3fae7e', '#ecb82e'].map(hex)
    const set = (i: number, x: number, y: number, z: number, a: number, c: [number, number, number]) => {
      kath[i * 4] = x; kath[i * 4 + 1] = y; kath[i * 4 + 2] = z; kath[i * 4 + 3] = a
      kathC[i * 3] = c[0]; kathC[i * 3 + 1] = c[1]; kathC[i * 3 + 2] = c[2]
    }
    type Fill = (i: number, j: number, count: number) => void
    const plan: { frac: number; fill: Fill }[] = []
    // a surface of revolution: ring at a radius, with optional vertical extent
    const ring = (i: number, salt: number, r: number, y: number, h = 0, squareness = 0) => {
      const a = rand(i, salt) * Math.PI * 2
      let x = Math.cos(a), z = Math.sin(a)
      if (squareness > 0) { // blend the circle toward a square plan for the terraces
        const m = Math.max(Math.abs(x), Math.abs(z))
        x = x + (x / m - x) * squareness
        z = z + (z / m - z) * squareness
      }
      return [x * r, y + rand(i, salt + 1) * h, z * r] as const
    }
    // terraces: three stepped tiers, square-ish in plan
    const tiers = [[15, 1.3], [12.6, 1.3], [10.2, 1.3]] as const
    plan.push({ frac: 0.07, fill: (i, j) => {
      const t = tiers[j % 3]
      const base = GROUND + (j % 3) * 1.3
      const top = rand(i, 80) < 0.45
      if (top) { // the flat top edge of each terrace, a crisp line
        const [x, , z] = ring(i, 81, t[0] * (0.55 + 0.45 * Math.pow(rand(i, 83), 0.5)), 0, 0, 0.35)
        set(i, x, base + t[1], z, 0.55, stoneDim)
      } else {
        const [x, y, z] = ring(i, 84, t[0], base, t[1], 0.35)
        set(i, x, y, z, 0.8, stone)
      }
    } })
    // dome
    const DOME_R = 9, DOME_Y = GROUND + 3.9
    plan.push({ frac: 0.17, fill: (i) => {
      const u = rand(i, 85), v = rand(i, 86)
      const ph = Math.acos(1 - u) // upper hemisphere, uniform by area
      const th = v * Math.PI * 2
      const x = Math.sin(ph) * Math.cos(th) * DOME_R, y = Math.cos(ph) * DOME_R, z = Math.sin(ph) * Math.sin(th) * DOME_R
      const front = 0.6 + 0.4 * Math.max(0, z / DOME_R)
      set(i, x, DOME_Y + y, z, 0.7 * front + 0.2, mixc(stoneDim, stone, front))
    } })
    // harmika: the cube with the eyes
    const H_HALF = 2.6, H_Y0 = DOME_Y + DOME_R - 0.4, H_H = 4.2
    plan.push({ frac: 0.045, fill: (i) => {
      const face = Math.floor(rand(i, 87) * 4)
      const u = rand(i, 88) * 2 - 1, v = rand(i, 89)
      const edge = Math.abs(u) > 0.9 || v < 0.06 || v > 0.94
      const y = H_Y0 + v * H_H
      let x = 0, z = 0
      if (face === 0) { x = u * H_HALF; z = H_HALF } else if (face === 1) { x = H_HALF; z = -u * H_HALF } else if (face === 2) { x = -u * H_HALF; z = -H_HALF } else { x = -H_HALF; z = u * H_HALF }
      set(i, x, y, z, edge ? 0.9 : 0.35, edge ? gold : stoneDim)
    } })
    // the eyes on the front face, and the nose
    plan.push({ frac: 0.02, fill: (i, j, count) => {
      const t = j / count
      const z = H_HALF + 0.05
      if (t < 0.4) { // left eye, an upper lid arc with a heavy inner curl
        const s = (t / 0.4) * Math.PI
        set(i, -1.3 + Math.cos(s) * 0.95, H_Y0 + 2.6 + Math.sin(s) * 0.55, z, 1, gold)
      } else if (t < 0.8) {
        const s = ((t - 0.4) / 0.4) * Math.PI
        set(i, 1.3 + Math.cos(s) * 0.95, H_Y0 + 2.6 + Math.sin(s) * 0.55, z, 1, gold)
      } else if (t < 0.9) { // pupils
        const s = rand(i, 90) * Math.PI * 2, r = Math.sqrt(rand(i, 91)) * 0.28
        set(i, (t < 0.85 ? -1.3 : 1.3) + Math.cos(s) * r, H_Y0 + 2.55 + Math.sin(s) * r, z, 1, gold)
      } else { // the nose: a curl like a question mark
        const s = (t - 0.9) / 0.1
        const x = 0.35 * Math.sin(s * 3.6), y = H_Y0 + 1.9 - s * 1.2
        set(i, x, y, z, 1, gold)
      }
    } })
    // spire: thirteen stepped tiers, each a crisp ring
    const S_Y0 = H_Y0 + H_H, S_H = 10.2
    plan.push({ frac: 0.09, fill: (i, j) => {
      const tier = j % 13
      const y0 = S_Y0 + (tier / 13) * S_H
      const r = 2.6 - (tier / 13) * 2.0
      const rim = rand(i, 92) < 0.5
      const [x, y, z] = ring(i, 93, r, y0, rim ? 0 : S_H / 13)
      set(i, x, rim ? y0 + S_H / 13 : y, z, rim ? 0.95 : 0.4, rim ? gold : stoneDim)
    } })
    // parasol and pinnacle
    const P_Y = S_Y0 + S_H
    plan.push({ frac: 0.018, fill: (i) => {
      const k = rand(i, 94)
      if (k < 0.55) { const [x, , z] = ring(i, 95, 1.9 * Math.sqrt(rand(i, 96)), 0); set(i, x, P_Y + 0.4, z, 0.7, gold) }
      else if (k < 0.8) { const [x, , z] = ring(i, 97, 1.9, 0); set(i, x, P_Y + 0.4, z, 1, gold) }
      else { const s = rand(i, 98); const [x, , z] = ring(i, 99, 0.5 * (1 - s), 0); set(i, x, P_Y + 0.6 + s * 2.6, z, 1, gold) }
    } })
    // prayer flags: four catenaries from the spire to the outer corners
    plan.push({ frac: 0.025, fill: (i, j, count) => {
      const line = j % 4, t = Math.floor(j / 4) / Math.max(1, Math.floor(count / 4))
      const a = Math.PI / 4 + (line * Math.PI) / 2
      const ex = Math.cos(a) * 16.5, ez = Math.sin(a) * 16.5
      const x = ex * t, z = ez * t
      const y = P_Y - 0.5 + (GROUND + 1.3 - (P_Y - 0.5)) * t - Math.sin(t * Math.PI) * 3.4
      const flagI = Math.floor(t * 22)
      set(i, x, y - rand(i, 100) * 0.5, z, 0.85, flagCols[flagI % 5])
    } })
    // the city: lights across the valley floor, with a hint of height
    plan.push({ frac: 0.26, fill: (i) => {
      const a = rand(i, 101) * Math.PI * 2
      const r = 18 + Math.pow(rand(i, 102), 0.55) * 58
      const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.55 - 6
      const h = Math.pow(rand(i, 103), 3) * 2.2
      const k = rand(i, 104)
      const c = k < 0.62 ? light : k < 0.9 ? lightPale : led
      const a0 = 0.45 + 0.5 * rand(i, 105)
      set(i, x, GROUND + 0.1 + h, z, a0 * (1 - Math.min(1, (r - 18) / 80) * 0.5), c)
    } })
    // mountains: a far ridge with dawn on its snow, and a nearer one in shade
    const ridge = (x: number, s: number) => 10 + 7 * Math.sin(x * 0.075 + s) + 4.5 * Math.sin(x * 0.19 + s * 2.1) + 2 * Math.sin(x * 0.46 + s * 3.7) + 1.2 * Math.sin(x * 1.1 + s)
    plan.push({ frac: 0.13, fill: (i) => {
      const far = rand(i, 106) < 0.62
      const x = (rand(i, 107) * 2 - 1) * 95
      const z = far ? -62 - rand(i, 108) * 6 : -42 - rand(i, 108) * 5
      const top = far ? ridge(x, 1.3) * 1.25 + 6 : ridge(x, 4.1) * 0.6 - 2
      const u = rand(i, 109)
      const nearTop = u < 0.55
      const y = GROUND + (nearTop ? top - Math.pow(rand(i, 110), 2) * (far ? 5 : 3) : top * Math.pow(rand(i, 110), 0.6))
      const c = far ? (nearTop ? snow : rock) : rock
      set(i, x, y, z, far ? (nearTop ? 1.0 : 0.42) : 0.3, c)
    } })
    // sky
    plan.push({ frac: 1, fill: (i) => {
      const x = (rand(i, 111) * 2 - 1) * 110, y = GROUND + 20 + rand(i, 112) * 50, z = -70 - rand(i, 113) * 20
      set(i, x, y, z, 0.3 + 0.5 * Math.pow(rand(i, 114), 3), sky)
    } })
    let i = 0
    for (const slot of plan) {
      const count = slot.frac >= 1 ? N - i : Math.round(N * slot.frac)
      for (let j = 0; j < count && i < N; j++, i++) slot.fill(i, j, count)
    }
  }

  return { N, galaxy, seed, size, kind, brightIdx, solar, solarO, solarC, earth, earthC, kath, kathC }
}
