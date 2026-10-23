// 海底 / 古堡 / 天空島 檢查器（由 tools/scenes567/check-567.js 擴充，舊規則全保留）。新增：↑↓←→ 海流、i 氣泡（泡泡頭盔）、r 拉桿、t/u 尖刺、d 活板門、g/ɢ 盔甲幽靈、, 天空、[ ] 雲、⇑⇓⇐⇒ 風、$ 蟹王、@ 騎士王、? 風暴鳥。
// 原註解：沼澤 / 礦坑 / 火山 檢查器（由 world/check-new.js 複製擴充；不依賴 world-engine.js）。新增：~ 水、l 睡蓮、_ 填平的格子、+ 軌道、e 噴火口、h 岩漿、O 蛙王、& 鼴鼠王、V 熔岩巨人。
// 原註解：沙漠 / 森林 獨立檢查器（不依賴 world-engine.js）。用法：node world/check-new.js [desert|forest|all]
// 每個謎題區單獨求解（BFS，最少動作數）；列舉該區所有可達狀態，算出「不按重來就走不出去」的死路狀態數，
// 並確認按「重來」一定能回到可解狀態（＝軟鎖 0）。另外檢查大地圖上：隧道入口→區1入口、區i出口→區i+1入口、最後出口→隧道出口 都連得通。
// 炸彈模型：放下後最多 FUSE_N（預設 4）個動作就爆（動作含「等待」；等待時只有炸彈計時，會動的東西不動）。
const fs=require('fs'),path=require('path');
const FN=+(process.env.FUSE_N||4),REGROW=+(process.env.REGROW||6),LIMIT=+(process.env.LIMIT||3000000);
const DV=[[0,-1],[0,1],[-1,0],[1,0]]; // 上 下 左 右（x,y）
const TRK='-|/\\jǰ';function turn(t,d){if(t==='/'||t==='j')return [3,2,1,0][d];if(t==='\\'||t==='ǰ')return [2,3,0,1][d];return d}
const CUR={'↑':0,'↓':1,'←':2,'→':3},WND={'⇑':0,'⇓':1,'⇐':2,'⇒':3};
const DCH={'^':0,'v':1,'<':2,'>':3};
function parseMap(file){const t=fs.readFileSync(file,'utf8');const g=t.split('```')[1].trim().split('\n').map(r=>r.replace(/\s+$/,''));
 const zones=[];const re=/區域\s*(\S+?)：第\s*(\d+)\s*[–-]\s*(\d+)\s*行、第\s*(\d+)\s*[–-]\s*(\d+)\s*列｜入口\s*\((\d+),(\d+)\)｜出口\s*\((\d+),(\d+)\)(?:｜([^\n]*))?/g;let m;
 while((m=re.exec(t)))zones.push({id:m[1],r1:+m[2]-1,r2:+m[3]-1,c1:+m[4]-1,c2:+m[5]-1,en:[+m[6]-1,+m[7]-1],ex:[+m[8]-1,+m[9]-1],note:m[10]||''});
 const tun=[];g.forEach((r,y)=>[...r].forEach((c,x)=>{if(/[0-9]/.test(c))tun.push({d:c,x,y})}));return{grid:g,zones,tun,text:t}}
// ---------- 單區求解 ----------
function solveZone(G,Z,inv0){
 const W=Z.c2-Z.c1+1,H=Z.r2-Z.r1+1,N=W*H;const cell=[];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)cell.push(G[Z.r1+y][Z.c1+x]);
 const Q=(x,y)=>x<0||y<0||x>=W||y>=H?-1:y*W+x;const EN=Q(Z.en[1]-Z.c1,Z.en[0]-Z.r1),EX=Q(Z.ex[1]-Z.c1,Z.ex[0]-Z.r1);
 const s0={air:0,lv:0,clouds:[],rocks:[],lt:0,cf:-1,t:0,p:EN,d:(()=>{const ex=EN%W,ey=EN/W|0;return ex===W-1?2:ex===0?3:ey===0?1:ey===H-1?0:3})()/* 走進入口時面向的方向（跟遊戲一樣；以前固定朝右，會讓「一進門就吐火」看起來不可能） */,carry:0,fire:inv0.fire?1:0,bat:inv0.bat?1:0,lamp:0,bombs:[],boxes:[],dunes:[],bugs:[],boss:null,ch:{},vt:{}};
 const SW=[];
 cell.forEach((c,q)=>{if(c==='B'){s0.boxes.push(q);cell[q]='.'}else if(c in DCH){s0.dunes.push([q,DCH[c]]);cell[q]='.'}
  else if(c==='z'){s0.bugs.push([q,3,0]);cell[q]='.'}else if(c==='Z'){s0.bugs.push([q,2,0]);cell[q]='.'}else if(c==='y'){s0.bugs.push([q,1,0]);cell[q]='.'}else if(c==='g'){s0.bugs.push([q,3,0,1]);cell[q]='.'}else if(c==='ɢ'){s0.bugs.push([q,2,0,1]);cell[q]='.'}
  else if(c==='['){s0.clouds.push([q,3]);cell[q]=','}else if(c===']'){s0.clouds.push([q,2]);cell[q]=','}
  else if(c==='$'){s0.boss={q,d:3,hp:2,kind:'worm'};cell[q]='.'}else if(c==='@'){s0.boss={q,d:3,hp:3,kind:'worm',knight:1};cell[q]='.'}else if(c==='?'){s0.boss={q,d:3,hp:2,kind:'worm',fly:1};cell[q]=','}
  else if(c==='Y'||c==='O'||c==='&'){s0.boss={q,d:3,hp:2,kind:'worm'};cell[q]='.'}else if(c==='V'){s0.boss={q,d:0,hp:3,kind:'golem'};}else if(c==='T'){s0.boss={q,d:0,hp:3,kind:'tree'};}
  if(c==='X')SW.push(q)});if(s0.boss&&inv0.hp)s0.boss.hp=inv0.hp;
 const tile=(s,q)=>q in s.ch?s.ch[q]:cell[q];
 const boxAt=(s,q)=>s.boxes.indexOf(q)>=0,bombAt=(s,q)=>s.bombs.findIndex(b=>b[0]===q),duneAt=(s,q)=>s.dunes.findIndex(b=>b[0]===q),bugAt=(s,q)=>s.bugs.findIndex(b=>b[0]===q);
 const bossAt=(s,q)=>s.boss&&s.boss.q===q;
 const doorOpen=(s)=>SW.length>0&&SW.every(q=>boxAt(s,q)||duneAt(s,q)>=0);
 function solid(s,q){if(q<0)return true;const c=tile(s,q);
  if('#%bKwT~V○r'.indexOf(c)>=0)return true;if(c==='D')return !doorOpen(s)&&!(s.p===q);if(c==='G')return !!(s.boss&&s.boss.hp>0);return false}
 const spikeUp=(s,q)=>{const c=tile(s,q);return (c==='t'&&!s.lv)||(c==='u'&&s.lv)};const trapOpen=(s,q)=>tile(s,q)==='d'&&s.lv;const cloudAt=(s,q)=>s.clouds.findIndex(c=>c[0]===q);
 const hazard=(s,q)=>spikeUp(s,q)||trapOpen(s,q)||(tile(s,q)===','&&cloudAt(s,q)<0);
 const occ=(s,q)=>boxAt(s,q)||bombAt(s,q)>=0||duneAt(s,q)>=0||bugAt(s,q)>=0||bossAt(s,q);
 const ITEM='f*L';
 const mv=(q,d)=>{const x=q%W,y=(q/W|0);return Q(x+DV[d][0],y+DV[d][1])};
 const clone=s=>({bat:s.bat,air:s.air,lv:s.lv,clouds:s.clouds.map(c=>c.slice()),rocks:s.rocks.slice(),lt:s.lt,cf:s.cf,t:s.t,p:s.p,d:s.d,carry:s.carry,fire:s.fire,lamp:s.lamp,bombs:s.bombs.map(b=>b.slice()),boxes:s.boxes.slice(),dunes:s.dunes.map(b=>b.slice()),bugs:s.bugs.map(b=>b.slice()),boss:s.boss&&{...s.boss},ch:{...s.ch},vt:{...s.vt}});
 const key=s=>[s.air,s.lv,s.clouds.map(c=>c.join(':')).join('.'),s.rocks.join(','),s.lt,s.p,s.d,s.carry,s.fire,s.lamp,s.bombs.map(b=>b.join(':')).sort().join('.'),s.boxes.slice().sort((a,b)=>a-b).join('.'),s.dunes.map(b=>b.join(':')).sort().join('.'),s.bugs.map(b=>b.join(':')).sort().join('.'),s.boss?[s.boss.q,s.boss.d,s.boss.hp].join(':'):'',Object.keys(s.ch).sort((a,b)=>a-b).map(k=>k+s.ch[k]).join(''),Object.keys(s.vt).sort((a,b)=>a-b).map(k=>k+'='+s.vt[k]).join(',')].join('|');
 // 動作：0-3 移動、4 動作鍵（撿炸彈/放炸彈/吐火）、5 等待（有炸彈時）
 function step(s0,a){const s=clone(s0);let fresh=-1,counted=true;
  if(a<4){s.d=a;const t=mv(s.p,a);
   if(t<0||solid(s,t)||duneAt(s,t)>=0||bossAt(s,t)){/* 撞牆：算一步 */}
   else if(bugAt(s,t)>=0){/* 對著甲蟲／幽靈按方向：只轉身面對牠（算一步），不會自己走進去；牠走到你身上才算被抓 */}
   else if(tile(s,t)==='q'||'h}{)('.indexOf(tile(s,t))>=0)return null; // 走進流沙 = 陷下去（失敗）
   else if((boxAt(s,t)||bombAt(s,t)>=0)&&(()=>{const b2=mv(t,a);return b2<0||(solid(s,b2)&&tile(s,b2)!=='~')||occ(s,b2)||cloudAt(s,b2)>=0||b2===EN||b2===EX||ITEM.indexOf(tile(s,b2))>=0})()){/* 推不動：算撞牆 */}
   else{if(boxAt(s,t)||bombAt(s,t)>=0){const b2=mv(t,a);
     if(tile(s,b2)==='q'){if(boxAt(s,t)){s.boxes.splice(s.boxes.indexOf(t),1);s.ch[b2]='='}else s.bombs.splice(bombAt(s,t),1)}
     else if(tile(s,b2)===','&&cloudAt(s,b2)<0||trapOpen(s,b2)){if(boxAt(s,t)){s.boxes.splice(s.boxes.indexOf(t),1);if(trapOpen(s,b2))s.ch[b2]='.'}else s.bombs.splice(bombAt(s,t),1)} // 掉下天空／掉進活板門（箱子填平活板門）
     else if(tile(s,b2)==='~'){if(boxAt(s,t))s.boxes.splice(s.boxes.indexOf(t),1);else s.bombs.splice(bombAt(s,t),1)} // 沼澤：沉掉，不會變路
     else if(tile(s,b2)==='h'){if(boxAt(s,t)){s.boxes.splice(s.boxes.indexOf(t),1);s.ch[b2]='_'}else s.bombs.splice(bombAt(s,t),1)} // 岩漿池：冷卻
     else if('}{)('.indexOf(tile(s,b2))>=0){if(boxAt(s,t)){s.boxes.splice(s.boxes.indexOf(t),1);s.rocks.push(b2)}else s.bombs.splice(bombAt(s,t),1)} // 流動岩漿：變漂流石
     else if(boxAt(s,t)&&TRK.indexOf(tile(s,b2))>=0){let c=b2,d=turn(tile(s,b2),a);for(let g=0;g<60;g++){const n=mv(c,d);if(n<0)break;const tn=tile(s,n);
       if(s.boss&&s.boss.q===n&&s.boss.kind==='worm'){s.boss.hp--;if(s.boss.hp<=0)s.boss=null;break}
       if(tn==='%'){s.ch[n]='.';break}
       if(TRK.indexOf(tn)<0||n===s.p||n===t||occ(s,n)||n===EN||n===EX)break;c=n;d=turn(tn,d)}
      s.boxes[s.boxes.indexOf(t)]=c}
     else if(boxAt(s,t))s.boxes[s.boxes.indexOf(t)]=b2;else s.bombs[bombAt(s,t)][0]=b2}
    if(tile(s,s.p)==='l')s.ch[s.p]='~';s.p=t;s.lt=0;if(tile(s,t)===':'){s.ch[t]='¹';s.cf=t}if(tile(s,t)==='i'){s.air=6;s.ch[t]='.'}const c=tile(s,t);if(c==='f'){s.fire=1;s.ch[t]='.'}else if(c==='*')s.ch[t]='.';else if(c==='L'){s.lamp=1;s.ch[t]='.'}
    for(let g=0;g<40&&tile(s,s.p) in WND;g++){const n=mv(s.p,WND[tile(s,s.p)]);if(n>=0&&bugAt(s,n)>=0)return null;if(n<0||solid(s,n)||occ(s,n))break;s.p=n;if(tile(s,n)==='i'){s.air=6;s.ch[n]='.'}}}
  }else if(a===4){const f=mv(s.p,s.d);const c=f<0?'#':tile(s,f);
   const u=tile(s,s.p);if(!s.carry&&c==='r'){s.lv^=1}else
   if(!s.carry&&(u==='j'||u==='ǰ')){s.ch[s.p]=u==='j'?'ǰ':'j'} // 轉轍器：站在上面按動作鍵切換
   else if(!s.carry&&c==='b'){s.carry=1}
   else if(s.carry&&f>=0&&'.=Xa'.indexOf(c)>=0&&!occ(s,f)&&f!==EN&&f!==EX){s.bombs.push([f,FN]);s.carry=0;fresh=f}
   else if(s.bat&&f>=0&&bugAt(s,f)>=0){const bg=s.bugs[bugAt(s,f)];bg[2]=3;const n=mv(f,s.d);if(!(n<0||n===EN||n===EX||n===s.p||solid(s,n)||occ(s,n)||tile(s,n)==='q'||tile(s,n)==='~'||'h}{)('.indexOf(tile(s,n))>=0||ITEM.indexOf(tile(s,n))>=0||hazard(s,n)||'tud'.indexOf(tile(s,n))>=0))bg[0]=n} // ⚾ 球棒：打昏面前的生物 3 步，並往後擊退 1 格（後面那格要是牠自己走得到、又安全的格子；不然就原地打昏）
   else if(s.bat&&f>=0&&c==='%'){if(!Z.note.includes('鐵箍'))s.ch[f]='.'} // ⚾ 球棒：打破面前的裂牆（鐵箍裂牆打不破，只是噹一聲、算一步）
   else if(s.bat&&f>=0&&s.boss&&s.boss.q===f&&s.boss.kind!=='tree'){} // ⚾ 舊模型的簡化：打到王當成沒效果（算一步）。實際遊戲（王戰更新）會衝的王會被球棒／吐火打昏，每隻王也會出招——王房請以 tools/boss-check 的引擎窮舉為準
   else if(s.fire){let q=s.p;for(;;){q=mv(q,s.d);if(q<0)break;const t=tile(s,q);
     if(t==='w'){s.ch[q]='a';s.vt[q]=REGROW;break}
     if(t==='K'){s.ch[q]='.';break}
     const bi=bugAt(s,q);if(bi>=0){s.bugs[bi][2]=3;break} // 嚇呆：3 步不動
     if(s.boss&&s.boss.q===q&&s.boss.kind==='tree'){s.boss.hp--;for(const k in s.vt){delete s.ch[k]}s.vt={};if(s.boss.hp<=0){s.ch[q]='.';s.boss=null}break}
     if((solid(s,q)&&tile(s,q)!=='~')||occ(s,q))break}}
   else return null;
  }else{if(!s.bombs.length)return null;counted=false}
  if(counted){s.t++;
   if(s.air>0)s.air--;else if(tile(s,s.p) in CUR){const n=mv(s.p,CUR[tile(s,s.p)]);if(n>=0&&!solid(s,n)&&!occ(s,n)){s.p=n;if(tile(s,n)==='i'){s.air=6;s.ch[n]='.'}}else if(n>=0&&bugAt(s,n)>=0)return null} // 海流：每個動作把機器人推一格（泡泡頭盔時不推）
   for(const b of s.bombs){if(!(tile(s,b[0]) in CUR))continue;const n=mv(b[0],CUR[tile(s,b[0])]);if(n>=0&&n!==s.p&&!solid(s,n)&&!occ(s,n)&&n!==EN&&n!==EX)b[0]=n} // 海流也推炸彈
   // 海流上的箱子：一個動作就順著海流一路漂到底；擋住、或兩道海流迎面相撞（平靜水面）就停，不會來回彈
   for(let i=0;i<s.boxes.length;i++){let q=s.boxes[i];const seen=new Set([q]);
    for(let g=0;g<64&&tile(s,q) in CUR;g++){const d=CUR[tile(s,q)],n=mv(q,d);if(!(n>=0&&n!==s.p&&!solid(s,n)&&!occ(s,n)&&n!==EN&&n!==EX&&tile(s,n)!=='~'))break;
     if(tile(s,n) in CUR&&CUR[tile(s,n)]===(d^1))break;if(seen.has(n))break;seen.add(n);q=n;s.boxes[i]=q}}
   for(const cl of s.clouds){const n=mv(cl[0],cl[1]);const ok=n>=0&&tile(s,n)===','&&cloudAt(s,n)<0&&!bossAt(s,n);if(!ok){cl[1]^=1;continue}if(s.p===cl[0])s.p=n;cl[0]=n} // 雲：每個動作飄一格，載著機器人if(a>=4||s.p===s0.p){if(tile(s,s.p)==='l'&&++s.lt>=2)return null} // 黃睡蓮站 2 個動作就沉
   for(const k in s.ch){const q=+k;if(q===s.cf)continue;if(s.ch[k]==='¹')s.ch[k]='²';else if(s.ch[k]==='²'){s.ch[k]='○';const bi=s.boxes.indexOf(q);if(bi>=0)s.boxes.splice(bi,1)}}s.cf=-1;
   if(tile(s,s.p)==='○')return null; // 崩塌地板掉下去
   s.rocks=s.rocks.map(q=>{const t=tile(s,q),d={'(':0,')':1,'{':2,'}':3}[t];const n=mv(q,d);if(n>=0&&tile(s,n)==='h'){s.ch[n]='_';return -1}if(n>=0&&'}{)('.indexOf(tile(s,n))>=0&&s.rocks.indexOf(n)<0)return n;s.ch[q]='_';return -1}).filter(q=>q>=0); // 會動的東西各走一步
   for(const du of s.dunes.slice()){const i=s.dunes.indexOf(du),n=mv(du[0],du[1]);
    const blocked=n<0||n===s.p||n===EN||n===EX||(solid(s,n)&&tile(s,n)!=='D')||(tile(s,n)==='D'&&!doorOpen(s))||occ(s,n)||ITEM.indexOf(tile(s,n))>=0;
    if(blocked){du[1]^=1;continue}
    if(tile(s,n)==='q'){s.dunes.splice(i,1);s.ch[n]='=';continue}du[0]=n}
   for(const bg of s.bugs){if(bg[2]>0){bg[2]--;continue}
    if(bg[3]){for(const dd of [2,3]){let n=mv(bg[0],dd);while(n>=0&&!solid(s,n)&&!boxAt(s,n)&&bombAt(s,n)<0&&!spikeUp(s,n)){if(n===s.p){bg[1]=dd;break}n=mv(n,dd)}}} /* 幽靈看到同一排的機器人就轉身衝過來（!） */const n=mv(bg[0],bg[1]);if(n===EN||n===EX){bg[1]^=1;continue} // 入口/出口是安全格
    if(n===s.p)return null;
    const blocked=n<0||solid(s,n)||occ(s,n)||tile(s,n)==='q'||hazard(s,n)||'h}{)('.indexOf(tile(s,n))>=0||ITEM.indexOf(tile(s,n))>=0;if(blocked){bg[1]^=1;continue}bg[0]=n}
   if(s.boss&&s.boss.kind==='worm'){if(s.boss.knight){for(const dd of [2,3]){let n=mv(s.boss.q,dd);while(n>=0&&!solid(s,n)&&!boxAt(s,n)){if(n===s.p){s.boss.d=dd;break}n=mv(n,dd)}}}const n=mv(s.boss.q,s.boss.d);if(s.boss.knight&&n===s.p)return null;
    const blocked=n<0||n===s.p||n===EN||n===EX||solid(s,n)||boxAt(s,n)||duneAt(s,n)>=0||bugAt(s,n)>=0||(!s.boss.fly&&hazard(s,n))||(s.boss.fly&&cloudAt(s,n)>=0)||'h}{)('.indexOf(tile(s,n))>=0||tile(s,n)==='q';if(blocked)s.boss.d^=1;else s.boss.q=n}
   for(const k in s.vt){if(s.vt[k]>0)s.vt[k]--;const q=+k;if(s.vt[k]<=0&&q!==s.p&&!occ(s,q)){delete s.vt[k];delete s.ch[k]}}
  }
  // 炸彈計時（每個動作，包含等待）
  const keep=[];let hitBoss=0;
  for(const b of s.bombs){if(b[0]!==fresh)b[1]--;if(b[1]>0){keep.push(b);continue}
   const x=b[0]%W,y=b[0]/W|0;for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const q=Q(x+dx,y+dy);if(q<0)continue;
    if(q===s.p)return null;if(tile(s,q)==='%')s.ch[q]='.';
    const di=duneAt(s,q);if(di>=0)s.dunes.splice(di,1);const gi=bugAt(s,q);if(gi>=0)s.bugs.splice(gi,1);
    if(s.boss&&s.boss.kind==='worm'&&s.boss.q===q)hitBoss=1;if(s.boss&&s.boss.kind==='golem'&&s.boss.q===q)hitBoss=1}
   if(hitBoss){s.boss.hp--;hitBoss=0;if(s.boss.hp<=0){if(s.boss.kind==='golem')s.ch[s.boss.q]='.';s.boss=null}}}
  s.bombs=keep;
  if(s.bugs.some(b=>b[0]===s.p))return null;
  if(hazard(s,s.p))return null; // 尖刺、打開的活板門、沒有雲的天空
  return s}
 // BFS 正向列舉
 const ids=new Map(),st=[],par=[],rev=[];const add=(s,from)=>{const k=key(s);let i=ids.get(k);if(i===undefined){i=st.length;ids.set(k,i);st.push(s);par.push(from);rev.push([])}return i};
 add(s0,-1);let goal=-1;const isGoal=s=>s.p===EX&&(!Z.note.includes('燈')||s.lamp);
 for(let i=0;i<st.length;i++){if(st.length>LIMIT)return{error:'狀態太多（>'+LIMIT+'）'};const s=st[i];if(isGoal(s)){if(goal<0)goal=i;continue}
  for(let a=0;a<6;a++){const t=step(s,a);if(!t)continue;const j=add(t,i);if(j!==i)rev[j].push(i)}}
 if(goal<0)return{solvable:false,states:st.length};
 // 最短步數（BFS 順序＝層序；重新算一次深度）
 const depth=new Int32Array(st.length).fill(-1),pp=new Int32Array(st.length).fill(-1),pa=new Int8Array(st.length);depth[0]=0;const qq=[0];for(let h=0;h<qq.length;h++){const i=qq[h];if(isGoal(st[i]))continue;for(let a=0;a<6;a++){const t=step(st[i],a);if(!t)continue;const j=ids.get(key(t));if(depth[j]<0){depth[j]=depth[i]+1;pp[j]=i;pa[j]=a;qq.push(j)}}}
 let best=1e9,bi=-1;st.forEach((s,i)=>{if(isGoal(s)&&depth[i]>=0&&depth[i]<best){best=depth[i];bi=i}});
 // 反向可達：哪些狀態還走得到出口
 const ok=new Uint8Array(st.length);const stk=[];st.forEach((s,i)=>{if(isGoal(s)){ok[i]=1;stk.push(i)}});
 while(stk.length){const j=stk.pop();for(const i of rev[j])if(!ok[i]){ok[i]=1;stk.push(i)}}
 const dead=st.length-ok.reduce((a,b)=>a+b,0);
 let route=[];for(let i=bi;i>0;i=pp[i])route.unshift('↑↓←→按等'[pa[i]]);if(process.env.SHOW===Z.id)console.log('  路線 '+Z.id+'：'+route.join(''));
 const g=st[bi];return{route:route.join(''),solvable:true,min:best,states:st.length,dead,fireOut:inv0.fire||!!g.fire,needFire:null}}
// ---------- 大地圖連通（只看固定的牆） ----------
function corridor(G,from,to,zones){const H=G.length,W=G[0].length;const inZ=(x,y)=>zones.some(z=>y>=z.r1&&y<=z.r2&&x>=z.c1&&x<=z.c2);
 const seen=new Set([from.join()]);const q=[from];while(q.length){const [x,y]=q.shift();if(x===to[0]&&y===to[1])return true;
  for(const [dx,dy] of DV){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=nx+','+ny;if(seen.has(k))continue;
   const c=G[ny][nx];if(c==='#')continue;if(inZ(nx,ny)&&!(nx===to[0]&&ny===to[1]))continue;seen.add(k);q.push([nx,ny])}}return false}
function checkMap(name){const file=path.join(__dirname,'..','..','world',name+'.txt');const M=parseMap(file);
 console.log(`\n=== ${name}.txt  ${M.grid[0].length} 欄 × ${M.grid.length} 行，${M.zones.length} 個區域 ===`);
 const errs=[];if(M.grid.some(r=>r.length!==M.grid[0].length))errs.push('每行長度不一樣');
 M.zones.forEach(z=>{if(z.c2-z.c1+1>7)errs.push(`區域 ${z.id} 超過 7 欄`)});
 // 連通：隧道(第一個) → 區1 入口 → … → 最後出口 → 隧道(第二個)
 const tIn=M.tun[0],tOut=M.tun[M.tun.length-1];const pts=[[tIn.x,tIn.y]];M.zones.forEach(z=>{pts.push([z.en[1],z.en[0]]);pts.push([z.ex[1],z.ex[0]])});pts.push([tOut.x,tOut.y]);
 for(let i=0;i<pts.length-1;i+=2)if(!corridor(M.grid,pts[i],pts[i+1],M.zones))errs.push(`走廊不通：(${pts[i][1]+1},${pts[i][0]+1}) → (${pts[i+1][1]+1},${pts[i+1][0]+1})`);
 let inv={fire:name!=='volcano',bat:true},total=0,ok=true;
 for(const z of M.zones){const t0=Date.now();const r=solveZone(M.grid,z,inv);
  if(r.error||!r.solvable){ok=false;console.log(`區域 ${z.id.padEnd(4)} ${r.error||'無解！'}（狀態 ${r.states||'-'}）`);continue}
  total+=r.min;if(r.fireOut)inv.fire=true;
  // 不帶火是否可解（看是否真的需要火）
  let needFire='';if(inv.fire&&!z.note.includes('拿火')){const r2=solveZone(M.grid,z,{...inv,fire:false});needFire=r2.solvable?'（不用火也能過）':'（需要火）'}
  if(inv.bat&&!z.note.includes('球棒')){const r3=solveZone(M.grid,z,{...inv,bat:false});needFire+=!r3.solvable?'（需要球棒）':r3.min>r.min?`（球棒捷徑：沒球棒 ${r3.min} 步）`:''}
  let ph='';if(/B$/.test(z.id)){const hp0=solveZone(M.grid,z,{fire:inv.fire,hp:99}).states?null:null;for(let h=1;h<=3;h++){const rp=solveZone(M.grid,z,{fire:inv.fire,hp:h});ph+=` 剩${h}血起點:${rp.solvable?rp.min:'無解'}`}}
  console.log(`區域 ${z.id.padEnd(4)} 最少 ${String(r.min).padStart(3)} 步  可達狀態 ${String(r.states).padStart(7)}  要按重來的死路 ${String(r.dead).padStart(6)}  軟鎖 0 ${needFire}${ph} ${Date.now()-t0}ms`)}
 errs.forEach(e=>console.log('錯誤：'+e));console.log(ok&&!errs.length?`全部區域可解，謎題步數合計 ${total}（不含走廊）`:'有問題，見上');return ok&&!errs.length}
module.exports={parseMap,solveZone};
if(require.main===module){const which=process.argv[2]||'all';let good=true;for(const n of (which==='all'?['sea','castle','sky']:[which]))good=checkMap(n)&&good;process.exit(good?0:1)}
