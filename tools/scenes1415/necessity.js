process.env.LIMIT='600000';
const {parseMap,solveZone}=require('./check-1415.js');const path=require('path');
const tests=[
 ['factory',/[↑↓←→]/g,'.','輸送帶換成地板'],
 ['factory',/[pP]/g,'.','故障機器人拿掉'],
 ['factory',/[pP]/g,'#','故障機器人換成牆'],
 ['factory',/b/g,'.','炸彈草拿掉（王關）'],
 ['core',/[↑↓←→]/g,'.','輸送帶換成地板'],
 ['core',/[pP]/g,'.','故障機器人拿掉'],
 ['core',/[pP]/g,'#','故障機器人換成牆'],
 ['core',/b/g,'.','炸彈草拿掉（王關）'],
];
for(const [name,re,to,desc] of tests){const M=parseMap(path.join(__dirname,'..','..','world',name+'.txt'));
 for(const z of M.zones){let has=false;const g=M.grid.map((r,y)=>y<z.r1||y>z.r2?r:[...r].map((c,x)=>{if(x<z.c1||x>z.c2)return c;re.lastIndex=0;if(re.test(c)){has=true;return to}return c}).join(''));
  if(!has)continue;if(desc.includes('炸彈')&&!/B$/.test(z.id))continue;
  const r=solveZone(g,z,{fire:true});console.log(`${name} ${z.id}：${desc} → ${r.solvable?'還是可解（'+r.min+' 步）':(r.error||'無解')}`)}}
