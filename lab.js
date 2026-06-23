/* ============ cloudx // lab — Active-Theory-inspired fluid hero ============
   Full-screen GLSL flow field, cursor-reactive, loader + reveal + custom cursor. */
import * as THREE from "three";

/* ---------- custom cursor ---------- */
const cur = document.getElementById("cursor");
const dot = document.getElementById("cursorDot");
const cs = { x: innerWidth / 2, y: innerHeight / 2, dx: innerWidth / 2, dy: innerHeight / 2 };
addEventListener("pointermove", (e) => { cs.x = e.clientX; cs.y = e.clientY; dot.style.transform = `translate(${cs.x}px,${cs.y}px)`; });
function cursorLoop() {
  cs.dx += (cs.x - cs.dx) * 0.18; cs.dy += (cs.y - cs.dy) * 0.18;
  cur.style.transform = `translate(${cs.dx}px,${cs.dy}px)`;
  requestAnimationFrame(cursorLoop);
}
cursorLoop();
document.querySelectorAll("[data-hover], a").forEach((el) => {
  el.addEventListener("pointerenter", () => cur.classList.add("big"));
  el.addEventListener("pointerleave", () => cur.classList.remove("big"));
});

/* ---------- WebGL fluid ---------- */
const canvas = document.getElementById("gl");
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
catch (e) { document.getElementById("loader").textContent = "WebGL unavailable"; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
const cam = new THREE.Camera();
const uniforms = {
  u_time: { value: 0 },
  u_res: { value: new THREE.Vector2(innerWidth, innerHeight) },
  u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
};

const frag = `
precision highp float;
uniform float u_time; uniform vec2 u_res; uniform vec2 u_mouse;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5;} return v; }
void main(){
  vec2 uv=gl_FragCoord.xy/u_res.xy;
  vec2 p=uv; p.x*=u_res.x/u_res.y;
  float t=u_time*0.06;
  // domain-warped flow
  vec2 q=vec2(fbm(p+vec2(0.0,t)), fbm(p+vec2(5.2,-t)));
  vec2 r=vec2(fbm(p+1.7*q+vec2(8.3,2.8)+t*0.5), fbm(p+1.7*q+vec2(2.6,9.2)-t*0.4));
  float f=fbm(p+2.4*r);
  // palette: deep ink -> blue -> cyan neon
  vec3 ink=vec3(0.02,0.03,0.06);
  vec3 blue=vec3(0.05,0.22,0.5);
  vec3 cyan=vec3(0.36,0.92,1.0);
  vec3 col=mix(ink,blue,smoothstep(0.2,0.95,f));
  col+=cyan*pow(smoothstep(0.55,1.0,f+0.25*length(r)),3.0)*0.7;
  // cursor glow
  vec2 m=u_mouse; m.x*=u_res.x/u_res.y;
  float d=distance(p,m);
  col+=cyan*0.5*exp(-d*4.5);
  col+=blue*0.25*exp(-d*1.8);
  // vignette
  float vig=smoothstep(1.25,0.25,length(uv-0.5));
  col*=vig;
  gl_FragColor=vec4(col,1.0);
}`;

const mat = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: "void main(){ gl_Position=vec4(position.xy,0.0,1.0); }",
  fragmentShader: frag,
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

const mouse = { tx: 0.5, ty: 0.5 };
addEventListener("pointermove", (e) => { mouse.tx = e.clientX / innerWidth; mouse.ty = 1 - e.clientY / innerHeight; });
addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  uniforms.u_res.value.set(innerWidth, innerHeight);
});

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = new THREE.Clock();
function render() {
  uniforms.u_time.value = reduce ? 12.0 : clock.getElapsedTime();
  uniforms.u_mouse.value.x += (mouse.tx - uniforms.u_mouse.value.x) * 0.06;
  uniforms.u_mouse.value.y += (mouse.ty - uniforms.u_mouse.value.y) * 0.06;
  renderer.render(scene, cam);
  requestAnimationFrame(render);
}
render();

/* ---------- loader + reveal ---------- */
const loader = document.getElementById("loader");
const countEl = document.getElementById("count");
const barfill = document.getElementById("barfill");
let p = 0;
const tick = setInterval(() => {
  p += Math.max(1, (100 - p) * 0.08);
  if (p >= 100) { p = 100; clearInterval(tick); finish(); }
  countEl.textContent = Math.floor(p);
  barfill.style.width = p + "%";
}, 60);
function finish() {
  setTimeout(() => {
    loader.classList.add("done");
    document.getElementById("ui").parentElement.classList.add("ready");
    document.body.classList.add("ready");
  }, 250);
}
