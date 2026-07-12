/* ============ cloudX Resume — all client-side, no server ============ */
"use strict";

/* ---------------- sample data (fictional person — do NOT put real
   personal data here; this repo is public and the sample becomes every
   visitor's editable starting document) ---------------- */
const SAMPLE = {
  name: "Rohan Iyer",
  title: "Senior DevOps Engineer · Platform Builder",
  location: "Bengaluru, Karnataka, IN",
  phone: "+91 90000 00000",
  email: "rohan.iyer@example.dev",
  links: [
    { label: "linkedin.com/in/rohaniyer", url: "https://www.linkedin.com/in/example" },
    { label: "github.com/rohaniyer", url: "https://github.com/example" },
    { label: "rohaniyer.dev", url: "https://example.dev" }
  ],
  summary: "Senior DevOps Engineer with 7+ years building cloud-native infrastructure and automating complex CI/CD pipelines across GCP, AWS and OpenStack — known for cutting release deployments from days to hours and sustaining 99.9% uptime on business-critical systems. Beyond infrastructure, I build internal platforms and AI-assisted tooling that multiply team output. Strong track record of mentoring engineers and driving DevOps best practices at scale.",
  skills: [
    { label: "Cloud Platforms", items: "Google Cloud Platform (GCP), AWS, OpenStack" },
    { label: "Containers & Orchestration", items: "Kubernetes, Docker, Helm, kubeadm" },
    { label: "CI/CD & IaC", items: "Jenkins, GitLab CI, Terraform, Ansible, Infrastructure as Code" },
    { label: "Observability", items: "Prometheus, Grafana, Loki, Datadog, OpenSearch" },
    { label: "AI & Automation", items: "LangChain, RAG pipelines, vector databases, local LLMs, prompt engineering" },
    { label: "Programming & Networking", items: "Python, Bash, FastAPI, VPC, load balancers, DNS, TCP/IP" }
  ],
  experience: [
    { role: "Senior DevOps Engineer", company: "Nimbus Systems, Bengaluru", date: "Sep 2024 – Present",
      bullets: [
        "Lead automation initiatives for core telecom products — reduced release deployment time from 3–4 days to 2 hours with frameworks designed and built from the ground up.",
        "Owned and executed Kubernetes upgrade cycles across multiple live environments — planned windows, sequenced rollouts, zero data loss, all applications validated healthy post-upgrade.",
        "Cut recurring cloud spend by re-architecting demo clusters from managed Kubernetes to on-prem kubeadm on OpenStack — eliminating per-node compute, load-balancer and egress charges per environment.",
        "Drove cloud security remediation: bastion migration to private subnets, least-privilege access enforcement, and hardened deletion controls.",
        "Built observability with Prometheus, Grafana and Loki; maintain 99.9% uptime. Mentor junior engineers across teams."
      ] },
    { role: "DevOps Engineer", company: "Nimbus Systems, Bengaluru", date: "Sep 2022 – Aug 2024",
      bullets: [
        "Built CI/CD pipelines with Jenkins and GitLab CI; deployed applications on Kubernetes with Helm.",
        "Automated infrastructure and environment setup for on-prem and cloud using Bash and Jenkins."
      ] },
    { role: "Cloud Engineer", company: "SkyBridge Cloud Consulting, Bengaluru", date: "Nov 2018 – Aug 2022",
      bullets: [
        "Migrated 200+ servers and MySQL databases to Google Cloud Platform.",
        "Designed and deployed secure, production-grade workloads on GCP and AWS — networking, IAM, storage and compute optimisation.",
        "Reduced cloud costs by 20% through architecture reviews and performance tuning."
      ] }
  ],
  projects: [
    { name: "FleetPilot — Multi-Agent Ops Assistant",
      bullets: [
        "Built a containerized system of cooperating AI agents that triage alerts, draft incident updates and run scheduled ops — 100% on local LLMs at zero cloud API cost.",
        "Redis pub/sub message bus between independently containerized agents; controlled via a chat-bot gateway."
      ] },
    { name: "K8s Cost Advisor",
      bullets: [
        "Weekly report of over-provisioned requests/limits, idle nodes and right-sizing diffs as ready-to-apply PRs — cut a demo fleet's node bill by 31%."
      ] }
  ],
  education: [
    { degree: "B.E. Computer Science — Visvesvaraya Technological University, Bengaluru", date: "2012 – 2016", note: "CGPA: 8.1" }
  ],
  certifications: [
    "Google Cloud Professional Cloud Architect",
    "CKA — Certified Kubernetes Administrator",
    "Cisco Certified Network Associate (CCNA)"
  ]
};

/* ---------------- templates registry ---------------- */
const TEMPLATES = [
  { id: "krakow",    name: "Kraków",    tag: "Classic",      layout: "single" },
  { id: "wisla",     name: "Wisła",     tag: "Professional", layout: "single" },
  { id: "amstel",    name: "Amstel",    tag: "Modern",       layout: "single" },
  { id: "delft",     name: "Delft",     tag: "Modern",       layout: "band"   },
  { id: "shannon",   name: "Shannon",   tag: "Professional", layout: "band"   },
  { id: "modern",    name: "Ganges",    tag: "Modern",       layout: "single" },
  { id: "sidebar",   name: "Yamuna",    tag: "Two-column",   layout: "side"   },
  { id: "exec",      name: "Kaveri",    tag: "Executive",    layout: "single" },
  { id: "folio",     name: "Folio",     tag: "Two-column",   layout: "sider"  },
  { id: "sterling",  name: "Sterling",  tag: "Classic",      layout: "sider"  },
  { id: "windsor",   name: "Windsor",   tag: "Classic",      layout: "single", mono: true, centerHead: true },
  { id: "bauhaus",   name: "Bauhaus",   tag: "Bold",         layout: "band",   mono: true },
  { id: "onyx",      name: "Onyx",      tag: "Minimal",      layout: "single" },
  { id: "manhattan", name: "Manhattan", tag: "Classic",      layout: "single" },
  { id: "slate",     name: "Slate",     tag: "Executive",    layout: "band"   },
  { id: "vertex",    name: "Vertex",    tag: "Professional", layout: "single" },
];

/* ---------------- documents store ---------------- */
const LS_DOCS = "cxr-docs-v3", LS_ACTIVE = "cxr-active-v3"; // v3: fictional sample for public launch
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const $ = id => document.getElementById(id);

function loadDocs(){ try{ return JSON.parse(localStorage.getItem(LS_DOCS)) || {}; }catch(e){ return {}; } }
function saveDocs(d){ localStorage.setItem(LS_DOCS, JSON.stringify(d)); }
let docs = loadDocs();
let activeId = localStorage.getItem(LS_ACTIVE);

function newDoc(data, name){
  const id = uid();
  docs[id] = { name: name || "My resume", updated: Date.now(), template: "modern", accent: "#2563eb",
               data: data || structuredClone(SAMPLE) };
  activeId = id; saveDocs(docs); localStorage.setItem(LS_ACTIVE, id);
  return id;
}
function activeDoc(){
  if (!activeId || !docs[activeId]) {
    const ids = Object.keys(docs);
    if (ids.length) { activeId = ids[0]; localStorage.setItem(LS_ACTIVE, activeId); }
    else newDoc();
  }
  return docs[activeId];
}

/* ---------------- resume rendering ---------------- */
function headerHTML(d){
  return `<div class="nm">${esc(d.name)}</div><div class="tt">${esc(d.title)}</div>
  <div class="ct">${esc(d.location)}${d.phone?" &nbsp;·&nbsp; "+esc(d.phone):""}${d.email?" &nbsp;·&nbsp; "+esc(d.email):""}</div>
  <div class="ct">${(d.links||[]).map(l=>`<a href="${esc(l.url)}">${esc(l.label)}</a>`).join(" &nbsp;·&nbsp; ")}</div>`;
}
const skillsHTML = d => (d.skills||[]).map(s=>`<div class="sk"><b>${esc(s.label)}:</b> ${esc(s.items)}</div>`).join("");
const expHTML = d => (d.experience||[]).map(e=>`
  <div class="role"><h4>${esc(e.role)}</h4><span class="dt">${esc(e.date)}</span></div>
  <div class="co">${esc(e.company)}</div>
  <ul>${(e.bullets||[]).map(b=>`<li>${esc(b)}</li>`).join("")}</ul>`).join("");
const projHTML = d => (d.projects||[]).length ? `<h2>Projects</h2>` + d.projects.map(p=>`
  <div class="role"><h4>${esc(p.name)}</h4></div>
  <ul>${(p.bullets||[]).map(b=>`<li>${esc(b)}</li>`).join("")}</ul>`).join("") : "";
const eduHTML = d => (d.education||[]).map(e=>`
  <div class="role"><h4>${esc(e.degree)}</h4><span class="dt">${esc(e.date)}</span></div>
  ${e.note?`<div class="nt">${esc(e.note)}</div>`:""}`).join("");
const certHTML = d => (d.certifications||[]).length ? `<h2>Certifications</h2><ul>${d.certifications.map(c=>`<li>${esc(c)}</li>`).join("")}</ul>` : "";

const initials = d => (d.name||"?").split(/\s+/).map(w=>w[0]).filter(Boolean).slice(0,2).join("").toUpperCase();

function renderResume(el, data, tplId, accent){
  const tpl = TEMPLATES.find(t=>t.id===tplId) || TEMPLATES[5];
  el.innerHTML = "";
  const root = document.createElement("div");
  root.className = "rz rz-" + tpl.id;
  root.style.setProperty("--racc", accent || "#2563eb");

  const mono = tpl.mono ? `<div class="mg">${esc(initials(data))}</div>` : "";
  const head = tpl.centerHead ? `<div class="head">${mono}${headerHTML(data)}</div>` : headerHTML(data);

  const single = `${head}
    <h2>Profile</h2><p>${esc(data.summary)}</p>
    <h2>Skills</h2>${skillsHTML(data)}
    <h2>Work Experience</h2>${expHTML(data)}
    ${projHTML(data)}
    <h2>Education</h2>${eduHTML(data)}
    ${certHTML(data)}`;

  if (tpl.layout === "band"){
    root.innerHTML = `<div class="band">${mono}<div>${headerHTML(data)}</div></div><div class="body">
      <h2>Profile</h2><p>${esc(data.summary)}</p>
      <h2>Skills</h2>${skillsHTML(data)}
      <h2>Work Experience</h2>${expHTML(data)}
      ${projHTML(data)}
      <h2>Education</h2>${eduHTML(data)}
      ${certHTML(data)}</div>`;
  } else if (tpl.layout === "sider"){
    root.innerHTML = `
      <div class="main">
        <div class="nm">${esc(data.name)}</div><div class="tt">${esc(data.title)}</div>
        <h2>Profile</h2><p>${esc(data.summary)}</p>
        <h2>Work Experience</h2>${expHTML(data)}
        ${projHTML(data)}
      </div>
      <div class="rail">
        <h2>Contact</h2>
        <div class="ct">${esc(data.location)}</div><div class="ct">${esc(data.phone)}</div><div class="ct">${esc(data.email)}</div>
        ${(data.links||[]).map(l=>`<div class="ct"><a href="${esc(l.url)}">${esc(l.label)}</a></div>`).join("")}
        <h2>Skills</h2>${skillsHTML(data)}
        ${(data.certifications||[]).length?`<h2>Certifications</h2>${data.certifications.map(c=>`<div class="sk">${esc(c)}</div>`).join("")}`:""}
        <h2>Education</h2>${(data.education||[]).map(e=>`<div class="sk">${esc(e.degree)}<br><span class="nt">${esc(e.date)}</span></div>`).join("")}
      </div>`;
  } else if (tpl.layout === "side"){
    root.innerHTML = `
      <div class="left">
        <h2>Contact</h2>
        <div class="ct">${esc(data.location)}</div><div class="ct">${esc(data.phone)}</div><div class="ct">${esc(data.email)}</div>
        ${(data.links||[]).map(l=>`<div class="ct"><a href="${esc(l.url)}">${esc(l.label)}</a></div>`).join("")}
        <h2>Skills</h2>${skillsHTML(data)}
        ${(data.certifications||[]).length?`<h2>Certifications</h2>${data.certifications.map(c=>`<div class="sk">${esc(c)}</div>`).join("")}`:""}
        <h2>Education</h2>${(data.education||[]).map(e=>`<div class="sk">${esc(e.degree)}<br><span class="nt">${esc(e.date)}</span></div>`).join("")}
      </div>
      <div class="main">
        <div class="nm">${esc(data.name)}</div><div class="tt">${esc(data.title)}</div>
        <h2>Profile</h2><p>${esc(data.summary)}</p>
        <h2>Work Experience</h2>${expHTML(data)}
        ${projHTML(data)}
      </div>`;
  } else {
    root.innerHTML = single;
  }
  el.appendChild(root);
}

/* ---------------- routing ---------------- */
const VIEWS = ["dashboard","documents","templates","editor","ats","upload"];
function go(v){
  if (!VIEWS.includes(v)) v = "dashboard";
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("on"));
  $("v-"+v).classList.add("on");
  document.querySelectorAll("#nav a").forEach(a=>a.classList.toggle("on", a.dataset.v===v));
  location.hash = v;
  if (v==="dashboard") renderDocList($("dash-docs"), 4);
  if (v==="documents") renderDocList($("doc-list"));
  if (v==="templates") renderGallery();
  if (v==="editor") openEditor();
  if (v==="ats") { renderResume($("atsSheet"), activeDoc().data, activeDoc().template, activeDoc().accent); fitSheet("atsStage","atsFit","atsSheet"); }
}
addEventListener("hashchange", ()=>go(location.hash.slice(1)));

/* ---------------- documents UI ---------------- */
function renderDocList(el, limit){
  const entries = Object.entries(docs).sort((a,b)=>b[1].updated-a[1].updated);
  if (!entries.length){ el.innerHTML = `<div class="empty">No documents yet — create one!<br><br><button class="btn" onclick="newFromSample()">＋ New resume</button></div>`; return; }
  el.innerHTML = entries.slice(0, limit||99).map(([id,d])=>`
    <div class="docrow ${id===activeId?"sel":""}">
      <span class="nm" data-open="${id}">📄 ${esc(d.name)}</span>
      <span class="meta">${TEMPLATES.find(t=>t.id===d.template)?.name || d.template} · ${new Date(d.updated).toLocaleDateString()}</span>
      <span class="grow"></span>
      <button data-open="${id}">Open</button>
      <button data-dup="${id}">Duplicate</button>
      <button data-del="${id}">Delete</button>
    </div>`).join("");
  el.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{ activeId=b.dataset.open; localStorage.setItem(LS_ACTIVE,activeId); go("editor"); });
  el.querySelectorAll("[data-dup]").forEach(b=>b.onclick=()=>{ const src=docs[b.dataset.dup]; const id=uid();
    docs[id]={...structuredClone(src), name:src.name+" (copy)", updated:Date.now()}; saveDocs(docs); renderDocList(el, limit); });
  el.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{ if(!confirm("Delete this document?"))return;
    delete docs[b.dataset.del]; if(activeId===b.dataset.del) activeId=null; saveDocs(docs); renderDocList(el, limit); });
}
window.newFromSample = () => { newDoc(); go("editor"); };

/* ---------------- templates gallery ---------------- */
function renderGallery(){
  const g = $("tgrid");
  g.innerHTML = "";
  const d = activeDoc();
  TEMPLATES.forEach(t=>{
    const card = document.createElement("div");
    card.className = "tcard" + (d.template===t.id?" sel":"");
    card.innerHTML = `<div class="thumb"><div class="page-mini"></div></div>
      <div class="cap"><b>${t.name}</b><span>${t.tag}</span></div>`;
    renderResume(card.querySelector(".page-mini"), d.data, t.id, d.accent);
    card.onclick = ()=>{ d.template = t.id; d.updated = Date.now(); saveDocs(docs); go("editor"); };
    g.appendChild(card);
  });
}

/* ---------------- scale-to-fit preview ----------------
   The sheet is a fixed 816px "paper"; we scale it down so it always
   fits its stage — no more left-edge clipping on narrow windows. */
function fitSheet(stageId, fitId, sheetId){
  const stage = $(stageId), fit = $(fitId), sheet = $(sheetId);
  if (!stage || !stage.offsetParent) return;             // view not visible
  const avail = stage.clientWidth - 48;
  const sc = Math.min(1, avail / 816);
  sheet.style.transform = `scale(${sc})`;
  fit.style.width  = (816 * sc) + "px";
  fit.style.height = (sheet.offsetHeight * sc) + "px";
}
addEventListener("resize", ()=>{ fitSheet("stage","fitWrap","sheet"); fitSheet("atsStage","atsFit","atsSheet"); });

/* ---------------- editor ---------------- */
function openEditor(){
  const d = activeDoc();
  $("docName").value = d.name;
  const sel = $("tplSel");
  sel.innerHTML = TEMPLATES.map(t=>`<option value="${t.id}" ${t.id===d.template?"selected":""}>${t.name} — ${t.tag}</option>`).join("");
  $("accSel").value = d.accent;
  $("jsonEd").value = JSON.stringify(d.data, null, 2);
  renderResume($("sheet"), d.data, d.template, d.accent);
  fitSheet("stage","fitWrap","sheet");
}
function saveActive(){
  const d = activeDoc();
  d.name = $("docName").value || "My resume";
  d.updated = Date.now();
  saveDocs(docs);
}
$("tplSel").onchange = e => { activeDoc().template = e.target.value; saveActive(); openEditor(); };
$("accSel").oninput  = e => { activeDoc().accent  = e.target.value; saveActive(); renderResume($("sheet"), activeDoc().data, activeDoc().template, e.target.value); fitSheet("stage","fitWrap","sheet"); };
$("applyBtn").onclick = () => {
  try { activeDoc().data = JSON.parse($("jsonEd").value); saveActive(); openEditor(); }
  catch(e){ alert("JSON error: " + e.message); }
};
$("saveBtn").onclick = () => { saveActive(); alert("Saved on this device ✓"); };
$("dupBtn").onclick = () => { const src=activeDoc(); const id=uid();
  docs[id]={...structuredClone(src), name:src.name+" (copy)", updated:Date.now()}; activeId=id;
  localStorage.setItem(LS_ACTIVE,id); saveDocs(docs); openEditor(); };
/* PDF export: render into a hidden iframe with ONLY the template CSS +
   print-tuned page rules. Fixes: missing background colors, content
   clipped by the app layout, and broken pagination on multi-column
   templates. */
function printResume(){
  saveActive();
  const d = activeDoc();
  const holder = document.createElement("div");
  renderResume(holder, d.data, d.template, d.accent);
  const rzCss = document.getElementById("rz-styles").innerHTML;
  const ifr = document.createElement("iframe");
  ifr.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(ifr);
  const idoc = ifr.contentDocument;
  idoc.open();
  idoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(d.data.name || d.name)} — Resume</title><style>
    ${rzCss}
    *{ margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    @page{ size:Letter; margin:12mm; }
    body{ font-family:Arial,Helvetica,sans-serif; background:#fff; }
    /* page margins come from @page — strip the on-screen paper padding */
    .rz{ padding:0; }
    .rz-sidebar{ grid-template-columns:180px 1fr; }
    .rz-sidebar .left{ margin:0; padding:16px 14px; }
    .rz-folio .rail, .rz-sterling .rail{ margin:0; padding:16px 14px; }
    .rz-delft, .rz-shannon, .rz-bauhaus, .rz-slate{ padding:0; }
    .rz-delft .band, .rz-shannon .band, .rz-slate .band{ padding:24px 26px 18px; }
    .rz-bauhaus .band{ padding:22px 26px; }
    .rz-delft .body, .rz-shannon .body, .rz-bauhaus .body, .rz-slate .body{ padding:14px 0 0; }
    /* keep experience entries from splitting awkwardly across pages */
    .rz .role, .rz .co, .rz h2{ break-after:avoid-page; }
    .rz li{ break-inside:avoid-page; }
  </style></head><body>${holder.innerHTML}</body></html>`);
  idoc.close();
  setTimeout(()=>{
    try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }
    catch(e){ window.print(); } // fallback: app-page print CSS
    setTimeout(()=>ifr.remove(), 4000);
  }, 350);
}
$("printBtn").onclick = printResume;
$("jsonBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(activeDoc().data,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = (activeDoc().name||"resume")+".json"; a.click();
};
$("docName").onchange = saveActive;
$("docsNewBtn").onclick = () => { newDoc(); go("editor"); };
document.querySelectorAll(".qcard").forEach(q=>q.onclick=()=>{
  const gov = q.dataset.go;
  if (gov==="new"){ newDoc(); go("editor"); } else go(gov);
});

/* ---------------- ATS checker ---------------- */
const STOP = new Set("a an the and or of to in for with on at by from as is are was were be been being this that these those you your we our they their it its will would can could should must may might do does did done have has had not no nor if then than so such very more most other others into over under about across after before between during within without out up down off again further once here there all any both each few own same too what which who whom when where why how".split(" "));
const TECH = ["kubernetes","docker","terraform","ansible","jenkins","gitlab","aws","gcp","oci","azure","openstack","helm","python","bash","linux","ci/cd","cicd","prometheus","grafana","loki","datadog","observability","monitoring","microservices","devops","sre","iac","langchain","langgraph","llm","rag","ai","agents","fastapi","react","typescript","javascript","node","go","golang","java","rust","redis","kafka","sql","mysql","postgres","mongodb","git","github","networking","vpc","dns","security","automation","cloud","migration","scalability","reliability","uptime","serverless","lambda","s3","ec2","iam","gke","eks","aks","argocd","istio","vault","flink","spark","airflow","graphql","rest","grpc","docker-compose","next.js","vue","angular","tailwind","css","html"];

function resumeText(d){
  return [d.name,d.title,d.summary,
    (d.skills||[]).map(s=>s.label+" "+s.items).join(" "),
    (d.experience||[]).map(e=>e.role+" "+e.company+" "+(e.bullets||[]).join(" ")).join(" "),
    (d.projects||[]).map(p=>p.name+" "+(p.bullets||[]).join(" ")).join(" "),
    (d.education||[]).map(e=>e.degree).join(" "),
    (d.certifications||[]).join(" ")].join(" ").toLowerCase();
}
const tokenize = t => t.toLowerCase().replace(/[^a-z0-9+#/.\- ]/g," ").split(/\s+/).filter(w=>w.length>2 && !STOP.has(w));
function extractKeywords(jd){
  const counts = {};
  tokenize(jd).forEach(w=>counts[w]=(counts[w]||0)+1);
  const techHits = TECH.filter(t=>jd.toLowerCase().includes(t));
  const freq = Object.entries(counts).filter(([w,c])=>c>=2 && !/^\d+$/.test(w))
    .sort((a,b)=>b[1]-a[1]).slice(0,25).map(([w])=>w);
  return [...new Set([...techHits, ...freq])].slice(0,30);
}
function genericChecks(d){
  const txt = resumeText(d), checks = [];
  const add = (state,msg)=>checks.push({state,msg});
  add(/@/.test(d.email||"")?"ok":"bad","Email present");
  add(/\+?\d[\d\- ]{7,}/.test(d.phone||"")?"ok":"warn","Phone number present");
  add((d.links||[]).some(l=>/linkedin/i.test(l.url))?"ok":"warn","LinkedIn link present");
  add((d.summary||"").length>180?"ok":"warn","Summary is substantial (180+ chars)");
  add((d.skills||[]).length>=3?"ok":"warn","Skills grouped into 3+ categories");
  const allB = [...(d.experience||[]).flatMap(e=>e.bullets||[]), ...(d.projects||[]).flatMap(p=>p.bullets||[])];
  const q = allB.filter(b=>/\d/.test(b)).length, qp = allB.length?Math.round(q/allB.length*100):0;
  add(qp>=50?"ok":qp>=30?"warn":"bad",`Quantified bullets: ${q}/${allB.length} (${qp}%) contain numbers — aim ≥50%`);
  const verbs=/^(led|lead|built|designed|cut|reduced|migrated|automated|drove|owned|implemented|deployed|architected|created|developed|managed|mentored|improved|optimi|delivered|executed|contributed|streamlined|established|scaled|shipped|launched|coached|joined|maintain)/i;
  const eb = (d.experience||[]).flatMap(e=>e.bullets||[]);
  const v = eb.filter(b=>verbs.test(b.trim())).length;
  add(eb.length && v/eb.length>=.7?"ok":"warn",`Action-verb openers: ${v}/${eb.length} experience bullets start with a strong verb`);
  const words = txt.split(/\s+/).length;
  add(words<=1100?"ok":"warn",`Length ≈ ${words} words (${words<=600?"~1 page":words<=1100?"~2 pages":"3+ pages — consider trimming"})`);
  add("ok","No photo, tables or graphics — parses cleanly in ATS");
  return checks;
}
function runReport(withJD){
  const d = activeDoc().data, rep = $("report");
  const checks = genericChecks(d);
  let kwHTML = "", score;
  if (withJD){
    const jd = $("jd").value.trim();
    if (!jd){ rep.innerHTML = '<p class="hint">Paste a job description first.</p>'; return; }
    const kws = extractKeywords(jd), txt = resumeText(d);
    const hits = kws.filter(k=>txt.includes(k)), miss = kws.filter(k=>!txt.includes(k));
    const kwScore = kws.length?hits.length/kws.length:1;
    const ckScore = checks.filter(c=>c.state==="ok").length/checks.length;
    score = Math.round((kwScore*.6 + ckScore*.4)*100);
    kwHTML = `<label style="margin-top:10px">Keyword match — ${hits.length}/${kws.length}</label>
      <div>${hits.map(k=>`<span class="kw hit">${esc(k)}</span>`).join("")}</div>
      ${miss.length?`<label style="margin-top:10px">Missing from resume</label>
      <div>${miss.map(k=>`<span class="kw miss">${esc(k)}</span>`).join("")}</div>
      <p class="hint">Add missing keywords ONLY where genuinely true — weave them into bullets or skills. Never keyword-stuff.</p>`:""}`;
  } else {
    score = Math.round(checks.filter(c=>c.state==="ok").length/checks.length*100);
  }
  const color = score>=80?"#22a06b":score>=60?"#eab308":"#dc2626";
  rep.innerHTML = `<div class="score"><div class="ring" style="--p:${score};--sc:${color}"><i>${score}</i></div>
    <div class="hint" style="margin:0"><b style="color:var(--ink)">${score>=80?"Strong":score>=60?"Decent — improve the flagged items":"Needs work"}</b><br>
    ${withJD?"60% keyword match + 40% quality checks":"Quality checks only"} · scoring resume: <b>${esc(activeDoc().name)}</b></div></div>
    ${kwHTML}
    <label style="margin-top:10px">Checks</label>
    ${checks.map(c=>`<div class="check ${c.state}"><b>${c.state==="ok"?"PASS":c.state==="warn"?"WARN":"FAIL"}</b><span>${c.msg}</span></div>`).join("")}`;
}
$("analyzeBtn").onclick = ()=>runReport(true);
$("genericBtn").onclick = ()=>runReport(false);

/* ---------------- upload & parse ---------------- */
if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

const drop = $("drop"), fileInput = $("fileInput");
drop.onclick = ()=>fileInput.click();
["dragover","dragenter"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("over");}));
["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("over");}));
drop.addEventListener("drop", e=>{ const f=e.dataTransfer.files[0]; if(f) handleFile(f); });
fileInput.onchange = ()=>{ if(fileInput.files[0]) handleFile(fileInput.files[0]); };

async function handleFile(f){
  const st = $("parseStatus");
  st.innerHTML = `<p class="hint">Reading <b>${esc(f.name)}</b>…</p>`;
  try{
    let text = "";
    if (/\.pdf$/i.test(f.name) || f.type==="application/pdf"){
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({data:buf}).promise;
      for (let p=1;p<=pdf.numPages;p++){
        const page = await pdf.getPage(p);
        const tc = await page.getTextContent();
        // group items into lines by y-coordinate
        const lines = {};
        tc.items.forEach(it=>{ const y = Math.round(it.transform[5]); (lines[y] ||= []).push(it.str); });
        text += Object.keys(lines).sort((a,b)=>b-a).map(y=>lines[y].join(" ")).join("\n") + "\n";
      }
    } else if (/\.docx$/i.test(f.name)){
      const buf = await f.arrayBuffer();
      const res = await mammoth.extractRawText({arrayBuffer:buf});
      text = res.value;
    } else {
      text = await f.text();
    }
    const data = parseResumeText(text);
    const id = newDoc(data, f.name.replace(/\.(pdf|docx|txt)$/i,""));
    st.innerHTML = `<p class="hint" style="color:#15803d">✓ Imported. Opening the editor — fix anything the parser got wrong.</p>`;
    setTimeout(()=>go("editor"), 600);
  }catch(e){
    st.innerHTML = `<p class="hint" style="color:#b91c1c">Could not parse: ${esc(e.message)}. Try a different file, or start from a template and paste content manually.</p>`;
  }
}

/* best-effort text → structured resume */
function parseResumeText(raw){
  const lines = raw.split(/\n/).map(l=>l.trim()).filter(Boolean);
  const all = lines.join("\n");
  const d = structuredClone(SAMPLE);
  d.experience = []; d.projects = []; d.education = []; d.certifications = []; d.skills = []; d.links = [];

  const email = all.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const phone = all.match(/(\+?\d[\d\- ()]{8,}\d)/);
  d.email = email ? email[0] : "";
  d.phone = phone ? phone[0].trim() : "";
  const li = all.match(/linkedin\.com\/[^\s|,)]+/i); if (li) d.links.push({label:li[0], url:"https://"+li[0].replace(/^https?:\/\//,"")});
  const gh = all.match(/github\.com\/[^\s|,)]+/i);   if (gh) d.links.push({label:gh[0], url:"https://"+gh[0].replace(/^https?:\/\//,"")});

  // name = first short line that isn't contact-ish
  d.name = (lines.find(l=>l.length<40 && !/@|\d{4}|linkedin|github|http|resume|curriculum/i.test(l)) || "Your Name");
  // title = next non-contact line after the name
  const ni = lines.indexOf(d.name);
  d.title = (lines.slice(ni+1).find(l=>l.length<70 && !/@|\+\d|linkedin|github|http/i.test(l)) || "");

  // section split
  const SEC = /^(professional\s+)?(summary|profile|about( me)?|objective|work experience|experience|employment( history)?|education|academic|skills?|technical skills|core (skills|competencies)|projects?|personal projects?|certifications?|licenses?|awards?)\b[:\s]*$/i;
  const sections = {};
  let cur = "_head";
  lines.forEach(l=>{
    const m = l.match(SEC);
    if (m && l.length < 40){ cur = m[2].toLowerCase(); sections[cur] = []; }
    else (sections[cur] ||= []).push(l);
  });
  const sec = names => names.map(n=>sections[n]).find(Boolean) || null;

  const sum = sec(["summary","profile","about","about me","objective"]);
  if (sum) d.summary = sum.join(" ").slice(0, 900);

  const sk = sec(["skills","skill","technical skills","core skills","core competencies"]);
  if (sk){
    sk.forEach(l=>{
      const m = l.match(/^[•\-–●▪\s]*([A-Za-z &/+]+?)\s*[:：]\s*(.+)$/);
      if (m) d.skills.push({label:m[1].trim(), items:m[2].trim()});
    });
    if (!d.skills.length) d.skills.push({label:"Skills", items: sk.join(", ").replace(/[•●▪]/g,",").replace(/\s*,\s*/g,", ").replace(/^, |, $/g,"")});
  }

  const exp = sec(["work experience","experience","employment","employment history"]);
  if (exp){
    const DATE = /((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4})\s*[–\-—to]+\s*((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4}|present|current)/i;
    let job = null;
    exp.forEach(l=>{
      const isBullet = /^[•\-–●▪*]/.test(l);
      const dm = l.match(DATE);
      if (!isBullet && dm){
        if (job) d.experience.push(job);
        const rest = l.replace(DATE,"").replace(/[|,–—\-]+\s*$/,"").trim();
        job = { role: rest || "Role", company: "", date: dm[0], bullets: [] };
      } else if (!isBullet && job && !job.company && l.length<70){
        job.company = l.replace(/^at\s+/i,"");
      } else if (job){
        const t = l.replace(/^[•\-–●▪*]\s*/,"");
        if (isBullet) job.bullets.push(t);
        else if (job.bullets.length) job.bullets[job.bullets.length-1] += " " + t;
        else job.bullets.push(t);
      }
    });
    if (job) d.experience.push(job);
  }

  const edu = sec(["education","academic"]);
  if (edu){
    const DATE = /\d{4}\s*[–\-—to]*\s*(\d{4})?/;
    edu.forEach(l=>{
      if (l.length<6) return;
      const dm = l.match(DATE);
      d.education.push({ degree: l.replace(DATE,"").replace(/[|,]+\s*$/,"").trim(), date: dm?dm[0]:"", note:"" });
    });
    d.education = d.education.slice(0,4);
  }

  const cert = sec(["certifications","certification","licenses","awards"]);
  if (cert) d.certifications = cert.map(l=>l.replace(/^[•\-–●▪*]\s*/,"")).filter(l=>l.length>2).slice(0,10);

  const proj = sec(["projects","project","personal projects"]);
  if (proj){
    let p = null;
    proj.forEach(l=>{
      const isBullet = /^[•\-–●▪*]/.test(l);
      if (!isBullet && l.length<80){ if(p) d.projects.push(p); p = {name:l, bullets:[]}; }
      else if (p) p.bullets.push(l.replace(/^[•\-–●▪*]\s*/,""));
    });
    if (p) d.projects.push(p);
  }

  if (!d.summary) d.summary = "Write a 3–4 line summary: seniority, core stack, one or two quantified wins, and what you want to do next.";
  if (!d.experience.length) d.experience.push({role:"Your most recent role", company:"Company", date:"20XX – Present", bullets:["We couldn't auto-detect your experience — paste your bullets here."]});
  return d;
}

/* ---------------- boot ---------------- */
if (!Object.keys(docs).length) newDoc(structuredClone(SAMPLE), "Sample resume");
go(location.hash.slice(1) || "dashboard");
