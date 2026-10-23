// 重新加難度：第 5–7 場景的短區。node runold.js S4 → out/S4.json（用 tools/scenes567/check-567.js 的規則）
const {execFileSync}=require('child_process');const S=require('../scenes567/spec.js');const fs=require('fs');const [,,id]=process.argv;
const need={S4:{p:'~'},S8:{p:'~'},M3:{'\\':'.'},M8:{b:'.'},M10:{'-':'.'},V3:{')':'h'},V5:{')':'h'}}[id]||{};
const sc=S.find(c=>c.zones.some(z=>z.id===id));const z=sc.zones.find(z=>z.id===id);
const pal={swamp:'.#~pl',mine:'.#:',volcano:'.#h'}[sc.file];
const o={base:z.g,pal,need,keep:Object.keys(need).join('')+'BbXDzZyw%-|/\\j)(}{',max:{B:3,b:2},iters:+process.env.IT||250,seed:11,cap:28,note:z.note,fire:sc.file!=='volcano'};
const out=execFileSync('node',['climb.js',JSON.stringify(o)],{env:{...process.env,CHK:'../scenes567/check-567.js'},maxBuffer:1e8}).toString();fs.writeFileSync(`out/${id}.json`,out);console.log(id,out.trim());
