// node tools/scenes567/show.js swamp S3  → 印出區域格子和最短路線
const {parseMap,solveZone}=require('./check-8910.js');const path=require('path');
const [,,name,id]=process.argv;const M=parseMap(path.join(__dirname,'..','..','world',name+'.txt'));const z=M.zones.find(z=>z.id===id);
for(let y=z.r1;y<=z.r2;y++)console.log(M.grid[y].slice(z.c1,z.c2+1));const r=solveZone(M.grid,z,{fire:!process.env.NOFIRE,hp:+process.env.HP||0});console.log(r.solvable?r.min+' '+r.route:'無解 '+(r.error||''));
