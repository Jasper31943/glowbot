// Boss-room solver check (2026-10-23 audit fixes): per boss room, BFS from the room entry with the real engine (boss moves on)
// → shortest clear (boss down + standing on the exit), the fewest idle steps among the shortest routes (wait / act that changes
// nothing / bumping a plain wall — same rule as tools/boss-check/stall.js), and "doomed" states (alive, but every action fails).
// Fixed rooms are asserted: forest (fire only — the bat comes after this boss), volcano (2 HP), mirror (flips from 2 HP).
// usage: node test-bossrooms.js            → the three fixed rooms
//        ALL=1 node test-bossrooms.js      → also prints every other boss room (regression table, slower)
global.window=global;const E=require('./world-engine.js'),W=E.parseWorld(require('./world/world-def.js'));
const ACT=['up','down','left','right','act','wait'],C={up:'U',down:'D',left:'L',right:'R',act:'A',wait:'w'},D={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const sig=s=>JSON.stringify([s.inv,s.held,s.got,s.boxes,(s.bombs||[]).map(b=>[b.m,b.x,b.y]),s.broken,s.holes,s.filled,s.ch,s.rocks,s.cart,(s.bosses||[]).map(b=>[b.hp,b.fr||0,b.shot?[b.shot.d,b.shot.back]:0])]);
const stall=(a,t,ns)=>{if(a==='wait')return 1;if(ns.x!==t.x||ns.y!==t.y||sig(ns)!==sig(t))return 0;if(a!=='act'&&ns.f!==t.f){const [dx,dy]=D[ns.f];const c=E.cell(W,ns,ns.m,ns.x+dx,ns.y+dy);if(c&&c!=='#'&&c!==' ')return 0}return 1};
function room(zid,inv){const m=zid.split('#')[0],Z=W.maps[m].zones.find(z=>z.id===zid);
 const inZ=k=>{if(!k.startsWith(m+':'))return false;const [x,y]=k.slice(m.length+1).split(',').map(Number);return x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h};
 const KEY=s=>{const b=(s.bosses||[]).filter(o=>o.zone===zid).map(o=>o.x+','+o.y+'d'+o.d+'f'+(o.fr||0)+'h'+o.hp+'t'+(o.t||0)+'w'+(o.warn||'')+(o.trap?'T':'')+'G'+(o.gd||0)+(o.lit?'l':'')+(o.spotted?'s':'')+'p'+(o.ph||0)+'g'+(o.gx==null?'':o.gx)+'q'+(o.sd==null?'':o.sd)+(o.chg?'c':'')+(o.shot?'b'+o.shot.x+','+o.shot.y+','+o.shot.d+(o.shot.back?'r':''):'')).join(';');
  return [s.got.filter(inZ).sort().join(';'),s.x,s.y,s.f,s.held,s.zone,s.bombs.map(o=>o.x+','+o.y+'t'+o.t).sort().join(';'),s.boxes.filter(inZ).sort().join(';'),s.cart?Object.keys(s.cart).filter(inZ).sort().map(k=>k+s.cart[k]).join(';'):'',b,
   (s.bugs||[]).filter(o=>o.zone===zid).map(o=>o.x+','+o.y+'d'+o.d+'f'+(o.fr||0)).join(';'),(s.dunes||[]).filter(o=>o.zone===zid).map(o=>o.x+','+o.y+'d'+o.d).join(';'),(s.clouds||[]).filter(o=>o.zone===zid).map(o=>o.x+','+o.y+'d'+o.d).join(';'),
   Object.keys(s.ch||{}).filter(inZ).sort().map(k=>k+s.ch[k]).join(';'),Object.keys(s.vt||{}).filter(inZ).sort().map(k=>k+s.vt[k]).join(';'),s.broken.filter(inZ).sort().join(';'),s.holes.filter(inZ).join(';'),s.filled.filter(inZ).join(';'),
   s.bossCp?s.bossCp.zone+s.bossCp.hp:'',s.cf||'',s.lt||0,s.air||0,s.lit||0,s.pw||0,s.gen||0,W.maps[m].theme==='clock'?(s.zt>0?2+s.zt%2:0)+'/'+s.zt%4:'',s.lvz&&s.lvz[zid]||0,(s.rocks||[]).map(r=>r.x+','+r.y).join(';')].join('|')};
 const s0=E.initState(W);const [ex,ey]=Z.entry;Object.assign(s0,{m,x:ex,y:ey,f:ex===Z.x?'right':ex===Z.x+Z.w-1?'left':ey===Z.y?'down':'up',inv,zone:zid,zoneEntry:Z.entry,visited:[m]});
 s0.boxes=s0.boxes.filter(inZ);s0.got=s0.got.filter(inZ);s0.bugs=s0.bugs.filter(o=>o.zone===zid);s0.dunes=s0.dunes.filter(o=>o.zone===zid);s0.clouds=(s0.clouds||[]).filter(o=>o.zone===zid);s0.bosses=s0.bosses.filter(o=>o.zone===zid);s0.pats=[];s0.cleared=[];
 const bi=s0.bosses.findIndex(b=>b.zone===zid),goal=t=>t.bosses[bi].hp<=0&&t.x===Z.exit[0]&&t.y===Z.exit[1];
 // layered BFS; per state keep the fewest stalls with which it is reached at its (shortest) depth
 const seen=new Set([KEY(s0)]);let q=[{t:s0,p:'',b:0}],doomed=0,N=1,bounced=0,guarded=0,hit=null;
 while(q.length&&!hit){const nm=new Map();for(const o of q){let alive=0;for(const a of ACT){const r=E.mstep(W,o.t,a);if(r.result==='fail')continue;alive++;
   if(r.ev.includes('bounced'))bounced++;if(r.ev.includes('bossguard'))guarded++;
   if(['noop','fall','tired'].includes(r.result)||r.state===o.t)continue;const ns=E.normalize(W,r.state);if(W.maps[m].theme!=='clock')ns.zt=0;else ns.zt=ns.zt>0?2+ns.zt%2:ns.zt;if(ns.m!==m||(ns.zone!==zid&&!goal(ns)))continue;
   const k=KEY(ns);if(seen.has(k))continue;const b=o.b+stall(a,o.t,ns),cur=nm.get(k);if(!cur||b<cur.b)nm.set(k,{t:ns,p:o.p+C[a],b})}
  if(!alive)doomed++}
  for(const k of nm.keys())seen.add(k);N+=nm.size;q=[...nm.values()];const g=q.filter(o=>goal(o.t)).sort((a,c)=>a.b-c.b);if(g.length)hit=g[0]}
 return {zid,inv,min:hit?hit.p.length:null,stalls:hit?hit.b:null,route:hit?hit.p:'',states:N,doomed,bounced,guarded}}
let fails=0,n=0;const ok=(c,msg)=>{n++;console.log((c?'ok   ':'FAIL ')+msg);if(!c)fails++};
const T0=Date.now();
{const r=room('forest#FB','F');console.log('  ',JSON.stringify(r));
 ok(r.min>=20&&r.min<=24,`forest: fire-only clean solve is about 22 steps (got ${r.min}; was 13 before the fix)`);ok(r.stalls<=2,`forest: shortest route needs ≤2 idle steps (${r.stalls})`);
 ok(r.doomed===0,`forest: no doomed states (${r.doomed})`);ok(r.bounced>0,`forest: the blue trapped row bounces 小光 back to the entry (${r.bounced} times in the search)`);ok(r.guarded>0,`forest: fire right after a hit fizzles on the guarding tree (${r.guarded})`)}
{const r=room('volcano#VB','FQ');console.log('  ',JSON.stringify(r));ok(W.bosses0.find(b=>b.kind==='golem').hp===2,'volcano: lava giant has 2 HP');
 ok(r.min===29,`volcano: shortest clear 29 steps (was 36 at 3 HP; got ${r.min})`);ok(r.stalls<=2,`volcano: ≤2 idle steps (${r.stalls})`)}
{const r=room('mirror#RB','FQ');console.log('  ',JSON.stringify(r));
 ok(r.min>=17&&r.min<=20,`mirror: shortest clear about 18 steps (got ${r.min})`);ok(r.stalls<=2,`mirror: ≤2 idle steps (${r.stalls})`);
 // the shortest route must actually meet the king's flip at least once (before the fix it never came out)
 const zid='mirror#RB',m='mirror',Z=W.maps[m].zones.find(z=>z.id===zid);let s=E.initState(W);Object.assign(s,{m,x:Z.entry[0],y:Z.entry[1],f:'right',inv:'FQ',zone:zid,zoneEntry:Z.entry,visited:[m]});
 const M={U:'up',D:'down',L:'left',R:'right',A:'act',w:'wait'};let flips=0,warns=0;for(const c of r.route){const x=E.mstep(W,s,M[c]);if(x.ev.includes('kingflip'))flips++;if(x.ev.includes('bosswarn'))warns++;s=x.state}
 ok(flips>=1&&warns>=flips,`mirror: the fastest route sees the king flip a mirror back (${flips} flips, each telegraphed)`)}
if(process.env.ALL)for(const [z,i] of [['desert#DB',''],['swamp#SB','FQ'],['mine#MB','FQ'],['sea#AB','FQ'],['castle#CB','FQ'],['sky#KB','FQ'],['power#PB','FQ'],['clock#TB','FQ'],['factory#FB','FQ'],['core#CB','FQ']]){const r=room(z,i);console.log('  ',JSON.stringify({...r,route:undefined,routeLen:r.route.length}),r.route);ok(r.stalls!=null&&r.stalls<=2,`${z}: ${r.min} steps, ${r.stalls} idle`)}
console.log(`(${((Date.now()-T0)/1000).toFixed(1)}s) `+(fails?`${fails}/${n} FAILED`:`${n} boss-room checks passed`));process.exit(fails?1:0)
