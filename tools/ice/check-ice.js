// Step-based checker for world/ice.txt (extends world/check.js rules).
// Adds: I ice (claws k stop it), J hard ice, keys m/M (+c from grass), spikes H, patrol P (ping-pong, bounces off boxes/bombs, killed by blast),
// zone reset action, leave-zone-uncleared = zone restored (sound because reset exists), boxes may not leave their zone,
// bomb fuse = FUSE ticks (3 s at <=2 moves/s), WAIT action passes time without moving the patrol.
const fs=require('fs');
const file=process.argv[2]||__dirname+'/../../world/ice.txt';const FUSE=+(process.env.FUSE||6);
const src=fs.readFileSync(file,'utf8');let grid=src.split('```')[1].trim().split('\n');
if(process.env.PATCH){const p=JSON.parse(process.env.PATCH);for(const [r,c,ch] of p){const a=grid[r].split('');a[c]=ch;grid[r]=a.join('')}}
const H=grid.length,W=grid[0].length;
const areas=[];
for(const m of src.matchAll(/區域 (\w)：第 (\d+)–(\d+) 行、第 (\d+)–(\d+) 列｜入口 \((\d+),(\d+)\)｜出口 \((\d+),(\d+)\)/g))
  areas.push({id:m[1],r1:+m[2]-1,r2:+m[3]-1,c1:+m[4]-1,c2:+m[5]-1,en:(+m[6]-1)*W+(+m[7]-1),ex:(+m[8]-1)*W+(+m[9]-1)});
const inRect=(a,r,c)=>r>=a.r1&&r<=a.r2&&c>=a.c1&&c<=a.c2;
const zoneOf=q=>areas.findIndex(a=>inRect(a,Math.floor(q/W),q%W));
const DIRS=[-W,W,-1,1];
const T=q=>(q<0||q>=W*H)?'#':grid[Math.floor(q/W)][q%W];
const boxes0=[],pat0=[];let start=-1,underR=-1,t2=-1;
for(let q=0;q<W*H;q++){const t=T(q);if(t==='B')boxes0.push(q);if(t==='P')pat0.push([q,1]);if(t==='1')start=q;if(t==='R')underR=q+W;if(t==='2')t2=q;}
const viol=new Set();
function mk(opts){const rect=opts.rect;
 const tile=q=>{if(rect!=null){const a=areas[rect];if(!inRect(a,Math.floor(q/W),q%W))return '#'}const t=T(q);return t==='B'||t==='P'?'.':t};
 const S0={p:opts.start,d:0,carry:0,bombs:[],boxes:boxes0.filter(q=>rect==null||zoneOf(q)===rect),blown:[],keys:opts.keys||'c',claws:!!opts.claws,cleared:0,pats:pat0.filter(x=>rect==null||zoneOf(x[0])===rect).map(x=>x.slice()),got:''};
 const key=s=>[s.p,s.d,s.carry,s.bombs.join(';'),s.boxes.join(','),s.blown.join(','),s.keys,+s.claws,s.cleared,s.pats.join(';'),s.got].join('|');
 const doorOpen=(s,q)=>{const k=zoneOf(q);if(k>=0&&(s.cleared>>k&1))return true;for(let x=0;x<W*H;x++)if(tile(x)==='X'&&zoneOf(x)===k&&!s.boxes.includes(x))return false;return true};
 const solid=(s,q)=>{const t=tile(q);if('#b'.includes(t))return true;if(t==='R')return !s.keys.includes('f');if(t==='%')return !s.blown.includes(q);if(t==='D')return !doorOpen(s,q);
   if(t==='C')return !s.keys.includes('c');if(t==='M')return !s.keys.includes('m');return false};
 const occ=(s,q)=>s.boxes.includes(q)||s.bombs.some(b=>b[0]===q);
 const restore=(s,k)=>{const A=areas[k];const inA=q=>zoneOf(q)===k;
   s.boxes=s.boxes.filter(q=>!inA(q)).concat(boxes0.filter(inA)).sort((a,b)=>a-b);s.blown=s.blown.filter(q=>!inA(q));s.bombs=s.bombs.filter(b=>!inA(b[0]));
   s.pats=s.pats.filter(x=>!(x[2]===k)).concat(pat0.filter(x=>inA(x[0])).map(x=>[x[0],x[1],k]));s.pats.sort((a,b)=>a[2]-b[2]||a[0]-b[0]);};
 S0.pats.forEach(x=>x[2]=zoneOf(x[0]));
 function step(s0,a){
  const s={...s0,bombs:s0.bombs.map(b=>b.slice()),boxes:s0.boxes.slice(),blown:s0.blown.slice(),pats:s0.pats.map(x=>x.slice())};
  const p0=s.p,z0=zoneOf(p0);let fresh=-1,path=[];
  if(a===6){if(z0<0||(s.cleared>>z0&1))return null;restore(s,z0);s.p=areas[z0].en;s.carry=s0.carry;return s;}
  if(a===5){if(!s.bombs.length)return null;}
  else if(a<4){s.d=a;const dq=DIRS[a];const tq=s.p+dq;
   if(!solid(s,tq)){let ok=true;
    if(occ(s,tq)){const free=q=>!solid(s,q)&&!occ(s,q)&&!'H123456789'.includes(tile(q))&&!s.pats.some(x=>x[0]===q);
      let b=tq;if(!free(b+dq))ok=false;else{b+=dq;while('IJ'.includes(tile(b))&&free(b+dq))b+=dq;
        if(zoneOf(b)!==zoneOf(tq)){viol.add((s.boxes.includes(tq)?'box ':'bomb ')+tq+'->'+b);ok=false}
        else{const bi=s.boxes.indexOf(tq);if(bi>=0){s.boxes[bi]=b;s.boxes.sort((x,y)=>x-y)}else s.bombs.find(x=>x[0]===tq)[0]=b;}}}
    if(ok){let q=tq;path.push(q);
      const slides=q=>tile(q)==='J'||(tile(q)==='I'&&!s.claws);
      while(slides(q)){const n=q+dq;if(solid(s,n)||occ(s,n))break;q=n;path.push(q);if(tile(q)==='H')break}
      s.p=q;}}
  }else{const tq=s.p+DIRS[s.d],t=tile(tq);
   if(s.carry&&!solid(s,tq)&&!occ(s,tq)&&'.IJX'.includes(t)&&!s.pats.some(x=>x[0]===tq)){s.bombs.push([tq,FUSE]);s.carry=0;fresh=tq}
   else if(!s.carry&&t==='b')s.carry=1;else return null;}
  const t=tile(s.p);if(t==='H')return 'fail';
  if(t==='k'&&!s.claws){s.claws=true;s.got+='k'}
  if(t==='m'&&!s.keys.includes('m'))s.keys+='m';if(t==='f'&&!s.keys.includes('f'))s.keys+='f';
  const z=zoneOf(s.p);
  if(z>=0&&s.p===areas[z].ex&&!(s.cleared>>z&1)){s.cleared|=1<<z;s.boxes=s.boxes.filter(q=>zoneOf(q)!==z);s.pats=s.pats.filter(x=>x[2]!==z)}
  // patrols move on real moves/acts (not on WAIT)
  if(a!==5){for(const x of s.pats){if(x[0]<0)continue;const o=x[0];let dq=x[1]?1:-1;
     const blocked=q=>solid(s,q)||occ(s,q)||tile(q)==='H';
     if(blocked(o+dq)){x[1]^=1;dq=-dq}if(!blocked(o+dq))x[0]=o+dq;
     if(x[0]===s.p||(x[0]===p0&&o===s.p)||path.slice(0,-1).includes(o)||(path.length&&o===s.p))return 'fail';}}
  else for(const x of s.pats)if(x[0]===s.p)return 'fail';
  // bombs
  const keep=[];for(const b of s.bombs){if(b[0]!==fresh)b[1]--;if(b[1]>0){keep.push(b);continue}
    for(const q of [b[0],b[0]-W,b[0]+W,b[0]-1,b[0]+1]){if(q===s.p)return 'fail';for(const x of s.pats)if(x[0]===q)x[0]=-1;
      if(tile(q)==='%'&&!s.blown.includes(q))s.blown.push(q)}}
  s.bombs=keep;s.blown.sort((x,y)=>x-y);s.pats=s.pats.filter(x=>x[0]>=0);
  // leaving a zone uncleared restores it (solver abstraction; the player can always reset)
  if(z0>=0&&z!==z0&&!(s.cleared>>z0&1))restore(s,z0);
  return s;}
 return {S0,step,key};}
function bfs(opts,goal,max=2e6){const {S0,step,key}=mk(opts);const seen=new Map([[key(S0),null]]);let fr=[S0],n=0;
 while(fr.length){const nx=[];for(const s of fr){if(goal(s))return {n,s};if(T(s.p)==='1'&&n>0)continue;
   for(let a=0;a<7;a++){const t=step(s,a);if(!t||t==='fail')continue;const k=key(t);if(!seen.has(k)){seen.set(k,1);nx.push(t)}}}
  fr=nx;n++;if(seen.size>max)return {n:-1,trunc:true};}return null}
module.exports={t2,grid,areas,W,H,mk,bfs,start,underR,viol,T,zoneOf};
if(require.main===module){
 console.log(`地圖 ${W}×${H}  區域 ${areas.length}  炸彈引信 ${FUSE} 步`);
 const items={};let ok=true;
 const ord=areas.map((a,i)=>i);
 for(const i of ord){const A=areas[i];const w=A.c2-A.c1+1,h=A.r2-A.r1+1;
  const after=k=>areas.findIndex(x=>x.id===k)<i;
  const opts={rect:i,start:A.en,keys:'c'+(after('E')?'m':''),claws:after('G')};
  const r=bfs(opts,s=>s.p===A.ex);const fit=w<=7&&h<=8;if(!r||!fit)ok=false;
  console.log(`區域 ${A.id}  ${w}×${h}${fit?'':' 太大!'}  ${r?'最少 '+r.n+' 步':'無解!'}${opts.claws?'（有冰爪）':''}`);}
 module.exports.ok=ok;}
