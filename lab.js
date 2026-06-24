/* ============ cloudx // lab v9 — glass crystal ============
   Outer glass shell (transparent, iridescent rim) wraps an inner
   crystal that spins independently. Moving lights shimmer the glass.
   Gold sprite particles + wire edges for depth. */
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

/* dynamic lights — orbit the glass so it shimmers as they move */
scene.add(new THREE.AmbientLight(0x080820, 4));
const lA = new THREE.PointLight(0xffffff, 7, 14);
const lB = new THREE.PointLight(0x3355ff, 5, 12);
const lC = new THREE.PointLight(0xaa33ff, 4, 12);
const lD = new THREE.PointLight(0xffaa44, 3, 10);
scene.add(lA, lB, lC, lD);

/* group */
const group = new THREE.Group();
group.position.y = 0.12;
scene.add(group);

/* ── inner crystal — spins independently, visible through outer glass ── */
const inGeo = new THREE.IcosahedronGeometry(0.7, 1);
inGeo.toNonIndexed(); // gives true flat shading (visible facets)
const inMat = new THREE.MeshStandardMaterial({
  color: 0x1633ee, emissive: 0x0a1fbb, emissiveIntensity:2.0,
  roughness:0.05, metalness:0.88, flatShading:true,
});
const inner = new THREE.Mesh(inGeo, inMat);
inner.renderOrder = 0;
group.add(inner);

/* glowing edges on inner crystal */
const edgeWire = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.71, 1)),
  new THREE.LineBasicMaterial({ color:0x7799ff, transparent:true, opacity:0.65, blending:THREE.AdditiveBlending })
);
edgeWire.renderOrder = 1;
group.add(edgeWire);

/* ── outer glass shell — custom shader ── */
const gU = { uTime:{ value:0 } };
const gV = `
varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){
  vec4 wp = modelMatrix * vec4(position,1.0);
  vW = wp.xyz;
  vN = normalize(normalMatrix * normal);
  vV = normalize(-(viewMatrix * wp).xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const gF = `
precision highp float;
uniform float uTime;
varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){
  float ndv = max(dot(vN,vV),0.0);
  float rim = 1.0 - ndv;
  float fres = pow(rim, 1.6);

  /* iridescent surface — color shifts with view angle */
  float t = ndv*5.0 + uTime*0.2;
  vec3 irid = vec3(
    0.55+0.45*sin(t*2.0),
    0.55+0.45*sin(t*2.0+2.09),
    0.55+0.45*sin(t*2.0+4.19)
  );

  /* interior tint — deep space blue that shows through center */
  vec3 refTint = vec3(0.08, 0.16, 0.52);

  vec3 col = mix(refTint, irid*1.15, fres*0.75);

  /* hot rim for bloom */
  col += vec3(0.55, 0.72, 1.0) * pow(rim, 4.0) * 2.8;
  /* secondary warm highlight */
  col += vec3(0.8, 0.55, 1.0) * pow(rim, 8.0) * 1.8;

  /* center nearly invisible (see inner crystal), rim opaque */
  float alpha = 0.06 + fres*0.82;
  gl_FragColor = vec4(col, alpha);
}`;
const glassMesh = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.2, 2),
  new THREE.ShaderMaterial({
    uniforms:gU, vertexShader:gV, fragmentShader:gF,
    transparent:true, depthWrite:false, side:THREE.FrontSide,
  })
);
glassMesh.renderOrder = 2;
group.add(glassMesh);

/* orbit ring */
const ringMesh = new THREE.Mesh(
  new THREE.TorusGeometry(1.65, 0.006, 8, 128),
  new THREE.MeshBasicMaterial({ color:0x2244ee, transparent:true, opacity:0.4, blending:THREE.AdditiveBlending })
);
ringMesh.rotation.x = Math.PI * 0.38;
ringMesh.renderOrder = 3;
group.add(ringMesh);

/* ── gold sprite particles ── */
const spC = document.createElement("canvas"); spC.width = spC.height = 32;
const spX = spC.getContext("2d");
const spG = spX.createRadialGradient(16,16,0,16,16,16);
spG.addColorStop(0,"rgba(255,215,90,1)");
spG.addColorStop(0.4,"rgba(255,150,35,0.7)");
spG.addColorStop(1,"rgba(255,80,0,0)");
spX.fillStyle=spG; spX.fillRect(0,0,32,32);
const spTex = new THREE.CanvasTexture(spC);

const PN=650, ppBuf=new Float32Array(PN*3);
for(let i=0;i<PN;i++){
  const r=3.0+Math.random()*9, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
  ppBuf[i*3]=r*Math.sin(ph)*Math.cos(th);
  ppBuf[i*3+1]=r*Math.sin(ph)*Math.sin(th);
  ppBuf[i*3+2]=r*Math.cos(ph);
}
const ppGeo=new THREE.BufferGeometry();
ppGeo.setAttribute("position",new THREE.BufferAttribute(ppBuf,3));
const particles=new THREE.Points(ppGeo, new THREE.PointsMaterial({
  size:0.09, map:spTex, transparent:true, opacity:0.8,
  depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true,
}));
scene.add(particles);

/* bloom — restrained; catches inner emissive edges and glass rim only */
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), 0.5, 0.28, 0.86);
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

/* animate */
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock=new THREE.Clock();
function animate(){
  const t=clock.getElapsedTime();
  gU.uTime.value=t;
  ptr.x+=(ptr.tx-ptr.x)*.04; ptr.y+=(ptr.ty-ptr.y)*.04;

  group.rotation.y=(reduce?.3:t*.09)+dragX+ptr.x*.55;
  group.rotation.x=(reduce?.08:Math.sin(t*.16)*.1)+dragY+ptr.y*.38;

  /* inner crystal spins on its own axes — looks alive through glass */
  inner.rotation.y=t*.25;
  inner.rotation.x=t*.16;
  edgeWire.rotation.copy(inner.rotation);

  /* lights orbit → glass shimmers as highlights move */
  lA.position.set(Math.sin(t*.38)*4.5, Math.cos(t*.28)*3.5+2, 2.5);
  lB.position.set(Math.sin(t*.46+2)*3.5, Math.cos(t*.32+1)*2.5, -2);
  lC.position.set(Math.sin(t*.28+4)*3.5, -2, Math.cos(t*.4+2)*4);
  lD.position.set(-3.5, Math.sin(t*.22)*2.5, Math.cos(t*.34)*3);

  particles.rotation.y=t*.013;
  particles.rotation.x=t*.006;

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
