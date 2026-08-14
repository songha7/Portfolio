/**
 * Tell TypeScript that importing a shader file gives you a string.
 * Without this, `import vertexShader from '~/shaders/blob.vert.glsl'` is an error
 * even though vite-plugin-glsl handles it correctly at build time.
 */
declare module '*.glsl' {
  const value: string
  export default value
}
declare module '*.vert' {
  const value: string
  export default value
}
declare module '*.frag' {
  const value: string
  export default value
}
