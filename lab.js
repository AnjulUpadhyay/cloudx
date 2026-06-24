/* ============ cloudx // lab v11 — obsidian cut gem ============
   An 8-sided diamond/crystal (LatheGeometry) with dark obsidian metallic
   material. Three orbiting lights create sharp specular highlights that
   jump facet-to-facet as the gem slowly rotates. Fine stardust particles.
   Dark = elegant. Precision = premium. */
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
const camera = new THREE.PerspectiveCamera(40, innerWidth/innerHeight, 0.1, 60);
camera.position.set(0, 0, 6.2);

/* three orbiting lights — each creates a sharp specular on the dark gem */
scene.add(new THREE.AmbientLight(0x03030f, 6));
const lKey  = new THREE.PointLight(0xffffff, 14, 18);  // white key
const lBlue = new THREE.PointLight(0x4466ff,  8, 14);  // cool fill
const lGold = new THREE.PointLight(0xffbb44,  7, 14);  // warm accent
scene.add(lKey, lBlue, lGold);

const group = new THREE.Group();
scene.add(group);

/* ── 8-sided cut gem ── */
/* LatheGeometry revolves a 2D profile around Y to create a faceted form.
   8 segments = octagonal cut (like a real diamond). flatShading = each
   face has a single normal → highlight snaps sharply across each facet. */
const profile = [
  new THREE.Vector2(0.00,  1.30),  // top apex
  new THREE.Vector2(0.42,  0.92),  // upper crown
  new THREE.Vector2(0.78,  0.54),  // crown shoulder
  new THREE.Vector2(0.92,  0.12),  // girdle top
  new THREE.Vector2(0.92, -0.12),  // girdle bottom (flat band = visible ring)
  new THREE.Vector2(0.65, -0.55),  // upper pavilion
  new THREE.Vector2(0.30, -0.86),  // lower pavilion
  new THREE.Vector2(0.00, -1.20),  // bottom apex
];
const gemGeo = new THREE.LatheGeometry(profile, 8);
const gemMat = new THREE.MeshStandardMaterial({
  color:    new THREE.Color(0.022, 0.022, 0.085),  // deep indigo-black
  metalness: 0.94,
  roughness: 0.04,   // mirror-smooth → razor-sharp specular
  flatShading: true, // visible facets
});
const gem = new THREE.Mesh(gemGeo, gemMat);
group.add(gem);

/* edge lines — reinforce the facet silhouette */
const gemEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(gemGeo),
  new THREE.LineBasicMaterial({ color:0x2233aa, transparent:true, opacity:0.3, blending:THREE.AdditiveBlending })
);
group.add(gemEdges);

/* ── fine stardust cloud ── */
const PN = 2400, pBuf = new Float32Array(PN*3);
for(let i=0;i<PN;i++){
  const r=2.8+Math.random()*10, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
  pBuf[i*3]=r*Math.sin(p)*Math.cos(t);
  pBuf[i*3+1]=r*Math.sin(p)*Math.sin(t);
  pBuf[i*3+2]=r*Math.cos(p);
}
const pGeo=new THREE.BufferGeometry();
pGeo.setAttribute("position",new THREE.BufferAttribute(pBuf,3));
const particles=new THREE.Points(pGeo,new THREE.PointsMaterial({
  size:0.016, color:0x6677bb, transparent:true, opacity:0.5,
  depthWrite:false, blending:THREE.AdditiveBlending,
}));
scene.add(particles);

/* a handful of brighter close-in stars for sparkle */
const spN = 180, spBuf = new Float32Array(spN*3);
for(let i=0;i<spN;i++){
  const r=1.8+Math.random()*2.8, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
  spBuf[i*3]=r*Math.sin(p)*Math.cos(t);
  spBuf[i*3+1]=r*Math.sin(p)*Math.sin(t);
  spBuf[i*3+2]=r*Math.cos(p);
}
const spGeo=new THREE.BufferGeometry();
spGeo.setAttribute("position",new THREE.BufferAttribute(spBuf,3));
const sparkles=new THREE.Points(spGeo,new THREE.PointsMaterial({
  size:0.038, color:0xaabbee, transparent:true, opacity:0.6,
  depthWrite:false, blending:THREE.AdditiveBlending,
}));
scene.add(sparkles);

/* bloom — only touches the absolute brightest specular peaks */
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), 0.5, 0.28, 0.88);
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
  ptr.x+=(ptr.tx-ptr.x)*.04; ptr.y+=(ptr.ty-ptr.y)*.04;

  /* slow, majestic rotation — highlights step from face to face */
  group.rotation.y=(reduce?.3:t*.072)+dragX+ptr.x*.5;
  group.rotation.x=(reduce?.05:Math.sin(t*.11)*.07)+dragY+ptr.y*.35;

  /* lights orbit the gem on different paths */
  lKey.position.set( Math.sin(t*.30)*5.5,  Math.cos(t*.22)*4.5+1, 3);
  lBlue.position.set(Math.sin(t*.40+2)*5, Math.cos(t*.28+1)*4,  -2.5);
  lGold.position.set(Math.sin(t*.21+4)*5, -3.5, Math.cos(t*.34+2)*5);

  particles.rotation.y=t*.009;
  particles.rotation.x=t*.004;
  sparkles.rotation.y=t*.013;
  sparkles.rotation.z=t*.007;

  camera.position.x+=(ptr.x*.7-camera.position.x)*.04;
  camera.position.y+=(-ptr.y*.45-camera.position.y)*.04;
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
