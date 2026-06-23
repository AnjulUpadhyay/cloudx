/* ============ cloudx // lab v8 — dark edge sphere ============
   Key fix: center is DARK, only the rim is bright.
   Bloom only catches rim pixels → no white blob. */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

/* ---------- cursor ---------- */
const cur = document.getElementById("cursor"), dot = document.getElementById("cursorDot");
const cs = { x: innerWidth/2, y: innerHeight/2, dx: innerWidth/2, dy: innerHeight/2 };
addEventListener("pointermove", e => { cs.x=e.clientX; cs.y=e.clientY; dot.style.transform=`translate(${cs.x}px,${cs.y}px)`; });
(function curLoop(){ cs.dx+=(cs.x-cs.dx)*0.18; cs.dy+=(cs.y-cs.dy)*0.18; cur.style.transform=`translate(${cs.dx}px,${cs.dy}px)`; requestAnimationFrame(curLoop); })();
document.querySelectorAll("[data-hover],a").forEach(el=>{
  el.addEventListener("pointerenter",()=>cur.classList.add("big"));
  el.addEventListener("pointerleave",()=>cur.classList.remove("big"));
});

/* ---------- renderer ---------- */
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85; // darker overall → no blowout

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 0, 5.8);

/* ---------- orb ---------- */
const group = new THREE.Group();
group.position.set(0, 0.15, 0);
scene.add(group);

const uniforms = { uTime:{ value:0 } };

const vert = `
uniform float uTime;
varying vec3 vNormal; varying vec3 vView; varying float vN;
float wave(vec3 p, float t){
  return sin(p.x*1.7+t*1.0)*0.28 + sin(p.y*2.1-t*0.85)*0.22
       + sin(p.z*1.5+t*0.95)*0.18 + sin((p.x+p.y)*1.4-t*0.6)*0.13;
}
void main(){
  vec3 n = normalize(position);
  float w = wave(n*2.1, uTime);
  vN = w;
  vec3 p = position + normal * w * 0.20;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

/* THE FIX: col *= pow(rim, …) → center goes near-black, only edges light up */
const frag = `
precision highp float;
uniform float uTime;
varying vec3 vNormal; varying vec3 vView; varying float vN;
vec3 pal(float t){
  vec3 indigo  = vec3(0.06, 0.08, 0.55);
  vec3 violet  = vec3(0.42, 0.05, 0.88);
  vec3 royalB  = vec3(0.12, 0.35, 1.00);
  float s  = 0.5+0.5*sin(t);
  float s2 = 0.5+0.5*sin(t*1.3+1.1);
  return mix(mix(indigo, violet, s), royalB, s2*0.45);
}
void main(){
  float ndv = max(dot(normalize(vNormal), normalize(vView)), 0.0);
  float rim  = 1.0 - ndv;               // 0 at center, 1 at edge
  vec3 col = pal(vN*2.5 + uTime*0.32);
  col *= pow(rim, 1.2) * 2.4;           // dark center, mid-bright flank
  col += vec3(0.5, 0.72, 1.0) * pow(rim, 4.0) * 3.2; // hot rim → bloom catches this
  gl_FragColor = vec4(col, 1.0);
}`;

const orb = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.1, 5),
  new THREE.ShaderMaterial({ uniforms, vertexShader:vert, fragmentShader:frag })
);
group.add(orb);

/* thin orbit rings for depth */
const ringMat1 = new THREE.MeshBasicMaterial({ color:0x2255ff, transparent:true, opacity:0.55, blending:THREE.AdditiveBlending });
const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.58, 0.007, 8, 128), ringMat1);
ring1.rotation.x = Math.PI * 0.38;
group.add(ring1);

const ringMat2 = new THREE.MeshBasicMaterial({ color:0x7733ee, transparent:true, opacity:0.3, blending:THREE.AdditiveBlending });
const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.76, 0.004, 8, 128), ringMat2);
ring2.rotation.x = Math.PI * 0.14;
ring2.rotation.y = Math.PI * 0.32;
group.add(ring2);

/* ---------- gold + cool drifting particles ---------- */
const N = 900;
const pos = new Float32Array(N*3), colBuf = new Float32Array(N*3);
for(let i=0;i<N;i++){
  const r=2.8+Math.random()*9, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
  pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.sin(ph)*Math.sin(th); pos[i*3+2]=r*Math.cos(ph);
  if(i<N*0.65){                             // 65% gold/amber
    colBuf[i*3]=0.9+Math.random()*0.1; colBuf[i*3+1]=0.55+Math.random()*0.3; colBuf[i*3+2]=0.05+Math.random()*0.15;
  } else {                                   // 35% cool blue
    colBuf[i*3]=0.3+Math.random()*0.3; colBuf[i*3+1]=0.5+Math.random()*0.3; colBuf[i*3+2]=0.9+Math.random()*0.1;
  }
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(pos,3));
dustGeo.setAttribute("color", new THREE.BufferAttribute(colBuf,3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  size:0.026, vertexColors:true, transparent:true, opacity:0.65, depthWrite:false, blending:THREE.AdditiveBlending
}));
scene.add(dust);

/* ---------- bloom — high threshold → only hot rim pixels glow ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), 0.55, 0.35, 0.84);
composer.addPass(bloom);

/* ---------- interaction ---------- */
const ptr = { x:0, y:0, tx:0, ty:0 };
let dragging=false, dragX=0, dragY=0, lx=0, ly=0;
addEventListener("pointermove", e=>{
  ptr.tx=e.clientX/innerWidth-0.5; ptr.ty=e.clientY/innerHeight-0.5;
  if(dragging){ dragX+=(e.clientX-lx)*0.005; dragY+=(e.clientY-ly)*0.005; lx=e.clientX; ly=e.clientY; }
});
addEventListener("pointerdown", e=>{ dragging=true; lx=e.clientX; ly=e.clientY; });
addEventListener("pointerup", ()=>{ dragging=false; });
addEventListener("resize", ()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight);
});

/* ---------- loop ---------- */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = new THREE.Clock();
function animate(){
  const t = clock.getElapsedTime();
  uniforms.uTime.value = reduce ? 3.0 : t*0.7;
  ptr.x+=(ptr.tx-ptr.x)*0.04; ptr.y+=(ptr.ty-ptr.y)*0.04;
  group.rotation.y = (reduce?0.3:t*0.1) + dragX + ptr.x*0.6;
  group.rotation.x = (reduce?0.1:Math.sin(t*0.18)*0.12) + dragY + ptr.y*0.4;
  dust.rotation.y = t*0.013;
  dust.rotation.x = t*0.005;
  camera.position.x += (ptr.x*0.65 - camera.position.x)*0.04;
  camera.position.y += (-ptr.y*0.45 - camera.position.y)*0.04;
  camera.lookAt(0,0,0);
  composer.render();
  requestAnimationFrame(animate);
}

/* ---------- loader ---------- */
const loader=document.getElementById("loader"), countEl=document.getElementById("count"), barfill=document.getElementById("barfill");
let p=0;
const tick=setInterval(()=>{
  p+=Math.max(1.2,(100-p)*0.07);
  if(p>=100){ p=100; clearInterval(tick); setTimeout(()=>{ loader.classList.add("done"); document.body.classList.add("ready"); },250); }
  countEl.textContent=Math.floor(p); barfill.style.width=p+"%";
},55);
animate();
