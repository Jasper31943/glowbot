# Lays out the 1x panels from tools/bomb-treant-preview.js into shots/t7/bomb_treant_design.png (Traditional Chinese labels)
# and writes 2x crops of every panel to shots/t7/crops/<name>_2x.png.
import sys,os
from PIL import Image,ImageDraw,ImageFont
D,OUT,CROPS=sys.argv[1],sys.argv[2],sys.argv[3]
FN='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';FB='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
f=ImageFont.truetype(FN,15);fs=ImageFont.truetype(FN,13);fh=ImageFont.truetype(FB,22);ft=ImageFont.truetype(FB,28)
P=lambda n:Image.open(os.path.join(D,n+'.png')).convert('RGB')
S=3;W=1500;BG=(24,20,37);FG=(234,212,170);HI=(254,231,97);MUTE=(139,155,180)
os.makedirs(CROPS,exist_ok=True)
for fn in os.listdir(D):
    if fn.endswith('.png'):
        q=Image.open(os.path.join(D,fn)).convert('RGB');q.resize((q.width*2,q.height*2),Image.NEAREST).save(os.path.join(CROPS,fn[:-4]+'_2x.png'))
im=Image.new('RGB',(W,6000),BG);d=ImageDraw.Draw(im)
y=[16]
def head(t,sub=None):
    y[0]+=10;d.text((24,y[0]),t,font=fh,fill=HI);y[0]+=34
    if sub:
        for l in sub.split('\n'):d.text((24,y[0]),l,font=fs,fill=MUTE);y[0]+=20
        y[0]+=6
def tw(t,fo):b=d.textbbox((0,0),t,font=fo);return b[2]-b[0]
def row(items,sc=S,gap=26,x0=24,one=True,gray=False):
    x=x0;h=0
    for n,lab in items:
        p=P(n)
        if gray:p=p.convert('L').convert('RGB')
        big=p.resize((p.width*sc,p.height*sc),Image.NEAREST);ls=lab.split('\n')
        cw=max(big.width,max(tw(l,f if i==0 else fs) for i,l in enumerate(ls)))
        if x+cw>W-20:y[0]+=h+14;x=x0;h=0
        bx=x+(cw-big.width)//2;im.paste(big,(bx,y[0]))
        if one:im.paste(p,(bx,y[0]+big.height+4))
        ly=y[0]+big.height+(p.height+10 if one else 8)
        for i,l in enumerate(ls):d.text((x,ly+i*19),l,font=f if i==0 else fs,fill=FG if i==0 else MUTE)
        x+=cw+gap;h=max(h,ly-y[0]+19*len(ls))
    y[0]+=h+14
d.text((24,y[0]),'設計稿 T7：炸彈範圍預告 ＋ 老樹精「打不到」狀態',font=ft,fill=(255,255,255));y[0]+=42
d.text((24,y[0]),'每格 16×16、Endesga 32。大圖 = 3 倍，大圖下方的小圖 = 1 倍實際大小。場景用森林王房的地板和樹牆；小光一律是畫面上最亮的東西。',font=fs,fill=MUTE);y[0]+=28
head('① 炸彈範圍：放下炸彈就出現，引信 3 秒','黃色淡淡填滿會被炸到的格子，外面一圈黃黑相間的虛線框（像警戒線），每條手臂裡有往外的小箭頭＝爆炸往這邊衝。\n前 2 秒完全不閃；最後 1 秒才開始一亮一暗，一秒切換 2 次（Math.floor(t*2)），對光敏感的玩家也安全。')
row([('br_fuse3','剛放下（剩 3 秒）\n淡黃、不閃'),('br_fuse15','剩 1.5 秒\n稍微明顯一點、不閃'),('br_last_on','最後 1 秒：亮的那一下\n框和箭頭變實、填色加深'),('br_last_off','最後 1 秒：暗的那一下\n回到淡淡的')])
head('② 範圍可以照實際情況畫','引擎把實際會炸到的格子傳進來（格子清單，或上下左右各幾格），虛線框就會沿著整個形狀外圍畫一圈。')
row([('br_blocked','左邊是牆（left:0）\n框跟著形狀走'),('br_long','比較長的十字（左右各 2 格）\n例：之後若有加強炸彈')])
head('③ 跟王的紅色預告放在一起','王的預告：每一格都是實心的紅色粗框＋圖示（這裡是樹精的樹根）。炸彈：黃色、整塊十字只有一圈虛線外框。\n顏色、框的粗細、框的畫法（每格一框 vs. 整塊一框）三點都不同。')
row([('br_old','目前上線的炸彈警告（對照）\n最後 1 秒才出現、紅色快閃\n→ 跟王的紅框太像，這次換掉'),('cmp_boss','王的預告（現有，紅）\n每格實心粗框＋樹根'),('br_last_on','炸彈範圍（新，黃）\n整塊十字一圈虛線'),('cmp_both','兩個同時出現\n左：樹根要冒出來；右：自己的炸彈')])
head('④ 老樹精：被打到後 2 步打不到','身上長出一片片樹皮護甲、整隻變暗、臉兩側關上樹皮板、眼睛瞇起來，右上角多一個樹皮盾牌。\n剩 1 步：護甲裂開、掉了一片（右上露出綠葉，掉的碎片在樹根旁）、盾牌裂開缺角、顏色比較不暗＝快恢復了。')
row([('tr_normal','平常\n可以打'),('tr_hit','被打中的瞬間（現有）\n白閃＝有受傷'),('tr_inv2','打不到：還剩 2 步\n完整樹皮護甲＋完整盾牌'),('tr_inv1','打不到：還剩 1 步\n護甲裂開、掉一片、盾牌裂開'),('tr_inv2_f1','打不到（擺動的另一格）\n護甲跟著樹冠一起擺')])
head('⑤ 打不到的時候硬打：「叮」一聲彈開','攻擊打在護甲上會冒出灰白色的金屬火花，再彈出兩片樹皮碎屑，共 0.35 秒。不會出現白閃，玩家一看就知道「這下沒打進去」。\n（這裡示範小光從左邊打。）')
row([('tr_defl0','彈開 第 1 格（0–0.1 秒）\n撞擊的星形火花'),('tr_defl1','彈開 第 2 格（0.1–0.22 秒）\n火花往四角散開'),('tr_defl2','彈開 第 3 格（0.22–0.35 秒）\n兩片樹皮碎屑往回飛')])
head('⑥ 色弱／灰階檢查','全部轉成灰階後：炸彈範圍的黑白虛線框＋箭頭依然很清楚；樹精靠「護甲片的黑色外框、瞇眼、盾牌完整或裂開」分得出平常／剩 2 步／剩 1 步。\n注意：王現有的紅框在灰階下跟森林地板差不多亮，幾乎看不見（之前就有的問題，不是這次新增的；之後可以幫紅框加一圈深色邊）。')
row([('br_last_on','炸彈範圍（最後 1 秒）'),('cmp_boss','王的預告'),('tr_normal','樹精：平常'),('tr_inv2','樹精：剩 2 步'),('tr_inv1','樹精：剩 1 步')],sc=2,one=False,gray=True)
im=im.crop((0,0,W,y[0]));im.save(OUT);print('wrote',OUT,im.size)
