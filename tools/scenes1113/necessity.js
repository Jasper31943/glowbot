// 必要性測試。node tools/scenes1113/necessity.js
process.env.LIMIT='600000';
const {parseMap,solveZone}=require('./check-1113.js');const path=require('path');
const tests=[
 ['mirror',/[╱╲]/g,'#','鏡子換成牆'],
 ['mirror',/[╱╲]/g,'.','鏡子拿掉（改地板）'],
 ['mirror',/☼/g,'.','光源拿掉'],
 ['power',/[⊕⊛]/g,'#','發電機換成牆'],
 ['power',/[⊕⊛]/g,'.','發電機拿掉'],
 ['power',/B/g,'.','箱子拿掉（蓋斷線的區）'],
 ['power',/b/g,'.','炸彈草拿掉（王關）'],
 ['clock',/[ns]/g,'.','鐘擺拿掉'],
 ['clock',/[¤¢]/g,'#','齒輪門換成牆'],
];
for(const [name,re,to,desc] of tests){const M=parseMap(path.join(__dirname,'..','..','world',name+'.txt'));
 for(const z of M.zones){let has=false;const g=M.grid.map((r,y)=>y<z.r1||y>z.r2?r:[...r].map((c,x)=>{if(x<z.c1||x>z.c2)return c;re.lastIndex=0;if(re.test(c)){has=true;return to}return c}).join(''));
  if(!has)continue;
  if(desc.includes('箱子')&&!/[┊]/.test(M.grid.slice(z.r1,z.r2+1).map(r=>r.slice(z.c1,z.c2+1)).join('')))continue;
  if(desc.includes('炸彈')&&!/B$/.test(z.id))continue;
  const r=solveZone(g,z,{fire:true});console.log(`${name} ${z.id}：${desc} → ${r.solvable?'還是可解（'+r.min+' 步）':(r.error||'無解')}`)}}
