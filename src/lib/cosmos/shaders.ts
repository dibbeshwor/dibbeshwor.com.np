/**
 * GLSL for the cosmos. Kept as plain strings so Vite needs no loader.
 * Shared noise lives in `noise` and is prepended where a shader needs it.
 */

export const noise = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.02 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return v;
  }
`

/* ---------------------------------------------------------------- particles */

export const particlesVert = /* glsl */ `
  uniform float uF;          // 0 galaxy · 1 wave · 2 lattice · 3 reach · 4 globe · 5 dust
  uniform float uTime;
  uniform float uWarp;       // 1 at load → 0 once the stars have arrived
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uAspect;
  uniform vec2  uMouse;      // NDC
  uniform float uMouseR;
  uniform vec3  uOffG, uOffW, uOffL, uOffR, uOffS, uOffD;
  uniform float uSpreadX, uSpreadY;
  uniform mat3  uTilt;

  attribute vec3  aGalaxy, aWave, aLattice, aReach, aGlobe, aDust, aSeed;
  attribute float aSize, aKind;

  varying float vAlpha;
  varying float vKind;
  varying float vSeed;

  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  /* xyz position, w alpha multiplier */
  vec4 form(int k, float t) {
    if (k == 0) {
      vec3 p = aGalaxy;
      float r = length(p.xz);
      float ang = t * (0.025 + 0.05 * (1.0 - r / 26.0));
      p.xz = rot(ang) * p.xz;
      p.y += sin(t * 0.4 + aSeed.x * 6.2832) * 0.3;
      return vec4(uTilt * p + uOffG, 1.0);
    }
    if (k == 1) {
      vec3 p = aWave;
      float u = p.x;
      float env = 0.08 + 0.92 * abs(sin(u * 0.11 + t * 0.9) * cos(u * 0.21 - t * 0.6));
      p.x *= uSpreadX;
      p.y *= env;
      p.z += sin(u * 0.3 + t) * 1.5;
      return vec4(p + uOffW, 0.45 + env * 0.55);
    }
    if (k == 2) {
      vec3 p = aLattice;
      p.x *= uSpreadX;
      float rip = sin(p.x * 0.22 + t * 1.1) * cos(p.z * 0.2 - t * 0.7);
      p.y += rip * 1.6;
      // the whole crystal turns very slowly
      p.xz = rot(t * 0.05 + 0.4) * p.xz;
      return vec4(p + uOffL, 0.35 + 0.65 * smoothstep(-26.0, 20.0, p.z));
    }
    if (k == 3) {
      // broadcast: every particle rides a ring that expands from the centre and respawns
      float ph = fract(aSeed.y + t * 0.055);
      float r = ph * 30.0;
      vec3 p = vec3(aReach.x * r, aReach.z + sin(ph * 12.0) * 1.2, aReach.y * r);
      float a = smoothstep(0.0, 0.1, ph) * (1.0 - smoothstep(0.75, 1.0, ph));
      return vec4(uTilt * p + uOffR, a);
    }
    if (k == 4) {
      vec3 p = aGlobe;
      p.xz = rot(t * 0.16) * p.xz;
      float c = cos(0.38), s = sin(0.38);
      p.yz = mat2(c, -s, s, c) * p.yz;
      return vec4(p + uOffS, 0.55 + 0.45 * smoothstep(-1.0, 1.0, p.z / 15.0));
    }
    vec3 p = aDust + vec3(
      sin(t * 0.2 + aSeed.x * 10.0),
      cos(t * 0.17 + aSeed.y * 10.0),
      sin(t * 0.13 + aSeed.z * 10.0)) * 1.4;
    return vec4(p + uOffD, 0.7);
  }

  void main() {
    float f = clamp(uF, 0.0, 5.0);
    int k = int(floor(min(f, 4.999)));
    float w = f >= 5.0 ? 1.0 : smoothstep(0.0, 1.0, fract(f));
    vec4 a = form(k, uTime);
    vec4 b = w > 0.0 ? form(min(k + 1, 5), uTime) : a;
    vec4 m = mix(a, b, w);
    vec3 p = m.xyz;

    // particles breathe outward mid-morph, each by its own amount, so the field never slides as one block
    float bulge = sin(w * 3.14159) * (2.0 + 6.0 * aSeed.y);
    p += normalize(p + vec3(0.001)) * bulge;

    // arrival: everything starts far behind the camera and streaks in
    float warp = uWarp * uWarp;
    p.z -= warp * (90.0 + aSeed.x * 180.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;

    // the pointer pushes stars aside, in screen space so it feels the same at any depth
    vec2 ndc = clip.xy / clip.w;
    vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
    float dist = length(d);
    if (dist < uMouseR && dist > 0.0001) {
      float push = (uMouseR - dist) / uMouseR;
      push *= push;
      ndc += (normalize(d) / vec2(uAspect, 1.0)) * push * 0.07;
    }
    clip.xy = ndc * clip.w;
    gl_Position = clip;

    float depth = max(-mv.z, 1.0);
    float size = aSize * uScale * uPixelRatio * (120.0 / depth);
    size *= 1.0 + warp * 2.5;
    gl_PointSize = max(size, 1.0);

    vAlpha = m.w * (1.0 - warp * 0.7) * smoothstep(260.0, 40.0, depth);
    vKind = aKind;
    vSeed = aSeed.z;
  }
`

export const particlesFrag = /* glsl */ `
  precision highp float;
  uniform vec3  uColA;   // cool
  uniform vec3  uColB;   // warm
  uniform float uTime;
  varying float vAlpha;
  varying float vKind;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 2.4);
    float tw = 0.72 + 0.28 * sin(uTime * (1.2 + vSeed * 2.6) + vSeed * 40.0);
    vec3 col = vKind < 0.5 ? uColA : (vKind < 1.5 ? uColB : vec3(1.0));
    float a = glow * tw * vAlpha;
    if (vKind > 1.5) {
      // bright stars carry a small diffraction cross and a hot core
      float sx = pow(max(0.0, 1.0 - abs(uv.x) * 2.4), 3.0) * max(0.0, 1.0 - abs(uv.y) * 16.0);
      float sy = pow(max(0.0, 1.0 - abs(uv.y) * 2.4), 3.0) * max(0.0, 1.0 - abs(uv.x) * 16.0);
      a += (sx + sy) * 0.55 * vAlpha * tw;
      a += pow(core, 10.0) * 0.9 * vAlpha;
      col = mix(col, uColA, 0.25);
    }
    gl_FragColor = vec4(col, a);
  }
`

/* ---------------------------------------------------------------- far stars */

export const starsVert = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uScale;
  attribute float aSize;
  attribute float aSeed;
  varying float vSeed;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uScale * uPixelRatio;
    vSeed = aSeed;
  }
`
export const starsFrag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(smoothstep(0.5, 0.0, d), 3.0);
    float tw = 0.55 + 0.45 * sin(uTime * (0.6 + vSeed * 2.0) + vSeed * 90.0);
    vec3 col = mix(vec3(0.75, 0.8, 1.0), vec3(1.0, 0.9, 0.8), step(0.7, vSeed));
    gl_FragColor = vec4(col, a * tw * 0.8);
  }
`

/* ---------------------------------------------------------------- nebula */

export const nebulaVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.99999, 1.0);
  }
`
export const nebulaFrag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uAspect;
  uniform vec3  uColA, uColB, uColC;
  uniform vec2  uShift;
  uniform float uDim;
  varying vec2 vUv;
  ${noise}
  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float t = uTime * 0.018;
    vec3 q = vec3(p * 1.5 + uShift, t);
    float warp = fbm(q * 0.7 + vec3(0.0, 0.0, t * 0.5));
    float n1 = fbm(q + vec3(warp * 1.1, warp * 0.6, 0.0));
    float n2 = fbm(q * 1.8 + vec3(3.1, 1.2, -t * 0.7) + warp * 0.5);
    float lobeA = exp(-length(p - vec2(0.62, 0.32)) * 1.7);
    float lobeB = exp(-length(p - vec2(-0.66, -0.42)) * 2.1);
    float lobeC = exp(-length(p - vec2(0.15, -0.55)) * 2.4);
    float fil = pow(1.0 - abs(n1 * 2.0 - 1.0), 7.0);    // thin bright filaments where the noise crosses its midline
    float fil2 = pow(1.0 - abs(n2 * 2.0 - 1.0), 5.0);
    vec3 col =
      uColA * (pow(n1, 2.4) * 2.2 + fil * 0.35) * lobeA +
      uColB * (pow(n2, 2.6) * 1.8 + fil2 * 0.3) * lobeB +
      uColC * pow(n1 * n2, 1.4) * lobeC * 2.0;
    col += vec3(0.016, 0.02, 0.04) * n1 * (0.5 + 0.5 * warp);   // faint dust veil
    col *= 0.78 * (1.0 - smoothstep(0.4, 1.2, length(p)));   // vignette
    gl_FragColor = vec4(col * uDim, 1.0);
  }
`

/* ---------------------------------------------------------------- planet */

export const planetVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vP;
  varying vec3 vW;
  void main() {
    vN = normalize(mat3(modelMatrix) * normal);
    vP = position;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
export const planetFrag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3  uLight;
  uniform vec3  uC1, uC2, uC3, uC4;
  varying vec3 vN;
  varying vec3 vP;
  varying vec3 vW;
  ${noise}
  void main() {
    vec3 n = normalize(vN);
    vec3 p = vP;
    float drift = uTime * 0.015;
    // bands sheared by turbulence, like a gas giant seen from a little too close
    float swirl = fbm(p * 2.6 + vec3(drift, 0.0, 0.0)) * 2.0;
    float bands = sin(p.y * 9.5 + swirl * 2.4 + fbm(p * 6.5 + drift) * 1.6);
    float veins = pow(fbm(p * 4.5 + vec3(7.0, 2.0, drift * 2.0)), 2.2);
    float storm = smoothstep(0.72, 0.9, fbm(p * 3.2 + vec3(2.0, 5.0, 1.0)));
    vec3 base = mix(uC1, uC2, smoothstep(-0.7, 0.7, bands));
    base = mix(base, uC3, veins * 0.9 * smoothstep(-0.2, 0.6, bands));
    base = mix(base, uC4, storm * 0.8);
    base *= 0.85 + 0.3 * fbm(p * 12.0 + drift);

    float ndl = dot(n, uLight);
    float diff = max(ndl, 0.0);
    float wrap = pow(max(ndl * 0.5 + 0.5, 0.0), 1.6);
    vec3 v = normalize(cameraPosition - vW);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.2);

    vec3 col = base * (0.05 + diff * 1.15) + base * wrap * 0.12;
    col += uC4 * fres * 0.8 * (0.25 + diff);                  // limb glow
    col += uC3 * pow(1.0 - abs(ndl), 9.0) * 0.3;              // warm terminator
    col += vec3(1.0, 0.9, 0.8) * pow(max(dot(reflect(-uLight, n), v), 0.0), 40.0) * 0.12;
    gl_FragColor = vec4(col, 1.0);
  }
`

export const atmoVert = /* glsl */ `
  varying vec3 vNv;
  varying vec3 vN;
  void main() {
    vNv = normalize(normalMatrix * normal);
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const atmoFrag = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uLight;
  varying vec3 vNv;
  varying vec3 vN;
  void main() {
    float facing = -dot(normalize(vNv), vec3(0.0, 0.0, 1.0));   // 0 at the outer edge, ~0.5 at the planet's limb
    float rim = pow(clamp(facing / 0.5, 0.0, 1.0), 2.2);
    float lit = 0.25 + 0.75 * max(dot(normalize(vN), uLight) * 0.5 + 0.5, 0.0);
    gl_FragColor = vec4(uColor * rim * lit * 1.3, rim * lit * 0.9);
  }
`

export const ringVert = /* glsl */ `
  varying vec3 vP;
  varying vec3 vW;
  varying vec3 vN;
  void main() {
    vP = position;
    vN = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
export const ringFrag = /* glsl */ `
  precision highp float;
  uniform vec3  uLight;
  uniform vec3  uCenter;
  uniform float uPlanetR;
  uniform vec3  uColA, uColB;
  uniform float uInner, uOuter;
  varying vec3 vP;
  varying vec3 vW;
  varying vec3 vN;
  ${noise}
  void main() {
    float r = length(vP.xy);
    float u = (r - uInner) / (uOuter - uInner);
    float b1 = noise(vec3(r * 16.0, 0.5, 0.5));
    float b2 = noise(vec3(r * 42.0, 2.0, 2.0));
    float gaps = smoothstep(0.28, 0.5, noise(vec3(r * 9.0, 4.0, 4.0)));
    float dens = (0.25 + 0.75 * b1) * (0.5 + 0.5 * b2) * gaps;
    dens *= smoothstep(0.0, 0.08, u) * (1.0 - smoothstep(0.82, 1.0, u));
    // a big dark division two thirds out
    dens *= 1.0 - 0.85 * smoothstep(0.6, 0.63, u) * (1.0 - smoothstep(0.67, 0.7, u));

    // the planet shadows the far side of the ring
    vec3 toP = vW - uCenter;
    float along = dot(toP, uLight);
    vec3 perp = toP - along * uLight;
    float shadow = along < 0.0 ? smoothstep(uPlanetR * 0.92, uPlanetR * 1.08, length(perp)) : 1.0;
    float lit = (0.25 + 0.75 * abs(dot(vN, uLight))) * mix(0.18, 1.0, shadow);

    vec3 col = mix(uColA, uColB, b1) * lit;
    gl_FragColor = vec4(col, dens * 0.9);
  }
`

export const moonFrag = /* glsl */ `
  precision highp float;
  uniform vec3 uLight;
  uniform vec3 uColor;
  varying vec3 vN;
  varying vec3 vP;
  varying vec3 vW;
  ${noise}
  void main() {
    vec3 n = normalize(vN);
    float craters = fbm(vP * 7.0);
    float diff = max(dot(n, uLight), 0.0);
    vec3 col = uColor * (0.08 + diff) * (0.75 + craters * 0.5);
    gl_FragColor = vec4(col, 1.0);
  }
`

/* ---------------------------------------------------------------- meteor */

export const meteorVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const meteorFrag = /* glsl */ `
  precision highp float;
  uniform float uLife;    // 0 → 1
  uniform vec3  uColor;
  varying vec2 vUv;
  void main() {
    float head = smoothstep(0.0, 1.0, vUv.x);
    float tail = pow(head, 3.0);
    float width = 1.0 - smoothstep(0.0, 0.5, abs(vUv.y - 0.5)) ;
    width = pow(width, 1.0 + (1.0 - head) * 3.0);
    float fade = sin(uLife * 3.14159);
    float a = tail * width * fade;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), pow(head, 6.0)), a);
  }
`
