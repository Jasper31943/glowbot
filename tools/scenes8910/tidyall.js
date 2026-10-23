// 對 spec.js 裡 climb 產生的區跑 tidy.js（只把多餘的機關格換成牆/地板；步數不變少、必要性不變）。node tidyall.js
const fs=require('fs'),{execFileSync}=require('child_process');const S=require('./spec.js');
const cfg={sea:{chars:'↑↓←→',need:z=>{const n={};const s=z.g.join('');if(/[↑↓←→]/.test(s)&&['A4','A5','A6','A7','A8'].includes(z.id))n['↑↓←→']='.';if(s.includes('i'))n.i='.';return n}},
 castle:{chars:'tu',need:z=>{const s=z.g.join('');const n={};if(s.includes('r')&&z.id!=='C1')n.r='#';return n}},
 sky:{chars:'⇑⇓⇐⇒',need:z=>{const s=z.g.join('');const n={};if(/[\[\]]/.test(s))n['[]']=',';if(z.id==='K2')n['⇑⇓⇐⇒']=',';return n}}};
let txt=fs.readFileSync('spec.js','utf8');const log=[];
for(const sc of S){const c=cfg[sc.file];if(!c)continue;for(const z of sc.zones){if(/B$/.test(z.id)&&z.id.length===2)continue;
 const o={rows:z.g,chars:c.chars,need:c.need(z),fire:true,note:z.note};
 const r=JSON.parse(execFileSync('node',['tidy.js',JSON.stringify(o)],{maxBuffer:1e8}).toString());
 const ch=r.rows.join('')!==z.g.join('');log.push(`${z.id} ${r.before}→${r.min} ${ch?'改了':'不變'}`);
 if(ch){const a=z.g.map(x=>`'${x}'`).join(','),b=r.rows.map(x=>`'${x}'`).join(',');txt=txt.replace(a,b)}}}
fs.writeFileSync('spec.js',txt);console.log(log.join('\n'));
