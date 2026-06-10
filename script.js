/* ============ CloudX — dynamic bits ============ */

/* ---- 1. Typing effect ---- */
const phrases = [
  "Senior DevOps Engineer",
  "OCI | GCP | AWS | OpenStack",
  "Kubernetes · Terraform · Ansible",
  "deploys: 3-4 days → 2 hours",
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
  ['c-green',  '$ kubectl get experience -o wide'],
  ['c-purple', '  NAME        STATUS    RESTARTS   AGE'],
  ['',         '  automation  Running   0          7y+'],
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
    ctx.fillStyle = "rgba(56,189,248,0.55)";
    ctx.fill();
  }
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 130) {
        ctx.strokeStyle = `rgba(129,140,248,${(1 - d / 130) * 0.18})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    const m = particles[i];
    const dm = Math.hypot(m.x - mouse.x, m.y - mouse.y);
    if (dm < 170) {
      ctx.strokeStyle = `rgba(52,211,153,${(1 - dm / 170) * 0.35})`;
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
  { threshold: 0.12 }
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

/* ---- 6. Live GitHub repos ---- */
const LANG_COLORS = {
  Java: "#b07219", Python: "#3572A5", JavaScript: "#f1e05a", TypeScript: "#3178c6",
  HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", Go: "#00ADD8",
  Dockerfile: "#384d54", HCL: "#844FBA",
};
async function loadRepos() {
  const grid = document.getElementById("repo-grid");
  try {
    const res = await fetch("https://api.github.com/users/AnjulUpadhyay/repos?sort=updated&per_page=12");
    if (!res.ok) throw new Error(res.status);
    const repos = (await res.json()).filter((r) => !r.fork);
    if (!repos.length) throw new Error("empty");
    grid.innerHTML = "";
    for (const r of repos) {
      const a = document.createElement("a");
      a.className = "repo-card";
      a.href = r.html_url;
      a.target = "_blank";
      a.rel = "noopener";
      const color = LANG_COLORS[r.language] || "#8b949e";
      a.innerHTML = `
        <div class="repo-head">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="#93a0b8"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/></svg>
          <span class="repo-name">${r.name}</span>
        </div>
        <p class="repo-desc">${r.description || "No description yet — but the code speaks for itself."}</p>
        <div class="repo-meta">
          ${r.language ? `<span><span class="lang-dot" style="background:${color}"></span>${r.language}</span>` : ""}
          <span>★ ${r.stargazers_count}</span>
          <span>⑂ ${r.forks_count}</span>
        </div>`;
      grid.appendChild(a);
    }
  } catch {
    grid.innerHTML =
      '<p class="error-msg">Couldn\'t reach GitHub right now — see <a href="https://github.com/AnjulUpadhyay" style="color:var(--accent)">github.com/AnjulUpadhyay</a> instead.</p>';
  }
}
loadRepos();

/* ---- 7. Footer year ---- */
document.getElementById("year").textContent = new Date().getFullYear();
