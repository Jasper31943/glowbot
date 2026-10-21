// Glowbot 小光 — continuous big-map engine (pure logic; browser + Node).
// Reuses tile semantics from logic.js and adds: bombs, cracked walls, bomb grass, hard ice, ice claws,
// non-consumed keys, tunnels (digits 1-9, each exactly twice in the world), puzzle zones with local reset/limit.
(function(root){
const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const ITEMS={c:'key',m:'key',n:'key',k:'claws',f:'fragment',g:'glove',U:'upgrade',E:'battery','*':'bolt',F:'fire',L:'lamp'}; // F = 吐火 (desert/forest maps write it 'f'; renamed at parse so it can't clash with the ice rune fragment), L = lighthouse lamp
const REGROW=+((typeof process!=='undefined'&&process.env&&process.env.REGROW)||6); // burnt vines grow back after 6 counted actions
const FUSE=3,FUSE_MS=3000,FUSE_MODEL=+((typeof process!=='undefined'&&process.env&&process.env.FUSE_N)||4); // real-time fuse: 3,2,1 (1s each), boom exactly at 0 (3.0s). Solver: <=FUSE_MODEL actions between place and blast
// ---------- parse ----------
function parseWorld(def){TUNALIAS=Object.assign({},def.tunnelAlias||{});
 const W={maps:{},start:null,tunnels:{},boxes0:[],pats0:[],dunes0:[],bugs0:[],bosses0:[],clouds0:[],tunnelTo:def.tunnelTo||{},errors:[],hints:def.hints||[],goal:def.goal||null,runeItem:def.runeItem||null,pending:(def.pendingTunnels||[]).slice(),tunnelMarks:def.tunnelMarks||[]};
 for(const id in def.maps){const md=def.maps[id];const g=md.grid.map(r=>r.split(''));const H=g.length,Wd=Math.max(...md.grid.map(r=>r.length));
  const m={id,name:md.name,theme:md.theme||'grass',rules:md.rules||null,grid:g,W:Wd,H,zones:[]};const v2=m.rules==='v2';
  for(let y=0;y<H;y++)for(let x=0;x<Wd;x++){const c=g[y][x]||'#';g[y][x]=c;
   if(c==='S'){W.start={m:id,x,y};g[y][x]='.'}
   if(c==='B'){W.boxes0.push(id+':'+x+','+y);g[y][x]='.'}
   if(c==='P'&&!v2){W.pats0.push({m:id,x,y});g[y][x]='.'}
   if(v2){ // desert/forest/swamp/mine/volcano/sea/castle/sky movers
    if(c in DCH){W.dunes0.push({m:id,x,y,d:DCH[c]});g[y][x]='.'}
    else if(c==='z'||c==='Z'||c==='y'){W.bugs0.push({m:id,x,y,d:c==='z'?3:c==='Z'?2:1,fr:0});g[y][x]='.'}
    else if(c==='g'||c==='ɢ'){W.bugs0.push({m:id,x,y,d:c==='g'?3:2,fr:0,ghost:1,spotted:0});g[y][x]='.'} // armor ghost (castle); not the grass glove item
    else if(c==='x'||c==='e'){W.bugs0.push({m:id,x,y,d:c==='x'?3:2,fr:0,ghost:1,spotted:0,spark:1});g[y][x]='.'} // power spark mon (knight-sight)
    else if(c==='p'||c==='P'){W.bugs0.push({m:id,x,y,d:c==='p'?3:2,fr:0,ghost:1,spotted:0,glitch:1});g[y][x]='.'} // factory glitch bot (presses X)
    else if(c==='Y'||c==='O'||c==='&'||c==='$'||c==='¶'){W.bosses0.push({m:id,x,y,d:3,hp:2,max:2,kind:c==='O'?'frog':c==='&'?'mole':c==='$'?'crab':c==='¶'?'phantom':'worm'});g[y][x]='.'}
    else if(c==='@'){W.bosses0.push({m:id,x,y,d:3,hp:3,max:3,kind:'knight'});g[y][x]='.'}
    else if(c==='§'){W.bosses0.push({m:id,x,y,d:3,hp:3,max:3,kind:'spark',needPw:1,knight:1});g[y][x]='.'}
    else if(c==='¥'){W.bosses0.push({m:id,x,y,d:3,hp:3,max:3,kind:'glitch',knight:1});g[y][x]='.'}
    else if(c==='?'){W.bosses0.push({m:id,x,y,d:3,hp:2,max:2,kind:'bird',fly:1});g[y][x]=','}
    else if(c==='T')W.bosses0.push({m:id,x,y,d:0,hp:3,max:3,kind:'tree'});
    else if(c==='V')W.bosses0.push({m:id,x,y,d:0,hp:3,max:3,kind:'golem'});
    else if(c==='£')W.bosses0.push({m:id,x,y,d:0,hp:3,max:3,kind:'guard'}); // clock guard stays on tile
    else if(c==='Ω')W.bosses0.push({m:id,x,y,d:0,hp:5,max:5,kind:'core',phase:0}); // final boss stays on tile
    else if(c==='['){W.clouds0.push({m:id,x,y,d:3});g[y][x]=','}
    else if(c===']'){W.clouds0.push({m:id,x,y,d:2});g[y][x]=','}
    else if(c==='f')g[y][x]='F'}
   if(c!=='0'&&isTun(c))(W.tunnels[tunId(c)]=W.tunnels[tunId(c)]||[]).push({m:id,x,y,c})}
  // zones given 1-based inclusive {r1,r2,c1,c2}; stored 0-based
  (md.zones||[]).forEach((z,i)=>{const Z={id:id+'#'+(z.id||i),name:z.name||'',x:z.c1-1,y:z.r1-1,w:z.c2-z.c1+1,h:z.r2-z.r1+1,limit:z.limit||0,entry:z.entry?[z.entry[1]-1,z.entry[0]-1]:null,exit:z.exit?[z.exit[1]-1,z.exit[0]-1]:null,tutorial:!!z.tutorial};
   if(Z.w>7||Z.h>9)W.errors.push(`zone ${Z.id} is ${Z.w}x${Z.h} (max 7 wide x 9 high)`);m.zones.push(Z)});
  W.maps[id]=m}
 [W.dunes0,W.bugs0,W.bosses0,W.clouds0].forEach(a=>a.forEach((o,i)=>{o.i=i;const Z=zoneAt(W,o.m,o.x,o.y);o.zone=Z?Z.id:null;if(!Z)W.errors.push(`mover at ${o.m} ${o.x},${o.y} is outside every zone`)}));
 // patrols: ping-pong along the open axis (horizontal preferred, like logic.js); each belongs to the zone it starts in
 W.pats0.forEach((p,i)=>{const op=(x,y)=>{const c=base(W,p.m,x,y);return c!=='#'&&c!=='D'&&'CMN'.indexOf(c)<0};p.i=i;p.ax=(op(p.x-1,p.y)||op(p.x+1,p.y))?'h':'v';p.d=1;const Z=zoneAt(W,p.m,p.x,p.y);p.zone=Z?Z.id:null});
 // tunnel marks: grid '0' + text lines (隧道 N：map (r,c) ↔ …) for ids >= 10
 (W.tunnelMarks||[]).forEach(tm=>{const id=String(tm.id);if((W.tunnels[id]||[]).length>=2)return;const ends=[],seen={};
  for(const e of [tm.a,tm.b]){if(!e||!e.m||!W.maps[e.m])continue;const x=e.c-1,y=e.r-1,k=e.m+':'+x+','+y;if(seen[k])continue;seen[k]=1;
   if(base(W,e.m,x,y)!=='0'){W.errors.push(`tunnel ${id} mark ${e.m}(${e.r},${e.c}) is not '0'`);continue}
   // avoid dup if already registered from another file's mark
   if((W.tunnels[id]||[]).some(p=>p.m===e.m&&p.x===x&&p.y===y))continue;
   ends.push({m:e.m,x,y,c:'0'});(W.tunnels[id]=W.tunnels[id]||[]).push({m:e.m,x,y,c:'0'})}
  const n=(W.tunnels[id]||[]).length;if(n===0)W.errors.push(`tunnel ${id} has no ends on loaded maps`);
  else if(n===1){if(W.pending.indexOf(id)<0)W.pending.push(id)}
  else{const i=W.pending.indexOf(id);if(i>=0)W.pending.splice(i,1)}});
 // every leftover '0' must be claimed by a mark
 for(const id in W.maps){const M=W.maps[id];for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++)if(M.grid[y][x]==='0'){const claimed=Object.keys(W.tunnels).some(d=>W.tunnels[d].some(p=>p.m===id&&p.x===x&&p.y===y));if(!claimed)W.errors.push(`orphan tunnel 0 at ${id} ${x},${y}`)}}
 for(const d in W.tunnels)if(W.tunnels[d].length!==2&&!(W.tunnels[d].length===1&&W.pending.indexOf(d)>=0))W.errors.push(`tunnel ${d} appears ${W.tunnels[d].length} times (must be exactly 2)`);
 if(!W.start)W.errors.push('no start S');
 return W}
// tunnels: digits 1-9 (not 0 — 0 is only via tunnelMarks), plus def.tunnelAlias
let TUNALIAS={};const isTun=c=>typeof c==='string'&&c.length===1&&(/[1-9]/.test(c)||c==='0'||Object.prototype.hasOwnProperty.call(TUNALIAS,c)),tunId=c=>TUNALIAS[c]||c;
function tunAt(W,m,x,y){for(const d in W.tunnels)if(W.tunnels[d].some(p=>p.m===m&&p.x===x&&p.y===y))return d;const c=base(W,m,x,y);return isTun(c)&&c!=='0'?tunId(c):null}
const DCH={'^':0,'v':1,'<':2,'>':3},DV=[[0,-1],[0,1],[-1,0],[1,0]]; // mover dirs: 0 up 1 down 2 left 3 right; d^1 = turn around
function base(W,m,x,y){const M=W.maps[m];return (y<0||y>=M.H||x<0||x>=M.W)?'#':M.grid[y][x]}
const has=(arr,k)=>arr.indexOf(k)>=0;
const K=(m,x,y)=>m+':'+x+','+y;
// dynamic cell: broken cracked walls become rubble floor ','; filled holes become floor
function cell(W,s,m,x,y){const c=base(W,m,x,y),k=K(m,x,y);if(s.ch&&s.ch[k]!==undefined)return s.ch[k]; // ch: changed tiles (= sand bridge, a ash, . melted ice / fallen tree)
if(c==='%'&&(has(s.broken,k)||clearedAt(W,s,m,x,y)))return W.maps[m].theme==='sky'?'.':',';if(c==='R'&&has(s.broken,k))return ',';if(c==='O'){if(has(s.filled,k))return '.';if(has(s.holes,k))return 'o'}return c}
function clearedAt(W,s,m,x,y){const Z=zoneAt(W,m,x,y);return !!(Z&&s.cleared.length&&has(s.cleared,Z.id))}
function zoneAt(W,m,x,y){const z=W.maps[m].zones;for(const Z of z)if(x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h)return Z;return null}
function initState(W){const s={m:W.start.m,x:W.start.x,y:W.start.y,f:'down',held:0,inv:'',got:[],cleared:[],boxes:W.boxes0.slice(),bombs:[],broken:[],holes:[],filled:[],zone:null,zoneEntry:null,left:null,visited:[W.start.m],steps:0,pats:W.pats0.map(p=>({i:p.i,m:p.m,x:p.x,y:p.y,d:p.d}))};initMovers(W,s);
 enterZone(W,s);return s}
function clone(s){return{m:s.m,x:s.x,y:s.y,f:s.f,held:s.held,inv:s.inv,got:s.got.slice(),cleared:s.cleared.slice(),boxes:s.boxes.slice(),bombs:s.bombs.map(b=>({...b})),broken:s.broken.slice(),holes:s.holes.slice(),filled:s.filled.slice(),zone:s.zone,zoneEntry:s.zoneEntry,left:s.left,visited:s.visited.slice(),steps:s.steps,pats:(s.pats||[]).map(p=>({...p})),dunes:s.dunes&&s.dunes.map(o=>({...o})),bugs:s.bugs&&s.bugs.map(o=>({...o})),bosses:s.bosses&&s.bosses.map(o=>({...o})),ch:s.ch&&{...s.ch},vt:s.vt&&{...s.vt},rocks:(s.rocks||[]).map(r=>({...r})),lt:s.lt||0,cf:s.cf||null,cart:s.cart&&{...s.cart},bossCp:s.bossCp&&{...s.bossCp,ch:{...s.bossCp.ch}},air:s.air||0,lvz:s.lvz&&{...s.lvz},clouds:s.clouds&&s.clouds.map(o=>({...o})),zt:s.zt||0,lit:s.lit||0,pw:s.pw||0,gen:s.gen||0,bounce:s.bounce&&{...s.bounce},beamLit:s.beamLit&&{...s.beamLit}}}
// fills desert/forest fields (also used to upgrade v3 saves, which never reached those maps)
function initMovers(W,s){if(!s.dunes)s.dunes=W.dunes0.map(o=>({...o}));if(!s.bugs)s.bugs=W.bugs0.map(o=>({...o}));if(!s.bosses)s.bosses=W.bosses0.map(o=>({...o}));if(!s.clouds)s.clouds=(W.clouds0||[]).map(o=>({...o}));if(!s.ch)s.ch={};if(!s.vt)s.vt={};if(!s.rocks)s.rocks=[];if(s.lt==null)s.lt=0;if(!s.cart)s.cart={};if(s.air==null)s.air=0;if(!s.lvz)s.lvz={};if(s.zt==null)s.zt=0;return s}
const hasInv=(s,i)=>s.inv.indexOf(i)>=0;
// ---------- patrols (snowball 'P') ----------
function patAt(s,m,x,y){return (s.pats||[]).findIndex(p=>p.m===m&&p.x===x&&p.y===y)}
function resetPats(W,s,zid){if(!zid)return;s.pats=(s.pats||[]).filter(p=>W.pats0[p.i].zone!==zid);W.pats0.forEach(p=>{if(p.zone===zid)s.pats.push({i:p.i,m:p.m,x:p.x,y:p.y,d:p.d})});s.pats.sort((a,b)=>a.i-b.i)}
// one patrol step per counted player action (move, bump, act). Turns around at walls/boxes/bombs/spikes/tunnels/zone edge; stays if boxed in.
// Returns true if the robot gets caught (same cell, swapped cells, or slid through the patrol's old cell).
function movePats(W,s,from,path){let caught=false;
 for(const p of s.pats){if(p.m!==s.m||W.pats0[p.i].zone!==s.zone)continue;const P0=W.pats0[p.i],Z=P0.zone&&W.maps[p.m].zones.find(z=>z.id===P0.zone);
  const blocked=(x,y)=>{const c=cell(W,s,p.m,x,y);return solid(W,s,p.m,x,y)||boxAt(s,p.m,x,y)>=0||bombAt(s,p.m,x,y)>=0||c==='H'||c==='o'||isTun(c)||'GDCMN'.indexOf(c)>=0||patAt(s,p.m,x,y)>=0||(Z&&!(x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h))};
  const ox=p.x,oy=p.y,v=d=>P0.ax==='h'?[ox+d,oy]:[ox,oy+d];
  let [nx,ny]=v(p.d);if(blocked(nx,ny)){p.d=-p.d;[nx,ny]=v(p.d);if(blocked(nx,ny)){nx=ox;ny=oy}}p.x=nx;p.y=ny;
  if((nx===s.x&&ny===s.y)||(nx===from[0]&&ny===from[1]&&ox===s.x&&oy===s.y)||(path||[]).some(q=>q[0]===ox&&q[1]===oy))caught=true}
 return caught}
function addInv(s,i){if(!hasInv(s,i))s.inv=(s.inv+i).split('').sort().join('')}
function bombAt(s,m,x,y){return s.bombs.findIndex(b=>b.m===m&&b.x===x&&b.y===y)}
function boxAt(s,m,x,y){return s.boxes.indexOf(K(m,x,y))}
function switchDoorOpen(W,s,m,x,y){const Z=zoneAt(W,m,x,y);const M=W.maps[m];if(Z&&has(s.cleared,Z.id))return true;let n=0;
 for(let yy=0;yy<M.H;yy++)for(let xx=0;xx<M.W;xx++){if(M.grid[yy][xx]!=='X')continue;if(Z&&zoneAt(W,m,xx,yy)!==Z)continue;n++;
  const pressed=boxAt(s,m,xx,yy)>=0||duneAt(s,m,xx,yy)>=0||(s.bugs||[]).some(b=>b.m===m&&b.x===xx&&b.y===yy&&b.glitch);
  if(!pressed)return false}return n>0||M.rules!=='v2'} // bombs do NOT; dunes + glitch bots (p/P) DO
function solid(W,s,m,x,y){if(W.maps[m].rules==='v2')return solidV2(W,s,m,x,y);const c=cell(W,s,m,x,y);
 if(c==='#'||c==='%'||c==='o'||c==='R'||c==='b')return true; // bomb grass is a plant: face it + act to pick
 if(c==='D'&&!switchDoorOpen(W,s,m,x,y))return true;
 if((c==='C'||c==='M'||c==='N')&&!hasInv(s,c.toLowerCase()))return true; // keys are NOT consumed
 return false}
const isIce=(c)=>c==='I'||c==='J';
function slides(s,c){return c==='J'||(c==='I'&&!hasInv(s,'k'))} // hard ice J slides even with claws
function objBlocked(W,s,m,x,y){const c=cell(W,s,m,x,y);if(c==='o')return false;return patAt(s,m,x,y)>=0||solid(W,s,m,x,y)||boxAt(s,m,x,y)>=0||bombAt(s,m,x,y)>=0||'GDHWCMN'.indexOf(c)>=0||isTun(c)||(ITEMS[c]&&!has(s.got,K(m,x,y)))}
function enterZone(W,s){const Z=zoneAt(W,s.m,s.x,s.y),id=Z?Z.id:null;if(id!==s.zone){if(s.zone&&s.pats)resetPats(W,s,s.zone);s.zone=id;s.zoneEntry=Z?[s.x,s.y]:null;s.left=Z&&Z.limit?Z.limit+(hasInv(s,'U')?10:0):null;s.zt=0;if(Z&&W.maps[s.m].rules==='v2')recomputeV2(W,s,Z);return Z?'zone':'leave'}return null}
function pickup(W,s,ev){const c0=cell(W,s,s.m,s.x,s.y),k=K(s.m,s.x,s.y);if(c0==='i'){s.air=6;s.ch[k]='.';ev.push('bubble');return}const c=base(W,s.m,s.x,s.y);if(W.maps[s.m].theme==='clock'&&(c==='n'||c==='s'))return;if(ITEMS[c]&&!has(s.got,k)){s.got.push(k);if(ITEMS[c]==='battery'){if(s.left!=null)s.left+=5}else if(ITEMS[c]!=='bolt'&&ITEMS[c]!=='lamp')addInv(s,c);ev.push(ITEMS[c]);if(ITEMS[c]==='lamp'&&s.m==='core'){const z=zoneAt(W,s.m,s.x,s.y);const cb=(s.bosses||[]).find(o=>o.kind==='core'&&(!z||o.zone===z.id));if(!cb||cb.hp<=0)ev.push('ending')}}}
function tick(W,s,ev,skipNew){const keep=[];for(const b of s.bombs){if(b===skipNew){keep.push(b);continue}b.t--;if(b.t>0){keep.push(b);continue}
  ev.push('blast');const blast=[[0,0],[1,0],[-1,0],[0,1],[0,-1]];const hits=[];let hitW=null;
  blast.forEach(([dx,dy])=>{const x=b.x+dx,y=b.y+dy;if(b.m===s.m&&x===s.x&&y===s.y)s.hurt=1;const pi=patAt(s,b.m,x,y);if(pi>=0){const P=s.pats[pi];(s.defeated=s.defeated||[]).push({m:P.m,x:P.x,y:P.y,d:P.d,ax:W.pats0[P.i].ax});s.pats.splice(pi,1);ev.push('defeat')}if(base(W,b.m,x,y)==='%'&&!has(s.broken,K(b.m,x,y))){s.broken.push(K(b.m,x,y));hits.push([x,y])}
   const di=duneAt(s,b.m,x,y);if(di>=0){(s.scattered=s.scattered||[]).push({m:b.m,x,y});s.dunes.splice(di,1);ev.push('scatter')}
   const gi=bugAt(s,b.m,x,y);if(gi>=0){(s.squashed=s.squashed||[]).push({m:b.m,x,y});s.bugs.splice(gi,1);ev.push('squash')}
   const wi=(s.bosses||[]).findIndex(o=>o.hp>0&&o.m===b.m&&o.x===x&&o.y===y);if(wi>=0){const o=s.bosses[wi];if(!(o.needPw&&!s.gen))hitW=o}});
  if(hitW){hitW.hp--;hitW.hitAt=s.steps;if(hitW.kind==='core')hitW.phase=hitW.max-hitW.hp;ev.push('bosshit');if(hitW.hp<=0){if(hitW.kind==='golem'||hitW.kind==='guard'||hitW.kind==='core')s.ch[K(hitW.m,hitW.x,hitW.y)]='.';ev.push('bossdown')}hitW=null}
  if(hits.length)ev.push('wall');s.lastBlast={m:b.m,x:b.x,y:b.y,hits}}
 s.bombs=keep}
// actions: up/down/left/right, 'act' (pick up / place bomb), 'reset' (restore current zone)
const PLACEABLE='.,IJXO*';
function caught(s,ev){ev.push('caught');return{state:s,result:'fail',ev}}
function finish(W,s,ev,res,extra){ // after a counted step: tick fuses; robot inside a blast = fail
 return Object.assign({state:s,result:res,ev},extra||{})} // moves never tick fuses (fuses are real-time, see advance())
// actions: up/down/left/right, 'act' (facing bomb grass = pick up; facing floor/ice/switch while holding = place), 'reset' (restore current zone)
function step(W,s0,a,opt){if(W.maps[s0.m].rules==='v2')return stepV2(W,s0,a,opt);const ev=[];const free=!!(opt&&opt.free); // free: tutorial auto-hop — moves without counting a turn (no fuse tick)
 if(a==='reset')return resetZone(W,s0);
 if(a==='act'){const s=clone(s0);const [dx,dy]=DIRS[s.f],fx=s.x+dx,fy=s.y+dy,fc=cell(W,s,s.m,fx,fy);
  if(base(W,s.m,fx,fy)==='R'&&fc==='R'&&W.runeItem&&hasInv(s,W.runeItem)){s.broken.push(K(s.m,fx,fy));ev.push('rune','wall');s.steps++;return finish(W,s,ev,'act')} // action on a rune stone with the fragment
  if(!s.held&&fc==='b'){s.held=1;ev.push('grab');s.steps++;if(movePats(W,s,[s.x,s.y],null))return caught(s,ev);return finish(W,s,ev,'act')}
  if(s.held&&PLACEABLE.indexOf(fc)>=0&&!(fc==='O'&&false)&&boxAt(s,s.m,fx,fy)<0&&bombAt(s,s.m,fx,fy)<0&&!(ITEMS[fc]&&fc!=='*'&&!has(s.got,K(s.m,fx,fy)))){
   if(patAt(s,s.m,fx,fy)>=0)return{state:s0,result:'noop',ev};
   s.bombs.push({m:s.m,x:fx,y:fy,t:FUSE,ms:0});s.held=0;ev.push('place');s.steps++;if(movePats(W,s,[s.x,s.y],null))return caught(s,ev);return{state:s,result:'act',ev}}
  return{state:s0,result:'noop',ev}}
 const [dx,dy]=DIRS[a];if(s0.left!=null&&s0.left<=0)return{state:s0,result:'tired',ev,path:[]};
 const s=clone(s0);s.f=a;const nx=s.x+dx,ny=s.y+dy;
 if(solid(W,s,s.m,nx,ny)){if(base(W,s.m,nx,ny)==='R'&&W.runeItem&&hasInv(s,W.runeItem)&&!has(s.broken,K(s.m,nx,ny))){s.broken.push(K(s.m,nx,ny));ev.push('rune','wall');return{state:s,result:'bump',ev,path:[]}} // hook: a later item clears rune stones
  ev.push('bump');if(!free&&movePats(W,s,[s.x,s.y],null))return caught(s,ev);return{state:s,result:'bump',ev,path:[]}}
 const moves=[];
 let bi=boxAt(s,s.m,nx,ny),mi=bombAt(s,s.m,nx,ny);
 if(bi>=0||mi>=0){let bx=nx+dx,by=ny+dy;const BZ=bi>=0?zoneAt(W,s.m,nx,ny):null; // box-blocked: boxes stay inside their own zone, never on its entry/exit
  const boxOut=(x,y)=>bi>=0&&!!BZ&&(!(x>=BZ.x&&x<BZ.x+BZ.w&&y>=BZ.y&&y<BZ.y+BZ.h)||(BZ.entry&&BZ.entry[0]===x&&BZ.entry[1]===y)||(BZ.exit&&BZ.exit[0]===x&&BZ.exit[1]===y));
  if(objBlocked(W,s,s.m,bx,by)||boxOut(bx,by)){ev.push('bump');if(!free&&movePats(W,s,[s.x,s.y],null))return caught(s,ev);return{state:s,result:'bump',ev,path:[]}}
  if(cell(W,s,s.m,bx,by)==='o'){if(bi>=0){s.boxes.splice(bi,1);s.holes.splice(s.holes.indexOf(K(s.m,bx,by)),1);s.filled.push(K(s.m,bx,by));ev.push('fill')}else{s.bombs.splice(mi,1);ev.push('fizzle')}}
  else{while(isIce(cell(W,s,s.m,bx,by))&&!objBlocked(W,s,s.m,bx+dx,by+dy)&&!boxOut(bx+dx,by+dy)&&cell(W,s,s.m,bx+dx,by+dy)!=='o'){bx+=dx;by+=dy} // boxes and bombs slide on ice
   if(bi>=0)s.boxes[bi]=K(s.m,bx,by);else{s.bombs[mi].x=bx;s.bombs[mi].y=by}}
  moves.push([[nx,ny],[bx,by]]);ev.push('push')}
 else if(hasInv(s,'g')){const px=s.x-dx,py=s.y-dy,pb=boxAt(s,s.m,px,py);if(pb>=0){s.boxes[pb]=K(s.m,s.x,s.y);moves.push([[px,py],[s.x,s.y]]);ev.push('pull')}}
 const leave=[[s.x,s.y]];s.x=nx;s.y=ny;pickup(W,s,ev);const path=[[nx,ny]];
 while(slides(s,cell(W,s,s.m,s.x,s.y))){const tx=s.x+dx,ty=s.y+dy;if(solid(W,s,s.m,tx,ty)||boxAt(s,s.m,tx,ty)>=0||bombAt(s,s.m,tx,ty)>=0)break;leave.push([s.x,s.y]);s.x=tx;s.y=ty;pickup(W,s,ev);path.push([tx,ty]);if(cell(W,s,s.m,tx,ty)==='H')break}
 leave.forEach(([x,y])=>{if(base(W,s.m,x,y)==='O'&&!has(s.filled,K(s.m,x,y))&&!has(s.holes,K(s.m,x,y))){s.holes.push(K(s.m,x,y));ev.push('crumble')}});
 if(cell(W,s,s.m,s.x,s.y)==='H')return{state:s0,result:'fall',ev,path};
 if(!free){if(s.left!=null)s.left--;s.steps++;if(movePats(W,s,leave[0],path))return Object.assign(caught(s,ev),{path,moves})}
 let result='move';const c=base(W,s.m,s.x,s.y);
 {const tid=tunAt(W,s.m,s.x,s.y);if(tid){const pair=W.tunnels[tid]||[];const other=pair.find(p=>!(p.m===s.m&&p.x===s.x&&p.y===s.y));if(other){s.m=other.m;s.x=other.x;s.y=other.y;result='tunnel';if(!has(s.visited,s.m))s.visited.push(s.m)}else if(tid==='15'||(pair.length===1&&W.pending.indexOf(tid)>=0&&s.m==='core')){result='ending';ev.push('ending')}}}
 for(const Z of W.maps[s.m].zones)if(Z.exit&&Z.exit[0]===s.x&&Z.exit[1]===s.y&&!has(s.cleared,Z.id)){s.cleared.push(Z.id);ev.push('cleared')}
 const zr=enterZone(W,s);if(zr==='zone')ev.push('zone');
 if(W.goal&&s.m===W.goal.m&&s.x===W.goal.x&&s.y===W.goal.y)result='goal';
 return{state:s,result,ev,path,moves}}
// ---------- desert / forest rules (maps with rules:'v2'); mirrors world/check-new.js step() exactly ----------
// quicksand q: robot = sinks (fail); box pushed in = sand bridge '='; bomb pushed in = sinks; dune walking in = bridge.
// Dunes / beetles / sandworm move one cell per counted robot action (move, bump, act) in the robot's zone, turning around when blocked.
// Fire breath (inventory 'F', action key when there is nothing to grab/place): first thing in line — vine -> ash (regrows after REGROW
// actions, waits while something stands on it), ice block K -> floor, beetle -> stunned 3 actions, elder tree -> -1 HP and every
// burnt vine of the zone grows back. Cracked walls are NOT affected. Boss gate G stays shut while the zone's boss has HP.
const inZone=(Z,x,y)=>!!Z&&x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h;
const isEE=(Z,x,y)=>!!Z&&((Z.entry&&Z.entry[0]===x&&Z.entry[1]===y)||(Z.exit&&Z.exit[0]===x&&Z.exit[1]===y));
function duneAt(s,m,x,y){return (s.dunes||[]).findIndex(o=>o.m===m&&o.x===x&&o.y===y)}
function bugAt(s,m,x,y){return (s.bugs||[]).findIndex(o=>o.m===m&&o.x===x&&o.y===y)}
function wormAt(s,m,x,y){return (s.bosses||[]).findIndex(o=>(o.kind==='worm'||o.kind==='frog'||o.kind==='mole')&&o.hp>0&&o.m===m&&o.x===x&&o.y===y)}
function bossBodyAt(s,m,x,y){return (s.bosses||[]).findIndex(o=>o.hp>0&&!o.fly&&o.m===m&&o.x===x&&o.y===y)}
function bossOfZone(W,s,m,x,y){const Z=zoneAt(W,m,x,y);return Z?(s.bosses||[]).find(o=>o.zone===Z.id)||null:null}
function solidV2(W,s,m,x,y){const c=cell(W,s,m,x,y);
 if('#%bKwTR~V○r╱╲☼⊕⊛£Ω'.indexOf(c)>=0)return true; // + core boss body
 // lava is NOT solid here: stepV2 burns the robot; hard()/movers use isLava separately
 if(c==='▤')return !s.lit&&!(s.m===m&&s.x===x&&s.y===y);
 if(c==='▣')return !s.pw&&!(s.m===m&&s.x===x&&s.y===y);
 if(c==='¤'||c==='¢')return gateShut(s,c)&&!(s.m===m&&s.x===x&&s.y===y);
 if(c==='D')return !switchDoorOpen(W,s,m,x,y)&&!(s.m===m&&s.x===x&&s.y===y);
 if(c==='G'){const b=bossOfZone(W,s,m,x,y);return !!(b&&b.hp>0)}
 if((c==='C'||c==='M'||c==='N')&&!hasInv(s,c.toLowerCase()))return true;
 return false}
const gateShut=(s,c)=>{const ph=(s.zt%4)<2;return c==='¤'?!ph:c==='¢'?ph:false};
const pendAt=(W,s,m,x,y)=>{if(W.maps[m].theme!=='clock')return false;const c=cell(W,s,m,x,y);return (c==='n'&&s.zt%2===1)||(c==='s'&&s.zt%2===0&&s.zt>0)};
const MIR={'╱':'/','╲':'\\'};

const LAVA='h}{)(',TRK='-|/\\jǰ',isLava=c=>LAVA.indexOf(c)>=0,isTrk=c=>TRK.indexOf(c)>=0;
function turnTrack(t,d){if(t==='/'||t==='j')return [3,2,1,0][d];if(t==='\\'||t==='ǰ')return [2,3,0,1][d];return d} // d: 0u 1d 2l 3r
const FLOWDIR={'(':0,')':1,'{':2,'}':3}; // flow tile -> DV index
const CUR={'↑':0,'↓':1,'←':2,'→':3},WND={'⇑':0,'⇓':1,'⇐':2,'⇒':3};
const cloudAt=(s,m,x,y)=>(s.clouds||[]).findIndex(o=>o.m===m&&o.x===x&&o.y===y);
const lvOf=(s,Z)=>Z&&s.lvz?s.lvz[Z.id]|0:0;
const spikeUp=(W,s,m,x,y,Z)=>{if(W.maps[m].theme!=='castle')return false;const c=cell(W,s,m,x,y),lv=lvOf(s,Z||zoneAt(W,m,x,y));return (c==='t'&&!lv)||(c==='u'&&!!lv)};
const trapOpen=(W,s,m,x,y,Z)=>{if(W.maps[m].theme!=='castle')return false;const c=cell(W,s,m,x,y);return c==='d'&&!!lvOf(s,Z||zoneAt(W,m,x,y))};
// sky void ',' is a hole ONLY on the sky map; elsewhere ',' is rubble floor from broken cracked walls (desert/forest/... as live)
const isVoid=(W,s,m,x,y)=>W.maps[m].theme==='sky'&&cell(W,s,m,x,y)===','&&cloudAt(s,m,x,y)<0;
const hazardV2=(W,s,m,x,y,Z)=>spikeUp(W,s,m,x,y,Z)||trapOpen(W,s,m,x,y,Z)||isVoid(W,s,m,x,y)||pendAt(W,s,m,x,y);
const occV2=(s,m,x,y)=>boxAt(s,m,x,y)>=0||bombAt(s,m,x,y)>=0||duneAt(s,m,x,y)>=0||bugAt(s,m,x,y)>=0||bossBodyAt(s,m,x,y)>=0;
const itemHere=(W,s,m,x,y)=>{const c=base(W,m,x,y);if(W.maps[m].theme==='clock'&&(c==='n'||c==='s'))return false;return !!ITEMS[c]&&!has(s.got,K(m,x,y))};
const placeV2=(W,s,m,x,y,c)=>{if(isTrk(c)||c in CUR||c==='r')return false;if(c===',')return W.maps[m].theme==='sky'?cloudAt(s,m,x,y)>=0:true;/* rubble placeable off-sky, as live */return '.=Xa_pl═'.indexOf(c)>=0||c==='┊'||(c in WND)||(!!ITEMS[c]&&has(s.got,K(m,x,y)))};
function curZone(W,s){return s.zone?W.maps[s.m].zones.find(z=>z.id===s.zone)||null:null}
// light beams + power circuits for the robot's current zone
function recomputeV2(W,s,Z){if(!Z){s.lit=0;s.pw=0;s.gen=0;s.bounce={};return}
 const m=s.m,lit={},bounce={},TG=[];
 for(let y=Z.y;y<Z.y+Z.h;y++)for(let x=Z.x;x<Z.x+Z.w;x++){const c=cell(W,s,m,x,y);if(c==='◎')TG.push([x,y]);
  if(c==='☼'){for(let d0=0;d0<4;d0++){let cx=x,cy=y,d=d0,b=0;for(let g=0;g<80;g++){const nx=cx+DV[d][0],ny=cy+DV[d][1];if(!inZone(Z,nx,ny))break;const t=cell(W,s,m,nx,ny);
   if(t in MIR){d=turnTrack(MIR[t],d);cx=nx;cy=ny;b=1;continue}
   if('#%bKwTR~V○r╱╲☼⊕⊛£Ω'.indexOf(t)>=0||boxAt(s,m,nx,ny)>=0||bombAt(s,m,nx,ny)>=0||(t==='D'&&!switchDoorOpen(W,s,m,nx,ny)))break;
   const k=K(m,nx,ny);lit[k]=1;if(b)bounce[k]=1;cx=nx;cy=ny}}}}
 s.lit=TG.length>0&&TG.every(([x,y])=>lit[K(m,x,y)])?1:0;s.bounce=bounce;s.beamLit=lit;
 let pw=0;const seen={},st=[];
 for(let y=Z.y;y<Z.y+Z.h;y++)for(let x=Z.x;x<Z.x+Z.w;x++)if(cell(W,s,m,x,y)==='⊛'){st.push([x,y]);seen[K(m,x,y)]=1}
 s.gen=st.length?1:0;
 while(st.length){const [x,y]=st.pop();for(let d=0;d<4;d++){const nx=x+DV[d][0],ny=y+DV[d][1];if(!inZone(Z,nx,ny))continue;const k=K(m,nx,ny);if(seen[k])continue;const t=cell(W,s,m,nx,ny);
  if(t==='▣'){pw=1;continue}if(t==='═'||(t==='┊'&&boxAt(s,m,nx,ny)>=0)){seen[k]=1;st.push([nx,ny])}}}
 s.pw=pw;
 for(const b of (s.bosses||[])){if(b.kind!=='phantom'||b.hp<=0||b.zone!==Z.id)continue;const k=K(m,b.x,b.y);
  if(bounce[k]){if(!b.lit){b.hp--;b.hitAt=s.steps;b.lit=1}}else b.lit=0}}
function breathe(W,s,ev){const m=s.m,M=W.maps[m],Z=curZone(W,s);let x=s.x,y=s.y,d={up:0,down:1,left:2,right:3}[s.f];if(M.theme==='volcano'){ev.push('noeffect');s.lastFire={m,x0:s.x,y0:s.y,x1:s.x,y1:s.y,f:s.f,noop:1};return}ev.push('fire');
 for(let g=0;g<80;g++){x+=DV[d][0];y+=DV[d][1];if(Z?!inZone(Z,x,y):(x<0||y<0||x>=M.W||y>=M.H))break;const k=K(m,x,y),c=cell(W,s,m,x,y);
  if(c in MIR){d=turnTrack(MIR[c],d);continue}
  if(c==='w'){s.ch[k]='a';s.vt[k]=REGROW;ev.push('burn');break}
  if(c==='K'){s.ch[k]='.';ev.push('melt');break}
  const bi=bugAt(s,m,x,y);if(bi>=0){s.bugs[bi].fr=3;ev.push('stun');break}
  const tb=(s.bosses||[]).find(o=>o.kind==='tree'&&o.hp>0&&o.m===m&&o.x===x&&o.y===y);
  if(tb){tb.hp--;tb.hitAt=s.steps;ev.push('bosshit');for(const kk of Object.keys(s.vt)){const [mm,xy]=kk.split(':'),[vx,vy]=xy.split(',').map(Number);if(mm===m&&(!Z||inZone(Z,vx,vy))){delete s.ch[kk];delete s.vt[kk];ev.push('regrow')}}
   if(tb.hp<=0){s.ch[k]='.';ev.push('bossdown')}break}
  if(solidV2(W,s,m,x,y)||occV2(s,m,x,y))break}
 s.lastFire={m,x0:s.x,y0:s.y,x1:x,y1:y,f:s.f}}
// everything that moves takes one step (after the robot). Returns 'caught' if a beetle walks into the robot.
function moveV2(W,s,Z,ev){const m=s.m,P=(x,y)=>x===s.x&&y===s.y,nxt=o=>[o.x+DV[o.d][0],o.y+DV[o.d][1]],bad=c=>c==='q'||c==='~'||isLava(c);
 for(const du of s.dunes.slice()){if(du.m!==m||du.zone!==Z.id)continue;const [nx,ny]=nxt(du),c=cell(W,s,m,nx,ny);
  const blocked=!inZone(Z,nx,ny)||P(nx,ny)||isEE(Z,nx,ny)||(c!=='D'&&solidV2(W,s,m,nx,ny))||(c==='D'&&!switchDoorOpen(W,s,m,nx,ny))||occV2(s,m,nx,ny)||itemHere(W,s,m,nx,ny);
  if(blocked){du.d^=1;continue}
  if(c==='q'){s.dunes.splice(s.dunes.indexOf(du),1);s.ch[K(m,nx,ny)]='=';(s.sunk=s.sunk||[]).push({m,x:nx,y:ny,dune:1});ev.push('dunesink');continue}
  du.x=nx;du.y=ny}
 for(const bg of s.bugs){if(bg.m!==m||bg.zone!==Z.id)continue;if(bg.fr>0){bg.fr--;bg.spotted=0;continue}
  // armor ghost: look left/right along the row; clear line + no raised spike → face robot and show !
  if(bg.ghost){bg.spotted=0;for(const dd of [2,3]){let x=bg.x+DV[dd][0],y=bg.y+DV[dd][1];
   while(inZone(Z,x,y)&&!solidV2(W,s,m,x,y)&&boxAt(s,m,x,y)<0&&bombAt(s,m,x,y)<0&&!spikeUp(W,s,m,x,y,Z)){if(P(x,y)){bg.d=dd;bg.spotted=1;break}x+=DV[dd][0];y+=DV[dd][1]}}}
  const [nx,ny]=nxt(bg);
  if(isEE(Z,nx,ny)){bg.d^=1;continue}
  if(P(nx,ny))return 'caught';
  const hazNoPend=spikeUp(W,s,m,nx,ny,Z)||trapOpen(W,s,m,nx,ny,Z)||isVoid(W,s,m,nx,ny);
  if(!inZone(Z,nx,ny)||solidV2(W,s,m,nx,ny)||occV2(s,m,nx,ny)||bad(cell(W,s,m,nx,ny))||hazNoPend||itemHere(W,s,m,nx,ny)){bg.d^=1;continue}bg.x=nx;bg.y=ny}
 for(const b of s.bosses){if(b.hp<=0||b.m!==m||b.zone!==Z.id)continue;
  if(b.kind==='phantom'){ // mirror king: vertical follows, horizontal mirrors; only when robot moved
   continue} // handled after loop with last move dir
  if(b.kind==='knight'||(b.kind==='spark'&&b.knight)||(b.kind==='glitch'&&b.knight)){b.spotted=0;for(const dd of [2,3]){let x=b.x+DV[dd][0],y=b.y+DV[dd][1];
   while(inZone(Z,x,y)&&!solidV2(W,s,m,x,y)&&boxAt(s,m,x,y)<0){if(P(x,y)){b.d=dd;b.spotted=1;break}x+=DV[dd][0];y+=DV[dd][1]}}}
  if(b.kind==='spark'&&b.needPw&&!s.gen)continue;
  if(!(b.kind==='worm'||b.kind==='frog'||b.kind==='mole'||b.kind==='crab'||b.kind==='knight'||b.kind==='bird'||b.kind==='spark'||b.kind==='glitch'))continue;
  const [nx,ny]=nxt(b);
  if((b.kind==='knight'||b.kind==='spark'||b.kind==='glitch')&&P(nx,ny))return 'caught';
  if(b.fly){const flyBlocked=!inZone(Z,nx,ny)||P(nx,ny)||isEE(Z,nx,ny)||cloudAt(s,m,nx,ny)>=0||cell(W,s,m,nx,ny)!==','||boxAt(s,m,nx,ny)>=0||bugAt(s,m,nx,ny)>=0;
   if(flyBlocked)b.d^=1;else{b.x=nx;b.y=ny};continue}
  const haz=hazardV2(W,s,m,nx,ny,Z);
  const blocked=!inZone(Z,nx,ny)||P(nx,ny)||isEE(Z,nx,ny)||solidV2(W,s,m,nx,ny)||boxAt(s,m,nx,ny)>=0||duneAt(s,m,nx,ny)>=0||bugAt(s,m,nx,ny)>=0||bad(cell(W,s,m,nx,ny))||haz;
  if(blocked)b.d^=1;else{b.x=nx;b.y=ny}}
 // drifting cooled-lava rocks on flowing magma
 s.rocks=(s.rocks||[]).map(r=>{if(r.m!==m||!inZone(Z,r.x,r.y))return r;const t=cell(W,s,m,r.x,r.y),d=FLOWDIR[t];if(d==null){s.ch[K(m,r.x,r.y)]='_';ev.push('cool');return null}
  const nx=r.x+DV[d][0],ny=r.y+DV[d][1],nc=cell(W,s,m,nx,ny);
  if(inZone(Z,nx,ny)&&nc==='h'){s.ch[K(m,nx,ny)]='_';ev.push('cool');return null}
  if(inZone(Z,nx,ny)&&isLava(nc)&&!(s.rocks||[]).some(o=>o&&o.x===nx&&o.y===ny))return{m,x:nx,y:ny};
  s.ch[K(m,r.x,r.y)]='_';ev.push('cool');return null}).filter(Boolean);
 for(const k of Object.keys(s.vt)){const [mm,xy]=k.split(':'),[x,y]=xy.split(',').map(Number);if(mm!==m||!inZone(Z,x,y))continue;
  if(s.vt[k]>0)s.vt[k]--;if(s.vt[k]<=0&&!P(x,y)&&!occV2(s,m,x,y)){delete s.vt[k];delete s.ch[k];ev.push('regrow')}}
 return null}
function stepV2(W,s0,a,opt){const ev=[];const free=!!(opt&&opt.free);
 if(a==='reset')return resetZone(W,s0);
 const s=initMovers(W,clone(s0)),m=s.m,Z=curZone(W,s);let result,path=[],moves=[],counted=true;
 const dirI={up:0,down:1,left:2,right:3},slideCart=(bx,by,d)=>{ // minecart: once on a track, slide to the end in one push
  let x=bx,y=by,dd=d,guard=0;while(guard++<60){const t=cell(W,s,m,x,y);if(!isTrk(t))break;dd=turnTrack(t,dd);const nx=x+DV[dd][0],ny=y+DV[dd][1],nt=cell(W,s,m,nx,ny);
   const wi=wormAt(s,m,nx,ny);if(wi>=0){s.bosses[wi].hp--;s.bosses[wi].hitAt=s.steps;ev.push('bosshit','cart');if(s.bosses[wi].hp<=0)ev.push('bossdown');break}
   if(nt==='%'){s.ch[K(m,nx,ny)]='.';s.broken.push(K(m,nx,ny));ev.push('wall','cart');break}
   if(!isTrk(nt)||(Z&&(isEE(Z,nx,ny)||!inZone(Z,nx,ny)))||occV2(s,m,nx,ny)||(nx===s.x&&ny===s.y)||itemHere(W,s,m,nx,ny))break;
   x=nx;y=ny}s.cart[K(m,x,y)]=dd;return [x,y]};
 if(a==='act'){const [dx,dy]=DIRS[s.f],fx=s.x+dx,fy=s.y+dy,fc=cell(W,s,m,fx,fy),uc=cell(W,s,m,s.x,s.y);
  if(!s.held&&fc==='r'&&Z){s.lvz[Z.id]=lvOf(s,Z)^1;ev.push('lever')}
  else if(!s.held&&(fc in MIR)){s.ch[K(m,fx,fy)]=fc==='╱'?'╲':'╱';ev.push('mirror')} // flip mirror
  else if(!s.held&&(fc==='⊕'||fc==='⊛')){s.ch[K(m,fx,fy)]=fc==='⊕'?'⊛':'⊕';ev.push('gen')} // toggle generator
  else if(!s.held&&(uc==='j'||uc==='ǰ')){s.ch[K(m,s.x,s.y)]=uc==='j'?'ǰ':'j';ev.push('switch')}
  else if(!s.held&&fc==='b'){s.held=1;ev.push('grab')}
  else if(s.held&&(!Z||inZone(Z,fx,fy))&&placeV2(W,s,m,fx,fy,fc)&&!occV2(s,m,fx,fy)&&!isEE(Z,fx,fy)&&!isTrk(fc)){s.bombs.push({m,x:fx,y:fy,t:FUSE,ms:0});s.held=0;ev.push('place')}
  else if(hasInv(s,'F'))breathe(W,s,ev);
  else return{state:s0,result:'noop',ev};
  result='act';s.steps++}
 else{const [dx,dy]=DIRS[a];if(s0.left!=null&&s0.left<=0)return{state:s0,result:'tired',ev,path:[]};
  s.f=a;const nx=s.x+dx,ny=s.y+dy,nc=cell(W,s,m,nx,ny);
  if(solidV2(W,s,m,nx,ny)||duneAt(s,m,nx,ny)>=0||bossBodyAt(s,m,nx,ny)>=0){ev.push('bump');result='bump'}
  else if(bugAt(s,m,nx,ny)>=0){ev.push('caught');return{state:s,result:'fail',ev,path:[]}}
  else if(nc==='q'){s.x=nx;s.y=ny;ev.push('sink');return{state:s,result:'fail',ev,path:[[nx,ny]],sink:true}}
  else if(isLava(nc)){s.x=nx;s.y=ny;ev.push('burn');return{state:s,result:'fail',ev,path:[[nx,ny]]}}
  else{const bi=boxAt(s,m,nx,ny),mi=bombAt(s,m,nx,ny);let ok=true;
   if(bi>=0||mi>=0){const bx=nx+dx,by=ny+dy,bc=cell(W,s,m,bx,by);
    // solid push-stop: water is solid for walking but boxes/bombs sink into it; lava pool cools boxes
    const hard=()=> (solidV2(W,s,m,bx,by)&&bc!=='~'&&!isLava(bc)&&!isVoid(W,s,m,bx,by)&&!trapOpen(W,s,m,bx,by,Z))||occV2(s,m,bx,by)||cloudAt(s,m,bx,by)>=0||isEE(Z,bx,by)||itemHere(W,s,m,bx,by)||(bi>=0&&Z&&!inZone(Z,bx,by));
    if(hard())ok=false;
    else{if(bc==='q'){if(bi>=0){s.boxes.splice(bi,1);s.ch[K(m,bx,by)]='=';(s.sunk=s.sunk||[]).push({m,x:bx,y:by,box:1});ev.push('bridge')}else{s.bombs.splice(mi,1);ev.push('fizzle')}}
     else if(bc==='~'){if(bi>=0)s.boxes.splice(bi,1);else s.bombs.splice(mi,1);ev.push('sink')} // swamp: sink, no bridge
     else if(bc==='h'){if(bi>=0){s.boxes.splice(bi,1);s.ch[K(m,bx,by)]='_';ev.push('cool')}else{s.bombs.splice(mi,1);ev.push('fizzle')}}
     else if(isLava(bc)){if(bi>=0){s.boxes.splice(bi,1);s.rocks.push({m,x:bx,y:by});ev.push('drift')}else{s.bombs.splice(mi,1);ev.push('fizzle')}}
     else if(isVoid(W,s,m,bx,by)||trapOpen(W,s,m,bx,by,Z)){if(bi>=0){s.boxes.splice(bi,1);if(trapOpen(W,s,m,bx,by,Z))s.ch[K(m,bx,by)]='.';ev.push(trapOpen(W,s,m,bx,by,Z)?'fill':'fall')}else{s.bombs.splice(mi,1);ev.push('fizzle')}}
     else if(bi>=0&&isTrk(bc)){const d=dirI[a],[cx,cy]=slideCart(bx,by,d);s.boxes[bi]=K(m,cx,cy);ev.push('push','cart')}
     else if(bi>=0){s.boxes[bi]=K(m,bx,by);if(s.cart)delete s.cart[K(m,nx,ny)]}
     else{s.bombs[mi].x=bx;s.bombs[mi].y=by}
     moves.push([[nx,ny],[bx,by]]);if(ev.indexOf('push')<0)ev.push('push')}}
   if(!ok){ev.push('bump');result='bump'}
   else{ // leave yellow lily → deep water
    if(cell(W,s,m,s.x,s.y)==='l'){s.ch[K(m,s.x,s.y)]='~';ev.push('sinkpad')}
    s.lt=0;s.x=nx;s.y=ny;pickup(W,s,ev);path=[[nx,ny]];result='move';
    // wind: slide to the end in one move (like ice)
    for(let g=0;g<40;g++){const wt=cell(W,s,m,s.x,s.y);if(!(wt in WND))break;const wd=WND[wt],wx=s.x+DV[wd][0],wy=s.y+DV[wd][1];
     if(bugAt(s,m,wx,wy)>=0){ev.push('caught');return{state:s,result:'fail',ev,path,moves}}
     if(wx<0||wy<0||wx>=W.maps[m].W||wy>=W.maps[m].H||solidV2(W,s,m,wx,wy)||occV2(s,m,wx,wy)||cloudAt(s,m,wx,wy)>=0)break;
     s.x=wx;s.y=wy;pickup(W,s,ev);path.push([wx,wy]);ev.push('wind')}
    if(cell(W,s,m,s.x,s.y)===':'){s.ch[K(m,s.x,s.y)]='¹';s.cf=K(m,s.x,s.y);ev.push('crumble')}
    if(!free){if(s.left!=null)s.left--;s.steps++}}}}
 // after a counted action: currents/clouds, lily timer, crumble, movers, hazards
 if(!free&&(result==='move'||result==='bump'||result==='act')){
  // sea currents: push robot (unless bubble helmet), bombs, boxes
  if(s.air>0)s.air--;
  else if(Z){const ct=cell(W,s,m,s.x,s.y);if(ct in CUR){const d=CUR[ct],cx=s.x+DV[d][0],cy=s.y+DV[d][1];
   if(bugAt(s,m,cx,cy)>=0){ev.push('caught');return{state:s,result:'fail',ev,path,moves}}
   if(inZone(Z,cx,cy)&&!solidV2(W,s,m,cx,cy)&&!occV2(s,m,cx,cy)&&!isEE(Z,cx,cy)){s.x=cx;s.y=cy;pickup(W,s,ev);ev.push('current')}}}
  if(Z){for(const b of s.bombs){if(b.m!==m||!inZone(Z,b.x,b.y))continue;const t=cell(W,s,m,b.x,b.y);if(!(t in CUR))continue;const d=CUR[t],nx=b.x+DV[d][0],ny=b.y+DV[d][1];
   if(inZone(Z,nx,ny)&&!(nx===s.x&&ny===s.y)&&!solidV2(W,s,m,nx,ny)&&!occV2(s,m,nx,ny)&&!isEE(Z,nx,ny)){b.x=nx;b.y=ny}}
   s.boxes=s.boxes.map(k=>{if(!k.startsWith(m+':'))return k;const [x,y]=k.split(':')[1].split(',').map(Number);if(Z&&!inZone(Z,x,y))return k;const t=cell(W,s,m,x,y);if(!(t in CUR))return k;const d=CUR[t],nx=x+DV[d][0],ny=y+DV[d][1];
    if(inZone(Z,nx,ny)&&!(nx===s.x&&ny===s.y)&&!solidV2(W,s,m,nx,ny)&&!occV2(s,m,nx,ny)&&!isEE(Z,nx,ny)&&cell(W,s,m,nx,ny)!=='~')return K(m,nx,ny);return k})}
  // clouds drift on sky; carry the robot
  if(Z)for(const cl of (s.clouds||[])){if(cl.m!==m||cl.zone!==Z.id)continue;const nx=cl.x+DV[cl.d][0],ny=cl.y+DV[cl.d][1];
   const ok=inZone(Z,nx,ny)&&cell(W,s,m,nx,ny)===','&&cloudAt(s,m,nx,ny)<0&&!((s.bosses||[]).some(o=>o.hp>0&&o.m===m&&o.x===nx&&o.y===ny));
   if(!ok){cl.d^=1;continue}if(s.x===cl.x&&s.y===cl.y){s.x=nx;s.y=ny}cl.x=nx;cl.y=ny}
  if(result!=='move'||s.x===s0.x&&s.y===s0.y){if(cell(W,s,m,s.x,s.y)==='l'&&++s.lt>=2){ev.push('sink');return{state:s,result:'fail',ev,path,moves}}}
  for(const k of Object.keys(s.ch)){if(k===s.cf)continue;if(s.ch[k]==='¹')s.ch[k]='²';else if(s.ch[k]==='²'){s.ch[k]='○';const [mm,xy]=k.split(':'),[x,y]=xy.split(',').map(Number);const bi=boxAt(s,mm,+x,+y);if(bi>=0)s.boxes.splice(bi,1);ev.push('collapse')}}
  s.cf=null;
  if(cell(W,s,m,s.x,s.y)==='○'){ev.push('fall');return{state:s,result:'fail',ev,path,moves}}
  s.zt=(s.zt||0)+1;
  // phantom: on any directional action (incl. bump), vertical follows / horizontal mirrors
  if(Z&&a!=='act'&&a!=='reset'&&(result==='move'||result==='bump')){const md={up:0,down:1,left:2,right:3}[a];
   for(const b of (s.bosses||[])){if(b.kind!=='phantom'||b.hp<=0||b.m!==m||b.zone!==Z.id)continue;
    const pd=md<2?md:(md^1),nx=b.x+DV[pd][0],ny=b.y+DV[pd][1];
    if(nx===s.x&&ny===s.y){ev.push('caught');return{state:s,result:'fail',ev,path,moves}}
    if(inZone(Z,nx,ny)&&!solidV2(W,s,m,nx,ny)&&!occV2(s,m,nx,ny)&&!isEE(Z,nx,ny)&&!hazardV2(W,s,m,nx,ny,Z)){b.x=nx;b.y=ny;b.d=pd}
    if(b.x===s.x&&b.y===s.y){ev.push('caught');return{state:s,result:'fail',ev,path,moves}}}}
  if(Z&&moveV2(W,s,Z,ev)==='caught'){ev.push('caught');return{state:s,result:'fail',ev,path,moves}}
  // pendulums swat bugs
  if(Z)s.bugs=s.bugs.filter(b=>!(b.m===m&&inZone(Z,b.x,b.y)&&pendAt(W,s,m,b.x,b.y)));
  if(Z)recomputeV2(W,s,Z);
  if(Z&&hazardV2(W,s,m,s.x,s.y,Z)){ev.push(spikeUp(W,s,m,s.x,s.y,Z)?'spike':trapOpen(W,s,m,s.x,s.y,Z)?'trap':pendAt(W,s,m,s.x,s.y)?'pend':'fall');return{state:s,result:'fail',ev,path,moves}}
  {const gc=cell(W,s,m,s.x,s.y);if((gc==='¤'||gc==='¢')&&gateShut(s,gc)){ev.push('gate');return{state:s,result:'fail',ev,path,moves}}}
  if((s.bugs||[]).some(b=>b.m===m&&b.x===s.x&&b.y===s.y)){ev.push('caught');return{state:s,result:'fail',ev,path,moves}}
  if((s.bosses||[]).some(b=>b.kind==='phantom'&&b.hp>0&&b.m===m&&b.x===s.x&&b.y===s.y)){ev.push('caught');return{state:s,result:'fail',ev,path,moves}}
  if(ev.indexOf('bosshit')>=0&&Z){const b=bossOfZone(W,s,m,Z.entry?Z.entry[0]:s.x,Z.entry?Z.entry[1]:s.y)||(s.bosses||[]).find(o=>o.zone===Z.id);
   if(b){const perm={};for(const k in s.ch){const v=s.ch[k];if(v==='_'||v==='.'||v===',' )perm[k]=v}
    s.bossCp={zone:Z.id,hp:b.hp,ch:perm,broken:s.broken.filter(k=>k.startsWith(m+':')),litAt:performance.now?0:0};ev.push('bosscheck')}}
 }
 if(result!=='move')return{state:s,result,ev,path:result==='act'?[]:path,moves};
 const c=base(W,s.m,s.x,s.y);
 {const tid=tunAt(W,s.m,s.x,s.y);if(tid){const pair=W.tunnels[tid]||[];const other=pair.find(p=>!(p.m===s.m&&p.x===s.x&&p.y===s.y));if(other){s.m=other.m;s.x=other.x;s.y=other.y;result='tunnel';if(!has(s.visited,s.m))s.visited.push(s.m)}else if(tid==='15'||(pair.length===1&&W.pending.indexOf(tid)>=0&&s.m==='core')){result='ending';ev.push('ending')}}}
 for(const Z2 of W.maps[s.m].zones)if(Z2.exit&&Z2.exit[0]===s.x&&Z2.exit[1]===s.y&&!has(s.cleared,Z2.id)){s.cleared.push(Z2.id);ev.push('cleared')}
 const zr=enterZone(W,s);if(zr==='zone')ev.push('zone');
 if(W.goal&&s.m===W.goal.m&&s.x===W.goal.x&&s.y===W.goal.y)result='goal';
 return{state:s,result,ev,path,moves}}

// real-time fuses: the game calls advance(dtMs) every frame (paused while title/help/menu is open).
// Each bomb keeps its own ms; t = number shown (3,2,1,0); at FUSE_MS it explodes (blast hurts the robot as before).
function advance(W,s0,dt){if(!s0.bombs.length)return{state:s0,result:'none',ev:[]};const s=clone(s0),ev=[];
 for(const b of s.bombs){b.ms=(b.ms||0)+dt;b.t=Math.max(1,FUSE-Math.floor(b.ms/1000))}
 const boom=s.bombs.filter(b=>b.ms>=FUSE_MS),later=s.bombs.filter(b=>b.ms<FUSE_MS);
 if(boom.length){boom.forEach(b=>b.t=1);s.bombs=boom;tick(W,s,ev,null);s.bombs=later}
 if(s.hurt){delete s.hurt;return{state:s,result:'fail',ev}}return{state:s,result:boom.length?'blast':'tick',ev}}
function resetZone(W,s0){if(!s0.zone)return{state:s0,result:'noop',ev:[]};const M=W.maps[s0.m],Z=M.zones.find(z=>z.id===s0.zone);const s=clone(s0);
 const inZ=k=>{const [m,xy]=k.split(':');const [x,y]=xy.split(',').map(Number);return m===s.m&&x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h};
 const cp=s.bossCp&&s.bossCp.zone===Z.id?s.bossCp:null; // volcano (and other mini-bosses): stage save keeps hp + permanent terrain
 s.boxes=s.boxes.filter(k=>!inZ(k)).concat(W.boxes0.filter(inZ));s.bombs=s.bombs.filter(b=>!inZ(K(b.m,b.x,b.y)));
 s.broken=s.broken.filter(k=>!inZ(k));s.holes=s.holes.filter(k=>!inZ(k));s.filled=s.filled.filter(k=>!inZ(k));
 s.got=s.got.filter(k=>!(inZ(k)&&ITEMS[base(W,s.m,+k.split(':')[1].split(',')[0],+k.split(',')[1])]==='battery')); // batteries respawn; keys/items stay
 if(!Z)return{state:s,result:"nothing",ev:[]};resetPats(W,s,Z.id);initMovers(W,s);
 const back=(cur,init)=>cur.filter(o=>o.zone!==Z.id).concat(init.filter(o=>o.zone===Z.id).map(o=>({...o}))).sort((a,b)=>a.i-b.i);
 s.dunes=back(s.dunes,W.dunes0);s.bugs=back(s.bugs,W.bugs0);s.bosses=back(s.bosses,W.bosses0);
 s.rocks=(s.rocks||[]).filter(r=>r.m!==s.m||!inZ(K(r.m,r.x,r.y)));s.lt=0;s.cf=null;s.cart={};s.air=0;
 s.clouds=back(s.clouds||[],W.clouds0||[]);if(s.lvz)delete s.lvz[Z.id];s.zt=0;s.lit=0;s.pw=0;s.gen=0;s.bounce={};
 for(const k in s.ch)if(inZ(k))delete s.ch[k];for(const k in s.vt)if(inZ(k))delete s.vt[k];
 if(cp){Object.assign(s.ch,cp.ch);for(const k of cp.broken)if(!has(s.broken,k))s.broken.push(k);const b=s.bosses.find(o=>o.zone===Z.id);if(b){b.hp=cp.hp}}
 [s.x,s.y]=Z.entry||s.zoneEntry;s.held=0;s.left=Z.limit?Z.limit+(hasInv(s,'U')?10:0):null;return{state:s,result:'reset',ev:['reset']}}
// ---------- solver ----------
// Solver fuse model (real game is time-based ~3.0s ≈ 6+ moves for a slow 2 moves/s player): the robot gets at most FUSE_MODEL (4) actions between placing and the blast;
// 'wait' lets the bomb tick without moving. Placing doesn't tick the new bomb.
function mstep(W,s,a){if(a==='wait'){if(!s.bombs.length)return{state:s,result:'noop',ev:[]};const n=clone(s),ev=[];tick(W,n,ev,null);if(n.hurt)return{state:n,result:'fail',ev};return{state:n,result:'wait',ev}}
 const r=step(W,s,a);if(['noop','fall','tired','fail','reset'].indexOf(r.result)>=0||!r.state.bombs.length)return r;
 const n=r.state===s?clone(s):r.state,ev=r.ev.slice();const fresh=ev.indexOf('place')>=0?n.bombs[n.bombs.length-1]:null;if(fresh)fresh.t=FUSE_MODEL;tick(W,n,ev,fresh);
 if(n.hurt){delete n.hurt;return Object.assign({},r,{state:n,result:'fail',ev})}return Object.assign({},r,{state:n,ev})}
// Solver-only normalisation (sound because every zone can be reset): zones other than the current one are either
// CLEARED (exit reached: contents dropped, doors open) or back to their initial contents.
function normalize(W,s){if(!W.solverAbstract)return s;const n=clone(s);const cur=s.zone;
 const zoneOf=k=>{const [m,xy]=k.split(':');const [x,y]=xy.split(',').map(Number);return zoneAt(W,m,x,y)};
 const keep=k=>{const Z=zoneOf(k);return !Z||Z.id===cur};
 n.boxes=n.boxes.filter(k=>{const Z=zoneOf(k);return !Z||Z.id===cur}).concat(W.boxes0.filter(k=>{const Z=zoneOf(k);return Z&&Z.id!==cur&&!has(n.cleared,Z.id)}));
 n.bombs=n.bombs.filter(b=>keep(K(b.m,b.x,b.y)));n.broken=n.broken.filter(keep);n.holes=n.holes.filter(keep);n.filled=n.filled.filter(keep);return n}
function key(s){return [s.m,s.x,s.y,s.f,s.held,s.inv,s.got.slice().sort().join(';'),s.boxes.slice().sort().join(';'),s.bombs.map(b=>K(b.m,b.x,b.y)+'t'+b.t).sort().join(';'),s.broken.slice().sort().join(';'),s.holes.slice().sort().join(';'),s.filled.slice().sort().join(';'),s.left,s.zone,s.cleared.slice().sort().join(';'),(s.pats||[]).map(p=>p.i+'@'+p.x+','+p.y+(p.d>0?'+':'-')).join(';'),[s.dunes,s.bugs,s.bosses].map(a=>(a||[]).map(o=>o.i+'@'+o.x+','+o.y+'d'+o.d+'f'+(o.fr||0)+'h'+(o.hp||0)).join(';')).join('/'),Object.keys(s.ch||{}).sort().map(k=>k+s.ch[k]).join(';'),Object.keys(s.vt||{}).sort().map(k=>k+'='+s.vt[k]).join(';'),(s.rocks||[]).map(r=>r.m+':'+r.x+','+r.y).sort().join(';'),s.lt||0,s.cf||'',s.cart&&Object.keys(s.cart).sort().map(k=>k+':'+s.cart[k]).join(';')||'',s.bossCp?s.bossCp.zone+':'+s.bossCp.hp:'',s.air||0,s.lvz&&Object.keys(s.lvz).sort().map(k=>k+s.lvz[k]).join(';')||'',(s.clouds||[]).map(o=>o.i+'@'+o.x+','+o.y+'d'+o.d).join(';'),s.zt||0,s.lit||0,s.pw||0,s.gen||0,(s.bosses||[]).filter(o=>o.kind==='phantom').map(o=>(o.lit?1:0)).join('')].join('|')}
const ACTIONS=['up','down','left','right','act','reset','wait'];
// explore the whole reachable state graph; returns {states, edges, startKey}
function explore(W,start,max){max=max||400000;const s0=start||initState(W);const k0=key(s0);const states=new Map([[k0,s0]]),edges=new Map(),q=[k0];let trunc=false;
 while(q.length){const k=q.shift(),s=states.get(k),out=[];for(const a of ACTIONS){const r=mstep(W,s,a);if(r.result==='noop'||r.result==='fall'||r.result==='tired'||r.result==='fail'||r.state===s)continue;const ns=normalize(W,r.state),nk=key(ns);out.push([a,nk]);if(!states.has(nk)){if(states.size>=max){trunc=true;continue}states.set(nk,ns);q.push(nk)}}edges.set(k,out)}
 return{states,edges,startKey:k0,truncated:trunc}}
function bfsPath(W,start,pred,max){const s0=start||initState(W);const k0=key(s0);const prev=new Map([[k0,null]]),q=[[k0,s0]];let n=0;
 while(q.length){const [k,s]=q.shift();if(pred(s))return path(prev,k);if(++n>(max||400000))return null;for(const a of ACTIONS){const r=mstep(W,s,a);if(r.result==='noop'||r.result==='fall'||r.result==='tired'||r.result==='fail'||r.state===s)continue;const ns=normalize(W,r.state),nk=key(ns);if(!prev.has(nk)){prev.set(nk,[k,a]);q.push([nk,ns])}}}return null}
function path(prev,k){const p=[];while(prev.get(k)){const [pk,a]=prev.get(k);p.unshift(a);k=pk}return p}
// soft-lock check: every reachable state must still be able to reach a state satisfying goalPred
function softlocks(W,goalPred,start,max){const G=explore(W,start,max);const rev=new Map();for(const [k,out] of G.edges)for(const [,nk] of out){if(!rev.has(nk))rev.set(nk,[]);rev.get(nk).push(k)}
 const ok=new Set(),q=[];for(const [k,s] of G.states)if(goalPred(s)){ok.add(k);q.push(k)}
 while(q.length){const k=q.pop();for(const pk of rev.get(k)||[])if(!ok.has(pk)){ok.add(pk);q.push(pk)}}
 const bad=[...G.states.keys()].filter(k=>!ok.has(k));return{reachable:G.states.size,goalReached:ok.size>0&&q.length===0&&[...ok].some(k=>goalPred(G.states.get(k))),softlocked:bad.length,example:bad[0]?G.states.get(bad[0]):null,truncated:G.truncated,G}}
// stuck check for a puzzle area: can it still be cleared WITHOUT ↺?  true = provably stuck, false = still solvable, null = unknown (bound hit / patrols).
// Searches the full in-area state space with the real step rules (mstep). Walking out of the area is modelled as "come straight back with the
// step limit refilled" (areas are self-contained: nothing outside changes what's inside). Only returns true after exhausting every state.
function zoneStuck(W,s0,max){const M=W.maps[s0.m],Z=s0.zone&&M&&M.zones.find(z=>z.id===s0.zone);if(!Z||!Z.exit||has(s0.cleared,Z.id))return false;
 const inZ=s=>s.m===s0.m&&s.x>=Z.x&&s.x<Z.x+Z.w&&s.y>=Z.y&&s.y<Z.y+Z.h,pats=(s0.pats||[]).some(p=>p.zone===Z.id)||(s0.dunes||[]).concat(s0.bugs||[],s0.bosses||[]).some(o=>o.zone===Z.id);
 max=max||60000;const seen=new Set([key(s0)]),q=[s0];
 for(let qi=0;qi<q.length;qi++){const s=q[qi];
  for(const a of ACTIONS){if(a==='reset')continue;const r=mstep(W,s,a);if(r.result==='noop'||r.result==='fail'||r.result==='fall'||r.state===s)continue;let ns=r.state;
   if(has(ns.cleared,Z.id))return false;
   if(!inZ(ns)){if(pats||ns.inv!==s.inv)return null;ns=clone(s);ns.left=Z.limit?Z.limit+(hasInv(s,'U')?10:0):null} // left the area: back in, fresh step limit
   const k=key(ns);if(seen.has(k))continue;if(seen.size>=max)return null;seen.add(k);q.push(ns)}}
 return true}
const api={zoneStuck,isTrk,isLava,turnTrack,isTun,tunId,tunAt,stepV2,solidV2,recomputeV2,gateShut,pendAt,MIR,duneAt,bugAt,wormAt,bossOfZone,initMovers,REGROW,mstep,patAt,resetPats,normalize,parseWorld,initState,step,advance,FUSE_MS,cell,base,zoneAt,solid,explore,bfsPath,softlocks,key,hasInv,DIRS,FUSE,ITEMS,switchDoorOpen,bombAt,boxAt,K,cloudAt,spikeUp,trapOpen,hazardV2,CUR,WND};
if(typeof module!=='undefined')module.exports=api;else root.WorldEngine=api;
})(this);
