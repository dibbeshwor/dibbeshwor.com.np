/**
 * The cosmos behind the page, in WebGL.
 *
 * One buffer of stars, four stops: the galaxy, the solar system, earth, and
 * Kathmandu. `progress.f` says where we are; fractions dive from one stop into
 * the next, through a pivot (the arm we fly into, the third planet, Nepal).
 * Around the stars: washes of pastel painted with noise that turn into a dawn
 * sky by the end, a distant starfield, constellation lines over the galaxy, and
 * the occasional meteor. Everything is procedural; nothing is loaded.
 *
 * The page is light, so the scene is drawn like pigment on paper: ordinary
 * alpha blending, colour that deepens where the stars crowd, no glow. The
 * washes behind the stars are laid on as oil paint once the paint tile is
 * ready; the stars stay crisp on top.
 */
import {
  BufferAttribute, BufferGeometry, Color, DataTexture, LineBasicMaterial, LineSegments, LinearFilter,
  LinearSRGBColorSpace, Matrix3, Mesh, NormalBlending, PerspectiveCamera, PlaneGeometry,
  Points, RepeatWrapping, RGBAFormat, Scene, ShaderMaterial, Sphere, Vector2, Vector3, WebGLRenderTarget, WebGLRenderer,
} from 'three'
import * as S from './shaders'
import { impasto, REACH, TILE } from '../impasto'
import { buildFormations, EARTH_ORBIT, GALAXY_R, KATHMANDU, rand } from './formations'
import { progress } from '../journey'

export { progress }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (x: number) => x * x * (3 - 2 * x)
const damp = (dt: number, k: number) => 1 - Math.exp(-dt * k)

/** device pixels the canvas may fill: full 2x up to about 1280×880, ~1.85x at 1440×900, ~1.4x at 1920×1200 */
const PIXEL_BUDGET = 4.5e6

const PAPER = '#fbf7f1'
const INK = '#2b3d63'

/** The point shaders write straight to the canvas, so their colours stay as written. */
const pigment = (hex: string) => new Color().setStyle(hex, LinearSRGBColorSpace)

/* palette per stop: particle cool/warm, wash A/B/C, wash strength, horizon */
const PALETTES = [
  { cool: '#5d86d6', warm: '#f08a6c', a: '#c3dcf6', b: '#ffcdb0', c: '#bfe8d6', dim: 1.0, horizon: 0 },
  { cool: '#6a8fd4', warm: '#f2a068', a: '#c4dcf8', b: '#ffe3a0', c: '#f7cfd9', dim: 0.8, horizon: 0 },
  { cool: '#6f9ee6', warm: '#f28d72', a: '#c9e0f6', b: '#c8ead8', c: '#fbe6b0', dim: 0.6, horizon: 0 },
  { cool: '#7a9cd8', warm: '#f2946a', a: '#c8dcf3', b: '#ffc9ab', c: '#ffe7a3', dim: 0.95, horizon: 1 },
].map((p) => ({ ...p, cool: pigment(p.cool), warm: pigment(p.warm), a: new Color(p.a), b: new Color(p.b), c: new Color(p.c) }))

const TILT = new Matrix3().set(
  1, 0, 0,
  0, Math.cos(-1.05), -Math.sin(-1.05),
  0, Math.sin(-1.05), Math.cos(-1.05),
)
{
  const z = 0.28
  const roll = new Matrix3().set(Math.cos(z), -Math.sin(z), 0, Math.sin(z), Math.cos(z), 0, 0, 0, 1)
  TILT.premultiply(roll)
}

/**
 * `og` sets the scene up for the social image: paint laid on thicker, fuller washes, and
 * none of the fine lines or meteors that read as noise at thumbnail size.
 */
export function createCosmos(canvas: HTMLCanvasElement, opts: { reduceMotion: boolean; og?: boolean }) {
  const reduce = opts.reduceMotion
  const og = !!opts.og
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })
  renderer.setClearColor(new Color(PAPER), 1)
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 1200)
  camera.position.set(0, 0, 70)

  let W = 0, H = 0, DPR = 1, wide = true, narrow = false
  const mobile = window.matchMedia('(max-width: 700px)').matches || /Mobi|Android/i.test(navigator.userAgent)
  const N = mobile ? 6000 : 14000
  performance.mark('cosmos:build:start')
  /**
   * Quality steps down, never up. Once the stars have arrived we watch frame
   * times; a slow median drops pixel ratio and draws fewer stars. Formations
   * are laid out so the last indices are the least important (haze, sky, sea).
   */
  let dprCap = mobile ? 1.75 : 2
  let tier = 0
  const samples: number[] = []
  let settled = reduce
  const F = buildFormations(N)
  performance.mark('cosmos:build:end')
  performance.measure('cosmos:build', 'cosmos:build:start', 'cosmos:build:end')

  /* ------------------------------------------------------------------ particles */
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(F.galaxy, 3))
  geo.setAttribute('aGalaxy', new BufferAttribute(F.galaxy, 3))
  geo.setAttribute('aSeed', new BufferAttribute(F.seed, 3))
  geo.setAttribute('aSize', new BufferAttribute(F.size, 1))
  geo.setAttribute('aKind', new BufferAttribute(F.kind, 1))
  geo.setAttribute('aSolar', new BufferAttribute(F.solar, 4))
  geo.setAttribute('aSolarO', new BufferAttribute(F.solarO, 3))
  geo.setAttribute('aSolarC', new BufferAttribute(F.solarC, 3))
  geo.setAttribute('aEarth', new BufferAttribute(F.earth, 4))
  geo.setAttribute('aEarthC', new BufferAttribute(F.earthC, 3))
  geo.setAttribute('aKath', new BufferAttribute(F.kath, 4))
  geo.setAttribute('aKathC', new BufferAttribute(F.kathC, 3))
  geo.boundingSphere = new Sphere(new Vector3(), 400)

  const pU = {
    uF: { value: 0 }, uZ: { value: 0 }, uTime: { value: 0 }, uWarp: { value: reduce ? 0 : 1 },
    uPixelRatio: { value: 1 }, uScale: { value: 1 }, uAspect: { value: 1 },
    uMouse: { value: new Vector2(-9, -9) }, uMouseR: { value: reduce ? 0 : 0.2 },
    uOffG: { value: new Vector3() }, uOffS: { value: new Vector3() }, uOffE: { value: new Vector3() }, uOffK: { value: new Vector3() },
    uPivot0: { value: new Vector3() }, uPivot1: { value: new Vector3() }, uPivot2: { value: new Vector3() },
    uTilt: { value: TILT }, uYaw: { value: 0 }, uSolarScale: { value: 0.62 }, uEScale: { value: 1 }, uKScale: { value: 1 },
    uCool: { value: new Color(PALETTES[0].cool) }, uWarm: { value: new Color(PALETTES[0].warm) }, uInk: { value: pigment(INK) },
  }
  const particles = new Points(geo, new ShaderMaterial({
    vertexShader: S.particlesVert, fragmentShader: S.particlesFrag, uniforms: pU,
    transparent: true, depthWrite: false, depthTest: false, blending: NormalBlending,
  }))
  particles.frustumCulled = false
  particles.renderOrder = 2
  scene.add(particles)

  /* ------------------------------------------------------------------ far stars */
  const SN = mobile ? 1200 : 2600
  const sGeo = new BufferGeometry()
  {
    const pos = new Float32Array(SN * 3), sz = new Float32Array(SN), sd = new Float32Array(SN)
    for (let i = 0; i < SN; i++) {
      const r = 260 + rand(i, 40) * 300, th = rand(i, 41) * Math.PI * 2, ph = Math.acos(rand(i, 42) * 2 - 1)
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.8; pos[i * 3 + 2] = r * Math.cos(ph) - 100
      sz[i] = 0.8 + Math.pow(rand(i, 43), 3) * 2.6
      sd[i] = rand(i, 44)
    }
    sGeo.setAttribute('position', new BufferAttribute(pos, 3))
    sGeo.setAttribute('aSize', new BufferAttribute(sz, 1))
    sGeo.setAttribute('aSeed', new BufferAttribute(sd, 1))
  }
  const sU = {
    uTime: { value: 0 }, uPixelRatio: { value: 1 }, uScale: { value: 1 }, uDim: { value: 1 },
    uCool: { value: pigment('#93b0e4') }, uWarm: { value: pigment('#f2a48c') },
  }
  const stars = new Points(sGeo, new ShaderMaterial({
    vertexShader: S.starsVert, fragmentShader: S.starsFrag, uniforms: sU,
    transparent: true, depthWrite: false, blending: NormalBlending,
  }))
  stars.frustumCulled = false
  stars.renderOrder = 1
  scene.add(stars)

  /* ------------------------------------------------------------------ nebula (a third of the resolution) */
  const nU = {
    uTime: { value: 0 }, uAspect: { value: 1 }, uShift: { value: new Vector2() }, uDim: { value: 1 }, uHorizon: { value: 0 },
    uPaper: { value: new Color(PAPER) },
    uColA: { value: new Color(PALETTES[0].a) }, uColB: { value: new Color(PALETTES[0].b) }, uColC: { value: new Color(PALETTES[0].c) },
  }
  const nebula = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
    vertexShader: S.nebulaVert, fragmentShader: S.nebulaFrag, uniforms: nU,
    depthTest: false, depthWrite: false, blending: NormalBlending,
  }))
  nebula.frustumCulled = false
  const nebScene = new Scene()
  nebScene.add(nebula)
  const nebTarget = new WebGLRenderTarget(4, 4, { minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false, stencilBuffer: false })

  /* ------------------------------------------------------------------ paint: the washes, brought up to full size as oil paint */
  // flat until the tile arrives from the worker
  const relief = new DataTexture(new Uint8Array(TILE * TILE * 4).fill(128), TILE, TILE, RGBAFormat)
  relief.wrapS = relief.wrapT = RepeatWrapping
  relief.magFilter = relief.minFilter = LinearFilter
  relief.needsUpdate = true
  const bU = {
    uWash: { value: nebTarget.texture }, uRelief: { value: relief },
    uRes: { value: new Vector2(1, 1) }, uTile: { value: TILE }, uReach: { value: REACH }, uDrift: { value: new Vector2() }, uPaint: { value: 0 },
    uPx: { value: 1 }, uGrain: { value: 0 }, uImpasto: { value: og ? 2.2 : 1 },
  }
  const blit = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
    vertexShader: S.paintVert, fragmentShader: S.paintFrag, uniforms: bU, depthTest: false, depthWrite: false,
  }))
  blit.frustumCulled = false
  blit.renderOrder = -1
  scene.add(blit)
  let paintReady = false, destroyed = false
  let worker: Worker | null = null
  const takeTile = (data: Uint8Array) => {
    if (destroyed) return
    ;(relief.image.data as Uint8Array).set(data)
    relief.needsUpdate = true
    paintReady = true
  }
  try {
    worker = new Worker(new URL('../impasto.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<Uint8Array>) => { takeTile(e.data); worker?.terminate(); worker = null }
    worker.onerror = () => { worker?.terminate(); worker = null; setTimeout(() => takeTile(impasto()), 0) }
  } catch {
    setTimeout(() => takeTile(impasto()), 0)
  }

  /* ------------------------------------------------------------------ constellation */
  const edges: [number, number][] = []
  {
    const picks = F.brightIdx.filter((_, j) => j % 3 === 0).slice(0, 48)
    const used = new Set<string>()
    for (const a of picks) {
      let best = -1, bd = 100
      for (const b of picks) {
        if (a === b) continue
        const dx = F.galaxy[a * 3] - F.galaxy[b * 3], dy = F.galaxy[a * 3 + 1] - F.galaxy[b * 3 + 1], dz = F.galaxy[a * 3 + 2] - F.galaxy[b * 3 + 2]
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 < bd && d2 > 4) { bd = d2; best = b }
      }
      if (best >= 0) {
        const key = a < best ? `${a}-${best}` : `${best}-${a}`
        if (!used.has(key)) { used.add(key); edges.push([a, best]) }
      }
    }
  }
  const cGeo = new BufferGeometry()
  const cPos = new Float32Array(edges.length * 6)
  cGeo.setAttribute('position', new BufferAttribute(cPos, 3))
  const cMat = new LineBasicMaterial({ color: new Color('#5a80c4'), transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: NormalBlending })
  const constellation = new LineSegments(cGeo, cMat)
  constellation.frustumCulled = false
  constellation.renderOrder = 2
  scene.add(constellation)
  const tmp = new Vector3()
  function galaxyPoint(i: number, t: number, z: number, out: Vector3) {
    const x = F.galaxy[i * 3], y = F.galaxy[i * 3 + 1], zz = F.galaxy[i * 3 + 2]
    const r = Math.hypot(x, zz)
    const ang = t * (0.025 + 0.05 * (1 - r / GALAXY_R))
    const c = Math.cos(ang), s = Math.sin(ang)
    out.set(c * x - s * zz, y + Math.sin(t * 0.4 + F.seed[i * 3] * 6.2832) * 0.3, s * x + c * zz)
    out.applyMatrix3(TILT).add(pU.uOffG.value)
    out.sub(pU.uPivot0.value).multiplyScalar(1 + z * 1.1).add(pU.uPivot0.value)
  }

  /* ------------------------------------------------------------------ meteors */
  interface Meteor { mesh: Mesh; mat: ShaderMaterial; life: number; speed: number; dir: Vector3; active: boolean }
  const meteors: Meteor[] = []
  const meteorGeo = new PlaneGeometry(1, 1)
  for (let i = 0; i < 3; i++) {
    const mat = new ShaderMaterial({
      vertexShader: S.meteorVert, fragmentShader: S.meteorFrag,
      uniforms: { uLife: { value: 0 }, uColor: { value: pigment(i === 1 ? '#ef7f5c' : '#5d86d6') } },
      transparent: true, depthWrite: false, blending: NormalBlending,
    })
    const mesh = new Mesh(meteorGeo, mat)
    mesh.visible = false
    mesh.renderOrder = 5
    scene.add(mesh)
    meteors.push({ mesh, mat, life: 0, speed: 0, dir: new Vector3(), active: false })
  }
  let nextMeteor = 2.5

  /* ------------------------------------------------------------------ layout */
  function stepDown() {
    tier++
    if (tier === 1) { dprCap = Math.min(dprCap, 1.25); geo.setDrawRange(0, Math.floor(N * 0.75)) }
    else { dprCap = 1; geo.setDrawRange(0, Math.floor(N * 0.55)); settled = true }
    layout(true)
  }

  /**
   * Sizes everything to the canvas. The canvas is as tall as the large viewport (CSS 100lvh),
   * so a phone's address bar sliding in and out doesn't resize it: a resize clears the
   * drawing buffer, which Safari shows as a blank frame. Returns false when nothing changed.
   */
  function layout(force = false) {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight
    // a pixel budget: a big retina window renders a touch under its full density
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap, Math.max(1, Math.sqrt(PIXEL_BUDGET / (w * h))))
    if (!force && w === W && h === H && dpr === DPR) return false
    DPR = dpr; W = w; H = h
    wide = W > 900; narrow = W < 600
    renderer.setPixelRatio(DPR)
    renderer.setSize(W, H, false)
    bU.uPx.value = DPR
    nebTarget.setSize(Math.max(2, Math.floor((W * DPR) / 3)), Math.max(2, Math.floor((H * DPR) / 3)))
    // strokes keep their size on screen; a little smaller on a phone
    const strokeScale = DPR * Math.max(0.6, Math.min(1, W / 1280))
    bU.uRes.value.set(W * DPR, H * DPR)
    bU.uTile.value = TILE * strokeScale
    bU.uReach.value = REACH * strokeScale
    camera.aspect = W / H
    camera.updateProjectionMatrix()
    const aspect = W / H
    pU.uAspect.value = aspect
    nU.uAspect.value = aspect
    pU.uPixelRatio.value = DPR
    sU.uPixelRatio.value = DPR
    pU.uScale.value = Math.max(0.7, Math.min(1.25, H / 900))
    sU.uScale.value = pU.uScale.value
    if (wide) {
      pU.uOffG.value.set(15, -4, -22)
      pU.uOffS.value.set(16, 1, -6)
      pU.uOffE.value.set(15, 1, -6)
      pU.uOffK.value.set(10, -1, -4)
      pU.uSolarScale.value = 0.62
      pU.uEScale.value = 1
      pU.uKScale.value = 1
    } else {
      const lift = narrow ? 14 : 10
      pU.uOffG.value.set(2, lift - 2, -24)
      pU.uOffS.value.set(0, lift + 1, -14)
      pU.uOffE.value.set(0, lift + 1, -14)
      pU.uOffK.value.set(0, -17, -14)
      pU.uSolarScale.value = 0.5
      pU.uEScale.value = 0.58
      pU.uKScale.value = 0.5
    }
    if (og) {
      // the galaxy is the subject: nearer, and in fatter dabs that hold up as a thumbnail
      pU.uOffG.value.set(11, 1, -2)
      pU.uScale.value = sU.uScale.value = 1.05
    }
    // the arm we dive into
    pU.uPivot0.value.set(7, 0, 4).applyMatrix3(TILT).add(pU.uOffG.value)
    return true
  }

  function draw(washes = true) {
    if (washes) {
      renderer.setRenderTarget(nebTarget)
      renderer.render(nebScene, camera)
      renderer.setRenderTarget(null)
    }
    renderer.render(scene, camera)
  }

  /* ------------------------------------------------------------------ frame */
  const mouse = new Vector2(-9, -9), mouseS = new Vector2(-9, -9)
  const camBase = new Vector3(0, 0, 70), camTarget = new Vector3(), camNow = new Vector3(0, 0, 70)
  const look = new Vector3(), lookNow = new Vector3(4, 0, 0)
  const cur = { cool: new Color(PALETTES[0].cool), warm: new Color(PALETTES[0].warm), a: new Color(PALETTES[0].a), b: new Color(PALETTES[0].b), c: new Color(PALETTES[0].c) }
  let nebDim = 1, horizon = 0
  let warp = reduce ? 0 : 1
  let raf = 0
  let running = true
  let elapsed = 0
  let last = performance.now()
  let frameNo = 0
  // earth's spin: free until the content sections, then eased so Nepal faces the camera
  let yaw = -0.6, freeYaw = -0.6, frozenYaw = 0, frozen = false
  const nepal = new Vector3()
  const earthPlanet = new Vector3()
  const toCam = new Vector3()

  function frame() {
    if (!running) return
    if (frameNo === 0) performance.mark('cosmos:frame0:start')
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    elapsed += dt
    const t = reduce ? 0 : elapsed
    const f = progress.f, z = progress.z, lock = progress.lock
    const level = Math.max(0, Math.min(3, Math.round(f)))
    const heroScroll = clamp01(window.scrollY / Math.max(1, H))

    if (warp > 0) { warp = Math.max(0, warp - dt / 2.2); pU.uWarp.value = smooth(warp) }
    else if (!settled) {
      samples.push(dt)
      if (samples.length >= 90) {
        const sorted = samples.slice().sort((a, b) => a - b)
        const median = sorted[45]
        samples.length = 0
        if (median > 0.024) stepDown()   // under ~40 fps
        else settled = true
      }
    }
    frameNo++

    // palette drifts toward the stop we are nearest
    const pal = PALETTES[level]
    const ck = damp(dt, 2.2)
    cur.cool.lerp(pal.cool, ck); cur.warm.lerp(pal.warm, ck); cur.a.lerp(pal.a, ck); cur.b.lerp(pal.b, ck); cur.c.lerp(pal.c, ck)
    nebDim = lerp(nebDim, pal.dim, ck); horizon = lerp(horizon, pal.horizon, ck)
    pU.uCool.value.copy(cur.cool); pU.uWarm.value.copy(cur.warm)
    nU.uColA.value.copy(cur.a); nU.uColB.value.copy(cur.b); nU.uColC.value.copy(cur.c)
    nU.uShift.value.set(f * 0.35 + heroScroll * 0.2, -f * 0.18)
    // the clouds slide by -shift / 1.5 (see nebulaFrag); the paint slides with them
    bU.uDrift.value.set((nU.uShift.value.x / 1.5) * H * DPR, (nU.uShift.value.y / 1.5) * H * DPR)
    if (paintReady && bU.uPaint.value < 1) bU.uPaint.value = reduce ? 1 : Math.min(1, bU.uPaint.value + dt / 1.2)
    nU.uDim.value = og ? nebDim * 1.6 : nebDim
    nU.uHorizon.value = horizon
    sU.uDim.value = 1 - horizon * 0.6

    pU.uF.value = f
    pU.uZ.value = z
    pU.uTime.value = t
    sU.uTime.value = t
    nU.uTime.value = t

    if (!reduce) {
      mouseS.x += (mouse.x - mouseS.x) * damp(dt, 7)
      mouseS.y += (mouse.y - mouseS.y) * damp(dt, 7)
      pU.uMouse.value.copy(mouseS)
    }

    // camera: a slow arc, a lean toward the pointer; at Kathmandu we look down a little
    const arc = Math.min(f, 3)
    const kath = clamp01(f - 2)
    camBase.set(Math.sin(arc * 0.5) * 7 * (1 - kath), Math.cos(arc * 0.5) * 2 - 1 + kath * 7, 70 - heroScroll * 5)
    const px = reduce || mouse.x < -5 ? 0 : mouseS.x, py = reduce || mouse.y < -5 ? 0 : mouseS.y
    camTarget.set(camBase.x + px * 2.4, camBase.y + py * 1.4, camBase.z)
    camNow.lerp(camTarget, damp(dt, 3))
    camera.position.copy(camNow)
    look.set(wide ? 4 - arc * 0.4 : 0, (wide ? 0 : 4) - kath * (wide ? 4 : 1), 0)
    lookNow.lerp(look, damp(dt, 3))
    camera.lookAt(lookNow)

    // pivots: the third planet, and Nepal on the globe
    {
      const a = EARTH_ORBIT.angle0 + t * EARTH_ORBIT.speed
      earthPlanet.set(Math.cos(a) * EARTH_ORBIT.r, 0, Math.sin(a) * EARTH_ORBIT.r).applyMatrix3(TILT).multiplyScalar(pU.uSolarScale.value * (1 + z * 0.25)).add(pU.uOffS.value)
      pU.uPivot1.value.copy(earthPlanet)
    }
    {
      // where should Nepal end up? facing the camera.
      toCam.copy(camera.position).sub(pU.uOffE.value).normalize()
      const targetYaw = Math.atan2(toCam.x, toCam.z) - (KATHMANDU.lon * Math.PI) / 180
      if (!reduce) freeYaw += dt * 0.06
      if (lock > 0) {
        if (!frozen) { frozen = true; frozenYaw = yaw }
        let d = targetYaw - frozenYaw
        d = Math.atan2(Math.sin(d), Math.cos(d))
        yaw = frozenYaw + d * smooth(lock)
      } else {
        if (frozen) { frozen = false; freeYaw = yaw }
        yaw = reduce ? targetYaw : freeYaw
      }
      pU.uYaw.value = yaw
      const la = (KATHMANDU.lat * Math.PI) / 180, lo = (KATHMANDU.lon * Math.PI) / 180
      nepal.set(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo))
      const cy = Math.cos(yaw), sy = Math.sin(yaw)
      nepal.set(cy * nepal.x - sy * nepal.z, nepal.y, sy * nepal.x + cy * nepal.z)
      const ct = Math.cos(0.3), st = Math.sin(0.3)
      nepal.set(nepal.x, ct * nepal.y - st * nepal.z, st * nepal.y + ct * nepal.z)
      nepal.multiplyScalar(15 * pU.uEScale.value * (1 + z * 0.7)).add(pU.uOffE.value)
      pU.uPivot2.value.copy(nepal)
    }

    // constellation over the galaxy only
    const cOp = og ? 0 : (1 - clamp01(f * 2)) * (1 - warp) * (1 - z * 0.6) * 0.42
    cMat.opacity = cOp
    constellation.visible = cOp > 0.005
    if (constellation.visible) {
      for (let e = 0; e < edges.length; e++) {
        galaxyPoint(edges[e][0], t, z, tmp); cPos[e * 6] = tmp.x; cPos[e * 6 + 1] = tmp.y; cPos[e * 6 + 2] = tmp.z
        galaxyPoint(edges[e][1], t, z, tmp); cPos[e * 6 + 3] = tmp.x; cPos[e * 6 + 4] = tmp.y; cPos[e * 6 + 5] = tmp.z
      }
      ;(cGeo.attributes.position as BufferAttribute).needsUpdate = true
    }

    // meteors
    if (!reduce && !og && warp <= 0) {
      nextMeteor -= dt
      if (nextMeteor <= 0) {
        const m = meteors.find((x) => !x.active)
        if (m) {
          m.active = true; m.life = 0; m.speed = 55 + Math.random() * 40
          const fromLeft = Math.random() < 0.5
          m.mesh.position.set((fromLeft ? -1 : 1) * (20 + Math.random() * 30), 14 + Math.random() * 18, -40 - Math.random() * 30)
          m.dir.set(fromLeft ? 1 : -1, -(0.35 + Math.random() * 0.4), 0).normalize()
          const len = 10 + Math.random() * 10
          m.mesh.scale.set(len, 0.12 + Math.random() * 0.1, 1)
          m.mesh.rotation.z = Math.atan2(m.dir.y, m.dir.x) + Math.PI
          m.mesh.visible = true
        }
        nextMeteor = 4 + Math.random() * 8
      }
      for (const m of meteors) {
        if (!m.active) continue
        m.life += dt / 1.3
        m.mesh.position.addScaledVector(m.dir, m.speed * dt)
        m.mat.uniforms.uLife.value = m.life
        if (m.life >= 1) { m.active = false; m.mesh.visible = false }
      }
    }

    // the grain steps about four times a second, like film
    if (!reduce) bU.uGrain.value = Math.floor(elapsed * 4.3) % 7
    draw(tier < 2 || frameNo % 2 === 0)
    if (frameNo === 1) { performance.mark('cosmos:frame0:end'); performance.measure('cosmos:frame0', 'cosmos:frame0:start', 'cosmos:frame0:end') }
    raf = requestAnimationFrame(frame)
  }

  /* ------------------------------------------------------------------ events */
  const onMove = (e: PointerEvent) => { mouse.set((e.clientX / W) * 2 - 1, -((e.clientY / H) * 2 - 1)) }
  const onLeave = () => { mouse.set(-9, -9) }
  // paint the new size straight away, before the browser can show the cleared buffer.
  // The canvas is watched as well as the window: it catches the stylesheet sizing it after
  // the sky has started, and runs before paint, so the redraw lands in the same frame.
  const onResize = () => { if (layout() && running) draw() }
  const sizer = new ResizeObserver(onResize)
  sizer.observe(canvas)
  const onVisibility = () => {
    running = !document.hidden
    if (running) { last = performance.now(); raf = requestAnimationFrame(frame) }
    else cancelAnimationFrame(raf)
  }
  // a backgrounded tab can lose its GL context; three rebuilds its caches on restore, we rebuild the offscreen target
  const onLost = (e: Event) => { e.preventDefault(); running = false; cancelAnimationFrame(raf) }
  const onRestored = () => {
    nebTarget.dispose()
    layout(true)
    running = !document.hidden
    if (running) { last = performance.now(); raf = requestAnimationFrame(frame) }
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerleave', onLeave)
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibility)
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)

  layout()
  performance.mark('cosmos:init:end')
  performance.measure('cosmos:init', 'cosmos:build:end', 'cosmos:init:end')
  // the first frame now, not on the next tick: a fresh opaque canvas is black until drawn,
  // and Safari will show it that way for a frame
  frame()

  return function destroy() {
    running = false
    destroyed = true
    cancelAnimationFrame(raf)
    sizer.disconnect()
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibility)
    canvas.removeEventListener('webglcontextlost', onLost)
    canvas.removeEventListener('webglcontextrestored', onRestored)
    scene.traverse((o) => {
      const m = o as Mesh
      if (m.geometry) m.geometry.dispose()
      const mat = m.material as ShaderMaterial | undefined
      if (mat && 'dispose' in mat) mat.dispose()
    })
    nebula.geometry.dispose(); nebula.material.dispose()
    nebTarget.dispose()
    relief.dispose()
    worker?.terminate()
    renderer.dispose()
  }
}
