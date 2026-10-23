// 隨機產生原創小房間並篩選：node rgen.js MODE seed N
// MODE belt：輸送帶非用不可；MODE bot：故障機器人非用不可
process.env.LIMIT=process.env.LIMIT||'25000';
const {solveZone}=require('./check-1415.js');
const [,,MODE,SEED,N]=process.argv;let a=(+SEED||1)*2654435761>>>0;const rnd=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}; // mulberry32
function sv(rows){const ey=rows.findIndex(r=>r.includes('E')),xy=rows.findIndex(r=>r.includes('Q'));
 const g=rows.map(r=>r.replace(/[EQ]/g,'.'));return solveZone(g,{id:'x',r1:0,r2:g.length-1,c1:0,c2:6,en:[ey,[...rows[ey]].indexOf('E')],ex:[xy,[...rows[xy]].indexOf('Q')],note:''},{fire:true})}
const pick=a=>a[rnd()*a.length|0];
const out=[];
for(let it=0;it<(+N||3000);it++){
 const H=5+(rnd()*2|0);const g=[...Array(H)].map(()=>Array(7).fill('#'));
 for(let y=1;y<H-1;y++)for(let x=1;x<6;x++){const r=rnd();g[y][x]=r<0.5?'.':r<0.75?'#':MODE==='belt'?pick('↑↓←→'):'.'}
 g[2][0]='E';g[2][1]='.';g[H-2][6]='Q';g[H-2][5]='D';
 // place switch(es), boxes, bots
 const free=()=>{for(let k=0;k<50;k++){const y=1+(rnd()*(H-2)|0),x=1+(rnd()*5|0);if(g[y][x]==='.'||g[y][x]==='#'){if(!(y===2&&x===1)&&!(y===H-2&&x===5))return [y,x]}}return null};
 const nX=1+(rnd()<0.35?1:0);for(let i=0;i<nX;i++){const p=free();if(p)g[p[0]][p[1]]='X'}
 const nB=MODE==='bot'?(rnd()<0.5?1:0):nX+(rnd()<0.3?1:0);for(let i=0;i<nB;i++){const p=free();if(p)g[p[0]][p[1]]='B'}
 if(MODE==='bot'){const nb=1+(rnd()<0.3?1:0);for(let i=0;i<nb;i++){const p=free();if(p)g[p[0]][p[1]]=rnd()<0.5?'p':'P'}
   if(rnd()<0.4){for(let k=0;k<2;k++){const p=free();if(p)g[p[0]][p[1]]=pick('↑↓←→')}}}
 const rows=g.map(r=>r.join(''));
 const r=sv(rows);if(!r.solvable||r.min<(+process.env.MIN||11))continue;
 if(r.dead===undefined);
 const rm=(re,to)=>sv(rows.map(x=>x.replace(re,to)));
 if(MODE==='belt'){if(rm(/[↑↓←→]/g,'.').solvable)continue}
 else{if(rm(/[pP]/g,'.').solvable||rm(/[pP]/g,'#').solvable)continue}
 out.push({rows,min:r.min,route:r.route});console.log(JSON.stringify({rows,min:r.min,route:r.route}));
}
