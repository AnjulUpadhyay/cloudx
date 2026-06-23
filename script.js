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

/* ---- 2. N-dimensional hypercube (3D · 4D · 5D · 6D · 7D · …) ---- */
(function hypercube() {
  const cv = document.getElementById("hcube");
  if (!cv) return;
  const c = cv.getContext("2d");
  const NAMES = { 3: "cube", 4: "tesseract", 5: "penteract", 6: "hexeract", 7: "hepteract" };
  const caption = document.getElementById("dim-caption");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let D = 4, verts = [], edges = [];
  function build(dim) {
    D = dim;
    verts = [];
    for (let i = 0; i < (1 << D); i++) {
      const v = [];
      for (let k = 0; k < D; k++) v.push((i & (1 << k)) ? 1 : -1);
      verts.push(v);
    }
    edges = [];
    for (let i = 0; i < verts.length; i++)
      for (let j = i + 1; j < verts.length; j++) {
        let diff = 0;
        for (let k = 0; k < D; k++) if (verts[i][k] !== verts[j][k]) diff++;
        if (diff === 1) edges.push([i, j]);
      }
    if (caption)
      caption.innerHTML =
        `<b>${NAMES[D] || D + "-cube"}</b> · ${D}-cube — ${verts.length} vertices · ${edges.length} edges`;
  }
  build(4);

  const rot = (p, a, i, j) => {
    const s = Math.sin(a), co = Math.cos(a), pi = p[i], pj = p[j];
    p[i] = pi * co - pj * s; p[j] = pi * s + pj * co;
  };

  // drag to rotate the spatial planes
  let ax = 0.5, ay = 0.6, dragging = false, lastX = 0, lastY = 0;
  cv.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    ay += (e.clientX - lastX) * 0.01;
    ax += (e.clientY - lastY) * 0.01;
    lastX = e.clientX; lastY = e.clientY;
  });
  const stop = () => { dragging = false; };
  cv.addEventListener("pointerup", stop);
  cv.addEventListener("pointerleave", stop);

  let t = 0;
  function frame() {
    t += reduce ? 0 : 0.016;
    const dpr = Math.min(devicePixelRatio, 2);
    const w = cv.clientWidth || 420, h = cv.clientHeight || 420;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const spin = dragging || reduce ? 0 : t * 0.25; // gentle auto-spin when idle

    // project every vertex to raw 2D (centered at 0), then auto-fit
    const raw = verts.map((vert) => {
      const p = vert.slice();
      rot(p, ax, 0, 2);
      rot(p, ay + spin, 1, 2);
      rot(p, t * 0.3, 0, 1);
      for (let j = 3; j < D; j++)
        for (let i = 0; i < j; i++) rot(p, t * (0.16 + 0.05 * j + 0.012 * i), i, j);
      // collapse higher dims down to 3 via perspective
      for (let k = D - 1; k >= 3; k--) {
        const wv = 1 / (2.7 - p[k]);
        for (let i = 0; i < k; i++) p[i] *= wv;
      }
      const s = 1 / (3 - p[2]);
      return { x: p[0] * s, y: p[1] * s, depth: p[2] };
    });

    let maxAbs = 0.0001;
    for (const r of raw) { maxAbs = Math.max(maxAbs, Math.abs(r.x), Math.abs(r.y)); }
    const scale = (Math.min(w, h) * 0.42) / maxAbs;
    let dMin = Infinity, dMax = -Infinity;
    for (const r of raw) { dMin = Math.min(dMin, r.depth); dMax = Math.max(dMax, r.depth); }
    const pts = raw.map((r) => ({ x: cx + r.x * scale, y: cy + r.y * scale, depth: r.depth }));

    const a1 = skyColors.a1, a2 = skyColors.a2;
    c.lineWidth = 1.1; c.lineJoin = "round";
    c.shadowColor = `rgba(${a1},0.8)`; c.shadowBlur = 8;
    for (const [i, j] of edges) {
      const p = pts[i], q = pts[j];
      const dn = ((p.depth + q.depth) / 2 - dMin) / ((dMax - dMin) || 1); // 0 far → 1 near
      const al = 0.25 + dn * 0.7;
      const g = c.createLinearGradient(p.x, p.y, q.x, q.y);
      g.addColorStop(0, `rgba(${a1},${al})`);
      g.addColorStop(1, `rgba(${a2},${al * 0.8})`);
      c.strokeStyle = g;
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
    }
    c.shadowBlur = 0;
    for (const p of pts) {
      const dn = (p.depth - dMin) / ((dMax - dMin) || 1);
      c.fillStyle = `rgba(${a1},${0.5 + dn * 0.5})`;
      c.beginPath(); c.arc(p.x, p.y, 1.4 + dn * 1.6, 0, 7); c.fill();
    }
    requestAnimationFrame(frame);
  }
  frame();

  document.getElementById("dim-dial").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-d]");
    if (!b) return;
    document.querySelectorAll("#dim-dial button").forEach((x) => x.classList.toggle("active", x === b));
    build(+b.dataset.d);
  });
})();

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
initSky();
drawSky();

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
