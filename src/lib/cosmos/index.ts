/**
 * The cosmos behind the page, in WebGL.
 *
 * One particle buffer, six formations. `progress.f` (0..5) says which formation
 * the field is in; fractional values morph between neighbours in the vertex shader.
 *
 *   0 galaxy · 1 waveform · 2 lattice · 3 broadcast · 4 globe · 5 dust
 *
 * Around it: a nebula painted with noise, a distant starfield, a gas giant with
 * rings and a moon that drifts through the scroll story, constellation lines over
 * the galaxy, and the occasional meteor. Everything is procedural; no assets load.
 */
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Group,
  LineBasicMaterial, LineSegments, Matrix3, Mesh, NormalBlending, PerspectiveCamera,
  MeshBasicMaterial, PlaneGeometry, Points, RingGeometry, Scene, ShaderMaterial, SphereGeometry, WebGLRenderTarget, LinearFilter,
  Sphere, Vector2, Vector3, WebGLRenderer, BackSide,
} from 'three'
import * as S from './shaders'

export const progress = { f: 0 }

/** deterministic hash → [0,1) so a rebuild keeps every particle's personality */
function rand(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}
/** approx. gaussian in [-1,1] */
const gauss = (i: number, salt: number) => (rand(i, salt) + rand(i, salt + 17) + rand(i, salt + 31)) / 1.5 - 1

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (x: number) => x * x * (3 - 2 * x)
const damp = (dt: number, k: number) => 1 - Math.exp(-dt * k)

const GALAXY_R = 26
const GLOBE_R = 15

/* palette per formation: particle cool/warm, nebula A/B/C */
const PALETTES = [
  { cool: '#c4d0ff', warm: '#ffb070', a: '#4b3cc8', b: '#c25f2a', c: '#176a78' }, // galaxy
  { cool: '#ffe0bf', warm: '#ff9a5c', a: '#8a4bd8', b: '#f08a3c', c: '#a0442a' }, // wave · voice
  { cool: '#bcc6ff', warm: '#8f7cff', a: '#4a3fe0', b: '#6a55ff', c: '#1f5a9a' }, // lattice · systems
  { cool: '#c9fff0', warm: '#5ed49a', a: '#2a7ed0', b: '#3fbf8f', c: '#1a6a7a' }, // broadcast · reach
  { cool: '#ffd3ea', warm: '#ff85be', a: '#9a3fd0', b: '#e85a9a', c: '#5a2a8a' }, // globe · atlas
  { cool: '#c4d0ff', warm: '#ffb070', a: '#4a3ac0', b: '#c86a3a', c: '#1b5a7a' }, // dust · content
]

const TILT = new Matrix3().set(
  1, 0, 0,
  0, Math.cos(-1.05), -Math.sin(-1.05),
  0, Math.sin(-1.05), Math.cos(-1.05),
)
// a touch of roll so the disc isn't perfectly level
{
  const z = 0.28
  const roll = new Matrix3().set(Math.cos(z), -Math.sin(z), 0, Math.sin(z), Math.cos(z), 0, 0, 0, 1)
  TILT.premultiply(roll)
}

export function createCosmos(canvas: HTMLCanvasElement, opts: { reduceMotion: boolean }) {
  const reduce = opts.reduceMotion
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })
  renderer.setClearColor(new Color('#06070b'), 1)
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 1200)
  camera.position.set(0, 0, 70)

  let W = 0, H = 0, DPR = 1, wide = true, narrow = false
  const mobile = window.matchMedia('(max-width: 700px)').matches || /Mobi|Android/i.test(navigator.userAgent)
  const N = mobile ? 5500 : 13000

  /* ------------------------------------------------------------------ particles */
  const geo = new BufferGeometry()
  const galaxy = new Float32Array(N * 3), wave = new Float32Array(N * 3), lattice = new Float32Array(N * 3)
  const reach = new Float32Array(N * 3), globe = new Float32Array(N * 3), dust = new Float32Array(N * 3)
  const seed = new Float32Array(N * 3), size = new Float32Array(N), kind = new Float32Array(N)
  const brightIdx: number[] = []
  {
    // a crystal lattice in depth: nx × ny × nz cells, about two units apart
    const nx = Math.ceil(Math.cbrt(N * 2.2)), ny = Math.ceil(nx / 2), nz = Math.ceil(N / (nx * ny))
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      const i3 = i * 3
      // galaxy: three arms, a bulge, thickness that grows toward the core
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
        // arm width is roughly constant in space, so it is an offset across the arm rather than an angle
        const across = gauss(i, 5) * (1.6 + r * 0.09) * (haze ? 2.2 : 1)
        const along = gauss(i, 25) * 1.2
        gx = Math.cos(ang) * r - Math.sin(ang) * across + Math.cos(ang) * along
        gz = Math.sin(ang) * r + Math.cos(ang) * across + Math.sin(ang) * along
        gy = gauss(i, 6) * (0.4 + (1 - r / GALAXY_R) * 2.0)
      }
      galaxy[i3] = gx; galaxy[i3 + 1] = gy; galaxy[i3 + 2] = gz

      wave[i3] = (rand(i, 7) * 2 - 1) * 30
      wave[i3 + 1] = gauss(i, 8) * 9
      wave[i3 + 2] = (rand(i, 9) * 2 - 1) * 6

      const ix = i % nx, iy = Math.floor(i / nx) % ny, iz = Math.floor(i / (nx * ny))
      lattice[i3] = (ix - (nx - 1) / 2) * 2.4
      lattice[i3 + 1] = (iy - (ny - 1) / 2) * 2.4
      lattice[i3 + 2] = (iz - (nz - 1) / 2) * 2.4

      const ra = rand(i, 11) * Math.PI * 2
      reach[i3] = Math.cos(ra); reach[i3 + 1] = Math.sin(ra); reach[i3 + 2] = (rand(i, 12) - 0.5) * 3

      const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = golden * i
      const shell = rand(i, 13) < 0.9 ? 1 : 1.25 + rand(i, 14) * 0.3
      globe[i3] = Math.cos(th) * rad * GLOBE_R * shell; globe[i3 + 1] = y * GLOBE_R * shell; globe[i3 + 2] = Math.sin(th) * rad * GLOBE_R * shell

      dust[i3] = (rand(i, 15) - 0.5) * 110; dust[i3 + 1] = (rand(i, 16) - 0.5) * 70; dust[i3 + 2] = (rand(i, 17) - 0.5) * 80

      seed[i3] = rand(i, 18); seed[i3 + 1] = rand(i, 19); seed[i3 + 2] = rand(i, 20)
      const kr = rand(i, 21)
      kind[i] = kr < 0.78 ? 0 : kr < 0.94 ? 1 : 2
      size[i] = kind[i] === 2 ? 2.8 + rand(i, 22) * 2.6 : 1.15 + Math.pow(rand(i, 22), 1.7) * 2.6
      if (kind[i] === 2 && !inBulge) brightIdx.push(i)
    }
  }
  geo.setAttribute('position', new BufferAttribute(galaxy, 3))
  geo.setAttribute('aGalaxy', new BufferAttribute(galaxy, 3))
  geo.setAttribute('aWave', new BufferAttribute(wave, 3))
  geo.setAttribute('aLattice', new BufferAttribute(lattice, 3))
  geo.setAttribute('aReach', new BufferAttribute(reach, 3))
  geo.setAttribute('aGlobe', new BufferAttribute(globe, 3))
  geo.setAttribute('aDust', new BufferAttribute(dust, 3))
  geo.setAttribute('aSeed', new BufferAttribute(seed, 3))
  geo.setAttribute('aSize', new BufferAttribute(size, 1))
  geo.setAttribute('aKind', new BufferAttribute(kind, 1))
  geo.boundingSphere = new Sphere(new Vector3(), 400)

  const pU = {
    uF: { value: 0 }, uTime: { value: 0 }, uWarp: { value: reduce ? 0 : 1 },
    uPixelRatio: { value: 1 }, uScale: { value: 1 }, uAspect: { value: 1 },
    uMouse: { value: new Vector2(-9, -9) }, uMouseR: { value: reduce ? 0 : 0.2 },
    uOffG: { value: new Vector3() }, uOffW: { value: new Vector3() }, uOffL: { value: new Vector3() },
    uOffR: { value: new Vector3() }, uOffS: { value: new Vector3() }, uOffD: { value: new Vector3() },
    uSpreadX: { value: 1 }, uSpreadY: { value: 1 }, uTilt: { value: TILT },
    uColA: { value: new Color(PALETTES[0].cool) }, uColB: { value: new Color(PALETTES[0].warm) },
  }
  const particles = new Points(geo, new ShaderMaterial({
    vertexShader: S.particlesVert, fragmentShader: S.particlesFrag, uniforms: pU,
    transparent: true, depthWrite: false, depthTest: true, blending: AdditiveBlending,
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
  const sU = { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uScale: { value: 1 } }
  const stars = new Points(sGeo, new ShaderMaterial({
    vertexShader: S.starsVert, fragmentShader: S.starsFrag, uniforms: sU,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  }))
  stars.frustumCulled = false
  stars.renderOrder = 1
  scene.add(stars)

  /* ------------------------------------------------------------------ nebula */
  const nU = {
    uTime: { value: 0 }, uAspect: { value: 1 }, uShift: { value: new Vector2() }, uDim: { value: 1 },
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
  const blit = new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial({ map: nebTarget.texture, depthTest: false, depthWrite: false }))
  blit.frustumCulled = false
  blit.renderOrder = -1
  ;(blit.material as MeshBasicMaterial).onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', 'gl_Position = vec4(position.xy, 0.99999, 1.0);')
  }
  scene.add(blit)

  /* ------------------------------------------------------------------ planet */
  const light = new Vector3(-0.55, 0.45, 0.7).normalize()
  const planet = new Group()
  const planetSeg = mobile ? 64 : 112
  const surfaceU = {
    uTime: { value: 0 }, uLight: { value: light },
    uC1: { value: new Color('#3a2a74') }, uC2: { value: new Color('#ead0ae') },
    uC3: { value: new Color('#ff9a5c') }, uC4: { value: new Color('#9a86ff') },
  }
  const surface = new Mesh(new SphereGeometry(1, planetSeg, planetSeg), new ShaderMaterial({
    vertexShader: S.planetVert, fragmentShader: S.planetFrag, uniforms: surfaceU,
  }))
  planet.add(surface)
  const atmo = new Mesh(new SphereGeometry(1.16, 64, 64), new ShaderMaterial({
    vertexShader: S.atmoVert, fragmentShader: S.atmoFrag,
    uniforms: { uColor: { value: new Color('#a08cff') }, uLight: { value: light } },
    side: BackSide, transparent: true, depthWrite: false, blending: AdditiveBlending,
  }))
  atmo.renderOrder = 3
  planet.add(atmo)
  const ringU = {
    uLight: { value: light }, uCenter: { value: new Vector3() }, uPlanetR: { value: 1 },
    uColA: { value: new Color('#d9c2a8') }, uColB: { value: new Color('#ffb070') },
    uInner: { value: 1.5 }, uOuter: { value: 2.75 },
  }
  const ring = new Mesh(new RingGeometry(1.5, 2.75, 180, 6), new ShaderMaterial({
    vertexShader: S.ringVert, fragmentShader: S.ringFrag, uniforms: ringU,
    side: DoubleSide, transparent: true, depthWrite: false,
  }))
  const ringTilt = new Group()
  ringTilt.rotation.set(Math.PI / 2 - 0.42, 0, 0.32)
  ringTilt.add(ring)
  ring.renderOrder = 4
  planet.add(ringTilt)
  const moonPivot = new Group()
  moonPivot.rotation.set(0.5, 0, 0.1)
  const moon = new Mesh(new SphereGeometry(0.17, 32, 32), new ShaderMaterial({
    vertexShader: S.planetVert, fragmentShader: S.moonFrag,
    uniforms: { uLight: { value: light }, uColor: { value: new Color('#c9c4d8') } },
  }))
  moon.position.set(3.5, 0, 0)
  moonPivot.add(moon)
  planet.add(moonPivot)
  scene.add(planet)

  /* ------------------------------------------------------------------ constellation */
  const edges: [number, number][] = []
  {
    const picks = brightIdx.filter((_, j) => j % 3 === 0).slice(0, 48)
    const used = new Set<string>()
    for (const a of picks) {
      let best = -1, bd = 10 * 10
      for (const b of picks) {
        if (a === b) continue
        const dx = galaxy[a * 3] - galaxy[b * 3], dy = galaxy[a * 3 + 1] - galaxy[b * 3 + 1], dz = galaxy[a * 3 + 2] - galaxy[b * 3 + 2]
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
  const cMat = new LineBasicMaterial({ color: new Color('#c4d0ff'), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  const constellation = new LineSegments(cGeo, cMat)
  constellation.frustumCulled = false
  constellation.renderOrder = 2
  scene.add(constellation)
  const tmp = new Vector3()
  function galaxyPoint(i: number, t: number, out: Vector3) {
    const x = galaxy[i * 3], y = galaxy[i * 3 + 1], z = galaxy[i * 3 + 2]
    const r = Math.hypot(x, z)
    const ang = t * (0.025 + 0.05 * (1 - r / GALAXY_R))
    const c = Math.cos(ang), s = Math.sin(ang)
    out.set(c * x - s * z, y + Math.sin(t * 0.4 + seed[i * 3] * 6.2832) * 0.3, s * x + c * z)
    out.applyMatrix3(TILT).add(pU.uOffG.value)
  }

  /* ------------------------------------------------------------------ meteors */
  interface Meteor { mesh: Mesh; mat: ShaderMaterial; life: number; speed: number; dir: Vector3; active: boolean }
  const meteors: Meteor[] = []
  const meteorGeo = new PlaneGeometry(1, 1)
  for (let i = 0; i < 3; i++) {
    const mat = new ShaderMaterial({
      vertexShader: S.meteorVert, fragmentShader: S.meteorFrag,
      uniforms: { uLife: { value: 0 }, uColor: { value: new Color(i === 1 ? '#ffb070' : '#dfe6ff') } },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    })
    const mesh = new Mesh(meteorGeo, mat)
    mesh.visible = false
    mesh.renderOrder = 5
    scene.add(mesh)
    meteors.push({ mesh, mat, life: 0, speed: 0, dir: new Vector3(), active: false })
  }
  let nextMeteor = 2.5

  /* ------------------------------------------------------------------ layout */
  function layout() {
    DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.75 : 2)
    W = window.innerWidth; H = window.innerHeight
    wide = W > 900; narrow = W < 600
    renderer.setPixelRatio(DPR)
    renderer.setSize(W, H, false)
    nebTarget.setSize(Math.max(2, Math.floor((W * DPR) / 3)), Math.max(2, Math.floor((H * DPR) / 3)))
    camera.aspect = W / H
    camera.updateProjectionMatrix()
    const aspect = W / H
    pU.uAspect.value = aspect
    nU.uAspect.value = aspect
    pU.uPixelRatio.value = DPR
    sU.uPixelRatio.value = DPR
    pU.uScale.value = Math.max(0.7, Math.min(1.25, H / 900))
    sU.uScale.value = pU.uScale.value
    // the visible half-width at z = 0, so the wide formations can span the viewport
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * 70
    const halfW = halfH * aspect
    pU.uSpreadX.value = Math.min(1.1, halfW / 32)
    pU.uSpreadY.value = Math.min(1, halfH / 20)
    if (wide) {
      pU.uOffG.value.set(15, -4, -22)
      pU.uOffW.value.set(4, 6, -4)
      pU.uOffL.value.set(8, 4, -14)
      pU.uOffR.value.set(12, 5, -10)
      pU.uOffS.value.set(16, 2, -6)
      pU.uOffD.value.set(0, 0, -20)
    } else {
      const lift = narrow ? 14 : 10
      pU.uOffG.value.set(2, lift - 2, -24)
      pU.uOffW.value.set(0, lift + 2, 0)
      pU.uOffL.value.set(0, lift + 2, -16)
      pU.uOffR.value.set(0, lift + 2, -10)
      pU.uOffS.value.set(0, lift + 2, -12)
      pU.uOffD.value.set(0, 0, -20)
    }
  }

  /* planet keyframes across the story. f → position, scale */
  const pk = { pos: new Vector3(), scale: 1 }
  const kA = new Vector3(), kB = new Vector3()
  function planetKeys(f: number, heroScroll: number) {
    const key = (k: number, out: Vector3): number => {
      // returns scale, fills position
      if (wide) {
        switch (k) {
          case 0: out.set(17 + heroScroll * 6, 2.5 + heroScroll * 5, 6); return 6.6
          case 1: out.set(46, 14, -40); return 0.001
          case 2: out.set(46, 14, -40); return 0.001
          case 3: out.set(10, 2, -70); return 0.001
          case 4: out.copy(pU.uOffS.value); return 5.4
          default: out.set(44, 26, -90); return 0.001
        }
      }
      switch (k) {
        case 0: out.set(1 + heroScroll * 2, (narrow ? 16 : 11) + heroScroll * 8, 2); return narrow ? 4.0 : 5.0
        case 1: case 2: out.set(30, 30, -40); return 0.001
        case 3: out.set(0, 10, -70); return 0.001
        case 4: out.copy(pU.uOffS.value); return 4.2
        default: out.set(30, 40, -90); return 0.001
      }
    }
    const k = Math.min(5, Math.floor(f)), w = smooth(clamp01(f - k))
    const sa = key(k, kA), sb = key(Math.min(5, k + 1), kB)
    pk.pos.lerpVectors(kA, kB, w)
    pk.scale = lerp(sa, sb, w)
  }

  /* ------------------------------------------------------------------ frame */
  let last = performance.now()
  const mouse = new Vector2(-9, -9), mouseS = new Vector2(-9, -9)
  const camBase = new Vector3(0, 0, 70), camTarget = new Vector3(), camNow = new Vector3(0, 0, 70)
  const look = new Vector3(), lookNow = new Vector3(4, 0, 0)
  const cur = { cool: new Color(PALETTES[0].cool), warm: new Color(PALETTES[0].warm), a: new Color(PALETTES[0].a), b: new Color(PALETTES[0].b), c: new Color(PALETTES[0].c) }
  const want = { cool: new Color(), warm: new Color(), a: new Color(), b: new Color(), c: new Color() }
  let warp = reduce ? 0 : 1
  let raf = 0
  let running = true
  let elapsed = 0

  function frame() {
    if (!running) return
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    elapsed += dt
    const t = reduce ? 0 : elapsed
    const f = progress.f
    const heroScroll = clamp01(window.scrollY / Math.max(1, H))

    // arrival
    if (warp > 0) { warp = Math.max(0, warp - dt / 2.2); pU.uWarp.value = smooth(warp) }

    // palette drifts toward the chapter's mood
    const pal = PALETTES[Math.max(0, Math.min(5, Math.round(f)))]
    want.cool.set(pal.cool); want.warm.set(pal.warm); want.a.set(pal.a); want.b.set(pal.b); want.c.set(pal.c)
    const ck = damp(dt, 2.2)
    cur.cool.lerp(want.cool, ck); cur.warm.lerp(want.warm, ck); cur.a.lerp(want.a, ck); cur.b.lerp(want.b, ck); cur.c.lerp(want.c, ck)
    pU.uColA.value.copy(cur.cool); pU.uColB.value.copy(cur.warm)
    nU.uColA.value.copy(cur.a); nU.uColB.value.copy(cur.b); nU.uColC.value.copy(cur.c)
    nU.uShift.value.set(f * 0.35 + heroScroll * 0.2, -f * 0.18)
    nU.uDim.value = f > 4.2 ? lerp(1, 0.55, clamp01((f - 4.2) / 0.8)) : 1

    // uniforms
    pU.uF.value = f
    pU.uTime.value = t
    sU.uTime.value = t
    nU.uTime.value = t
    surfaceU.uTime.value = t

    // pointer
    if (!reduce) {
      mouseS.x += (mouse.x - mouseS.x) * damp(dt, 7)
      mouseS.y += (mouse.y - mouseS.y) * damp(dt, 7)
      pU.uMouse.value.copy(mouseS)
    }

    // camera: a slow arc through the story, a lean toward the pointer, a dolly through the hero
    const arc = Math.min(f, 5)
    camBase.set(Math.sin(arc * 0.35) * 9, Math.cos(arc * 0.5) * 2 - 1, 70 - heroScroll * 6 + Math.sin(arc * 0.6) * 4)
    const px = reduce || mouse.x < -5 ? 0 : mouseS.x, py = reduce || mouse.y < -5 ? 0 : mouseS.y
    camTarget.set(camBase.x + px * 2.4, camBase.y + py * 1.4, camBase.z)
    camNow.lerp(camTarget, damp(dt, 3))
    camera.position.copy(camNow)
    look.set(wide ? 4 - arc * 0.6 : 0, wide ? 0 : 4, 0)
    lookNow.lerp(look, damp(dt, 3))
    camera.lookAt(lookNow)

    // planet
    planetKeys(f, heroScroll)
    planet.position.copy(pk.pos)
    planet.scale.setScalar(pk.scale)
    planet.visible = pk.scale > 0.05 && warp < 0.6
    if (planet.visible) {
      surface.rotation.y = t * 0.05
      moonPivot.rotation.y = t * 0.35
      ringU.uCenter.value.copy(pk.pos)
      ringU.uPlanetR.value = pk.scale
      const appear = clamp01((0.6 - warp) / 0.5)
      planet.scale.multiplyScalar(0.6 + 0.4 * smooth(appear))
    }

    // constellation over the galaxy only
    const cOp = (1 - clamp01(f)) * (1 - warp) * 0.32
    cMat.opacity = cOp
    constellation.visible = cOp > 0.005
    if (constellation.visible) {
      for (let e = 0; e < edges.length; e++) {
        galaxyPoint(edges[e][0], t, tmp); cPos[e * 6] = tmp.x; cPos[e * 6 + 1] = tmp.y; cPos[e * 6 + 2] = tmp.z
        galaxyPoint(edges[e][1], t, tmp); cPos[e * 6 + 3] = tmp.x; cPos[e * 6 + 4] = tmp.y; cPos[e * 6 + 5] = tmp.z
      }
      ;(cGeo.attributes.position as BufferAttribute).needsUpdate = true
    }

    // meteors
    if (!reduce && warp <= 0) {
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

    renderer.setRenderTarget(nebTarget)
    renderer.render(nebScene, camera)
    renderer.setRenderTarget(null)
    renderer.render(scene, camera)
    raf = requestAnimationFrame(frame)
  }

  /* ------------------------------------------------------------------ events */
  const onMove = (e: PointerEvent) => { mouse.set((e.clientX / W) * 2 - 1, -((e.clientY / H) * 2 - 1)) }
  const onLeave = () => { mouse.set(-9, -9) }
  const onResize = () => layout()
  const onVisibility = () => {
    running = !document.hidden
    if (running) { last = performance.now(); raf = requestAnimationFrame(frame) }
    else cancelAnimationFrame(raf)
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerleave', onLeave)
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibility)

  layout()
  raf = requestAnimationFrame(frame)

  return function destroy() {
    running = false
    cancelAnimationFrame(raf)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibility)
    scene.traverse((o) => {
      const m = o as Mesh
      if (m.geometry) m.geometry.dispose()
      const mat = (m as Mesh).material as ShaderMaterial | undefined
      if (mat && 'dispose' in mat) mat.dispose()
    })
    nebTarget.dispose()
    renderer.dispose()
  }
}
