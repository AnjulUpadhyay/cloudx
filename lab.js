/* ============ cloudx // lab v12 — crystal orb refined ============
   Based on the v9 direction (glass shell + inner crystal).
   Enhancements:
   - Morphing dodecahedron inner crystal (12 gem-like faces, breathing)
   - Inner crystal: bright faces, dark edges → real 3D gem depth
   - Outer glass: tighter rim exponent → no blowout
   - Atmospheric aura (very faint sphere for cinematic depth)
   - 5 tracer dots orbit on the ring (data-flow motif)
   - Gold sprite particles unchanged (they were good) */
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
const camera = new THREE.PerspectiveCamera(40, innerWidth/innerHeight, 0.1, 80);
camera.position.set(0, 0, 6.2);

/* dynamic lights — create real specular on the inner crystal */
scene.add(new THREE.AmbientLight(0x04041e, 5));
const lA = new THREE.PointLight(0xffffff, 9, 18);
const lB = new THREE.PointLight(0x3355ff, 6, 14);
const lC = new THREE.PointLight(0xaa33ff, 5, 14);
scene.add(lA, lB, lC);

const group = new THREE.Group();
scene.add(group);

/* ── faint atmospheric aura — cinematic depth ── */
group.add(new THREE.Mesh(
  new THREE.SphereGeometry(2.25, 32, 32),
  new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.BackSide,
    vertexShader:`
      varying vec3 vN; varying vec3 vV;
      void main(){
        vN=normalize(normalMatrix*normal);
        vV=normalize(-(modelViewMatrix*vec4(position,1.0)).xyz);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }`,
    fragmentShader:`
      precision highp float;
      varying vec3 vN; varying vec3 vV;
      void main(){
        float rim=1.0-max(dot(vN,vV),0.0);
        gl_FragColor=vec4(vec3(0.1,0.16,0.65)*rim, pow(rim,2.5)*0.14);
      }`,
  })
));

/* ── inner crystal — morphing dodecahedron ── */
const kU = { uTime:{ value:0 } };
const innerMat = new THREE.ShaderMaterial({
  uniforms: kU,
  vertexShader:`
    uniform float uTime;
    varying vec3 vN; varying vec3 vV; varying float vD;
    void main(){
      vec3 n=normalize(position);
      float d=sin(n.x*4.2+uTime*.9)*0.042
             +sin(n.y*3.8+uTime*.7)*0.038
             +sin(n.z*4.5+uTime*1.1)*0.032;
      vD=d;
      vec3 p=position+normal*d;
      vec4 mv=modelViewMatrix*vec4(p,1.0);
      vN=normalize(normalMatrix*normal);
      vV=normalize(-mv.xyz);
      gl_Position=projectionMatrix*mv;
    }`,
  fragmentShader:`
    precision highp float;
    uniform float uTime;
    varying vec3 vN; varying vec3 vV; varying float vD;
    void main(){
      float ndv=max(dot(vN,vV),0.0);
      float rim=1.0-ndv;
      /* base: deep blue shifting to violet */
      vec3 base=mix(vec3(0.05,0.12,0.92),vec3(0.28,0.06,0.88),
                    0.5+0.5*sin(uTime*.35));
      /* bright center of each face, dark at edges = gem depth */
      vec3 col=base*(0.2+0.8*ndv);
      /* subtle cool iridescent rim (contained) */
      col+=vec3(0.25,0.6,1.0)*pow(rim,3.5)*0.9;
      /* tight bright edge for bloom */
      col+=vec3(0.4,0.72,1.0)*pow(rim,6.0)*2.2;
      /* displacement brightness micro-variation */
      col+=vec3(0.08,0.18,0.55)*vD*3.5;
      gl_FragColor=vec4(col,1.0);
    }`,
});
const inner = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), innerMat);
inner.renderOrder = 0;
group.add(inner);

/* inner edge glow — shows the 12 pentagonal faces */
const innerEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(0.72, 0)),
  new THREE.LineBasicMaterial({ color:0x6688ff, transparent:true, opacity:0.5, blending:THREE.AdditiveBlending })
);
innerEdges.renderOrder = 1;
group.add(innerEdges);

/* ── outer glass shell — fixed rim (no more blowout) ── */
const gU = { uTime:{ value:0 } };
const glass = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.22, 2),
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
        float fres=pow(rim,1.7);
        /* gentle iridescence — desaturated to avoid rainbow mess */
        float t=ndv*4.2+uTime*.2;
        vec3 irid=vec3(
          .5+.5*sin(t*2.0),
          .5+.5*sin(t*2.0+2.094),
          .5+.5*sin(t*2.0+4.189)
        )*.7+.3;
        vec3 col=mix(vec3(.07,.13,.5), irid, fres*.6);
        /* KEY FIX: pow 6 & 10 (was 4 & 7) → tighter, contained glow */
        col+=vec3(.5,.72,1.0)*pow(rim,6.0)*1.8;
        col+=vec3(.7,.4,1.0)*pow(rim,10.0)*1.4;
        gl_FragColor=vec4(col, .05+fres*.78);
      }`,
    transparent:true, depthWrite:false,
  })
);
glass.renderOrder = 2;
group.add(glass);

/* ── orbit ring + 5 tracer data-flow dots ── */
const RING_R = 1.65, RING_T = Math.PI*.38;
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(RING_R, .007, 8, 128),
  new THREE.MeshBasicMaterial({ color:0x2244ee, transparent:true, opacity:.35, blending:THREE.AdditiveBlending })
);
ring.rotation.x = RING_T;
ring.renderOrder = 3;
group.add(ring);

const tracers = Array.from({length:5}, (_,i) => {
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(.022, 8, 8),
    new THREE.MeshBasicMaterial({ color:0x99ccff, blending:THREE.AdditiveBlending })
  );
  dot.renderOrder = 4;
  group.add(dot);
  return { dot, phase: i/5*Math.PI*2 };
});

/* ── gold sprite particles ── */
const spC=document.createElement("canvas"); spC.width=spC.height=32;
const spX=spC.getContext("2d");
const spG=spX.createRadialGradient(16,16,0,16,16,16);
spG.addColorStop(0,"rgba(255,215,80,1)");
spG.addColorStop(.38,"rgba(255,145,28,.75)");
spG.addColorStop(1,"rgba(255,80,0,0)");
spX.fillStyle=spG; spX.fillRect(0,0,32,32);
const spTex=new THREE.CanvasTexture(spC);

const PN=700, ppB=new Float32Array(PN*3);
for(let i=0;i<PN;i++){
  const r=3.0+Math.random()*9.5, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
  ppB[i*3]=r*Math.sin(p)*Math.cos(t);
  ppB[i*3+1]=r*Math.sin(p)*Math.sin(t);
  ppB[i*3+2]=r*Math.cos(p);
}
const ppG=new THREE.BufferGeometry();
ppG.setAttribute("position",new THREE.BufferAttribute(ppB,3));
const particles=new THREE.Points(ppG,new THREE.PointsMaterial({
  size:.09,map:spTex,transparent:true,opacity:.78,
  depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true,
}));
scene.add(particles);

/* bloom */
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.44,.24,.88);
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
  kU.uTime.value=t; gU.uTime.value=t;
  ptr.x+=(ptr.tx-ptr.x)*.04; ptr.y+=(ptr.ty-ptr.y)*.04;

  group.rotation.y=(reduce?.3:t*.07)+dragX+ptr.x*.5;
  group.rotation.x=(reduce?.08:Math.sin(t*.13)*.09)+dragY+ptr.y*.35;

  /* inner crystal spins independently */
  inner.rotation.y=t*.2;
  inner.rotation.x=t*.13;
  innerEdges.rotation.copy(inner.rotation);

  /* lights orbit */
  lA.position.set(Math.sin(t*.33)*5.5, Math.cos(t*.25)*4.5+1, 3);
  lB.position.set(Math.sin(t*.43+2)*5, Math.cos(t*.30+1)*4,  -2.5);
  lC.position.set(Math.sin(t*.23+4)*5, -3, Math.cos(t*.37+2)*5);

  /* tracer dots travel along the ring */
  tracers.forEach(tr=>{
    const a=t*.65+tr.phase;
    tr.dot.position.set(
      RING_R*Math.cos(a),
      RING_R*Math.sin(a)*Math.sin(RING_T),
      -RING_R*Math.sin(a)*Math.cos(RING_T)
    );
  });

  particles.rotation.y=t*.011;
  particles.rotation.x=t*.005;

  camera.position.x+=(ptr.x*.65-camera.position.x)*.04;
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
  countEl.textContent=Math.floor(p); barfill.style.width=p+"%";
},55);
animate();
