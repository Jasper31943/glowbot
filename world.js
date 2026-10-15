// Glowbot 小光 — big-map mode UI/renderer. Art, palette, sfx come from art.js (generated from game.js) so the look is identical.
const WE=WorldEngine,$=id=>document.getElementById(id),cv=$('cv'),ctx=cv.getContext('2d'),off=document.createElement('canvas'),o=off.getContext('2d');
const mini=$('mini'),mctx=mini.getContext('2d');
const SAVEKEY='glowbot.world.v1',SHARE_URL='https://jasper31943.github.io/glowbot/';
let save={};try{save=JSON.parse(localStorage.getItem('robotMaze.v1'))||{}}catch(e){} // shares mute setting with level mode
const W=WE.parseWorld(WORLD_DEF);if(W.errors.length)console.warn('world errors',W.errors);
let T=0,stamp=0,L=null,st=null,TH=WORLDS.grass,S=null; // L/st/TH are the views art.js paints from
let anim=null,fx=[],shake=0,fade=0,react=null,failAnim=null,cam={x:0,y:0,init:false},SC=3,VW=7,VH=9,facing='down',idleT=0,tutorialDone=false;
// ---------- save / load ----------
const SAVEVER=2; // bump when map/engine changes make old saves invalid
function persist(){try{localStorage.setItem(SAVEKEY,JSON.stringify({v:SAVEVER,s:S,tutorialDone}))}catch(e){}}
let saved=null; // valid save found at load (title offers 繼續上次)
function loadGame(){S=WE.initState(W);tutorialDone=false;try{const d=JSON.parse(localStorage.getItem(SAVEKEY));
 if(d&&d.v===SAVEVER&&d.s&&W.maps[d.s.m]&&typeof d.s.x==='number')saved=d;else localStorage.removeItem(SAVEKEY)}catch(e){try{localStorage.removeItem(SAVEKEY)}catch(_){}}}
function newGame(){S=WE.initState(W);tutorialDone=false;cam.init=false;persist();hud()}
// ---------- view adapters for art.js ----------
function buildView(){const M=W.maps[S.m];const g=[];for(let y=0;y<M.H;y++){const r=[];for(let x=0;x<M.W;x++)r.push(WE.cell(W,S,S.m,x,y));g.push(r)}
 L={grid:g,W:M.W,H:M.H};const pre=S.m+':',strip=a=>a.filter(k=>k.startsWith(pre)).map(k=>k.slice(pre.length));
 st={x:S.x,y:S.y,got:strip(S.got),holes:strip(S.holes),filled:strip(S.filled),boxes:strip(S.boxes).map(k=>k.split(',').map(Number)),keys:'',t:0,left:S.left}}
// ---------- layout / camera ----------
function resize(){const w=$('wrap'),aw=w.clientWidth,ah=w.clientHeight;const desk=matchMedia('(min-width:900px),(hover:hover) and (pointer:fine)').matches&&innerWidth>=700;
 const M=W.maps[S.m];
 if(desk){SC=4;VW=Math.min(M.W,Math.floor(aw/64));VH=Math.min(M.H,Math.floor(ah/64))}else{SC=3;VW=Math.min(M.W,Math.floor(aw/48),7);VH=Math.min(M.H,Math.floor(ah/48))}
 if(VW<7&&!desk){SC=2;VW=Math.min(M.W,7);VH=Math.min(M.H,Math.floor(ah/32))}
 off.width=VW*16;off.height=VH*16;cv.width=off.width*SC;cv.height=off.height*SC;cv.style.width=cv.width+'px';cv.style.height=cv.height+'px';ctx.imageSmoothingEnabled=false;
 mini.width=M.W*2;mini.height=M.H*2;{const k=44/Math.max(M.W,M.H);mini.style.width=Math.round(M.W*k)+'px';mini.style.height=Math.round(M.H*k)+'px'}}
addEventListener('resize',()=>{resize()});
function camTarget(){const M=W.maps[S.m];const Z=WE.zoneAt(W,S.m,S.x,S.y);let tx,ty;
 if(Z){tx=Z.x+Z.w/2-VW/2;ty=Z.y+Z.h/2-VH/2}else{const d=WE.DIRS[facing];tx=S.x+.5+d[0]*2-VW/2;ty=S.y+.5+d[1]*2-VH/2}
 tx=Math.max(0,Math.min(M.W-VW,tx));ty=Math.max(0,Math.min(M.H-VH,ty));if(M.W<=VW)tx=(M.W-VW)/2;if(M.H<=VH)ty=(M.H-VH)/2;return[tx,ty]}
// ---------- HUD ----------
const ITEMNAME={c:'青鑰匙',m:'紫鑰匙',n:'粉鑰匙',k:'冰爪',g:'磁力手套',U:'電池升級'};
function hud(){const M=W.maps[S.m],Z=WE.zoneAt(W,S.m,S.x,S.y);$('mapname').textContent=M.name;$('zonename').textContent=Z?Z.name:'野外';
 const k=$('keys');k.innerHTML='';const chip=t=>{const c=document.createElement('span');c.className='chip';c.innerHTML=t;k.append(c)};
 if(S.held)chip('💣 炸彈');for(const i of S.inv)chip(ITEMNAME[i]||i);const bolts=S.got.filter(g=>WE.base(W,g.split(':')[0],...g.split(':')[1].split(',').map(Number))==='*').length;if(bolts)chip('🔩 '+bolts);
 const lf=$('remain');if(S.left!=null){lf.style.display='';lf.innerHTML=`剩 <b class="${S.left<=3?'low':''}">${S.left}</b> 步`}else lf.style.display='none';
 const h=(W.hints||[]).find(h=>(h.need&&!WE.hasInv(S,h.need))||(h.visit&&S.visited.indexOf(h.visit)<0)||(!h.need&&!h.visit));$('hint').textContent=h?'▶ '+h.text:'';}
// ---------- input ----------
function act(a,opt){if(anim||failAnim||$('title').classList.contains('on')||$('menu').classList.contains('on')||$('help').classList.contains('on'))return;
 if(WE.DIRS[a]){facing=a;idleT=T}
 const prev=S,r=WE.step(W,S,a,opt);
 if(r.result==='noop'){return}
 if(r.result==='tired'){sfx('bump');anim={type:'bump',dir:a,t0:T,dur:.6,face:'pant'};return}
 if(r.result==='fall'){sfx('fail');anim={type:'bump',dir:a,t0:T,dur:.8,face:'x'};return}
 const doorsBefore=doorSet();S=r.state;
 if(r.ev.indexOf('blast')>=0){const b=S.lastBlast||{};if(b.m===S.m)[[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>fx.push({type:'smoke',x:b.x+dx,y:b.y+dy,t0:T}));sfx('crumble');if(r.ev.indexOf('wall')>=0)shake=3;delete S.lastBlast}
 if(r.result==='fail'){failAnim={t0:T,from:prev};sfx('fail');return}
 if(r.result==='bump'){sfx('bump');anim={type:'bump',dir:a,t0:T,dur:.6,face:'x'};hud();return}
 if(r.result==='reset'){sfx('door');cam.init=true;hud();persist();return}
 if(r.result==='act'){if(r.ev.indexOf('grab')>=0)sfx('key');if(r.ev.indexOf('place')>=0){sfx('push');tutorialAssist()}hud();persist();return}
 const path=r.path||[];anim={type:'move',from:[prev.x,prev.y],path,t0:T,dur:.11*path.length+.03,ice:path.length>1,m:prev.m};
 sfx(r.ev.indexOf('push')>=0?'push':path.length>1?'slide':'step');['key','bolt','crumble'].forEach(e=>{if(r.ev.indexOf(e)>=0)setTimeout(()=>sfx(e),60)});
 if(r.ev.indexOf('key')>=0||r.ev.indexOf('claws')>=0||r.ev.indexOf('glove')>=0||r.ev.indexOf('upgrade')>=0)react={type:'hop',t0:T};
 if(doorSet()!==doorsBefore){shake=3;sfx('door')}
 if(r.result==='tunnel'){fade=1;anim=null;cam.init=false;sfx('slide');resize()}
 persist(); // save after every counted move (tunnels, pickups, cleared areas included)
 hud()}
function doorSet(){const M=W.maps[S.m];let s='';for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++){const c=M.grid[y][x];if('DCMN'.indexOf(c)>=0)s+=WE.solid(W,S,S.m,x,y)?'1':'0'}return s}
// Zone A tutorial: first bomb placed -> '!' + auto-hop one tile away from the blast. The hop is FREE (no fuse tick), so the
// player still gets exactly the 3 turns the bomb shows (3,2,1 then boom). Solver/check.js never use it (it only adds slack).
function tutorialAssist(){const Z=WE.zoneAt(W,S.m,S.x,S.y);if(!Z||!Z.tutorial||tutorialDone)return;tutorialDone=true;react={type:'startle',t0:T};
 const b=S.bombs[S.bombs.length-1],away=Object.keys(WE.DIRS).filter(d=>{const [dx,dy]=WE.DIRS[d];const nx=S.x+dx,ny=S.y+dy;return Math.abs(nx-b.x)+Math.abs(ny-b.y)>1&&!(nx===b.x&&ny===b.y)&&!WE.solid(W,S,S.m,nx,ny)&&WE.boxAt(S,S.m,nx,ny)<0&&WE.bombAt(S,S.m,nx,ny)<0});
 if(away.length){const keepFacing=facing;setTimeout(()=>{act(away[0],{free:true});facing=keepFacing},450)}}
const KEYS={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
// controls help: shown on load, any key / tap closes it, '?' reopens
const helpOn=()=>$('help').classList.contains('on');let helpT=performance.now();
// title screen (og.png look) comes first; any key / tap -> help panel -> game
const titleOn=()=>$('title').classList.contains('on');
function closeTitle(e){if(e){e.preventDefault();e.stopImmediatePropagation()}$('title').classList.remove('on');helpT=performance.now()}
// title choices: with a valid save -> [繼續上次][新遊戲] (+confirm); without -> any key/tap = new game
let tsel=0,csel=1;const confOn=()=>$('tconf').classList.contains('on');
function tpaint(){$('tCont').classList.toggle('sel',tsel===0);$('tNew').classList.toggle('sel',tsel===1);$('cYes').classList.toggle('sel',csel===0);$('cNo').classList.toggle('sel',csel===1)}
function startContinue(){S=saved.s;tutorialDone=!!saved.tutorialDone;cam.init=false;resize();hud();closeTitle()}
function startNew(){newGame();closeTitle()}
function chooseNew(){if(saved){csel=1;$('tconf').classList.add('on');tpaint()}else startNew()}
function titleKey(k){if(!saved){startNew();return}const nav=KEYS[k],ok=k==='Enter'||k===' ';
 if(confOn()){if(nav){csel=1-csel;tpaint()}else if(ok){if(csel===0){$('tconf').classList.remove('on');startNew()}else{$('tconf').classList.remove('on')}}else if(k==='Escape')$('tconf').classList.remove('on');return}
 if(nav){tsel=1-tsel;tpaint()}else if(ok){tsel===0?startContinue():chooseNew()}}
const tb=(id,f)=>$(id).addEventListener('pointerup',e=>{e.stopPropagation();e.preventDefault();f()});
tb('tCont',()=>{tsel=0;startContinue()});tb('tNew',()=>{tsel=1;tpaint();chooseNew()});tb('cYes',()=>{$('tconf').classList.remove('on');startNew()});tb('cNo',()=>$('tconf').classList.remove('on'));
$('title').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault()});$('title').addEventListener('pointerup',e=>{e.stopPropagation();if(!saved)startNew()});
function closeHelp(e){if(!helpOn()||performance.now()-helpT<250)return false;if(e)e.preventDefault();$('help').classList.remove('on');return true}
$('helpBtn').onclick=e=>{e.stopPropagation();$('help').classList.add('on');helpT=performance.now()};
let hp=null;$('help').addEventListener('pointerdown',e=>{e.stopPropagation();hp=[e.clientX,e.clientY]}); // tap (not scroll-drag) closes
$('help').addEventListener('pointerup',e=>{e.stopPropagation();if(hp&&Math.hypot(e.clientX-hp[0],e.clientY-hp[1])<10)closeHelp(e);hp=null});$('help').addEventListener('pointercancel',()=>hp=null);
// one key gate for title + help: a fresh key press advances title -> help -> play; held-key repeats are ignored;
// an arrow/WASD that closes the help panel also moves, so play starts right away
addEventListener('keydown',e=>{if(['Shift','Control','Alt','Meta','CapsLock','Tab'].indexOf(e.key)>=0)return;
 if(titleOn()){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)titleKey(e.key);return}
 if(helpOn()){if(e.repeat){e.preventDefault();e.stopImmediatePropagation();return}$('help').classList.remove('on');
  if(!KEYS[e.key]){e.preventDefault();e.stopImmediatePropagation()}}},true);
try{window.focus()}catch(e){}
addEventListener('keydown',e=>{if(KEYS[e.key]){e.preventDefault();press(KEYS[e.key])}else if(e.key===' '||e.key==='Enter'||e.key==='x'||e.key==='X'){e.preventDefault();act('act')}else if(e.key==='r'||e.key==='R'){e.preventDefault();act('reset')}});
function press(d){const b=$(d);b.classList.add('on');setTimeout(()=>b.classList.remove('on'),140);act(d)}
['up','down','left','right'].forEach(d=>$(d).addEventListener('pointerdown',e=>{e.preventDefault();press(d)}));
$('act').addEventListener('pointerdown',e=>{e.preventDefault();act('act')});$('reset').onclick=()=>act('reset');
let sx=null,sy=null;cv.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY});
addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24){return}act(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'))});
$('menuBtn').onclick=()=>$('menu').classList.add('on');$('mClose').onclick=()=>$('menu').classList.remove('on');$('mNew').onclick=()=>{newGame();$('menu').classList.remove('on')};
$('mute').onclick=()=>{save.mute=!save.mute;try{const g=JSON.parse(localStorage.getItem('robotMaze.v1'))||{};g.mute=save.mute;localStorage.setItem('robotMaze.v1',JSON.stringify(g))}catch(e){}$('mute').textContent=save.mute?'🔇':'🔊';if(!save.mute){audioInit();sfx('key')}};$('mute').textContent=save.mute?'🔇':'🔊';
// ---------- extra pixel sprites for big-map tiles (same palette) ----------
const DIG={1:['010','110','010','010','111'],2:['111','001','111','100','111'],3:['111','001','111','001','111']};
function digit(n,x,y,c){(DIG[n]||[]).forEach((r,j)=>r.split('').forEach((v,i)=>{if(v==='1')R(x+i,y+j,1,1,c)}))}
function cracked(px,py,x,y){wall(px,py,x,y);const C=TH.outline;R(px+4,py+3,1,3,C);R(px+5,py+6,2,1,C);R(px+7,py+7,1,3,C);R(px+8,py+10,2,1,C);R(px+10,py+4,1,2,C);R(px+11,py+6,1,1,C)}
function rubble(px,py,x,y){FLOORS[TH.style](px,py,x,y);const W2=TH.wall;[[3,10],[9,4],[11,11],[6,6]].forEach(([a,b],i)=>{R(px+a,py+b,3,2,TH.outline);R(px+a,py+b,2,1,W2[i%2])})}
function bombGrass(px,py,x,y){FLOORS[TH.style](px,py,x,y);const sw=Math.round(Math.sin(T*2+x)*.6);R(px+7,py+9,2,5,E32.green3);R(px+4+sw,py+10,3,1,E32.green1);R(px+9-sw,py+11,3,1,E32.green1);
 R(px+5,py+3,6,6,TH.outline);R(px+6,py+4,4,4,E32.grey4);R(px+6,py+4,1,1,E32.grey2);R(px+8,py+1,1,2,E32.brown1);if(Math.floor(T*3)%2)R(px+9,py+1,1,1,E32.amber)}
function rune(px,py,x,y){FLOORS[TH.style](px,py,x,y);R(px+4,py+2,8,13,TH.outline);R(px+5,py+3,6,11,E32.grey2);R(px+5,py+3,6,1,E32.grey1);const g=.5+.5*Math.sin(T*2);o.globalAlpha=g;R(px+7,py+5,2,1,E32.cyan);R(px+7,py+7,1,3,E32.cyan);R(px+8,py+9,2,1,E32.cyan);o.globalAlpha=1}
function tunnel(px,py,x,y,d){R(px,py,16,16,TH.outline);R(px+2,py+3,12,13,E32.ink);R(px+3,py+2,10,2,E32.ink);R(px+1,py+2,2,14,E32.grey3);R(px+13,py+2,2,14,E32.grey3);R(px+3,py+1,10,2,E32.grey3);digit(d,px+7,py+6,E32.amber)}
function hardIce(px,py,x,y){R(px,py,16,16,E32.blue1);R(px+1,py+1,14,14,E32.navy);for(let i=0;i<4;i++){R(px+7-i,py+2+i,1,1,E32.blue2);R(px+8+i,py+2+i,1,1,E32.blue2);R(px+7-i,py+13-i,1,1,E32.blue2);R(px+8+i,py+13-i,1,1,E32.blue2)}
 if((Math.floor(T*2+x*3+y))%6===0){R(px+1,py+1,2,1,E32.white);R(px+1,py+1,1,2,E32.white)}}
function claws(px,py){const b=Math.round(Math.sin(T*3));py+=b;R(px+3,py+5,10,7,TH.outline);R(px+4,py+6,8,5,E32.blue2);[4,7,10].forEach(i=>{R(px+i,py+11,2,3,TH.outline);R(px+i,py+11,1,2,E32.grey1)})}
function upgrade(px,py){battery(px,py);R(px+11,py+2,3,1,E32.green1);R(px+12,py+1,1,3,E32.green1)}
function bombSprite(px,py,b){const flash=b.t===1&&Math.floor(T*10)%2;R(px+4,py+5,9,9,TH.outline);R(px+5,py+6,7,7,flash?E32.red3:E32.grey4);R(px+6,py+7,2,2,flash?E32.pink:E32.grey2);R(px+9,py+3,2,3,E32.brown1);
 const sp=Math.floor(T*12)%2;R(px+10+sp,py+1,1,1,E32.amber);R(px+11,py+2-sp,1,1,E32.yellow);
 const dy=py-7;R(px+5,dy-1,7,8,TH.outline);R(px+6,dy,5,6,b.t===1?E32.red3:E32.sand);digit(b.t,px+7,dy+1,b.t===1?E32.white:E32.plum)}
function smoke(f){const p=(T-f.t0)/.5;if(p>=1)return false;const fr=Math.min(3,Math.floor(p*4)),px=(f.x-cam.ox)*16,py=(f.y-cam.oy)*16;
 const sizes=[[6,6],[10,9],[12,11],[8,6]][fr],cols=[E32.yellow,E32.orange,E32.grey2,E32.grey3];o.globalAlpha=fr===3?.6:1;
 R(px+8-sizes[0]/2,py+8-sizes[1]/2,sizes[0],sizes[1],cols[fr]);R(px+8-sizes[0]/2+2,py+8-sizes[1]/2-1,sizes[0]-4,sizes[1]+2,cols[fr]);if(fr<2)R(px+6,py+6,4,4,E32.white);o.globalAlpha=1;return true}
// ---------- draw ----------
function deep(x,y){const g=L.grid;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const r=g[y+dy];const c=r&&r[x+dx];if(c!==undefined&&c!=='#')return false}return true}
function bush(px,py,x,y){const h=((x*73856093)^(y*19349663))>>>0;R(px,py,16,16,E32.green2);
 if(h%3===0){R(px+2,py+3,1,1,E32.green1);R(px+11,py+10,1,1,E32.green1)}
 if(h%4!==0){const ox=(h>>3)%5,oy=(h>>6)%4;R(px+ox+2,py+oy+3,10,8,E32.green3);R(px+ox+3,py+oy+2,8,10,E32.green3);R(px+ox+3,py+oy+3,8,7,E32.green2);R(px+ox+4,py+oy+3,4,3,E32.green1);R(px+ox+3,py+oy+10,8,1,E32.green3)}
 if(h%7===0){R(px+5,py+6,1,1,E32.yellow);R(px+11,py+4,1,1,E32.pink)}}
function tile(c,px,py,x,y){if(TH===WORLDS.grass&&(c===undefined||(c==='#'&&deep(x,y)))){bush(px,py,x,y);return}
 if(c==='#'){if(nearOpen(x,y))wall(px,py,x,y);return}
 if(c==='%'){cracked(px,py,x,y);return}
 if(c===','){rubble(px,py,x,y);return}
 if(c==='b'){bombGrass(px,py,x,y);return}
 if(c==='R'){rune(px,py,x,y);return}
 if(/[1-9]/.test(c)){tunnel(px,py,x,y,c);return}
 if(c==='J'){hardIce(px,py,x,y);return}
 if(c==='I')ice(px,py,x,y);else FLOORS[TH.style](px,py,x,y);
 const k=x+','+y,got=st.got.indexOf(k)>=0;
 if(c==='H')spikes(px,py);
 if(c==='O'){if(st.filled.indexOf(k)>=0){R(px+2,py+2,12,12,TH.outline);R(px+3,py+3,10,10,TH.crate[1])}else if(st.holes.indexOf(k)>=0){R(px+1,py+1,14,14,TH.outline);R(px+2,py+2,12,3,E32.navy)}else{R(px+1,py+1,14,14,TH.outline);R(px+2,py+2,12,12,E32.skin2);R(px+5,py+4,1,3,TH.outline);R(px+8,py+8,1,3,TH.outline)}}
 if(c==='X')plate(px,py,st.boxes.some(b=>b[0]===x&&b[1]===y));
 if(c==='G')goal(px,py);
 if('cmn'.indexOf(c)>=0&&!got)keyItem(px,py,c);
 if(c==='E'&&!got)battery(px,py);if(c==='g'&&!got)glove(px,py);if(c==='k'&&!got)claws(px,py);if(c==='U'&&!got)upgrade(px,py);
 if(c==='*'&&!got){const b=Math.round(Math.sin(T*3+x));R(px+5,py+5+b,6,6,TH.outline);R(px+6,py+4+b,4,8,TH.outline);R(px+6,py+5+b,4,6,E32.grey1);R(px+5,py+6+b,6,4,E32.grey1);R(px+7,py+7+b,2,2,TH.outline)}
 if(c==='W')goal(px,py);
 if(c==='D'&&WE.solid(W,S,S.m,x,y))bars(px,py,0);
 if('CMN'.indexOf(c)>=0&&WE.solid(W,S,S.m,x,y))gate(px,py,c.toLowerCase(),0)}
function zoneBorders(){const M=W.maps[S.m];for(const Z of M.zones){const x0=(Z.x-cam.ox)*16,y0=(Z.y-cam.oy)*16,w=Z.w*16,h=Z.h*16;o.globalAlpha=.55;
  for(let i=0;i<w;i+=6){R(x0+i,y0,4,1,E32.grey1);R(x0+i,y0+h-1,4,1,E32.grey1)}for(let j=0;j<h;j+=6){R(x0,y0+j,1,4,E32.grey1);R(x0+w-1,y0+j,1,4,E32.grey1)}o.globalAlpha=1;
  // small restart icon (top-right corner)
  const ix=x0+w-9,iy=y0+2;R(ix,iy,7,7,TH.outline);R(ix+1,iy+1,5,5,E32.sand);R(ix+2,iy+2,3,1,E32.plum);R(ix+2,iy+2,1,3,E32.plum);R(ix+2,iy+4,3,1,E32.plum);R(ix+4,iy+1,1,2,E32.plum)}}
// help legend: draw each grass-map tile with the real sprite code into the help panel's little canvases (once)
let legendDone=false;function renderLegend(){legendDone=true;const D={'#':(x,y)=>wall(x,y,0,0),'.':(x,y)=>FLOORS[TH.style](x,y,0,0),'B':(x,y)=>{FLOORS[TH.style](x,y,0,0);crate(x,y,false,0)},'D':(x,y)=>{FLOORS[TH.style](x,y,0,0);bars(x,y,0)},'C':(x,y)=>{FLOORS[TH.style](x,y,0,0);gate(x,y,'c',0)}};
 document.querySelectorAll('#help canvas[data-t]').forEach(c=>{const k=c.dataset.t;o.clearRect(0,0,16,16);(D[k]||((x,y)=>tile(k,x,y,-99,-99)))(0,0);const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,32,32);g.drawImage(off,0,0,16,16,0,0,32,32)})}
function draw(){const now=performance.now()/1000,dt=Math.min(.05,now-(stamp||now));stamp=now;T+=dt;
 TH=WORLDS[W.maps[S.m].theme]||WORLDS.grass;buildView();if(!legendDone&&st){const th=TH;TH=WORLDS.grass;renderLegend();TH=th}
 const [tx,ty]=camTarget();if(!cam.init){cam.x=tx;cam.y=ty;cam.init=true}cam.x+=(tx-cam.x)*Math.min(1,dt*8);cam.y+=(ty-cam.y)*Math.min(1,dt*8);
 cam.ox=Math.round(cam.x*16)/16;cam.oy=Math.round(cam.y*16)/16;
 o.fillStyle=TH===WORLDS.grass?E32.green2:E32.ink;o.fillRect(0,0,off.width,off.height);
 const x0=Math.floor(cam.ox),y0=Math.floor(cam.oy);
 for(let y=y0-1;y<=y0+VH+1;y++)for(let x=x0-1;x<=x0+VW+1;x++){if((x<0||y<0||x>=L.W||y>=L.H)&&TH!==WORLDS.grass)continue;tile((L.grid[y]||[])[x],Math.round((x-cam.ox)*16),Math.round((y-cam.oy)*16),x,y)}
 zoneBorders();
 st.boxes.forEach(b=>crate(Math.round((b[0]-cam.ox)*16),Math.round((b[1]-cam.oy)*16),L.grid[b[1]][b[0]]==='X',0));
 S.bombs.filter(b=>b.m===S.m).forEach(b=>bombSprite(Math.round((b.x-cam.ox)*16),Math.round((b.y-cam.oy)*16),b));
 // robot
 let rx=S.x,ry=S.y,frame=0,shk=0,face='norm';
 if(anim){const p=Math.min(1,(T-anim.t0)/anim.dur);
  if(anim.type==='move'&&anim.m===S.m){const pts=[anim.from].concat(anim.path),seg=p*(pts.length-1),i=Math.min(pts.length-2,Math.floor(seg)),f=seg-i;rx=pts[i][0]+(pts[i+1][0]-pts[i][0])*f;ry=pts[i][1]+(pts[i+1][1]-pts[i][1])*f;frame=anim.ice?0:(Math.floor(p*4)%2)+1}
  if(anim.type==='bump'){const d=WE.DIRS[anim.dir],q=Math.min(1,p/.3),b=Math.sin(q*Math.PI)*.25;rx+=d[0]*b;ry+=d[1]*b;shk=p>.25?Math.round(Math.sin((p-.25)*Math.PI*10)*(1-p)*3):0;face=anim.face}
  if(p>=1){anim=null;idleT=T}}
 let hop=0,bang=false;if(react){const q=(T-react.t0)/(react.type==='hop'?.4:.8);if(q>=1)react=null;else{hop=Math.round(Math.sin(Math.min(1,q*(react.type==='hop'?1:2.2))*Math.PI)*(react.type==='hop'?4:3));bang=react.type==='startle'}}
 const gx=Math.round((rx-cam.ox)*16),gy=Math.round((ry-cam.oy)*16);
 o.globalAlpha=.35+.1*Math.sin(T*3);R(gx+3,gy+13,10,3,E32.cyan);R(gx+1,gy+14,14,1,E32.cyan);o.globalAlpha=1;
 let look=0;if(!anim&&T-idleT>3){const ph=(T-idleT-3)%4;look=ph<.7?-1:ph<1.4?1:0}
 if(failAnim){const p=(T-failAnim.t0)/1.0;robot(gx,gy-1,'x','down',0,0,1);o.globalAlpha=.85;R(gx+2,gy+5,12,9,E32.ink);R(gx+6,gy,4,3,E32.ink);o.globalAlpha=1;
  // dizzy spiral eyes
  const sp=Math.floor(T*10)%4,E=[[0,0],[1,0],[1,1],[0,1]];[5,9].forEach(ex=>{R(gx+ex,gy+7,3,3,E32.grey3);const [a,b]=E[sp];R(gx+ex+a,gy+7+b,1,1,E32.yellow)});
  for(let i=0;i<3;i++){const q=(p*2+i/3)%1;o.globalAlpha=1-q;R(gx+6+i*2+Math.round(Math.sin(q*6+i)*2),gy-2-q*10,3,3,E32.grey2);o.globalAlpha=1}
  if(p>=1){const ff=failAnim;failAnim=null;S=WE.zoneAt(W,S.m,S.x,S.y)&&S.zone?WE.step(W,S,'reset').state:S;cam.init=true;hud();persist()}}
 else robot(gx+shk,gy+Math.round(Math.sin(T*2.4))-1-hop,react&&react.type==='hop'?'norm':face,anim&&anim.type==='bump'?'down':facing,frame,look,1);
 if(bang){const bx=gx+12,by=gy-6-hop;R(bx-1,by-1,4,9,TH.outline);R(bx,by,2,5,E32.amber);R(bx,by+6,2,1,E32.amber)}
 if(S.held&&!failAnim){R(gx+11,gy+1-hop,5,5,TH.outline);R(gx+12,gy+2-hop,3,3,E32.grey4)}
 fx=fx.filter(smoke);
 // blit with shake + tunnel fade
 const sh=shake>0?(shake--%2?2:-2)*SC:0;ctx.imageSmoothingEnabled=false;ctx.fillStyle=E32.ink;ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(off,sh,0,cv.width,cv.height);
 if(fade>0){ctx.fillStyle=`rgba(24,20,37,${fade})`;ctx.fillRect(0,0,cv.width,cv.height);fade=Math.max(0,fade-dt/0.3)}
 drawMini();lastDraw=performance.now();if(!manualDraw)requestAnimationFrame(draw)}
let lastDraw=0,manualDraw=false;
function drawMini(){const M=W.maps[S.m];mctx.clearRect(0,0,mini.width,mini.height);mctx.fillStyle='rgba(24,20,37,.45)';mctx.fillRect(0,0,mini.width,mini.height);
 for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++){const c=L.grid[y][x];if(c==='#'||c==='R')continue;mctx.fillStyle=c==='%'?E32.grey3:c==='I'||c==='J'?E32.blue2:/[1-9]/.test(c)?E32.amber:c==='b'?E32.green3:'CMN'.indexOf(c)>=0?E32.magenta:E32.green1;mctx.fillRect(x*2,y*2,2,2)}
 for(const Z of M.zones){mctx.strokeStyle=E32.sand;mctx.lineWidth=.5;mctx.strokeRect(Z.x*2+.25,Z.y*2+.25,Z.w*2-.5,Z.h*2-.5)}
 mctx.fillStyle=(Math.floor(T*4)%2)?E32.white:E32.cyan;mctx.fillRect(S.x*2-1,S.y*2-1,4,4)}
// ---------- boot ----------
loadGame();if(saved){$('title').classList.add('has');tpaint()}resize();hud();requestAnimationFrame(draw);
setInterval(()=>{if(performance.now()-lastDraw>100){manualDraw=true;draw();manualDraw=false}},50);
window.__world={act,state:()=>S,W,newGame,cam};
