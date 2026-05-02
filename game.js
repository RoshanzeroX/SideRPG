(function(){
function buildPermTable(){const p=[];for(let i=0;i<256;i++)p[i]=i;for(let i=255;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p[i],p[j]]=[p[j],p[i]];}const perm=new Uint8Array(512),permMod12=new Uint8Array(512);for(let i=0;i<512;i++){perm[i]=p[i&255];permMod12[i]=perm[i]%12;}return{perm,permMod12};}
const grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],F2=0.5*(Math.sqrt(3)-1),G2=(3-Math.sqrt(3))/6;const {perm,permMod12}=buildPermTable();
function dot(g,x,y){return g[0]*x+g[1]*y;}
window.simplex2=(xin,yin)=>{let n0,n1,n2;const s=(xin+yin)*F2;const i=Math.floor(xin+s),j=Math.floor(yin+s);const t=(i+j)*G2;const X0=i-t,Y0=j-t,x0=xin-X0,y0=yin-Y0;let i1,j1;if(x0>y0){i1=1;j1=0;}else{i1=0;j1=1;}const x1=x0-i1+G2,y1=y0-j1+G2,x2=x0-1+2*G2,y2=y0-1+2*G2,ii=i&255,jj=j&255,gi0=permMod12[ii+perm[jj]],gi1=permMod12[ii+i1+perm[jj+j1]],gi2=permMod12[ii+1+perm[jj+1]];let t0=0.5-x0*x0-y0*y0;if(t0<0)n0=0;else{t0*=t0;n0=t0*t0*dot(grad3[gi0],x0,y0);}let t1=0.5-x1*x1-y1*y1;if(t1<0)n1=0;else{t1*=t1;n1=t1*t1*dot(grad3[gi1],x1,y1);}let t2=0.5-x2*x2-y2*y2;if(t2<0)n2=0;else{t2*=t2;n2=t2*t2*dot(grad3[gi2],x2,y2);}return 70*(n0+n1+n2);};
})();
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(window.devicePixelRatio);renderer.setSize(window.innerWidth,window.innerHeight);renderer.shadowMap.enabled=true;document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x8fd3ff,25,80);const camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,150);
window.addEventListener('resize',()=>{renderer.setSize(window.innerWidth,window.innerHeight);camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();});
const amb=new THREE.AmbientLight(0xffffff,0.65);scene.add(amb);const sun=new THREE.DirectionalLight(0xfff6d0,0.9);sun.position.set(15,20,8);scene.add(sun);
const blocks=new Map(),drops=[];const player={x:0,y:10,vx:0,vy:0,w:0.8,h:1.75,onGround:false,facingRight:true,hp:100,maxHp:100,hunger:100,maxHunger:100,xp:0,xpNext:100,level:1,atk:5};
const inv={stone:0,wood:0,food:0,sapling:0};
const mats={grass:new THREE.MeshToonMaterial({color:0x55bf5d}),dirt:new THREE.MeshToonMaterial({color:0x8c5c3a}),stone:new THREE.MeshToonMaterial({color:0x8c9398}),wood:new THREE.MeshToonMaterial({color:0x996515}),leaf:new THREE.MeshToonMaterial({color:0x2fa34a}),flower:new THREE.MeshToonMaterial({color:0xff4f9f})};
function k(x,y){return `${x},${y}`;} const sAt=(x,y)=>blocks.has(k(Math.round(x),Math.round(y)));
function addBlock(x,y,t){if(blocks.has(k(x,y)))return;const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mats[t]||mats.dirt);m.position.set(x,y,0);scene.add(m);blocks.set(k(x,y),{m,t,hp:t==='stone'?3:1});}
function groundH(x){const n=simplex2(x*0.08,0)*2.8;return Math.floor(2+n+Math.sin(x*0.14)*1.5);} 
for(let x=-100;x<=100;x++){const h=groundH(x);for(let y=-8;y<=h;y++)addBlock(x,y,y===h?'grass':y>h-3?'dirt':'stone');if(Math.random()<0.08){addBlock(x,h+1,'flower');} if(Math.random()<0.07){for(let t=1;t<4;t++)addBlock(x,h+t,'wood');for(let lx=-1;lx<=1;lx++)for(let ly=3;ly<=4;ly++)addBlock(x+lx,h+ly,'leaf');}}
const pg=new THREE.Group();
const body=new THREE.Mesh(new THREE.CapsuleGeometry(0.35,0.65,6,12),new THREE.MeshToonMaterial({color:0x4a90d9}));
const head=new THREE.Mesh(new THREE.SphereGeometry(0.33,16,16),new THREE.MeshToonMaterial({color:0xffd2b0}));head.position.y=0.78;
pg.add(body);pg.add(head);scene.add(pg);
const keys={};document.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE'&&inv.food>0){inv.food--;player.hunger=Math.min(100,player.hunger+35);player.hp=Math.min(100,player.hp+12);tip('Eat food: +hunger +hp');updateInv();}});document.addEventListener('keyup',e=>keys[e.code]=false);
function nearestBlock(){let best=null,bd=1e9;const px=Math.round(player.x),py=Math.round(player.y);for(let x=px-4;x<=px+4;x++)for(let y=py-4;y<=py+4;y++){const b=blocks.get(k(x,y));if(!b||y<0)continue;const d=Math.hypot(x-player.x,y-player.y);if(d<4.5&&d<bd){bd=d;best={x,y,b};}}return best;}
function mine(){const t=nearestBlock();if(!t)return; t.b.hp-=1; if(t.b.hp<=0){scene.remove(t.b.m);blocks.delete(k(t.x,t.y));if(t.b.t==='stone')inv.stone++;if(t.b.t==='wood')inv.wood++;if(t.b.t==='leaf'&&Math.random()<0.45)inv.food++;player.xp=Math.min(player.xpNext,player.xp+8);tip(`Got ${t.b.t}`);updateInv();}}
document.addEventListener('mousedown',e=>{if(e.button===0)mine();if(e.button===2)e.preventDefault();});
function tip(msg){const t=document.getElementById('tooltip');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400);}
function updateInv(){document.getElementById('cnt-0').textContent=inv.stone;document.getElementById('cnt-1').textContent=inv.wood;document.getElementById('cnt-2').textContent=inv.food;document.getElementById('cnt-3').textContent=inv.sapling;}
function hud(){hpBar.style.width=`${player.hp/player.maxHp*100}%`;hunBar.style.width=`${player.hunger/player.maxHunger*100}%`;xpBar.style.width=`${player.xp/player.xpNext*100}%`;levelDisplay.textContent=`LEVEL ${player.level} | ATTACK ${player.atk} | HP ${Math.floor(player.hp)}/${player.maxHp}`;}
const hpBar=document.getElementById('hp-bar'),hunBar=document.getElementById('hun-bar'),xpBar=document.getElementById('xp-bar'),levelDisplay=document.getElementById('level-display');
let last=performance.now(),day=0;
function loop(){requestAnimationFrame(loop);const now=performance.now(),dt=Math.min((now-last)/1000,0.033);last=now;
const sp=5; if(keys.KeyA||keys.ArrowLeft){player.vx=-sp;player.facingRight=false;}else if(keys.KeyD||keys.ArrowRight){player.vx=sp;player.facingRight=true;}else player.vx*=0.78;
if((keys.Space||keys.KeyW||keys.ArrowUp)&&player.onGround){player.vy=8.8;player.onGround=false;}player.vy-=24*dt;
player.x+=player.vx*dt; if(sAt(player.x+Math.sign(player.vx||1)*0.45,player.y-0.1)){player.x-=player.vx*dt;player.vx=0;}
player.y+=player.vy*dt; player.onGround=false;
const foot=player.y-player.h/2; if(sAt(player.x,foot-0.08)){const gy=Math.round(foot-0.08)+0.5; player.y=gy+player.h/2; player.vy=0; player.onGround=true;}
if(player.vy>0&&sAt(player.x,player.y+player.h/2+0.05)){player.vy=0;}
pg.position.set(player.x,player.y,0);pg.scale.x=player.facingRight?1:-1;
player.hunger=Math.max(0,player.hunger-dt*0.35); if(player.hunger===0)player.hp=Math.max(0,player.hp-dt*4);
day=(day+dt*0.03)%1;const n=Math.sin(day*Math.PI*2)*0.5+0.5;const sky=new THREE.Color().setHSL(0.55,0.7,0.22+n*0.38);scene.background=sky;scene.fog.color=sky;amb.intensity=0.28+n*0.5;
camera.position.set(player.x,player.y+2.4,18);camera.lookAt(player.x,player.y+0.8,0);hud();renderer.render(scene,camera);}updateInv();hud();loop();
