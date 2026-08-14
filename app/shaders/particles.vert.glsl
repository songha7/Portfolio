// =============================================================================
// particles.vert.glsl
//
// Positions and sizes ten thousand points in one draw call.
//
// KEY IDEA: each particle is just a vertex. We upload its home position once as
// a buffer attribute, then the GPU animates it. Nothing is recalculated on the
// CPU, which is why 10,000 points cost roughly the same as 100.
// =============================================================================

uniform float uTime;
uniform float uSize;        // base point size in pixels
uniform vec2 uMouse;        // pointer in normalised device coords (-1..1)
uniform float uPixelRatio;  // so points are the same physical size on retina

// Custom per-particle attributes we create in JavaScript.
attribute float aScale;   // random size multiplier, so they are not uniform
attribute float aSpeed;   // random drift speed
attribute vec3 aRandom;   // three random values used as phase offsets

varying float vAlpha;
varying float vDepth;

void main() {
  vec3 pos = position;

  // --- Drift ---------------------------------------------------------------
  // Each axis uses a different frequency and a per-particle phase offset, so no
  // two particles move in step. Using sin/cos rather than noise here keeps this
  // cheap — with this many points the small savings matter.
  float t = uTime * aSpeed;
  pos.x += sin(t * 0.5 + aRandom.x * 6.28) * 0.35;
  pos.y += cos(t * 0.4 + aRandom.y * 6.28) * 0.35;
  pos.z += sin(t * 0.3 + aRandom.z * 6.28) * 0.25;

  // --- Mouse parallax ------------------------------------------------------
  // Particles further from the camera respond less, which reads as depth.
  float depthFactor = smoothstep(-6.0, 4.0, pos.z);
  pos.x += uMouse.x * 0.6 * depthFactor;
  pos.y += uMouse.y * 0.6 * depthFactor;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // --- Perspective-correct point size --------------------------------------
  // gl_PointSize is in raw pixels and ignores perspective, so distant points
  // would be as large as near ones. Dividing by view-space depth restores the
  // expected falloff. mvPosition.z is negative in front of the camera, hence -.
  gl_PointSize = uSize * aScale * uPixelRatio * (12.0 / -mvPosition.z);

  // Fade points as they approach the camera plane and far away, so nothing
  // pops in or out at the clipping boundaries.
  vDepth = -mvPosition.z;
  vAlpha = smoothstep(0.5, 4.0, vDepth) * (1.0 - smoothstep(14.0, 22.0, vDepth));

  gl_Position = projectionMatrix * mvPosition;
}
