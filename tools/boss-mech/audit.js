// Boss-room mechanic audit (網頁開發工程師, 2026-10-23). Read-only use of the engine.
// Full BFS of a boss room from its entry with the real engine (boss moves on, solver fuse model):
//   min steps to clear (boss hp 0 + on exit), fewest idle steps (same stall rule as test-bossrooms.js), doomed states,
//   dead states (alive but the clear is unreachable without reset) and how many of a sample the in-game stuck detection flags,
//   bomb hits split by whether the exploding bomb had ridden a belt/current (b.rode) — and an optional "no mechanic" run
//   where every ↑↓←→ tile in the room is turned into plain floor (NOCUR=1).
// usage: ROOT=/path/to/engine-copy node audit.js factory#FB sea#AB     (NOCUR=1 → necessity run)
global.window=global;const ROOT=process.env.ROOT||'/workspace/robot-maze';const E=require(ROOT+'/world-engine.js'),W=E.parseWorld(require(ROOT+'/world/world-def.js'));
const ACT=['up','down','left','right','act','wait'],C={up:'U',down:'D',left:'L',right:'R',act:'A',wait:'w'},D={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const sig=s=>JSON.stringify([s.inv,s.held,s.got,s.boxes,(s.bombs||[]).map(b=>[b.m,b.x,b.y]),s.broken,s.holes,s.filled,s.ch,s.rocks,s.cart,(s.bosses||[]).map(b=>[b.hp,b.fr||0,b.shot?[b.shot.d,b.shot.back]:0])]);
const stall=(a,t,ns)=>{if(a==='wait')return 1;if(ns.x!==t.x||ns.y!==t.y||sig(ns)!==sig(t))return 0;if(a!=='act'&&ns.f!==t.f){const [dx,dy]=D[ns.f];const c=E.cell(W,ns,ns.m,ns.x+dx,ns.y+dy);if(c&&c!=='#'&&c!==' ')return 0}return 1};
function room(zid,inv,opt){opt=opt||{};const m=zid.split('#')[0],Z=W.maps[m].zones.find(z=>z.id===zid),MAX=opt.max||400000;
 const inZ=k=>{if(!k.startsWith(m+':'))return false;const [x,y]=k.slice(m.length+1).split(',').map(Number);return x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h};
 const KEY=s=>{const b=(s.bosses||[]).filter(o=>o.zone===zid).map(o=>o.x+','+o.y+'d'+o.d+'f'+(o.fr||0)+'h'+o.hp+'t'+(o.t||0)+'w'+(o.warn||'')+(o.trap?'T':'')+'G'+(o.gd||0)+(o.spotted?'s':'')+(o.chg?'c':'')+(o.shot?'b'+o.shot.x+','+o.shot.y+','+o.shot.d+(o.shot.back?'r':''):'')).join(';');
  return [s.x,s.y,s.f,s.held,s.bombs.map(o=>o.x+','+o.y+'t'+o.t+(o.rode?'r':'')).sort().join(';'),s.boxes.filter(inZ).sort().join(';'),b,(s.bugs||[]).filter(o=>o.zone===zid).map(o=>o.x+','+o.y+'d'+o.d+'f'+(o.fr||0)).join(';'),
   Object.keys(s.ch||{}).filter(inZ).sort().map(k=>k+s.ch[k]).join(';'),s.broken.filter(inZ).sort().join(';'),s.air||0].join('|')};
 const s0=E.initState(W);const [ex,ey]=Z.entry;Object.assign(s0,{m,x:ex,y:ey,f:ex===Z.x?'right':ex===Z.x+Z.w-1?'left':ey===Z.y?'down':'up',inv,zone:zid,zoneEntry:Z.entry,visited:[m]});
 s0.boxes=s0.boxes.filter(inZ);s0.got=s0.got.filter(inZ);s0.bugs=s0.bugs.filter(o=>o.zone===zid);s0.dunes=s0.dunes.filter(o=>o.zone===zid);s0.clouds=(s0.clouds||[]).filter(o=>o.zone===zid);s0.bosses=s0.bosses.filter(o=>o.zone===zid);s0.pats=[];s0.cleared=[];
 if(opt.nocur)for(let y=Z.y;y<Z.y+Z.h;y++)for(let x=Z.x;x<Z.x+Z.w;x++)if(E.cell(W,s0,m,x,y) in E.CUR)s0.ch[E.K(m,x,y)]=opt.nocur==='wall'?'#':'.';
 const bi=s0.bosses.findIndex(b=>b.zone===zid),goal=t=>t.bosses[bi].hp<=0&&t.x===Z.exit[0]&&t.y===Z.exit[1];
 // tag bombs that sit on / ride a belt (the engine keeps unknown fields through clone: bombs are spread-copied)
 // a bomb 'rode' once it moved without being the bomb the robot just pushed one tile (i.e. a belt/current carried it)
 let BID=0;const tag=(t,s)=>{for(const b of s.bombs){if(b.id==null){b.id=++BID;continue}const o=t.bombs.find(q=>q.id===b.id);if(!o||(o.x===b.x&&o.y===b.y))continue;
   const dx=s.x-t.x,dy=s.y-t.y,pushed=Math.abs(dx)+Math.abs(dy)===1&&o.x===s.x&&o.y===s.y&&b.x===o.x+dx&&b.y===o.y+dy;if(!pushed)b.rode=1}};
 const seen=new Map([[KEY(s0),0]]),states=[s0],edges=[[]];let q=[{i:0,p:'',b:0}],doomed=0,hit=null,trunc=false,hitsRode=0,hitsPlain=0,plainEx='';const goals=new Set();
 while(q.length){const nm=new Map();for(const o of q){const t=states[o.i];if(goals.has(o.i))continue;let alive=0;
   for(const a of ACT){const pre=t.bosses[bi].hp;const r=E.mstep(W,t,a);if(r.result==='fail')continue;alive++;
    if(['noop','fall','tired'].includes(r.result)||r.state===t)continue;const ns=r.state;tag(t,ns);
    if(ns.bosses[bi].hp<pre){const exploded=t.bombs.filter(b=>!ns.bombs.some(n=>n.x===b.x&&n.y===b.y&&n.t===b.t-1)&&!ns.bombs.some(n=>n.rode===b.rode&&Math.abs(n.x-b.x)+Math.abs(n.y-b.y)<=1&&n.t===b.t-1));
     const dx=ns.x-t.x,dy=ns.y-t.y,onC=(x,y)=>E.cell(W,t,m,x,y) in E.CUR;if(t.bombs.filter(b=>!ns.bombs.some(n=>n.id===b.id)).some(b=>b.rode||onC(b.x,b.y)||(b.x===ns.x&&b.y===ns.y&&onC(b.x+dx,b.y+dy))))hitsRode++;else{hitsPlain++;if(!plainEx)plainEx=o.p+C[a]}}
    const isG=goal(ns);if(ns.m!==m||(ns.zone!==zid&&!isG))continue;
    const k=KEY(ns);let j=seen.get(k);if(j==null){if(states.length>=MAX){trunc=true;continue}j=states.length;seen.set(k,j);states.push(ns);edges.push([]);if(isG)goals.add(j);
     const b=o.b+stall(a,t,ns),cur=nm.get(j);if(!cur||b<cur.b)nm.set(j,{i:j,p:o.p+C[a],b})}
    else{const cur=nm.get(j);if(cur){const b=o.b+stall(a,t,ns);if(b<cur.b)nm.set(j,{i:j,p:o.p+C[a],b})}}
    edges[o.i].push(j)}
   if(!alive)doomed++}
  q=[...nm.values()];if(!hit){const g=q.filter(o=>goals.has(o.i)).sort((a,c)=>a.b-c.b);if(g.length)hit=g[0]}}
 const rev=states.map(()=>[]);edges.forEach((es,i)=>es.forEach(j=>rev[j].push(i)));const ok=new Uint8Array(states.length),st=[...goals];st.forEach(i=>ok[i]=1);while(st.length){const j=st.pop();for(const i of rev[j])if(!ok[i]){ok[i]=1;st.push(i)}}
 const deadIdx=[];for(let i=0;i<states.length;i++)if(!ok[i])deadIdx.push(i);let unflag=0,chk=0;const unflagEx=[];
 if(!trunc&&goals.size&&E.zoneStuck)for(const i of (opt.fullFlag?deadIdx:deadIdx.filter((_,k)=>k%Math.max(1,Math.floor(deadIdx.length/40))===0))){chk++;const s=JSON.parse(JSON.stringify(states[i]));if(E.zoneStuck(W,s,30000)!==true){unflag++;if(unflagEx.length<3)unflagEx.push(KEY(states[i]))}}
 return {zid,nocur:opt.nocur||false,min:hit?hit.p.length:null,stalls:hit?hit.b:null,route:hit?hit.p:'',states:states.length,trunc,doomed,dead:goals.size?deadIdx.length:'n/a (unsolvable)',deadChecked:chk,deadUnflagged:unflag,unflagEx,bossHitsWithBeltBomb:hitsRode,bossHitsPlainBomb:hitsPlain,plainExample:plainEx}}
module.exports={room,E,W};
if(require.main===module)for(const z of process.argv.slice(2)){const t=Date.now();console.log(JSON.stringify(room(z,process.env.INV!=null?process.env.INV:'FQ',{nocur:process.env.NOCUR||false,fullFlag:!!process.env.FULLFLAG})),(Date.now()-t)+'ms')}
