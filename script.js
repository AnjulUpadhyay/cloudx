/* ============ CloudX — dynamic bits ============ */

/* ---- 0. Theme switcher ---- */
const skyColors = { a1: "56,189,248", a2: "129,140,248", a3: "52,211,153" };
function syncSkyColors() {
  const cs = getComputedStyle(document.documentElement);
  skyColors.a1 = cs.getPropertyValue("--a1rgb").trim() || skyColors.a1;
  skyColors.a2 = cs.getPropertyValue("--a2rgb").trim() || skyColors.a2;
  skyColors.a3 = cs.getPropertyValue("--a3rgb").trim() || skyColors.a3;
}
function applyTheme(name) {
  document.documentElement.dataset.theme = name;
  localStorage.setItem("cloudx-theme", name);
  document.querySelectorAll(".theme-dot").forEach((d) =>
    d.classList.toggle("active", d.dataset.theme === name)
  );
  syncSkyColors();
  dispatchEvent(new Event("themechange"));
}
document.querySelectorAll(".theme-dot").forEach((d) =>
  d.addEventListener("click", () => applyTheme(d.dataset.theme))
);
applyTheme(document.documentElement.dataset.theme || "midnight");

/* ---- 1. Typing effect ---- */
const phrases = [
  "Senior DevOps Engineer",
  "I build AI agentic systems",
  "OCI | GCP | AWS | OpenStack",
  "Kubernetes · Terraform · LangGraph",
  "deploys: 3-4 days → 2 hours",
  "12+ agents · 100% local LLMs",
  "terraform apply ✓",
];
const typedEl = document.getElementById("typed");
let pi = 0, ci = 0, deleting = false;

function typeLoop() {
  const phrase = phrases[pi];
  typedEl.textContent = phrase.slice(0, ci);
  if (!deleting) {
    if (ci < phrase.length) { ci++; setTimeout(typeLoop, 55 + Math.random() * 60); }
    else { deleting = true; setTimeout(typeLoop, 1800); }
  } else {
    if (ci > 0) { ci--; setTimeout(typeLoop, 28); }
    else { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(typeLoop, 350); }
  }
}
typeLoop();

/* ---- 2. Terminal boot sequence ---- */
const termLines = [
  ['c-dim',    '# cloudx.co.in — infrastructure status'],
  ['c-green',  '$ whoami'],
  ['',         'anjul-upadhyay · senior-devops-engineer · oracle · bengaluru'],
  ['c-green',  '$ cloud --list-providers'],
  ['c-blue',   '  ✓ oci        [active]'],
  ['c-blue',   '  ✓ gcp        [certified architect]'],
  ['c-blue',   '  ✓ aws        [active]'],
  ['c-blue',   '  ✓ openstack  [active]'],
  ['c-green',  '$ kubectl version --short'],
  ['',         '  Server Version: v1.36 · upgraded with zero data loss'],
  ['c-green',  '$ brahmaand status'],
  ['c-purple', '  AGENT      STATUS    MODEL       COST'],
  ['',         '  12 agents  Running   local-llm   $0.00/mo'],
  ['c-green',  '$ uptime'],
  ['',         '  99.9% · deploys in 2h, down from 3-4 days ☕'],
  ['c-green',  '$ echo "let\'s build something." '],
  ['c-purple', '  let\'s build something.'],
];
const termBody = document.getElementById("term-body");
let li = 0;
function bootLine() {
  if (li >= termLines.length) return;
  const [cls, text] = termLines[li];
  const span = document.createElement("span");
  if (cls) span.className = cls;
  span.textContent = text + "\n";
  termBody.appendChild(span);
  li++;
  setTimeout(bootLine, text.startsWith("$") ? 520 : 200);
}
setTimeout(bootLine, 600);

/* ---- 3. Particle network background ---- */
const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");
let W, H, particles;
const mouse = { x: -9999, y: -9999 };

function initSky() {
  W = canvas.width = innerWidth;
  H = canvas.height = innerHeight;
  const count = Math.min(110, Math.floor((W * H) / 16000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 1.6 + 0.4,
  }));
}
function drawSky() {
  ctx.clearRect(0, 0, W, H);
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > W) p.vx *= -1;
    if (p.y < 0 || p.y > H) p.vy *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${skyColors.a1},0.5)`;
    ctx.fill();
  }
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 130) {
        ctx.strokeStyle = `rgba(${skyColors.a2},${(1 - d / 130) * 0.17})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    const m = particles[i];
    const dm = Math.hypot(m.x - mouse.x, m.y - mouse.y);
    if (dm < 170) {
      ctx.strokeStyle = `rgba(${skyColors.a3},${(1 - dm / 170) * 0.35})`;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
    }
  }
  requestAnimationFrame(drawSky);
}
addEventListener("resize", initSky);
addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
addEventListener("mouseout", () => { mouse.x = -9999; mouse.y = -9999; });

// Run the 2D starfield only when the WebGL galaxy can't take over.
function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (e) { return false; }
}
function startSky2D() { if (!sky2dStarted) { sky2dStarted = true; initSky(); drawSky(); } }
let sky2dStarted = false;
if (!webglOK()) {
  startSky2D();
} else {
  // Safety net: if the Three.js module fails to load, revive the 2D sky.
  setTimeout(() => { if (!document.body.classList.contains("webgl")) startSky2D(); }, 2500);
}

/* ---- 4. Scroll reveal ---- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
  { threshold: 0, rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ---- 5. Animated counters ---- */
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    const decimals = el.dataset.count.includes(".") ? 1 : 0;
    const dur = 1400, t0 = performance.now();
    (function tick(t) {
      const k = Math.min((t - t0) / dur, 1);
      el.textContent = (target * (1 - Math.pow(1 - k, 3))).toFixed(decimals) + suffix;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
    counterIO.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll(".num").forEach((el) => counterIO.observe(el));

/* ---- 6. Footer year ---- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---- 7. 4D tesseract (a hypercube rotating through 4D, projected to 2D) ---- */
(function tesseract() {
  const cv = document.getElementById("tesseract");
  if (!cv || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = cv.getContext("2d");

  // 16 vertices of the 4-cube: every (±1,±1,±1,±1)
  const verts = [];
  for (let i = 0; i < 16; i++)
    verts.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
  // edges connect vertices differing in exactly one coordinate
  const edges = [];
  for (let i = 0; i < 16; i++)
    for (let j = i + 1; j < 16; j++) {
      let diff = 0;
      for (let k = 0; k < 4; k++) if (verts[i][k] !== verts[j][k]) diff++;
      if (diff === 1) edges.push([i, j]);
    }
  const rot = (p, a, i, j) => {
    const s = Math.sin(a), co = Math.cos(a), pi = p[i], pj = p[j];
    p[i] = pi * co - pj * s; p[j] = pi * s + pj * co;
  };

  let t = 0;
  function draw() {
    t += 0.012;
    const dpr = Math.min(devicePixelRatio, 2);
    const w = cv.clientWidth || 140, h = cv.clientHeight || 140;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, scale = Math.min(w, h) * 1.85;

    const proj = verts.map((v) => {
      const p = v.slice();
      rot(p, t * 0.7, 0, 3); // XW plane
      rot(p, t * 0.5, 1, 3); // YW plane
      rot(p, t * 0.9, 2, 3); // ZW plane
      rot(p, t * 0.6, 0, 1); // XY plane
      const k4 = 1 / (3 - p[3]);           // 4D -> 3D perspective
      const x = p[0] * k4, y = p[1] * k4, z = p[2] * k4;
      const k3 = 1 / (3 - z);              // 3D -> 2D perspective
      return { x: cx + x * k3 * scale, y: cy + y * k3 * scale, k: k3 };
    });

    const a1 = skyColors.a1, a2 = skyColors.a2;
    for (const [i, j] of edges) {
      const p = proj[i], q = proj[j];
      const g = c.createLinearGradient(p.x, p.y, q.x, q.y);
      g.addColorStop(0, `rgba(${a1},0.85)`);
      g.addColorStop(1, `rgba(${a2},0.5)`);
      c.strokeStyle = g; c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
    }
    for (const p of proj) {
      c.fillStyle = `rgba(${a1},0.9)`;
      c.beginPath(); c.arc(p.x, p.y, 1.7, 0, 7); c.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ---- 8. 3D parallax tilt on cards ---- */
if (matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll(".skill-card, .work-card, .repo-card, .stat, .about-card").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transition = "transform .08s ease-out";
      el.style.transform =
        `perspective(820px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateZ(10px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "transform .5s ease";
      el.style.transform = "";
    });
  });
}
