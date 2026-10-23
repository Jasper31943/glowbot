const {execFileSync}=require('child_process');const P=require('./plan.js');const fs=require('fs');const [,,id,seed]=process.argv;const a=P[id];
const keep=(a.keep||'')+Object.keys(a.need).join('')+'☼◎▤▣';
const o={base:a.base,pal:a.pal,need:a.need,keep,max:{B:3,x:2,z:2,w:2,'╱':4,'╲':4,n:3,s:3,'¤':2,'¢':2,'┊':3},iters:+process.env.IT||400,seed:+seed,cap:28,note:a.note||'',fire:!a.nofire};
const out=execFileSync('node',['climb.js',JSON.stringify(o)],{maxBuffer:1e8}).toString();fs.mkdirSync('out',{recursive:true});fs.writeFileSync(`out/${id}_${seed}.json`,out);console.log(id,seed,out.trim().slice(0,400));
