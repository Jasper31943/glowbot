// 爬山法加難度：node climb.js '<json>'
// json={base:[rows,E/Q],pal:".#B",max:{"B":2},need:{"i":"."},keep:"iE Q",iters:400,seed:1,fire:true,note:"",cap:40}
// 隨機改一格（不動 keep 裡的字元），只接受：可解、need 的機關換掉後無解、最少步數不變少；最少步數最多到 cap。
process.env.LIMIT=process.env.LIMIT||'150000';
const {solveZone}=require(process.env.CHK||'./check-1415.js');const o=JSON.parse(process.argv[2]);
let seed=o.seed||1;const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648};
const fire=o.fire!==false;
function solve(rows,f){const ey=rows.findIndex(r=>r.includes('E')),xy=rows.findIndex(r=>r.includes('Q'));const g=rows.map(r=>r.replace('E','.').replace('Q','.'));
 return solveZone(g,{id:'x',r1:0,r2:g.length-1,c1:0,c2:6,en:[ey,[...rows[ey]].indexOf('E')],ex:[xy,[...rows[xy]].indexOf('Q')],note:o.note||''},{fire:f,hp:o.hp||0})}
function score(rows){const r=solve(rows,fire);if(!r.solvable)return -1;for(const ch in (o.max||{}))if(rows.join('').split(ch).length-1>o.max[ch])return -1;for(const ch in (o.need||{})){const set=[...ch];if(!rows.some(x=>set.some(c=>x.includes(c))))return -1;const r2=solve(rows.map(x=>[...x].map(c=>set.includes(c)?o.need[ch]:c).join('')),fire);if(r2.solvable)return 0.5} // 還沒達到「非用不可」：先只求可解
 for(const ch in (o.max||{}))if(rows.join('').split(ch).length-1>o.max[ch])return -1;return Math.min(r.min,o.cap||40)}
let cur=o.base.slice(),cs=score(cur);if(cs<0){console.log(JSON.stringify({error:'base 無解'}));process.exit(0)}
const pal=[...o.pal];const keep=o.keep||'';
for(let it=0;it<(o.iters||300);it++){const g=cur.map(r=>[...r]);const y=1+(rnd()*(g.length-2)|0),x=1+(rnd()*5|0);if(keep.includes(g[y][x])||'EQ'.includes(g[y][x]))continue;
 g[y][x]=pal[rnd()*pal.length|0];const rows=g.map(r=>r.join(''));const sc=score(rows);if(sc>=cs){cur=rows;cs=sc}}
const r=solve(cur,fire);console.log(JSON.stringify({rows:cur,min:r.min,route:r.route,needOK:cs>=1}));
