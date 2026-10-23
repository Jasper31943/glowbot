// 產生 world/swamp.txt、mine.txt、volcano.txt。用法：node tools/scenes567/gen.js
// 每區寫成 7 欄小格子：E＝入口（左邊）、Q＝出口（右邊）。蛇形排 3 排 × 4 區，偶數排左右翻轉。
const fs=require('fs'),path=require('path');const S=require('./spec.js');
const flipCh={z:'Z',Z:'z','<':'>','>':'<','/':'\\','\\':'/','{':'}','}':'{'}; // 轉轍器 j 不能放在翻轉的那一排
function build(sc){const W=43,bandsH=[0,1,2].map(b=>Math.max(...sc.zones.slice(b*4,b*4+4).map(z=>z.g.length)));
 const tops=[2];for(let b=1;b<3;b++)tops.push(tops[b-1]+bandsH[b-1]+3);const H=tops[2]+bandsH[2]+2;
 const G=[...Array(H)].map(()=>Array(W).fill('#'));const put=(y,x,c)=>{G[y][x]=c};const zl=[];const ends=[];
 sc.zones.forEach((z,i)=>{const b=i/4|0,slot=i%4,flip=b===1;let g=z.g.map(r=>[...r]);if(flip)g=g.map(r=>r.reverse().map(c=>flipCh[c]||c));
  const x0=3+(flip?3-slot:slot)*10,y0=tops[b];let en,ex;
  g.forEach((r,y)=>r.forEach((c,x)=>{if(c==='E'){en=[y0+y,x0+x];c='.'}if(c==='Q'){ex=[y0+y,x0+x];c='.'}put(y0+y,x0+x,c)}));
  if(!en||!ex)throw new Error(sc.name+' '+z.id+' 少了 E/Q');
  zl.push(`區域 ${z.id}：第 ${y0+1}–${y0+g.length} 行、第 ${x0+1}–${x0+7} 列｜入口 (${en[0]+1},${en[1]+1})｜出口 (${ex[0]+1},${ex[1]+1})｜${z.note}`);ends.push({en,ex,flip,b})});
 const carve=(y,x)=>{if(G[y][x]==='#')G[y][x]='.'};const vline=(x,a,b)=>{for(let y=Math.min(a,b);y<=Math.max(a,b);y++)carve(y,x)};
 // 入口隧道
 const e0=ends[0].en;put(e0[0],1,sc.tin);carve(e0[0],2);
 for(let i=0;i<ends.length-1;i++){const A=ends[i].ex,B=ends[i+1].en;
  if(ends[i].b===ends[i+1].b){const d=ends[i].flip?-1:1;carve(A[0],A[1]+d);vline(A[1]+2*d,A[0],B[0]);carve(B[0],A[1]+3*d)}
  else{const d=ends[i].flip?-1:1;carve(A[0],A[1]+d);vline(A[1]+2*d,A[0],B[0]);carve(B[0],B[1]+d)}}
 const L=ends[ends.length-1].ex;carve(L[0],L[1]+1);put(L[0],L[1]+2,sc.tout);
 const txt=`${sc.title}  ${W} 欄 × ${H} 行\n圖例：${sc.legend}\n\n\`\`\`\n${G.map(r=>r.join('')).join('\n')}\n\`\`\`\n\n隧道口\n| 數字 | 這一端 | 另一端 |\n| ${sc.tin} | ${sc.name} 第 ${e0[0]+1} 行、第 2 列 | ${sc.prevName} 隧道 ${sc.tin} |\n| ${sc.tout} | ${sc.name} 第 ${L[0]+1} 行、第 ${L[1]+3} 列 | ${sc.nextName} 隧道 ${sc.tout}（待定） |\n\n謎題區（重設只恢復該長方形；行列從 1 起算）\n${zl.join('\n')}\n`;
 fs.writeFileSync(path.join(__dirname,'..','..','world',sc.file+'.txt'),txt)}
for(const sc of S)build(sc);console.log('ok')
