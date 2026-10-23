// 必要性測試：把新機關換掉後，該區應該變成無解。node tools/scenes567/necessity.js
process.env.LIMIT='600000';
const {parseMap,solveZone}=require('./check-8910.js');const path=require('path');
const tests=[['sea',/[↑↓←→]/g,'.','海流換成地板'],['castle',/[gɢ]/g,'.','幽靈拿掉（看是不是變簡單）'],['sea',/i/g,'.','氣泡拿掉'],['sea',/b/g,'.','炸彈草拿掉'],['castle',/r/g,'#','拉桿換成牆'],['castle',/d/g,'.','活板門換成地板'],['sky',/[\[\]]/g,',','雲拿掉'],['sky',/[⇑⇓⇐⇒]/g,',','風換成天空']];
for(const [name,re,to,desc] of tests){const M=parseMap(path.join(__dirname,'..','..','world',name+'.txt'));
 for(const z of M.zones){let has=false;const g=M.grid.map((r,y)=>y<z.r1||y>z.r2?r:[...r].map((c,x)=>{if(x<z.c1||x>z.c2)return c;re.lastIndex=0;if(re.test(c)){has=true;return to}return c}).join(''));
  if(!has)continue;const r=solveZone(g,z,{fire:true});console.log(`${name} ${z.id}：${desc} → ${r.solvable?'還是可解（'+r.min+' 步）':(r.error||'無解')}`)}}
