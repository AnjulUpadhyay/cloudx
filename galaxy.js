/* ============ CloudX — 3D galaxy background (Three.js) ============
   A real WebGL spiral galaxy you can orbit with the mouse. Re-colors per
   theme. If WebGL or the CDN fails, script.js keeps the 2D starfield. */
import * as THREE from "three";

const canvas = document.getElementById("galaxy");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
} catch (e) {
  renderer = null; // script.js falls back to the 2D sky
}

if (renderer) {
  document.body.classList.add("webgl");
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 2.3, 6.5);

  const P = { count: 9000, radius: 9, branches: 4, spin: 1.05, randomness: 0.5, pow: 2.6 };
  let points, geometry, material;

  const cssRGB = (name, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v ? `rgb(${v})` : fallback;
  };

  function buildGalaxy() {
    if (points) { geometry.dispose(); material.dispose(); scene.remove(points); }
    geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(P.count * 3);
    const col = new Float32Array(P.count * 3);
    const inside = new THREE.Color(cssRGB("--a1rgb", "rgb(56,189,248)"));
    const outside = new THREE.Color(cssRGB("--a3rgb", "rgb(52,211,153)"));

    for (let i = 0; i < P.count; i++) {
      const i3 = i * 3;
      const r = Math.random() * P.radius;
      const branch = ((i % P.branches) / P.branches) * Math.PI * 2;
      const spin = r * P.spin;
      const rnd = () => Math.pow(Math.random(), P.pow) * (Math.random() < 0.5 ? 1 : -1) * P.randomness * r;
      pos[i3]     = Math.cos(branch + spin) * r + rnd();
      pos[i3 + 1] = rnd() * 0.45;
      pos[i3 + 2] = Math.sin(branch + spin) * r + rnd();
      const c = inside.clone().lerp(outside, r / P.radius);
      col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(col, 3));
    material = new THREE.PointsMaterial({
      size: 0.045, sizeAttenuation: true, depthWrite: false,
      blending: THREE.AdditiveBlending, vertexColors: true, transparent: true, opacity: 0.95,
    });
    points = new THREE.Points(geometry, material);
    scene.add(points);
  }
  buildGalaxy();

  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => {
    ptr.tx = e.clientX / innerWidth - 0.5;
    ptr.ty = e.clientY / innerHeight - 0.5;
  });
  let scrollY = 0;
  addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });
  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  addEventListener("themechange", buildGalaxy);

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clock = new THREE.Clock();
  function loop() {
    const t = clock.getElapsedTime();
    ptr.x += (ptr.tx - ptr.x) * 0.05;
    ptr.y += (ptr.ty - ptr.y) * 0.05;
    if (points) points.rotation.y = reduce ? 0.3 : t * 0.06;
    const depth = Math.min(scrollY, 1600);
    camera.position.x = ptr.x * 2.4;
    camera.position.y = 2.3 - ptr.y * 1.6 + depth * 0.0016;
    camera.position.z = 6.5 - depth * 0.0009;
    camera.lookAt(0, depth * 0.0008, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
}
