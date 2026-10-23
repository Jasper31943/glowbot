// 草原地圖獨立檢查器：炸彈 / 裂牆 / 冰 / 箱子 / 開關門 / 鑰匙。不依賴 game.js / logic.js / solve.js。
// 用法：node check.js [grass.txt]
const fs=require('fs');const FN=+(process.env.FUSE_N||4); // 公平性模型：放下炸彈到爆炸之間最多 FN 個動作（慢速玩家每秒 2 步，實際約 3.4 秒）
const src=fs.readFileSync(process.argv[2]||__dirname+'/grass.txt','utf8');
const grid=src.split('```')[1].trim().split('\n');
const H=grid.length,W=grid[0].length;
// 區域：「區域 A：第 r1–r2 行、第 c1–c2 列｜入口 (r,c)｜出口 (r,c)｜帶炸彈進入」（1 起算）
const areas=[];
for(const m of src.matchAll(/區域 (\w)：第 (\d+)–(\d+) 行、第 (\d+)–(\d+) 列｜入口 \((\d+),(\d+)\)｜出口 \((\d+),(\d+)\)(｜帶炸彈進入)?/g))
  areas.push({id:m[1],r1:+m[2]-1,r2:+m[3]-1,c1:+m[4]-1,c2:+m[5]-1,en:[+m[6]-1,+m[7]-1],ex:[+m[8]-1,+m[9]-1],carry:!!m[10]});
const DIRS=[[-1,0],[1,0],[0,-1],[0,1]];
const inRect=(a,r,c)=>r>=a.r1&&r<=a.r2&&c>=a.c1&&c<=a.c2;
const areaOf=(r,c)=>areas.findIndex(a=>inRect(a,r,c));

function solve(opts){
  const {rect,start,carry0,goal,whole}=opts;
  const tile=(r,c)=>(r<0||c<0||r>=H||c>=W||(rect&&!inRect(rect,r,c)))?'#':grid[r][c];
  const boxes0=[];for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(tile(r,c)==='B')boxes0.push(r*W+c);
  const S0={p:start[0]*W+start[1],d:0,carry:carry0?1:0,bombs:[],boxes:boxes0.sort((a,b)=>a-b),blown:[],keys:'',cleared:0,bolts:0};
  const key=s=>[s.p,s.d,s.carry,s.bombs.join(','),s.boxes.join(','),s.blown.join(','),s.keys,s.cleared].join('|');
  const doorOpen=(s,r,c)=>{ // D：所在區域所有 X 上都有箱子（或該區已過關）
    const k=areaOf(r,c); if(whole&&k>=0&&(s.cleared>>k&1))return true;
    for(let rr=0;rr<H;rr++)for(let cc=0;cc<W;cc++) if(tile(rr,cc)==='X'&&areaOf(rr,cc)===k&&!s.boxes.includes(rr*W+cc))return false;
    return true;};
  const solid=(s,r,c)=>{const t=tile(r,c);
    if(t==='#'||t==='R'||t==='b')return true;
    if(t==='%')return !s.blown.includes(r*W+c);
    if(t==='D')return !doorOpen(s,r,c);
    if(t==='C')return !s.keys.includes('c');
    return false;};
  const occ=(s,q)=>s.boxes.includes(q)||s.bombs.some(b=>b[0]===q);
  const seen=new Set([key(S0)]);let fr=[S0],n=0;
  while(fr.length){const nx=[];
    for(const s of fr){
      if(goal(s))return {moves:n,state:s};
      for(let a=0;a<6;a++){const t=step(s,a);if(!t)continue;const k=key(t);if(seen.has(k))continue;seen.add(k);nx.push(t);}
    }fr=nx;n++;if(n>400)break;}
  return null;
  function step(s0,a){
    const s={...s0,bombs:s0.bombs.map(b=>b.slice()),boxes:s0.boxes.slice(),blown:s0.blown.slice()};
    let r=Math.floor(s.p/W),c=s.p%W,fresh=-1;
    if(a<4){const [dr,dc]=DIRS[a];s.d=a;let tr=r+dr,tc=c+dc,tq=tr*W+tc;
      if(!solid(s,tr,tc)){
        let ok=true;
        if(occ(s,tq)){ // 推箱子或炸彈；在冰上會一直滑
          let br=tr,bc=tc;
          const free=(rr,cc)=>!solid(s,rr,cc)&&!occ(s,rr*W+cc)&&tile(rr,cc)!=='H'&&tile(rr,cc)!=='1';
          if(!free(br+dr,bc+dc))ok=false; else {br+=dr;bc+=dc;while(tile(br,bc)==='I'&&free(br+dr,bc+dc)){br+=dr;bc+=dc;}
            const nq=br*W+bc,bi=s.boxes.indexOf(tq);
            if(bi>=0){s.boxes[bi]=nq;s.boxes.sort((x,y)=>x-y);} else s.bombs.find(b=>b[0]===tq)[0]=nq;}
        }
        if(ok){r=tr;c=tc; // 機器人在冰上滑
          while(tile(r,c)==='I'){const nr=r+dr,nc=c+dc;if(solid(s,nr,nc)||occ(s,nr*W+nc))break;r=nr;c=nc;}
          s.p=r*W+c;}
      }
    }else if(a===5){if(!s.bombs.length)return null; // 等待：原地不動讓炸彈倒數
    }else{const [dr,dc]=DIRS[s.d];const tr=r+dr,tc=c+dc,tq=tr*W+tc,t=tile(tr,tc);
      if(s.carry&&!solid(s,tr,tc)&&!occ(s,tq)&&'.IX*'.includes(t)){s.bombs.push([tq,FN]);s.carry=0;fresh=tq;}
      else if(!s.carry&&t==='b')s.carry=1;
      else return null;}
    const t=tile(r,c);if(t==='H')return null;
    if(t==='c'&&!s.keys.includes('c'))s.keys+='c';
    if(whole){const k=areas.findIndex(A=>A.ex[0]===r&&A.ex[1]===c);if(k>=0&&!(s.cleared>>k&1)){s.cleared|=1<<k;s.boxes=s.boxes.filter(q=>areaOf(Math.floor(q/W),q%W)!==k);}}
    // 計時：放下當回合不扣，之後每回合 -1，到 0 爆炸（十字範圍）
    const keep=[];
    for(const b of s.bombs){if(b[0]!==fresh)b[1]--; if(b[1]>0){keep.push(b);continue;} // 模型：放下後最多 FN 個動作（含「等待」）就爆炸；實際遊戲是約 3.3 秒
      const br=Math.floor(b[0]/W),bc=b[0]%W;
      for(const [qr,qc] of [[br,bc],...DIRS.map(([x,y])=>[br+x,bc+y])]){
        if(qr*W+qc===s.p)return null; // 機器人在爆炸範圍 = 失敗
        if(tile(qr,qc)==='%'&&!s.blown.includes(qr*W+qc))s.blown.push(qr*W+qc);}
    }
    s.bombs=keep;s.blown.sort((x,y)=>x-y);return s;}
}
let ok=true;
console.log(`地圖 ${W}×${H}`);
for(const A of areas){const h=A.r2-A.r1+1,w=A.c2-A.c1+1;
  const res=solve({rect:A,start:A.en,carry0:A.carry,goal:s=>s.p===A.ex[0]*W+A.ex[1]});
  const fit=h<=8&&w<=7;if(!res||!fit)ok=false;
  console.log(`區域 ${A.id}  ${h}×${w}${fit?'':' 超過 8×7!'}  ${res?'最少 '+res.moves+' 步':'無解!'}`);}
let st;for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(grid[r][c]==='S')st=[r,c];
let t1;for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(grid[r][c]==='1')t1=r*W+c;
const all=solve({start:st,carry0:false,whole:true,goal:s=>s.p===t1});
if(!all)ok=false;
console.log(`整張地圖：起點 → 隧道 1 ${all?'可到達，最少 '+all.moves+' 步':'到不了!'}`);
const pocket=solve({start:st,carry0:false,whole:true,goal:s=>grid[Math.floor(s.p/W)][s.p%W]==='*'&&areaOf(Math.floor(s.p/W),s.p%W)<0});
console.log(`地圖上的祕密零件（裂牆後）：${pocket?'拿得到，最少 '+pocket.moves+' 步':'拿不到'}`);
process.exit(ok?0:1);
