// Glowbot 小光 — small TEST world (2 maps). Legend = levels.js plus:
//  b bomb grass (pick up a bomb, infinite)   % cracked wall (only bombs break it)   J hard ice (slides even with claws)
//  k ice claws   U battery upgrade   W warp pad   R rune stone (decor)   1-9 tunnel mouths (each digit exactly twice in the world)
// Zones: 1-based inclusive rows/cols, max 7 wide x 8 high. Restart resets only that zone.
(function(root){
var WORLD={
 maps:{
  A:{name:'草原（測試）',theme:'grass',grid:[
   "################",
   "#S.....#.......#",
   "#..b...%.IIII..#",
   "#......#.I.....#",
   "#.R....#.IIIIc.#",
   "####C###########",
   "####.1##########",
   "################"],
   zones:[{id:'bomb',name:'炸開裂牆',r1:2,r2:5,c1:2,c2:8},{id:'pond',name:'冰池鑰匙',r1:2,r2:5,c1:9,c2:15}]},
  B:{name:'冰原入口（測試）',theme:'snow',grid:[
   "#########",
   "#1..R...#",
   "######..#",
   "#IIIIII.#",
   "###2#####",
   "#########",
   "#2.....*#",
   "#########"],
   zones:[{id:'slide',name:'冰窟入口',r1:2,r2:4,c1:2,c2:8}]}
 },
 hints:[{need:'c',text:'撿起炸彈草的炸彈（動作鍵），炸開東邊的裂牆，拿到青色鑰匙'},{visit:'B',text:'用青色鑰匙打開南邊的門，走進隧道 1'},{need:'k',text:'冰窟入口在冰道中間：要有冰爪才停得住（之後的地圖取得）'},{text:'測試地圖完成！'}],
 goal:null
};
if(typeof module!=='undefined')module.exports=WORLD;else root.WORLD_DEF=WORLD;
})(this);
