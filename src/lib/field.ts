/**
 * The particle field behind the page.
 *
 * One set of particles, five formations. `progress.f` (0..4) says which formation
 * the field should be in; fractional values blend two neighbours. Each frame every
 * particle eases toward its target, which is what makes a scroll-driven morph feel
 * continuous instead of keyframed.
 *
 *   0 galaxy · 1 waveform · 2 lattice · 3 globe · 4 dust
 */

export const progress = { f: 0 }

const smooth = (x: number) => x * x * (3 - 2 * x)

/** deterministic hash → [0,1) so a resize keeps every particle's personality */
function rand(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

function makeSprite(color: string, size: number, dpr: number) {
  const c = document.createElement('canvas')
  const s = Math.ceil(size * 2 * dpr)
  c.width = c.height = s
  const g = c.getContext('2d')!
  const rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  rg.addColorStop(0, `${color}1)`)
  rg.addColorStop(0.35, `${color}0.55)`)
  rg.addColorStop(1, `${color}0)`)
  g.fillStyle = rg
  g.fillRect(0, 0, s, s)
  return c
}

export function createField(canvas: HTMLCanvasElement, opts: { reduceMotion: boolean }) {
  const ctx = canvas.getContext('2d', { alpha: true })!
  const reduce = opts.reduceMotion

  let W = 0, H = 0, DPR = 1, N = 0, S = 0
  let px = new Float32Array(0), py = new Float32Array(0)
  let gr = px, ga = px, wu = px, wv = px, lx = px, ly = px, sx = px, sy = px, sz = px, dx = px, dy = px, sz0 = px
  let kind = new Uint8Array(0)
  let cool: HTMLCanvasElement, warm: HTMLCanvasElement

  // scratch outputs of target()
  let tx = 0, ty = 0, tz = 1

  function target(i: number, k: number, t: number) {
    // wide screens: galaxy, globe and dust sit right of centre so the headline has clear space;
    // the wave and lattice span the width, so they stay centred. phones: lift the field above the text.
    const wide = W > 900
    const cx = W / 2 + (wide && k !== 1 && k !== 2 ? W * 0.12 : 0)
    const cy = wide ? (k === 1 ? H * 0.42 : H / 2) : H * 0.36
    switch (k) {
      case 0: {
        const a = ga[i] + t * 0.05, r = gr[i] * S
        tx = cx + Math.cos(a) * r * 1.3; ty = cy + Math.sin(a) * r * 0.78; tz = 0.85 + (1 - gr[i]) * 0.3
        return
      }
      case 1: {
        const u = wu[i]
        const env = 0.12 + 0.88 * Math.abs(Math.sin(u * 3.1 + t * 0.9) * Math.cos(u * 5.7 - t * 0.6))
        tx = cx + u * W * 0.44; ty = cy + wv[i] * env * S * 0.5; tz = 0.6 + env * 0.5
        return
      }
      case 2: {
        const rip = Math.sin(lx[i] * 0.012 + t * 1.2) * Math.cos(ly[i] * 0.016 - t * 0.8)
        tx = cx + lx[i]; ty = cy + ly[i] + rip * 16; tz = 0.45 + (rip + 1) * 0.35
        return
      }
      case 3: {
        const ang = t * 0.18, ca = Math.cos(ang), sa = Math.sin(ang)
        const x = sx[i] * ca + sz[i] * sa, z = -sx[i] * sa + sz[i] * ca, y = sy[i]
        const tilt = 0.35, ct = Math.cos(tilt), st = Math.sin(tilt)
        const y2 = y * ct - z * st, z2 = y * st + z * ct
        const R = S * 0.95
        tx = cx + x * R; ty = cy + y2 * R; tz = 0.25 + (z2 + 1) * 0.45
        return
      }
      default: {
        tx = cx + dx[i] + Math.sin(t * 0.2 + i) * 6
        ty = cy + dy[i] + Math.cos(t * 0.17 + i * 0.7) * 6
        tz = 0.5 + rand(i, 9) * 0.5
      }
    }
  }

  function build() {
    DPR = Math.min(window.devicePixelRatio || 1, 2)
    W = window.innerWidth; H = window.innerHeight
    canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR)
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    S = Math.min(W, H) * 0.42
    N = W < 700 ? 900 : 1900

    px = new Float32Array(N); py = new Float32Array(N)
    gr = new Float32Array(N); ga = new Float32Array(N)
    wu = new Float32Array(N); wv = new Float32Array(N)
    lx = new Float32Array(N); ly = new Float32Array(N)
    sx = new Float32Array(N); sy = new Float32Array(N); sz = new Float32Array(N)
    dx = new Float32Array(N); dy = new Float32Array(N)
    kind = new Uint8Array(N); sz0 = new Float32Array(N)

    const cols = Math.ceil(Math.sqrt(N * (W / H) * 0.9))
    const rows = Math.ceil(N / cols)
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      const r = Math.pow(rand(i, 1), 0.55)
      gr[i] = r
      ga[i] = r * 6.0 + (i % 3) * ((Math.PI * 2) / 3) + (rand(i, 2) - 0.5) * 0.9 * (1 - r * 0.5)
      wu[i] = rand(i, 3) * 2 - 1
      wv[i] = rand(i, 4) * 2 - 1
      const c = i % cols, rr = Math.floor(i / cols)
      lx[i] = (c / (cols - 1) - 0.5) * W * 0.66
      ly[i] = (rr / (rows - 1) - 0.5) * Math.min(H * 0.6, W * 0.5)
      const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = golden * i
      sx[i] = Math.cos(th) * rad; sy[i] = y; sz[i] = Math.sin(th) * rad
      dx[i] = (rand(i, 5) - 0.5) * W * 1.1; dy[i] = (rand(i, 6) - 0.5) * H * 1.1
      kind[i] = rand(i, 7) < 0.09 ? 1 : 0
      sz0[i] = 0.8 + rand(i, 8) * 1.6
      target(i, Math.min(4, Math.round(progress.f)), 0)
      px[i] = tx; py[i] = ty
    }
    cool = makeSprite('rgba(196,208,255,', 3, DPR)
    warm = makeSprite('rgba(255,176,112,', 3.4, DPR)
  }

  let mx = -9999, my = -9999, mxS = -9999, myS = -9999
  let lastT = performance.now()
  let raf = 0
  let running = true

  function draw(now: number) {
    if (!running) return
    const dt = Math.min(0.05, (now - lastT) / 1000)
    lastT = now
    const t = reduce ? 0 : now / 1000 // reduced motion: formations hold still
    const f = progress.f
    const k = Math.min(4, Math.floor(f)), w = smooth(Math.min(1, f - k))
    const k2 = Math.min(4, k + 1)
    const follow = reduce ? 1 : 1 - Math.exp(-dt * 5.5)
    mxS += (mx - mxS) * (1 - Math.exp(-dt * 8))
    myS += (my - myS) * (1 - Math.exp(-dt * 8))
    const R = 110, R2 = R * R
    const sizeMul = f > 3 ? 1 - (f - 3) * 0.35 : 1

    ctx.clearRect(0, 0, W, H)
    for (let i = 0; i < N; i++) {
      target(i, k, t)
      let ax = tx, ay = ty, az = tz
      if (w > 0 && k2 !== k) {
        target(i, k2, t)
        ax += (tx - ax) * w; ay += (ty - ay) * w; az += (tz - az) * w
      }
      let x = px[i] + (ax - px[i]) * follow
      let y = py[i] + (ay - py[i]) * follow
      if (!reduce) {
        const ddx = x - mxS, ddy = y - myS, d2 = ddx * ddx + ddy * ddy
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2), push = (R - d) / R
          x += (ddx / d) * push * 26; y += (ddy / d) * push * 26
        }
      }
      px[i] = x; py[i] = y
      const s = sz0[i] * az * sizeMul * 2.2
      ctx.globalAlpha = Math.min(1, 0.35 + az * 0.65)
      ctx.drawImage(kind[i] ? warm : cool, x - s, y - s, s * 2, s * 2)
    }
    ctx.globalAlpha = 1
    raf = requestAnimationFrame(draw)
  }

  const onMove = (e: PointerEvent) => { mx = e.clientX; my = e.clientY }
  const onLeave = () => { mx = my = -9999 }
  const onResize = () => build()
  const onVisibility = () => {
    running = !document.hidden
    if (running) { lastT = performance.now(); raf = requestAnimationFrame(draw) }
    else cancelAnimationFrame(raf)
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerleave', onLeave)
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibility)

  build()
  raf = requestAnimationFrame(draw)

  return function destroy() {
    running = false
    cancelAnimationFrame(raf)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}
