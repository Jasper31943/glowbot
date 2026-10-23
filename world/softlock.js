const FN=+(process.env.FUSE_N||4);
// 草原軟鎖檢查：可達狀態全列舉＋反向可達性，含「重設」動作。
// 抽象化：只追蹤機器人所在區域的箱子；離開區域時，該區箱子視為恢復原狀（等同之後回來按重設）。
// 這個抽象成立的前提會一併檢查：(a) 箱子永遠不會離開自己的區域 (b) 箱子永遠不會停在區域入口/出口格。
// 完整乘積狀態（所有區域箱子同時追蹤）超過 1500 萬個狀態、會耗盡記憶體，所以不採用。
// 用法：node softlock.js [world-def.js] [route.txt]
const path=require('path'),fs=require('fs');
const WD=require(path.resolve(process.argv[2]||__dirname+'/../dist/world/world-def.js'));
const M=WD.maps.grass, grid=M.grid, H=grid.length, W=grid[0].length;
const Z=M.zones.map(z=>({id:z.id,r1:z.r1-1,r2:z.r2-1,c1:z.c1-1,c2:z.c2-1,en:(z.entry[0]-1)*W+z.entry[1]-1,ex:z.exit?(z.exit[0]-1)*W+z.exit[1]-1:-1}));
const DIRS=[[-1,0],[1,0],[0,-1],[0,1]], DN={up:0,down:1,left:2,right:3};
const T=(r,c)=>(r<0||c<0||r>=H||c>=W)?'#':grid[r][c];
const zoneOf=q=>{const r=q/W|0,c=q%W;return Z.findIndex(z=>r>=z.r1&&r<=z.r2&&c>=z.c1&&c<=z.c2);};
const ZQ=[];for(let q=0;q<H*W;q++)ZQ[q]=zoneOf(q);
const cells=ch=>{const o=[];for(let q=0;q<H*W;q++)if(grid[q/W|0][q%W]===ch)o.push(q);return o;};
const BOX0=cells('B'),CRACK=cells('%'),SW=cells('X'),START=cells('S')[0],GOAL=cells('1')[0];
// 狀態：{p,d,carry,bombs:[[q,t]],boxes:[q...],blown:bitmask over CRACK,key:0/1}
const enc=s=>s.zk+','+s.p+','+s.d+','+s.carry+','+s.key+','+s.blown+','+s.boxes.join('.')+','+s.bombs.map(b=>b.join(':')).join('.');
const clone=s=>({...s,bombs:s.bombs.map(b=>b.slice()),boxes:s.boxes.slice()});
function solid(s,q){const r=q/W|0,c=q%W,t=T(r,c);
  if(t==='#'||t==='R'||t==='b')return true;
  if(t==='%')return !(s.blown>>CRACK.indexOf(q)&1);
  if(t==='D'){const k=ZQ[q];return !SW.filter(x=>ZQ[x]===k).every(x=>s.boxes.includes(x));}
  if(t==='C')return !s.key;
  return false;}
const occ=(s,q)=>s.boxes.includes(q)||s.bombs.some(b=>b[0]===q);
// 動作 0-3 方向、4 動作鍵、5 重設目前區域。回傳 [新狀態, 標籤] 或 null（失敗/無效）
function step(s0,a){
  const s=clone(s0);let fresh=-1,tag='move';
  const r0=s.p/W|0,c0=s.p%W;
  if(a===5){const k=ZQ[s.p];if(k<0)return null;const z=Z[k];
    s.boxes=s.boxes.filter(q=>ZQ[q]!==k).concat(BOX0.filter(q=>ZQ[q]===k)).sort((x,y)=>x-y);
    s.bombs=s.bombs.filter(b=>ZQ[b[0]]!==k);
    CRACK.forEach((q,i)=>{if(ZQ[q]===k)s.blown&=~(1<<i);});
    s.p=z.en;s.d=0;s.zk=k;return [s,'reset'];}  // 重設不推進炸彈計時
  if(a===6){if(!s.bombs.length)return null;tag='wait';} // 等待：原地讓炸彈倒數
  else if(a<4){const [dr,dc]=DIRS[a];s.d=a;const tq=s.p+dr*W+dc,tr=r0+dr,tc=c0+dc;
    if(T(tr,tc)==='#'&&false);
    if(solid(s,tq)||tr<0||tc<0||tr>=H||tc>=W)tag='bump';
    else{let ok=true;
      if(occ(s,tq)){let b=tq;const isBox=s.boxes.includes(tq),bz=ZQ[tq]; // box-blocked: boxes stay in their zone, off its entry/exit (same rule as world-engine)
        const nb=q=>!solid(s,q)&&!occ(s,q)&&!'H1'.includes(grid[q/W|0][q%W])&&!(isBox&&bz>=0&&(ZQ[q]!==bz||q===Z[bz].en||q===Z[bz].ex));
        if(!nb(b+dr*W+dc))ok=false;else{b+=dr*W+dc;while(grid[b/W|0][b%W]==='I'&&nb(b+dr*W+dc))b+=dr*W+dc;
          const i=s.boxes.indexOf(tq);if(i>=0){s.boxes[i]=b;s.boxes.sort((x,y)=>x-y);}else s.bombs.find(x=>x[0]===tq)[0]=b;tag='push';}}
      if(ok){let q=tq;while(grid[q/W|0][q%W]==='I'){const n=q+dr*W+dc;if(solid(s,n)||occ(s,n))break;q=n;}s.p=q;}else tag='bump';}
  }else{const [dr,dc]=DIRS[s.d];const tq=s.p+dr*W+dc,t=T(r0+dr,c0+dc);
    if(s.carry&&!solid(s,tq)&&!occ(s,tq)&&'.IX*c'.includes(t)){s.bombs.push([tq,FN]);s.carry=0;fresh=tq;tag='place';}
    else if(!s.carry&&t==='b'){s.carry=1;tag='grab';}
    else tag='noop';}
  const here=grid[s.p/W|0][s.p%W];if(here==='H')return null;
  if(here==='c')s.key=1;
  const keep=[];
  for(const b of s.bombs){if(b[0]!==fresh)b[1]--;if(b[1]>0){keep.push(b);continue;} // 模型：放下後最多 FN 個動作（含「等待」）就爆炸；實際遊戲是約 3.3 秒
    for(const q of [b[0],b[0]-W,b[0]+W,b[0]-1,b[0]+1]){if(q===s.p)return null;const i=CRACK.indexOf(q);if(i>=0)s.blown|=1<<i;}tag+='+blast';}
  s.bombs=keep;s.bombs.sort((x,y)=>x[0]-y[0]);
  for(const b of s.boxes){const k=ZQ[b];if(k!==s.zk)viol.add(`箱子離開區域 ${Z[s.zk].id}：第 ${(b/W|0)+1} 行第 ${b%W+1} 列`);
    if(k>=0&&(b===Z[k].en||b===Z[k].ex))viol.add(`箱子停在區域 ${Z[k].id} 的入口/出口格`);}
  if(ZQ[s.p]!==s.zk){s.zk=ZQ[s.p];s.boxes=s.zk>=0?BOX0.filter(q=>ZQ[q]===s.zk):[];}
  return [s,tag];}
const viol=new Set();
const S0={zk:ZQ[START],p:START,d:0,carry:0,key:0,blown:0,boxes:BOX0.filter(q=>ZQ[q]===ZQ[START]),bombs:[]};
// 1) 正向列舉所有可達狀態，記錄反向邊
const id=new Map(),states=[],rev=[];
const add=s=>{const k=enc(s);let i=id.get(k);if(i===undefined){i=states.length;id.set(k,i);states.push(s);rev.push([]);}return i;};
add(S0);
for(let i=0;i<states.length;i++){const s=states[i];if(s.p===GOAL)continue;
  for(let a=0;a<7;a++){const r=step(s,a);if(!r)continue;const j=add(r[0]);if(j!==i)rev[j].push(i);}
  if(i%500000===0&&i)console.error('…',i,states.length);}
// 2) 反向從目標出發，標記能到隧道 1 的狀態
const good=new Uint8Array(states.length),q=[];
states.forEach((s,i)=>{if(s.p===GOAL){good[i]=1;q.push(i);}});
while(q.length){const j=q.pop();for(const i of rev[j])if(!good[i]){good[i]=1;q.push(i);}}
console.log(viol.size?'抽象前提違反：\n  '+[...viol].join('\n  '):'抽象前提成立：箱子不會離開區域，也不會堵住入口/出口');if(viol.size)process.exitCode=1;
const bad=[];states.forEach((s,i)=>{if(!good[i])bad.push(s);});
console.log(`地圖 ${W}×${H}，可達狀態 ${states.length}，能到隧道 1 的 ${states.length-bad.length}，軟鎖 ${bad.length}`);
const where=s=>`第 ${(s.p/W|0)+1} 行第 ${s.p%W+1} 列 ${ZQ[s.p]>=0?'區域 '+Z[ZQ[s.p]].id:'區域外'}`;
const groups={};for(const s of bad){const k=where(s);groups[k]=(groups[k]||0)+1;}
for(const [k,n] of Object.entries(groups).slice(0,40))console.log('  軟鎖：',k,`（${n} 個狀態）`);
// 3) 重播路線
const routeFile=process.argv[3]||__dirname+'/route-119.txt';
if(fs.existsSync(routeFile)){
  const lines=fs.readFileSync(routeFile,'utf8').split('\n').filter(l=>/^\s*\d+\s+\w+\s+->/.test(l));
  let s=S0,ok=true,n=0;
  for(const l of lines){const m=l.match(/^\s*(\d+)\s+(\w+)\s+->\s+(\w+) row (\d+) col (\d+)/);m.splice(3,1,m[3]==='grass'?m[4]:null);m.splice(4,1,m[5]);
    const a=m[2]==='act'?4:m[2]==='reset'?5:DN[m[2]];const r=step(s,a);n++;
    if(!r){console.log(`路線第 ${m[1]} 步失敗（機器人死亡/無效）`);ok=false;break;}
    s=r[0];if(m[3]===null){if(s.p!==GOAL){console.log(`路線第 ${m[1]} 步應進入隧道 1，但不在隧道口`);ok=false;}break;}const er=+m[3]-1,ec=+m[4]-1;
    if(s.p!==er*W+ec){console.log(`路線第 ${m[1]} 步位置不符：預期 (${+m[3]},${+m[4]})，實際 (${(s.p/W|0)+1},${s.p%W+1})`);ok=false;break;}}
  console.log(`路線 ${path.basename(routeFile)}：${lines.length} 步，${ok&&s.p===GOAL?'重播成功，抵達隧道 1':'重播失敗'}`);
  if(!(ok&&s.p===GOAL))process.exitCode=1;}
if(bad.length)process.exitCode=1;
