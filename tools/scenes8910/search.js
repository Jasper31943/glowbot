// 隨機找謎題：node search.js '<json>'
// json={base:[...rows with E/Q],place:{"B":2},need:{"→":"."},tries:500,seed:1,fire:true,note:""}
// base 裡的 '.' 才會被隨機放東西；need：把這些字元換掉後一定要無解；回傳最少步數最大的那個。
process.env.LIMIT=process.env.LIMIT||'120000';
const {solveZone}=require(process.env.CHK||'./check-8910.js');const o=JSON.parse(process.argv[2]);
let seed=o.seed||1;const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648};
function solve(rows,fire){const ey=rows.findIndex(r=>r.includes('E')),xy=rows.findIndex(r=>r.includes('Q'));const g=rows.map(r=>r.replace('E','.').replace('Q','.'));
 return solveZone(g,{id:'x',r1:0,r2:g.length-1,c1:0,c2:6,en:[ey,[...rows[ey]].indexOf('E')],ex:[xy,[...rows[xy]].indexOf('Q')],note:o.note||''},{fire,hp:o.hp||0})}
const fire=o.fire!==false;let best=null;
for(let t=0;t<(o.tries||500);t++){const g=o.base.map(r=>[...r]);const free=[];g.forEach((r,y)=>r.forEach((c,x)=>{if(c==='.'&&!(x===1||x===5)&&true)free.push([y,x]);else if(c==='.')free.push([y,x])}));
 for(const ch in o.place)for(let n=0;n<o.place[ch];n++){if(!free.length)break;const i=rnd()*free.length|0;const [y,x]=free.splice(i,1)[0];g[y][x]=ch}
 const rows=g.map(r=>r.join(''));const r=solve(rows,fire);if(!r.solvable)continue;if(best&&r.min<=best.min)continue;
 let ok=true;for(const ch in (o.need||{})){const r2=solve(rows.map(x=>x.split(ch).join(o.need[ch])),fire);if(r2.solvable){ok=false;break}}
 if(ok)best={rows,min:r.min,route:r.route}}
console.log(JSON.stringify(best));
