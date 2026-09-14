declare module 'liquid-gl' {
  interface LiquidGLOptions {
    target?: string
    snapshot?: string
    resolution?: number
    engine?: 'auto' | 'webgpu' | 'webgl2' | 'webgl'
    refraction?: number
    aberration?: number
    bevelDepth?: number
    bevelWidth?: number
    frost?: number
    shadow?: boolean
    specular?: boolean
    tilt?: boolean
    magnify?: number
  }
  export default function liquidGL(options?: LiquidGLOptions): unknown
}
