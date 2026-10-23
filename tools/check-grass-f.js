// 草原 F 區檢查（用 world-engine.js 自己的 step/mstep 規則，不改引擎）。用法：node tools/check-grass-f.js [grass.txt]
// 不給檔案 = 用 world/world-def.js 裡的草原；給 grass.txt = 只把草原 grid 換成該檔（試新版用）。
const fs=require('fs'),path=require('path');
const E=require('../world-engine.js');const def=JSON.parse(JSON.stringify(require('../world/world-def.js')));
if(process.argv[2]){const t=fs.readFileSync(process.argv[2],'utf8');def.maps.grass.grid=t.split('```')[1].trim().split('\n');}
const W=E.parseWorld(def);W.solverAbstract=true;
const M=W.maps.grass,F=M.zones.find(z=>z.id==='grass#F');
const inF=s=>s.m==='grass'&&s.x>=F.x&&s.x<F.x+F.w&&s.y>=F.y&&s.y<F.y+F.h;
const cracks=[];for(let y=F.y;y<F.y+F.h;y++)for(let x=F.x;x<F.x+F.w;x++)if(M.grid[y][x]==='%')cracks.push('grass:'+x+','+y);
// 起點：站在 F 入口，A–E 已過關，手上沒炸彈
const s0=E.initState(W);s0.x=F.entry[0];s0.y=F.entry[1];s0.f='up';s0.cleared=['A','B','C','D','E'].map(i=>'grass#'+i);s0.zone=null;
function bfs(start,goal,allow){const k0=E.key(start),prev=new Map([[k0,null]]);let q=[[k0,start]],n=0,dist=0;
 while(q.length){const nq=[];for(const [k,s] of q){if(goal(s))return{len:dist,states:prev.size};
  for(const a of ['up','down','left','right','act','reset','wait']){const r=E.mstep(W,s,a);if(['noop','fall','tired','fail'].includes(r.result)||r.state===s)continue;
   const ns=E.normalize(W,r.state);if(!allow(ns))continue;const nk=E.key(ns);if(prev.has(nk))continue;prev.set(nk,[k,a]);nq.push([nk,ns]);}}
  q=nq;dist++;if(++n>2000)break;}return{len:null,states:prev.size}}
const exitF=s=>s.m==='ice'||(s.m==='grass'&&s.x===F.exit[0]&&s.y===F.exit[1]);
const noBlast=s=>!cracks.some(c=>s.broken.includes(c));
const r1=bfs(s0,exitF,s=>inF(s)||exitF(s));
console.log('F 區內（不離開長方形）入口→出口：',r1.len!=null?r1.len+' 步':'無解','（狀態 '+r1.states+'）');
const north=s=>s.m==='ice'||(s.m==='grass'&&s.y<=F.y+F.h); // 第 1–11 行：F 區＋第 9 列走廊＋第 11 行走廊＋E 區
const r2=bfs(s0,exitF,north);
console.log('F 入口→出口（可走 F 外的走廊）：',r2.len!=null?r2.len+' 步':'無解');
const r3=bfs(s0,exitF,s=>noBlast(s)&&north(s));
console.log('必要性：不炸 F 的裂牆也能過？',r3.len!=null?'能（'+r3.len+' 步）← 冰湖炸彈不是必要的':'不能（裂牆必須炸）');
const r4=bfs(s0,exitF,s=>(inF(s)||exitF(s))&&noBlast(s));
console.log('必要性（只在 F 內）：不炸裂牆能過？',r4.len!=null?'能（'+r4.len+' 步）':'不能');
// 軟鎖：F 內所有可達狀態都能回到出口（含 ↺ 重來）
const k0=E.key(s0),seen=new Map([[k0,s0]]),rev=new Map(),q=[s0];
for(let i=0;i<q.length;i++){const s=q[i];if(exitF(s))continue;const ks=E.key(s);
 for(const a of ['up','down','left','right','act','reset','wait']){const r=E.mstep(W,s,a);if(['noop','fall','tired','fail'].includes(r.result)||r.state===s)continue;
  const ns=E.normalize(W,r.state);if(!inF(ns)&&!exitF(ns))continue;const nk=E.key(ns);if(!rev.has(nk))rev.set(nk,[]);rev.get(nk).push(ks);if(!seen.has(nk)){seen.set(nk,ns);q.push(ns)}}}
const ok=new Set(),st=[];for(const [k,s] of seen)if(exitF(s)){ok.add(k);st.push(k)}
while(st.length){const k=st.pop();for(const p of rev.get(k)||[])if(!ok.has(p)){ok.add(p);st.push(p)}}
console.log('F 區內可達狀態',seen.size,'，軟鎖',seen.size-ok.size);
