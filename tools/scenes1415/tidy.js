// 整理 climb.js 產生的雜亂格子：一格一格試著把機關字元換成牆或地板，只要最少步數不變少、必要性還成立就換。
// node tidy.js '<json>'  json={rows:[...],chars:"tu",need:{"r":"#"},fire:true,note:""}
const {solveZone}=require(process.env.CHK||'./check-1415.js');const o=JSON.parse(process.argv[2]);const fire=o.fire!==false;
function solve(R,f){const ey=R.findIndex(r=>r.includes('E')),xy=R.findIndex(r=>r.includes('Q'));const g=R.map(r=>r.replace('E','.').replace('Q','.'));
 return solveZone(g,{id:'x',r1:0,r2:g.length-1,c1:0,c2:6,en:[ey,[...R[ey]].indexOf('E')],ex:[xy,[...R[xy]].indexOf('Q')],note:o.note||''},{fire:f,hp:o.hp||0})}
function needOK(R){for(const ch in (o.need||{})){const set=[...ch];const r2=solve(R.map(x=>[...x].map(c=>set.includes(c)?o.need[ch]:c).join('')),fire);if(r2.solvable)return false}return true}
let cur=o.rows.map(r=>[...r]);const m0=solve(o.rows,fire).min;
for(const to of ['#','.'])for(let y=1;y<cur.length-1;y++)for(let x=1;x<6;x++){if(!o.chars.includes(cur[y][x]))continue;const old=cur[y][x];cur[y][x]=to;const R=cur.map(r=>r.join(''));const r=solve(R,fire);
 if(!(r.solvable&&r.min>=m0&&needOK(R)))cur[y][x]=old}
const R=cur.map(r=>r.join(''));const r=solve(R,fire);console.log(JSON.stringify({rows:R,min:r.min,before:m0}));
