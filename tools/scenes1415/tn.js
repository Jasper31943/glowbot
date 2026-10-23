// node tn.js 'CHARS->REPL' row1 row2 ... ：印出最少步數，以及把 CHARS 換成 REPL 後是否還可解
const {solveZone}=require('./check-1415.js');const [spec,...rows]=process.argv.slice(2);const [chs,rep]=spec.split('->');
function sv(R){const ey=R.findIndex(r=>r.includes('E')),xy=R.findIndex(r=>r.includes('Q'));const g=R.map(r=>r.replace('E','.').replace('Q','.'));
 return solveZone(g,{id:'t',r1:0,r2:g.length-1,c1:0,c2:6,en:[ey,[...R[ey]].indexOf('E')],ex:[xy,[...R[xy]].indexOf('Q')],note:process.env.NOTE||''},{fire:!process.env.NOFIRE,hp:+process.env.HP||0})}
const a=sv(rows);const re=new RegExp('['+chs.replace(/[\]\\^-]/g,'\\$&')+']','g');const b=sv(rows.map(r=>r.replace(re,rep)));
console.log((a.solvable?a.min+' '+a.route:'無解')+'  ｜去掉後：'+(b.solvable?'還是可解 '+b.min:'無解 ✓'));
