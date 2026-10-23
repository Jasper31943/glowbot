// 隨機找謎題：node search.js '<json>'；json={rows:3,cols:5,ey:1,xy:1,place:{"B":1,"+":3},fixed:{"1,2":"%"},need:["+"],min:10,tries:400,seed:1}
// 內部 rows×cols，外面一圈牆；E 在第 ey 行左邊、Q 在第 xy 行右邊。need：把這些字元換成 '.'（或 needTo 指定）後要變無解。
process.env.LIMIT=process.env.LIMIT||'150000';
const {solveZone}=require('./check-567.js');const o=JSON.parse(process.argv[2]);
let seed=o.seed||1;const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648};
function mk(){const g=[...Array(o.rows+2)].map((_,y)=>[...Array(7)].map((_,x)=>y===0||y===o.rows+1||x===0||x===6?'#':'.'));
 g[o.ey][0]='E';g[o.xy][6]='Q';for(const k in (o.fixed||{})){const [y,x]=k.split(',').map(Number);g[y][x]=o.fixed[k]}
 for(const ch in o.place)for(let n=0;n<o.place[ch];){const y=1+(rnd()*o.rows|0),x=1+(rnd()*5|0);if(g[y][x]!=='.'||(y===o.ey&&x===1)||(y===o.xy&&x===5))continue;g[y][x]=ch;n++}
 return g.map(r=>r.join(''))}
function solve(rows,fire){const g=rows.map(r=>r.replace('E','.').replace('Q','.'));const ey=rows.findIndex(r=>r.includes('E')),xy=rows.findIndex(r=>r.includes('Q'));
 return solveZone(g,{id:'x',r1:0,r2:g.length-1,c1:0,c2:6,en:[ey,0],ex:[xy,6],note:o.note||''},{fire})}
let best=null;
for(let t=0;t<(o.tries||400);t++){const g=mk();const r=solve(g,o.fire!==false);if(!r.solvable||r.min<(o.min||0))continue;
 let ok=true;for(const ch of (o.need||[])){const to=(o.needTo||{})[ch]||'.';const r2=solve(g.map(x=>x.split(ch).join(to)),o.fire!==false);if(r2.solvable&&!(o.slower&&r2.min<r.min)){ok=false;break}}
 if(!ok)continue;if(o.noFire){const r3=solve(g,false);if(!r3.solvable){continue}}
 if(!best||r.min>best.min){best={g,min:r.min,route:r.route};}}
console.log(JSON.stringify(best));
