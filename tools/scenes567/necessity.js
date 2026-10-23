// 必要性測試：把新機關換掉後，該區應該變成無解。node tools/scenes567/necessity.js
process.env.LIMIT='600000';
const {parseMap,solveZone}=require('./check-567.js');const path=require('path');
const tests=[['mine',/[-|\/\\j]/g,'.','軌道換成普通地板'],['volcano',/[}{)(]/g,'h','流動岩漿換成岩漿池'],['swamp',/p/g,'~','綠睡蓮換成深水']];
for(const [name,re,to,desc] of tests){const M=parseMap(path.join(__dirname,'..','..','world',name+'.txt'));
 for(const z of M.zones){let has=false;const g=M.grid.map((r,y)=>y<z.r1||y>z.r2?r:[...r].map((c,x)=>{if(x<z.c1||x>z.c2)return c;re.lastIndex=0;if(re.test(c)){has=true;return to}return c}).join(''));
  if(!has)continue;const r=solveZone(g,z,{fire:name!=='volcano'});console.log(`${name} ${z.id}：${desc} → ${r.solvable?'還是可解（'+r.min+' 步）':(r.error||'無解')}`)}}
