var VS_SRC='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
var FS_SRC='precision highp float;\nuniform vec2 uRes;uniform vec2 uMouse;uniform float uTime;uniform float uHold;\nuniform float uRadius;uniform float uScroll;uniform float uWave;uniform float uHover;\nuniform float uVel;uniform float uAudio;uniform float uBoot;\nfloat hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}\nfloat noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);\n  float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));\n  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}\nfloat fbm(vec2 p){float v=0.0,a=0.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);\n  for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=0.5;}return v;}\nvoid main(){\n  vec2 frag=gl_FragCoord.xy;\n  vec2 uv=(frag-0.5*uRes)/uRes.y;\n  float t=uTime;\n  vec2 mp=vec2(uMouse.x,uRes.y-uMouse.y);\n  vec2 d=frag-mp;float dist=length(d);\n  vec2 dir=dist>0.001?d/dist:vec2(0.,1.);\n  float rad=max(uRadius,1.0);\n  float dd=dist/rad;\n  dd+=(noise(dir*7.0+t*0.35)-0.5)*0.045;\n  float lens=smoothstep(1.35,1.0,dd)*smoothstep(0.55,1.0,dd);\n\n  vec2 p=uv*1.9;\n  p+=dir*lens*0.34*uHold;\n  p.y+=uScroll*0.45;\n  p.y+=uVel*0.06;\n  p.x+=uVel*0.03*sin(uv.y*3.0);\n  // cursor makes a soft dent in the field even when not holding\n  float near=smoothstep(0.55,0.0,length(uv-(mp-0.5*uRes)/uRes.y));\n  p+=dir*near*0.05;\n\n  vec2 q=vec2(fbm(p+vec2(0.0,t*0.05)),fbm(p+vec2(5.2,1.3)));\n  vec2 r=vec2(fbm(p+3.4*q+vec2(1.7,9.2)+t*0.07),fbm(p+3.4*q+vec2(8.3,2.8)-t*0.05));\n  float f=fbm(p+3.6*r);\n  float warp=length(r);\n\n  vec3 pale=vec3(0.906,0.925,0.906);\n  vec3 deep=vec3(0.549,0.612,0.580);\n  vec3 A=mix(deep,pale,smoothstep(0.25,0.85,f+0.12*warp));\n  float bands=abs(fract(f*8.5+t*0.015)-0.5);\n  float contour=smoothstep(0.045,0.004,bands);\n  A=mix(A,vec3(0.117,0.176,0.145),contour*(0.30+uHover*0.22+uAudio*0.15));\n  A*=1.0-0.28*smoothstep(0.55,1.35,length(uv));\n\n  float g=pow(clamp(f*1.25,0.0,1.0),2.3);\n  vec3 B=mix(vec3(0.031,0.023,0.031),vec3(0.180,0.043,0.063),g);\n  float sp=t*0.30+uAudio*0.6;\n  float fr=abs(fract(f*13.0-sp)-0.5);\n  float fgc=abs(fract(f*13.0-sp+0.010)-0.5);\n  float fb=abs(fract(f*13.0-sp+0.022)-0.5);\n  vec3 fil=vec3(smoothstep(0.03,0.0,fr),smoothstep(0.03,0.0,fgc),smoothstep(0.03,0.0,fb));\n  B+=fil*vec3(1.0,0.36,0.17)*(0.55+0.65*g+uAudio*0.5);\n  B+=smoothstep(0.80,1.0,warp)*vec3(0.37,0.89,0.78)*0.55;\n  B*=1.0-0.42*smoothstep(0.35,1.30,length(uv));\n\n  float mask=smoothstep(1.0,0.955,dd)*step(0.001,uHold);\n  vec3 col=mix(A,B,mask);\n  float rim=smoothstep(0.075,0.0,abs(dd-1.0))*uHold*(1.0-smoothstep(0.985,1.0,uHold));\n  col+=rim*vec3(1.0,0.42,0.20)*0.85;\n  if(uWave<1.0){\n    float wr=uWave*max(uRes.x,uRes.y)*1.15;\n    float ring=smoothstep(26.0,0.0,abs(dist-wr));\n    col+=ring*(1.0-uWave)*vec3(1.0,0.55,0.30)*0.45;\n  }\n  col+=(hash(frag+fract(t)*97.0)-0.5)*0.045;\n  col=mix(vec3(0.667,0.706,0.682),col,uBoot);   // boot fade-in\n  gl_FragColor=vec4(col,1.0);\n}';

(function(){
"use strict";
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
var touch=matchMedia("(hover:none)").matches;
var lerp=function(a,b,n){return a+(b-a)*n;};
var clamp=function(v,a,b){return v<a?a:v>b?b:v;};

/* ============ data ============ */
var PROJECTS=[
 {t:"Glasshouse",m:"WebGL · retail flagship, Copenhagen",y:"2025",seed:11,alt:"240k instanced blades, 4.1ms",altm:"GPU compute · wind field",alty:"4.1ms",
  role:"Concept, graphics engineering",stack:"WebGL2, GPU instancing, custom wind solver",team:"With Studio Fältet",
  body:["A four-metre LED volume in the centre of a store, filled with <strong>240,000 grass blades</strong> that respond to people walking past it.",
        "The wind is a curl-noise field advected on the GPU. Footfall from a ceiling sensor injects impulses into it, so the field remembers where people went for about nine seconds.",
        "Shipped at 4.1ms a frame on a single mid-range card, which was the entire brief."]},
 {t:"Drift Choir",m:"Unity · projection mapping, 18m facade",y:"2025",seed:29,alt:"SDF fog, 96 steps",altm:"raymarch · depth peel",alty:"6.8ms",
  role:"Visual system, on-site calibration",stack:"Unity, HDRP, raymarched SDF fog",team:"Sound by Hanna Vik",
  body:["Eighteen metres of concrete turned into weather for four nights. Voices from a local choir drove density in a raymarched fog volume.",
        "Calibration was the hard part: the facade is not flat and no two projectors agreed. We ended up building a mesh from a laser scan and warping in <strong>UV space</strong> rather than fighting the geometry.",
        "The loudest note of the piece pushes the fog past its own silhouette. That was an accident we kept."]},
 {t:"Salt Index",m:"WebGPU · data sculpture for a shipping line",y:"2024",seed:47,alt:"curl noise, 2M particles",altm:"transform feedback",alty:"3.2ms",
  role:"Everything except the data",stack:"WebGPU compute, 2M particles",team:"Data from the client's fleet",
  body:["Ten years of cargo routes as <strong>two million particles</strong> pulled along real great-circle paths.",
        "Each particle carries tonnage in its mass, so heavy routes sag and thin ones whip. The whole simulation is one compute pass and one draw call.",
        "It runs in a browser on the trading floor, and nobody has closed the tab in eleven months."]},
 {t:"Room for One",m:"Installation · Kinect, mirrored stage",y:"2024",seed:63,alt:"depth camera, 30fps mesh",altm:"point cloud · TSDF",alty:"11.0ms",
  role:"Software, staging",stack:"Depth camera, TSDF fusion, point splatting",team:"Commissioned by Kunsthall Nord",
  body:["A mirrored room that only renders you once someone else has left. One visitor at a time, by design.",
        "Depth frames fuse into a slow-decaying volume, so your outline keeps standing there for a while after you move. Most people try to catch their own ghost.",
        "Average dwell time was <strong>six minutes</strong>, which for a room with nothing in it I'll take."]},
 {t:"Nocturne",m:"WebGL · volumetric capture, music release",y:"2023",seed:81,alt:"gaussian splats, 1.4GB",altm:"splat sort on GPU",alty:"5.5ms",
  role:"Pipeline, web build",stack:"Gaussian splatting, GPU radix sort",team:"For a record label that asked for 'a hologram'",
  body:["A whole performance captured as splats, streamed down to <strong>38MB</strong> for the web without looking like soup.",
        "The sort is the entire problem. We bucket by depth once every four frames and let the error hide in the grain.",
        "You can walk around the singer. You cannot walk through her, though people try."]},
 {t:"Paper Weather",m:"Three.js · campaign microsite",y:"2023",seed:97,alt:"cloth solver, 40 iters",altm:"XPBD · self-collision",alty:"7.4ms",
  role:"Graphics, interaction",stack:"XPBD cloth, 40 solver iterations",team:"With an agency I liked",
  body:["A sheet of paper you can grab, crumple and drop, running a real <strong>XPBD cloth solver</strong> at forty iterations.",
        "Self-collision at that budget is a lie told carefully: we use a coarse proxy and hide the rest in the shading.",
        "Tearing was cut two days before launch and I still think about it."]},
 {t:"Field Test",m:"AR · in-store try-on, 40 locations",y:"2022",seed:113,alt:"plane detect, 8 anchors",altm:"ARKit · occlusion mesh",alty:"9.1ms",
  role:"AR engineering",stack:"ARKit, occlusion meshes, baked lighting",team:"Rolled out to 40 stores",
  body:["Try-on that works under shop lighting, which is the least forgiving light there is.",
        "We gave up on matching the room and instead <strong>lit everything from a baked probe</strong> tuned per store. Cheaper, steadier, and nobody noticed.",
        "Forty locations, one build, zero on-site engineers."]},
 {t:"Lantern Season",m:"VJ system · club residency, Tokyo",y:"2021",seed:131,alt:"FFT bands → 3 uniforms",altm:"audio reactive",alty:"2.9ms",
  role:"Built it, played it",stack:"Custom GLSL host, MIDI, FFT",team:"Two nights a week for a year",
  body:["A VJ rig I wrote for myself because every existing one wanted me to think in layers instead of <strong>uniforms</strong>.",
        "Three knobs, three floats, one shader. Everything else is played live.",
        "A year of Fridays taught me more about timing than any project with a brief."]}
];
var LAB=[
 {t:"Undertow",p:"The domain-warped field behind this page. One noise function, two worlds read from it.",y:"Shader",seed:7,alt:"fbm(p + 4·fbm(p))",altp:"Two colour ramps sampled from the same field. The portal is a single smoothstep.",alty:"1 draw call"},
 {t:"Tide Table",p:"A year of harbour tides drawn as one line that never repeats.",y:"Generative",seed:23,alt:"45° marching, 64 taps",altp:"Heights come from a public buoy feed, smoothed over six hours.",alty:"canvas2d"},
 {t:"Slow Signal",p:"A string you can pluck that takes eleven seconds to stop ringing.",y:"Toy",seed:41,alt:"1024 verlet points",altp:"No gravity. Only neighbour forces and a weak pull toward the cursor.",alty:"webgl"},
 {t:"Typeface Weather",p:"Variable font axes driven by the forecast outside my window.",y:"Experiment",seed:59,alt:"opsz 12→96 over 900ms",altp:"Humidity maps to width, wind to weight. It reads badly on stormy days.",alty:"css"},
 {t:"Nine Rooms",p:"Nine raymarched interiors that share one distance function.",y:"Shader",seed:73,alt:"96 steps, 1 SDF",altp:"Rooms are selected by domain repetition, not by branching.",alty:"2.2ms"},
 {t:"Paper Clock",p:"A clock that folds itself flat once every hour.",y:"Toy",seed:89,alt:"12 hinge constraints",altp:"Folding is a single rotation chain solved backwards from the last crease.",alty:"svg"}
];

/* ============ build DOM ============ */
var rows=document.getElementById("rows");
PROJECTS.forEach(function(p,i){
  var b=document.createElement("button");
  b.className="row rv";b.dataset.i=i;b.dataset.cursor="open";
  b.innerHTML='<span class="n" data-alt="'+String(i+1).padStart(2,"0")+'">'+String(i+1).padStart(2,"0")+'</span>'+
    '<span class="t" data-scramble data-alt="'+p.alt+'">'+p.t+'</span>'+
    '<span class="m" data-alt="'+p.altm+'">'+p.m+'</span>'+
    '<span class="y" data-alt="'+p.alty+'">'+p.y+'</span>';
  rows.appendChild(b);
});
var rail=document.getElementById("rail");
LAB.forEach(function(l){
  var a=document.createElement("article");
  a.className="card rv";a.dataset.cursor="drag";
  a.innerHTML='<div class="frame"><canvas data-seed="'+l.seed+'"></canvas></div>'+
    '<h3 data-alt="'+l.alt+'">'+l.t+'</h3><p data-alt="'+l.altp+'">'+l.p+'</p>'+
    '<span class="y" data-alt="'+l.alty+'">'+l.y+'</span>';
  rail.appendChild(a);
});
var track=document.getElementById("track");
var words=["real-time","installations","shaders","WebGL","projection","volumetric","generative"];
for(var w=0;w<3;w++) words.forEach(function(x){
  var s=document.createElement("span");s.textContent=x;track.appendChild(s);
});

/* ============ generative art (2D) ============ */
function rng(seed){var s=seed*9301+49297;return function(){s=(s*9301+49297)%233280;return s/233280;};}
function n2(x,y,r){ // cheap value noise with seeded hash
  var xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  function h(a,b){var v=Math.sin(a*127.1+b*311.7+r)*43758.5453;return v-Math.floor(v);}
  var u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  return (h(xi,yi)*(1-u)+h(xi+1,yi)*u)*(1-v)+(h(xi,yi+1)*(1-u)+h(xi+1,yi+1)*u)*v;
}
function Art(canvas,seed,dark){
  this.c=canvas;this.x=canvas.getContext("2d");this.seed=seed;this.dark=!!dark;
  this.pts=[];this.t=Math.random()*100;this.live=false;this.sized=0;
  var r=rng(seed);
  this.hueA=r()*360;this.hueB=(this.hueA+60+r()*140)%360;
  var count=dark?260:150;
  for(var i=0;i<count;i++) this.pts.push({x:r(),y:r(),px:0,py:0,life:r()*120});
}
Art.prototype.size=function(){
  var w=this.c.clientWidth,h=this.c.clientHeight;
  if(!w||!h) return false;
  var d=Math.min(devicePixelRatio||1,1.5);
  if(this.c.width!==Math.floor(w*d)||this.c.height!==Math.floor(h*d)){
    this.c.width=Math.floor(w*d);this.c.height=Math.floor(h*d);
    this.x.fillStyle=this.dark?"#0d0a0c":"#dfe4df";
    this.x.fillRect(0,0,this.c.width,this.c.height);
  }
  return true;
};
Art.prototype.step=function(){
  if(!this.size()) return;
  var x=this.x,W=this.c.width,H=this.c.height,s=this.seed;
  this.t+=0.006;
  x.globalCompositeOperation="source-over";
  x.fillStyle=this.dark?"rgba(13,10,12,0.055)":"rgba(223,228,223,0.055)";
  x.fillRect(0,0,W,H);
  x.globalCompositeOperation=this.dark?"lighter":"source-over";
  x.lineWidth=Math.max(1,W/620);
  for(var i=0;i<this.pts.length;i++){
    var p=this.pts[i];
    var a=n2(p.x*3.2+this.t,p.y*3.2,s)*Math.PI*4;
    p.px=p.x;p.py=p.y;
    p.x+=Math.cos(a)*0.0035;p.y+=Math.sin(a)*0.0035;
    p.life--;
    if(p.life<0||p.x<0||p.x>1||p.y<0||p.y>1){
      p.x=Math.random();p.y=Math.random();p.life=60+Math.random()*160;continue;
    }
    var mixv=n2(p.x*2.0,p.y*2.0+this.t,s);
    var hue=this.hueA*(1-mixv)+this.hueB*mixv;
    x.strokeStyle=this.dark
      ? "hsla("+hue+",85%,"+(48+mixv*22)+"%,0.30)"
      : "hsla("+hue+",38%,"+(22+mixv*30)+"%,0.20)";
    x.beginPath();x.moveTo(p.px*W,p.py*H);x.lineTo(p.x*W,p.y*H);x.stroke();
  }
};

var arts=[];
rail.querySelectorAll("canvas").forEach(function(c){
  var a=new Art(c,+c.dataset.seed,false);arts.push(a);
  var io=new IntersectionObserver(function(e){a.live=e[0].isIntersecting;},{rootMargin:"120px"});
  io.observe(c);
});
var thumbArt=new Art(document.querySelector("#thumb canvas"),1,true);
var panelArt=null;

/* ============ world B clone ============ */
var inner=document.getElementById("worldBInner");
function buildClone(){
  inner.innerHTML="";
  var head=document.querySelector("header").cloneNode(true);
  var c=document.getElementById("content").cloneNode(true);
  [head,c].forEach(function(node){
    node.removeAttribute("id");
    node.querySelectorAll("[id]").forEach(function(el){el.removeAttribute("id");});
    node.querySelectorAll("canvas").forEach(function(el){el.parentNode.removeChild(el);});
    node.querySelectorAll("[data-alt]").forEach(function(el){el.textContent=el.dataset.alt;});
    node.querySelectorAll("a,button").forEach(function(el){el.setAttribute("tabindex","-1");});
    node.querySelectorAll(".rv").forEach(function(el){el.classList.add("in");});
  });
  var oldHead=worldB.querySelector("header");
  if(oldHead)oldHead.parentNode.removeChild(oldHead);
  worldB.appendChild(head);
  inner.appendChild(c);
  inner.querySelector(".rail").scrollLeft=rail.scrollLeft;
}

/* ============ smooth scroll ============ */
var viewport=document.getElementById("viewport"),scroller=document.getElementById("scroller"),spacer=document.getElementById("spacer");
var SS={target:0,cur:0,vel:0,max:0};
function measure(){
  var h=scroller.scrollHeight;
  spacer.style.height=h+"px";
  SS.max=Math.max(0,h-innerHeight);
  inner.style.width=document.documentElement.clientWidth+"px";
}
new ResizeObserver(measure).observe(scroller);
addEventListener("resize",measure);

/* ============ pointer + portal ============ */
var P={x:innerWidth/2,y:innerHeight/2,tx:innerWidth/2,ty:innerHeight/2,hold:0,target:0,wave:2,hover:0,hoverT:0};
var maxR=Math.hypot(innerWidth,innerHeight)*1.08;
var body=document.body,worldB=document.getElementById("worldB");
var holdSuppressed=false;

addEventListener("pointermove",function(e){P.tx=e.clientX;P.ty=e.clientY;cur.classList.add("on");},{passive:true});
addEventListener("pointerdown",function(e){
  if(e.button!==undefined&&e.button!==0)return;
  if(e.clientX!==undefined){P.tx=e.clientX;P.ty=e.clientY;}
  if(holdSuppressed)return;
  P.target=1;P.wave=0;
});
function release(){if(P.target===1)P.wave=0;P.target=0;}
addEventListener("pointerup",release);addEventListener("pointercancel",release);addEventListener("blur",release);
addEventListener("contextmenu",function(e){if(P.target)e.preventDefault();});

/* ============ cursor ============ */
var cur=document.getElementById("cursor"),curLbl=cur.querySelector(".lbl"),curArc=cur.querySelector("circle");
var CIRC=138.2,curLabel="",magnet=null,mag={x:0,y:0};
var LABELS={open:"open",close:"close",drag:"drag",mail:"say hi",copy:"copy",top:"top",lab:"see",link:"open"};
document.addEventListener("pointerover",function(e){
  var el=e.target.closest&&e.target.closest("[data-cursor]");
  var m=e.target.closest&&e.target.closest("button,a");
  magnet=(m&&!m.closest(".rail"))?m:null;
  if(el){curLabel=LABELS[el.dataset.cursor]||"";cur.classList.add("label","warm");}
  else{curLabel="";cur.classList.remove("label","warm");}
  curLbl.textContent=curLabel;
});

/* ============ scramble text ============ */
var CH="ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&/*+-<>";
function scramble(el){
  if(el._scr)return;
  var final=el.dataset.orig||(el.dataset.orig=el.textContent);
  var i=0,steps=final.length*2+6;
  el._scr=setInterval(function(){
    i++;
    var prog=i/steps*final.length;
    var out="";
    for(var k=0;k<final.length;k++){
      out+= k<prog-1 ? final[k] : (final[k]===" "?" ":CH[(Math.random()*CH.length)|0]);
    }
    el.textContent=out;
    if(i>=steps){clearInterval(el._scr);el._scr=null;el.textContent=final;}
  },26);
}
document.querySelectorAll("[data-scramble]").forEach(function(el){
  var host=el.closest("button")||el;
  host.addEventListener("pointerenter",function(){if(!reduce)scramble(el);});
});

/* ============ audio ============ */
var AU={ctx:null,on:false,level:0,gain:null,filter:null,osc:[]};
function initAudio(){
  if(AU.ctx)return;
  var C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  AU.ctx=new C();
  AU.gain=AU.ctx.createGain();AU.gain.gain.value=0;
  AU.filter=AU.ctx.createBiquadFilter();AU.filter.type="lowpass";AU.filter.frequency.value=380;AU.filter.Q.value=6;
  AU.filter.connect(AU.gain);AU.gain.connect(AU.ctx.destination);
  [55,82.5,110.3,164.5].forEach(function(f,i){
    var o=AU.ctx.createOscillator();o.type=i%2?"triangle":"sine";o.frequency.value=f;
    var g=AU.ctx.createGain();g.gain.value=i===0?0.5:0.18;
    var lfo=AU.ctx.createOscillator();lfo.frequency.value=0.05+i*0.017;
    var lg=AU.ctx.createGain();lg.gain.value=f*0.004;
    lfo.connect(lg);lg.connect(o.frequency);lfo.start();
    o.connect(g);g.connect(AU.filter);o.start();AU.osc.push(o);
  });
}
function blip(freq,dur,vol){
  if(!AU.on||!AU.ctx)return;
  var o=AU.ctx.createOscillator(),g=AU.ctx.createGain();
  o.type="square";o.frequency.value=freq;
  g.gain.setValueAtTime(0,AU.ctx.currentTime);
  g.gain.linearRampToValueAtTime(vol||0.03,AU.ctx.currentTime+0.005);
  g.gain.exponentialRampToValueAtTime(0.0001,AU.ctx.currentTime+(dur||0.09));
  o.connect(g);g.connect(AU.ctx.destination);o.start();o.stop(AU.ctx.currentTime+(dur||0.09)+0.02);
}
var soundBtn=document.getElementById("sound"),soundLbl=document.getElementById("soundLbl");
function toggleSound(){
  initAudio();if(!AU.ctx)return;
  AU.on=!AU.on;
  if(AU.ctx.state==="suspended")AU.ctx.resume();
  AU.gain.gain.cancelScheduledValues(AU.ctx.currentTime);
  AU.gain.gain.linearRampToValueAtTime(AU.on?0.11:0,AU.ctx.currentTime+0.6);
  soundBtn.classList.toggle("on",AU.on);soundBtn.setAttribute("aria-pressed",AU.on);
  soundLbl.textContent=AU.on?"sound on":"sound off";
}
soundBtn.addEventListener("click",toggleSound);
document.querySelectorAll(".row").forEach(function(r,i){
  r.addEventListener("pointerenter",function(){blip(420+i*46,0.05,0.018);});
});

/* ============ project panel ============ */
var panel=document.getElementById("panel"),panelInner=document.getElementById("panelInner"),openIndex=-1;
function openProject(i){
  var p=PROJECTS[i];if(!p)return;
  openIndex=i;
  panelInner.innerHTML=
    '<h2>'+p.t+'</h2>'+
    '<div class="meta"><span>'+p.y+'</span><span>'+p.role+'</span><span>'+p.stack+'</span><span>'+p.team+'</span></div>'+
    '<div class="hero-canvas"><canvas></canvas></div>'+
    '<div class="cols"><div>'+p.body.slice(0,2).map(function(b){return "<p>"+b+"</p>";}).join("")+'</div>'+
    '<div>'+p.body.slice(2).map(function(b){return "<p>"+b+"</p>";}).join("")+
    '<p><strong>'+p.m+'</strong></p></div></div>'+
    '<div class="nextrow"><span>next project</span><button id="nextBtn" data-cursor="open">'+PROJECTS[(i+1)%PROJECTS.length].t+' →</button></div>';
  panelArt=new Art(panelInner.querySelector("canvas"),p.seed,true);
  panel.classList.add("open");panel.setAttribute("aria-hidden","false");
  body.classList.add("no-scroll");holdSuppressed=true;release();
  panel.scrollTop=0;
  blip(240,0.12,0.03);
  document.getElementById("nextBtn").addEventListener("click",function(){openProject((openIndex+1)%PROJECTS.length);});
}
function closeProject(){
  panel.classList.remove("open");panel.setAttribute("aria-hidden","true");
  body.classList.remove("no-scroll");holdSuppressed=false;panelArt=null;openIndex=-1;
  blip(180,0.1,0.025);
}
rows.addEventListener("click",function(e){
  var r=e.target.closest(".row");if(r)openProject(+r.dataset.i);
});
document.getElementById("panelClose").addEventListener("click",closeProject);

/* ============ thumb follow ============ */
var thumb=document.getElementById("thumb"),thumbOn=false,thumbRot=0;
rows.addEventListener("pointerover",function(e){
  var r=e.target.closest(".row");if(!r)return;
  var p=PROJECTS[+r.dataset.i];
  thumbArt=new Art(thumb.querySelector("canvas"),p.seed,true);
  thumbOn=true;thumb.classList.add("on");P.hoverT=1;
});
rows.addEventListener("pointerout",function(e){
  if(e.relatedTarget&&e.relatedTarget.closest&&e.relatedTarget.closest(".row"))return;
  thumbOn=false;thumb.classList.remove("on");P.hoverT=0;
});

/* ============ lab rail drag ============ */
(function(){
  var down=false,sx=0,sl=0,vel=0,last=0,raf=null;
  rail.addEventListener("pointerdown",function(e){
    down=true;sx=e.clientX;sl=rail.scrollLeft;last=e.clientX;rail.classList.add("drag");
    rail.setPointerCapture(e.pointerId);
  });
  rail.addEventListener("pointermove",function(e){
    if(!down)return;
    rail.scrollLeft=sl-(e.clientX-sx);
    vel=last-e.clientX;last=e.clientX;
  });
  function end(){
    if(!down)return;down=false;rail.classList.remove("drag");
    cancelAnimationFrame(raf);
    (function glide(){
      vel*=0.94;
      if(Math.abs(vel)>0.4){rail.scrollLeft+=vel;raf=requestAnimationFrame(glide);}
    })();
  }
  rail.addEventListener("pointerup",end);rail.addEventListener("pointercancel",end);
  rail.addEventListener("wheel",function(e){
    if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
  },{passive:true});
})();

/* ============ nav / goto ============ */
var SECTIONS=["top","work","lab","studio","contact"];
function goto(id){
  var el=document.getElementById("s-"+id);if(!el)return;
  var y=el.getBoundingClientRect().top+SS.cur-(id==="top"?0:40);
  scrollTo({top:clamp(y,0,SS.max),behavior:reduce?"auto":"smooth"});
  blip(520,0.07,0.02);
}
document.querySelectorAll("[data-goto]").forEach(function(b){
  b.addEventListener("click",function(){goto(b.dataset.goto);});
});
document.querySelector(".mark").addEventListener("click",function(){goto("top");});
document.querySelectorAll('a[href^="#s-"]').forEach(function(a){
  a.addEventListener("click",function(e){e.preventDefault();goto(a.getAttribute("href").slice(3));});
});

/* ============ reveal ============ */
var io=new IntersectionObserver(function(es){
  es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});
},{rootMargin:"-8% 0px -8% 0px"});
document.querySelectorAll("#scroller .rv").forEach(function(el){io.observe(el);});

/* ============ keyboard ============ */
var grid=document.getElementById("gridlines");
addEventListener("keydown",function(e){
  if(e.code==="Space"&&!e.repeat&&(e.target===document.body)){e.preventDefault();if(!holdSuppressed){P.target=1;P.wave=0;}}
  if(e.key==="g"||e.key==="G")grid.classList.toggle("on");
  if(e.key==="m"||e.key==="M")toggleSound();
  if(e.key==="Escape"&&openIndex>=0)closeProject();
  if(e.key==="ArrowRight"&&openIndex>=0)openProject((openIndex+1)%PROJECTS.length);
  if(e.key==="ArrowLeft"&&openIndex>=0)openProject((openIndex-1+PROJECTS.length)%PROJECTS.length);
});
addEventListener("keyup",function(e){if(e.code==="Space")release();});

/* ============ webgl ============ */
var canvas=document.getElementById("gl");
var gl=canvas.getContext("webgl",{antialias:false,alpha:false,powerPreference:"high-performance"})||canvas.getContext("experimental-webgl");
var U={},ok=false;
if(gl){
  var prog=gl.createProgram();
  [VS_SRC,FS_SRC].forEach(function(src,i){
    var sh=gl.createShader(i?gl.FRAGMENT_SHADER:gl.VERTEX_SHADER);
    gl.shaderSource(sh,src);gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))console.warn(gl.getShaderInfoLog(sh));
    gl.attachShader(prog,sh);
  });
  gl.linkProgram(prog);
  if(gl.getProgramParameter(prog,gl.LINK_STATUS)){
    gl.useProgram(prog);
    var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    var loc=gl.getAttribLocation(prog,"p");gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    ["uRes","uMouse","uTime","uHold","uRadius","uScroll","uWave","uHover","uVel","uAudio","uBoot"]
      .forEach(function(n){U[n]=gl.getUniformLocation(prog,n);});
    ok=true;
  }
}
if(!ok){var fb=document.createElement("div");fb.className="fallback";document.body.insertBefore(fb,document.body.firstChild);canvas.style.display="none";}
var dpr=1;
function resize(){
  dpr=Math.min(devicePixelRatio||1,1.75);
  maxR=Math.hypot(innerWidth,innerHeight)*1.08;
  measure();
  if(!ok)return;
  canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);
  canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";
  gl.viewport(0,0,canvas.width,canvas.height);
}
addEventListener("resize",resize);resize();

/* ============ loader ============ */
var boot=0,loadPct=0,loader=document.getElementById("loader");
var loadCount=document.getElementById("loadCount"),loadBar=document.getElementById("loadBar"),loadMsg=document.getElementById("loadMsg");
var MSGS=["compiling shaders","warming the noise field","seeding 2.4M particles","opening the membrane"];
var loadTimer=setInterval(function(){
  loadPct=Math.min(100,loadPct+2+Math.random()*7);
  loadCount.textContent=Math.floor(loadPct);
  loadBar.style.width=loadPct+"%";
  loadMsg.textContent=MSGS[Math.min(3,Math.floor(loadPct/26))];
  if(loadPct>=100){
    clearInterval(loadTimer);
    setTimeout(function(){
      loader.classList.add("done");body.classList.add("ready");buildClone();
    },260);
  }
},reduce?20:90);

/* ============ hud ============ */
var hudDim=document.getElementById("hudDim"),hudXY=document.getElementById("hudXY"),
    hudFps=document.getElementById("hudFps"),hudVel=document.getElementById("hudVel"),
    progBar=document.querySelector("#progress i");
var fps=60,lastT=performance.now(),acc=0,frames=0;

/* ============ main loop ============ */
var start=performance.now(),navTick=0;
function frame(now){
  var dt=Math.min(64,now-lastT);lastT=now;
  var t=(now-start)/1000*(reduce?0.25:1);
  frames++;acc+=dt;
  if(acc>500){fps=Math.round(frames*1000/acc);frames=0;acc=0;hudFps.textContent=fps;}

  // scroll
  SS.target=clamp(scrollY,0,SS.max);
  var prev=SS.cur;
  SS.cur=reduce?SS.target:lerp(SS.cur,SS.target,0.11);
  if(Math.abs(SS.cur-SS.target)<0.06)SS.cur=SS.target;
  SS.vel=lerp(SS.vel,(SS.cur-prev),0.3);
  scroller.style.transform="translate3d(0,"+(-SS.cur)+"px,0)";
  inner.style.transform="translate3d(0,"+(-SS.cur)+"px,0)";
  progBar.style.height=(SS.max?clamp(SS.cur/SS.max,0,1):0)*100+"%";

  // pointer + portal
  P.x=lerp(P.x,P.tx,0.13);P.y=lerp(P.y,P.ty,0.13);
  P.hold+=(P.target-P.hold)*(P.target?0.055:0.085);
  if(P.hold<0.0005)P.hold=0;
  P.hover=lerp(P.hover,P.hoverT,0.08);
  if(P.wave<1)P.wave=Math.min(1,P.wave+0.014);
  var ease=P.hold*P.hold*(3-2*P.hold);
  var radius=ease*maxR;
  worldB.style.setProperty("--px",P.x+"px");
  worldB.style.setProperty("--py",P.y+"px");
  worldB.style.setProperty("--pr",radius+"px");
  body.classList.toggle("cursor-hidden",true);

  // cursor
  var cx=P.tx,cy=P.ty;
  if(magnet){
    var r=magnet.getBoundingClientRect();
    var mx=r.left+r.width/2,my=r.top+r.height/2;
    var dx=mx-P.tx,dy=my-P.ty;
    if(Math.hypot(dx,dy)<Math.max(r.width,120)){mag.x=lerp(mag.x,dx*0.28,0.2);mag.y=lerp(mag.y,dy*0.4,0.2);}
    else{mag.x=lerp(mag.x,0,0.2);mag.y=lerp(mag.y,0,0.2);}
  } else {mag.x=lerp(mag.x,0,0.2);mag.y=lerp(mag.y,0,0.2);}
  cx+=mag.x;cy+=mag.y;
  var scale=1+ease*0.5+(cur.classList.contains("label")?0.22:0);
  cur.style.transform="translate3d("+cx+"px,"+cy+"px,0) scale("+scale+")";
  curArc.setAttribute("stroke-dashoffset",CIRC*(1-Math.min(P.hold*1.6,1)));
  cur.classList.toggle("hot",ease>0.55);

  // thumb
  if(thumbOn||thumb.classList.contains("on")){
    thumbRot=lerp(thumbRot,clamp(SS.vel*0.35+(P.tx-P.x)*0.22,-14,14),0.12);
    thumb.style.transform="translate3d("+P.x+"px,"+P.y+"px,0) rotate("+thumbRot+"deg)";
    thumbArt.step();
  }

  // marquee
  track.style.transform="translate3d("+(-((now*0.035+SS.cur*0.5)%(track.scrollWidth/3)))+"px,0,0) skewX("+clamp(-SS.vel*0.18,-8,8)+"deg)";

  // lab canvases
  for(var i=0;i<arts.length;i++) if(arts[i].live) arts[i].step();
  if(panelArt&&panel.classList.contains("open")) panelArt.step();

  // audio ties to state
  if(AU.on&&AU.ctx){
    AU.level=lerp(AU.level,0.25+ease*0.75,0.06);
    AU.filter.frequency.value=320+ease*2200+Math.abs(SS.vel)*12;
    AU.gain.gain.value=lerp(AU.gain.gain.value,0.08+ease*0.07,0.05);
  } else AU.level=lerp(AU.level,0,0.05);

  // nav current section
  if(now-navTick>180){
    navTick=now;
    var best="top";
    SECTIONS.forEach(function(id){
      var el=document.getElementById("s-"+id);
      if(el&&el.getBoundingClientRect().top<innerHeight*0.42)best=id;
    });
    document.querySelectorAll("[data-goto]").forEach(function(b){
      b.setAttribute("aria-current",b.dataset.goto===best?"true":"false");
    });
    hudDim.textContent=ease>0.5?"undertow":"surface";
    hudXY.textContent=Math.round(P.tx)+","+Math.round(P.ty);
    hudVel.textContent=Math.abs(SS.vel).toFixed(1);
  }

  boot=lerp(boot,1,0.03);

  if(ok){
    gl.uniform2f(U.uRes,canvas.width,canvas.height);
    gl.uniform2f(U.uMouse,P.x*dpr,P.y*dpr);
    gl.uniform1f(U.uTime,t);
    gl.uniform1f(U.uHold,ease);
    gl.uniform1f(U.uRadius,radius*dpr);
    gl.uniform1f(U.uScroll,SS.cur/innerHeight);
    gl.uniform1f(U.uWave,P.wave);
    gl.uniform1f(U.uHover,P.hover);
    gl.uniform1f(U.uVel,clamp(SS.vel*0.06,-3,3));
    gl.uniform1f(U.uAudio,AU.level);
    gl.uniform1f(U.uBoot,boot);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
measure();
})();