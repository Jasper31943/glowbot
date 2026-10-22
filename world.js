// Glowbot 小光 — big-map mode UI/renderer. Art, palette, sfx come from art.js (generated from game.js) so the look is identical.
const WE=WorldEngine,$=id=>document.getElementById(id),cv=$('cv'),ctx=cv.getContext('2d'),off=document.createElement('canvas'),o=off.getContext('2d');
const mini=$('mini'),mctx=mini.getContext('2d');
const SAVEKEY='glowbot.world.v1',SHARE_URL='https://jasper31943.github.io/glowbot/';
let save={};try{save=JSON.parse(localStorage.getItem('robotMaze.v1'))||{}}catch(e){} // shares mute setting with level mode
const W=WE.parseWorld(WORLD_DEF);if(W.errors.length)console.warn('world errors',W.errors);
let T=0,stamp=0,L=null,st=null,TH=WORLDS.grass,S=null; // L/st/TH are the views art.js paints from
let anim=null,fx=[],shake=0,fade=0,react=null,failAnim=null,cam={x:0,y:0,init:false},SC=3,VW=7,VIEWH=9,facing='down',idleT=0,tutorialDone=false;
// ---------- save / load ----------
const SAVEVER=4,SAVEOK=[3,4]; // v4 = desert/forest fields; v3 saves are upgraded in place (they never reached those maps)
function persist(){try{localStorage.setItem(SAVEKEY,JSON.stringify({v:SAVEVER,s:S,tutorialDone}))}catch(e){}}
let saved=null; // valid save found at load (title offers 繼續上次)
function loadGame(){S=WE.initState(W);tutorialDone=false;try{const d=JSON.parse(localStorage.getItem(SAVEKEY));
 if(d&&SAVEOK.indexOf(d.v)>=0&&d.s&&W.maps[d.s.m]&&typeof d.s.x==='number'){WE.initMovers(W,d.s);d.v=SAVEVER;saved=d}else localStorage.removeItem(SAVEKEY)}catch(e){try{localStorage.removeItem(SAVEKEY)}catch(_){}}}
function newGame(){S=WE.initState(W);tutorialDone=false;cam.init=false;persist();hud()}
// ---------- view adapters for art.js ----------
function buildView(){const M=W.maps[S.m];const g=[];for(let y=0;y<M.H;y++){const r=[];for(let x=0;x<M.W;x++)r.push(WE.cell(W,S,S.m,x,y));g.push(r)}
 L={grid:g,W:M.W,H:M.H};const pre=S.m+':',strip=a=>a.filter(k=>k.startsWith(pre)).map(k=>k.slice(pre.length));
 st={x:S.x,y:S.y,got:strip(S.got),holes:strip(S.holes),filled:strip(S.filled),boxes:strip(S.boxes).map(k=>k.split(',').map(Number)),keys:'',t:0,left:S.left}}
// ---------- layout / camera ----------
function resize(){const w=$('wrap'),aw=w.clientWidth,ah=w.clientHeight;const desk=matchMedia('(min-width:900px),(hover:hover) and (pointer:fine)').matches&&innerWidth>=700;
 const M=W.maps[S.m];
 if(desk){SC=Math.max(4,Math.floor(Math.min(aw/(15*16),ah/(9*16))));VW=Math.min(M.W,Math.floor(aw/(16*SC)));VIEWH=Math.min(M.H,Math.floor(ah/(16*SC)))} // big screens scale up (>=4x) instead of showing the whole mapelse{SC=3;VW=Math.min(M.W,Math.floor(aw/48),7);VIEWH=Math.min(M.H,Math.floor(ah/48))}
 if(VW<7&&!desk){SC=2;VW=Math.min(M.W,7);VIEWH=Math.min(M.H,Math.floor(ah/32))}
 off.width=VW*16;off.height=VIEWH*16;cv.width=off.width*SC;cv.height=off.height*SC;cv.style.width=cv.width+'px';cv.style.height=cv.height+'px';ctx.imageSmoothingEnabled=false;
 mini.width=M.W*2;mini.height=M.H*2;{const k=44/Math.max(M.W,M.H);mini.style.width=Math.round(M.W*k)+'px';mini.style.height=Math.round(M.H*k)+'px'}}
addEventListener('resize',()=>{resize()});
function camTarget(){const M=W.maps[S.m];const Z=WE.zoneAt(W,S.m,S.x,S.y);let tx,ty;
 if(Z){tx=Z.x+Z.w/2-VW/2;ty=Z.y+Z.h/2-VIEWH/2}else{const d=WE.DIRS[facing];tx=S.x+.5+d[0]*2-VW/2;ty=S.y+.5+d[1]*2-VIEWH/2}
 tx=Math.max(0,Math.min(M.W-VW,tx));ty=Math.max(0,Math.min(M.H-VIEWH,ty));if(M.W<=VW)tx=(M.W-VW)/2;if(M.H<=VIEWH)ty=(M.H-VIEWH)/2;return[tx,ty]}
// ---------- HUD ----------
const KEYMAP={c:'grass',m:'ice',k:'ice',f:'ice'}; // map-local items: chip only shown on their own map
const ITEMNAME={c:'青鑰匙',m:'紫鑰匙',n:'粉鑰匙',k:'冰爪',f:'符文碎片',F:'🔥 吐火',g:'磁力手套',U:'電池升級'};
// ---------- stuck detection: after each move in a puzzle area, exhaustive in-area search (WE.zoneStuck). Only a proven dead state is flagged.
let stuck={k:null,on:false,boxes:[]};const STUCKSEEN='glowbot.stuckSeen';let stuckSeen=false;try{stuckSeen=localStorage.getItem(STUCKSEEN)==='1'}catch(e){}
function checkStuck(){const k=S.zone?WE.key(S):null;if(k===stuck.k)return;stuck.k=k;const was=stuck.on;stuck.on=false;stuck.boxes=[];
 if(k){const Z=W.maps[S.m].zones.find(z=>z.id===S.zone),inZ=(x,y)=>x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h;
  const zb=S.boxes.filter(b=>b.startsWith(S.m+':')).map(b=>b.split(':')[1].split(',').map(Number)).filter(([x,y])=>inZ(x,y));
  if(zb.length){const g=WE.zoneStuckIter(W,JSON.parse(JSON.stringify(S)),20000),job=stuck.job={}; // run in ~6ms slices so moving never freezes
   const slice=()=>{if(stuck.job!==job||stuck.k!==k)return;if(anim||performance.now()-stuck.lastMove<500)return setTimeout(slice,200); // only while the player stands still
    const t=performance.now();let r;do r=g.next();while(!r.done&&performance.now()-t<3);
    if(!r.done)return setTimeout(slice,40);stuck.job=null;if(r.value===true){stuck.on=true;stuck.boxes=zb.filter(([x,y])=>WE.base(W,S.m,x,y)!=='X');$('reset').classList.toggle('glow',true);hud()}};
   stuck.lastMove=performance.now();setTimeout(slice,500)}}
 else stuck.job=null;
 $('reset').classList.toggle('glow',stuck.on);if(was&&!stuck.on&&!stuckSeen){stuckSeen=true;try{localStorage.setItem(STUCKSEEN,'1')}catch(e){}}}
// ice area A guide: ~4s arrow on A's entrance tile. Uses performance.now() (not game T) so 「繼續上次」 always gets a fresh window even after sitting on the title.
let guide={m:null,z:null,until:0};function guideArm(){if(S&&S.m==='ice'&&S.cleared.indexOf('ice#A')<0)guide.until=performance.now()+4000}
function guideCheck(){const z=S.zone||null;if(S.m!==guide.m){guide.m=S.m;guide.z=z;guideArm()}
 else if(z!==guide.z){const was=guide.z;guide.z=z;if(z==='ice#A'&&was!=='ice#A')guideArm()}}
function drawGuide(){if(!S||S.m!=='ice'||performance.now()>guide.until)return;const Z=W.maps.ice.zones.find(z=>z.id==='ice#A');if(!Z||typeof guideArrow!=='function')return;
 // path into A: first steps from the entrance toward the exit (never draw on the robot — that looks like a status icon)
 const [ex,ey]=Z.entry,inZ=(x,y)=>x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h,walk=(x,y)=>inZ(x,y)&&!WE.solid(W,S,'ice',x,y);
 const into=(()=>{const q=[[ex,ey]],prev=new Map([[ex+','+ey,null]]);
  for(let i=0;i<q.length;i++){const [x,y]=q[i];if(Z.exit&&x===Z.exit[0]&&y===Z.exit[1])break;
   for(const [dx,dy,d] of [[0,-1,0],[0,1,1],[-1,0,2],[1,0,3]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(prev.has(k)||!walk(nx,ny))continue;prev.set(k,[x,y,d]);q.push([nx,ny])}}
  let cur=Z.exit?Z.exit[0]+','+Z.exit[1]:null;if(!cur||!prev.has(cur)){ // fallback: any open neighbour of the entrance
   for(const [dx,dy,d] of [[0,1,1],[0,-1,0],[1,0,3],[-1,0,2]])if(walk(ex+dx,ey+dy))return{x:ex+dx,y:ey+dy,d};return{x:ex,y:ey,d:1}}
  const steps=[];while(cur&&prev.get(cur)){const [px,py,d]=prev.get(cur);steps.push({x:+cur.split(',')[0],y:+cur.split(',')[1],d});cur=px+','+py}
  steps.reverse();return steps[Math.min(1,steps.length-1)]||{x:ex,y:ey,d:1}})(); // prefer the 2nd tile into A when possible
 const near=Math.abs(S.x-ex)+Math.abs(S.y-ey)<=1,onEnt=S.x===ex&&S.y===ey;
 let tx,ty,dir; // tile to mark + arrow direction (0u 1d 2l 3r)
 if(onEnt||inZ(S.x,S.y)){tx=into.x;ty=into.y;dir=into.d} // on the entrance or inside A → 1–2 tiles ahead into the room
 else{ // outside A: follow the real walking path from the robot to the entrance, mark 1–2 steps ahead
  const q=[[S.x,S.y]],pv=new Map([[S.x+','+S.y,null]]),ok=(x,y)=>(x===ex&&y===ey)||!WE.solid(W,S,'ice',x,y);let hit=false;
  for(let i=0;i<q.length&&i<4000;i++){const [x,y]=q[i];if(x===ex&&y===ey){hit=true;break}
   for(const [dx,dy,d] of [[0,-1,0],[0,1,1],[-1,0,2],[1,0,3]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(pv.has(k)||!ok(nx,ny))continue;pv.set(k,[x,y,d]);q.push([nx,ny])}}
  const st=[];if(hit){let c=ex+','+ey;while(pv.get(c)){const [px,py,d]=pv.get(c);st.push({x:+c.split(',')[0],y:+c.split(',')[1],d});c=px+','+py}st.reverse()}
  const pick=st[Math.min(1,st.length-1)];
  if(pick){tx=pick.x;ty=pick.y;dir=pick.d}else{tx=ex;ty=ey;dir=Math.abs(S.x-ex)>Math.abs(S.y-ey)?(S.x<ex?3:2):(S.y<ey?1:0)}}
 // if the chosen tile is off-camera, clamp to the screen edge and keep pointing that way
 const x0=cam.ox,y0=cam.oy,x1=x0+VW-1,y1=y0+VIEWH-1;
 if(tx<x0||tx>x1||ty<y0||ty>y1){const cx=Math.max(x0,Math.min(x1,tx)),cy=Math.max(y0,Math.min(y1,ty));
  dir=Math.abs(tx-cx)>Math.abs(ty-cy)?(tx>cx?3:2):(ty>cy?1:0);tx=cx;ty=cy}
 const px=Math.round((tx-cam.ox)*16),py=Math.round((ty-cam.oy)*16);
 guideArrow(px,py,dir,(4000-(guide.until-performance.now()))/1000)}
function hud(){checkStuck();guideCheck();const M=W.maps[S.m],Z=WE.zoneAt(W,S.m,S.x,S.y);$('mapname').textContent=M.name;$('zonename').textContent=Z?Z.name:'野外';
 const k=$('keys');k.innerHTML='';const chip=t=>{const c=document.createElement('span');c.className='chip';c.innerHTML=t;k.append(c)};
 if(S.held)chip('💣 炸彈');for(const i of S.inv)if(!KEYMAP[i]||KEYMAP[i]===S.m)chip(ITEMNAME[i]||i);const bolts=S.got.filter(g=>WE.base(W,g.split(':')[0],...g.split(':')[1].split(',').map(Number))==='*').length;if(bolts)chip('🔩 '+bolts);const lamps=S.got.filter(g=>WE.base(W,g.split(':')[0],...g.split(':')[1].split(',').map(Number))==='L').length;if(lamps)chip('🏮 '+lamps);
 const lf=$('remain');if(S.left!=null){lf.style.display='';lf.innerHTML=`剩 <b class="${S.left<=3?'low':''}">${S.left}</b> 步`}else lf.style.display='none';
 const unmet=h=>h.zone?(S.zone===h.zone&&S.cleared.indexOf(h.zone)<0):(h.need&&!WE.hasInv(S,h.need))||(h.cleared&&S.cleared.indexOf(h.cleared)<0)||(h.visit&&S.visited.indexOf(h.visit)<0)||(!h.need&&!h.visit&&!h.cleared),hs=W.hints||[];let h=hs.find(h=>h.m===S.m&&unmet(h))||hs.find(h=>!h.m&&unmet(h));
 // boss hint only in the boss room or once every other zone of the map is cleared; before that repeat the map's last mechanic hint
 if(h&&h.cleared&&/#[A-Z]B$/.test(h.cleared)&&S.zone!==h.cleared&&W.maps[S.m].zones.some(z=>z.id!==h.cleared&&!/#[A-Z]B$/.test(z.id)&&S.cleared.indexOf(z.id)<0)){const i=hs.indexOf(h);let f=null;for(let j=i-1;j>=0;j--){const g=hs[j];if(g.m===S.m&&g.cleared&&!/#[A-Z]B$/.test(g.cleared)&&!g.zone){f=g;break}}h=f}
 $('hint').textContent=h?'▶ '+h.text:'';
 if([[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy])=>WE.cell(W,S,S.m,S.x+dx,S.y+dy)==='R'))$('hint').textContent=WE.hasInv(S,'f')?'▶ 走進符文石，用符文碎片打開它':'🪧 打倒頭目，取得符文碎片';
 const near=(x,y,d)=>Math.abs(S.x-x)+Math.abs(S.y-y)<=(d||1);
 if(S.m==='ice'&&shortcut&&!WE.hasInv(S,'m')&&near(shortcut.door[0],shortcut.door[1],2))$('hint').textContent='🪧 紫門是回程捷徑（從裡面拿紫鑰匙才打得開），先往前走';
 if(S.m==='ice'&&shortcut&&near(shortcut.top[0],shortcut.top[1],1))$('hint').textContent='🪧 回程捷徑：往下直走，回到隧道 1';
 if(S.zone&&S.zoneSteps>40&&S.cleared.indexOf(S.zone)<0)$('hint').textContent='🤔 卡住了嗎？按 ↺ 重來這一區';
 if(stuck.on&&!stuckSeen)$('hint').textContent='箱子卡住了，按 ↺ 重來';if(flashT&&performance.now()<flashT.until)$('hint').textContent=flashT.t;
 const here=WE.base(W,S.m,S.x,S.y);if(WE.isTun(here)&&W.tunnels[WE.tunId(here)].length<2)$('hint').textContent='🚧 隧道 '+WE.tunId(here)+' 通往'+((W.tunnelTo||{})[WE.tunId(here)]||'下一區')+'：即將開放';}
let flashT=null;function flash(t){flashT={t,until:performance.now()+2500};hud();setTimeout(hud,2600)}
// ---------- input ----------
let patPrev=null,patT0=0;
function snapPats(prev){patPrev={};(prev.pats||[]).forEach(p=>patPrev[p.i]=[p.x,p.y]);patT0=T}
function defeatFx(){(S.defeated||[]).forEach(d=>{if(d.m===S.m){fx.push({type:'defeat',x:d.x,y:d.y,t0:T,away:d.ax==='h'?(d.d>0?3:2):3});setTimeout(()=>sfx('key'),500)}});delete S.defeated}
function blastFx(r){if(r.ev.indexOf('defeat')>=0&&S.m==='core')setTimeout(()=>startEnding(),1600); // core boss down -> ending (core map not built yet)
 if(r.ev.indexOf('defeat')>=0)defeatFx();if(r.ev.indexOf('blast')>=0){const b=S.lastBlast||{};if(b.m===S.m)[[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>fx.push({type:'smoke',x:b.x+dx,y:b.y+dy,t0:T}));sfx('crumble');if(r.ev.indexOf('wall')>=0)shake=3;delete S.lastBlast}}
// real-time fuses: every frame advance all bombs (3,2,1 one per second, boom when it hits 0). Paused while title/help/menu/fail anim.
function fuseFrame(dt){if(!S||!S.bombs.length||failAnim||['title','help','menu'].some(id=>$(id).classList.contains('on')))return;
 const prev=S,r=WE.advance(W,S,dt*1000);S=r.state;if(r.result==='tick')return;blastFx(r);v2Fx(r,prev);
 if(r.result==='fail'){failAnim={t0:T,from:prev};sfx('fail');return}hud();persist()}
let inq=[];function act(a,opt){if($('title').classList.contains('on')||$('menu').classList.contains('on')||$('help').classList.contains('on'))return;
 if(anim||failAnim){if(!opt&&!failAnim&&inq.length<3)inq.push(a);return} // input queue: presses during an animation run right after it
 if(WE.DIRS[a]){facing=a;idleT=T}
 const prev=S,r=WE.step(W,S,a,opt);if(r.state!==S)snapPats(prev);
 if(r.result==='noop'){if(a==='act'&&S.held){const [dx,dy]=WE.DIRS[S.f];if(WE.solid(W,S,S.m,S.x+dx,S.y+dy)){flash(WE.cell(W,S,S.m,S.x+dx,S.y+dy)==='%'?'💣 往後退一步再放：炸彈放在裂牆旁邊的地上':'💣 前面不能放，轉向空地再放');sfx('bump')}}return}
 if(r.result==='tired'){sfx('bump');anim={type:'bump',dir:a,t0:T,dur:.6,face:'pant'};return}
 if(r.result==='fall'){sfx('fail');anim={type:'bump',dir:a,t0:T,dur:.8,face:'x'};return}
 const doorsBefore=doorSet();S=r.state;S.zoneSteps=(S.zone&&S.zone===prev.zone&&r.result!=='reset'?(prev.zoneSteps||0)+1:0);
 blastFx(r);v2Fx(r,prev);
 if(r.result==='fail'){failAnim={t0:T,from:prev,sink:r.ev.indexOf('sink')>=0};sfx('fail');return}
 if(r.ev.indexOf('rune')>=0){const [dx,dy]=WE.DIRS[S.f];fx.push({type:'smoke',x:S.x+dx,y:S.y+dy,t0:T});shake=3;sfx('crumble');hud();persist();return}
 if(r.result==='bump'){sfx('bump');anim={type:'bump',dir:a,t0:T,dur:.6,face:'x'};hud();return}
 if(r.result==='reset'){sfx('door');cam.init=true;hud();persist();return}
 if(r.result==='act'){if(r.ev.indexOf('grab')>=0)sfx('key');if(r.ev.indexOf('place')>=0){sfx('push');tutorialAssist()}if(r.ev.indexOf('fire')>=0)sfx(r.ev.indexOf('bosshit')>=0?'crumble':'slide');hud();persist();return}
 const path=r.path||[];anim={type:'move',from:[prev.x,prev.y],path,t0:T,dur:.11*path.length+.03,ice:path.length>1,m:prev.m};
 sfx(r.ev.indexOf('push')>=0?'push':path.length>1?'slide':'step');['key','bolt','crumble'].forEach(e=>{if(r.ev.indexOf(e)>=0)setTimeout(()=>sfx(e),60)});
 if(r.ev.indexOf('key')>=0||r.ev.indexOf('fragment')>=0||r.ev.indexOf('claws')>=0||r.ev.indexOf('glove')>=0||r.ev.indexOf('upgrade')>=0)react={type:'hop',t0:T};
 if(doorSet()!==doorsBefore){shake=3;sfx('door')}
 if(r.result==='tunnel'){music();fade=1;anim=null;cam.init=false;sfx('slide');resize()}
 persist(); // save after every counted move (tunnels, pickups, cleared areas included)
 hud()}
function music(){try{window.Music&&window.Music.play&&window.Music.play(S.m)}catch(e){}}
let musicOn=false;function musicStart(){if(musicOn)return;musicOn=true;music()} // first gesture (autoplay policy); music mute is Music's own (separate from SFX mute)
function musicIcon(){const b=$('musicBtn');if(!b)return;const m=!!(window.Music&&window.Music.isMuted&&window.Music.isMuted());b.textContent='♪';b.style.opacity=m?.35:1;b.style.textDecoration=m?'line-through':'none'}
if($('musicBtn'))$('musicBtn').onclick=e=>{e.stopPropagation();try{if(window.Music){Music.setMuted(!Music.isMuted());if(!Music.isMuted())music()}}catch(err){}musicIcon()};musicIcon();
addEventListener('pointerdown',musicStart,true);addEventListener('keydown',musicStart,true);
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
function startContinue(){S=saved.s;musicOn=true;setTimeout(music,0);tutorialDone=!!saved.tutorialDone;cam.init=false;guide.m=null;guide.z=null;resize();hud();closeTitle();guideArm()} // arm AFTER title closes so the 4s window starts when the player can see the map
function startNew(){newGame();musicOn=true;music();closeTitle()}
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
document.querySelectorAll('button').forEach(b=>{b.tabIndex=-1;b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',()=>{b.blur();try{window.focus()}catch(e){}})});
addEventListener('keyup',e=>{if(e.key===' '&&document.activeElement&&document.activeElement.tagName==='BUTTON'){e.preventDefault();document.activeElement.blur()}},true);
mini.setAttribute('role','button');mini.setAttribute('aria-label','地圖（點一下放大／縮小）');mini.tabIndex=0;
const miniX=document.createElement('button');miniX.id='miniX';miniX.className='panel';miniX.textContent='✕';miniX.setAttribute('aria-label','關閉地圖');document.body.append(miniX);
function miniBig(on){mini.classList.toggle('big',on);miniX.classList.toggle('on',on);mini.setAttribute('aria-expanded',on?'true':'false')}
miniX.addEventListener('pointerup',e=>{e.stopPropagation();e.preventDefault();miniBig(false)});miniX.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault()});
addEventListener('keydown',e=>{if(e.key==='Escape'&&mini.classList.contains('big')){e.preventDefault();e.stopImmediatePropagation();miniBig(false)}},true);
mini.style.cursor='pointer';mini.addEventListener('pointerup',e=>{e.stopPropagation();e.preventDefault();miniBig(!mini.classList.contains('big'))});mini.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault()});
addEventListener('keydown',e=>{if(KEYS[e.key]){e.preventDefault();press(KEYS[e.key])}else if(e.key===' '||e.key==='Enter'||e.key==='x'||e.key==='X'){e.preventDefault();act('act')}else if(e.key==='r'||e.key==='R'){e.preventDefault();act('reset')}});
function press(d){const b=$(d);b.classList.add('on');setTimeout(()=>b.classList.remove('on'),140);act(d)}
['up','down','left','right'].forEach(d=>$(d).addEventListener('pointerdown',e=>{e.preventDefault();press(d)}));
$('act').addEventListener('pointerdown',e=>{e.preventDefault();act('act')});$('reset').onclick=()=>act('reset');
let sx=null,sy=null;cv.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY});
addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24){return}act(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'))});
$('menuBtn').onclick=()=>$('menu').classList.add('on');$('mClose').onclick=()=>$('menu').classList.remove('on');$('mNew').onclick=()=>{newGame();$('menu').classList.remove('on')};
$('mute').onclick=()=>{save.mute=!save.mute;try{const g=JSON.parse(localStorage.getItem('robotMaze.v1'))||{};g.mute=save.mute;localStorage.setItem('robotMaze.v1',JSON.stringify(g))}catch(e){}$('mute').textContent=save.mute?'🔇':'🔊';if(!save.mute){audioInit();sfx('key')}};$('mute').textContent=save.mute?'🔇':'🔊';
// ---------- extra pixel sprites for big-map tiles (same palette) ----------
const DIG={0:['111','101','101','101','111'],1:['010','110','010','010','111'],2:['111','001','111','100','111'],3:['111','001','111','001','111'],4:['101','101','111','001','001'],5:['111','100','111','001','111'],6:['111','100','111','101','111'],7:['111','001','010','010','010'],8:['111','101','111','101','111'],9:['111','101','111','001','111']};
function digit(n,x,y,c){(DIG[n]||[]).forEach((r,j)=>r.split('').forEach((v,i)=>{if(v==='1')R(x+i,y+j,1,1,c)}))}
function cracked(px,py,x,y){wall(px,py,x,y);const C=TH.outline;R(px+4,py+3,1,3,C);R(px+5,py+6,2,1,C);R(px+7,py+7,1,3,C);R(px+8,py+10,2,1,C);R(px+10,py+4,1,2,C);R(px+11,py+6,1,1,C)}
function baseFloor(px,py,x,y){if(V2())v2Floor(px,py,x,y);else(FLOORS[TH.style]||FLOORS.grass)(px,py,x,y)} // v2 biomes (desert, forest...) have no FLOORS entry
function rubble(px,py,x,y){baseFloor(px,py,x,y);const W2=TH.wall;[[3,10],[9,4],[11,11],[6,6]].forEach(([a,b],i)=>{R(px+a,py+b,3,2,TH.outline);R(px+a,py+b,2,1,W2[i%2])})}
function bombGrass(px,py,x,y){baseFloor(px,py,x,y);const sw=Math.round(Math.sin(T*2+x)*.6);R(px+7,py+9,2,5,E32.green3);R(px+4+sw,py+10,3,1,E32.green1);R(px+9-sw,py+11,3,1,E32.green1);
 R(px+5,py+3,6,6,TH.outline);R(px+6,py+4,4,4,E32.grey4);R(px+6,py+4,1,1,E32.grey2);R(px+8,py+1,1,2,E32.brown1);if(Math.floor(T*3)%2)R(px+9,py+1,1,1,E32.amber)}
function rune(px,py,x,y){baseFloor(px,py,x,y);R(px+4,py+2,8,13,TH.outline);R(px+5,py+3,6,11,E32.grey2);R(px+5,py+3,6,1,E32.grey1);const g=.5+.5*Math.sin(T*2);o.globalAlpha=g;R(px+7,py+5,2,1,E32.cyan);R(px+7,py+7,1,3,E32.cyan);R(px+8,py+9,2,1,E32.cyan);o.globalAlpha=1}
function tunnel(px,py,x,y,d){R(px,py,16,16,TH.outline);R(px+2,py+3,12,13,E32.ink);R(px+3,py+2,10,2,E32.ink);R(px+1,py+2,2,14,E32.grey3);R(px+13,py+2,2,14,E32.grey3);R(px+3,py+1,10,2,E32.grey3);{const t=String(d);if(t.length>1){digit(t[0],px+4,py+6,E32.amber);digit(t[1],px+9,py+6,E32.amber)}else digit(t,px+7,py+6,E32.amber)}}
function hardIce(px,py,x,y){R(px,py,16,16,E32.blue1);R(px+1,py+1,14,14,E32.navy);for(let i=0;i<4;i++){R(px+7-i,py+2+i,1,1,E32.blue2);R(px+8+i,py+2+i,1,1,E32.blue2);R(px+7-i,py+13-i,1,1,E32.blue2);R(px+8+i,py+13-i,1,1,E32.blue2)}
 if((Math.floor(T*2+x*3+y))%6===0){R(px+1,py+1,2,1,E32.white);R(px+1,py+1,1,2,E32.white)}}
function claws(px,py){const b=Math.round(Math.sin(T*3));py+=b;R(px+3,py+5,10,7,TH.outline);R(px+4,py+6,8,5,E32.blue2);[4,7,10].forEach(i=>{R(px+i,py+11,2,3,TH.outline);R(px+i,py+11,1,2,E32.grey1)})}
function fragment(px,py){const b=Math.round(Math.sin(T*3)),g=.4+.3*Math.sin(T*4);o.globalAlpha=g;R(px+3,py+3+b,10,10,E32.cyan);o.globalAlpha=1; // small glowing rune stone shard
 R(px+5,py+4+b,6,9,TH.outline);R(px+6,py+5+b,4,7,E32.grey2);R(px+6,py+5+b,4,1,E32.grey1);R(px+7,py+7+b,2,1,E32.cyan);R(px+7,py+8+b,1,2,E32.cyan)}
function upgrade(px,py){battery(px,py);R(px+11,py+2,3,1,E32.green1);R(px+12,py+1,1,3,E32.green1)}
function bombSprite(px,py,b){const last=b.t<=1,ph=((b.ms||0)%1000)/1000,flash=last&&Math.floor(T*(b.t===0?16:10))%2;
 R(px+4,py+5,9,9,TH.outline);R(px+5,py+6,7,7,flash?E32.red3:E32.grey4);R(px+6,py+7,2,2,flash?E32.pink:E32.grey2);const burn=Math.min(1,(b.ms||0)/WE.FUSE_MS),fl=Math.max(0,Math.round(3*(1-burn))),fy=py+6-fl; // fuse burns down; spark gone at 0
 R(px+9,fy,2,fl,E32.brown1);
 const sp=Math.floor(T*(last?36:12))%2;if(burn<1){R(px+10+sp,fy-2,1,1,E32.amber);R(px+11,fy-1-sp,1,1,E32.yellow);if(last){R(px+12-sp,fy-3+sp,1,1,E32.amber);R(px+9+sp,fy-3+sp,1,1,E32.yellow)}}
 const pop=ph<.18?2:ph<.3?1:0,dy=py-7-pop; // number pops each second
 R(px+5-pop,dy-1-pop,7+pop*2,8+pop*2,TH.outline);R(px+6-pop,dy-pop,5+pop*2,6+pop*2,last?E32.red3:E32.sand);digit(b.t,px+7,dy+1,last?E32.white:E32.plum)}
// last second: red cross on the ground = blast tiles
function blastWarn(b){if(b.t>1)return;const a=.25+.2*Math.sin(T*18);o.globalAlpha=a;[[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{const px=Math.round((b.x+dx-cam.ox)*16),py=Math.round((b.y+dy-cam.oy)*16);R(px+1,py+1,14,14,E32.red3)});o.globalAlpha=1;
 [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{const px=Math.round((b.x+dx-cam.ox)*16),py=Math.round((b.y+dy-cam.oy)*16);R(px+1,py+1,14,1,E32.red3);R(px+1,py+14,14,1,E32.red3);R(px+1,py+1,1,14,E32.red3);R(px+14,py+1,1,14,E32.red3)})}
// snowball patrols: hop between cells over 0.18s, face where they walk, '!' when the robot is in their line nearby
// wooden sign next to every rune stone (drawn on the wall tile to its left): '需要之後的道具'
function runeSigns(){const M=W.maps[S.m];for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++){if(L.grid[y][x]!=='R')continue;const px=Math.round((x-1-cam.ox)*16),py=Math.round((y-cam.oy)*16);
  R(px+7,py+9,2,6,E32.brown2);R(px+2,py+2,12,8,E32.plum);R(px+3,py+3,10,6,E32.brown1);R(px+3,py+3,10,1,E32.tan);[[4,5,6],[4,7,4],[9,7,3]].forEach(([a,b,w])=>R(px+a,py+b,w,1,E32.brown2))}}
function drawPats(){for(const p of S.pats||[]){if(p.m!==S.m)continue;const P0=W.pats0[p.i];let x=p.x,y=p.y;const q=Math.min(1,(T-patT0)/.18),pp=patPrev&&patPrev[p.i];
  if(pp&&q<1){x=pp[0]+(p.x-pp[0])*q;y=pp[1]+(p.y-pp[1])*q}
  const dir=P0.ax==='h'?(p.d>0?3:2):(p.d>0?1:0),frame=Math.floor(T*4+p.i)%2;
  const spot=S.zone===P0.zone&&((P0.ax==='h'&&S.y===p.y&&Math.abs(S.x-p.x)<=3)||(P0.ax==='v'&&S.x===p.x&&Math.abs(S.y-p.y)<=3));
  snowball(Math.round((x-cam.ox)*16),Math.round((y-cam.oy)*16)-(q<1?Math.round(Math.sin(q*Math.PI)*3):0),frame,dir,spot&&!failAnim)}}
function defeat(f){const t=T-f.t0;if(t>=1.6)return false;snowballDefeat(Math.round((f.x-cam.ox)*16),Math.round((f.y-cam.oy)*16),t,f.away);return true}
function smoke(f){const p=(T-f.t0)/.5;if(p>=1)return false;const fr=Math.min(3,Math.floor(p*4)),px=(f.x-cam.ox)*16,py=(f.y-cam.oy)*16;
 const sizes=[[6,6],[10,9],[12,11],[8,6]][fr],cols=[E32.yellow,E32.orange,E32.grey2,E32.grey3];o.globalAlpha=fr===3?.6:1;
 R(px+8-sizes[0]/2,py+8-sizes[1]/2,sizes[0],sizes[1],cols[fr]);R(px+8-sizes[0]/2+2,py+8-sizes[1]/2-1,sizes[0]-4,sizes[1]+2,cols[fr]);if(fr<2)R(px+6,py+6,4,4,E32.white);o.globalAlpha=1;return true}
// desert/forest movers: dunes, beetles (stun stars), bosses (2x2, flash on hit, HP pips). Slide 0.12s from the previous cell.
let movPrev={},movT0=0;function snapMovers(prev){movPrev={};['dunes','bugs','bosses','clouds'].forEach(k=>(prev[k]||[]).forEach(o=>movPrev[k+o.i]=[o.x,o.y]));movT0=T}
function mpos(k,o){const q=Math.min(1,(T-movT0)/.12),p=movPrev[k+o.i];let x=o.x,y=o.y;if(p&&q<1){x=p[0]+(o.x-p[0])*q;y=p[1]+(o.y-p[1])*q}return[Math.round((x-cam.ox)*16),Math.round((y-cam.oy)*16)]}
let bossHitT={};
function drawMovers(){if(!V2())return;const fr=Math.floor(T*3)%2;
 if(MIN()&&typeof minecart==='function')(S.boxes||[]).forEach(k=>{if(!k.startsWith(S.m+':'))return;const [x,y]=k.split(':')[1].split(',').map(Number),d=S.cart&&S.cart[k]!=null?S.cart[k]:1;
  minecart(Math.round((x-cam.ox)*16),Math.round((y-cam.oy)*16),d,fr)});
 (S.clouds||[]).forEach(o=>{if(o.m!==S.m)return;const [px,py]=mpos('clouds',o);if(typeof cloudPlatform==='function')cloudPlatform(px,py,fr)});
 (S.dunes||[]).forEach(o=>{if(o.m!==S.m)return;const [px,py]=mpos('dunes',o);dune(px,py,fr,L.grid[o.y]&&L.grid[o.y][o.x]==='X')});
 (S.bugs||[]).forEach(o=>{if(o.m!==S.m)return;const [px,py]=mpos('bugs',o);
  if(o.glitch&&typeof glitchBot==='function')glitchBot(px,py,fr,!!o.spotted,T);
  else if(o.spark&&typeof sparkMon==='function')sparkMon(px,py,fr,!!o.spotted);
  else if(o.ghost&&typeof armorGhost==='function')armorGhost(px,py,fr,o.d===2?2:3,!!o.spotted);
  else beetle(px,py,fr,o.fr||0,T)});
 (S.rocks||[]).forEach(r=>{if(r.m!==S.m)return;const px=Math.round((r.x-cam.ox)*16),py=Math.round((r.y-cam.oy)*16);
  R(px+3,py+4,10,9,E32.ink);R(px+4,py+5,8,7,'#9a7a6c');R(px+5,py+6,3,3,'#b08e7e');R(px+9,py+8,2,2,E32.orange)});
 (S.bosses||[]).forEach(o=>{if(o.m!==S.m||o.hp<=0)return;const [px,py]=mpos('bosses',o),hit=T-(bossHitT[o.i]||-9)<.25,hurt=o.max-o.hp;
  if(o.kind==='worm')sandwormKing(px-8,py-16,fr,hit,o.hp,o.max);
  else if(o.kind==='tree')elderTree(px-8,py-16,fr,hit,o.hp,o.max);
  else if(o.kind==='frog'&&typeof mudFrogKing==='function')mudFrogKing(px,py,fr,o.d===2?2:3,hurt,T);
  else if(o.kind==='mole'&&typeof moleKing==='function')moleKing(px,py,fr,o.d===2?2:3,hurt,T);
  else if(o.kind==='crab'&&typeof crabKing==='function')crabKing(px,py,fr,o.d===2?2:3,hurt,T,hit);
  else if(o.kind==='knight'&&typeof armorKnightKing==='function')armorKnightKing(px,py,fr,o.d===2?2:3,hurt,!!o.spotted,hit);
  else if(o.kind==='bird'&&typeof stormBird==='function')stormBird(px,py,fr,o.d===2?2:3,hurt,T,hit);
  else if(o.kind==='golem'&&typeof lavaGiant==='function'){
   if(typeof lavaPool==='function'){lavaPool(px-8,py+8,fr);lavaPool(px+8,py+8,fr);lavaPool(px,py+16,fr);lavaPool(px,py,fr)}
   lavaGiant(px,py,hurt,T);
   if(S.bossCp&&S.bossCp.zone===o.zone&&typeof bossCheckpointFlame==='function')bossCheckpointFlame(px+20,py+4,true,T)}
  else if(o.kind==='phantom'&&typeof mirrorKing==='function')mirrorKing(px,py,fr,o.d===2?2:3,hurt,T,hit);
  else if(o.kind==='spark'&&typeof sparkKing==='function')sparkKing(px,py,fr,o.d===2?2:3,hurt,!!o.spotted,!!S.gen,hit);
  else if(o.kind==='guard'&&typeof clockGuard==='function')clockGuard(px,py,hurt,T,hit);
  else if(o.kind==='glitch'&&typeof glitchKing==='function')glitchKing(px,py,fr,o.d===2?2:3,hurt,!!o.spotted,hit);
  else if(o.kind==='core'&&typeof glitchCore==='function'){const phase=o.phase!=null?o.phase:(o.max-o.hp);glitchCore(px-16,py-16,phase,hit,T);
   if(S.bossCp&&S.bossCp.zone===o.zone&&typeof bossCheckpointFlame==='function')bossCheckpointFlame(px+28,py-8,true,T)}});
}

const V2FX={
 fire:f=>{const p=(T-f.t0)/.35;if(p>=1)return false;const [dx,dy]=WE.DIRS[f.f];const n=Math.abs(f.x1-f.x0)+Math.abs(f.y1-f.y0);
  for(let i=1;i<=n;i++){const px=Math.round((f.x0+dx*i-cam.ox)*16),py=Math.round((f.y0+dy*i-cam.oy)*16);firePuff(px,py,Math.min(2,Math.floor(p*3+i*.15)))}return true},
 noeffect:f=>{const p=(T-f.t0)/.45;if(p>=1)return false;const fr=Math.min(2,Math.floor(p*3)),[dx,dy]=WE.DIRS[S.f],px=Math.round((f.x+dx-cam.ox)*16),py=Math.round((f.y+dy-cam.oy)*16);
  if(typeof noEffectPuff==='function')noEffectPuff(px,py,fr);return true},
 boxsink:f=>{const p=(T-f.t0)/.6;if(p>=1)return false;boxSink(Math.round((f.x-cam.ox)*16),Math.round((f.y-cam.oy)*16),p);return true},
 splash:f=>{const p=(T-f.t0)/.5;if(p>=1)return false;sandSplash(Math.round((f.x-cam.ox)*16),Math.round((f.y-cam.oy)*16),p);return true}};
function v2Fx(r,prev){if(!V2()&&!(prev&&W.maps[prev.m].rules==='v2'))return;snapMovers(prev);const ev=r.ev||[];
 if(ev.indexOf('noeffect')>=0&&S.lastFire){fx.push({type:'noeffect',x:S.lastFire.x0,y:S.lastFire.y0,t0:T});delete S.lastFire}
 if(ev.indexOf('fire')>=0&&S.lastFire){fx.push(Object.assign({type:'fire',t0:T},S.lastFire));delete S.lastFire}
 (S.sunk||[]).forEach(k=>{if(k.m===S.m)fx.push({type:k.box?'boxsink':'splash',x:k.x,y:k.y,t0:T});setTimeout(()=>sfx('crumble'),80)});delete S.sunk;
 (S.scattered||[]).concat(S.squashed||[]).forEach(k=>{if(k.m===S.m)fx.push({type:'splash',x:k.x,y:k.y,t0:T})});delete S.scattered;delete S.squashed;
 if(ev.indexOf('bosshit')>=0)(S.bosses||[]).forEach(o=>{if(o.m===S.m&&o.hitAt===S.steps)bossHitT[o.i]=T});
 if(ev.indexOf('bossdown')>=0){shake=4;setTimeout(()=>sfx('door'),200)}
 if(ev.indexOf('lamp')>=0)react={type:'hop',t0:T}
 if(ev.indexOf('ending')>=0||r.result==='ending')setTimeout(()=>startEnding(),800)}
let shortcut=null;(function(){const M=W.maps.ice;if(!M)return;const t=(W.tunnels['1']||[]).find(p=>p.m==='ice');if(!t)return;
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(WE.base(W,'ice',t.x+dx,t.y+dy)==='M'){const d=[t.x+dx,t.y+dy];let y=d[1]-1;while(y>0&&WE.base(W,'ice',d[0],y-1)!=='#')y--;
  shortcut={door:d,top:[d[0],y+1],sign:[d[0]+1,y+1]};if(WE.base(W,'ice',d[0]+1,y+1)!=='#')shortcut.sign=[d[0]-1,y+1];
  shortcut.exitSign=[[d[0]+1,d[1]],[d[0]-1,d[1]],[d[0]+1,d[1]+1],[d[0]-1,d[1]+1]].find(([x,y])=>WE.base(W,'ice',x,y)==='#')||null}})(); // second sign on the wall beside the purple door at the tunnel-1 exit
function shortcutMarks(){if(S.m!=='ice'||!shortcut)return;const P=([x,y])=>[Math.round((x-cam.ox)*16),Math.round((y-cam.oy)*16)];
 if(typeof shortcutSign==='function'){[shortcut.sign,shortcut.exitSign].forEach(c=>{if(!c)return;const [px,py]=P(c);shortcutSign(px,py)})}
 if(typeof purpleDoorShortcutMark==='function'){const [px,py]=P(shortcut.door);purpleDoorShortcutMark(px,py,T)}}
// ---------- draw ----------
function deep(x,y){const g=L.grid;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const r=g[y+dy];const c=r&&r[x+dx];if(c!==undefined&&c!=='#')return false}return true}
function bush(px,py,x,y){const h=((x*73856093)^(y*19349663))>>>0;R(px,py,16,16,E32.green2);
 if(h%3===0){R(px+2,py+3,1,1,E32.green1);R(px+11,py+10,1,1,E32.green1)}
 if(h%4!==0){const ox=(h>>3)%5,oy=(h>>6)%4;R(px+ox+2,py+oy+3,10,8,E32.green3);R(px+ox+3,py+oy+2,8,10,E32.green3);R(px+ox+3,py+oy+3,8,7,E32.green2);R(px+ox+4,py+oy+3,4,3,E32.green1);R(px+ox+3,py+oy+10,8,1,E32.green3)}
 if(h%7===0){R(px+5,py+6,1,1,E32.yellow);R(px+11,py+4,1,1,E32.pink)}}
const ICY=()=>TH===WORLDS.snow;
// lazy-load per-scene art (swamp/mine/volcano/core). ice/desert/forest stay eager in world.html.
const SCENE_ART={swamp:['swamp-art.js'],mine:['mine-art.js'],volcano:['volcano-art.js','core-art.js'],sea:['sea-art.js'],castle:['castle-art.js'],sky:['sky-art.js'],mirror:['mirror-art.js'],power:['power-art.js'],clock:['clock-art.js'],factory:['factory-art.js'],core:['core-art.js','factory-art.js']};
const vsrc=f=>{const v=(window.ASSET_V||{})[f];return v?f+'?v='+v:f}; // dist build stamps file hashes so a new push never mixes with cached old JS
const _artLoaded={};async function ensureSceneArt(m){if(m==='core'&&!_artLoaded._end){_artLoaded._end=1;setTimeout(preloadEnding,1500)}const list=SCENE_ART[m];if(!list)return;for(const f of list){if(_artLoaded[f]||document.querySelector('script[src="'+vsrc(f)+'"]'))continue;_artLoaded[f]=1;await new Promise((ok,no)=>{const e=document.createElement('script');e.src=vsrc(f);e.onload=ok;e.onerror=()=>no(new Error(f));document.head.appendChild(e)})}}
const DES=()=>W.maps[S.m].theme==='desert',FOR=()=>W.maps[S.m].theme==='forest',SWA=()=>W.maps[S.m].theme==='swamp',MIN=()=>W.maps[S.m].theme==='mine',VOL=()=>W.maps[S.m].theme==='volcano',SEA=()=>W.maps[S.m].theme==='sea',CAS=()=>W.maps[S.m].theme==='castle',SKY=()=>W.maps[S.m].theme==='sky',MIR=()=>W.maps[S.m].theme==='mirror',POW=()=>W.maps[S.m].theme==='power',CLK=()=>W.maps[S.m].theme==='clock',FAC=()=>W.maps[S.m].theme==='factory',COR=()=>W.maps[S.m].theme==='core',V2=()=>W.maps[S.m].rules==='v2';
function v2Floor(px,py,x,y){if(DES())desertSand(px,py,x,y);else if(FOR())forestGround(px,py,x,y,T);else if(SWA()&&typeof swampMud==='function')swampMud(px,py,x,y);else if(MIN()&&typeof mineFloor==='function')mineFloor(px,py,x,y);else if(VOL()&&typeof volcanoGround==='function')volcanoGround(px,py,x,y);else if(SEA()&&typeof seaSand==='function')seaSand(px,py,x,y);else if(CAS()&&typeof castleFloor==='function')castleFloor(px,py,x,y);else if(SKY()&&typeof skyGround==='function')skyGround(px,py,x,y);else if(MIR()&&typeof mirrorFloor==='function')mirrorFloor(px,py,x,y);else if(POW()&&typeof powerFloor==='function')powerFloor(px,py,x,y);else if(CLK()&&typeof clockFloor==='function')clockFloor(px,py,x,y);else if(FAC()&&typeof factoryFloor==='function')factoryFloor(px,py,x,y);else if(COR()&&typeof coreFloor==='function')coreFloor(px,py,x,y);else R(px,py,16,16,E32.grey3)}
function v2Wall(px,py,x,y){if(FOR()){if(typeof forestCanopy==='function'){forestCanopy(px,py,x,y);return}}
 if(SWA()){if(typeof swampReeds==='function'){swampReeds(px,py,x,y);return}R(px,py,16,16,E32.green3);return}
 if(MIN()){if(typeof mineRock==='function'){mineRock(px,py,x,y);return}R(px,py,16,16,E32.grey4);return}
 if(VOL()){if(typeof volcanoRock==='function'){volcanoRock(px,py,x,y);return}R(px,py,16,16,E32.brown2);return} // never fall through to desert cactus/bone
 if(SEA()){if(typeof seaCoral==='function'){seaCoral(px,py,x,y);return}R(px,py,16,16,E32.blue1);return}
 if(CAS()){if(typeof castleBrick==='function'){castleBrick(px,py,x,y);return}R(px,py,16,16,E32.navy);return}
 if(SKY()){if(typeof skyUnderside==='function'){skyUnderside(px,py,x,y);return}R(px,py,16,16,E32.blue2);return}
 if(MIR()){if(typeof mirrorWall==='function'){mirrorWall(px,py,x,y);return}R(px,py,16,16,E32.purple);return}
 if(POW()){if(typeof powerWall==='function'){powerWall(px,py,x,y);return}R(px,py,16,16,E32.grey3);return}
 if(CLK()){if(typeof clockWall==='function'){clockWall(px,py,x,y);return}R(px,py,16,16,E32.brown2);return}
 if(FAC()){if(typeof factoryWall==='function'){factoryWall(px,py,x,y);return}R(px,py,16,16,E32.grey3);return}
 if(COR()){if(typeof coreWall==='function'){coreWall(px,py,x,y);return}R(px,py,16,16,E32.ink);return}
 const up=(L.grid[y-1]||[])[x];
 if(deep(x,y)){const h=((x*73856093)^(y*19349663))>>>0;if(h%23===0)desertCactus(px,py,x,y);else if(h%37===0)desertBone(px,py,x,y);else desertSand(px,py,x,y);return}
 desertRock(px,py,x,y,up===undefined||up!=='#'||deep(x,y-1))}
function v2Tile(c,px,py,x,y){ // desert-art.js / forest-art.js tiles; anything else falls through to the shared drawing below
 if(c===undefined||c==='#'){v2Wall(px,py,x,y);return true}
 if(c==='%'){v2Wall(px,py,x,y);const C=FOR()?E32.ink:E32.brown2;R(px+4,py+3,1,3,C);R(px+5,py+6,2,1,C);R(px+7,py+7,1,3,C);R(px+8,py+10,2,1,C);R(px+10,py+4,1,2,C);R(px+11,py+6,1,1,C);return true}
 if(c==='q'){quicksand(px,py,Math.floor(T*2)%2);return true}
 if(c==='='){sandBridge(px,py);return true}
 if(c==='w'){if(SEA()&&typeof seaweed==='function')seaweed(px,py,x,y,Math.floor(T*2)%2);else vine(px,py,x,y);return true}
 if(c==='a'){vineBurnt(px,py,S.vt[S.m+':'+x+','+y]||0,T);return true}
 if(c==='K'){v2Floor(px,py,x,y);iceNormal(px,py,x,y);R(px,py,16,1,E32.blue2);R(px,py+15,16,1,E32.blue2);R(px,py,1,16,E32.blue2);R(px+15,py,1,16,E32.blue2);return true}
 if(c==='T'){v2Floor(px,py,x,y);return true} // tree drawn by drawMovers (2x2 sprite)
 if(WE.isTun(c)||c==='0'){const tid=WE.tunAt?WE.tunAt(W,S.m,x,y):(WE.isTun(c)?WE.tunId(c):null);const pair=tid&&W.tunnels[tid];v2Floor(px,py,x,y);if(pair&&pair.length<2)boardedTunnel(px,py);else tunnel(px,py,x,y,tid||c);return true}
 if(c==='G'){v2Floor(px,py,x,y);if(WE.solid(W,S,S.m,x,y))bars(px,py,0);return true}
 if(c==='F'&&st.got.indexOf(x+','+y)<0){v2Floor(px,py,x,y);const b=Math.round(Math.sin(T*3));firePuff(px,py+b-1,Math.floor(T*4)%3);return true}
  if(c==='~'){if(typeof swampWater==='function')swampWater(px,py,x,y,Math.floor(T*2)%2);else R(px,py,16,16,E32.blue2);return true}
 if(c==='p'||c==='l'){if(typeof lilyPad==='function')lilyPad(px,py,x,y,Math.floor(T*2)%2,c==='l',0);else v2Floor(px,py,x,y);return true}
 if(c==='_' ){if(typeof cooledLava==='function')cooledLava(px,py,x,y);else v2Floor(px,py,x,y);return true}
 if(c==='h'){if(typeof lavaPool==='function')lavaPool(px,py,Math.floor(T*3)%2);else R(px,py,16,16,E32.red2);return true}
 if('}{)('.indexOf(c)>=0){const d={'}':3,'{':2,')':1,'(':0}[c];if(typeof lavaFlow==='function')lavaFlow(px,py,Math.floor(T*3)%2,d);else R(px,py,16,16,E32.orange);return true}
 if(WE.isTrk&&WE.isTrk(c)){if(typeof mineTrack!=='function'){v2Floor(px,py,x,y);return true}const k=trackShape(c,x,y);
  if(k.alt){mineFloor(px,py,x,y);o.globalAlpha=.12;mineTrack(px,py,x,y,k.alt,0,true);o.globalAlpha=1;mineTrack(px,py,x,y,k.kind,0,true);// junction: bright = where the cart goes now, faint = after 動作
   const ex=k.kind.replace(k.stem,''),b=Math.floor(T*3)%2,A=E32.yellow,O=E32.ink; // amber arrow on the exit edge + lever knob in the middle
   if(ex==='n'){R(px+5,py+3+b,6,1,O);R(px+6,py+2+b,4,1,A);R(px+7,py+1+b,2,1,A)}else if(ex==='s'){R(px+5,py+12-b,6,1,O);R(px+6,py+13-b,4,1,A);R(px+7,py+14-b,2,1,A)}
   else if(ex==='e'){R(px+12-b,py+5,1,6,O);R(px+13-b,py+6,1,4,A);R(px+14-b,py+7,1,2,A)}else{R(px+3+b,py+5,1,6,O);R(px+2+b,py+6,1,4,A);R(px+1+b,py+7,1,2,A)}
   R(px+6,py+6,4,4,O);R(px+7,py+7,2,2,E32.amber)}else mineTrack(px,py,x,y,k.kind,0);return true}
 if(c===':'||c==='¹'||c==='²'||c==='○'){const st={':':0,'¹':1,'²':2,'○':3}[c];if(typeof crumbleFloor==='function')crumbleFloor(px,py,x,y,st);else v2Floor(px,py,x,y);return true}
 if(c in (WE.CUR||{})){const d=WE.CUR[c];if((FAC()||COR())&&typeof conveyor==='function')conveyor(px,py,d,Math.floor(T*4)%4);else if(typeof seaCurrent==='function')seaCurrent(px,py,x,y,d,Math.floor(T*3)%2);else{v2Floor(px,py,x,y);R(px+6,py+6,4,4,E32.blue2)}return true}
 if(c==='i'){v2Floor(px,py,x,y);if(typeof airBubble==='function')airBubble(px,py,T);else{R(px+4,py+4,8,8,E32.cyan)}return true}
 if(c==='r'){v2Floor(px,py,x,y);if(typeof lever==='function')lever(px,py,!!(S.lvz&&S.zone&&S.lvz[S.zone]));else R(px+6,py+4,4,8,E32.grey2);return true}
 if(c==='t'||c==='u'){const up=typeof WE.spikeUp==='function'?WE.spikeUp(W,S,S.m,x,y):c==='t';if(typeof spikeTrap==='function')spikeTrap(px,py,x,y,up);else v2Floor(px,py,x,y);return true}
 if(c==='d'){const open=typeof WE.trapOpen==='function'?WE.trapOpen(W,S,S.m,x,y):false;if(typeof trapdoor==='function')trapdoor(px,py,x,y,open);else v2Floor(px,py,x,y);return true}
 if(c===','&&SKY()){if(typeof skyBg==='function')skyBg(px,py,x,y);else R(px,py,16,16,E32.blue1);return true}
 if(c in (WE.WND||{})){const d=WE.WND[c];if(typeof skyWind==='function')skyWind(px,py,x,y,d,T);else{if(typeof skyBg==='function')skyBg(px,py,x,y);R(px+4,py+7,8,2,E32.white)}return true}
 if(c==='b'){v2Floor(px,py,x,y);const sw=Math.round(Math.sin(T*2+x)*.6);R(px+7,py+9,2,5,E32.green3);R(px+4+sw,py+10,3,1,E32.green1);R(px+9-sw,py+11,3,1,E32.green1);R(px+6,py+6,4,4,E32.green2);R(px+7,py+7,2,2,E32.yellow);return true} // bomb grass on biome floor (not grass FLOORS)
 if(c==='V'||c==='Ω'){v2Floor(px,py,x,y);return true} // golem/core drawn in drawMovers
 if(c==='╱'||c==='╲'){v2Floor(px,py,x,y);if(typeof mirror==='function')mirror(px,py,c==='╱'?'/':'\\',T);else R(px+6,py+2,4,12,E32.cyan);return true}
 if(c==='☼'){v2Floor(px,py,x,y);R(px+4,py+4,8,8,E32.yellow);R(px+6,py+6,4,4,E32.white);return true} // light source
 if(c==='◎'){v2Floor(px,py,x,y);const hit=!!(S.beamLit&&S.beamLit[S.m+':'+x+','+y]);if(typeof lightTarget==='function')lightTarget(px,py,hit);else R(px+4,py+4,8,8,hit?E32.yellow:E32.grey3);return true}
 if(c==='▤'){if(typeof lightDoor==='function')lightDoor(px,py,!!S.lit,T);else{v2Floor(px,py,x,y);if(!S.lit)bars(px,py,0)}return true}
 if(c==='⊕'||c==='⊛'){v2Floor(px,py,x,y);if(typeof generator==='function')generator(px,py,c==='⊛',T);else R(px+3,py+3,10,10,c==='⊛'?E32.amber:E32.grey3);return true}
 if(c==='═'){if(typeof wire==='function')wire(px,py,x,y,'h',!!S.pw,T);else{v2Floor(px,py,x,y);R(px,py+7,16,2,E32.amber)}return true}
 if(c==='┊'){if(typeof wireGap==='function')wireGap(px,py,x,y,WE.boxAt(S,S.m,x,y)>=0,T);else{v2Floor(px,py,x,y);R(px+7,py,2,5,E32.grey4);R(px+7,py+11,2,5,E32.grey4)}return true}
 if(c==='▣'){if(typeof powerDoor==='function')powerDoor(px,py,!!S.pw,T);else{v2Floor(px,py,x,y);if(!S.pw)bars(px,py,0)}return true}
 if(c==='n'||c==='s'){v2Floor(px,py,x,y);const phase=S.zt||0;if(typeof pendulum==='function')pendulum(px,py,c==='n'?(phase%2?2:0):(phase%2?0:2));else R(px+6,py+2,4,12,E32.grey2);return true}
 if(c==='¤'||c==='¢'){const open=!WE.gateShut(S,c);if(typeof gearGate==='function')gearGate(px,py,open,S.zt||0,T);else{v2Floor(px,py,x,y);if(!open)bars(px,py,0)}return true}
 if(c==='£'){v2Floor(px,py,x,y);return true} // guard drawn in drawMovers
 if(c==='L'){v2Floor(px,py,x,y);const lit=st.got.indexOf(x+','+y)>=0,b=lit?0:Math.round(Math.sin(T*3));
  R(px+5,py+3+b,6,10,TH.outline);R(px+6,py+4+b,4,8,lit?E32.yellow:E32.amber);R(px+4,py+2+b,8,2,TH.outline);R(px+4,py+13+b,8,2,TH.outline);if(!lit&&Math.floor(T*3)%2)R(px+7,py+6+b,2,3,E32.white);return true}
 return false}
// track glyph -> drawn shape. '-' '|' straight; '/' '\\' corners (pick the pair of sides that joins track/open tiles);
// junction j (turns like '/') / ǰ (like '\\'): stem = side the cart comes from (straight run that starts at a cart), shows current + faint other branch
const _trk={};function trackShape(c,x,y){const id=S.m+':'+x+','+y+c;if(_trk[id])return _trk[id];const at=(dx,dy)=>WE.cell(W,S,S.m,x+dx,y+dy),SD={n:[0,-1],s:[0,1],w:[-1,0],e:[1,0]};
 const sc=d=>{const t=at(...SD[d]);return WE.isTrk(t)?2:t==='#'||t===undefined?0:1};let r;
 if(c==='-')r={kind:'h'};else if(c==='|')r={kind:'v'};
 else if(c==='/'||c==='\\'){const A=c==='/'?['nw','se']:['sw','ne'];r={kind:sc(A[0][0])+sc(A[0][1])>=sc(A[1][0])+sc(A[1][1])?A[0]:A[1]}}
 else{const cart=d=>{const [dx,dy]=SD[d];for(let i=1;i<8;i++){const t=at(dx*i,dy*i);if(W.boxes0.indexOf(S.m+':'+(x+dx*i)+','+(y+dy*i))>=0)return 3;if(!WE.isTrk(t))return 0}return 0};
  const st=['w','e','n','s'].map(d=>[d,cart(d)*10+sc(d)]).sort((a,b)=>b[1]-a[1])[0][0];
  const SL={n:['nw','ne'],s:['sw','se'],w:['nw','sw'],e:['ne','se']}[st],slash=SL.find(k=>k==='nw'||k==='se'),back=SL.find(k=>k==='sw'||k==='ne');
  r=c==='j'?{kind:slash,alt:back,stem:st}:{kind:back,alt:slash,stem:st}}
 return _trk[id]=r}
// stand-on / facing interactables -> small 「按動作…」 bubble above the robot + 動作 button glows
function interactTip(){if(!S||ending||failAnim)return null;const c=WE.cell(W,S,S.m,S.x,S.y);if(c==='j'||c==='ǰ')return '按動作換方向';
 const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[S.f]||null;if(!d)return null;const fc=WE.cell(W,S,S.m,S.x+d[0],S.y+d[1]);
 if(fc==='r')return '按動作拉拉桿';if(fc==='╱'||fc==='╲')return '按動作轉鏡子';if(fc==='⊕'||fc==='⊛')return '按動作開關發電機';return null}
let tipShown=null;function tipAt(gx,gy){const t=anim?null:interactTip(),el=$('tip');if(!el)return;
 if(t){const c=WE.cell(W,S,S.m,S.x,S.y);if(c==='j'||c==='ǰ'){const a=.5+.5*Math.sin(T*6);o.globalAlpha=a;R(gx,gy,16,1,E32.yellow);R(gx,gy+15,16,1,E32.yellow);R(gx,gy,1,16,E32.yellow);R(gx+15,gy,1,16,E32.yellow);o.globalAlpha=1}
  const r=cv.getBoundingClientRect(),k=r.width/off.width;el.style.left=Math.round(r.left+(gx+8)*k)+'px';el.style.top=Math.round(r.top+(gy-2)*k)+'px'}
 if(t!==tipShown){tipShown=t;el.textContent=t||'';el.style.display=t?'block':'none';$('act').classList.toggle('glow',!!t)}}
function tile(c,px,py,x,y){if(V2()&&v2Tile(c,px,py,x,y))return;if(TH===WORLDS.grass&&(c===undefined||(c==='#'&&deep(x,y)))){bush(px,py,x,y);return}
 if(ICY()){ // ice map: bright snow, snowy rock walls, pines outside (ice-art.js)
  if(c===undefined||(c==='#'&&deep(x,y))){icePine(px,py,x,y);return}
  if(c==='#'){const up=(L.grid[y-1]||[])[x];iceRock(px,py,x,y,up===undefined||up!=='#'||deep(x,y-1));return}
  if(c==='%'){iceRock(px,py,x,y,false);const C=E32.grey1;R(px+4,py+3,1,3,C);R(px+5,py+6,2,1,C);R(px+7,py+7,1,3,C);R(px+8,py+10,2,1,C);R(px+10,py+4,1,2,C);R(px+11,py+6,1,1,C);return}
  if(c==='I'){iceNormal(px,py,x,y);return}if(c==='J'){iceHard(px,py,x,y);return}}
 if(c==='#'){if(nearOpen(x,y))wall(px,py,x,y);return}
 if(c==='%'){cracked(px,py,x,y);return}
 if(c===','){rubble(px,py,x,y);return}
 if(c==='b'){bombGrass(px,py,x,y);return}
 if(c==='R'){rune(px,py,x,y);return}
 if(WE.isTun(c)||c==='0'){const tid=WE.tunAt?WE.tunAt(W,S.m,x,y):WE.tunId(c);tunnel(px,py,x,y,tid||c);return}
 if(c==='J'){hardIce(px,py,x,y);return}
 if(c==='I')ice(px,py,x,y);else if(ICY())iceSnow(px,py,x,y);else if(V2())v2Floor(px,py,x,y);else FLOORS[TH.style](px,py,x,y);
 const k=x+','+y,got=st.got.indexOf(k)>=0;
 if(c==='H')spikes(px,py);
 if(c==='O'){if(st.filled.indexOf(k)>=0){R(px+2,py+2,12,12,TH.outline);R(px+3,py+3,10,10,TH.crate[1])}else if(st.holes.indexOf(k)>=0){R(px+1,py+1,14,14,TH.outline);R(px+2,py+2,12,3,E32.navy)}else{R(px+1,py+1,14,14,TH.outline);R(px+2,py+2,12,12,E32.skin2);R(px+5,py+4,1,3,TH.outline);R(px+8,py+8,1,3,TH.outline)}}
 if(c==='X')plate(px,py,st.boxes.some(b=>b[0]===x&&b[1]===y)||WE.duneAt(S,S.m,x,y)>=0);
 if(c==='G')goal(px,py);
 if('cmn'.indexOf(c)>=0&&!got)keyItem(px,py,c);
 if(c==='E'&&!got)battery(px,py);if(c==='g'&&!got)glove(px,py);if(c==='k'&&!got)claws(px,py);if(c==='f'&&!got)fragment(px,py);if(c==='U'&&!got)upgrade(px,py);
 if(c==='*'&&!got){const b=Math.round(Math.sin(T*3+x));R(px+5,py+5+b,6,6,TH.outline);R(px+6,py+4+b,4,8,TH.outline);R(px+6,py+5+b,4,6,E32.grey1);R(px+5,py+6+b,6,4,E32.grey1);R(px+7,py+7+b,2,2,TH.outline)}
 if(c==='W')goal(px,py);
 if(c==='D'&&WE.solid(W,S,S.m,x,y))bars(px,py,0);
 if('CMN'.indexOf(c)>=0&&WE.solid(W,S,S.m,x,y))gate(px,py,c.toLowerCase(),0)}
function zoneBorders(){const M=W.maps[S.m];for(const Z of M.zones){const x0=(Z.x-cam.ox)*16,y0=(Z.y-cam.oy)*16,w=Z.w*16,h=Z.h*16;o.globalAlpha=.55;
  for(let i=0;i<w;i+=6){R(x0+i,y0,4,1,E32.grey1);R(x0+i,y0+h-1,4,1,E32.grey1)}for(let j=0;j<h;j+=6){R(x0,y0+j,1,4,E32.grey1);R(x0+w-1,y0+j,1,4,E32.grey1)}o.globalAlpha=1;}}
// help legend: draw each grass-map tile with the real sprite code into the help panel's little canvases (once)
let legendDone=false;function renderLegend(){legendDone=true;const D={'#':(x,y)=>wall(x,y,0,0),'.':(x,y)=>FLOORS[TH.style](x,y,0,0),'B':(x,y)=>{FLOORS[TH.style](x,y,0,0);crate(x,y,false,0)},'D':(x,y)=>{FLOORS[TH.style](x,y,0,0);bars(x,y,0)},'C':(x,y)=>{FLOORS[TH.style](x,y,0,0);gate(x,y,'c',0)}};
 document.querySelectorAll('#help canvas[data-t]').forEach(c=>{const k=c.dataset.t;o.clearRect(0,0,16,16);(D[k]||((x,y)=>tile(k,x,y,-99,-99)))(0,0);const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,32,32);g.drawImage(off,0,0,16,16,0,0,32,32)})}
// ---------- ending (after the core boss): 10s scene from ending-art.js, drawn on the 256x144 buffer `off` and scaled crisp ----------
const ENDING_ART=['core-art.js','swamp-art.js','volcano-art.js','mine-art.js','power-art.js','castle-art.js','ending-art.js']; // art.js + ice-art.js are already on the page
let ending=null;
const _ls={};function loadScript(src){return _ls[src]||(_ls[src]=new Promise((ok,no)=>{if(document.querySelector('script[src="'+vsrc(src)+'"]'))return ok();const e=document.createElement('script');e.src=vsrc(src);e.onload=ok;e.onerror=()=>{delete _ls[src];no(new Error('load '+src))};document.head.appendChild(e)}))}
function preloadEnding(){const L=ENDING_ART.slice(0,-1);Promise.all(L.map(f=>loadScript(f))).then(()=>loadScript(ENDING_ART[ENDING_ART.length-1])).catch(()=>{})} // warm the ending while the player is in the core
async function startEnding(opt){if(ending)return;ending={loading:true};{const L=ENDING_ART.slice(0,-1);await Promise.all(L.map(f=>loadScript(f)));await loadScript(ENDING_ART[ENDING_ART.length-1])} // scene art in parallel, ending-art.js last (it needs the others)
 const c=document.createElement('canvas');c.id='endcv';c.style.cssText='position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:1000;background:#000;touch-action:none;cursor:pointer;image-rendering:pixelated;image-rendering:crisp-edges';document.body.appendChild(c);
 ending={c,g:c.getContext('2d'),t0:performance.now()-(opt&&opt.t!=null&&!isNaN(opt.t)?Math.max(0,Math.min(ENDING_DURATION,opt.t))*1000:0),dinged:opt&&opt.t>0?ENDING_LAMP_TIMES.filter(x=>x<opt.t).length:0,fixedT:null,rect:[0,0,1]};
 try{window.Music&&Music.stop()}catch(e){}
 c.addEventListener('click',endingTap)}
function endingT(){const E=ending;return E.fixedT!=null?E.fixedT:Math.min(ENDING_DURATION,(performance.now()-E.t0)/1000)}
function endingFrame(){const E=ending;if(!E||E.loading)return;const t=endingT();
 while(E.dinged<ENDING_LAMP_TIMES.length&&t>=ENDING_LAMP_TIMES[E.dinged]){if(E.fixedT==null&&window.Music&&Music.ding)Music.ding(E.dinged);E.dinged++}
 if(off.width!==256||off.height!==144){off.width=256;off.height=144}
 const keepT=T;o.save();o.clearRect(0,0,256,144);endingScene(256,144,t);o.restore();T=keepT; // endingScene drives art's T; give the game clock back
 const c=E.c,g=E.g,dw=innerWidth,dh=innerHeight;if(c.width!==dw||c.height!==dh){c.width=dw;c.height=dh;g.imageSmoothingEnabled=false}
 const s=Math.min(dw/256,dh/144),x=Math.round((dw-256*s)/2),y=Math.round((dh-144*s)/2);E.rect=[x,y,s];
 g.imageSmoothingEnabled=false;const px=(yy)=>{const d=o.getImageData(128,yy,1,1).data;return`rgb(${d[0]},${d[1]},${d[2]})`}; // letterbox bars take the scene's own top/bottom colour (sky / ground)
 g.fillStyle=px(0);g.fillRect(0,0,dw,Math.ceil(dh/2));g.fillStyle=px(143);g.fillRect(0,Math.floor(dh/2),dw,Math.ceil(dh/2));g.drawImage(off,0,0,256,144,x,y,Math.round(256*s),Math.round(144*s));
 } // 15/15 is drawn by ending-art.js itself (no overlay)
// share button: ENDING_SHARE_BUTTON is in unscaled 256x144 coords; map the click back from the displayed size. Clickable from t>=9.8s, only on the player's own click.
function endingTap(e){if(!ending||ending.loading)return;if(endingT()<9.8){ending.t0=performance.now()-9.8*1000;ending.dinged=ENDING_LAMP_TIMES.length;return} // tap during the animation skips to the share panelconst [x,y,s]=ending.rect,lx=(e.clientX-x)/s,ly=(e.clientY-y)/s,B=ENDING_SHARE_BUTTON;
 if(lx>=B.x&&lx<B.x+B.w&&ly>=B.y&&ly<B.y+B.h&&window.Share)Share.clear()}
function draw(){try{drawFrame()}catch(e){const er=window.__errs=window.__errs||[];if(er.length<20)er.push(String(e));if(!draw.warned){draw.warned=1;console.error(e)}lastDraw=performance.now()} // a bad tile must never freeze the game
 if(!manualDraw)requestAnimationFrame(draw)}
function drawFrame(){if(ending){endingFrame();return}const now=performance.now()/1000,dt=Math.min(.05,now-(stamp||now));stamp=now;T+=dt;fuseFrame(dt);
 TH=WORLDS[W.maps[S.m].theme]||WORLDS.grass;if(V2())ensureSceneArt(S.m);buildView();if(!legendDone&&st){const th=TH;TH=WORLDS.grass;renderLegend();TH=th}
 const [tx,ty]=camTarget();if(!cam.init){cam.x=tx;cam.y=ty;cam.init=true}{const k=1-Math.exp(-dt*5),mx=dt*14;cam.x+=Math.max(-mx,Math.min(mx,(tx-cam.x)*k));cam.y+=Math.max(-mx,Math.min(mx,(ty-cam.y)*k))} // smooth pan, capped speed (no jump on zone change)
 cam.ox=Math.round(cam.x*16)/16;cam.oy=Math.round(cam.y*16)/16;
 o.fillStyle=V2()?(DES()?E32.tan:VOL()?E32.brown2:MIN()?E32.grey4:SWA()?E32.green3:SEA()?E32.blue1:CAS()?E32.navy:SKY()?E32.blue2:MIR()?'#b5aed8':POW()?E32.grey2:CLK()?'#c4935f':FAC()?E32.grey3:COR()?E32.ink:E32.green3):TH===WORLDS.grass?E32.green2:ICY()?E32.white:E32.ink;o.fillRect(0,0,off.width,off.height);
 const x0=Math.floor(cam.ox),y0=Math.floor(cam.oy);
 for(let y=y0-1;y<=y0+VIEWH+1;y++)for(let x=x0-1;x<=x0+VW+1;x++){if((x<0||y<0||x>=L.W||y>=L.H)&&TH!==WORLDS.grass&&!ICY()&&!V2())continue;tile((L.grid[y]||[])[x],Math.round((x-cam.ox)*16),Math.round((y-cam.oy)*16),x,y)}
 zoneBorders();
 if(!MIN())st.boxes.forEach(b=>crate(Math.round((b[0]-cam.ox)*16),Math.round((b[1]-cam.oy)*16),L.grid[b[1]][b[0]]==='X',0));
 if(stuck.on&&typeof stuckBoxMark==='function')stuck.boxes.forEach(([x,y])=>stuckBoxMark(Math.round((x-cam.ox)*16),Math.round((y-cam.oy)*16),T));
 drawMovers();S.bombs.filter(b=>b.m===S.m).forEach(blastWarn);S.bombs.filter(b=>b.m===S.m).forEach(b=>bombSprite(Math.round((b.x-cam.ox)*16),Math.round((b.y-cam.oy)*16),b));
 // robot
 let rx=S.x,ry=S.y,frame=0,shk=0,face='norm';
 if(anim){const p=Math.min(1,(T-anim.t0)/anim.dur);
  if(anim.type==='move'&&anim.m===S.m){const pts=[anim.from].concat(anim.path),seg=p*(pts.length-1),i=Math.min(pts.length-2,Math.floor(seg)),f=seg-i;rx=pts[i][0]+(pts[i+1][0]-pts[i][0])*f;ry=pts[i][1]+(pts[i+1][1]-pts[i][1])*f;frame=anim.ice?0:(Math.floor(p*4)%2)+1}
  if(anim.type==='bump'){const d=WE.DIRS[anim.dir],q=Math.min(1,p/.3),b=Math.sin(q*Math.PI)*.25;rx+=d[0]*b;ry+=d[1]*b;shk=p>.25?Math.round(Math.sin((p-.25)*Math.PI*10)*(1-p)*3):0;face=anim.face}
  if(p>=1){anim=null;idleT=T;if(inq.length){const a=inq.shift();setTimeout(()=>act(a),0)}}}
 let hop=0,bang=false;if(react){const q=(T-react.t0)/(react.type==='hop'?.4:.8);if(q>=1)react=null;else{hop=Math.round(Math.sin(Math.min(1,q*(react.type==='hop'?1:2.2))*Math.PI)*(react.type==='hop'?4:3));bang=react.type==='startle'}}
 const gx=Math.round((rx-cam.ox)*16),gy=Math.round((ry-cam.oy)*16);
 o.globalAlpha=.35+.1*Math.sin(T*3);R(gx+3,gy+13,10,3,E32.cyan);R(gx+1,gy+14,14,1,E32.cyan);o.globalAlpha=1;
 let look=0;if(!anim&&T-idleT>3){const ph=(T-idleT-3)%4;look=ph<.7?-1:ph<1.4?1:0}
 if(failAnim&&failAnim.sink&&SWA()&&typeof robotSwampSink==='function'){const p=(T-failAnim.t0)/1.0;robotSwampSink(gx,gy,S.x,S.y,Math.min(.999,p));
  if(p>=1){failAnim=null;S=S.zone?WE.step(W,S,'reset').state:S;cam.init=true;hud();persist()}}
 else if(failAnim&&failAnim.sink&&typeof robotQuicksand==='function'){const p=(T-failAnim.t0)/1.0;robotQuicksand(gx,gy,Math.min(.999,p));
  if(p>=1){failAnim=null;S=S.zone?WE.step(W,S,'reset').state:S;cam.init=true;hud();persist()}}
 else if(failAnim){const p=(T-failAnim.t0)/1.0;robot(gx,gy-1,'x','down',0,0,1);o.globalAlpha=.85;R(gx+2,gy+5,12,9,E32.ink);R(gx+6,gy,4,3,E32.ink);o.globalAlpha=1;
  // dizzy spiral eyes
  const sp=Math.floor(T*10)%4,E=[[0,0],[1,0],[1,1],[0,1]];[5,9].forEach(ex=>{R(gx+ex,gy+7,3,3,E32.grey3);const [a,b]=E[sp];R(gx+ex+a,gy+7+b,1,1,E32.yellow)});
  for(let i=0;i<3;i++){const q=(p*2+i/3)%1;o.globalAlpha=1-q;R(gx+6+i*2+Math.round(Math.sin(q*6+i)*2),gy-2-q*10,3,3,E32.grey2);o.globalAlpha=1}
  if(p>=1){const ff=failAnim;failAnim=null;S=WE.zoneAt(W,S.m,S.x,S.y)&&S.zone?WE.step(W,S,'reset').state:S;cam.init=true;hud();persist()}}
 else{robot(gx+shk,gy+Math.round(Math.sin(T*2.4))-1-hop,react&&react.type==='hop'?'norm':face,anim&&anim.type==='bump'?'down':facing,frame,look,1);if(S.air>0&&typeof robotBubbleHelmet==='function')robotBubbleHelmet(gx+shk,gy+Math.round(Math.sin(T*2.4))-1-hop)}
 if(bang){const bx=gx+12,by=gy-6-hop;R(bx-1,by-1,4,9,TH.outline);R(bx,by,2,5,E32.amber);R(bx,by+6,2,1,E32.amber)}
 if(S.held&&!failAnim){R(gx+11,gy+1-hop,5,5,TH.outline);R(gx+12,gy+2-hop,3,3,E32.grey4)}
 if(!failAnim)tipAt(gx,gy);else tipAt(-99,-99);
 runeSigns();shortcutMarks();drawGuide();drawPats(); // guide above robot
 fx=fx.filter(f=>f.type==='defeat'?defeat(f):f.type in V2FX?V2FX[f.type](f):smoke(f));
 // blit with shake + tunnel fade
 const sh=shake>0?(shake--%2?2:-2)*SC:0;ctx.imageSmoothingEnabled=false;ctx.fillStyle=E32.ink;ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(off,sh,0,cv.width,cv.height);
 if(fade>0){ctx.fillStyle=`rgba(24,20,37,${fade})`;ctx.fillRect(0,0,cv.width,cv.height);fade=Math.max(0,fade-dt/0.3)}
 drawMini();lastDraw=performance.now()}
let lastDraw=0,manualDraw=false;
function drawMini(){const M=W.maps[S.m];mctx.clearRect(0,0,mini.width,mini.height);mctx.fillStyle='rgba(24,20,37,.45)';mctx.fillRect(0,0,mini.width,mini.height);
 for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++){const c=L.grid[y][x];if(c==='#'||c==='R')continue;mctx.fillStyle=c==='%'?E32.grey3:c==='I'||c==='J'?E32.blue2:WE.isTun(c)?E32.amber:c==='b'?E32.green3:'CMN'.indexOf(c)>=0?E32.magenta:E32.green1;mctx.fillRect(x*2,y*2,2,2)}
 for(const Z of M.zones){mctx.strokeStyle=E32.sand;mctx.lineWidth=.5;mctx.strokeRect(Z.x*2+.25,Z.y*2+.25,Z.w*2-.5,Z.h*2-.5)}
 mctx.fillStyle=(Math.floor(T*4)%2)?E32.white:E32.cyan;mctx.fillRect(S.x*2-1,S.y*2-1,4,4)}
// ---------- boot ----------
// production ending preview (kept in dist): ?ending=1[&t=5] skips title/save entirely; endBoot in world.html already hid #title
const _endQ=/(?:^|[?&])ending(?:=|&|$)/.test(location.search),_endT=(_=>{const m=location.search.match(/[?&]t=([^&]*)/);return m?+decodeURIComponent(m[1]):null})();
loadGame();
if(_endQ){const t=$('title'),h=$('help');t.classList.remove('on','has');t.style.display='none';h.classList.remove('on');h.style.display='none'}
else if(saved){$('title').classList.add('has');tpaint();S=JSON.parse(JSON.stringify(saved.s));WE.initMovers(W,S);tutorialDone=!!saved.tutorialDone;cam.init=false;$('help').classList.remove('on')}
resize();hud();requestAnimationFrame(draw);
if(_endQ)Promise.resolve(startEnding({t:_endT})).catch(e=>console.error('ending failed',e));
setInterval(()=>{if(performance.now()-lastDraw>100){manualDraw=true;try{draw()}finally{manualDraw=false}}},50);
window.__world={act,state:()=>S,W,newGame,cam};
