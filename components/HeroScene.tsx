"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Hero backdrop — Stripe-style gradient silk, recolored for Coelor:
 * domain-warped fbm noise rendered as slow emerald → teal → deep-blue
 * ribbons flowing over near-black. Single fullscreen fragment shader,
 * gentle damped mouse drift, film grain. One draw call.
 */

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;

// --- simplex noise (Ashima) ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.6;
  for (int i = 0; i < 3; i++) {
    v += a * snoise(p);
    p = p * 1.9 + vec2(13.7, 7.1);
    a *= 0.45;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / max(uRes.y, 1.0);

  // silk domain: very low frequency so folds read as wide smooth ribbons
  vec2 p = vec2(uv.x * aspect * 0.5, uv.y * 0.85);
  float t = uTime * 0.04;

  // domain warping (the silk)
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + t * vec2(0.6, 0.25)),
    fbm(p + vec2(5.2, 1.3) - t * vec2(0.35, 0.5))
  );
  vec2 r = vec2(
    fbm(p + 1.5 * q + vec2(1.7, 9.2) + t * 0.4 + uMouse * 0.2),
    fbm(p + 1.5 * q + vec2(8.3, 2.8) - t * 0.3)
  );
  float f = fbm(p + 1.7 * r);

  // palette
  vec3 base = vec3(0.043, 0.051, 0.063);   // #0B0D10
  vec3 emerald = vec3(0.063, 0.725, 0.506); // #10b981
  vec3 teal = vec3(0.02, 0.55, 0.65);
  vec3 deep = vec3(0.10, 0.18, 0.55);      // deep blue

  float f1 = smoothstep(-0.25, 0.85, f);
  float f2 = smoothstep(-0.4, 0.9, q.x);
  float f3 = smoothstep(-0.2, 0.95, r.y);

  vec3 col = base;
  col = mix(col, deep, f3 * 0.55);
  col = mix(col, teal, f2 * f1 * 0.65);
  col = mix(col, emerald, pow(f1, 2.2) * 0.85);

  // bright silk crease highlights
  float crease = pow(clamp(f1 * f3, 0.0, 1.0), 3.0);
  col += vec3(0.25, 0.85, 0.65) * crease * 0.22;

  // keep the center calm so the copy reads; let edges glow
  vec2 c = uv - vec2(0.5, 0.52);
  c.x *= aspect * 0.8;
  float veil = smoothstep(0.18, 0.85, length(c));
  col = mix(base, col, 0.25 + 0.75 * veil);

  // darken toward very top (navbar) and bottom (horizon)
  col *= 1.0 - 0.45 * smoothstep(0.8, 1.0, uv.y);
  col *= 1.0 - 0.25 * smoothstep(0.12, 0.0, uv.y);

  // film grain
  float grain = fract(sin(dot(uv * uRes.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.02;

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: reduced ? 40 : 0 },
      uRes: { value: new THREE.Vector2(mount.clientWidth, mount.clientHeight) },
      uMouse: { value: new THREE.Vector2(0, 0) },
    };

    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms }),
    );
    scene.add(quad);

    let lastTime = performance.now();
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = 0;
    let running = false;

    const renderFrame = (dt: number) => {
      uniforms.uTime.value += dt;
      mouse.x += (mouse.tx - mouse.x) * 0.03;
      mouse.y += (mouse.ty - mouse.y) * 0.03;
      uniforms.uMouse.value.set(mouse.x, mouse.y);
      renderer.render(scene, camera);
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      renderFrame(Math.min((now - lastTime) / 1000, 0.05));
      lastTime = now;
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      lastTime = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    if (reduced) {
      renderFrame(0);
    } else {
      start();
    }

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0 });
    io.observe(mount);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    const onPointerMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (!reduced) window.addEventListener("pointermove", onPointerMove, { passive: true });

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      uniforms.uRes.value.set(w, h);
      if (reduced) renderFrame(0);
    });
    ro.observe(mount);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      quad.geometry.dispose();
      (quad.material as THREE.Material).dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} aria-hidden className="absolute inset-0" />;
}
