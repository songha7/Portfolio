// =============================================================================
// blob.frag.glsl — FRAGMENT SHADER
//
// Runs once per *pixel* the mesh covers — millions of times a second. Its only
// job is to decide one colour.
//
// The look here is built from three ingredients:
//   1. A colour ramp driven by how far the surface was pushed out (peaks and
//      valleys get different colours).
//   2. Simple diffuse shading from one key light, so the form reads as solid.
//   3. A fresnel rim — the bright edge you see on the silhouette of glass,
//      soap bubbles and skin. This is the single cheapest trick in real-time
//      rendering for making something look expensive.
// =============================================================================

precision highp float;

uniform vec3 uColorLow;   // colour in the valleys
uniform vec3 uColorHigh;  // colour on the peaks
uniform vec3 uColorRim;   // colour of the fresnel edge
uniform float uFresnelPower;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDisplacement;

void main() {
  // Interpolated varyings arrive un-normalised (averaging two unit vectors does
  // not give a unit vector), so always renormalise them here.
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewPosition); // surface -> camera

  // --- FRESNEL -------------------------------------------------------------
  // dot(N, V) is 1 when the surface faces you straight on, and 0 at the
  // silhouette where it curves away. Invert it and you get a value that is
  // bright exactly at the edges. Raising it to a power tightens that band:
  // power 1 = a broad wash, power 5 = a thin bright rim.
  float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), uFresnelPower);

  // --- BASE COLOUR ---------------------------------------------------------
  // smoothstep gives an eased 0..1 ramp instead of a hard cut, so peaks blend
  // into valleys rather than banding.
  float height = smoothstep(-0.25, 0.35, vDisplacement);
  vec3 base = mix(uColorLow, uColorHigh, height);

  // --- DIFFUSE LIGHT -------------------------------------------------------
  // One fixed key light. dot(N, L) is the classic Lambert term: surfaces facing
  // the light are bright, surfaces facing away are dark.
  vec3 lightDir = normalize(vec3(0.55, 0.8, 0.6));
  float diffuse = max(dot(N, lightDir), 0.0);

  // A weak second light from below-behind stops the dark side going pure black.
  float fill = max(dot(N, normalize(vec3(-0.4, -0.5, 0.3))), 0.0) * 0.25;

  // Ambient keeps everything above zero; the rest is the shaped lighting.
  vec3 color = base * (0.30 + 0.85 * diffuse + fill);

  // Add the rim on top, so it glows rather than tinting.
  color += uColorRim * fresnel * 0.9;

  // A gentle inner glow tied to the peaks makes the lumps feel lit from within.
  color += uColorHigh * pow(height, 3.0) * 0.18;

  gl_FragColor = vec4(color, uOpacity);
}
