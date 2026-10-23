// 打擊手感規格 — data only (format agreed with the engineer). Keys = boss kind strings the engine already uses
// (world-engine.js BATBOSS / world.js o.kind); `default` = anything else (creatures, unknown kinds).
// colors: 4 Endesga 32 hex (no #ffffff). size: particle sizes [w,h] px, pick one per particle. count / hitStopMs / shakePx are per hit type
// {bat, bomb, ko, fire} (bat/bomb/fire = world.js hitFx kinds; ko = boss defeated, event 'bossdown'). speed: [min,max] px/s (offscreen px, 16 px = 1 tile). shakePx ≤ 3. shakeMs = decay time. Physics/spark details: shots/t8/hitfx_spec.md
window.HIT_FX_SPEC = {
 tree:    {colors:['#b86f50','#733e39','#e4a672','#3e8948'],size:[[2,1],[1,1]],count:{bat:6,bomb:10,ko:16,fire:4},speed:[40,90], hitStopMs:{bat:75,bomb:110,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:2,fire:1},shakeMs:200},
 golem:   {colors:['#f77622','#feae34','#be4a2f','#3e2731'],size:[[1,1],[2,2]],count:{bat:6,bomb:12,ko:18,fire:4},speed:[50,110],hitStopMs:{bat:75,bomb:120,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:3,fire:1},shakeMs:200},
 mole:    {colors:['#b86f50','#733e39','#5a6988','#e4a672'],size:[[2,2],[1,1]],count:{bat:6,bomb:10,ko:16,fire:4},speed:[35,80], hitStopMs:{bat:75,bomb:110,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:2,fire:1},shakeMs:200},
 phantom: {colors:['#c0cbdc','#8b9bb4','#68386c','#0099db'],size:[[1,1],[2,1]],count:{bat:7,bomb:12,ko:18,fire:5},speed:[60,120],hitStopMs:{bat:75,bomb:110,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:2,fire:1},shakeMs:200},
 guard:   {colors:['#feae34','#d77643','#733e39','#8b9bb4'],size:[[2,2],[1,1]],count:{bat:5,bomb:9,ko:14,fire:3}, speed:[60,120],hitStopMs:{bat:75,bomb:120,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:2,fire:1},shakeMs:200},
 knight:  {colors:['#c0cbdc','#8b9bb4','#5a6988','#262b44'],size:[[2,1],[1,1]],count:{bat:5,bomb:9,ko:14,fire:3}, speed:[60,120],hitStopMs:{bat:75,bomb:110,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:2,fire:1},shakeMs:200},
 crab:    {colors:['#0099db','#124e89','#c0cbdc','#f6757a'],size:[[1,1],[2,2]],count:{bat:6,bomb:10,ko:16,fire:4},speed:[25,60], hitStopMs:{bat:75,bomb:110,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:2,fire:1},shakeMs:200},
 spark:   {colors:['#fee761','#feae34','#0099db','#3a4466'],size:[[1,1]],      count:{bat:6,bomb:10,ko:14,fire:4},speed:[70,140],hitStopMs:{bat:75,bomb:110,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:2,fire:1},shakeMs:200},
 worm:    {colors:['#e4a672','#d77643','#ead4aa','#b86f50'],size:[[1,1]],      count:{bat:8,bomb:12,ko:18,fire:6},speed:[30,70], hitStopMs:{bat:75,bomb:110,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:2,fire:1},shakeMs:200},
 frog:    {colors:['#733e39','#b86f50','#3e8948','#63c74d'],size:[[2,1],[1,1]],count:{bat:6,bomb:10,ko:16,fire:4},speed:[35,75], hitStopMs:{bat:75,bomb:110,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:2,fire:1},shakeMs:200},
 bird:    {colors:['#c0cbdc','#8b9bb4','#0099db','#262b44'],size:[[2,1],[1,1]],count:{bat:5,bomb:9,ko:14,fire:3}, speed:[30,70], hitStopMs:{bat:75,bomb:110,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:2,fire:1},shakeMs:200},
 glitch:  {colors:['#b55088','#68386c','#f6757a','#3a4466'],size:[[2,1],[1,2]],count:{bat:6,bomb:10,ko:16,fire:4},speed:[40,90], hitStopMs:{bat:75,bomb:110,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:2,fire:1},shakeMs:200},
 core:    {colors:['#b55088','#63c74d','#feae34','#f77622'],size:[[2,1],[1,2]],count:{bat:6,bomb:12,ko:20,fire:4},speed:[40,90], hitStopMs:{bat:75,bomb:120,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:3,fire:1},shakeMs:200},
 default: {colors:['#8b9bb4','#5a6988','#ead4aa','#3a4466'],size:[[1,1],[2,1]],count:{bat:5,bomb:8,ko:12,fire:3}, speed:[35,80], hitStopMs:{bat:75,bomb:110,ko:140,fire:60},shakePx:{bat:1,bomb:2,ko:2,fire:1},shakeMs:200}
};
