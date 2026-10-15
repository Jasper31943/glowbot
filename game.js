(function(){
const $=id=>document.getElementById(id), cv=$('cv'), ctx=cv.getContext('2d');
// ===== THEME =====================================================================
// Fixed palette: Endesga 32. Every colour the renderer uses comes from a world entry below,
// so a new world (or full restyle) only edits this object.
const E32={red1:'#be4a2f',orange1:'#d77643',sand:'#ead4aa',tan:'#e4a672',brown1:'#b86f50',brown2:'#733e39',plum:'#3e2731',red2:'#a22633',red3:'#e43b44',orange:'#f77622',amber:'#feae34',yellow:'#fee761',green1:'#63c74d',green2:'#3e8948',green3:'#265c42',teal:'#193c3e',blue1:'#124e89',blue2:'#0099db',cyan:'#2ce8f5',white:'#ffffff',grey1:'#c0cbdc',grey2:'#8b9bb4',grey3:'#5a6988',grey4:'#3a4466',navy:'#262b44',ink:'#181425',hot:'#ff0044',purple:'#68386c',magenta:'#b55088',pink:'#f6757a',skin:'#e8b796',skin2:'#c28569'};
const base={outline:E32.ink,robot:{body:E32.white,shade:E32.grey1,screen:E32.navy,eye:E32.cyan,stem:E32.grey2,bulb:E32.cyan,heart:E32.pink,x:E32.red3},
 crate:[E32.brown1,E32.brown2,E32.tan],crateOn:E32.amber,plate:[E32.grey2,E32.grey3],plateOn:E32.amber,bars:[E32.grey4,E32.grey1],
 spike:[E32.grey3,E32.grey1,E32.red3],goal:[E32.grey3,E32.blue1,E32.blue2,E32.cyan],battery:[E32.amber,E32.green1],glove:[E32.red3,E32.grey1],
 enemy:[E32.red2,E32.red3,E32.yellow],keys:{c:E32.blue2,m:E32.magenta,n:E32.pink},gate:E32.brown2,trail:[E32.white,E32.grey1],bird:E32.plum};
const WORLDS={
 grass:{...base,name:'草原',style:'grass',floor:[E32.green2,E32.green1,E32.green3],flowers:[E32.sand,E32.pink,E32.yellow],wall:[E32.grey1,E32.grey2,E32.grey3],moss:[E32.green1,E32.green2],ice:[E32.grey1,E32.grey2,E32.white,E32.blue2],birds:true},
 snow:{...base,name:'冰湖',style:'snow',floor:[E32.grey1,E32.white,E32.grey2],flowers:[E32.blue2],wall:[E32.grey2,E32.grey3,E32.grey4],moss:[E32.white,E32.grey1],ice:[E32.blue2,E32.blue1,E32.cyan,E32.navy],birds:false,flakes:true},
 castle:{...base,name:'古堡',style:'castle',torch:[E32.orange,E32.amber,E32.yellow],wallTop:E32.grey1,floor:[E32.grey2,E32.grey1,E32.grey3],flowers:[E32.green3],wall:[E32.grey4,E32.navy,E32.ink],moss:[E32.green3,E32.teal],ice:[E32.grey1,E32.grey2,E32.white,E32.blue2],birds:false},
 power:{...base,name:'發電廠',style:'power',stripe:[E32.amber,E32.ink],wallTop:E32.amber,floor:[E32.grey2,E32.grey1,E32.grey3],flowers:[E32.amber],wall:[E32.grey4,E32.navy,E32.ink],moss:[E32.amber,E32.orange],ice:[E32.grey1,E32.grey2,E32.white,E32.blue2],birds:false},
 factory:{...base,name:'夜間工廠',style:'factory',neon:[E32.magenta,E32.pink],wallTop:E32.pink,floor:[E32.grey3,E32.grey2,E32.grey4],flowers:[E32.magenta],wall:[E32.plum,E32.ink,E32.ink],moss:[E32.magenta,E32.purple],ice:[E32.grey1,E32.grey2,E32.white,E32.blue2],birds:false}};
let TH=WORLDS.grass;
// world layout: 6 levels each; next world unlocks after clearing 4 of the previous world's 6
const WORLD_ORDER=['grass','snow','castle','power','factory'],PER_WORLD=6,UNLOCK_NEED=4;
const worldOf=i=>Math.min(WORLD_ORDER.length-1,Math.floor(i/PER_WORLD));
function clearedIn(w){let n=0;for(let i=w*PER_WORLD;i<(w+1)*PER_WORLD;i++)if(save.stars[i])n++;return n}
function worldUnlocked(w){return w===0||clearedIn(w-1)>=UNLOCK_NEED}
const KC=base.keys;
const SHARE_URL='https://jasper31943.github.io/glowbot/';
// offscreen 16px-per-tile world canvas, blitted with integer scale
const TS=16,off=document.createElement('canvas'),o=off.getContext('2d');let SC=3;
const R=(x,y,w,h,c)=>{o.fillStyle=c;o.fillRect(Math.round(x),Math.round(y),w,h)};
const hash=(x,y,k)=>(((x*73856093)^(y*19349663)^(k*83492791))>>>0)%1000/1000;
let react=null,facing='down',idleT=0,birds=[],nextBird=3;
const SAVE='robotMaze.v1';
let save={};try{save=JSON.parse(localStorage.getItem(SAVE))||{}}catch(e){}
save.stars=save.stars||{};
const MIN=Logic.LEVELS.map(l=>{const p=Logic.bfs(Logic.parse(l));return p?p.length:0});
const MINALL=Logic.LEVELS.map(l=>{const P=Logic.parse(l);if(!P.bolts)return 0;const p=Logic.bfs(P,0,true);return p?p.length:0});
let boxAnim={},li=0,L,st,hist,steps,anim=null,face='norm',faceT=0,won=false,trail=[],doorAnim={},flash={},T=0,blinkAt=2,stamp=0;
function prevDoorState(){const o={};for(let y=0;y<L.H;y++)for(let x=0;x<L.W;x++){const c=L.grid[y][x];if(c==='D')o[x+','+y]=Logic.doorOpen(L,st);if(Logic.isKeyDoor(c))o[x+','+y]=Logic.opened(st,x,y)}return o}
let doors={};
// ===== SOUND: 8-bit sfx synthesized with WebAudio (no files). Starts after first user gesture. =====
let AC=null;
function audioInit(){if(AC||save.mute)return;try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>{audioInit();if(AC&&AC.state==='suspended')AC.resume()},{passive:true}));
function tone(f,d,type,vol,at,slide){if(!AC||save.mute)return;const t=AC.currentTime+(at||0),os=AC.createOscillator(),gn=AC.createGain();os.type=type||'square';os.frequency.setValueAtTime(f,t);if(slide)os.frequency.exponentialRampToValueAtTime(slide,t+d);
 gn.gain.setValueAtTime(vol||.08,t);gn.gain.exponentialRampToValueAtTime(.0001,t+d);os.connect(gn).connect(AC.destination);os.start(t);os.stop(t+d+.02)}
function noise(d,vol,at){if(!AC||save.mute)return;const t=AC.currentTime+(at||0),n=AC.sampleRate*d,b=AC.createBuffer(1,n,AC.sampleRate),c=b.getChannelData(0);for(let i=0;i<n;i++)c[i]=(Math.random()*2-1)*(1-i/n);const s=AC.createBufferSource(),gn=AC.createGain();gn.gain.value=vol||.08;s.buffer=b;s.connect(gn).connect(AC.destination);s.start(t)}
const SFX={step:()=>tone(220,.05,'square',.04),slide:()=>tone(900,.18,'triangle',.05,0,500),push:()=>{tone(110,.09,'square',.07);noise(.06,.04)},bump:()=>tone(160,.15,'square',.07,0,70),
 crumble:()=>{noise(.25,.09);tone(90,.2,'triangle',.06,0,40)},key:()=>{tone(988,.07,'square',.06);tone(1319,.12,'square',.06,.07)},bolt:()=>{tone(1568,.05,'square',.05);tone(2093,.08,'square',.05,.05)},
 door:()=>{[262,330,392].forEach((f,i)=>tone(f,.08,'square',.05,i*.06))},fail:()=>tone(330,.35,'sawtooth',.05,0,80),
 win:()=>{[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,i===5?.35:.1,'square',.06,i*.1))}};
function sfx(n){try{SFX[n]&&SFX[n]()}catch(e){}}
let curMin=0,curMinAll=0;
function load(i){li=i;const wk=WORLD_ORDER[worldOf(i)];TH=WORLDS[wk];document.body.dataset.world=wk;L=Logic.parse(Logic.LEVELS[i]);
 curMin=MIN[i];curMinAll=MINALL[i];st=L.start;hist=[];steps=0;won=false;anim=null;face='norm';trail=[];flash={};
 doors=prevDoorState();doorAnim={};for(const k in doors)doorAnim[k]=doors[k]?1:0;
 $('lvn').textContent=i+1;$('lvname').textContent=Logic.LEVELS[i].name;$('minp').textContent=curMin+(curMinAll?`（全🔩 ${curMinAll}）`:'');boxAnim={};$('win').classList.remove('on');save.last=i;persist();hud();resize();}
function persist(){try{localStorage.setItem(SAVE,JSON.stringify(save))}catch(e){}}
function hud(){$('steps').textContent=steps;const lf=$('remain');if(st.left!=null){lf.style.display='';lf.innerHTML=`剩 <b class="${st.left<=3?'low':''}">${st.left}</b> 步`}else lf.style.display='none';const k=$('keys');k.innerHTML='';
 if(L.bolts){const g=document.createElement('span');g.className='chip';g.textContent=`🔩 ${Logic.boltsGot(st)}/${L.bolts}`;k.append(g)}if(st.glove){const g=document.createElement('span');g.className='chip';g.textContent='磁力手套';k.append(g)}if(st.keys){k.append('鑰匙 ');for(const c of st.keys){const d=document.createElement('span');d.className='kc';d.style.color=KC[c];d.textContent={c:'●',m:'▲',n:'■'}[c];k.append(d)}}}
let CS=48;
function resize(){const w=$('wrap'),aw=w.clientWidth,ah=w.clientHeight,pw=L.W*TS,ph=L.H*TS;
 const desk=matchMedia('(min-width:900px),(hover:hover) and (pointer:fine)').matches&&innerWidth>=700;
 const fit=Math.floor(Math.min(aw/pw,ah/ph));
 SC=desk?Math.max(1,Math.min(fit,Math.max(4,Math.floor(innerHeight*.7/ph)))):Math.max(1,Math.min(3,fit));
 CS=TS*SC;off.width=pw;off.height=ph;cv.width=pw*SC;cv.height=ph*SC;cv.style.width=cv.width+'px';cv.style.height=cv.height+'px';ctx.imageSmoothingEnabled=false;}
window.addEventListener('resize',()=>L&&resize());
function move(dir){if(anim||won)return;facing=dir;idleT=T;if($('menu')&&$('menu').classList.contains('on'))return;
 const r=Logic.step(L,st,dir);
 if(r.result==='bump'||r.result==='tired'){sfx('bump');face=r.result==='tired'?'pant':'x';faceT=T;anim={type:'bump',dir,t0:T,dur:1.0};return}
 const from=[st.x,st.y];
 if(r.result==='fall'||r.result==='caught'){setTimeout(()=>sfx(r.result==='fall'?'crumble':'fail'),120);anim={type:'move',path:r.path,from,t0:T,dur:.09*r.path.length+.05,after:()=>{face='x';faceT=T;anim={type:'bump',dir,t0:T,dur:1.0};}};return}
 r.boxMoves.forEach(m=>boxAnim[m[1].join(',')]={from:m[0],t0:T});hist.push(st);const boxBefore=st.boxes.map(b=>b.join(','));st=r.state;steps++;
 st.boxes.forEach(b=>{if(L.grid[b[1]][b[0]]==='X'&&boxBefore.indexOf(b.join(','))<0)flash[b.join(',')]=T});
  sfx(r.boxMoves.length?'push':r.path.length>1?'slide':'step');['key','bolt','crumble','door'].forEach(e=>{if(r.ev.indexOf(e)>=0)setTimeout(()=>sfx(e),60)});
 const tired=st.left!=null&&st.left<=3;anim={type:'move',path:r.path,from,t0:T,dur:(.11*r.path.length+.03)*(tired?1.7:1),ice:r.path.length>1,after:()=>{if(r.result==='win')return winSeq();if(r.ev.indexOf('key')>=0)react={type:'hop',t0:T};const adj=Logic.patrolAt(L,st.t).some(p=>Math.abs(p[0]-st.x)+Math.abs(p[1]-st.y)===1);if(adj)react={type:'startle',t0:T}}};
 const nd=prevDoorState();for(const k in nd)if(nd[k]&&!doors[k]&&L.grid[+k.split(',')[1]][+k.split(',')[0]]==='D')sfx('door');doors=nd;hud();}
function undo(){if(anim&&anim.type!=='bump'||won||!hist.length)return;st=hist.pop();steps--;doors=prevDoorState();face='norm';anim=null;hud()}
function winSeq(){won=true;sfx('win');face='heart';anim={type:'suck',t0:T,dur:.9,after:showWin}}
function showWin(){const allB=L.bolts&&Logic.boltsGot(st)===L.bolts&&curMinAll;const n=Logic.starsFor(steps,curMin,curMinAll,Logic.boltsGot(st),L.bolts);save.stars[li]=Math.max(save.stars[li]||0,n);persist();
 $('wstars').innerHTML=[0,1,2].map(i=>`<span class="${i<n?'s':'e'}">★</span>`).join('');
 $('wsub').textContent=`${steps} 步（最少 ${allB?curMinAll+' 步・全螺絲':curMin+' 步'}）`;
 const bt=L.bolts?` 🔩 ${Logic.boltsGot(st)}/${L.bolts}`:'';$('wshare').textContent=`🤖 第 ${li+1} 關 ${steps} 步 ${'⭐'.repeat(n)}${bt}`;window.__clip=`🤖 第 ${li+1} 關 ${steps} 步 ${'⭐'.repeat(n)}${bt}（最佳解 ${allB?curMinAll:curMin} 步）\n${SHARE_URL}`;
 $('next').textContent=li<Logic.LEVELS.length-1?'下一關':'選擇關卡';$('win').classList.add('on');window.__lastWin={level:li+1,steps,stars:n,bolts:L.bolts?Logic.boltsGot(st)+'/'+L.bolts:null,share:$('wshare').textContent,clip:window.__clip};}
// input
const KEYS={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
addEventListener('keydown',e=>{if(KEYS[e.key]){e.preventDefault();press(KEYS[e.key])}else if(e.key==='z'||e.key==='Backspace')undo();else if(e.key==='r')load(li)});
function press(d){const b=$(d);b.classList.add('on');setTimeout(()=>b.classList.remove('on'),140);move(d)}
['up','down','left','right'].forEach(d=>$(d).addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();press(d)}));
let sx=null,sy=null;
cv.parentElement.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY});
addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
 move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'))});
$('undo').onclick=undo;$('reset').onclick=()=>load(li);
$('again').onclick=()=>load(li);
$('next').onclick=()=>li<Logic.LEVELS.length-1&&worldUnlocked(worldOf(li+1))?load(li+1):openMenu();
$('copy').onclick=()=>{const t=window.__clip;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>$('copy').textContent='已複製！',()=>{const ta=document.createElement('textarea');ta.value=t;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();$('copy').textContent='已複製！'});setTimeout(()=>$('copy').textContent='複製分享',1500)};
// level select
const menu=document.createElement('div');menu.id='menu';menu.innerHTML='<div class="card panel"><h2>選擇關卡</h2><a href="index.html" class="btn p panel" style="display:block;text-decoration:none;margin:6px 0">大地圖冒險（測試版）▶</a><div id="mgrid"></div><button class="btn g panel" id="mclose">關閉</button></div>';
document.body.append(menu);
function openMenu(){$('win').classList.remove('on');let h='';
 for(let w=0;w*PER_WORLD<Logic.LEVELS.length;w++){const W=WORLDS[WORLD_ORDER[w]],ok=worldUnlocked(w);
  h+=`<div class="wh"><span>世界 ${w+1}・${W.name}</span><span class="sub">${ok?clearedIn(w)+'/'+PER_WORLD+' 過關':'🔒 前一世界過 '+UNLOCK_NEED+' 關解鎖'}</span></div><div class="wg">`;
  for(let i=w*PER_WORLD;i<Math.min((w+1)*PER_WORLD,Logic.LEVELS.length);i++){const n=save.stars[i]||0;h+=`<button class="lb panel${ok?'':' lock'}" data-i="${i}" ${ok?'':'disabled'}>${i+1}<small>${ok?('★'.repeat(n)+'☆'.repeat(3-n)):'🔒'}</small></button>`}
  h+='</div>'}
 $('mgrid').innerHTML=h;menu.classList.add('on')}
$('mgrid').onclick=e=>{const b=e.target.closest('.lb');if(b){menu.classList.remove('on');load(+b.dataset.i)}};
$('mclose').onclick=()=>menu.classList.remove('on');document.querySelector('.lv').onclick=openMenu;
// ===== RENDER (pixel art, all coordinates in 16px tile space) =====
function grass(px,py,x,y){const F=TH.floor;R(px,py,16,16,F[0]);
 for(let i=0;i<6;i++){const a=hash(x,y,i),b=hash(x,y,i+9);const sx=px+1+Math.floor(a*14),sy=py+2+Math.floor(b*12);R(sx,sy,1,1,F[2])}
 for(let i=0;i<3;i++){const a=hash(x,y,i+20),b=hash(x,y,i+30);const sx=px+2+Math.floor(a*11),sy=py+3+Math.floor(b*10);const sw=Math.round(Math.sin(T*1.8+x+y*1.7+i)*.6);
  R(sx,sy+1,1,2,F[1]);R(sx+2,sy+1,1,2,F[1]);R(sx+1+sw,sy,1,2,F[1])}
 if(hash(x,y,40)<.45){const sx=px+3+Math.floor(hash(x,y,41)*9),sy=py+3+Math.floor(hash(x,y,42)*9),c=TH.flowers[Math.floor(hash(x,y,43)*TH.flowers.length)];R(sx,sy-1,1,1,c);R(sx-1,sy,1,1,c);R(sx+1,sy,1,1,c);R(sx,sy+1,1,1,c);R(sx,sy,1,1,E32.amber)}}
function snowFloor(px,py,x,y){const F=TH.floor;R(px,py,16,16,F[0]);for(let i=0;i<5;i++)R(px+1+Math.floor(hash(x,y,i)*14),py+1+Math.floor(hash(x,y,i+9)*14),2,1,F[2]);
 for(let i=0;i<3;i++){const sx=px+1+Math.floor(hash(x,y,i+20)*14),sy=py+1+Math.floor(hash(x,y,i+30)*14);R(sx,sy,1,1,F[1]);if((Math.floor(T*2+hash(x,y,i)*9))%7===0){R(sx-1,sy,3,1,F[1]);R(sx,sy-1,1,3,F[1])}}}
function castleFloor(px,py,x,y){const F=TH.floor;R(px,py,16,16,F[2]);R(px,py,15,7,F[0]);R(px,py+8,7,7,F[0]);R(px+8,py+8,7,7,F[0]);R(px,py,15,1,F[1]);R(px,py+8,7,1,F[1]);R(px+8,py+8,7,1,F[1]);if(hash(x,y,3)<.4)R(px+2+Math.floor(hash(x,y,4)*10),py+3+Math.floor(hash(x,y,5)*10),2,1,TH.flowers[0])}
function powerFloor(px,py,x,y){const F=TH.floor;R(px,py,16,16,F[2]);R(px+1,py+1,14,14,F[0]);R(px+1,py+1,14,1,F[1]);[[2,2],[13,2],[2,13],[13,13]].forEach(p=>R(px+p[0],py+p[1],1,1,F[1]));if((x+y)%3===0){R(px+5,py+7,6,2,F[2]);R(px+6+Math.floor(T*8)%4,py+7,1,1,TH.flowers[0])}}
function factoryFloor(px,py,x,y){const F=TH.floor;R(px,py,16,16,F[0]);for(let i=2;i<16;i+=4)R(px+i,py+1,1,14,F[1]);R(px,py+15,16,1,F[2]);if(hash(x,y,7)<.3){o.globalAlpha=.5+.5*Math.sin(T*3+x);R(px+1,py+14,14,1,TH.neon[0]);o.globalAlpha=1}}
const FLOORS={grass:(a,b,c,d)=>grass(a,b,c,d),snow:snowFloor,castle:castleFloor,power:powerFloor,factory:factoryFloor};
function wall(px,py,x,y){const W=TH.wall;R(px,py,16,16,TH.outline);R(px+1,py+1,14,13,W[1]);
 for(let r=0;r<3;r++){const yy=py+1+r*5,off=(r+x)%2?0:4;for(let c=-1;c<3;c++){const xx=px+1+off+c*8;const x0=Math.max(px+1,xx),x1=Math.min(px+15,xx+7);if(x1>x0){R(x0,yy,x1-x0,4,W[0]);R(x0,yy+3,x1-x0,1,W[2])}}}
 R(px+1,py+14,14,2,W[2]);
 if(Logic.cell(L,x,y-1)!=='#'||hash(x,y,5)<.5){const M=TH.moss;for(let i=0;i<16;i+=1)if(hash(x,y,i+50)<.55)R(px+i,py,1,1+(hash(x,y,i+70)<.4?1:0),M[i%3?0:1])};
 const open=Logic.cell(L,x,y+1)!=='#';if(TH.wallTop)R(px,py,16,1,TH.wallTop);
 if(TH.style==='castle'&&open&&hash(x,y,90)<.3){const f=Math.floor(T*8)%2;R(px+7,py+6,2,5,E32.brown2);R(px+6,py+3,4,3,TH.torch[0]);R(px+7,py+2-f,2,3,TH.torch[1]);R(px+7,py+3,1,1,TH.torch[2])}
 if(TH.style==='power'&&open){for(let i=0;i<16;i+=4){R(px+i,py+12,2,2,TH.stripe[0]);R(px+i+2,py+12,2,2,TH.stripe[1])}}
 if(TH.style==='factory'&&open&&hash(x,y,91)<.5){o.globalAlpha=.6+.4*Math.sin(T*4+x*2);R(px+3,py+7,10,1,TH.neon[0]);R(px+3,py+8,10,1,TH.neon[1]);o.globalAlpha=1}}
function ice(px,py,x,y){const I=TH.ice;R(px,py,16,16,I[3]);R(px+1,py+1,14,14,I[0]);R(px+3,py+11,5,1,I[1]);R(px+9,py+4,4,1,I[1]);R(px+6,py+7,1,3,I[1]);
 const tw=(Math.floor(T*2+hash(x,y,1)*8)%6===0);R(px+4,py+4,1,1,I[2]);if(tw){R(px+3,py+4,3,1,I[2]);R(px+4,py+3,1,3,I[2])}R(px+11,py+10,2,1,I[2])}
function spikes(px,py){const S=TH.spike;R(px+1,py+1,14,14,TH.outline);R(px+2,py+2,12,12,S[0]);for(let i=0;i<3;i++)for(let j=0;j<3;j++){const sx=px+3+i*4,sy=py+3+j*4;R(sx,sy+1,3,2,S[1]);R(sx+1,sy,1,1,S[1]);R(sx+1,sy+2,1,1,S[2])}}
function plate(px,py,on){const P=TH.plate;R(px+2,py+2,12,12,TH.outline);R(px+3,py+3,10,10,on?TH.plateOn:P[0]);R(px+4,py+4,8,8,on?E32.orange:P[1]);R(px+5,py+5,6,1,on?E32.yellow:P[0])}
function goal(px,py){const G=TH.goal;R(px+1,py+2,14,12,TH.outline);R(px+2,py+3,12,10,G[0]);R(px+3,py+4,10,8,G[1]);const f=Math.floor(T*6)%4;
 R(px+4,py+5,8,6,f%2?G[2]:G[1]);R(px+6,py+6,4,4,G[3]);o.globalAlpha=.5+.3*Math.sin(T*4);R(px+5+((f)%3),py+2-((f*3)%6),1,1,G[3]);R(px+10-(f%3),py+1-((f*2)%5),1,1,E32.white);o.globalAlpha=1}
const SHAPES={c:[[1,0],[2,0],[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[2,2],[3,2],[1,3],[2,3]],m:[[1,0],[2,0],[1,1],[2,1],[0,2],[1,2],[2,2],[3,2],[0,3],[1,3],[2,3],[3,3]],n:[[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[2,2],[3,2],[0,3],[1,3],[2,3],[3,3]]};
function mark(k,x,y,c){SHAPES[k].forEach(p=>R(x+p[0],y+p[1],1,1,c))}
function keyItem(px,py,k){const c=KC[k],b=Math.round(Math.sin(T*3)*1);py+=b;R(px+3,py+3,6,6,TH.outline);R(px+4,py+4,4,4,c);mark(k,px+4,py+4,E32.white);R(px+9,py+5,5,2,TH.outline);R(px+9,py+5,5,1,c);R(px+12,py+7,1,2,c);R(px+10,py+7,1,1,c)}
function gate(px,py,k,a){const c=KC[k];o.save();o.beginPath();o.rect(px,py,16,16);o.clip();const oy=-Math.round(a*16);R(px,py+oy,16,16,TH.outline);R(px+1,py+1+oy,14,14,TH.gate);R(px+2,py+2+oy,12,12,c);for(let i=4;i<14;i+=3)R(px+i,py+2+oy,1,12,TH.gate);R(px+5,py+5+oy,6,6,TH.outline);mark(k,px+6,py+6+oy,E32.white);o.restore()}
function bars(px,py,a){const B=TH.bars;o.save();o.beginPath();o.rect(px,py,16,16);o.clip();const oy=-Math.round(a*16);R(px,py+oy,16,2,TH.outline);R(px,py+14+oy,16,2,TH.outline);for(let i=1;i<16;i+=4){R(px+i,py+oy,3,16,TH.outline);R(px+i+1,py+oy,1,16,B[1])}R(px,py+1+oy,16,1,B[0]);o.restore()}
function crate(px,py,on,fv){const C=TH.crate;R(px+1,py+1,14,14,TH.outline);R(px+2,py+2,12,12,C[0]);R(px+2,py+2,12,1,C[2]);R(px+2,py+6,12,1,C[1]);R(px+2,py+10,12,1,C[1]);R(px+4,py+3,1,10,C[1]);R(px+11,py+3,1,10,C[1]);
 if(on){o.globalAlpha=.5+fv*.5;R(px,py,16,1,TH.crateOn);R(px,py+15,16,1,TH.crateOn);R(px,py,1,16,TH.crateOn);R(px+15,py,1,16,TH.crateOn);o.globalAlpha=1}}
function battery(px,py){const B=TH.battery,b=Math.round(Math.sin(T*3));py+=b;R(px+5,py+3,6,11,TH.outline);R(px+7,py+2,2,1,TH.outline);R(px+6,py+4,4,9,B[0]);R(px+6,py+8,4,5,B[1])}
function glove(px,py){const G=TH.glove,b=Math.round(Math.sin(T*3));py+=b;R(px+3,py+3,10,10,TH.outline);R(px+4,py+4,8,3,G[0]);R(px+4,py+7,2,4,G[0]);R(px+10,py+7,2,4,G[0]);R(px+4,py+11,2,2,G[1]);R(px+10,py+11,2,2,G[1]);R(px+6,py+7,4,4,TH.outline)}
function enemy(px,py){const N=TH.enemy;const b=Math.round(Math.sin(T*5));R(px+3,py+4+b,10,10,TH.outline);R(px+4,py+5+b,8,8,N[0]);R(px+4,py+5+b,8,2,N[1]);R(px+6,py+8+b,4,2,TH.outline);R(px+7+(Math.floor(T*2)%2),py+8+b,1,2,N[2]);R(px+4,py+14,2,1,TH.outline);R(px+10,py+14,2,1,TH.outline)}
function robot(px,py,face,dir,frame,look,alpha){const Rb=TH.robot,O=TH.outline;o.globalAlpha=alpha;
 // antenna glow
 o.globalAlpha=alpha*(.25+.15*Math.sin(T*4));R(px+5,py-2,6,6,Rb.bulb);o.globalAlpha=alpha;R(px+7,py+2,2,3,O);R(px+7,py+3,1,2,Rb.stem);R(px+6,py,4,3,O);R(px+7,py,2,2,Rb.bulb);
 R(px+3,py+5,10,9,O);R(px+2,py+6,12,7,O);R(px+3,py+6,10,7,Rb.body);R(px+3,py+11,10,2,Rb.shade);
 // feet (2-frame walk)
 R(px+4,py+14-(frame===1?1:0),3,2,O);R(px+9,py+14-(frame===2?1:0),3,2,O);
 if(dir==='up'){R(px+5,py+7,6,3,Rb.shade);o.globalAlpha=1;return}
 const sx=dir==='left'?-1:dir==='right'?1:0;R(px+4+sx,py+7,8,4,Rb.screen);
 const ex=sx+look,E=Rb.eye;
 if(face==='x'){[[0,0],[2,0],[1,1],[0,2],[2,2]].forEach(p=>{R(px+5+sx+p[0],py+7+p[1],1,1,Rb.x);R(px+8+sx+p[0],py+7+p[1],1,1,Rb.x)})}
 else if(face==='heart'){[[0,0],[2,0],[0,1],[1,1],[2,1],[1,2]].forEach(p=>{R(px+5+sx+p[0],py+7+p[1],1,1,Rb.heart);R(px+8+sx+p[0],py+7+p[1],1,1,Rb.heart)})}
 else if(face==='pant'){R(px+5+ex,py+8,2,1,E);R(px+9+ex,py+8,2,1,E);R(px+7+ex,py+9+(Math.floor(T*8)%2),2,1,Rb.heart)}
 else{const bl=(T%3.2)>3.05;R(px+6+ex,py+(bl?9:8),1,bl?1:2,E);R(px+9+ex,py+(bl?9:8),1,bl?1:2,E)}
 o.globalAlpha=1}
function nearOpen(x,y){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(Logic.cell(L,x+dx,y+dy)!=='#')return true}return false}
let lastDraw=0;
function draw(manual){lastDraw=performance.now();const now=performance.now()/1000;const dt=Math.min(.05,now-(stamp||now));stamp=now;T+=dt;
 o.clearRect(0,0,off.width,off.height);
 for(const k in doors){doorAnim[k]+=(doors[k]?1:-1)*dt*3;doorAnim[k]=Math.max(0,Math.min(1,doorAnim[k]))}
 for(let y=0;y<L.H;y++)for(let x=0;x<L.W;x++){const c=L.grid[y][x],px=x*TS,py=y*TS,k=x+','+y;
  if(c==='#'){if(nearOpen(x,y))wall(px,py,x,y);continue}
  if(c==='I')ice(px,py,x,y);else FLOORS[TH.style](px,py,x,y);
  if(c==='O'){if(st.filled.indexOf(k)>=0){R(px+2,py+2,12,12,TH.outline);R(px+3,py+3,10,10,TH.crate[1]);R(px+3,py+3,10,1,TH.crate[0])}
   else if(Logic.isHole(st,x,y)){R(px+1,py+1,14,14,TH.outline);R(px+2,py+2,12,3,E32.navy)}
   else{const on=st.x===x&&st.y===y;R(px+1,py+1,14,14,TH.outline);R(px+2,py+2,12,12,E32.skin2);R(px+2,py+2,12,1,E32.tan);const C=TH.outline;R(px+5,py+4,1,3,C);R(px+6,py+7,2,1,C);R(px+8,py+8,1,3,C);if(on){R(px+10,py+3,1,4,C);R(px+9,py+7,1,1,C);R(px+3,py+10,4,1,C);R(px+7,py+11,1,2,C)}}}
  if(c==='*'&&!Logic.taken(st,x,y)){const b=Math.round(Math.sin(T*3+x));R(px+5,py+5+b,6,6,TH.outline);R(px+6,py+4+b,4,8,TH.outline);R(px+6,py+5+b,4,6,E32.grey1);R(px+5,py+6+b,6,4,E32.grey1);R(px+7,py+7+b,2,2,TH.outline);if(Math.floor(T*3+x)%5===0)R(px+10,py+4+b,1,1,E32.white)}
  if(c==='H')spikes(px,py);
  if(c==='X')plate(px,py,Logic.hasBox(st,x,y)>=0);
  if(c==='G')goal(px,py);
  if(Logic.KEYCOL[c]&&!Logic.taken(st,x,y))keyItem(px,py,c);
  if(c==='E'&&!Logic.taken(st,x,y))battery(px,py);
  if(c==='g'&&!Logic.taken(st,x,y))glove(px,py);
  if(c==='D'&&doorAnim[k]<1)bars(px,py,doorAnim[k]);
  if(Logic.isKeyDoor(c)&&doorAnim[k]<1)gate(px,py,c.toLowerCase(),doorAnim[k]);
 }
 st.boxes.forEach(b=>{const ba=boxAnim[b.join(',')];let bx=b[0],by=b[1];if(ba){const p=Math.min(1,(T-ba.t0)/.12);bx=ba.from[0]+(b[0]-ba.from[0])*p;by=ba.from[1]+(b[1]-ba.from[1])*p;if(p>=1)delete boxAnim[b.join(',')]}
  const fl=flash[b.join(',')],fv=fl!=null?Math.max(0,1-(T-fl)/.6):0;crate(bx*TS,by*TS,L.grid[b[1]][b[0]]==='X',fv)});
 Logic.patrolAt(L,st.t).forEach(p=>enemy(p[0]*TS,p[1]*TS));
 let rx=st.x,ry=st.y,alpha=1,shake=0,frame=0,lift=0;
 if(anim){const p=Math.min(1,(T-anim.t0)/anim.dur);
  if(anim.type==='move'){const pts=[anim.from].concat(anim.path),seg=p*(pts.length-1),i=Math.min(pts.length-2,Math.floor(seg)),f=seg-i;rx=pts[i][0]+(pts[i+1][0]-pts[i][0])*f;ry=pts[i][1]+(pts[i+1][1]-pts[i][1])*f;frame=anim.ice?0:(Math.floor(p*4)%2)+1;if(anim.ice&&Math.random()<.6)trail.push([rx,ry,T,Math.random(),Math.random()])}
  if(anim.type==='bump'){const d=Logic.DIRS[anim.dir],q=Math.min(1,p/.3),b=Math.sin(q*Math.PI)*.25;rx+=d[0]*b;ry+=d[1]*b;shake=p>.25?Math.round(Math.sin((p-.25)*Math.PI*10)*(1-p)*3):0}
  if(anim.type==='suck'){alpha=1-p;lift=p*6}
  if(p>=1){const a=anim;anim=null;idleT=T;if(a.type==='bump'&&(face==='x'||face==='pant'))face='norm';if(a.after)a.after()}}
 trail=trail.filter(t=>T-t[2]<.5);trail.forEach(t=>{const a=1-(T-t[2])/.5;o.globalAlpha=a;R(t[0]*TS+4+t[3]*8,t[1]*TS+12+t[4]*3-(1-a)*3,2,2,TH.trail[t[3]<.5?0:1]);o.globalAlpha=1});
 let look=0;const idle=!anim&&!won&&T-idleT>3;if(idle){const ph=(T-idleT-3)%4;look=ph<.7?-1:ph<1.4?1:0}
 const pant=face==='pant'||(st.left!=null&&st.left<=3&&face==='norm');
 const bob=Math.round(Math.sin(T*(pant?9:2.4))*(pant?1:1));
 let hop=0,bang=false;if(react){const q=(T-react.t0)/(react.type==='hop'?.4:.8);if(q>=1)react=null;else{hop=Math.round(Math.sin(Math.min(1,q*(react.type==='hop'?1:2.2))*Math.PI)*(react.type==='hop'?4:3));bang=react.type==='startle'}}
 {const gx=Math.round(rx*TS),gy=Math.round(ry*TS);o.globalAlpha=alpha*(.35+.1*Math.sin(T*3));R(gx+3,gy+13,10,3,E32.cyan);R(gx+1,gy+14,14,1,E32.cyan);o.globalAlpha=alpha*.6;R(gx+4,gy+14,8,1,E32.cyan);o.globalAlpha=1}
 robot(Math.round(rx*TS)+shake,Math.round(ry*TS)+bob-lift-1-hop,pant&&face==='norm'?'pant':face,anim&&anim.type==='bump'?'down':facing,frame,look,alpha);
 if(bang){const bx=Math.round(rx*TS)+12,by=Math.round(ry*TS)-6-hop;R(bx-1,by-1,4,9,TH.outline);R(bx,by,2,5,E32.amber);R(bx,by+6,2,1,E32.amber)}
 if(won&&anim&&anim.type==='suck'){const p=(T-anim.t0)/anim.dur;[[-4,0],[5,-3],[0,-6]].forEach((h,i)=>{o.globalAlpha=1-p;const hx=Math.round(st.x*TS+6+h[0]),hy=Math.round(st.y*TS+h[1]-p*8-i);[[0,0],[2,0],[0,1],[1,1],[2,1],[1,2]].forEach(q=>R(hx+q[0],hy+q[1],1,1,TH.robot.heart))});o.globalAlpha=1}
 if(TH.flakes){for(let i=0;i<14;i++){const fx=(hash(i,1,1)*off.width+Math.sin(T+i)*4)%off.width,fy=((hash(i,2,2)*off.height+T*(6+i%4)))%off.height;R(fx,fy,1,1,E32.white)}}
 // ambient bird
 if(TH.birds){if(T>nextBird&&!birds.length){birds.push({x:-4,y:2+Math.random()*(off.height*.4),v:18+Math.random()*10});nextBird=T+8+Math.random()*10}
  birds=birds.filter(b=>{b.x+=b.v*dt;const w=Math.floor(T*8)%2;R(b.x,b.y+w,1,1,TH.bird);R(b.x+1,b.y+1,1,1,TH.bird);R(b.x+2,b.y+w,1,1,TH.bird);return b.x<off.width+4})}
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(off,0,0,cv.width,cv.height);
 if(manual!==true)requestAnimationFrame(draw)}
$('mute').onclick=()=>{save.mute=!save.mute;persist();$('mute').textContent=save.mute?'🔇':'🔊';if(!save.mute){audioInit();sfx('key')}};$('mute').textContent=save.mute?'🔇':'🔊';
window.__game={MINALL,openMenu,save:()=>save,move,undo,reset:()=>load(li),load,state:()=>({li,steps,won,st,anim:!!anim,face}),MIN};
load(save.last&&worldUnlocked(worldOf(save.last))?save.last:0);requestAnimationFrame(draw);setInterval(()=>{if(performance.now()-lastDraw>100)draw(true)},50); // fallback when rAF is throttled (background tab / headless)
})();
