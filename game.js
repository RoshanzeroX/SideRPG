// generated from user prototype
(function(){
function buildPermTable(){const p=[];for(let i=0;i<256;i++)p[i]=i;for(let i=255;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p[i],p[j]]=[p[j],p[i]];}const perm=new Uint8Array(512),permMod12=new Uint8Array(512);for(let i=0;i<512;i++){perm[i]=p[i&255];permMod12[i]=perm[i]%12;}return{perm,permMod12};}
const grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],F2=0.5*(Math.sqrt(3)-1),G2=(3-Math.sqrt(3))/6;const {perm,permMod12}=buildPermTable();function dot(g,x,y){return g[0]*x+g[1]*y;}window.simplex2=function(xin,yin){let n0,n1,n2;const s=(xin+yin)*F2;const i=Math.floor(xin+s),j=Math.floor(yin+s);const t=(i+j)*G2;const X0=i-t,Y0=j-t,x0=xin-X0,y0=yin-Y0;let i1,j1;if(x0>y0){i1=1;j1=0;}else{i1=0;j1=1;}const x1=x0-i1+G2,y1=y0-j1+G2,x2=x0-1+2*G2,y2=y0-1+2*G2,ii=i&255,jj=j&255,gi0=permMod12[ii+perm[jj]],gi1=permMod12[ii+i1+perm[jj+j1]],gi2=permMod12[ii+1+perm[jj+1]];let t0=0.5-x0*x0-y0*y0;if(t0<0)n0=0;else{t0*=t0;n0=t0*t0*dot(grad3[gi0],x0,y0);}let t1=0.5-x1*x1-y1*y1;if(t1<0)n1=0;else{t1*=t1;n1=t1*t1*dot(grad3[gi1],x1,y1);}let t2=0.5-x2*x2-y2*y2;if(t2<0)n2=0;else{t2*=t2;n2=t2*t2*dot(grad3[gi2],x2,y2);}return 70*(n0+n1+n2);};
})();
// minimal playable scaffold
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(window.devicePixelRatio);renderer.setSize(window.innerWidth,window.innerHeight);document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x87ceeb);const camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,120);
window.addEventListener('resize',()=>{renderer.setSize(window.innerWidth,window.innerHeight);camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();});
scene.add(new THREE.AmbientLight(0xffffff,0.9));const light=new THREE.DirectionalLight(0xffffff,0.8);light.position.set(8,10,4);scene.add(light);
const blocks=new Map();const BLOCK=1;const player={x:0,y:8,vx:0,vy:0,w:0.8,h:1.8,onGround:false,facingRight:true,hp:100,maxHp:100,hunger:100,maxHunger:100,xp:0,xpNext:100,level:1,atk:5};
function key(x,y){return `${x},${y}`;}function solid(x,y){return blocks.has(key(Math.round(x),Math.round(y)));}
for(let x=-40;x<=40;x++){const h=Math.floor(3+simplex2(x*0.09,0)*2);for(let y=-6;y<=h;y++){const g=new THREE.BoxGeometry(1,1,1);const m=new THREE.MeshToonMaterial({color:y===h?0x5dbb63:y>h-3?0x8b5e3c:0x888888});const me=new THREE.Mesh(g,m);me.position.set(x,y,0);scene.add(me);blocks.set(key(x,y),me);}}
const pm=new THREE.Mesh(new THREE.BoxGeometry(0.8,1.8,0.4),new THREE.MeshToonMaterial({color:0x4a90d9}));scene.add(pm);
const keys={};document.addEventListener('keydown',e=>{keys[e.code]=true;});document.addEventListener('keyup',e=>{keys[e.code]=false;});
function hud(){hpBar.style.width=(player.hp/player.maxHp*100)+'%';hunBar.style.width=(player.hunger/player.maxHunger*100)+'%';xpBar.style.width=(player.xp/player.xpNext*100)+'%';levelDisplay.textContent=`LV ${player.level} | ATK ${player.atk} | HP ${Math.floor(player.hp)}/${player.maxHp}`;}
const hpBar=document.getElementById('hp-bar'),hunBar=document.getElementById('hun-bar'),xpBar=document.getElementById('xp-bar'),levelDisplay=document.getElementById('level-display');
let last=performance.now();
function loop(){requestAnimationFrame(loop);const now=performance.now(),dt=Math.min((now-last)/1000,0.05);last=now;
const speed=5;if(keys.KeyA||keys.ArrowLeft){player.vx=-speed;player.facingRight=false;}else if(keys.KeyD||keys.ArrowRight){player.vx=speed;player.facingRight=true;}else player.vx*=0.8;
if((keys.Space||keys.KeyW||keys.ArrowUp)&&player.onGround){player.vy=9;player.onGround=false;}player.vy-=22*dt;
player.x+=player.vx*dt;player.y+=player.vy*dt;player.onGround=false;
if(solid(player.x,player.y-player.h/2)){player.y=Math.round(player.y-player.h/2)+1+player.h/2;player.vy=0;player.onGround=true;}
pm.position.set(player.x,player.y,0);pm.scale.x=player.facingRight?1:-1;
camera.position.set(player.x,player.y+2,18);camera.lookAt(player.x,player.y,0);
player.hunger=Math.max(0,player.hunger-dt*0.2);if(player.hunger===0)player.hp=Math.max(0,player.hp-dt*2);hud();renderer.render(scene,camera);}hud();loop();
