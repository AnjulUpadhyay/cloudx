/* ============ cloudx // lab v15 — refined crystal core ============
   Refines v9/v14: smooth high-subdivision core (NO low-poly wireframe),
   rounder glass shell with a soft contained rim, deep indigo→teal→violet
   palette, and only two thin elegant rings with small crisp electrons.
   Goal: restraint + smooth surfaces = elegant. */
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
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 0, 6.2);

/* soft lights — gentle, no harsh hotspots */
scene.add(new THREE.AmbientLight(0x0a1030, 4));
const lA = new THREE.PointLight(0x88aaff, 5, 16);
const lB = new THREE.PointLight(0x33ddcc, 4, 14);
const lC = new THREE.PointLight(0x9966ff, 3.5, 14);
scene.add(lA, lB, lC);

const group = new THREE.Group();
group.position.y = 0.12;
scene.add(group);

/* ── inner core — smooth, flowing, deep palette (NO wireframe) ── */
const cU = { uTime:{ value:0 } };
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.72, 24),  // high subdivision = smooth sphere
  new THREE.ShaderMaterial({
    uniforms: cU,
    vertexShader:`
      uniform float uTime;
      varying vec3 vN; varying vec3 vV; varying float vF;
      /* gentle flowing surface displacement */
      float flow(vec3 p,float t){
        return sin(p.x*3.0+t)*0.5 + sin(p.y*2.6-t*.8)*0.4
             + sin(p.z*3.4+t*1.1)*0.3 + sin((p.x+p.y)*2.2-t*.6)*0.25;
      }
      void main(){
        vec3 n=normalize(position);
        float f=flow(n*1.6,uTime);
        vF=f;
        vec3 p=position+normal*f*0.05;
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        vN=normalize(normalMatrix*normal);
        vV=normalize(-mv.xyz);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader:`
      precision highp float;
      uniform float uTime;
      varying vec3 vN; varying vec3 vV; varying float vF;
      vec3 pal(float t){
        vec3 indigo=vec3(0.10,0.16,0.62);
        vec3 teal  =vec3(0.10,0.62,0.66);
        vec3 violet=vec3(0.42,0.22,0.78);
        vec3 c=mix(indigo,teal, 0.5+0.5*sin(t));
        c=mix(c,violet, 0.5+0.5*sin(t*0.7+1.6));
        return c;
      }
      void main(){
        float ndv=max(dot(vN,vV),0.0);
        float rim=1.0-ndv;
        vec3 col=pal(vF*1.2+uTime*0.4);
        col*=0.45+0.55*ndv;                       // smooth shading, lit center
        col+=vec3(0.3,0.7,0.9)*pow(rim,3.0)*0.7;  // soft cool rim
        gl_FragColor=vec4(col,1.0);
      }`,
  })
);
core.renderOrder = 0;
group.add(core);

/* ── outer glass shell — rounder + softer rim (no blowout) ── */
const gU = { uTime:{ value:0 } };
const glass = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.18, 6),       // detail 6 = round silhouette
  new THREE.ShaderMaterial({
    uniforms: gU,
    vertexShader:`
      varying vec3 vN; varying vec3 vV;
      void main(){
        vec4 wp=modelMatrix*vec4(position,1.0);
        vN=normalize(normalMatrix*normal);
        vV=normalize(-(viewMatrix*wp).xyz);
        gl_Position=projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader:`
      precision highp float;
      uniform float uTime;
      varying vec3 vN; varying vec3 vV;
      void main(){
        float ndv=max(dot(vN,vV),0.0);
        float rim=1.0-ndv;
        float fres=pow(rim,1.8);
        /* subtle desaturated iridescence */
        float t=ndv*4.0+uTime*0.18;
        vec3 irid=(vec3(
          .5+.5*sin(t*2.0),
          .5+.5*sin(t*2.0+2.094),
          .5+.5*sin(t*2.0+4.189)
        )*.55+.45);
        vec3 col=mix(vec3(.05,.12,.34), irid, fres*0.5);
        /* contained rim — tight falloff, modest intensity (no white blob) */
        col+=vec3(.4,.66,.95)*pow(rim,5.5)*1.3;
        col+=vec3(.55,.4,.9)*pow(rim,9.0)*0.9;
        gl_FragColor=vec4(col, 0.04+fres*0.66);
      }`,
    transparent:true, depthWrite:false,
  })
);
glass.renderOrder = 2;
group.add(glass);

/* ── two thin elegant rings with small crisp electrons ── */
const elC=document.createElement("canvas"); elC.width=elC.height=64;
const elX=elC.getContext("2d");
const elG=elX.createRadialGradient(32,32,0,32,32,32);
elG.addColorStop(0,"rgba(220,245,255,1)");
elG.addColorStop(0.4,"rgba(120,190,255,0.7)");
elG.addColorStop(1,"rgba(40,90,255,0)");
elX.fillStyle=elG; elX.fillRect(0,0,64,64);
const elTex=new THREE.CanvasTexture(elC);

const orbitDefs = [
  { R:1.55, rx:Math.PI*0.40, ry:0.0,          ring:0x3a7bff, ringO:0.30, dot:0xbfe4ff, spd:0.55 },
  { R:1.78, rx:Math.PI*0.16, ry:Math.PI*0.5,  ring:0x6a55ff, ringO:0.20, dot:0xd0c0ff, spd:-0.4 },
];
const electrons=[];
orbitDefs.forEach((o,oi)=>{
  const pivot=new THREE.Group();
  pivot.rotation.set(o.rx,o.ry,0);
  group.add(pivot);
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(o.R,0.004,8,180),
    new THREE.MeshBasicMaterial({ color:o.ring, transparent:true, opacity:o.ringO, blending:THREE.AdditiveBlending })
  );
  ring.renderOrder=3; pivot.add(ring);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({
    map:elTex, color:o.dot, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
  }));
  sprite.scale.setScalar(0.16);   // small + crisp (was 0.34 fuzzy)
  sprite.renderOrder=5; pivot.add(sprite);
  electrons.push({ sprite, R:o.R, spd:o.spd, phase:oi*2.1 });
});

/* ── fine stardust (subtle, cool) + a few warm gold accents ── */
const PN=600, ppB=new Float32Array(PN*3), ppC=new Float32Array(PN*3);
for(let i=0;i<PN;i++){
  const r=3.0+Math.random()*9, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
  ppB[i*3]=r*Math.sin(ph)*Math.cos(th);
  ppB[i*3+1]=r*Math.sin(ph)*Math.sin(th);
  ppB[i*3+2]=r*Math.cos(ph);
  if(i<PN*0.18){ ppC[i*3]=1.0; ppC[i*3+1]=0.78; ppC[i*3+2]=0.4; }       // gold accent
  else { ppC[i*3]=0.55; ppC[i*3+1]=0.7; ppC[i*3+2]=1.0; }                // cool dust
}
const ppG=new THREE.BufferGeometry();
ppG.setAttribute("position",new THREE.BufferAttribute(ppB,3));
ppG.setAttribute("color",new THREE.BufferAttribute(ppC,3));
const particles=new THREE.Points(ppG,new THREE.PointsMaterial({
  size:0.022, vertexColors:true, transparent:true, opacity:0.55,
  depthWrite:false, blending:THREE.AdditiveBlending,
}));
scene.add(particles);

/* bloom — gentle, contained */
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.42,0.3,0.85);
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
  cU.uTime.value=t; gU.uTime.value=t;
  ptr.x+=(ptr.tx-ptr.x)*.04; ptr.y+=(ptr.ty-ptr.y)*.04;

  group.rotation.y=(reduce?.3:t*.06)+dragX+ptr.x*.5;
  group.rotation.x=(reduce?.08:Math.sin(t*.13)*.08)+dragY+ptr.y*.34;

  core.rotation.y=t*.16;
  core.rotation.x=t*.1;

  lA.position.set(Math.sin(t*.34)*4.5, Math.cos(t*.26)*3.5+1.5, 2.5);
  lB.position.set(Math.sin(t*.44+2)*3.5, Math.cos(t*.30+1)*2.5, -2);
  lC.position.set(Math.sin(t*.26+4)*3.5, -2, Math.cos(t*.38+2)*4);

  electrons.forEach(e=>{
    const a=t*e.spd+e.phase;
    e.sprite.position.set(e.R*Math.cos(a), e.R*Math.sin(a), 0);
  });

  particles.rotation.y=t*.01;
  particles.rotation.x=t*.005;

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
