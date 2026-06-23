/* ============ cloudx // lab — breathing point-cloud orb (elegant, monochrome) ============ */
import * as THREE from "three";

const COL = { point: 0x9fd0ff, glow: 0x7cc7ff, bg: 0x080a0f };

const canvas = document.getElementById("scene");
const loading = document.getElementById("loading");

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  loading.textContent = "this device can't run WebGL — try a desktop browser.";
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(COL.bg, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(COL.bg, 0.12);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 7);

/* ---- the orb: fine points on a sphere, displaced by flowing noise ---- */
const group = new THREE.Group();
scene.add(group);

const R = 2.0;
const baseGeo = new THREE.IcosahedronGeometry(R, 5); // dense, even point distribution
const basePos = baseGeo.attributes.position.array.slice();
const N = baseGeo.attributes.position.count;

// deduplicate-ish not needed; render all as points
const orbGeo = new THREE.BufferGeometry();
orbGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(basePos), 3));
const orbMat = new THREE.PointsMaterial({
  color: COL.point, size: 0.018, sizeAttenuation: true,
  transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
});
const orb = new THREE.Points(orbGeo, orbMat);
group.add(orb);

// faint wireframe shell for structure
const shell = new THREE.LineSegments(
  new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R * 1.001, 2)),
  new THREE.LineBasicMaterial({ color: COL.glow, transparent: true, opacity: 0.08 })
);
group.add(shell);

// a few drifting motes around the orb for depth
const moteN = 600, motePos = new Float32Array(moteN * 3);
for (let i = 0; i < moteN; i++) {
  const r = 3 + Math.random() * 7, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
  motePos[i * 3] = r * Math.sin(ph) * Math.cos(th);
  motePos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
  motePos[i * 3 + 2] = r * Math.cos(ph);
}
const moteGeo = new THREE.BufferGeometry();
moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
  color: COL.glow, size: 0.02, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending,
}));
scene.add(motes);

/* ---- layout: push the orb to the right on wide screens so text stays clear ---- */
function layout() {
  const wide = innerWidth / innerHeight > 1.05;
  group.position.x = wide ? R * 1.15 : 0;
  group.position.y = wide ? 0 : -R * 0.2;
  const fit = wide ? 1 : Math.min(1, innerWidth / 720);
  group.scale.setScalar(fit);
}
layout();

/* ---- interaction ---- */
const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener("pointermove", (e) => { ptr.tx = e.clientX / innerWidth - 0.5; ptr.ty = e.clientY / innerHeight - 0.5; });
let dragging = false, dragX = 0, lastX = 0;
addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; });
addEventListener("pointermove", (e) => { if (dragging) { dragX += (e.clientX - lastX) * 0.005; lastX = e.clientX; } });
addEventListener("pointerup", () => { dragging = false; });
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  layout();
  if (composer) composer.setSize(innerWidth, innerHeight);
});

/* ---- flowing displacement ---- */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const pos = orbGeo.attributes.position.array;
function displace(t) {
  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    const bx = basePos[i3], by = basePos[i3 + 1], bz = basePos[i3 + 2];
    // smooth multi-wave "noise" along the surface normal
    const n =
      Math.sin(bx * 1.6 + t * 0.9) * 0.5 +
      Math.sin(by * 1.9 - t * 0.7) * 0.3 +
      Math.sin(bz * 2.3 + t * 1.1) * 0.2;
    const k = 1 + 0.11 * n;
    pos[i3] = bx * k; pos[i3 + 1] = by * k; pos[i3 + 2] = bz * k;
  }
  orbGeo.attributes.position.needsUpdate = true;
}

/* ---- bloom (graceful fallback) ---- */
let composer = null;
async function setupBloom() {
  try {
    const { EffectComposer } = await import("three/addons/postprocessing/EffectComposer.js");
    const { RenderPass } = await import("three/addons/postprocessing/RenderPass.js");
    const { UnrealBloomPass } = await import("three/addons/postprocessing/UnrealBloomPass.js");
    const c = new EffectComposer(renderer);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.7, 0.6, 0.1));
    return c;
  } catch (e) { return null; }
}

const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  if (!reduce) displace(t);
  ptr.x += (ptr.tx - ptr.x) * 0.04;
  ptr.y += (ptr.ty - ptr.y) * 0.04;
  group.rotation.y = (reduce ? 0 : t * 0.05) + dragX + ptr.x * 0.5;
  group.rotation.x = ptr.y * 0.35;
  shell.rotation.y = -t * 0.03;
  motes.rotation.y = t * 0.012;
  camera.position.x += (ptr.x * 0.6 - camera.position.x) * 0.04;
  camera.position.y += (-ptr.y * 0.4 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);
  if (composer) composer.render(); else renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

setupBloom().then((c) => { composer = c; loading.classList.add("hidden"); animate(); });
