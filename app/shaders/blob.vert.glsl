// =============================================================================
// blob.vert.glsl — VERTEX SHADER
//
// A vertex shader runs once per vertex. Our sphere has ~40,000 of them, and
// this code runs on every single one, every frame, in parallel on the GPU.
// That is why we can deform a whole mesh in real time without the CPU noticing.
//
// WHAT IT DOES
//   1. Samples 3D noise at each vertex's position.
//   2. Pushes the vertex outward along its own radius by that amount.
//   3. Recalculates the surface normal, because a deformed surface faces a
//      different direction than the original sphere did.
//
// Three.js gives us these for free — never redeclare them:
//   attribute vec3 position, normal;  attribute vec2 uv;
//   uniform mat4 modelViewMatrix, projectionMatrix;  uniform mat3 normalMatrix;
// =============================================================================

// ---- Uniforms: values we set from JavaScript, the same for every vertex -----
uniform float uTime;        // seconds since start — drives the animation
uniform float uNoiseScale;  // higher = smaller, busier lumps
uniform float uDisplace;    // how far the surface is pushed out
uniform float uMouseInfluence; // 0..1, swells the blob when the pointer is near

// ---- Varyings: values passed on to the fragment shader ---------------------
// The GPU interpolates these smoothly across each triangle for us.
varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDisplacement;

// -----------------------------------------------------------------------------
// Simplex 3D noise.
// Original by Ian McEwan / Ashima Arts (MIT licence) — this is the standard
// implementation you will find in most shader projects.
//
// The idea: ordinary random() gives you static. Noise gives you *smooth*
// randomness — nearby inputs give nearby outputs. That is what makes it look
// organic rather than like TV snow.
// -----------------------------------------------------------------------------
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner of the simplex (a tetrahedron in 3D)
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Work out which of the six possible tetrahedra we are inside
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Hash the four corners into pseudo-random gradient indices
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Turn those indices into actual gradient vectors on an octahedron
  float n_ = 0.142857142857; // 1/7
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  // Normalise the gradients so no direction is unfairly strong
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Blend the four corner contributions
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// -----------------------------------------------------------------------------
// FBM — Fractional Brownian Motion.
//
// One layer of noise looks like rolling hills. Stack several layers, each at
// double the frequency and half the strength, and you get detail at every
// scale — the same principle that makes coastlines and clouds look natural.
// Each layer is called an "octave", exactly like in music.
// -----------------------------------------------------------------------------
// Three octaves, not four: a fourth adds detail so fine that at this size it
// reads as noise rather than as form — the surface starts to look like a walnut
// instead of something molten. Detail is not the same thing as quality.
float fbm(vec3 p) {
  float total = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 3; i++) {
    total += snoise(p * frequency) * amplitude;
    frequency *= 2.0;   // twice as detailed
    amplitude *= 0.5;   // half as strong
  }
  return total;
}

// -----------------------------------------------------------------------------
// Displace a point on the unit sphere outward along its radius.
// We define this as a function so we can call it three times below to work out
// the new surface normal.
// -----------------------------------------------------------------------------
vec3 displacePoint(vec3 p) {
  // Scrolling the noise field through Z over time animates it without the shape
  // appearing to spin — the lumps travel *through* the surface.
  float n = fbm(p * uNoiseScale + vec3(0.0, 0.0, uTime * 0.16));
  float amount = n * uDisplace * (1.0 + uMouseInfluence * 0.6);
  return p * (1.0 + amount);
}

void main() {
  // For a sphere centred on the origin, the outward normal at any point is
  // simply the normalised position. Handy — it means we can compute the normal
  // for *neighbouring* points too, which the `normal` attribute cannot give us.
  vec3 N = normalize(position);

  // --- Build a tangent basis (two vectors lying flat on the surface) --------
  // Cross the normal with an arbitrary "up". If the normal is already pointing
  // straight up the cross product would collapse to zero, so near the poles we
  // pick a different reference axis.
  vec3 reference = abs(N.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 tangent1 = normalize(cross(N, reference));
  vec3 tangent2 = cross(N, tangent1); // right-handed: cross(t1, t2) == N

  // --- Sample the displaced surface at three nearby points -----------------
  float eps = 0.015; // small step; too large blurs detail, too small = artefacts
  vec3 displaced = displacePoint(position);
  vec3 neighbour1 = displacePoint(position + tangent1 * eps);
  vec3 neighbour2 = displacePoint(position + tangent2 * eps);

  // The cross product of two edges of a triangle gives its face normal.
  // This is a finite-difference approximation of the true surface normal —
  // the reason the lighting looks correct on the bumps instead of flat.
  vec3 newNormal = normalize(cross(neighbour1 - displaced, neighbour2 - displaced));

  // How far this vertex moved, remapped roughly to 0..1 for the fragment shader
  // to use as a colour ramp.
  vDisplacement = length(displaced) - 1.0;

  // --- Standard three.js transform chain -----------------------------------
  // model space -> view space (relative to the camera) -> clip space (screen)
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);

  // normalMatrix converts normals into view space correctly even when the model
  // has been scaled non-uniformly.
  vNormal = normalMatrix * newNormal;
  // Direction from the surface back towards the camera — the fragment shader
  // needs it for the fresnel rim.
  vViewPosition = -mvPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
