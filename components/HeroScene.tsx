"use client";

import { useEffect, useRef } from "react";

/**
 * Hero backdrop: a Stripe-style mesh gradient.
 *
 * One fullscreen quad, one fragment shader, drawn with plain WebGL (no 3D library: this is the page's only WebGL and a
 * library would add ~150 KB of JavaScript). A base colour plus three colour layers, each revealed by its own drifting
 * 3D simplex-noise field, with a low-frequency domain warp so the layers fold over each other like cloth.
 * The soft dissolve into the page comes from a CSS mask on the wrapper; the shader itself is a plain rectangle.
 *
 * Pauses when scrolled off screen. Renders one static frame under prefers-reduced-motion. No pointer interaction.
 * Without WebGL the band stays dark (the page background).
 */

/** Seconds into the loop at which the page starts; picked so the first frame already shows the blue/rose composition. */
export const HERO_START = 30;

export const HERO_COLORS = {
  base: "#3f7fe6",                             // azure, a step darker than before
  layers: ["#ff5f7e", "#7fc0ff", "#5b9af0"],  // rose band, sky highlight, mid azure (no violet, no deep blue)
} as const;

const VERT = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform vec3 uBase;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform float uDim;

// --- 3D simplex noise (Ashima) ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
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
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  float aspect = uRes.x / max(uRes.y, 1.0);
  float t = uTime * 0.05; // slow: a full drift takes about a minute

  // Stripe tilts its plane so colour bands run diagonally; do the same in uv space.
  vec2 uv = vec2(vUv.x * aspect, vUv.y + vUv.x * 0.25);

  // Low-frequency warp: the "cloth" fold that makes layers slide over each other.
  vec2 warp = vec2(
    snoise(vec3(uv * 0.55 + vec2(0.0, t * 0.35), t * 0.20)),
    snoise(vec3(uv * 0.50 - vec2(t * 0.30, 0.0), t * 0.15 + 4.0))
  );
  vec2 p = uv + warp * 0.35;

  // Colour layers, each with its own drifting noise field.
  float n1 = snoise(vec3(p.x * 0.85 + t * 0.55, p.y * 1.25 - t * 0.40, t * 0.30 + 3.1));
  float n2 = snoise(vec3(p.x * 0.70 - t * 0.45, p.y * 1.10 + t * 0.55, t * 0.25 + 7.3));
  float n3 = snoise(vec3(p.x * 1.05 + t * 0.35, p.y * 0.95 - t * 0.60, t * 0.22 + 11.9));

  // Wider blends: layers melt into each other instead of banding.
  vec3 col = uBase;
  col = mix(col, uC1, smoothstep(-0.15, 0.65, n1));
  col = mix(col, uC2, smoothstep(-0.05, 0.75, n2));
  col = mix(col, uC3, smoothstep(0.30, 0.95, n3) * 0.55);

  // Soft highlight where two layers overlap, like light on folded fabric.
  float sheen = smoothstep(0.35, 0.95, n1 * n2 + 0.5);
  col += sheen * 0.04;

  // Slow breath: brightness eases up and down over ~25s.
  col *= 0.96 + 0.04 * sin(uTime * 0.25);

  // Tone down for the dark page and keep the copy column (bottom-left) calm.
  col *= uDim;

  // Faint vignette toward the corners.
  vec2 vq = vUv - 0.5;
  col *= 1.0 - 0.18 * dot(vq, vq) * 2.0;
  vec2 c = vUv - vec2(0.12, 0.10);
  c.x *= aspect;
  float veil = smoothstep(0.15, 1.15, length(c));
  col = mix(col * 0.28, col, veil);

  // Fine grain hides banding on wide gradients.
  float grain = fract(sin(dot(vUv * uRes + uTime, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.012;

  gl_FragColor = vec4(col, 1.0);
}
`;

// The colours go in as linear RGB (sRGB hex decoded), and the shader writes its result without converting back: the
// look was tuned that way (it is what three.js did with these values), so keep it.
const srgbToLinear = (c: number) => (c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4));
const linear = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [srgbToLinear(((n >> 16) & 255) / 255), srgbToLinear(((n >> 8) & 255) / 255), srgbToLinear((n & 255) / 255)];
};

export default function HeroScene() {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const attrs: WebGLContextAttributes = { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance" };
    const gl = (canvas.getContext("webgl2", attrs) ?? canvas.getContext("webgl", attrs)) as WebGLRenderingContext | null;
    if (!gl) return;

    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const vs = shader(gl.VERTEX_SHADER, VERT);
    const fs = shader(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    const buf = gl.createBuffer();
    const release = () => {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      release();
      return;
    }
    gl.useProgram(prog);

    // Two triangles covering clip space; uv = (0,0) bottom-left to (1,1) top-right.
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const loc = (name: string) => gl.getUniformLocation(prog, name);
    const uTime = loc("uTime");
    const uRes = loc("uRes");
    gl.uniform3fv(loc("uBase"), linear(HERO_COLORS.base));
    gl.uniform3fv(loc("uC1"), linear(HERO_COLORS.layers[0]));
    gl.uniform3fv(loc("uC2"), linear(HERO_COLORS.layers[1]));
    gl.uniform3fv(loc("uC3"), linear(HERO_COLORS.layers[2]));
    gl.uniform1f(loc("uDim"), 0.9);

    const start = performance.now();
    const draw = () => {
      gl.uniform1f(uTime, HERO_START + (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const pr = Math.min(window.devicePixelRatio, 1.5);
    const resize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      canvas.width = Math.floor(w * pr);
      canvas.height = Math.floor(h * pr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, w * pr, h * pr);
      if (reduced) draw(); // resizing clears the canvas; the animated loop repaints on its next frame anyway
    };
    wrap.appendChild(canvas);
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let visible = true;
    const frame = () => {
      draw();
      if (!reduced && visible) raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([entry]) => {
      const now = entry.isIntersecting;
      if (now && !visible) {
        visible = true;
        if (!reduced) raf = requestAnimationFrame(frame);
      } else if (!now) {
        visible = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(wrap);

    frame();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      release();
      canvas.remove();
    };
  }, []);

  return <div ref={wrapRef} className="absolute inset-0" aria-hidden />;
}
