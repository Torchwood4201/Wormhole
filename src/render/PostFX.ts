/**
 * Post-processing: Silent Hill survival-horror grade. Scene renders into an
 * RT, then a fullscreen pass applies: corpse-gray-green color grade (reds
 * spared), crawling rust "otherworld" blotches, coarse + fine film grain,
 * fluorescent flicker, blood sigil-flash ring, entity-proximity glitch
 * (chromatic shift + scanline tearing), and a breathing darkness-press
 * vignette. Skipped entirely on low quality.
 */
import {
  Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial,
  SRGBColorSpace, Vector2, WebGLRenderer, WebGLRenderTarget,
} from 'three';

const FRAG = /* glsl */ `
  uniform sampler2D uScene;
  uniform float uTime;
  uniform float uGrain;
  uniform float uGlitch;     // 0..1 entity proximity
  uniform float uTension;    // 0..1 director tension
  uniform float uDepth;      // 0..1 descent depth — dread never fully lifts below
  uniform float uSigil;      // 0..1 blood flash from carved wards
  uniform float uRot;        // 0..1 otherworld shift (depth x tension)
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float rustFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    // glitch: horizontal scanline tears
    if (uGlitch > 0.012) {
      float band = floor(uv.y * 36.0 + uTime * 13.0);
      float r = hash(vec2(band, floor(uTime * 19.0)));
      if (r < uGlitch * 0.4) {
        uv.x += (hash(vec2(band, uTime)) - 0.5) * 0.08 * uGlitch;
      }
    }

    // chromatic aberration scales with glitch + tension + otherworld shift
    float ca = uGlitch * 0.012 + uTension * 0.0016 + uRot * 0.0012;
    vec2 toC = uv - 0.5;
    vec3 col;
    col.r = texture2D(uScene, uv + toC * ca).r;
    col.g = texture2D(uScene, uv).g;
    col.b = texture2D(uScene, uv - toC * ca).b;

    // --- SILENT HILL GRADE: corpse gray-green, but spare the reds so blood
    // and carved wards keep popping through the murk
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    float redness = clamp((col.r - max(col.g, col.b)) * 2.0, 0.0, 1.0);
    float gradeAmt = clamp(uDepth * 0.55 + uRot * 0.45, 0.0, 1.0) * (1.0 - redness * 0.75);
    vec3 cold = vec3(luma) * vec3(0.82, 0.9, 0.84);
    col = mix(col, cold, gradeAmt * 0.6);

    // rust otherworld blotches crawling in from the frame edges
    float dEdge = length(toC * vec2(1.0, 1.2));
    float rust = rustFbm(uv * 5.0 + vec2(uTime * 0.03, -uTime * 0.02));
    rust = smoothstep(0.55, 0.85, rust) * smoothstep(0.35, 0.85, dEdge) * uRot;
    col = mix(col, vec3(0.29, 0.10, 0.06), rust * 0.55);

    // heavy SH grain: coarse clumps + fine tooth
    float coarse = hash(floor(uv * uResolution.xy / 3.0) * 0.33 + fract(uTime) * 711.0) - 0.5;
    float fine = hash(uv * uResolution.xy * 0.5 + fract(uTime) * 711.0) - 0.5;
    col += coarse * (0.022 + uTension * 0.05 + uRot * 0.04);
    col += fine * (uGrain + uTension * 0.03 + uGlitch * 0.1 + uDepth * 0.03);

    // sigil blood-flash: pulsing ring + sparse ember flicker
    float sr = length(toC * vec2(1.0, 1.25));
    float ring = smoothstep(0.5, 0.62, sr) * (1.0 - smoothstep(0.7, 0.98, sr));
    float ember = step(0.93, hash(vec2(floor(uv.y * 40.0), floor(uTime * 17.0))));
    col = mix(col, vec3(0.42, 0.03, 0.03), uSigil * (ring * 0.55 + ember * 0.22));

    // fluorescent flicker: slow breathing + high-tension buzz
    float buzz = sin(uTime * 47.0) * sin(uTime * 31.0);
    col *= 1.0 - 0.018 * sin(uTime * 1.3) - uTension * 0.02 * buzz;

    // darkness press: breathing vignette + fog-gray lifted blacks at the edges
    float d = length(toC) * 1.35;
    float vig = smoothstep(1.25, 0.45, d + uTension * 0.16 + uDepth * 0.12 + uRot * 0.1 + sin(uTime * 1.8) * (uTension * 0.03 + uDepth * 0.012));
    col *= mix(0.66, 1.0, vig);
    col += vec3(0.012, 0.014, 0.012) * (1.0 - vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export class PostFX {
  enabled = true;
  glitch = 0;
  tension = 0;
  /** 0 surface .. 1 the Seam. Fed from DepthDread via Game. */
  depth = 0;
  /** 0..1 blood flash from carved wards. Decays in composite(). */
  sigil = 0;
  /** 0..1 otherworld shift. Fed from depth x tension via Game. */
  rot = 0;
  private rt: WebGLRenderTarget | null = null;
  private quadScene = new Scene();
  private quadCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private material: ShaderMaterial;
  private time = 0;

  constructor() {
    this.material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uScene: { value: null },
        uTime: { value: 0 },
        uGrain: { value: 0.045 },
        uGlitch: { value: 0 },
        uTension: { value: 0 },
        uDepth: { value: 0 },
        uSigil: { value: 0 },
        uRot: { value: 0 },
        uResolution: { value: new Vector2(1, 1) },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.quadScene.add(new Mesh(new PlaneGeometry(2, 2), this.material));
  }

  configure(width: number, height: number, pixelRatio: number, enabled: boolean): void {
    this.enabled = enabled;
    this.rt?.dispose();
    this.rt = null;
    if (enabled) {
      this.rt = new WebGLRenderTarget(
        Math.round(width * pixelRatio), Math.round(height * pixelRatio),
        { samples: 4 },
      );
      this.rt.texture.colorSpace = SRGBColorSpace;
      (this.material.uniforms.uResolution.value as Vector2).set(width, height);
    }
  }

  /** Target for the main scene render — null when post is disabled. */
  get target(): WebGLRenderTarget | null {
    return this.enabled ? this.rt : null;
  }

  /** Composite RT → screen. Call after the main scene render. */
  composite(webgl: WebGLRenderer, dt: number): void {
    if (!this.enabled || !this.rt) return;
    this.time += dt;
    this.material.uniforms.uScene.value = this.rt.texture;
    this.material.uniforms.uTime.value = this.time;
    this.material.uniforms.uGlitch.value = this.glitch;
    this.material.uniforms.uTension.value = this.tension;
    this.material.uniforms.uDepth.value = this.depth;
    this.material.uniforms.uSigil.value = this.sigil;
    this.material.uniforms.uRot.value = this.rot;
    webgl.setRenderTarget(null);
    webgl.render(this.quadScene, this.quadCam);
  }
}
