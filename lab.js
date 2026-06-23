/* ============ cloudx // lab — immersive WebGL scene (preview) ============ */
import * as THREE from "three";

let composer = null;
async function tryBloom(renderer, scene, camera) {
  try {
    const { EffectComposer } = await import("three/addons/postprocessing/EffectComposer.js");
    const { RenderPass } = await import("three/addons/postprocessing/RenderPass.js");
    const { UnrealBloomPass } = await import("three/addons/postprocessing/UnrealBloomPass.js");
    const c = new EffectComposer(renderer);
    c.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.9, 0.5, 0.08);
    c.addPass(bloom);
    return c;
  } catch (e) { return null; }
}

const PALETTES = {
  midnight:  { a: 0x38bdf8, b: 0x818cf8, c: 0x34d399, bg: 0x060913 },
  nebula:    { a: 0xfbbf24, b: 0xfb7185, c: 0xc084fc, bg: 0x0e0815 },
  aurora:    { a: 0x34d399, b: 0x2dd4bf, c: 0xa3e635, bg: 0x03100c },
  synthwave: { a: 0xe879f9, b: 0x22d3ee, c: 0xfb7185, bg: 0x120420 },
};

const canvas = document.getElementById("scene");
const loading = document.getElementById("loading");

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  loading.textContent = "your browser/device can't run WebGL — try a desktop browser.";
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 6.5);

let pal = PALETTES[document.documentElement.dataset.theme] || PALETTES.midnight;
scene.fog = new THREE.FogExp2(pal.bg, 0.07);
renderer.setClearColor(pal.bg, 1);

/* ---- central crystal: solid icosahedron + glowing wireframe shell ---- */
const group = new THREE.Group();
scene.add(group);

const coreGeo = new THREE.IcosahedronGeometry(1.5, 0);
const coreMat = new THREE.MeshStandardMaterial({
  color: pal.a, metalness: 0.55, roughness: 0.18,
  flatShading: true, emissive: pal.a, emissiveIntensity: 0.12,
});
const core = new THREE.Mesh(coreGeo, coreMat);
group.add(core);

const wireGeo = new THREE.IcosahedronGeometry(1.62, 1);
const wireMat = new THREE.LineBasicMaterial({ color: pal.b, transparent: true, opacity: 0.45 });
const wire = new THREE.LineSegments(new THREE.WireframeGeometry(wireGeo), wireMat);
group.add(wire);

const haloGeo = new THREE.IcosahedronGeometry(2.55, 1);
const haloMat = new THREE.PointsMaterial({ color: pal.c, size: 0.05, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
const halo = new THREE.Points(haloGeo, haloMat);
group.add(halo);

/* ---- starfield depth ---- */
const starCount = 1400;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 8 + Math.random() * 24, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
  starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
  starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
  starPos[i * 3 + 2] = r * Math.cos(ph);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: pal.a, size: 0.04, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

/* ---- lights ---- */
scene.add(new THREE.AmbientLight(0xffffff, 0.25));
const L1 = new THREE.PointLight(pal.a, 60, 30); L1.position.set(4, 3, 4);
const L2 = new THREE.PointLight(pal.b, 50, 30); L2.position.set(-5, -2, 3);
const L3 = new THREE.PointLight(pal.c, 40, 30); L3.position.set(0, 4, -4);
scene.add(L1, L2, L3);

/* ---- theme switching ---- */
function setTheme(name) {
  pal = PALETTES[name] || PALETTES.midnight;
  document.documentElement.dataset.theme = name;
  localStorage.setItem("cloudx-theme", name);
  coreMat.color.setHex(pal.a); coreMat.emissive.setHex(pal.a);
  wireMat.color.setHex(pal.b);
  haloMat.color.setHex(pal.c);
  starMat.color.setHex(pal.a);
  L1.color.setHex(pal.a); L2.color.setHex(pal.b); L3.color.setHex(pal.c);
  scene.fog.color.setHex(pal.bg); renderer.setClearColor(pal.bg, 1);
  document.querySelectorAll(".dot").forEach((d) => d.classList.toggle("active", d.dataset.theme === name));
}
document.getElementById("dots").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-theme]"); if (b) setTheme(b.dataset.theme);
});
setTheme(document.documentElement.dataset.theme || "midnight");

/* ---- interaction ---- */
const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener("pointermove", (e) => { ptr.tx = e.clientX / innerWidth - 0.5; ptr.ty = e.clientY / innerHeight - 0.5; });
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (composer) composer.setSize(innerWidth, innerHeight);
});

/* ---- render loop ---- */
const clock = new THREE.Clock();
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
function animate() {
  const t = clock.getElapsedTime();
  ptr.x += (ptr.tx - ptr.x) * 0.05; ptr.y += (ptr.ty - ptr.y) * 0.05;
  if (!reduce) {
    group.rotation.y = t * 0.18; group.rotation.x = Math.sin(t * 0.3) * 0.25;
    halo.rotation.y = -t * 0.12; halo.rotation.z = t * 0.08;
    stars.rotation.y = t * 0.01;
    L1.position.x = Math.cos(t * 0.5) * 5; L1.position.z = Math.sin(t * 0.5) * 5;
    L2.position.x = Math.cos(t * 0.4 + 2) * 5; L2.position.y = Math.sin(t * 0.4 + 2) * 4;
  }
  camera.position.x += (ptr.x * 2.2 - camera.position.x) * 0.05;
  camera.position.y += (-ptr.y * 1.6 - camera.position.y) * 0.05;
  camera.lookAt(0, 0, 0);
  if (composer) composer.render(); else renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

tryBloom(renderer, scene, camera).then((c) => {
  composer = c;
  loading.classList.add("hidden");
  animate();
});
