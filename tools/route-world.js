// prints solver routes (U/D/L/R/A/Z) for the browser test: node tools/route-world.js
const E=require('../world-engine.js'),W=E.parseWorld(require('../world/world-def.js'));W.solverAbstract=true;
const C={up:'U',down:'D',left:'L',right:'R',act:'A',reset:'Z'};
const p=E.bfsPath(W,null,s=>s.m==='ice',3000000);console.log(JSON.stringify({toIce:p.map(a=>C[a]).join('')}));
