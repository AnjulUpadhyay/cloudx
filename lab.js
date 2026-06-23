/* ============ cloudx // lab v4 — glass relic (Active-Theory-inspired) ============
   Pure black, a luminous refractive glass torus-knot with iridescent caustics,
   bloom, drifting dust, custom cursor, loader. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
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
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 6);

/* environment for glass reflections */
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* ---------- glass relic ---------- */
const group = new THREE.Group();
scene.add(group);

const geo = new THREE.TorusKnotGeometry(1.05, 0.34, 240, 36);
const mat = new THREE.MeshPhysicalMaterial({
  transmission: 1.0, thickness: 1.6, roughness: 0.06, metalness: 0.0,
  ior: 1.42, clearcoat: 1.0, clearcoatRoughness: 0.12,
  iridescence: 1.0, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 760],
  envMapIntensity: 1.5, color: 0xffffff,
  attenuationColor: new THREE.Color(0x4fd2ff), attenuationDistance: 3.0,
});
const relic = new THREE.Mesh(geo, mat);
group.add(relic);

/* colored rim lights for caustic tint */
const l1 = new THREE.PointLight(0x6ee7ff, 40, 24); l1.position.set(4, 2, 4);
const l2 = new THREE.PointLight(0xb07cff, 28, 24); l2.position.set(-4, -2, 2);
const l3 = new THREE.PointLight(0xffffff, 14, 24); l3.position.set(0, 4, -3);
scene.add(l1, l2, l3, new THREE.AmbientLight(0x223044, 0.6));

/* ---------- drifting dust ---------- */
const dustN = 1100, dpos = new Float32Array(dustN * 3);
for (let i = 0; i < dustN; i++) {
  const r = 2.2 + Math.random() * 9, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
  dpos[i * 3] = r * Math.sin(ph) * Math.cos(th);
  dpos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
  dpos[i * 3 + 2] = r * Math.cos(ph);
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  color: 0x9fe8ff, size: 0.022, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
}));
scene.add(dust);

/* ---------- post: bloom ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.5, 0.82);
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
  ptr.x += (ptr.tx - ptr.x) * 0.04; ptr.y += (ptr.ty - ptr.y) * 0.04;
  group.rotation.y = (reduce ? 0.4 : t * 0.16) + dragX + ptr.x * 0.6;
  group.rotation.x = (reduce ? 0.2 : Math.sin(t * 0.25) * 0.18) + dragY + ptr.y * 0.4;
  dust.rotation.y = t * 0.015; dust.rotation.x = t * 0.008;
  l1.position.x = Math.cos(t * 0.5) * 4.5; l1.position.z = Math.sin(t * 0.5) * 4.5;
  camera.position.x += (ptr.x * 0.8 - camera.position.x) * 0.04;
  camera.position.y += (-ptr.y * 0.6 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);
  composer.render();
  requestAnimationFrame(animate);
}

/* ---------- loader ---------- */
const loader = document.getElementById("loader"), countEl = document.getElementById("count"), barfill = document.getElementById("barfill");
let p = 0;
const tick = setInterval(() => {
  p += Math.max(1.2, (100 - p) * 0.07);
  if (p >= 100) { p = 100; clearInterval(tick); reveal(); }
  countEl.textContent = Math.floor(p); barfill.style.width = p + "%";
}, 55);
function reveal() {
  setTimeout(() => { loader.classList.add("done"); document.body.classList.add("ready"); }, 250);
}
animate();
