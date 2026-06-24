/* ============ cloudx // lab v10 — iridescent torus knot ============
   A torus knot (mathematically knotted tube) with iridescent GLSL:
   near-black surface, rainbow sheen at grazing angles, warm gold
   pulse flowing along the tube. Moving lights make it shimmer.
   Gold sprite particles + three orbital halos. */
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
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 0, 6.5);

/* orbiting lights — create caustic shimmer on the knot */
scene.add(new THREE.AmbientLight(0x04041a, 6));
const lA = new THREE.PointLight(0xffffff, 9, 18);
const lB = new THREE.PointLight(0x3366ff, 6, 14);
const lC = new THREE.PointLight(0xcc33ff, 5, 14);
const lD = new THREE.PointLight(0xffaa44, 4, 12);
scene.add(lA, lB, lC, lD);

const group = new THREE.Group();
scene.add(group);

/* ── iridescent torus knot — the hero ── */
const uTime = { value: 0 };

const vert = `
varying vec3 vN; varying vec3 vV; varying vec2 vUV;
void main(){
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = normalize(-mv.xyz);
  vUV = uv;
  gl_Position = projectionMatrix * mv;
}`;

/* uv.x = 0..1 along the tube path, uv.y = around the cross-section */
const frag = `
precision highp float;
uniform float uTime;
varying vec3 vN; varying vec3 vV; varying vec2 vUV;

vec3 rainbow(float t){
  return vec3(
    .5+.5*sin(t),
    .5+.5*sin(t+2.094),
    .5+.5*sin(t+4.189)
  );
}

void main(){
  float ndv = max(dot(vN,vV),0.0);
  float rim = 1.0 - ndv;                    // 0 at face-on, 1 at edge

  /* iridescence: color shifts with view angle AND tube position */
  float iridPhase = ndv*6.0 + vUV.x*12.566 + uTime*.18;
  vec3 irid = rainbow(iridPhase);

  /* warm gold pulse traveling along tube */
  float pulse = .5 + .5*sin(vUV.x*18.85 - uTime*1.1);   // 3 bands travel forward
  vec3 gold = vec3(1.0,.72,.22) * pulse;

  /* build up surface:
     - near-black base (see the form in shadow)
     - iridescent sheen at flanks
     - gold pulse on lit flanks
     - hot white-cyan rim → bloom catches this */
  vec3 col = irid * .05;                               // almost-black base
  col += irid * pow(rim, 1.3) * 1.4;                  // iridescent flank
  col += gold  * pow(rim, 2.2) * 1.0;                 // gold pulse
  col += vec3(.55,.8,1.0) * pow(rim,4.5) * 3.2;       // hot rim (bloom bait)
  col += vec3(.9,.5,1.0)  * pow(rim,7.0) * 1.5;       // violet ultra-rim

  gl_FragColor = vec4(col, 1.0);
}`;

const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.95, 0.29, 320, 22, 2, 3),
  new THREE.ShaderMaterial({ uniforms:{ uTime }, vertexShader:vert, fragmentShader:frag })
);
group.add(knot);

/* three halos at different angles — depth & scale reference */
const haloColors = [0x2244ff, 0x9922ff, 0xffaa33];
const haloOpacity = [0.38, 0.22, 0.18];
const haloRx = [Math.PI*.32, Math.PI*.08, Math.PI*.55];
const haloRy = [0, Math.PI*.38, Math.PI*.18];
for(let i=0;i<3;i++){
  const h = new THREE.Mesh(
    new THREE.TorusGeometry(1.5+i*.2, 0.005, 8, 128),
    new THREE.MeshBasicMaterial({ color:haloColors[i], transparent:true, opacity:haloOpacity[i], blending:THREE.AdditiveBlending })
  );
  h.rotation.x = haloRx[i]; h.rotation.y = haloRy[i];
  group.add(h);
}

/* gold sprite particles */
const spC=document.createElement("canvas"); spC.width=spC.height=32;
const spX=spC.getContext("2d");
const spG=spX.createRadialGradient(16,16,0,16,16,16);
spG.addColorStop(0,"rgba(255,220,80,1)");
spG.addColorStop(.38,"rgba(255,145,30,0.75)");
spG.addColorStop(1,"rgba(255,70,0,0)");
spX.fillStyle=spG; spX.fillRect(0,0,32,32);
const spTex=new THREE.CanvasTexture(spC);

const PN=750, ppB=new Float32Array(PN*3);
for(let i=0;i<PN;i++){
  const r=3.2+Math.random()*9.5, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
  ppB[i*3]=r*Math.sin(ph)*Math.cos(th);
  ppB[i*3+1]=r*Math.sin(ph)*Math.sin(th);
  ppB[i*3+2]=r*Math.cos(ph);
}
const ppG=new THREE.BufferGeometry();
ppG.setAttribute("position",new THREE.BufferAttribute(ppB,3));
const particles=new THREE.Points(ppG,new THREE.PointsMaterial({
  size:.095, map:spTex, transparent:true, opacity:.78,
  depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true,
}));
scene.add(particles);

/* bloom — catches the hot rim and gold pulse peaks */
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), 0.55, 0.32, 0.82);
composer.addPass(bloom);

/* interaction */
const ptr={x:0,y:0,tx:0,ty:0};
let dragging=false,dragX=0,dragY=0,lx=0,ly=0;
addEventListener("pointermove",e=>{
  ptr.tx=e.clientX/innerWidth-.5; ptr.ty=e.clientY/innerHeight-.5;
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
  uTime.value=t;
  ptr.x+=(ptr.tx-ptr.x)*.04; ptr.y+=(ptr.ty-ptr.y)*.04;

  /* slow majestic rotation — like Active Theory objects */
  group.rotation.y=(reduce?.4:t*.075)+dragX+ptr.x*.55;
  group.rotation.x=(reduce?.1:Math.sin(t*.13)*.13)+dragY+ptr.y*.38;
  group.rotation.z=reduce?0:t*.025;   // slow roll adds depth

  /* lights orbit → highlights travel across the iridescent surface */
  lA.position.set(Math.sin(t*.36)*5.5, Math.cos(t*.26)*4+1.5, 3);
  lB.position.set(Math.sin(t*.44+2)*4, Math.cos(t*.31+1)*3, -2.5);
  lC.position.set(Math.sin(t*.26+4)*4.5, -2.5, Math.cos(t*.4+2)*5);
  lD.position.set(-4.5, Math.sin(t*.21)*3, Math.cos(t*.32)*3.5);

  particles.rotation.y=t*.011;
  particles.rotation.x=t*.005;

  camera.position.x+=(ptr.x*.75-camera.position.x)*.04;
  camera.position.y+=(-ptr.y*.5-camera.position.y)*.04;
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
  countEl.textContent=Math.floor(p); barfill.style.width=p+"%";
},55);
animate();
