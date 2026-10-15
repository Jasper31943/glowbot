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
 const W={maps:{},start:null,tunnels:{},boxes0:[],pats0:[],dunes0:[],bugs0:[],bosses0:[],tunnelTo:def.tunnelTo||{},errors:[],hints:def.hints||[],goal:def.goal||null,runeItem:def.runeItem||null,pending:def.pendingTunnels||[]};
 for(const id in def.maps){const md=def.maps[id];const g=md.grid.map(r=>r.split(''));const H=g.length,Wd=Math.max(...md.grid.map(r=>r.length));
  const m={id,name:md.name,theme:md.theme||'grass',rules:md.rules||null,grid:g,W:Wd,H,zones:[]};const v2=m.rules==='v2';
  for(let y=0;y<H;y++)for(let x=0;x<Wd;x++){const c=g[y][x]||'#';g[y][x]=c;
   if(c==='S'){W.start={m:id,x,y};g[y][x]='.'}
   if(c==='B'){W.boxes0.push(id+':'+x+','+y);g[y][x]='.'}
   if(c==='P'){W.pats0.push({m:id,x,y});g[y][x]='.'}
   if(v2){ // desert/forest movers (see world/check-new.js): dunes < > ^ v, beetles z Z y, bosses Y (sandworm, moves) / T (elder tree, stays a tile)
    if(c in DCH){W.dunes0.push({m:id,x,y,d:DCH[c]});g[y][x]='.'}
    else if(c==='z'||c==='Z'||c==='y'){W.bugs0.push({m:id,x,y,d:c==='z'?3:c==='Z'?2:1,fr:0});g[y][x]='.'}
    else if(c==='Y'){W.bosses0.push({m:id,x,y,d:3,hp:2,max:2,kind:'worm'});g[y][x]='.'}
    else if(c==='T')W.bosses0.push({m:id,x,y,d:0,hp:3,max:3,kind:'tree'});
    else if(c==='f')g[y][x]='F'}
   if(isTun(c))(W.tunnels[tunId(c)]=W.tunnels[tunId(c)]||[]).push({m:id,x,y,c})}
  // zones given 1-based inclusive {r1,r2,c1,c2}; stored 0-based
  (md.zones||[]).forEach((z,i)=>{const Z={id:id+'#'+(z.id||i),name:z.name||'',x:z.c1-1,y:z.r1-1,w:z.c2-z.c1+1,h:z.r2-z.r1+1,limit:z.limit||0,entry:z.entry?[z.entry[1]-1,z.entry[0]-1]:null,exit:z.exit?[z.exit[1]-1,z.exit[0]-1]:null,tutorial:!!z.tutorial};
   if(Z.w>7||Z.h>8)W.errors.push(`zone ${Z.id} is ${Z.w}x${Z.h} (max 7 wide x 8 high)`);m.zones.push(Z)});
  W.maps[id]=m}
 [W.dunes0,W.bugs0,W.bosses0].forEach(a=>a.forEach((o,i)=>{o.i=i;const Z=zoneAt(W,o.m,o.x,o.y);o.zone=Z?Z.id:null;if(!Z)W.errors.push(`mover at ${o.m} ${o.x},${o.y} is outside every zone`)}));
 // patrols: ping-pong along the open axis (horizontal preferred, like logic.js); each belongs to the zone it starts in
 W.pats0.forEach((p,i)=>{const op=(x,y)=>{const c=base(W,p.m,x,y);return c!=='#'&&c!=='D'&&'CMN'.indexOf(c)<0};p.i=i;p.ax=(op(p.x-1,p.y)||op(p.x+1,p.y))?'h':'v';p.d=1;const Z=zoneAt(W,p.m,p.x,p.y);p.zone=Z?Z.id:null});
 for(const d in W.tunnels)if(W.tunnels[d].length!==2&&!(W.tunnels[d].length===1&&W.pending.indexOf(d)>=0))W.errors.push(`tunnel ${d} appears ${W.tunnels[d].length} times (must be exactly 2)`);
 if(!W.start)W.errors.push('no start S');
 return W}
// tunnels: single digits 0-9, plus def.tunnelAlias {char:'10',...} for ids above 9 (15 scenes need 14 tunnels)
let TUNALIAS={};const isTun=c=>typeof c==='string'&&c.length===1&&(/[0-9]/.test(c)||Object.prototype.hasOwnProperty.call(TUNALIAS,c)),tunId=c=>TUNALIAS[c]||c;
const DCH={'^':0,'v':1,'<':2,'>':3},DV=[[0,-1],[0,1],[-1,0],[1,0]]; // mover dirs: 0 up 1 down 2 left 3 right; d^1 = turn around
function base(W,m,x,y){const M=W.maps[m];return (y<0||y>=M.H||x<0||x>=M.W)?'#':M.grid[y][x]}
const has=(arr,k)=>arr.indexOf(k)>=0;
const K=(m,x,y)=>m+':'+x+','+y;
// dynamic cell: broken cracked walls become rubble floor ','; filled holes become floor
function cell(W,s,m,x,y){const c=base(W,m,x,y),k=K(m,x,y);if(s.ch&&s.ch[k]!==undefined)return s.ch[k]; // ch: changed tiles (= sand bridge, a ash, . melted ice / fallen tree)
if(c==='%'&&(has(s.broken,k)||clearedAt(W,s,m,x,y)))return ',';if(c==='R'&&has(s.broken,k))return ',';if(c==='O'){if(has(s.filled,k))return '.';if(has(s.holes,k))return 'o'}return c}
function clearedAt(W,s,m,x,y){const Z=zoneAt(W,m,x,y);return !!(Z&&s.cleared.length&&has(s.cleared,Z.id))}
function zoneAt(W,m,x,y){const z=W.maps[m].zones;for(const Z of z)if(x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h)return Z;return null}
function initState(W){const s={m:W.start.m,x:W.start.x,y:W.start.y,f:'down',held:0,inv:'',got:[],cleared:[],boxes:W.boxes0.slice(),bombs:[],broken:[],holes:[],filled:[],zone:null,zoneEntry:null,left:null,visited:[W.start.m],steps:0,pats:W.pats0.map(p=>({i:p.i,m:p.m,x:p.x,y:p.y,d:p.d}))};initMovers(W,s);
 enterZone(W,s);return s}
function clone(s){return{m:s.m,x:s.x,y:s.y,f:s.f,held:s.held,inv:s.inv,got:s.got.slice(),cleared:s.cleared.slice(),boxes:s.boxes.slice(),bombs:s.bombs.map(b=>({...b})),broken:s.broken.slice(),holes:s.holes.slice(),filled:s.filled.slice(),zone:s.zone,zoneEntry:s.zoneEntry,left:s.left,visited:s.visited.slice(),steps:s.steps,pats:(s.pats||[]).map(p=>({...p})),dunes:s.dunes&&s.dunes.map(o=>({...o})),bugs:s.bugs&&s.bugs.map(o=>({...o})),bosses:s.bosses&&s.bosses.map(o=>({...o})),ch:s.ch&&{...s.ch},vt:s.vt&&{...s.vt}}}
// fills desert/forest fields (also used to upgrade v3 saves, which never reached those maps)
function initMovers(W,s){if(!s.dunes)s.dunes=W.dunes0.map(o=>({...o}));if(!s.bugs)s.bugs=W.bugs0.map(o=>({...o}));if(!s.bosses)s.bosses=W.bosses0.map(o=>({...o}));if(!s.ch)s.ch={};if(!s.vt)s.vt={};return s}
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
 for(let yy=0;yy<M.H;yy++)for(let xx=0;xx<M.W;xx++){if(M.grid[yy][xx]!=='X')continue;if(Z&&zoneAt(W,m,xx,yy)!==Z)continue;n++;if(boxAt(s,m,xx,yy)<0&&duneAt(s,m,xx,yy)<0)return false}return n>0||M.rules!=='v2'} // bombs do NOT press switches; dunes do (heavy)
function solid(W,s,m,x,y){if(W.maps[m].rules==='v2')return solidV2(W,s,m,x,y);const c=cell(W,s,m,x,y);
 if(c==='#'||c==='%'||c==='o'||c==='R'||c==='b')return true; // bomb grass is a plant: face it + act to pick
 if(c==='D'&&!switchDoorOpen(W,s,m,x,y))return true;
 if((c==='C'||c==='M'||c==='N')&&!hasInv(s,c.toLowerCase()))return true; // keys are NOT consumed
 return false}
const isIce=(c)=>c==='I'||c==='J';
function slides(s,c){return c==='J'||(c==='I'&&!hasInv(s,'k'))} // hard ice J slides even with claws
function objBlocked(W,s,m,x,y){const c=cell(W,s,m,x,y);if(c==='o')return false;return patAt(s,m,x,y)>=0||solid(W,s,m,x,y)||boxAt(s,m,x,y)>=0||bombAt(s,m,x,y)>=0||'GDHWCMN'.indexOf(c)>=0||isTun(c)||(ITEMS[c]&&!has(s.got,K(m,x,y)))}
function enterZone(W,s){const Z=zoneAt(W,s.m,s.x,s.y),id=Z?Z.id:null;if(id!==s.zone){if(s.zone&&s.pats)resetPats(W,s,s.zone);s.zone=id;s.zoneEntry=Z?[s.x,s.y]:null;s.left=Z&&Z.limit?Z.limit+(hasInv(s,'U')?10:0):null;return Z?'zone':'leave'}return null}
function pickup(W,s,ev){const c=base(W,s.m,s.x,s.y),k=K(s.m,s.x,s.y);if(ITEMS[c]&&!has(s.got,k)){s.got.push(k);if(ITEMS[c]==='battery'){if(s.left!=null)s.left+=5}else if(ITEMS[c]!=='bolt'&&ITEMS[c]!=='lamp')addInv(s,c);ev.push(ITEMS[c])}}
function tick(W,s,ev,skipNew){const keep=[];for(const b of s.bombs){if(b===skipNew){keep.push(b);continue}b.t--;if(b.t>0){keep.push(b);continue}
  ev.push('blast');const blast=[[0,0],[1,0],[-1,0],[0,1],[0,-1]];const hits=[];let hitW=null;
  blast.forEach(([dx,dy])=>{const x=b.x+dx,y=b.y+dy;if(b.m===s.m&&x===s.x&&y===s.y)s.hurt=1;const pi=patAt(s,b.m,x,y);if(pi>=0){const P=s.pats[pi];(s.defeated=s.defeated||[]).push({m:P.m,x:P.x,y:P.y,d:P.d,ax:W.pats0[P.i].ax});s.pats.splice(pi,1);ev.push('defeat')}if(base(W,b.m,x,y)==='%'&&!has(s.broken,K(b.m,x,y))){s.broken.push(K(b.m,x,y));hits.push([x,y])}
   const di=duneAt(s,b.m,x,y);if(di>=0){(s.scattered=s.scattered||[]).push({m:b.m,x,y});s.dunes.splice(di,1);ev.push('scatter')}
   const gi=bugAt(s,b.m,x,y);if(gi>=0){(s.squashed=s.squashed||[]).push({m:b.m,x,y});s.bugs.splice(gi,1);ev.push('squash')}
   const wi=wormAt(s,b.m,x,y);if(wi>=0)hitW=s.bosses[wi]});
  if(hitW){hitW.hp--;hitW.hitAt=s.steps;ev.push('bosshit');if(hitW.hp<=0)ev.push('bossdown');hitW=null}
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
 if(isTun(c)){const pair=W.tunnels[tunId(c)];const other=pair.find(p=>!(p.m===s.m&&p.x===s.x&&p.y===s.y));if(other){s.m=other.m;s.x=other.x;s.y=other.y;result='tunnel';if(!has(s.visited,s.m))s.visited.push(s.m)}}
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
function wormAt(s,m,x,y){return (s.bosses||[]).findIndex(o=>o.kind==='worm'&&o.hp>0&&o.m===m&&o.x===x&&o.y===y)}
function bossOfZone(W,s,m,x,y){const Z=zoneAt(W,m,x,y);return Z?(s.bosses||[]).find(o=>o.zone===Z.id)||null:null}
function solidV2(W,s,m,x,y){const c=cell(W,s,m,x,y);
 if('#%bKwTR'.indexOf(c)>=0)return true;
 if(c==='D')return !switchDoorOpen(W,s,m,x,y)&&!(s.m===m&&s.x===x&&s.y===y); // never closes on the robot
 if(c==='G'){const b=bossOfZone(W,s,m,x,y);return !!(b&&b.hp>0)}
 if((c==='C'||c==='M'||c==='N')&&!hasInv(s,c.toLowerCase()))return true;
 return false}
const occV2=(s,m,x,y)=>boxAt(s,m,x,y)>=0||bombAt(s,m,x,y)>=0||duneAt(s,m,x,y)>=0||bugAt(s,m,x,y)>=0||wormAt(s,m,x,y)>=0;
const itemHere=(W,s,m,x,y)=>{const c=base(W,m,x,y);return !!ITEMS[c]&&!has(s.got,K(m,x,y))};
const placeV2=(W,s,m,x,y,c)=>'.=Xa,'.indexOf(c)>=0||(!!ITEMS[c]&&has(s.got,K(m,x,y)));
function curZone(W,s){return s.zone?W.maps[s.m].zones.find(z=>z.id===s.zone)||null:null}
function breathe(W,s,ev){const [dx,dy]=DIRS[s.f],m=s.m,M=W.maps[m],Z=curZone(W,s);let x=s.x,y=s.y;ev.push('fire');
 for(;;){x+=dx;y+=dy;if(Z?!inZone(Z,x,y):(x<0||y<0||x>=M.W||y>=M.H))break;const k=K(m,x,y),c=cell(W,s,m,x,y);
  if(c==='w'){s.ch[k]='a';s.vt[k]=REGROW;ev.push('burn');break}
  if(c==='K'){s.ch[k]='.';ev.push('melt');break}
  const bi=bugAt(s,m,x,y);if(bi>=0){s.bugs[bi].fr=3;ev.push('stun');break}
  const tb=(s.bosses||[]).find(o=>o.kind==='tree'&&o.hp>0&&o.m===m&&o.x===x&&o.y===y);
  if(tb){tb.hp--;tb.hitAt=s.steps;ev.push('bosshit');for(const kk of Object.keys(s.vt)){const [mm,xy]=kk.split(':'),[vx,vy]=xy.split(',').map(Number);if(mm===m&&(!Z||inZone(Z,vx,vy))){delete s.ch[kk];delete s.vt[kk];ev.push('regrow')}}
   if(tb.hp<=0){s.ch[k]='.';ev.push('bossdown')}break}
  if(solidV2(W,s,m,x,y)||occV2(s,m,x,y))break}
 s.lastFire={m,x0:s.x,y0:s.y,x1:x,y1:y,f:s.f}}
// everything that moves takes one step (after the robot). Returns 'caught' if a beetle walks into the robot.
function moveV2(W,s,Z,ev){const m=s.m,P=(x,y)=>x===s.x&&y===s.y,nxt=o=>[o.x+DV[o.d][0],o.y+DV[o.d][1]];
 for(const du of s.dunes.slice()){if(du.m!==m||du.zone!==Z.id)continue;const [nx,ny]=nxt(du),c=cell(W,s,m,nx,ny);
  const blocked=!inZone(Z,nx,ny)||P(nx,ny)||isEE(Z,nx,ny)||(c!=='D'&&solidV2(W,s,m,nx,ny))||(c==='D'&&!switchDoorOpen(W,s,m,nx,ny))||occV2(s,m,nx,ny)||itemHere(W,s,m,nx,ny);
  if(blocked){du.d^=1;continue}
  if(c==='q'){s.dunes.splice(s.dunes.indexOf(du),1);s.ch[K(m,nx,ny)]='=';(s.sunk=s.sunk||[]).push({m,x:nx,y:ny,dune:1});ev.push('dunesink');continue}
  du.x=nx;du.y=ny}
 for(const bg of s.bugs){if(bg.m!==m||bg.zone!==Z.id)continue;if(bg.fr>0){bg.fr--;continue}const [nx,ny]=nxt(bg);
  if(isEE(Z,nx,ny)){bg.d^=1;continue} // entry/exit tiles are safe: beetles never step on them
  if(P(nx,ny))return 'caught';
  if(!inZone(Z,nx,ny)||solidV2(W,s,m,nx,ny)||occV2(s,m,nx,ny)||cell(W,s,m,nx,ny)==='q'||itemHere(W,s,m,nx,ny)){bg.d^=1;continue}bg.x=nx;bg.y=ny}
 for(const b of s.bosses){if(b.kind!=='worm'||b.hp<=0||b.m!==m||b.zone!==Z.id)continue;const [nx,ny]=nxt(b);
  const blocked=!inZone(Z,nx,ny)||P(nx,ny)||isEE(Z,nx,ny)||solidV2(W,s,m,nx,ny)||boxAt(s,m,nx,ny)>=0||duneAt(s,m,nx,ny)>=0||bugAt(s,m,nx,ny)>=0||cell(W,s,m,nx,ny)==='q'; // bombs do NOT stop it
  if(blocked)b.d^=1;else{b.x=nx;b.y=ny}}
 for(const k of Object.keys(s.vt)){const [mm,xy]=k.split(':'),[x,y]=xy.split(',').map(Number);if(mm!==m||!inZone(Z,x,y))continue;
  if(s.vt[k]>0)s.vt[k]--;if(s.vt[k]<=0&&!P(x,y)&&!occV2(s,m,x,y)){delete s.vt[k];delete s.ch[k];ev.push('regrow')}}
 return null}
function stepV2(W,s0,a,opt){const ev=[];const free=!!(opt&&opt.free);
 if(a==='reset')return resetZone(W,s0);
 const s=initMovers(W,clone(s0)),m=s.m,Z=curZone(W,s);let result,path=[],moves=[];
 if(a==='act'){const [dx,dy]=DIRS[s.f],fx=s.x+dx,fy=s.y+dy,fc=cell(W,s,m,fx,fy);
  if(!s.held&&fc==='b'){s.held=1;ev.push('grab')}
  else if(s.held&&(!Z||inZone(Z,fx,fy))&&placeV2(W,s,m,fx,fy,fc)&&!occV2(s,m,fx,fy)&&!isEE(Z,fx,fy)){s.bombs.push({m,x:fx,y:fy,t:FUSE,ms:0});s.held=0;ev.push('place')}
  else if(hasInv(s,'F'))breathe(W,s,ev);
  else return{state:s0,result:'noop',ev};
  result='act';s.steps++}
 else{const [dx,dy]=DIRS[a];if(s0.left!=null&&s0.left<=0)return{state:s0,result:'tired',ev,path:[]};
  s.f=a;const nx=s.x+dx,ny=s.y+dy;
  if(solidV2(W,s,m,nx,ny)||duneAt(s,m,nx,ny)>=0||wormAt(s,m,nx,ny)>=0){ev.push('bump');result='bump'}
  else if(bugAt(s,m,nx,ny)>=0){ev.push('caught');return{state:s,result:'fail',ev,path:[]}}
  else if(cell(W,s,m,nx,ny)==='q'){s.x=nx;s.y=ny;ev.push('sink');return{state:s,result:'fail',ev,path:[[nx,ny]],sink:true}} // sink animation ~1s, then the zone resets
  else{const bi=boxAt(s,m,nx,ny),mi=bombAt(s,m,nx,ny);let ok=true;
   if(bi>=0||mi>=0){const bx=nx+dx,by=ny+dy;
    if(solidV2(W,s,m,bx,by)||occV2(s,m,bx,by)||isEE(Z,bx,by)||itemHere(W,s,m,bx,by)||(bi>=0&&Z&&!inZone(Z,bx,by)))ok=false;
    else{if(cell(W,s,m,bx,by)==='q'){if(bi>=0){s.boxes.splice(bi,1);s.ch[K(m,bx,by)]='=';(s.sunk=s.sunk||[]).push({m,x:bx,y:by,box:1});ev.push('bridge')}else{s.bombs.splice(mi,1);ev.push('fizzle')}}
     else if(bi>=0)s.boxes[bi]=K(m,bx,by);else{s.bombs[mi].x=bx;s.bombs[mi].y=by}
     moves.push([[nx,ny],[bx,by]]);ev.push('push')}}
   if(!ok){ev.push('bump');result='bump'}
   else{s.x=nx;s.y=ny;pickup(W,s,ev);path=[[nx,ny]];result='move';if(!free){if(s.left!=null)s.left--;s.steps++}}}}
 if(!free&&Z&&moveV2(W,s,Z,ev)==='caught'){ev.push('caught');return{state:s,result:'fail',ev,path,moves}}
 if(result!=='move')return{state:s,result,ev,path:[],moves};
 const c=base(W,s.m,s.x,s.y);
 if(isTun(c)){const pair=W.tunnels[tunId(c)];const other=pair.find(p=>!(p.m===s.m&&p.x===s.x&&p.y===s.y));if(other){s.m=other.m;s.x=other.x;s.y=other.y;result='tunnel';if(!has(s.visited,s.m))s.visited.push(s.m)}}
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
 s.boxes=s.boxes.filter(k=>!inZ(k)).concat(W.boxes0.filter(inZ));s.bombs=s.bombs.filter(b=>!inZ(K(b.m,b.x,b.y)));
 s.broken=s.broken.filter(k=>!inZ(k));s.holes=s.holes.filter(k=>!inZ(k));s.filled=s.filled.filter(k=>!inZ(k));
 s.got=s.got.filter(k=>!(inZ(k)&&ITEMS[base(W,s.m,+k.split(':')[1].split(',')[0],+k.split(',')[1])]==='battery')); // batteries respawn; keys/items stay
 if(!Z)return{state:s,result:"nothing",ev:[]};resetPats(W,s,Z.id);initMovers(W,s);
 const back=(cur,init)=>cur.filter(o=>o.zone!==Z.id).concat(init.filter(o=>o.zone===Z.id).map(o=>({...o}))).sort((a,b)=>a.i-b.i);
 s.dunes=back(s.dunes,W.dunes0);s.bugs=back(s.bugs,W.bugs0);s.bosses=back(s.bosses,W.bosses0);
 for(const k in s.ch)if(inZ(k))delete s.ch[k];for(const k in s.vt)if(inZ(k))delete s.vt[k];[s.x,s.y]=Z.entry||s.zoneEntry;s.held=0;s.left=Z.limit?Z.limit+(hasInv(s,'U')?10:0):null;return{state:s,result:'reset',ev:['reset']}}
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
function key(s){return [s.m,s.x,s.y,s.f,s.held,s.inv,s.got.slice().sort().join(';'),s.boxes.slice().sort().join(';'),s.bombs.map(b=>K(b.m,b.x,b.y)+'t'+b.t).sort().join(';'),s.broken.slice().sort().join(';'),s.holes.slice().sort().join(';'),s.filled.slice().sort().join(';'),s.left,s.zone,s.cleared.slice().sort().join(';'),(s.pats||[]).map(p=>p.i+'@'+p.x+','+p.y+(p.d>0?'+':'-')).join(';'),[s.dunes,s.bugs,s.bosses].map(a=>(a||[]).map(o=>o.i+'@'+o.x+','+o.y+'d'+o.d+'f'+(o.fr||0)+'h'+(o.hp||0)).join(';')).join('/'),Object.keys(s.ch||{}).sort().map(k=>k+s.ch[k]).join(';'),Object.keys(s.vt||{}).sort().map(k=>k+'='+s.vt[k]).join(';')].join('|')}
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
const api={isTun,tunId,stepV2,solidV2,duneAt,bugAt,wormAt,bossOfZone,initMovers,REGROW,mstep,patAt,resetPats,normalize,parseWorld,initState,step,advance,FUSE_MS,cell,base,zoneAt,solid,explore,bfsPath,softlocks,key,hasInv,DIRS,FUSE,ITEMS,switchDoorOpen,bombAt,boxAt,K};
if(typeof module!=='undefined')module.exports=api;else root.WorldEngine=api;
})(this);
