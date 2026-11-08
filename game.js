import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const canvas = document.querySelector('#world');
const shell = document.querySelector('#game-shell');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d99a70');
scene.fog = new THREE.Fog('#d99a70', 34, 86);
const camera = new THREE.PerspectiveCamera(43, 1, .1, 120);
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const mat = (color, roughness=.92, extra={}) => new THREE.MeshStandardMaterial({color, roughness, ...extra});
const mats = {
  grass:mat('#778c68'), grass2:mat('#87936d'), path:mat('#c5a17b'), pathEdge:mat('#d6b58c'), wood:mat('#604b3d'), woodLight:mat('#967052'), dark:mat('#293c39'), roof1:mat('#bd795b'), roof2:mat('#4f7772'), roof3:mat('#d4a466'), cream:mat('#ead7ad'), window:mat('#f3c77e',.3,{emissive:'#d28c40',emissiveIntensity:.35}), green:mat('#4f705e'), leaf1:mat('#66846a'), leaf2:mat('#84936a'), stone:mat('#72756c'), gold:mat('#f9c86e',.28,{emissive:'#f3a83b',emissiveIntensity:.8}), rail:mat('#4f5550',.38), teal:mat('#648b83'), skin:mat('#e9b38a'), hair:mat('#4e493c'), pants:mat('#536b69'), boot:mat('#463e37')
};
const hemi = new THREE.HemisphereLight('#ffe3b4','#56695a',2.05); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffcf91',3.2); sun.position.set(-18,28,12); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-38; sun.shadow.camera.right=38; sun.shadow.camera.top=38; sun.shadow.camera.bottom=-38; sun.shadow.bias=-.0004; scene.add(sun);
const fill = new THREE.DirectionalLight('#b7d4ca',.8); fill.position.set(12,13,-24); scene.add(fill);
const world = new THREE.Group(); scene.add(world);

function box(parent, x,y,z, sx,sy,sz, material, cast=true) { const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material); o.position.set(x,y,z); o.castShadow=cast; o.receiveShadow=true; parent.add(o); return o; }
function sphere(parent,x,y,z,sx,sy,sz,material,segments=12){const o=new THREE.Mesh(new THREE.SphereGeometry(1,segments,Math.max(7,segments>>1)),material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o;}
function cylinder(parent,x,y,z,rt,rb,h,material,segments=8){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function plane(parent,x,y,z,sx,sz,material){const o=new THREE.Mesh(new THREE.PlaneGeometry(sx,sz),material);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);return o;}

// Soft, rolling edges around the walkable village.
plane(world,0,-.28,-7,120,120,mats.grass);
for(let i=0;i<18;i++){
  const side=i%2?1:-1, z=-31+i*3.9, x=side*(21+Math.sin(i*1.7)*4), r=3+((i*7)%4);
  const hill=sphere(world,x,-1.7,z,r,r*.75,r*.8, i%3===0?mats.grass2:mats.green,9); hill.castShadow=false;
}
// The curving cream-colored lane draws the eye from the square to the mine.
const roadPoints=[new THREE.Vector3(2,.015,18),new THREE.Vector3(1,.015,10),new THREE.Vector3(-1,.015,3),new THREE.Vector3(-.6,.015,-5),new THREE.Vector3(1,.015,-13),new THREE.Vector3(0,.015,-25)];
const roadCurve=new THREE.CatmullRomCurve3(roadPoints);
const road=new THREE.Mesh(new THREE.TubeGeometry(roadCurve,90,2.25,8,false),mats.path); road.position.y=.05; road.scale.y=.12; road.receiveShadow=true; world.add(road);
// Little stone shoulders help the path sit in the meadow.
for(let i=0;i<42;i++){
 const t=i/42, p=roadCurve.getPoint(t), tangent=roadCurve.getTangent(t), side=new THREE.Vector3(-tangent.z,0,tangent.x), d=2.65+(i%3)*.17;
 if(i%2===0){const peb=sphere(world,p.x+side.x*d,.02,p.z+side.z*d,.15,.07,.11,i%4?mats.pathEdge:mats.stone,7);peb.rotation.y=i;}
}
// Village buildings: friendly compact cottages around the square.
function house(x,z,bodyColor,roofColor,scale=1,angle=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;g.scale.setScalar(scale);world.add(g);
 box(g,0,1.05,0,3.8,2.1,3.4,mat(bodyColor));
 const roof=cylinder(g,0,2.45,0,0,2.55,1.8,mat(roofColor),4); roof.rotation.y=Math.PI/4; roof.rotation.x=Math.PI/2;
 box(g,0,.58,1.73,.65,1.1,.08,mats.woodLight);
 box(g,-1.05,1.32,1.76,.7,.62,.1,mats.window,false); box(g,1.05,1.32,1.76,.7,.62,.1,mats.window,false);
 box(g,-1.05,1.32,1.82,.07,.68,.06,mats.cream,false); box(g,1.05,1.32,1.82,.07,.68,.06,mats.cream,false);
 box(g,0,1.32,1.82, .76,.07,.06,mats.cream,false);
 box(g,0,2.18,-.9,.45,.7,.38,mats.woodLight);
 return g;
}
house(-8,8,'#d7ad80','#b57859',1.05,-.16); house(8,10,'#c7c394','#547671',1, .15); house(-10,-2,'#dfc99e','#7c8e71',.9,.18); house(9,-3,'#c78c6d','#d5a25e',.95,-.12); house(-7,17,'#c99a73','#4c7370',.8,.1); house(8,18,'#d7c49c','#ad765d',.8,-.1);
// Timber mine portal and the little waiting tram at the far end of the lane.
const mine=new THREE.Group(); mine.position.set(0,0,-28); world.add(mine);
box(mine,0,1.7,-.1,8,3.4,1,mats.stone); box(mine,0,1.35,.48,4.35,2.45,.16,mats.dark);
box(mine,-2.35,1.7,.45,.45,3.1,.58,mats.wood); box(mine,2.35,1.7,.45,.45,3.1,.58,mats.wood); box(mine,0,3.12,.45,5.1,.42,.7,mats.wood);
for(let i=-1;i<=1;i++){const brace=box(mine,i*1.05,1.55,.62,.12,2.3,.12,mats.woodLight);brace.rotation.z=i*.22;}
// Rails run out of the mine and end at a cheerful little tram.
for(const x of [-.65,.65]){const r=box(mine,x,.08,4,.12,.15,9,mats.rail,false);r.rotation.x=.02;}
for(let i=0;i<13;i++)box(mine,0,.06,.2+i*.65,1.7,.09,.16,mats.woodLight,false);
const tram=new THREE.Group();tram.position.set(0,0,6);mine.add(tram);
box(tram,0,.8,0,3.1,1.45,2.15,mat('#bd7658'));box(tram,0,1.7,0,3.35,.22,2.38,mats.wood);
for(const x of [-.95,.95])box(tram,x,1.05,1.09,.68,.6,.1,mats.window,false);
box(tram,0,.5,1.1,.9,.95,.1,mats.woodLight);for(const x of [-1,1])cylinder(tram,x,.2,-.55,.4,.4,.2,mats.dark,10);
// Conifer-like trees and lamps, arranged with a hand-placed storybook rhythm.
function tree(x,z,size=1,leaf=mats.leaf1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(size);world.add(g);cylinder(g,0,.8,0,.22,.33,1.6,mats.wood,7);for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(1.05-i*.13,1.85,7),leaf);c.position.y=1.45+i*.67;c.castShadow=true;g.add(c);}sphere(g,-.7,.12,.18,.46,.15,.35,mats.stone,7);return g;}
for(const [x,z,s] of [[-13,11,1.1],[13,13,1.15],[-14,3,.9],[14,2,1.05],[-12,-8,1.2],[12,-10,1.2],[-8,-18,.9],[9,-19,1],[5,21,.8],[-5,23,.9],[-18,-20,1.2],[18,-22,1.2]]) tree(x,z,s,(x+z)%2?mats.leaf1:mats.leaf2);
const lamps=[];
function lamp(x,z){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);cylinder(g,0,1.2,0,.07,.1,2.4,mats.dark,7);const arm=box(g,.28,2.27,0,.65,.09,.1,mats.dark);arm.rotation.z=-.1; sphere(g,.55,2.12,0,.23,.27,.23,mats.gold,10);const l=new THREE.PointLight('#ffd18c',1.1,8,2);l.position.set(.5,2.1,0);g.add(l);lamps.push(l);}
[[-4,11],[4,4],[-4,-7],[4,-17],[-2,-25]].forEach(p=>lamp(...p));
// A few square flower beds soften the village square.
for(const [x,z] of [[-4,5],[5,13],[-5,-4],[4,-10]]){
 box(world,x,.13,z,1.55,.25,1.2,mats.woodLight,false);
 for(let i=0;i<5;i++){const fx=x-.48+(i%3)*.46, fz=z-.34+Math.floor(i/3)*.45; cylinder(world,fx,.43,fz,.035,.04,.55,mats.green,5);sphere(world,fx,.73,fz,.12,.12,.12,i%2?mats.gold:mats.window,7);}
}
// Protagonist Ada: original pocket-sized explorer with a bright scarf and a daypack.
const player=new THREE.Group();player.position.set(0,0,13);world.add(player);
const avatar=new THREE.Group();player.add(avatar);
sphere(avatar,0,1.5,0,.52,.56,.47,mats.skin,16);
sphere(avatar,0,1.84,-.015,.55,.3,.5,mats.hair,12);
sphere(avatar,-.42,1.58,.08,.2,.29,.26,mats.hair,9);sphere(avatar,.42,1.58,.08,.2,.29,.26,mats.hair,9);
// face points toward the journey (-Z)
sphere(avatar,-.18,1.51,-.42,.045,.06,.035,mats.dark,8);sphere(avatar,.18,1.51,-.42,.045,.06,.035,mats.dark,8);
sphere(avatar,0,1.34,-.46,.1,.045,.03,mat('#b46f58'),8);
box(avatar,0,.83,0,.72,.72,.52,mats.teal);box(avatar,0,.98,-.3,.68,.18,.1,mat('#e8a56c'));
box(avatar,-.47,.84,.12,.2,.56,.22,mats.woodLight).rotation.z=-.18;box(avatar,.47,.84,.12,.2,.56,.22,mats.woodLight).rotation.z=.18;
box(avatar,0,.87,.34,.52,.52,.18,mat('#bc805e'));
const legs=[];for(const x of [-.2,.2]){const leg=box(avatar,x,.32,0,.23,.48,.27,mats.pants);legs.push(leg);box(avatar,x,.1,-.04,.3,.18,.42,mats.boot);}
const arms=[];for(const x of [-.48,.48]){const a=box(avatar,x,.56,0,.19,.4,.2,mats.teal);a.rotation.z=x<0?-.22:.22;arms.push(a);}
// Floating emberstones are small luminous keepsakes; proximity is enough to pick one up.
const stonePositions=[[-5,0,5],[5,0,-1],[-4,0,-8],[4,0,-14],[-3,0,-20],[0,0,-26]];
const stones=[];
const stoneMat=new THREE.MeshStandardMaterial({color:'#ffd47e',emissive:'#ef9d37',emissiveIntensity:1.55,roughness:.27,metalness:.05});
for(let i=0;i<stonePositions.length;i++){
 const [x,y,z]=stonePositions[i],g=new THREE.Group();g.position.set(x,.85,z);world.add(g);
 const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.47,0),stoneMat);crystal.castShadow=true;g.add(crystal);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(.68,.025,5,24),new THREE.MeshBasicMaterial({color:'#ffe5a7',transparent:true,opacity:.75}));halo.rotation.x=Math.PI/2;g.add(halo);
 const light=new THREE.PointLight('#ffc76d',.6,4);g.add(light);stones.push({group:g,crystal,halo,light,baseY:.85,collected:false,index:i});
}
// Destination shimmer at the tram doors.
const finishMarker=new THREE.Group();finishMarker.position.set(0,.12,-22);world.add(finishMarker);
const markerRing=new THREE.Mesh(new THREE.TorusGeometry(1,.045,8,36),new THREE.MeshBasicMaterial({color:'#f9ca80',transparent:true,opacity:.85}));markerRing.rotation.x=Math.PI/2;finishMarker.add(markerRing);
const markerLight=new THREE.PointLight('#ffd38a',.65,7);markerLight.position.y=1.3;finishMarker.add(markerLight);

const keys=new Set();let started=false,paused=false,won=false,soundOn=true,stonesFound=0,startTime=0,lastTime=0,toastTimer=0,jumpV=0,onGround=true;
const playerSpeed=6.2;const desiredCamera=new THREE.Vector3();const lookTarget=new THREE.Vector3();
let audioContext=null;
function chirp(freq=660,duration=.16){if(!soundOn)return;try{audioContext??=new AudioContext();if(audioContext.state==='suspended')audioContext.resume();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,audioContext.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*1.55,audioContext.currentTime+duration);gain.gain.setValueAtTime(.055,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);}catch{}}
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2000);}
function updateHUD(){document.querySelector('#stone-count').textContent=stonesFound;document.querySelector('#stone-progress').style.width=`${stonesFound/6*100}%`;document.querySelector('#quest-copy').textContent=stonesFound===6?'All six are glowing. Find the tram!':`${6-stonesFound} emberstone${6-stonesFound===1?'':'s'} still out there`;}
function updateLocation(){const z=player.position.z, label=z>6?'THE OLD LANTERN SQUARE':z>-4?'PINECONE LANE':z>-15?'THE OLD RAILWAY':z>-24?'BRAMBLE HOLLOW':'THE LITTLE MINE TRAM';document.querySelector('#location-name').textContent=label;document.querySelector('.location small').textContent=z>6?'Cinderwick village':z>-4?'past the cottage gardens':z>-15?'follow the lanterns':'up in the ember hills';const mapPlayer=document.querySelector('.map-player');mapPlayer.style.top=`${Math.max(12,Math.min(78,((13-player.position.z)/42)*78+9))}%`;mapPlayer.style.left=`${Math.max(15,Math.min(78,50+player.position.x*1.35))}%`;}
function move(dt){let x=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0),z=(keys.has('ArrowDown')||keys.has('s')?1:0)-(keys.has('ArrowUp')||keys.has('w')?1:0);const len=Math.hypot(x,z);if(len){x/=len;z/=len;player.position.x+=x*playerSpeed*dt;player.position.z+=z*playerSpeed*dt;player.rotation.y=Math.atan2(-x,-z);}
 player.position.x=THREE.MathUtils.clamp(player.position.x,-17,17);player.position.z=THREE.MathUtils.clamp(player.position.z,-31,20);
 if(keys.has(' ')&&onGround){jumpV=6.5;onGround=false;chirp(420,.09);}if(!onGround){player.position.y+=jumpV*dt;jumpV-=17*dt;if(player.position.y<=0){player.position.y=0;onGround=true;jumpV=0;}}
 const walking=len>0;avatar.position.y=walking&&onGround?Math.abs(Math.sin(performance.now()*.012))*.08:0;legs.forEach((l,i)=>l.rotation.x=walking?Math.sin(performance.now()*.012+i*Math.PI)*.52:0);arms.forEach((a,i)=>a.rotation.x=walking?Math.sin(performance.now()*.012+i*Math.PI)*.44:Math.sin(performance.now()*.002+i)*.04);
}
function collectAndFinish(time){for(const s of stones){if(s.collected)continue;const d=Math.hypot(player.position.x-s.group.position.x,player.position.z-s.group.position.z);if(d<1.55){s.collected=true;stonesFound++;world.remove(s.group);updateHUD();chirp(690+stonesFound*60,.24);toast(['A little pocket of warmth.','Found one! Keep following the glow.','This town keeps its secrets well.','Nearly there, little wanderer.','One more sparkle to find!','The old tram is waiting!'][stonesFound-1]);if(stonesFound===6)document.querySelector('#quest-copy').textContent='All six are glowing. Find the tram!';}}
 const d=Math.hypot(player.position.x,player.position.z+22);document.querySelector('#collect-prompt').classList.toggle('hidden',d>2.7||stonesFound===6);if(d<2.1&&stonesFound===6&&!won){won=true;chirp(780,.4);document.querySelector('#finish-time').textContent=formatTime(time-startTime);document.querySelector('#finish-screen').classList.remove('hidden');}}
function formatTime(seconds){const s=Math.floor(seconds),m=Math.floor(s/60);return `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function resize(){const w=shell.clientWidth,h=shell.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
window.addEventListener('keydown',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key))e.preventDefault();keys.add(key);if(key==='Escape'&&started)togglePause();});window.addEventListener('keyup',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;keys.delete(key);});window.addEventListener('blur',()=>keys.clear());
const touchButtons=document.querySelectorAll('[data-dir]');const dirKeys={up:'w',down:'s',left:'a',right:'d'};touchButtons.forEach(btn=>{const down=e=>{e.preventDefault();keys.add(dirKeys[btn.dataset.dir]);btn.setPointerCapture?.(e.pointerId);};const up=e=>{e.preventDefault();keys.delete(dirKeys[btn.dataset.dir]);};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up);});
const jumpButton=document.querySelector('#jump-btn');jumpButton.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(' ');});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>jumpButton.addEventListener(ev,()=>keys.delete(' ')));
function togglePause(){if(!started||won)return;paused=!paused;document.querySelector('#pause-screen').classList.toggle('hidden',!paused);if(paused)keys.clear();}
document.querySelector('#touch-controls').style.display='none';
document.querySelector('#play-btn').addEventListener('click',()=>{started=true;startTime=performance.now()/1000;document.querySelector('#start-screen').classList.add('gone');document.querySelector('#touch-controls').style.display=matchMedia('(max-width:700px)').matches?'flex':'none';updateHUD();chirp(500,.12);});
document.querySelector('#pause-btn').addEventListener('click',togglePause);document.querySelector('#resume-btn').addEventListener('click',togglePause);
document.querySelector('#again-btn').addEventListener('click',()=>{document.querySelector('#finish-screen').classList.add('hidden');for(const s of stones){s.collected=false;world.add(s.group);s.group.position.y=s.baseY;}stonesFound=0;won=false;player.position.set(0,0,13);player.rotation.y=0;updateHUD();updateLocation();startTime=performance.now()/1000;});
document.querySelector('#sound-btn').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.textContent=soundOn?'♫':'♪';e.currentTarget.classList.toggle('muted',!soundOn);if(soundOn)chirp(520,.1);});

function animate(now){requestAnimationFrame(animate);const time=now/1000,dt=Math.min(.04,(now-lastTime)/1000||.016);lastTime=now;
 if(started&&!paused&&!won)move(dt);
 stones.forEach((s,i)=>{if(s.collected)return;s.group.position.y=s.baseY+Math.sin(time*2.2+i)*.12;s.crystal.rotation.y=time*.8+i;s.crystal.rotation.x=Math.sin(time*1.2+i)*.15;s.halo.rotation.z=-time*.4;s.light.intensity=.48+Math.sin(time*3+i)*.12;});
 markerRing.rotation.z=time*.55;markerRing.scale.setScalar(1+Math.sin(time*2)*.08);
 lamps.forEach((l,i)=>l.intensity=.9+Math.sin(time*2+i)*.12);
 const px=player.position.x,pz=player.position.z;desiredCamera.set(px+10,12.5+player.position.y,pz+16);camera.position.lerp(desiredCamera,.055);lookTarget.set(px,1.5+player.position.y*.5,pz-3);camera.lookAt(lookTarget);
 if(started&&!paused&&!won){collectAndFinish(time);updateLocation();}
 renderer.render(scene,camera);
}
requestAnimationFrame(animate);
setTimeout(()=>{document.querySelector('#loading').classList.add('done');},450);
