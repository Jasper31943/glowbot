// node runclimb.js sea A3 → 對 plan.js 的某區跑 climb.js，結果寫到 out/ID.json
const {execFileSync}=require('child_process');const P=require('./plan.js');const fs=require('fs');const [,,sc,id,seed]=process.argv;
const a=P[sc].find(x=>x.id===id);const pal={sea:'.#←→↑↓',castle:'.#tu',sky:'.#,'}[sc];
const keep=(a.keep||'')+Object.keys(a.need||{}).join('');
const o={base:a.base,pal:a.pal?a.pal+pal.slice(2):pal,need:a.need||{},keep,max:Object.assign({B:3,b:2,i:2,z:2,g:2,'[':2,']':2},a.max||{}),iters:+process.env.IT||450,seed:+seed||7,cap:28,note:a.note};
const out=execFileSync('node',['climb.js',JSON.stringify(o)],{maxBuffer:1e8}).toString();fs.mkdirSync('out',{recursive:true});fs.writeFileSync(`out/${id}_${seed||7}.json`,out);console.log(id,out.trim().slice(0,300));
