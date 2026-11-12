/**
 * A tile of oil paint, made once at startup and shared by the WebGL sky and the CSS.
 *
 * Strokes go down big to small, each over the last, the way a sky is blocked in and
 * then worked into. For every pixel the tile keeps:
 *   R G  the offset to the middle of the stroke on top, so the sky shader can give a
 *        whole stroke the one colour the brush was loaded with
 *   B    light and shadow off the ridges of paint (0.5 is flat)
 *   A    a small shift in tone per stroke, so neighbours are never quite the same mix
 * The tile wraps, so it repeats without a seam. It takes a moment to make, so the page
 * builds it in a worker (impasto.worker.ts) and the sky lets the paint in once it is ready.
 */
export const TILE = 512
/** the largest stroke-centre offset R and G can hold, in tile pixels */
export const REACH = 72

const hash = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}
const TAU = Math.PI * 2

/* broad strokes block in, a few smaller ones work over them; kept sparse so it reads as paint, not noise */
const PASSES = [
  { n: 300, len: [96, 160], wid: [18, 28], th: 1.0 },
  { n: 480, len: [48, 96], wid: [10, 17], th: 0.8 },
  { n: 300, len: [24, 46], wid: [6, 10], th: 0.6 },
]

let cached: Uint8Array | null = null

export function impasto(): Uint8Array {
  if (cached) return cached
  const S = TILE
  const height = new Float32Array(S * S)
  const offX = new Float32Array(S * S), offY = new Float32Array(S * S)
  const tone = new Float32Array(S * S)

  let k = 0
  for (const pass of PASSES) {
    for (let s = 0; s < pass.n; s++, k++) {
      const cx = hash(k, 1) * S, cy = hash(k, 2) * S
      const L = pass.len[0] + hash(k, 3) * (pass.len[1] - pass.len[0])
      const W = pass.wid[0] + hash(k, 4) * (pass.wid[1] - pass.wid[0])
      // mostly level, swaying in bands that wrap with the tile
      const a = 0.24 * Math.sin((cy / S) * TAU * 2 + 1.3) + 0.12 * Math.sin((cx / S) * TAU + 0.4) + (hash(k, 5) - 0.5) * 0.45
      const ca = Math.cos(a), sa = Math.sin(a)
      const bow = (hash(k, 6) - 0.5) * 0.006
      const bristles = 3 + Math.floor(hash(k, 7) * 5)
      const ph = hash(k, 8) * TAU
      const t = hash(k, 9) - 0.5
      const rx = Math.abs(ca) * L * 0.5 + Math.abs(sa) * W * 0.5 + 3
      const ry = Math.abs(sa) * L * 0.5 + Math.abs(ca) * W * 0.5 + 3
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        const yi = ((y % S) + S) % S
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = x - cx, dy = y - cy
          const u = dx * ca + dy * sa
          const un = u / (L * 0.5)
          if (un <= -1 || un >= 1) continue
          const vn = (-dx * sa + dy * ca - bow * u * u) / (W * 0.5)
          const env = Math.sqrt(Math.sqrt(1 - un * un))
          if (Math.abs(vn) >= env) continue
          const across = vn / env
          // bristle grooves run the length of the stroke, wavering a little
          const br = 0.5 + 0.5 * Math.sin(across * bristles * Math.PI + ph + 1.4 * Math.sin(un * 2.6 + ph))
          // the brush runs dry toward the tail and breaks up between bristles
          if (un > 0.35 && br < (un - 0.35) * 1.5) continue
          const body = Math.sqrt(1 - across * across) * (0.72 + 0.28 * br) * (1 - 0.4 * Math.max(0, un))
          const i = yi * S + (((x % S) + S) % S)
          height[i] = height[i] * 0.35 + pass.th * body
          offX[i] = cx - x; offY[i] = cy - y
          tone[i] = t
        }
      }
    }
  }

  // light from the upper left, raking across the ridges
  const out = new Uint8Array(S * S * 4)
  for (let y = 0; y < S; y++) {
    const yu = ((y + 1) % S) * S, yd = ((y - 1 + S) % S) * S
    for (let x = 0; x < S; x++) {
      const i = y * S + x
      const gx = height[y * S + ((x + 1) % S)] - height[y * S + ((x - 1 + S) % S)]
      const gy = height[yu + x] - height[yd + x]
      // row index runs up the screen in the shader, so "upper left" is (-x, +y)
      const shade = 0.5 + 0.45 * (gx * 0.6 - gy * 0.8)
      const o = i * 4
      out[o] = Math.round(128 + Math.max(-1, Math.min(1, offX[i] / REACH)) * 127)
      out[o + 1] = Math.round(128 + Math.max(-1, Math.min(1, offY[i] / REACH)) * 127)
      out[o + 2] = Math.round(Math.max(0, Math.min(1, shade)) * 255)
      out[o + 3] = Math.round(128 + tone[i] * 200)
    }
  }
  cached = out
  return out
}
