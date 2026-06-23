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
