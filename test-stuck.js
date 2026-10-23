// stuck detector (WE.zoneStuck): never flags a solvable area; flags real dead states. Cross-checked with an exhaustive whole-world search without ↺.
const assert=require('assert'),E=require('./world-engine.js'),W=E.parseWorld(require('./world/world-def.js'));
const Z=W.maps.ice.zones.find(z=>z.id==='ice#G');
function st(boxes,rx,ry){let s=E.initState(W);s.m='ice';s.visited=['grass','ice'];s.inv='c';
 s.boxes=s.boxes.filter(k=>{const [x,y]=k.split(':')[1].split(',').map(Number);return !(k.startsWith('ice:')&&x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h)}).concat(boxes.map(([x,y])=>'ice:'+x+','+y));
 s.x=rx;s.y=ry;s.zone=Z.id;s.zoneEntry=Z.entry.slice();s.left=null;return s}
function globalNoReset(s0){const seen=new Set([E.key(s0)]),q=[s0];for(let i=0;i<q.length;i++)for(const a of ['up','down','left','right','act','wait']){const r=E.mstep(W,q[i],a);if(r.result==='noop'||r.result==='fail'||r.result==='fall'||r.state===q[i])continue;if(r.state.cleared.indexOf(Z.id)>=0)return true;const k=E.key(r.state);if(!seen.has(k)){seen.add(k);q.push(r.state)}}return false}
let n=0;const T=(name,f)=>{const t=Date.now();f();n++;console.log('ok',name,(Date.now()-t)+'ms')};
T('G start is not stuck',()=>assert.strictEqual(E.zoneStuck(W,st([[5,5],[6,6]],...Z.entry)),false));
T('G after a sensible first push is not stuck',()=>{let s=st([[5,5],[6,6]],...Z.entry);for(const a of ['up','left'])s=E.mstep(W,s,a).state;const v=E.zoneStuck(W,s);assert.strictEqual(v,false);assert.ok(globalNoReset(s))});
T('G dead state (box frozen in corner) is flagged and truly unsolvable',()=>{const s=st([[4,4],[3,8]],7,6);assert.strictEqual(E.zoneStuck(W,s),true);assert.strictEqual(globalNoReset(s),false)});
T("Jasper's G state (boxes (4,4),(6,7), robot (7,5)): detector agrees with the exhaustive no-↺ search",()=>{const s=st([[4,4],[6,7]],7,5);assert.strictEqual(E.zoneStuck(W,s),!globalNoReset(s))});
T('random G walks: never flagged when a no-↺ solution exists',()=>{let bad=0,checked=0;for(let r=0;r<12;r++){let s=st([[5,5],[6,6]],...Z.entry),seed=r*7919+1;for(let i=0;i<14;i++){seed=(seed*1103515245+12345)%2147483648;const a=['up','down','left','right'][seed%4];const nr=E.mstep(W,s,a);if(nr.result!=='noop'&&nr.result!=='fail'&&nr.state.zone===Z.id)s=nr.state}
  if(E.zoneStuck(W,s)===true){checked++;if(globalNoReset(s))bad++}}assert.strictEqual(bad,0)});
// volcano V5 (2026-10-23, Jasper "還是有bug 不能通過"): the bottom row used to be wall, so the only way was the beetle's 1-wide top lane —
// 5 wall-bumps of waiting from the entry, and batting the beetle left parks it on the exit corner (34,11). Now (35,12) is a lava pool:
// push the crate in, it cools, walk the bottom row. Assert: no idle steps, Jasper's screenshot state passes, no dead state anywhere in V5.
{const VZ=W.maps.volcano.zones.find(z=>z.id==='volcano#V5');
 const v5=(x,y,bug)=>{let s=E.initState(W);Object.assign(s,{m:'volcano',x,y,f:'left',inv:'FQcfkm',zone:VZ.id,zoneEntry:VZ.entry.slice(),visited:['grass','volcano'],left:null});s.pats=[];
  s.bugs=s.bugs.filter(o=>o.zone===VZ.id);s.boxes=s.boxes.filter(k=>k==='volcano:36,12');if(bug)Object.assign(s.bugs[0],bug);return s};
 const vk=s=>[s.x,s.y,s.f,s.held,s.boxes.join(';'),s.bugs.map(o=>o.x+','+o.y+'d'+o.d+'f'+(o.fr||0)).join(';'),Object.keys(s.ch||{}).sort().map(k=>k+s.ch[k]).join(';'),(s.rocks||[]).length].join('|'); // V5-local state
 const atExit=s=>s.m==='volcano'&&s.x===VZ.exit[0]&&s.y===VZ.exit[1];
 const solve=s0=>{const seen=new Set([vk(s0)]);let q=[[s0,0,'']];for(let i=0;i<q.length;i++){const [s,d,p]=q[i];for(const a of ['up','down','left','right','act','wait']){const r=E.mstep(W,s,a);if(r.result==='fail'||r.result==='noop'||r.state===s)continue;
   if(atExit(r.state))return p+a[0];if(r.state.zone!==VZ.id)continue;const k=vk(r.state);if(!seen.has(k)){seen.add(k);q.push([r.state,d+1,p+a[0]])}}}return null};
 T('V5 from the entry: 6 steps straight left (crate into the lava pool), no waiting',()=>{assert.strictEqual(E.cell(W,E.initState(W),'volcano',35,12),'h');assert.strictEqual(solve(v5(...VZ.entry)),'llllll')});
 T("V5 Jasper's screenshot (robot (37,12), beetle right above, either direction): 4 steps left, no waiting",()=>{for(const d of [2,3])assert.strictEqual(solve(v5(37,12,{x:37,y:11,d})),'llll')});
 T('V5 every reachable state can still reach the exit without ↺ (0 dead ends), and the detector never flags it',()=>{const s0=v5(...VZ.entry),seen=new Map([[vk(s0),s0]]),q=[s0];
  for(let i=0;i<q.length;i++)for(const a of ['up','down','left','right','act','wait']){const r=E.mstep(W,q[i],a);if(r.result==='fail'||r.result==='noop'||r.state===q[i]||r.state.zone!==VZ.id)continue;const k=vk(r.state);if(!seen.has(k)){seen.set(k,r.state);q.push(r.state)}}
  assert.ok(q.length>20&&q.length<5000,'V5 states '+q.length);let dead=0;for(const s of q){if(!solve(s))dead++}assert.strictEqual(dead,0);for(const s of q.filter((_,i)=>i%7===0))assert.notStrictEqual(E.zoneStuck(W,s),true);console.log('   V5 reachable states:',q.length,'dead:',dead)})}
// night factory F7 (2026-10-23, Jasper「這一段是不是也又bug」): (1) engine — key() held the raw action counter s.zt (only the clock tower
// reads it), so every v2 area looked infinite to zoneStuck: it hit its limit and answered null, and the ↺ glow / 「箱子卡住了」 hint never
// came on from the desert onward. (2) F7 map — the top-right → belt and the bottom ← belt each threw the crate into a corner (2 of 3 dead
// pockets, 74 of 110 dead states); only the timed push from the left ↓↑ belts worked. Now (18,12) is ↓ (crate drops right above the switch)
// and the bottom row is → → (crate rides onto the switch); (14,12) is floor so the way back needs no belt bounce / wall bump. Assert: the natural route works with no waiting, old stuck saves heal, every
// remaining dead state (crate pushed left into (14,13) or (14,12)) is flagged so ↺ glows, and nothing else is flagged.
{const FZ=W.maps.factory.zones.find(z=>z.id==='factory#F7');
 const f7=(x,y,box)=>{let s=E.initState(W);Object.assign(s,{m:'factory',x,y,f:'left',inv:'FQcfkm',zone:FZ.id,zoneEntry:FZ.entry.slice(),visited:['grass','factory'],left:null});
  s.boxes=s.boxes.filter(k=>k==='factory:16,12');if(box)s.boxes=[box];return s};
 const fk=s=>[s.x,s.y,s.f,s.held,s.boxes.filter(k=>k.startsWith('factory:')).sort().join(';')].join('|');
 const atExit=s=>s.m==='factory'&&s.x===FZ.exit[0]&&s.y===FZ.exit[1];
 const go=(s,keys)=>{const A={L:'left',R:'right',U:'up',D:'down'};for(const c of keys){const r=E.mstep(W,s,A[c]);assert.notStrictEqual(r.result,'fail');s=r.state}return s};
 const solve=s0=>{const seen=new Set([fk(s0)]);let q=[[s0,'']];for(let i=0;i<q.length;i++){const [s,p]=q[i];for(const a of ['up','down','left','right','act','wait']){const r=E.mstep(W,s,a);if(r.result==='fail'||r.result==='noop'||r.state===s)continue;
   if(atExit(r.state))return p+a[0];if(r.state.zone!==FZ.id)continue;const k=fk(r.state);if(!seen.has(k)){seen.add(k);q.push([r.state,p+a[0]])}}}return null};
 T('F7 tiles: top-right ↓, bottom row → →, top-left corner open; zoneStuck gives a real answer (not null) in a v2 area',()=>{const s=E.initState(W);
  assert.deepStrictEqual([E.cell(W,s,'factory',18,12),E.cell(W,s,'factory',16,14),E.cell(W,s,'factory',17,14),E.cell(W,s,'factory',14,12)],['↓','→','→','.']);assert.strictEqual(E.zoneStuck(W,f7(...FZ.entry)),false)});
 T("F7 from the entry (Jasper's screenshot): push the crate right onto ↓, then down onto the switch — 15 steps, gate open after 8, no waiting",()=>{
  let s=go(f7(...FZ.entry),'LLLLRRRD');assert.deepStrictEqual(s.boxes,['factory:18,14']);s=go(s,'LLLLDDL');assert.ok(atExit(s),'at '+s.x+','+s.y);
  const p=solve(f7(...FZ.entry));assert.strictEqual(p.length,15);assert.ok(!p.includes('w'),p)});
 T('F7 old saves with the crate on the old corner spots heal themselves (crate at (18,12) or (16,14) is solvable now)',()=>{
  assert.ok(solve(f7(17,13,'factory:18,12')));assert.ok(solve(f7(16,13,'factory:16,14')))});
 T('F7 every dead state is flagged by zoneStuck (↺ glows), no live state is flagged',()=>{const s0=f7(...FZ.entry),seen=new Set([fk(s0)]),q=[s0];
  for(let i=0;i<q.length;i++)for(const a of ['up','down','left','right','act','wait']){const r=E.mstep(W,q[i],a);if(r.result==='fail'||r.result==='noop'||r.state===q[i]||r.state.zone!==FZ.id)continue;const k=fk(r.state);if(!seen.has(k)){seen.add(k);q.push(r.state)}}
  let dead=0;for(const s of q){const ok=!!solve(s),st=E.zoneStuck(W,s);if(!ok){dead++;assert.strictEqual(st,true,'unflagged dead '+fk(s));assert.ok(['factory:14,13','factory:14,12'].includes(s.boxes[0]),'dead with crate at '+s.boxes)}else assert.strictEqual(st,false,'false alarm '+fk(s))}
  assert.ok(dead>0&&dead<q.length/4,'dead '+dead+'/'+q.length);console.log('   F7 reachable states:',q.length,'dead (all flagged):',dead)})}
console.log(n+' tests passed');
