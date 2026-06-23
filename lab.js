/* ============ cloudx // lab v7 — vibrant energy orb (Active-Theory-inspired) ============
   Pure black, a living sphere that morphs and flows through cool vibrant color,
   bright fresnel rim, strong bloom, drifting dust, custom cursor, loader. */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

/* ---------- custom cursor ---------- */
const cur = document.getElementById("cursor"), dot = document.getElementById("cursorDot");
const cs = { x: innerWidth / 2, y: innerHeight / 2, dx: innerWidth / 2, dy: innerHeight / 2 };
addEventListener("pointermove", (e) => { cs.x = e.clientX; cs.y = e.clientY; dot.style.transform = `translate(${cs.x}px,${cs.y}px)`; });
(function curLoop() { cs.dx += (cs.x - cs.dx) * 0.18; cs.dy += (cs.y - cs.dy) * 0.18; cur.style.transform = `translate(${cs.dx}px,${cs.dy}px)`; requestAnimationFrame(curLoop); })();
document.querySelectorAll("[data-hover], a").forEach((el) => {
  el.addEventListener("pointerenter", () => cur.classList.add("big"));
  el.addEventListener("pointerleave", () => cur.classList.remove("big"));
});

/* ---------- renderer ---------- */
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // compress highlights, keep color
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 5.8);

/* ---------- vibrant energy orb (custom shader) ---------- */
const group = new THREE.Group();
group.position.set(0, 0.3, 0);
scene.add(group);

const uniforms = { uTime: { value: 0 }, uMouse: { value: 0 } };

const vert = `
uniform float uTime;
varying vec3 vNormal; varying vec3 vView; varying float vN;
float wave(vec3 p, float t){
  return sin(p.x*1.6+t)*0.45 + sin(p.y*1.9-t*0.9)*0.3 + sin(p.z*2.2+t*1.15)*0.22
       + sin((p.x+p.z)*1.3+t*0.7)*0.18 + sin((p.y-p.x)*2.6-t*1.3)*0.12;
}
void main(){
  vec3 n = normalize(position);
  float w = wave(n*2.1, uTime);
  vN = w;
  vec3 p = position + normal * w * 0.26;
  vec4 mv = modelViewMatrix * vec4(p,1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const frag = `
precision highp float;
uniform float uTime;
varying vec3 vNormal; varying vec3 vView; varying float vN;
vec3 pal(float t){
  vec3 blue   = vec3(0.10,0.32,1.00);
  vec3 cyan   = vec3(0.15,0.95,1.00);
  vec3 violet = vec3(0.55,0.28,1.00);
  vec3 magenta= vec3(1.00,0.25,0.82);
  vec3 c = mix(blue, cyan,   smoothstep(-0.6,0.6, sin(t)));
  c = mix(c, violet,        smoothstep(-0.6,0.6, sin(t*1.27+1.3)));
  c = mix(c, magenta, 0.45 * smoothstep(0.0,1.0, sin(t*0.8+2.1)));
  return c;
}
void main(){
  float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.2);
  vec3 col = pal(vN*3.2 + uTime*0.5);
  col *= 0.55 + vN*0.32;                      // internal light variation
  col += vec3(0.40,0.85,1.0) * fres * 0.7;    // cool rim glow (peaks bloom)
  gl_FragColor = vec4(col, 1.0);
}`;

const orbMat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag });
const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 6), orbMat);
group.add(orb);

/* soft inner core glow */
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.95, 3),
  new THREE.MeshBasicMaterial({ color: 0x1740ff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending })
);
group.add(core);

/* ---------- drifting dust ---------- */
const dustN = 700, dpos = new Float32Array(dustN * 3);
for (let i = 0; i < dustN; i++) {
  const r = 3 + Math.random() * 9, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
  dpos[i * 3] = r * Math.sin(ph) * Math.cos(th);
  dpos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
  dpos[i * 3 + 2] = r * Math.cos(ph);
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  color: 0x86c8ff, size: 0.02, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending,
}));
scene.add(dust);

/* ---------- bloom ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.4, 0.72);
composer.addPass(bloom);

/* ---------- interaction ---------- */
const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener("pointermove", (e) => { ptr.tx = e.clientX / innerWidth - 0.5; ptr.ty = e.clientY / innerHeight - 0.5; });
let dragging = false, dragX = 0, dragY = 0, lx = 0, ly = 0;
addEventListener("pointerdown", (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
addEventListener("pointermove", (e) => { if (dragging) { dragX += (e.clientX - lx) * 0.005; dragY += (e.clientY - ly) * 0.005; lx = e.clientX; ly = e.clientY; } });
addEventListener("pointerup", () => { dragging = false; });
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});

/* ---------- loop ---------- */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  uniforms.uTime.value = reduce ? 4.0 : t * 0.8;
  ptr.x += (ptr.tx - ptr.x) * 0.04; ptr.y += (ptr.ty - ptr.y) * 0.04;
  group.rotation.y = (reduce ? 0.3 : t * 0.12) + dragX + ptr.x * 0.6;
  group.rotation.x = (reduce ? 0.1 : Math.sin(t * 0.2) * 0.14) + dragY + ptr.y * 0.4;
  dust.rotation.y = t * 0.015;
  camera.position.x += (ptr.x * 0.7 - camera.position.x) * 0.04;
  camera.position.y += (-ptr.y * 0.5 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);
  composer.render();
  requestAnimationFrame(animate);
}

/* ---------- loader ---------- */
const loader = document.getElementById("loader"), countEl = document.getElementById("count"), barfill = document.getElementById("barfill");
let p = 0;
const tick = setInterval(() => {
  p += Math.max(1.2, (100 - p) * 0.07);
  if (p >= 100) { p = 100; clearInterval(tick); setTimeout(() => { loader.classList.add("done"); document.body.classList.add("ready"); }, 250); }
  countEl.textContent = Math.floor(p); barfill.style.width = p + "%";
}, 55);
animate();
