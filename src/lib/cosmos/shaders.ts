/**
 * GLSL for the cosmos. Kept as plain strings so Vite needs no loader.
 *
 * The sky is pastel paper, so nothing here glows: stars are dots of pigment laid
 * over a wash of colour, and where they crowd together the pigment gets richer.
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
  uniform float uF;          // 0 galaxy · 1 solar system · 2 earth · 3 kathmandu
  uniform float uZ;          // in-level push: 0 wide → 1 close
  uniform float uTime;
  uniform float uWarp;       // 1 at load → 0 once the stars have arrived
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uAspect;
  uniform vec2  uMouse;      // NDC
  uniform float uMouseR;
  uniform vec3  uOffG, uOffS, uOffE, uOffK;
  uniform vec3  uPivot0, uPivot1, uPivot2;   // where each dive goes through
  uniform mat3  uTilt;
  uniform float uYaw;        // earth's spin
  uniform float uSolarScale, uEScale, uKScale;
  uniform vec3  uCool, uWarm, uInk;

  attribute vec3  aGalaxy, aSeed;
  attribute float aSize, aKind;
  attribute vec4  aSolar;    // orbit radius, start angle, angular speed, alpha
  attribute vec3  aSolarO, aSolarC;
  attribute vec4  aEarth;    // unit position, alpha (2 = beacon)
  attribute vec3  aEarthC;
  attribute vec4  aKath;     // position, alpha
  attribute vec3  aKathC;

  varying vec3  vColor;
  varying float vAlpha;
  varying float vKind;
  varying float vSeed;

  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
  float gSize = 1.0;     // per-formation point size multiplier
  float gFar = 260.0;    // where depth fades a point out

  vec3 kindColor() { return aKind < 0.5 ? uCool : (aKind < 1.5 ? uWarm : uInk); }

  void form(int k, float t, float z, out vec3 p, out vec3 c, out float a) {
    if (k == 0) {
      p = aGalaxy;
      float r = length(p.xz);
      float ang = t * (0.025 + 0.05 * (1.0 - r / 26.0));
      p.xz = rot(ang) * p.xz;
      p.y += sin(t * 0.4 + aSeed.x * 6.2832) * 0.3;
      p = uTilt * p + uOffG;
      // the dive: the arm we are heading into swells toward the camera
      p = uPivot0 + (p - uPivot0) * (1.0 + z * 1.1);
      c = kindColor();
      a = 1.0;
      return;
    }
    if (k == 1) {
      float ang = aSolar.y + t * aSolar.z;
      vec3 centre = vec3(cos(ang) * aSolar.x, 0.0, sin(ang) * aSolar.x);
      p = uTilt * (centre + aSolarO) * uSolarScale * (1.0 + z * 0.25) + uOffS;
      c = aSolarC;
      a = aSolar.w;
      if (aSolar.x < 0.01) a *= 0.75 + 0.25 * sin(t * 2.0 + aSeed.y * 30.0);   // the sun simmers
      return;
    }
    if (k == 2) {
      vec3 u = aEarth.xyz;
      u.xz = rot(uYaw) * u.xz;
      u.yz = rot(0.3) * u.yz;
      p = u * 15.0 * uEScale * (1.0 + z * 0.7) + uOffE;
      c = aEarthC;
      a = aEarth.w;
      if (a > 1.5) a = 0.55 + 0.45 * sin(t * 3.0 + aSeed.x * 2.0);              // the beacon on Kathmandu
      a *= 0.35 + 0.65 * smoothstep(-0.9, 0.35, u.z);                            // the far side is dim
      return;
    }
    p = aKath.xyz * uKScale + uOffK;
    c = aKathC;
    a = aKath.w * (0.86 + 0.14 * sin(t * (1.0 + aSeed.z * 2.5) + aSeed.x * 50.0));
    // the mountains and the sky are far away; keep them readable
    if (aKath.z < -30.0) { gSize = 2.2; gFar = 420.0; }
  }

  void main() {
    float f = clamp(uF, 0.0, 3.0);
    int k = int(floor(min(f, 2.999)));
    float w = f >= 3.0 ? 1.0 : smoothstep(0.0, 1.0, fract(f));

    vec3 p, c; float a;
    form(k, uTime, uZ, p, c, a);

    if (w > 0.0) {
      vec3 pb, cb; float ab;
      form(k + 1, uTime, 0.0, pb, cb, ab);
      vec3 piv = k == 0 ? uPivot0 : (k == 1 ? uPivot1 : uPivot2);
      float ex = k == 0 ? 6.0 : (k == 1 ? 9.0 : 12.0);
      // what we leave rushes past us; what we arrive at grows out of the point we dove through
      p = piv + (p - piv) * (1.0 + w * w * ex);
      pb = piv + (pb - piv) * (0.12 + 0.88 * w);
      float wp = smoothstep(0.0, 1.0, w);
      p = mix(p, pb, wp);
      c = mix(c, cb, wp);
      a = mix(a * (1.0 - w * 0.6), ab, wp);
    }

    // every star takes its own small detour mid-morph, so the field never slides as one block
    float bulge = sin(w * 3.14159) * (0.4 + 1.2 * aSeed.y);
    p += vec3(aSeed.x - 0.5, aSeed.y - 0.5, aSeed.z - 0.5) * 2.0 * bulge;

    // arrival
    float warp = uWarp * uWarp;
    p.z -= warp * (90.0 + aSeed.x * 180.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;

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
    float size = aSize * gSize * uScale * uPixelRatio * (142.0 / depth);
    size *= 1.0 + warp * 2.5;
    gl_PointSize = clamp(size, 1.0, 64.0);

    // things that fly past the camera fade out rather than smear,
    // and a dot that swells close to the lens thins out like wet paint
    float thin = 1.0 - 0.6 * smoothstep(12.0, 56.0, size / uPixelRatio);
    vAlpha = a * thin * (1.0 - warp * 0.7) * smoothstep(gFar, 40.0, depth) * smoothstep(2.0, 14.0, depth);
    vColor = c;
    vKind = aKind;
    vSeed = aSeed.z;
  }
`

export const particlesFrag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying vec3  vColor;
  varying float vAlpha;
  varying float vKind;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    // a dab of pigment: a soft-edged dot, densest in the middle
    float dab = pow(core, 1.25);
    float tw = 0.78 + 0.22 * sin(uTime * (1.2 + vSeed * 2.6) + vSeed * 40.0);
    vec3 col = vColor;
    float a = dab * tw * vAlpha;
    if (vKind > 1.5) {
      float sx = pow(max(0.0, 1.0 - abs(uv.x) * 2.4), 3.0) * max(0.0, 1.0 - abs(uv.y) * 16.0);
      float sy = pow(max(0.0, 1.0 - abs(uv.y) * 2.4), 3.0) * max(0.0, 1.0 - abs(uv.x) * 16.0);
      a += (sx + sy) * 0.6 * vAlpha * tw;
      a += pow(core, 8.0) * 0.5 * vAlpha;
    }
    gl_FragColor = vec4(col, min(a, 1.0));
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
  uniform float uDim;
  uniform vec3  uCool, uWarm;
  varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(smoothstep(0.5, 0.0, d), 1.6);
    float tw = 0.55 + 0.45 * sin(uTime * (0.6 + vSeed * 2.0) + vSeed * 90.0);
    vec3 col = mix(uCool, uWarm, step(0.7, vSeed));
    gl_FragColor = vec4(col, a * tw * 0.6 * uDim);
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
  uniform vec3  uPaper;
  uniform vec3  uColA, uColB, uColC;
  uniform vec2  uShift;
  uniform float uDim;
  uniform float uHorizon;   // 0 open space → 1 a dawn sky with a warm horizon
  varying vec2 vUv;
  ${noise}
  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float t = uTime * 0.018;
    vec3 q = vec3(p * 1.5 + uShift, t);
    float warp = fbm(q * 0.7 + vec3(0.0, 0.0, t * 0.5));
    float n1 = fbm(q + vec3(warp * 1.1, warp * 0.6, 0.0));
    float n2 = fbm(q * 1.8 + vec3(3.1, 1.2, -t * 0.7) + warp * 0.5);
    float lobeA = exp(-length(p - vec2(0.62, 0.32)) * 1.25);
    float lobeB = exp(-length(p - vec2(-0.66, -0.42)) * 1.5);
    float lobeC = exp(-length(p - vec2(0.15, -0.55)) * 1.7);
    float fil = pow(1.0 - abs(n1 * 2.0 - 1.0), 7.0);
    float fil2 = pow(1.0 - abs(n2 * 2.0 - 1.0), 5.0);
    // three washes of pastel over the paper, each pooling where its lobe sits
    float wa = clamp((pow(n1, 1.7) * 2.6 + fil * 0.3) * lobeA, 0.0, 1.0);
    float wb = clamp((pow(n2, 1.9) * 2.4 + fil2 * 0.25) * lobeB, 0.0, 1.0);
    float wc = clamp(pow(n1 * n2, 1.1) * lobeC * 3.4, 0.0, 1.0);
    vec3 col = uPaper;
    col = mix(col, uColA, wa * uDim);
    col = mix(col, uColB, wb * uDim);
    col = mix(col, uColC, wc * uDim);
    // dawn: lilac overhead, a band of peach along the horizon, a thread of butter where the sun will be
    float hz = clamp(exp(-abs(vUv.y - 0.36) * 6.0) * (0.7 + 0.5 * n1), 0.0, 1.0);
    vec3 dawn = mix(uPaper, uColA, smoothstep(0.3, 1.0, vUv.y) * (0.55 + 0.45 * n2));
    dawn = mix(dawn, uColB, hz * 0.95);
    dawn = mix(dawn, uColC, exp(-abs(vUv.y - 0.31) * 13.0) * 0.85);
    col = mix(col, mix(uPaper, dawn, uDim), uHorizon);
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
    float a = tail * width * fade * 0.85;
    gl_FragColor = vec4(uColor, a);
  }
`
