// =============================================================================
// particles.frag.glsl
//
// Draws each point as a soft round dot instead of the hard square the GPU
// gives you by default.
// =============================================================================

precision mediump float;

uniform vec3 uColor;

varying float vAlpha;
varying float vDepth;

void main() {
  // gl_PointCoord is a special built-in for point primitives: it runs 0..1
  // across the little square the GPU rasterises for this point.
  // Distance from its centre gives us a circle.
  float dist = length(gl_PointCoord - vec2(0.5));

  // Anything outside the circle is thrown away entirely. `discard` skips
  // writing the pixel — cheaper and cleaner than drawing it transparent.
  if (dist > 0.5) discard;

  // A soft edge: fully opaque in the middle, fading to nothing at the rim.
  // Squaring it concentrates the brightness in the core, so the dot reads as a
  // tiny light source rather than a flat disc.
  float strength = 1.0 - smoothstep(0.0, 0.5, dist);
  strength = pow(strength, 2.2);

  gl_FragColor = vec4(uColor, strength * vAlpha);
}
