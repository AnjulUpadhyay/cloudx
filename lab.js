/* ============ cloudx // lab v17 — wireframe network globe ============
   A sphere of evenly-distributed nodes (fibonacci) connected by thin
   lines into a network mesh. Glowing nodes, dim edges, and small data
   packets that travel along connections (cloud / DevOps network motif).
   Dark, one accent (cyan), slow rotation. Restraint = elegant. */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

/* cursor */
const cur = document.getElementById("cursor"), dot = document.getElementById("cursorDot");
const cs = { x:innerWidth/2, y:innerHeight/2, dx:innerWidth/2, dy:innerHeight/2 };
addEventListener("pointermove", e=>{ cs.x=e.clientX; cs.y=e.clientY; dot.style.transform=`translate(${cs.x}px,${cs.y}px)`; });
(function L(){ cs.dx+=(cs.x-cs.dx)*.18; cs.dy+=(cs.y-cs.dy)*.18; cur.style.transform=`translate(${cs.dx}px,${cs.dy}px)`; requestAnimationFrame(L); })();
document.querySelectorAll("[data-hover],a").forEach(el=>{
  el.addEventListener("pointerenter",()=>cur.classList.add("big"));
  el.addEventListener("pointerleave",()=>cur.classList.remove("big"));
});

/* renderer */
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 0, 6.2);

const group = new THREE.Group();
group.position.y = 0.12;
scene.add(group);

const ACCENT = new THREE.Color(0x55c8ff);
const ACCENT2 = new THREE.Color(0x7c5cff);

/* ── nodes: fibonacci sphere (even distribution) ── */
const R = 1.7, NODES = 110;
const nodes = [];
const golden = Math.PI * (3 - Math.sqrt(5));
for (let i=0;i<NODES;i++){
  const y = 1 - (i/(NODES-1))*2;
  const rad = Math.sqrt(1 - y*y);
  const th = golden * i;
  nodes.push(new THREE.Vector3(Math.cos(th)*rad*R, y*R, Math.sin(th)*rad*R));
}

/* ── edges: connect each node to its nearest neighbours (deduped) ── */
const K = 3;
const edgeSet = new Set();
const edges = [];
for (let i=0;i<NODES;i++){
  const d = [];
  for (let j=0;j<NODES;j++) if(j!==i) d.push([nodes[i].distanceTo(nodes[j]), j]);
  d.sort((a,b)=>a[0]-b[0]);
  for (let k=0;k<K;k++){
    const j = d[k][1];
    const key = i<j ? i+"_"+j : j+"_"+i;
    if(!edgeSet.has(key)){ edgeSet.add(key); edges.push([i,j]); }
  }
}

/* line geometry for all edges */
const edgePos = new Float32Array(edges.length*2*3);
edges.forEach(([a,b],e)=>{
  edgePos.set([nodes[a].x,nodes[a].y,nodes[a].z], e*6);
  edgePos.set([nodes[b].x,nodes[b].y,nodes[b].z], e*6+3);
});
const edgeGeo = new THREE.BufferGeometry();
edgeGeo.setAttribute("position", new THREE.BufferAttribute(edgePos,3));
const lines = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({
  color: ACCENT, transparent:true, opacity:0.22, blending:THREE.AdditiveBlending, depthWrite:false,
}));
group.add(lines);

/* ── glowing node sprites ── */
const ndC=document.createElement("canvas"); ndC.width=ndC.height=64;
const ndX=ndC.getContext("2d");
const ndG=ndX.createRadialGradient(32,32,0,32,32,32);
ndG.addColorStop(0,"rgba(220,245,255,1)");
ndG.addColorStop(0.35,"rgba(90,200,255,0.8)");
ndG.addColorStop(1,"rgba(40,120,255,0)");
ndX.fillStyle=ndG; ndX.fillRect(0,0,64,64);
const ndTex=new THREE.CanvasTexture(ndC);

const nodeSprites = nodes.map((n,i)=>{
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map:ndTex, color:ACCENT, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
  }));
  s.position.copy(n);
  s.scale.setScalar(0.11);
  group.add(s);
  return { s, phase: Math.random()*Math.PI*2 };
});

/* faint solid inner sphere — gives the wireframe a sense of volume */
group.add(new THREE.Mesh(
  new THREE.SphereGeometry(R*0.98, 48, 48),
  new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, side:THREE.FrontSide,
    vertexShader:`varying vec3 vN; varying vec3 vV;
      void main(){ vN=normalize(normalMatrix*normal);
        vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz);
        gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`precision highp float; varying vec3 vN; varying vec3 vV;
      void main(){ float rim=1.0-max(dot(vN,vV),0.0);
        vec3 col=mix(vec3(0.02,0.05,0.16), vec3(0.12,0.4,0.7), pow(rim,2.0));
        gl_FragColor=vec4(col, 0.10+pow(rim,3.0)*0.35); }`,
  })
));

/* ── data packets travelling along random edges ── */
const PKT=16;
const packets = [];
for(let i=0;i<PKT;i++){
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({
    map:ndTex, color:0xeaffff, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
  }));
  sprite.scale.setScalar(0.09);
  group.add(sprite);
  packets.push({ sprite, e:Math.floor(Math.random()*edges.length), t:Math.random(), spd:0.25+Math.random()*0.4 });
}

/* ── distant stardust ── */
const SN=500, sBuf=new Float32Array(SN*3);
for(let i=0;i<SN;i++){
  const r=5+Math.random()*9, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
  sBuf[i*3]=r*Math.sin(ph)*Math.cos(th);
  sBuf[i*3+1]=r*Math.sin(ph)*Math.sin(th);
  sBuf[i*3+2]=r*Math.cos(ph);
}
const sGeo=new THREE.BufferGeometry();
sGeo.setAttribute("position",new THREE.BufferAttribute(sBuf,3));
const stars=new THREE.Points(sGeo,new THREE.PointsMaterial({
  size:0.02, color:0x6688bb, transparent:true, opacity:0.5, depthWrite:false, blending:THREE.AdditiveBlending,
}));
scene.add(stars);

/* bloom — gentle, lifts the nodes & packets */
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), 0.55, 0.4, 0.62);
composer.addPass(bloom);

/* interaction */
const ptr={x:0,y:0,tx:0,ty:0};
let dragging=false,dragX=0,dragY=0,lx=0,ly=0;
addEventListener("pointermove",e=>{
  ptr.tx=e.clientX/innerWidth-0.5; ptr.ty=e.clientY/innerHeight-0.5;
  if(dragging){dragX+=(e.clientX-lx)*.005;dragY+=(e.clientY-ly)*.005;lx=e.clientX;ly=e.clientY;}
});
addEventListener("pointerdown",e=>{dragging=true;lx=e.clientX;ly=e.clientY;});
addEventListener("pointerup",()=>{dragging=false;});
addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight);
});

/* tmp vectors for packet lerp */
const va=new THREE.Vector3(), vb=new THREE.Vector3();

/* animate */
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock=new THREE.Clock();
function animate(){
  const t=clock.getElapsedTime();
  ptr.x+=(ptr.tx-ptr.x)*.04; ptr.y+=(ptr.ty-ptr.y)*.04;

  group.rotation.y=(reduce?.3:t*.07)+dragX+ptr.x*.5;
  group.rotation.x=(reduce?.06:Math.sin(t*.12)*.08)+dragY+ptr.y*.34;

  /* nodes gently twinkle */
  nodeSprites.forEach(o=>{
    o.s.scale.setScalar(0.10 + 0.03*Math.sin(t*1.6 + o.phase));
  });

  /* packets glide along their edges, then jump to a new edge */
  packets.forEach(p=>{
    p.t += p.spd * (reduce?0:0.016);
    if(p.t>=1){ p.t=0; p.e=Math.floor(Math.random()*edges.length); p.spd=0.25+Math.random()*0.4; }
    const [a,b]=edges[p.e];
    va.copy(nodes[a]); vb.copy(nodes[b]);
    p.sprite.position.lerpVectors(va, vb, p.t);
  });

  stars.rotation.y=t*.008;

  camera.position.x+=(ptr.x*.6-camera.position.x)*.04;
  camera.position.y+=(-ptr.y*.42-camera.position.y)*.04;
  camera.lookAt(0,0,0);
  composer.render();
  requestAnimationFrame(animate);
}

/* loader */
const loader=document.getElementById("loader"),countEl=document.getElementById("count"),barfill=document.getElementById("barfill");
let p=0;
const tick=setInterval(()=>{
  p+=Math.max(1.2,(100-p)*.07);
  if(p>=100){p=100;clearInterval(tick);setTimeout(()=>{loader.classList.add("done");document.body.classList.add("ready");},250);}
  countEl.textContent=Math.floor(p);barfill.style.width=p+"%";
},55);
animate();
