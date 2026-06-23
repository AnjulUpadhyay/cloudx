/* ============ cloudx.os — interactive terminal shell ============ */

const screen = document.getElementById("screen");
const output = document.getElementById("output");
const promptLine = document.getElementById("prompt-line");
const cmdText = document.getElementById("cmd-text");
const stdin = document.getElementById("stdin");

/* ---- output helpers ---- */
function scrollBottom() { screen.scrollTop = screen.scrollHeight; }
function print(html = "", cls = "") {
  const d = document.createElement("div");
  d.className = "line" + (cls ? " " + cls : "");
  d.innerHTML = html;
  output.appendChild(d);
  scrollBottom();
  return d;
}
function gap() { print("", "gap"); }
function esc(s) { return String(s).replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m])); }

/* ---- theme ---- */
const THEMES = ["midnight", "nebula", "aurora", "synthwave"];
function applyTheme(name) {
  if (!THEMES.includes(name)) return false;
  document.documentElement.dataset.theme = name;
  localStorage.setItem("cloudx-theme", name);
  document.querySelectorAll(".theme-dot").forEach((d) =>
    d.classList.toggle("active", d.dataset.theme === name));
  return true;
}
document.querySelectorAll(".theme-dot").forEach((d) =>
  d.addEventListener("click", () => { applyTheme(d.dataset.theme); focusInput(); }));
applyTheme(document.documentElement.dataset.theme || "midnight");

/* ============ content commands ============ */
const commands = {};

commands.help = () => {
  print('<span class="dim"># available commands — type one, or tap a chip below</span>');
  const rows = [
    ["about", "who I am, in one screen"],
    ["skills", "the full toolbox"],
    ["experience", "career timeline"],
    ["certs", "certifications"],
    ["projects", "things I've built"],
    ["brahmaand", "flagship AI project (★)"],
    ["stats", "career by the numbers"],
    ["contact", "email · github · linkedin"],
    ["theme", "theme <midnight|nebula|aurora|synthwave>"],
    ["neofetch", "system summary"],
    ["clear", "clear the screen"],
  ];
  rows.forEach(([c, d]) => print(`  <span class="g">${c.padEnd(11)}</span><span class="dim">${d}</span>`));
};

commands.about = () => {
  print('<span class="dim">$ cat about.txt</span>');
  print("<b>Anjul Upadhyay</b> — Senior DevOps Engineer @ <span class='g'>Oracle</span>, Bengaluru.");
  gap();
  print("I make deploys <b>boring</b>: infrastructure as code, CI/CD that catches");
  print("problems before production does, and observability that surfaces issues");
  print("before users notice. 7+ years across <span class='g'>OCI · GCP · AWS · OpenStack</span>.");
  gap();
  print("These days I also build <b>autonomous AI agent systems</b> — multi-agent");
  print("orchestration with <span class='b'>LangChain</span>, <span class='b'>LangGraph</span> and local LLMs.");
  gap();
  print("<span class='dim'>next: try </span><span class='g'>skills</span><span class='dim'>, </span><span class='g'>experience</span><span class='dim'>, </span><span class='g'>projects</span><span class='dim'> or </span><span class='g'>brahmaand</span>");
};
commands.whoami = () => print("anjul-upadhyay · senior-devops-engineer · oracle · bengaluru");

commands.skills = () => {
  print('<span class="dim">$ ls ~/skills</span>');
  const groups = [
    ["Cloud", "Oracle Cloud (OCI) · Google Cloud · AWS · OpenStack"],
    ["Containers", "Kubernetes · Docker · Podman · Helm · OKE · kubeadm"],
    ["CI/CD & IaC", "Jenkins · GitLab CI · Terraform · Ansible"],
    ["Observability", "Prometheus · Grafana · Loki · Promtail · Datadog · OpenSearch"],
    ["AI / Agents", "LangChain · LangGraph · RAG · Vector DBs · Ollama · multi-agent"],
    ["Networking", "VPC · Load Balancers · NAT · TCP/IP · DNS"],
    ["Languages", "Python · Bash · Java · YAML"],
  ];
  groups.forEach(([k, v]) => print(`  <span class="label">${k.padEnd(14)}</span> ${v}`));
};

commands.experience = commands.exp = () => {
  print('<span class="dim">$ git log --oneline ~/career</span>');
  const jobs = [
    ["Sep 2024 — now", "Senior Member of Technical Staff · Oracle",
      ["Lead automation — cut deploys from 3–4 days to <b>2 hours</b>",
       "Built automation frameworks for Oracle's core telecom products",
       "Observability via Prometheus/Grafana/Loki · 99.9% uptime on OCI",
       "Mentor engineers, drive DevOps best practices across teams"]],
    ["Sep 2022 — Aug 2024", "Member of Technical Staff · Oracle",
      ["CI/CD pipelines with Jenkins & GitLab CI",
       "Deployed Oracle apps on Kubernetes with Helm",
       "Automated infra & environment setup for on-prem and OCI"]],
    ["Oct 2020 — Aug 2022", "Associate Member of Technical Staff · Oracle",
      ["K8s deployments & early CI/CD for telecom core products",
       "Built internal demo environments used across product teams"]],
    ["Nov 2018 — Oct 2020", "Cloud Engineer · Powerup Cloud (acq. by LTI)",
      ["Migrated <b>200+ servers</b> & MySQL DBs to Google Cloud",
       "Secure production workloads on GCP & AWS",
       "Cut cloud costs <b>20%</b> via architecture reviews & tuning"]],
  ];
  jobs.forEach(([date, role, items]) => {
    gap();
    print(`<span class="y">●</span> <span class="b">${role}</span>`);
    print(`  <span class="dim">${date}</span>`);
    items.forEach((it) => print(`    <span class="g">▹</span> ${it}`));
  });
};

commands.certs = commands.certifications = () => {
  print('<span class="dim">$ cat ~/certifications</span>');
  ["Google Cloud — Professional Cloud Architect",
   "Oracle Cloud Infrastructure — Architect Associate",
   "Oracle Cloud Infrastructure — Foundations Certified Associate",
   "Cisco Certified Network Associate (CCNA)",
   "Networking in Google Cloud — Coursera Specialization",
  ].forEach((c) => print(`  <span class="y">🏅</span> ${c}`));
};

commands.stats = () => {
  print('<span class="dim">$ cat ~/metrics</span>');
  const s = [
    ["7+", "years in DevOps"],
    ["200+", "servers migrated to cloud"],
    ["99.9%", "uptime maintained"],
    ["20%", "cloud costs cut"],
    ["3-4d → 2h", "deployment time"],
    ["12+", "AI agents in Brahmaand"],
  ];
  s.forEach(([n, l]) => print(`  <span class="g">${n.padEnd(11)}</span><span class="dim">${l}</span>`));
};

commands.projects = () => {
  print('<span class="dim">$ ls ~/projects</span>');
  const p = [
    ["Brahmaand", "★ runs 100% locally",
      "12+ agent autonomous AI system · local LLMs · $0/mo cloud cost",
      "Python · Ollama · Redis · Docker · LangGraph", "brahmaand"],
    ["cloudx.co.in", "● live",
      "This site — an interactive terminal OS, hand-coded, zero frameworks",
      "HTML · CSS · JS · GitHub Pages · Cloudflare", "https://github.com/AnjulUpadhyay/cloudx"],
    ["Deploy Automation Framework", "🔒 internal · Oracle",
      "Built from scratch — release deploys from 3–4 days to 2 hours",
      "Jenkins · Helm · Kubernetes · Bash", null],
    ["On-Prem K8s Demo Lab", "🔒 internal · Oracle",
      "kubeadm on OpenStack replacing managed cloud K8s — big cost cut",
      "kubeadm · OpenStack · Longhorn · NFS", null],
  ];
  p.forEach(([name, status, desc, stack, link]) => {
    gap();
    const title = link
      ? (link.startsWith("http")
          ? `<a href="${link}" target="_blank" rel="noopener">${name}</a>`
          : `<span class="g">${name}</span>`)
      : `<span class="g">${name}</span>`;
    print(`  ${title}  <span class="tag${status.startsWith("🔒") ? " muted" : ""}">${status}</span>`);
    print(`    <span class="dim">${desc}</span>`);
    print(`    <span class="b">${stack}</span>`);
    if (link && !link.startsWith("http")) print(`    <span class="dim">→ type </span><span class="g">${link}</span>`);
  });
};

commands.brahmaand = () => {
  print('<span class="dim">$ ./brahmaand --status   # ब्रह्माण्ड · "the universe"</span>');
  print("<b>Brahmaand</b> — a fully autonomous, containerized <b>multi-agent AI system</b>");
  print("I designed from scratch: <b>12+ cooperating agents</b> modeled on Hindu");
  print("cosmology, where each deity's cosmic role maps to a system function.");
  gap();
  ["Hierarchical orchestration — a supreme router delegates to the Trinity,",
   "  which manifests specialist avatar agents per task",
   "Runs <b>100% on local LLMs</b> via Ollama — zero cloud cost, full privacy",
   "Redis pub/sub bus across independently containerized agents (Docker)",
   "Driven from anywhere via a Telegram gateway over a secure tunnel",
  ].forEach((l) => print(`  <span class="y">✦</span> ${l}`));
  gap();
  const tree = [
    "        You (Telegram)",
    "              │",
    "         [ INDRA ]  gateway",
    "              │",
    "        [ PARAMATMA ]  supreme router",
    "         ┌────┼─────────┐",
    "         ▼    ▼         ▼",
    "      BRAHMA VISHNU   SHIVA",
    "      create preserve destroy",
    "         │     │        │",
    "       agni  krishna  rudra",
    "       moon  rama     nataraja",
    "             narasimha mahakala",
    "              │",
    "        result → Telegram ✓",
  ];
  tree.forEach((l) => print(`<span class="art">${esc(l)}</span>`));
};

commands.contact = commands.social = () => {
  print('<span class="dim">$ cat ~/contact</span>');
  print(`  <span class="label">email   </span> <a href="mailto:akanjulupadhyay@gmail.com">akanjulupadhyay@gmail.com</a>`);
  print(`  <span class="label">github  </span> <a href="https://github.com/AnjulUpadhyay" target="_blank" rel="noopener">github.com/AnjulUpadhyay</a>`);
  print(`  <span class="label">linkedin</span> <a href="https://www.linkedin.com/in/anjul-upadhyay-2328b69a/" target="_blank" rel="noopener">in/anjul-upadhyay</a>`);
  print(`  <span class="label">location</span> Bengaluru, Karnataka, India`);
  gap();
  print('<span class="dim">open to interesting cloud / DevOps / AI roles — say hi 👋</span>');
};

commands.theme = (args) => {
  const t = (args[0] || "").toLowerCase();
  if (!t) { print(`current theme: <span class="g">${document.documentElement.dataset.theme}</span> · options: ${THEMES.join(" · ")}`); return; }
  if (applyTheme(t)) print(`theme set to <span class="g">${t}</span> ✓`);
  else print(`<span class="err">unknown theme: ${esc(t)}</span> · options: ${THEMES.join(" · ")}`);
};

commands.neofetch = commands.banner = () => {
  const art = [
    "      .--.       ",
    "   .-(    ).     ",
    "  (___.__)__)    ",
    "                 ",
  ];
  const info = [
    `<span class="label">anjul</span>@<span class="label">cloudx</span>`,
    `<span class="dim">-----------------</span>`,
    `<span class="label">OS</span>      cloudx.os 5.0`,
    `<span class="label">host</span>    Senior DevOps Engineer`,
    `<span class="label">uptime</span>  7+ years`,
    `<span class="label">clouds</span>  OCI · GCP · AWS · OpenStack`,
    `<span class="label">stack</span>   k8s · terraform · jenkins · langgraph`,
    `<span class="label">certs</span>   GCP PCA · OCI Architect · CCNA`,
    `<span class="label">email</span>   akanjulupadhyay@gmail.com`,
  ];
  const rows = Math.max(art.length, info.length);
  for (let i = 0; i < rows; i++) {
    const a = art[i] ? `<span class="art">${esc(art[i])}</span>` : "                 ";
    print(`${a}${info[i] || ""}`);
  }
};

commands.clear = () => { output.innerHTML = ""; };
commands.ls = () => print("about  skills  experience  certs  projects  brahmaand  stats  contact");
commands.echo = (args) => print(esc(args.join(" ")));
commands.date = () => print(new Date().toString());
commands.sudo = () => print('<span class="err">nice try.</span> <span class="dim">you already have everything you need 😏</span>');
commands.exit = () => print('<span class="dim">there is no exit — just </span><span class="g">contact</span><span class="dim"> me 🙂</span>');

/* ============ shell ============ */
const history = [];
let hIndex = -1;

function showPrompt(text) {
  print(`<span class="ps1"><span class="u">anjul@cloudx</span><span class="c">:</span><span class="p">~</span><span class="c">$</span> </span>${esc(text)}`);
}
function run(raw) {
  const line = raw.trim();
  showPrompt(raw);
  if (line) {
    history.unshift(line);
    const [name, ...args] = line.split(/\s+/);
    const fn = commands[name.toLowerCase()];
    if (fn) fn(args);
    else print(`<span class="err">command not found: ${esc(name)}</span> — type <span class="g">help</span>`);
  }
  hIndex = -1;
  gap();
  scrollBottom();
}

function focusInput() { stdin.focus({ preventScroll: true }); }
stdin.addEventListener("input", () => { cmdText.textContent = stdin.value; scrollBottom(); });
stdin.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    run(stdin.value);
    stdin.value = ""; cmdText.textContent = "";
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (hIndex < history.length - 1) hIndex++;
    if (history[hIndex]) { stdin.value = history[hIndex]; cmdText.textContent = stdin.value; }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (hIndex > 0) { hIndex--; stdin.value = history[hIndex]; }
    else { hIndex = -1; stdin.value = ""; }
    cmdText.textContent = stdin.value;
  } else if (e.key === "l" && e.ctrlKey) {
    e.preventDefault(); commands.clear();
  }
});
document.getElementById("chips").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-cmd]");
  if (!btn) return;
  run(btn.dataset.cmd);
  focusInput();
});
document.getElementById("win").addEventListener("click", (e) => {
  if (!e.target.closest("a, button")) focusInput();
});

/* ============ boot sequence ============ */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const boot = [
  ['dim', "cloudx.os 5.0  ·  booting anjul@cloudx ..."],
  ['ok',  "[ OK ]  mounting /skills /experience /projects"],
  ['ok',  "[ OK ]  connecting clouds ... OCI · GCP · AWS · OpenStack"],
  ['ok',  "[ OK ]  starting kubernetes control plane (v1.36)"],
  ['ok',  "[ OK ]  launching brahmaand multi-agent runtime (12 agents)"],
  ['ok',  "[ OK ]  observability online · prometheus · grafana · loki"],
  ['g',   "system ready."],
];
let bi = 0;
function bootStep() {
  if (bi < boot.length) {
    const [cls, text] = boot[bi++];
    print(`<span class="${cls === 'ok' ? 'ok' : cls}">${esc(text)}</span>`);
    setTimeout(bootStep, reduce ? 0 : 220);
  } else {
    gap();
    commands.neofetch();
    gap();
    print('<span class="dim">welcome — this portfolio is a terminal. type </span><span class="g">help</span><span class="dim"> or tap a command below.</span>');
    gap();
    promptLine.hidden = false;
    scrollBottom();
    focusInput();
  }
}
bootStep();
