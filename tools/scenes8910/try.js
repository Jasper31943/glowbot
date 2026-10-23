// node try.js [fire0|fire1] row1 row2 ...  （E 入口、Q 出口）→ 最少步數與路線
const {solveZone}=require('./check-8910.js');const fire=process.argv[2]==='fire1';const rows=process.argv.slice(3);
const ey=rows.findIndex(r=>r.includes('E')),xy=rows.findIndex(r=>r.includes('Q'));const g=rows.map(r=>r.replace('E','.').replace('Q','.'));
const r=solveZone(g,{id:'t',r1:0,r2:g.length-1,c1:0,c2:6,en:[ey,rows[ey].indexOf('E')],ex:[xy,rows[xy].indexOf('Q')],note:process.env.NOTE||''},{fire,hp:+process.env.HP||0});
console.log(rows.join(' '),'=>',r.solvable?r.min+' '+r.route:'無解');
